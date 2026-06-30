import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge, ProjectStatusBadge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Input, Textarea } from '../ui/Input';
import { AlertBanner, Spinner } from '../ui/Feedback';
import { QRPreviewContainer } from '../ui/Containers';
import { useClientPortal } from '../../hooks/useClientPortal';
import { Invoice } from '../../types';

interface ClientPortalProps {
  portalToken: string;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', message: string, desc?: string) => void;
}

export const ClientPortalTemplate: React.FC<ClientPortalProps> = ({ portalToken, addToast }) => {
  const {
    portalData,
    isLoading,
    signContract: executeSignContract,
    submitPayment: executeSubmitPayment,
    submitFeedback: executeSubmitFeedback,
    approveProposal: executeApproveProposal,
    generateVerificationCode,
    verifyCode,
  } = useClientPortal(portalToken);

  const [activeTab, setActiveTab] = useState<'overview' | 'proposal' | 'contract' | 'invoices' | 'deliverables'>('overview');

  // Interactive states
  const [signatureName, setSignatureName] = useState('');
  const [signing, setSigning] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [utr, setUtr] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [feedback, setFeedback] = useState('');

  // OTP Verification States
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const project = portalData?.project || null;
  const settings = portalData?.settings || null;
  const proposal = portalData?.proposal || null;
  const contract = portalData?.contract || null;
  const invoices = portalData?.invoices || [];
  const deliverables = portalData?.deliverables || [];

  const handleRequestOtp = async () => {
    try {
      setSendingOtp(true);
      await generateVerificationCode();
      setOtpSent(true);
      addToast('success', 'OTP Code Sent', `Verification OTP logged/sent to client email.`);
    } catch (e: any) {
      addToast('error', 'Failed to send OTP code', e.message);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) return;
    try {
      setVerifyingOtp(true);
      const isVerified = await verifyCode(otpCode);
      if (isVerified) {
        setEmailVerified(true);
        addToast('success', 'Client Verified', 'Identity successfully verified. You can now sign the agreement.');
      } else {
        addToast('error', 'Verification Failed', 'Invalid or expired OTP code.');
      }
    } catch (e: any) {
      addToast('error', 'Verification Error', e.message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleApproveProposal = async () => {
    try {
      await executeApproveProposal();
      addToast('success', 'Proposal Approved', 'Thank you! The project scope and pricing has been approved.');
      setActiveTab('contract');
    } catch (e: any) {
      addToast('error', 'Error approving proposal', e.message);
    }
  };

  const handleSubmitProposalFeedback = async () => {
    if (!feedback.trim()) return;
    try {
      await executeSubmitFeedback(feedback);
      addToast('info', 'Revision Requested', 'Feedback shared with freelancer.');
      setFeedback('');
    } catch (e: any) {
      addToast('error', 'Failed to submit feedback', e.message);
    }
  };

  const handleSignContract = async () => {
    if (!signatureName.trim() || !emailVerified) return;
    try {
      setSigning(true);
      await executeSignContract({ signatureName, ipAddress: '127.0.0.1', emailVerified: true });
      addToast('success', 'Agreement Signed', 'You have digitally signed the project agreement.');
      setActiveTab('overview');
    } catch (e: any) {
      addToast('error', 'Failed to sign agreement', e.message);
    } finally {
      setSigning(false);
    }
  };

  const handleSubmitPaymentReceipt = async () => {
    if (!selectedInvoice || !utr.trim()) return;
    try {
      setSubmittingPayment(true);
      await executeSubmitPayment({
        invoiceId: selectedInvoice.id,
        amount: selectedInvoice.total,
        method: 'upi',
        reference: utr,
      });
      addToast('success', 'Receipt Submitted', 'Freelancer will verify your transaction reference.');
      setUtr('');
      setSelectedInvoice(null);
    } catch (e: any) {
      addToast('error', 'Error submitting receipt', e.message);
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-3 bg-background min-h-screen">
        <Spinner size="lg" />
        <span className="text-xs text-muted-foreground">Opening secure portal...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-3 bg-background min-h-screen">
        <Spinner size="lg" />
        <span className="text-xs text-muted-foreground">Opening secure portal...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-8">
        <Card className="p-8 text-center max-w-sm">
          <p className="text-sm text-destructive font-semibold">Security Token Invalid</p>
          <p className="text-xs text-muted-foreground mt-2">This link has expired or the token is incorrect. Contact the freelancer for a new secure portal link.</p>
        </Card>
      </div>
    );
  }

  // Branded UPI link generation: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR&tr=REF
  const upiUrl = selectedInvoice && settings?.upi_id
    ? `upi://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(settings.company_name || 'Freelancer')}&am=${selectedInvoice.total}&cu=INR&tr=${selectedInvoice.invoice_number}`
    : '';

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header className="space-y-3">
        <Badge variant="outline" size="sm">Secure client workspace</Badge>
        <h1 className="text-display text-foreground m-0">{project.name}</h1>
        <p className="text-body text-muted-foreground m-0">
          Provided by <span className="text-foreground font-medium">{settings?.company_name || 'Rohan Sharma'}</span>
        </p>
        <div className="pt-1">
          <ProjectStatusBadge status={project.status} />
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto pb-1" aria-label="Portal sections">
        {([
          { id: 'overview', label: 'Status' },
          { id: 'proposal', label: 'Proposal' },
          { id: 'contract', label: 'Contract' },
          { id: 'invoices', label: 'Invoices' },
          { id: 'deliverables', label: 'Deliverables' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-2 text-body rounded-md shrink-0 transition-colors ${
              activeTab === t.id
                ? 'bg-primary-muted text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Panels */}
      <div className="space-y-6">
        
        {/* Overview Panel */}
        {activeTab === 'overview' && (
          <Card className="p-6 space-y-6">
            <h2 className="text-sm font-semibold text-foreground m-0">Project Workflow</h2>
            
            <div className="space-y-4">
              {[
                { title: 'Project Brief Shared', desc: 'Requirements gathered', done: true },
                { title: 'Proposal Approved', desc: 'Scope, timeline, and pricing alignment', done: ['approved', 'contract_signed', 'advance_paid', 'in_progress', 'delivered', 'invoice_sent', 'paid'].includes(project.status) },
                { title: 'Contract Signed', desc: 'Legal service agreement execution', done: ['contract_signed', 'advance_paid', 'in_progress', 'delivered', 'invoice_sent', 'paid'].includes(project.status) },
                { title: 'Work Delivery', desc: 'Review uploaded project output assets', done: ['delivered', 'invoice_sent', 'paid'].includes(project.status) },
                { title: 'Invoice & Payment', desc: 'UPI transfer verification and closing', done: project.status === 'paid' },
              ].map((s, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${s.done ? 'border-success bg-success/20 text-success' : 'border-border text-muted-foreground'}`}>
                      {s.done ? '✓' : index + 1}
                    </div>
                    {index < 4 && <div className={`w-0.5 h-10 ${s.done ? 'bg-success' : 'bg-border'}`} />}
                  </div>
                  <div className="pt-0.5">
                    <p className={`text-xs font-semibold m-0 ${s.done ? 'text-foreground line-through opacity-70' : 'text-foreground'}`}>
                      {s.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground m-0 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Proposal Panel */}
        {activeTab === 'proposal' && (
          <Card className="p-6 space-y-6">
            <h2 className="text-sm font-semibold text-foreground m-0">Project Scope & Pricing</h2>
            
            {proposal ? (
              <div className="space-y-4">
                <div className="border border-border p-4 rounded-xl space-y-3 bg-secondary/10">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Estimated Cost</span>
                    <p className="text-xl font-bold text-foreground m-0">₹{proposal.pricing?.toLocaleString('en-IN') || 0}</p>
                  </div>
                  {proposal.scope && (
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">Scope of Work</span>
                      <p className="text-xs text-foreground mt-1 whitespace-pre-wrap m-0">{proposal.scope}</p>
                    </div>
                  )}
                  {proposal.timeline && (
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">Timeline</span>
                      <p className="text-xs text-foreground mt-1 m-0">{proposal.timeline}</p>
                    </div>
                  )}
                  {proposal.terms && (
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">Terms & Conditions</span>
                      <p className="text-xs text-foreground mt-1 whitespace-pre-wrap m-0">{proposal.terms}</p>
                    </div>
                  )}
                </div>

                {proposal.status === 'sent' && (
                  <div className="flex flex-col gap-3 border-t border-border pt-4">
                    <div className="flex gap-2">
                      <Button variant="primary" className="flex-1" onClick={handleApproveProposal}>Approve Proposal</Button>
                    </div>
                    <div className="space-y-2">
                      <Textarea
                        label="Request Revisions / Feedback"
                        placeholder="Let us know what changes you want..."
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                      />
                      <Button variant="outline" size="sm" onClick={handleSubmitProposalFeedback} disabled={!feedback.trim()}>
                        Send Revision Feedback
                      </Button>
                    </div>
                  </div>
                )}

                {proposal.status === 'approved' && (
                  <AlertBanner variant="success" title="Scope Approved" message="You have accepted this project outline. Proceed to the Contract tab to sign agreement." />
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic m-0">No proposal details drafted by the freelancer yet.</p>
            )}
          </Card>
        )}

        {/* Contract Panel */}
        {activeTab === 'contract' && (
          <Card className="p-6 space-y-6">
            <h2 className="text-sm font-semibold text-foreground m-0">Contract Agreement</h2>

            {contract ? (
              <div className="space-y-4">
                <div className="border border-border p-4 bg-secondary/10 rounded-xl max-h-[300px] overflow-y-auto">
                  <p className="text-xs font-mono whitespace-pre-wrap text-foreground m-0">{contract.content}</p>
                </div>

                {contract.status === 'sent' && (
                  <div className="border-t border-border pt-4 space-y-4">
                    <h3 className="text-xs font-semibold text-foreground m-0">Draw Digital Signature</h3>
                    
                    {!emailVerified ? (
                      <div className="space-y-4 p-4 border border-border bg-secondary/5 rounded-xl">
                        <p className="text-xs text-muted-foreground m-0">
                          To sign this contract, you must verify your identity.
                        </p>
                        {!otpSent ? (
                          <Button variant="outline" size="sm" onClick={handleRequestOtp} loading={sendingOtp}>
                            Request Verification OTP
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-[11px] text-muted-foreground m-0">
                              Enter the 6-digit OTP code sent to your email (simulated in Communication Logs):
                            </p>
                            <div className="flex gap-2 items-center">
                              <Input
                                placeholder="123456"
                                value={otpCode}
                                onChange={e => setOtpCode(e.target.value)}
                                className="w-32"
                              />
                              <Button variant="primary" size="sm" onClick={handleVerifyOtp} loading={verifyingOtp} disabled={otpCode.length < 6}>
                                Verify OTP
                              </Button>
                              <Button variant="ghost" size="sm" onClick={handleRequestOtp}>
                                Resend
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <AlertBanner variant="success" title="Identity Verified" message="Verification code validated successfully. You may now sign below." />
                    )}

                    <Input
                      label="Your Legal Name to Sign"
                      placeholder="Type your full legal name"
                      value={signatureName}
                      onChange={e => setSignatureName(e.target.value)}
                      disabled={!emailVerified}
                    />
                    <Button variant="primary" className="w-full" onClick={handleSignContract} loading={signing} disabled={!signatureName.trim() || !emailVerified}>
                      Digitally Sign & Approve Contract
                    </Button>
                  </div>
                )}

                {contract.status === 'signed' && (
                  <AlertBanner variant="success" title="Agreement Executed" message="Both parties signed this contract on our secure verification logs." />
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic m-0">No contract shared yet.</p>
            )}
          </Card>
        )}

        {/* Invoices Panel */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            
            {/* Invoice list */}
            <Card className="p-6 space-y-4">
              <h2 className="text-sm font-semibold text-foreground m-0">GST Invoices</h2>
              {invoices.length === 0 ? (
                <p className="text-xs text-muted-foreground italic m-0">No invoices issued for this project.</p>
              ) : (
                <div className="space-y-2">
                  {invoices.map(inv => (
                    <div
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className="flex justify-between items-center p-3 border border-border bg-secondary/10 hover:bg-secondary/30 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-mono text-primary font-semibold m-0">{inv.invoice_number}</p>
                        <p className="text-[10px] text-muted-foreground m-0">Due: {new Date(inv.due_date).toLocaleDateString('en-IN')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-foreground">₹{inv.total.toLocaleString('en-IN')}</span>
                        <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'destructive' : 'primary'}>
                          {inv.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Selected invoice payment modal/drawer emulator */}
            {selectedInvoice && (
              <Card className="p-6 space-y-6 border-primary bg-secondary/5">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-foreground m-0">Pay {selectedInvoice.invoice_number}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(null)}>Close X</Button>
                </div>

                <div className="space-y-3 border-b border-border pb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="text-foreground">₹{(selectedInvoice.total / 1.18).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">GST (18% split calculated)</span>
                    <span className="text-foreground">₹{(selectedInvoice.total - (selectedInvoice.total / 1.18)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-border pt-2">
                    <span className="text-foreground">Total Invoiced</span>
                    <span className="text-foreground">₹{selectedInvoice.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {selectedInvoice.status !== 'paid' && settings?.upi_id ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <QRPreviewContainer
                      value={upiUrl}
                      label="Dynamic UPI QR Code"
                      sublabel="Scan with GPay, PhonePe, BHIM, or Paytm"
                    />
                    <div className="space-y-4">
                      <div className="bg-secondary/40 border border-border p-3 rounded-xl">
                        <p className="text-[10px] text-muted-foreground uppercase m-0">UPI ID / VPA</p>
                        <p className="text-xs font-bold text-foreground m-0">{settings.upi_id}</p>
                      </div>
                      
                      <div className="space-y-3">
                        <Input
                          label="Enter UPI UTR / Transaction Reference Number"
                          placeholder="12-digit UTR receipt number"
                          value={utr}
                          onChange={e => setUtr(e.target.value)}
                        />
                        <Button variant="primary" className="w-full" onClick={handleSubmitPaymentReceipt} loading={submittingPayment} disabled={utr.length < 6}>
                          Confirm Payment Reference
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : selectedInvoice.status === 'paid' ? (
                  <AlertBanner variant="success" title="Invoice Paid" message="This invoice payment has been confirmed. Thank you!" />
                ) : (
                  <p className="text-xs text-muted-foreground italic m-0">UPI Configuration is missing for this freelancer.</p>
                )}
              </Card>
            )}

          </div>
        )}

        {/* Deliverables Panel */}
        {activeTab === 'deliverables' && (
          <Card className="p-6 space-y-6">
            <h2 className="text-sm font-semibold text-foreground m-0">Download Assets</h2>
            {deliverables.length === 0 ? (
              <p className="text-xs text-muted-foreground italic m-0">No project deliverables shared yet.</p>
            ) : (
              <div className="space-y-2">
                {deliverables.map(deliv => (
                  <div key={deliv.id} className="flex justify-between items-center p-3 border border-border bg-secondary/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📦</span>
                      <div>
                        <p className="text-xs font-medium text-foreground m-0">{deliv.name}</p>
                        <p className="text-[10px] text-muted-foreground m-0">{(deliv.file_size || 0) > 0 ? `${(deliv.file_size! / 1024).toFixed(1)} KB` : '—'}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addToast('info', 'Download Triggered', `${deliv.name} download initiated.`)}
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

      </div>
    </div>
  );
};
