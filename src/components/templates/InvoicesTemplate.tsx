import React from 'react';
import Table, { ColumnDef } from '../ui/Table';
import { InvoiceStatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Metric } from '../ui/Card';
import { Section } from '../ui/Section';
import { PageHeader } from '../ui/PageHeader';
import { useInvoices } from '../../hooks/useInvoices';
import { Invoice } from '../../types';

interface InvoicesTemplateProps {
  workspaceId: string;
  profileId: string;
  onShowInvoiceDetail: (invoiceId: string) => void;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', message: string, desc?: string) => void;
}

export const InvoicesTemplate: React.FC<InvoicesTemplateProps> = ({
  workspaceId,
  profileId,
  onShowInvoiceDetail,
  addToast,
}) => {
  const { invoices, isLoading, payInvoice } = useInvoices(workspaceId, profileId);

  // Auto calculate GST breakdowns
  // For Indian freelancers: CGST (9%) + SGST (9%) or IGST (18%) depending on states.
  // In our simplified mock DB state, let's compute GST sum assuming a flat rate or calculated from total.
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalGst = invoices.reduce((sum, inv) => {
    const net = inv.total / 1.18;
    return sum + (inv.total - net);
  }, 0);
  const outstanding = invoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + (inv.total || 0), 0);

  const handleVerifyPayment = async (invoiceId: string) => {
    try {
      await payInvoice(invoiceId);
      addToast('success', 'Payment Verified Successfully', `Invoice updated to Paid.`);
    } catch (e: any) {
      addToast('error', 'Verification Failed', e.message);
    }
  };

  const columns: ColumnDef<Invoice>[] = [
    { key: 'invoice_number', header: 'Invoice #', sortable: true, render: row => <span className="font-mono text-xs text-primary font-semibold">{row.invoice_number}</span> },
    { key: 'status', header: 'Status', render: row => <InvoiceStatusBadge status={row.status} /> },
    { key: 'invoice_date', header: 'Date', render: row => <span>{new Date(row.invoice_date).toLocaleDateString('en-IN')}</span> },
    { key: 'due_date', header: 'Due Date', render: row => <span>{new Date(row.due_date).toLocaleDateString('en-IN')}</span> },
    {
      key: 'total', header: 'Total Invoiced', align: 'right', sortable: true,
      render: row => <span className="font-bold text-foreground">₹{row.total.toLocaleString('en-IN')}</span>
    },
    {
      key: 'actions', header: '', align: 'right',
      render: row => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onShowInvoiceDetail(row.id)}>
            Pay Link
          </Button>
          {row.status !== 'paid' && (
            <Button variant="primary" size="sm" onClick={() => handleVerifyPayment(row.id)}>
              Confirm Paid
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Invoices"
        description={isLoading ? 'Loading...' : `${invoices.length} invoice${invoices.length === 1 ? '' : 's'} in your workspace`}
      />

      <Section title="GST summary">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-6">
          <Metric label="Total invoiced" value={`₹${totalInvoiced.toLocaleString('en-IN')}`} hint="Net + GST" />
          <Metric label="GST collected" value={`₹${totalGst.toLocaleString('en-IN')}`} hint="CGST + SGST or IGST" />
          <Metric label="Outstanding" value={`₹${outstanding.toLocaleString('en-IN')}`} hint="Awaiting payment" />
        </div>
      </Section>

      <Table<Invoice>
        columns={columns}
        data={invoices}
        keyField="id"
        searchable
        searchPlaceholder="Search invoices..."
        emptyMessage="No invoices yet"
        emptySubMessage="Generate invoice bills from a project details workspace"
        loading={isLoading}
      />
    </div>
  );
};
