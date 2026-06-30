import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InvoiceService } from '../services/InvoiceService';
import { InvoiceItem } from '../types';

export function useInvoices(workspaceId: string, profileId: string) {
  const queryClient = useQueryClient();

  const invoicesQuery = useQuery({
    queryKey: ['invoices', workspaceId],
    queryFn: async () => {
      const res = await InvoiceService.listInvoices(workspaceId);
      if (res.success === false) throw res.error;
      return res.data;
    },
    enabled: !!workspaceId,
  });

  const addInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: {
      project_id: string;
      invoice_number: string;
      invoice_date: string;
      due_date: string;
      notes?: string | null;
      gstin?: string | null;
      isInterstate: boolean;
      items: Omit<InvoiceItem, 'id' | 'workspace_id' | 'invoice_id' | 'amount'>[];
    }) => {
      const res = await InvoiceService.addInvoice(workspaceId, profileId, invoiceData);
      if (res.success === false) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
    },
  });

  const payInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await InvoiceService.markInvoicePaid(workspaceId, profileId, invoiceId);
      if (res.success === false) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
    },
  });

  return {
    invoices: invoicesQuery.data?.data || [],
    isLoading: invoicesQuery.isLoading,
    error: invoicesQuery.error,
    addInvoice: addInvoiceMutation.mutateAsync,
    payInvoice: payInvoiceMutation.mutateAsync,
  };
}
export default useInvoices;
