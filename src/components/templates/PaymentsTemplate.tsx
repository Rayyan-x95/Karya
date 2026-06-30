import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePayments } from '../../hooks/usePayments';
import { PageHeader } from '../ui/PageHeader';
import Table, { ColumnDef } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Feedback';
import { InvoiceService } from '../../services/InvoiceService';

interface PaymentsTemplateProps {
  workspaceId: string;
  profileId: string;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', message: string, desc?: string) => void;
}

export const PaymentsTemplate: React.FC<PaymentsTemplateProps> = ({
  workspaceId,
  profileId,
  addToast,
}) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');

  const { paymentsResult, isLoading } = usePayments(workspaceId, {
    page,
    search,
    filter: {
      status: statusFilter !== 'all' ? statusFilter : undefined,
    },
  });

  const data = paymentsResult
    ? {
        list: paymentsResult.data,
        total: paymentsResult.total,
        totalPages: paymentsResult.totalPages,
      }
    : null;

  const confirmPaymentMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await InvoiceService.markInvoicePaid(workspaceId, profileId, invoiceId);
      if (res.success === false) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices', workspaceId] });
      addToast('success', 'Payment Confirmed', 'The invoice has been transitioned to paid.');
    },
    onError: (err: any) => {
      addToast('error', 'Action Failed', err.message);
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      key: 'invoice',
      header: 'Invoice',
      render: row => (
        <div>
          <p className="text-xs font-mono text-primary font-semibold m-0">
            {row.invoices?.invoice_number || '—'}
          </p>
          <p className="text-[10px] text-muted-foreground m-0">
            Invoice Total: ₹{row.invoices?.total?.toLocaleString('en-IN') || '0'}
          </p>
        </div>
      ),
    },
    {
      key: 'reference',
      header: 'Transaction Reference (UTR)',
      render: row => (
        <span className="text-xs font-mono text-foreground font-medium">
          {row.transaction_reference || '—'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      render: row => (
        <span className="text-xs font-bold text-foreground">
          ₹{row.amount?.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Submitted Date',
      render: row => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.payment_date).toLocaleDateString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: row => (
        <Badge variant={row.status === 'completed' ? 'success' : row.status === 'failed' ? 'destructive' : 'warning'} dot size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: row => (
        row.status === 'pending' ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => confirmPaymentMutation.mutate(row.invoice_id)}
            loading={confirmPaymentMutation.isPending}
          >
            Verify & Confirm
          </Button>
        ) : (
          <span className="text-[10px] text-muted-foreground italic">No action needed</span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments Ledger"
        description="Audit client payment reference codes and confirm invoice reconciliations"
      />

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 p-1 bg-secondary/5 rounded-xl">
          {(['all', 'pending', 'completed', 'failed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setStatusFilter(tab); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${
                statusFilter === tab ? 'bg-primary-muted text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search UTR reference..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-24">
            <Spinner size="lg" />
          </div>
        ) : (
          <Table<any>
            columns={columns}
            data={data?.list || []}
            keyField="id"
            emptyMessage="No payment log entries"
            emptySubMessage="Payments submitted via client portals will appear here"
          />
        )}
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex justify-between items-center pt-4">
          <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            ← Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {data.totalPages}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>
            Next →
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaymentsTemplate;
