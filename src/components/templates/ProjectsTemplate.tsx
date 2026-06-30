import React, { useState } from 'react';
import Table, { ColumnDef } from '../ui/Table';
import { ProjectStatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Containers';
import { ProgressBar } from '../ui/Feedback';
import { Dialog } from '../ui/Dialog';
import { Input, Select, CurrencyInput } from '../ui/Input';
import { PageHeader } from '../ui/PageHeader';
import { useProjects } from '../../hooks/useProjects';
import { useClients } from '../../hooks/useClients';
import { ProjectWithClient } from '../../types';

interface ProjectsTemplateProps {
  workspaceId: string;
  profileId: string;
  onSelectProject: (projectId: string) => void;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', message: string, desc?: string) => void;
}

export const ProjectsTemplate: React.FC<ProjectsTemplateProps> = ({
  workspaceId,
  profileId,
  onSelectProject,
  addToast,
}) => {
  const { projects, isLoading, addProject } = useProjects(workspaceId, profileId);
  const { clients } = useClients(workspaceId, profileId);
  
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [budget, setBudget] = useState('0');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientId) {
      addToast('warning', 'Validation Warning', 'Project Name and Client selection are required.');
      return;
    }

    try {
      setSubmitting(true);
      await addProject({
        name,
        client_id: clientId,
        budget: parseFloat(budget) || 0,
        timeline_start: startDate || null,
        timeline_end: endDate || null,
        notes: '',
        status: 'lead',
        deliverables: [],
      });
      addToast('success', 'Project Created', `${name} project added to pipeline.`);
      setShowAdd(false);
      
      // Reset
      setName('');
      setClientId('');
      setBudget('0');
      setStartDate('');
      setEndDate('');
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Creation Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnDef<ProjectWithClient>[] = [
    {
      key: 'name', header: 'Project', sortable: true,
      render: row => (
        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => onSelectProject(row.id)}>
          <div className="h-8 w-8 rounded-md bg-primary-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <svg className="h-3.5 w-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors m-0">{row.name}</p>
            <p className="text-[10px] text-muted-foreground m-0">
              {row.timeline_end ? `Due: ${new Date(row.timeline_end).toLocaleDateString('en-IN')}` : 'No deadline'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'client', header: 'Client',
      render: row => {
        // Find client name from raw linked client or display placeholder
        const clientName = row.clients?.name || 'Loading...';
        return (
          <div className="flex items-center gap-2">
            <Avatar name={clientName} size="sm" />
            <span className="text-xs text-muted-foreground">{clientName}</span>
          </div>
        );
      },
    },
    { key: 'status', header: 'Status', render: row => <ProjectStatusBadge status={row.status} /> },
    { key: 'budget', header: 'Budget', align: 'right', sortable: true, render: row => <span className="font-semibold text-foreground">₹{row.budget.toLocaleString('en-IN')}</span> },
    {
      key: 'progress', header: 'Status Bar',
      render: row => {
        const progressMap: Record<string, number> = {
          lead: 10,
          proposal: 25,
          approved: 40,
          contract_signed: 50,
          advance_paid: 60,
          in_progress: 75,
          delivered: 90,
          invoice_sent: 95,
          paid: 100,
          archived: 100,
        };
        const val = progressMap[row.status] || 0;
        return <ProgressBar value={val} showPercent variant={val === 100 ? 'success' : val >= 75 ? 'default' : 'warning'} />;
      },
    },
    {
      key: 'actions', header: '', align: 'right',
      render: row => (
        <Button variant="outline" size="sm" onClick={() => onSelectProject(row.id)}>
          Workspace →
        </Button>
      ),
    },
  ];

  const clientOptions = [
    { value: '', label: 'Select a client' },
    ...clients.map(c => ({ value: c.id, label: c.company ? `${c.name} (${c.company})` : c.name })),
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Projects"
        description={isLoading ? 'Loading...' : `${projects.length} active project${projects.length === 1 ? '' : 's'}`}
        actions={
          <Button variant="primary" size="md" onClick={() => setShowAdd(true)}
            icon={<svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>}
          >
            New project
          </Button>
        }
      />

      <Table<ProjectWithClient>
        columns={columns}
        data={projects}
        keyField="id"
        searchable
        searchPlaceholder="Search projects..."
        emptyMessage="No projects yet"
        emptySubMessage="Start by adding a client, then create a project for them"
        loading={isLoading}
      />

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="Create New Project" size="md">
        <form onSubmit={handleAddProject} className="space-y-4 pt-2">
          <Input label="Project Name *" placeholder="Brand Identity & Web Dev" value={name} onChange={e => setName(e.target.value)} required />
          
          <Select
            label="Client *"
            options={clientOptions}
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            required
          />

          <CurrencyInput label="Project Budget (INR) *" value={budget} onChange={e => setBudget(e.target.value)} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Timeline Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <Input label="Timeline End Date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowAdd(false)} type="button">Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Create Project</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
