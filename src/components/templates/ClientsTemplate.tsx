import React, { useState } from 'react';
import Table, { ColumnDef } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Containers';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Input, Textarea } from '../ui/Input';
import { PageHeader } from '../ui/PageHeader';
import { useClients } from '../../hooks/useClients';
import { Client } from '../../types';

interface ClientsTemplateProps {
  workspaceId: string;
  profileId: string;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', message: string, desc?: string) => void;
}

export const ClientsTemplate: React.FC<ClientsTemplateProps> = ({
  workspaceId,
  profileId,
  addToast,
}) => {
  const { clients, isLoading, addClient, removeClient } = useClients(workspaceId, profileId);
  const [showAdd, setShowAdd] = useState(false);

  // New Client Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      addToast('warning', 'Validation Warning', 'Name and Email are required.');
      return;
    }
    try {
      setSubmitting(true);
      await addClient({
        name,
        email,
        company: company || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        address: address || null,
        notes: notes || null,
        status: 'active',
      });
      addToast('success', 'Client Added Successfully', `${name} has been added.`);
      setShowAdd(false);
      
      // Reset fields
      setName('');
      setEmail('');
      setCompany('');
      setPhone('');
      setWhatsapp('');
      setAddress('');
      setNotes('');
    } catch (err: any) {
      console.error(err);
      addToast('error', 'Add Client Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (clientId: string) => {
    try {
      await removeClient(clientId);
      addToast('info', 'Client Archived', 'The client was archived.');
    } catch (err: any) {
      addToast('error', 'Archive Failed', err.message);
    }
  };

  const columns: ColumnDef<Client>[] = [
    {
      key: 'name', header: 'Client', sortable: true,
      render: row => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.name} size="sm" />
          <div>
            <p className="text-xs font-medium text-foreground m-0">{row.name}</p>
            <p className="text-[10px] text-muted-foreground m-0">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'company', header: 'Company', sortable: true, render: row => <span>{row.company || '—'}</span> },
    {
      key: 'phone', header: 'Contact',
      render: row => (
        <span className="text-muted-foreground text-xs">
          {row.phone || row.whatsapp || '—'}
        </span>
      ),
    },
    {
      key: 'status', header: 'Status', align: 'center',
      render: row => <Badge variant={row.status === 'active' ? 'success' : 'outline'} dot size="sm">{row.status}</Badge>,
    },
    {
      key: 'actions', header: 'Actions', align: 'right',
      render: row => (
        <Button variant="ghost" size="sm" onClick={() => handleArchive(row.id)}>
          Archive
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clients"
        description={isLoading ? 'Loading...' : `${clients.length} client${clients.length === 1 ? '' : 's'} in your workspace`}
        actions={
          <Button variant="primary" size="md" onClick={() => setShowAdd(true)}
            icon={<svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>}
          >
            Add client
          </Button>
        }
      />

      <Table<Client>
        columns={columns}
        data={clients}
        keyField="id"
        searchable
        searchPlaceholder="Search clients..."
        emptyMessage="No clients yet"
        emptySubMessage="Add your first client to get started"
        loading={isLoading}
      />

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title="Add New Client" size="md">
        <form onSubmit={handleAddClient} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name *" placeholder="Arjun Mehta" value={name} onChange={e => setName(e.target.value)} required />
            <Input label="Email Address *" type="email" placeholder="arjun@company.in" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input label="Company Name" placeholder="TechCorp India" value={company} onChange={e => setCompany(e.target.value)} />
            <Input label="Phone Number" placeholder="9876543210" value={phone} onChange={e => setPhone(e.target.value)} />
            <Input label="WhatsApp Number" placeholder="9876543210" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
            <Input label="Address" placeholder="Bandra West, Mumbai" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <Textarea label="Internal Client Notes" placeholder="Special requirements, billing preferences..." value={notes} onChange={e => setNotes(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowAdd(false)} type="button">Cancel</Button>
            <Button variant="primary" type="submit" loading={submitting}>Add Client</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
