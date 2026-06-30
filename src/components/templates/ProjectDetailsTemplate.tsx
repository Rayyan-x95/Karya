import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Badge, ProjectStatusBadge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Input, Textarea, CurrencyInput } from '../ui/Input';
import { ProgressBar, Spinner } from '../ui/Feedback';
import { FileUploadZone } from '../ui/Containers';
import { Section } from '../ui/Section';
import { useProjectDetails } from '../../hooks/useProjectDetails';

interface ProjectDetailsProps {
  projectId: string;
  workspaceId: string;
  profileId: string;
  onBack: () => void;
  onShowInvoice: (invoiceId: string) => void;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', message: string, desc?: string) => void;
}

export const ProjectDetailsTemplate: React.FC<ProjectDetailsProps> = ({
  projectId,
  workspaceId,
  profileId,
  onBack,
  onShowInvoice,
  addToast,
}) => {
  const [activeTab, setActiveTab] = useState<'brief' | 'proposal' | 'contract' | 'deliverables' | 'invoices'>('brief');

  // Form states for proposal
  const [pricing, setPricing] = useState<string>('0');
  const [scope, setScope] = useState<string>('');
  const [timeline, setTimeline] = useState<string>('');
  const [terms, setTerms] = useState<string>('');

  // Form states for contract
  const [contractContent, setContractContent] = useState<string>('');

  // Form states for invoice generator
  const [showGenInvoice, setShowGenInvoice] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceNote, setInvoiceNote] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('0');

  const {
    project,
    deliverables,
    invoices,
    isLoading,
    saveProposal: mutateSaveProposal,
    saveContract: mutateSaveContract,
    uploadDeliverable: mutateUploadDeliverable,
    generateInvoice: mutateGenerateInvoice,
  } = useProjectDetails(workspaceId, projectId, profileId);

  const proposal = project?.proposals || null;
  const contract = project?.contracts || null;
  const client = project?.clients || null;
  const brief = project?.project_briefs || null;

  useEffect(() => {
    if (proposal) {
      setPricing(String(proposal.pricing || '0'));
      setScope(proposal.scope || '');
      setTimeline(proposal.timeline || '');
      setTerms(proposal.terms || '');
    }
  }, [proposal]);

  useEffect(() => {
    if (contract) {
      setContractContent(contract.content || '');
    } else if (project) {
      setContractContent(`PROJECT SERVICES AGREEMENT\n\nThis agreement is made between Rohan Sharma ("Freelancer") and Client. \n\n1. Services: Freelancer will perform design/dev tasks as specified in the scope.\n2. Payment: A total payment of ₹${project.budget || 0} shall be paid.\n3. Intellectual Property: Upon final payment, IP transfers to the Client.`);
    }
  }, [contract, project]);

  useEffect(() => {
    if (project) {
      setInvoiceNo(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setInvoiceAmount(String(project.budget || '0'));
    }
  }, [project]);

  const handleSaveProposal = async (status: 'draft' | 'sent' = 'draft') => {
    try {
      const budgetNum = parseFloat(pricing) || 0;
      await mutateSaveProposal({
        proposalId: proposal?.id,
        proposalData: {
          pricing: budgetNum,
          scope,
          timeline,
          terms,
        },
        status,
      });
      addToast('success', status === 'sent' ? 'Proposal Sent to Client' : 'Proposal Draft Saved');
    } catch (e: any) {
      addToast('error', 'Failed to save proposal', e.message);
    }
  };

  const handleSaveContract = async (status: 'draft' | 'sent' = 'draft') => {
    try {
      await mutateSaveContract({
        contractId: contract?.id,
        content: contractContent,
        status,
      });
      addToast('success', status === 'sent' ? 'Contract Shared with Client' : 'Contract Draft Saved');
    } catch (e: any) {
      addToast('error', 'Failed to save contract', e.message);
    }
  };

  const handleUploadDeliverable = async (file: File) => {
    try {
      await mutateUploadDeliverable(file);
      addToast('success', 'File Uploaded', `${file.name} added to deliverables.`);
    } catch (e: any) {
      addToast('error', 'Upload Failed', e.message);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      const rate = parseFloat(invoiceAmount) || 0;
      await mutateGenerateInvoice({
        invoiceNo,
        amount: rate,
        notes: invoiceNote,
      });
      addToast('success', 'Invoice Generated & Shared', `GST Split computed automatically.`);
      setShowGenInvoice(false);
    } catch (e: any) {
      addToast('error', 'Invoice Generation Failed', e.message);
    }
  };

  const copyPortalLink = () => {
    const link = `${window.location.origin}?portal=${project?.portal_token}`;
    navigator.clipboard.writeText(link);
    addToast('info', 'Client Link Copied', 'Share this secret URL with the client for passwordless access.');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-3">
        <Spinner size="lg" />
        <span className="text-xs text-muted-foreground">Loading workspace details...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-destructive font-medium">Project not found.</p>
        <Button variant="ghost" size="sm" onClick={onBack} className="mt-4">Back to Projects</Button>
      </Card>
    );
  }

  // Helper variables for workflow progress
  const getWorkflowProgress = () => {
    switch (project.status) {
      case 'proposal': return 20;
      case 'approved': return 40;
      case 'contract_signed': return 60;
      case 'advance_paid': return 70;
      case 'invoice_sent': return 85;
      case 'paid': return 100;
      default: return 10;
    }
  };

  const getWorkflowMessage = () => {
    switch (project.status) {
      case 'proposal': return 'Proposal sent to client. Awaiting brief approval.';
      case 'approved': return 'Proposal approved! Draft a contract to lock requirements.';
      case 'contract_signed': return 'Contract signed by client. Ready for delivery.';
      case 'invoice_sent': return 'GST invoice sent. Awaiting client payout notification.';
      case 'paid': return 'Project fully paid. Milestone complete!';
      default: return 'Draft a proposal to start client onboarding.';
    }
  };

  const getNextActionInfo = () => {
    if (!project) return null;
    switch (project.status) {
      case 'brief':
        return {
          title: 'Draft & Send Proposal',
          desc: 'Your client is waiting for a formal proposal outlining scope, pricing, and timelines.',
          btn: 'Draft Proposal',
          onClick: () => setActiveTab('proposal'),
        };
      case 'proposal':
        return {
          title: 'Setup & Finalize Contract',
          desc: 'The proposal is ready. Next, generate the project agreement so both parties can sign it.',
          btn: 'Create Contract',
          onClick: () => setActiveTab('contract'),
        };
      case 'contract_signed':
        return {
          title: 'Request Advance Payment',
          desc: 'The contract has been signed. Generate and send the first invoice to start work.',
          btn: 'Create Invoice',
          onClick: () => {
            setActiveTab('invoices');
            setShowGenInvoice(true);
          },
        };
      case 'in_progress':
        return {
          title: 'Upload Deliverables',
          desc: 'Project is active. Upload draft deliverables to show progress and request client sign-off.',
          btn: 'Upload Deliverables',
          onClick: () => setActiveTab('deliverables'),
        };
      case 'delivered':
        return {
          title: 'Send Final Invoice',
          desc: 'Deliverables are successfully submitted. Create your final invoice for payment clearance.',
          btn: 'Create Final Invoice',
          onClick: () => {
            setActiveTab('invoices');
            setShowGenInvoice(true);
          },
        };
      case 'invoice_sent':
        return {
          title: 'Awaiting Payment Clearance',
          desc: 'The invoice has been sent to the client portal. Wait for them to submit the payment.',
          btn: 'View Invoice Details',
          onClick: () => setActiveTab('invoices'),
        };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Project header */}
      <header className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 text-small text-muted-foreground">
              <Button variant="ghost" size="sm" onClick={onBack} className="p-0 h-auto hover:bg-transparent -ml-1">
                ← Projects
              </Button>
              <span>/</span>
              <span>{client?.name || 'Client'}</span>
            </div>
            <h1 className="text-display text-foreground m-0">{project.name}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ProjectStatusBadge status={project.status} />
            {project.portal_token && (
              <Button variant="outline" size="sm" onClick={copyPortalLink}>
                Share portal link
              </Button>
            )}
          </div>
        </div>

        <div className="bg-surface rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center text-body">
            <span className="font-medium text-foreground">{getWorkflowMessage()}</span>
            <span className="text-small text-muted-foreground font-mono tabular-nums">{getWorkflowProgress()}%</span>
          </div>
          <ProgressBar value={getWorkflowProgress()} showPercent={false} variant="success" />
        </div>

        {getNextActionInfo() && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-primary/20 bg-primary-muted/20 backdrop-blur-md">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Next Required Action</span>
              <h4 className="text-sm font-bold text-foreground m-0">{getNextActionInfo()?.title}</h4>
              <p className="text-xs text-muted-foreground m-0">{getNextActionInfo()?.desc}</p>
            </div>
            <Button variant="primary" size="sm" onClick={getNextActionInfo()?.onClick} className="shrink-0 shadow-lg shadow-primary/10">
              {getNextActionInfo()?.btn}
            </Button>
          </div>
        )}
      </header>

      {/* Workflow tabs */}
      <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Project workflow">
        {(['brief', 'proposal', 'contract', 'deliverables', 'invoices'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-body rounded-md transition-colors cursor-pointer capitalize whitespace-nowrap ${
              activeTab === tab
                ? 'bg-primary-muted text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Tab Panels */}
      <div className="min-h-[300px]">
        {activeTab === 'brief' && (
          <Section title="Project brief" description="Core parameters set during client discovery.">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 section-divider">
              <div>
                <span className="text-label">Budget</span>
                <p className="text-title text-foreground mt-1.5 m-0">₹{project.budget?.toLocaleString('en-IN') || 0}</p>
              </div>
              <div>
                <span className="text-label">Timeline</span>
                <p className="text-title text-foreground mt-1.5 m-0">
                  {project.timeline_end
                    ? new Date(project.timeline_end).toLocaleDateString('en-IN')
                    : 'Not specified'}
                </p>
              </div>
              <div>
                <span className="text-label">Client company</span>
                <p className="text-title text-foreground mt-1.5 m-0">{client?.company || 'None'}</p>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <span className="text-label">Scope & requirements</span>
              <p className="text-body text-foreground whitespace-pre-wrap m-0">
                {brief?.description || 'No description uploaded.'}
              </p>
            </div>
          </Section>
        )}

        {activeTab === 'proposal' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground m-0">Create Proposal</h3>
                  <p className="text-[11px] text-muted-foreground mt-1 m-0">Detail features, milestones, and professional pricing schema.</p>
                </div>
                <div className="space-y-4">
                  <CurrencyInput label="Proposal Pricing (INR) *" value={pricing} onChange={e => setPricing(e.target.value)} />
                  <Textarea label="Project Scope / Deliverables Outline" placeholder="Provide detailed deliverables list..." value={scope} onChange={e => setScope(e.target.value)} />
                  <Input label="Proposed Timeline" placeholder="3 Weeks / Delivery by July 15" value={timeline} onChange={e => setTimeline(e.target.value)} />
                  <Textarea label="Revisions & Client Feedback Policy" placeholder="Up to 2 cycles of revisions allowed..." value={terms} onChange={e => setTerms(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <Button variant="outline" size="sm" onClick={() => handleSaveProposal('draft')}>Save Draft</Button>
                  <Button variant="primary" size="sm" onClick={() => handleSaveProposal('sent')}>Share with Client</Button>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-6 space-y-4 bg-secondary/10">
                <h3 className="text-xs font-semibold text-foreground m-0">Proposal Status</h3>
                {proposal ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      <Badge variant={proposal.status === 'approved' ? 'success' : proposal.status === 'revision_requested' ? 'warning' : 'primary'}>
                        {proposal.status}
                      </Badge>
                    </div>
                    {proposal.client_feedback && (
                      <div className="bg-card border border-border p-3 rounded-lg space-y-1">
                        <span className="text-[10px] text-warning font-semibold">Client Revision Comments:</span>
                        <p className="text-xs text-foreground m-0">{proposal.client_feedback}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic m-0">No proposal drafted yet.</p>
                )}
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'contract' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground m-0">Sign-Off Contract Agreement</h3>
                  <p className="text-[11px] text-muted-foreground mt-1 m-0">Specify copyright transitions and payment terms.</p>
                </div>
                <Textarea label="Contract Terms" value={contractContent} onChange={e => setContractContent(e.target.value)} rows={12} className="font-mono text-xs" />
                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <Button variant="outline" size="sm" onClick={() => handleSaveContract('draft')}>Save Draft</Button>
                  <Button variant="primary" size="sm" onClick={() => handleSaveContract('sent')}>Publish & Send Link</Button>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-6 space-y-4 bg-secondary/10">
                <h3 className="text-xs font-semibold text-foreground m-0">Signature Tracker</h3>
                {contract ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      <Badge variant={contract.status === 'signed' ? 'success' : 'primary'}>{contract.status}</Badge>
                    </div>
                    {contract.status === 'signed' && (
                      <div className="p-2 border border-green-200/50 bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg text-[10px]">
                        ✓ Digitally signed by Client on portal.
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic m-0">No contract prepared yet.</p>
                )}
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'deliverables' && (
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground m-0">Upload Project Deliverables</h3>
                <p className="text-[11px] text-muted-foreground mt-1 m-0">Secure file upload. Access is mapped strictly via tokens.</p>
              </div>

              {/* Upload zone */}
              <FileUploadZone onFile={handleUploadDeliverable} label="Click or drop deliverables here to upload securely" />

              {/* Uploaded files list */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground mt-4 m-0">Uploaded Files ({deliverables.length})</h4>
                {deliverables.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic m-0">No deliverables uploaded yet.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {deliverables.map((f: any) => (
                      <div key={f.id} className="py-2.5 flex justify-between items-center text-xs">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate m-0">{f.name}</p>
                          <span className="text-[9px] text-muted-foreground">{(f.size_bytes / 1024 / 1024).toFixed(2)} MB • {f.mime_type}</span>
                        </div>
                        <Badge variant={f.status === 'approved' ? 'success' : 'primary'}>{f.status || 'uploaded'}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-foreground m-0">Invoices</h2>
                <p className="text-[11px] text-muted-foreground m-0 mt-0.5">Collect milestones with standard compliance splits.</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => setShowGenInvoice(true)}>
                Generate Invoice
              </Button>
            </div>

            {showGenInvoice && (
              <Card className="p-6 space-y-4 border border-primary/20">
                <h3 className="text-sm font-bold text-foreground m-0">Invoice Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Invoice Number" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
                  <CurrencyInput label="Milestone Base Value (INR)" value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)} />
                </div>
                <Textarea label="Invoice Notes / Payment Terms" placeholder="Add bank account specifics..." value={invoiceNote} onChange={e => setInvoiceNote(e.target.value)} />
                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <Button variant="ghost" size="sm" onClick={() => setShowGenInvoice(false)}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={handleGenerateInvoice}>Create & Compute splits</Button>
                </div>
              </Card>
            )}

            {invoices.length === 0 ? (
              <Card className="p-8 text-center italic text-xs text-muted-foreground">
                No invoices generated yet for this project.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {invoices.map(inv => (
                  <Card key={inv.id} className="p-5 flex flex-col justify-between hover:border-border/80 transition-colors">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-foreground m-0">{inv.invoice_number}</p>
                          <span className="text-[9px] text-muted-foreground">Issued: {inv.invoice_date}</span>
                        </div>
                        <Badge variant={inv.status === 'paid' ? 'success' : 'primary'}>{inv.status}</Badge>
                      </div>
                      <div className="border-t border-border/50 my-2 pt-2 flex justify-between items-baseline">
                        <span className="text-[10px] text-muted-foreground">Total Value:</span>
                        <span className="text-base font-bold text-foreground">₹{inv.total?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => onShowInvoice(inv.id)} className="w-full mt-3 text-xs">
                      View full Invoice details
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
