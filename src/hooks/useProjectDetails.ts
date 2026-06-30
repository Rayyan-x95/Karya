import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectService } from '../services/ProjectService';
import { DeliverableRepository } from '../repositories/DeliverableRepository';
import { InvoiceRepository } from '../repositories/InvoiceRepository';

export function useProjectDetails(workspaceId: string, projectId: string, profileId: string) {
  const queryClient = useQueryClient();

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await ProjectService.getProjectDetails(workspaceId, projectId);
      if (res.success === false) throw res.error;
      return res.data;
    },
    enabled: !!workspaceId && !!projectId,
  });

  const deliverablesQuery = useQuery({
    queryKey: ['deliverables', projectId],
    queryFn: async () => {
      const data = await DeliverableRepository.getByProjectId(workspaceId, projectId);
      return data;
    },
    enabled: !!workspaceId && !!projectId,
  });

  const invoicesQuery = useQuery({
    queryKey: ['projectInvoices', projectId],
    queryFn: async () => {
      const data = await InvoiceRepository.getByProjectId(workspaceId, projectId);
      return data;
    },
    enabled: !!workspaceId && !!projectId,
  });

  const saveProposalMutation = useMutation({
    mutationFn: async ({ proposalId, proposalData, status }: { proposalId: string | undefined; proposalData: any; status: 'draft' | 'sent' }) => {
      const res = await ProjectService.saveProposal(workspaceId, profileId, projectId, proposalId, proposalData, status);
      if (res.success === false) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', workspaceId, profileId] });
    },
  });

  const saveContractMutation = useMutation({
    mutationFn: async ({ contractId, content, status }: { contractId: string | undefined; content: string; status: 'draft' | 'sent' }) => {
      const res = await ProjectService.saveContract(workspaceId, profileId, projectId, contractId, content, status);
      if (res.success === false) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', workspaceId, profileId] });
    },
  });

  const uploadDeliverableMutation = useMutation({
    mutationFn: async (file: File) => {
      const res = await ProjectService.uploadDeliverable(workspaceId, profileId, projectId, file);
      if (res.success === false) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliverables', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: async ({ invoiceNo, amount, notes }: { invoiceNo: string; amount: number; notes: string }) => {
      const res = await ProjectService.generateInvoice(workspaceId, profileId, projectId, invoiceNo, amount, notes);
      if (res.success === false) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectInvoices', projectId] });
      queryClient.invalidateQueries({ queryKey: ['invoices', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', workspaceId, profileId] });
    },
  });

  return {
    project: projectQuery.data || null,
    deliverables: deliverablesQuery.data || [],
    invoices: invoicesQuery.data || [],
    isLoading: projectQuery.isLoading || deliverablesQuery.isLoading || invoicesQuery.isLoading,
    error: projectQuery.error || deliverablesQuery.error || invoicesQuery.error,
    saveProposal: saveProposalMutation.mutateAsync,
    saveContract: saveContractMutation.mutateAsync,
    uploadDeliverable: uploadDeliverableMutation.mutateAsync,
    generateInvoice: generateInvoiceMutation.mutateAsync,
  };
}
export default useProjectDetails;
