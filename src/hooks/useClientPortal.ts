import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PortalService } from '../services/PortalService';

export function useClientPortal(portalToken: string) {
  const queryClient = useQueryClient();

  const portalQuery = useQuery({
    queryKey: ['portalData', portalToken],
    queryFn: async () => {
      const res = await PortalService.getPortalData(portalToken);
      if (res.success === false) throw res.error;
      return res.data;
    },
    enabled: !!portalToken,
  });

  const signContractMutation = useMutation({
    mutationFn: async ({ signatureName, ipAddress, emailVerified }: { signatureName: string; ipAddress: string; emailVerified: boolean }) => {
      const res = await PortalService.signContract(portalToken, { signatureName, ipAddress, emailVerified });
      if (res.success === false) throw res.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portalData', portalToken] });
    },
  });

  const submitPaymentMutation = useMutation({
    mutationFn: async ({
      invoiceId,
      amount,
      method,
      reference,
    }: {
      invoiceId: string;
      amount: number;
      method: string;
      reference: string;
    }) => {
      const res = await PortalService.submitPayment(portalToken, {
        invoiceId,
        amount,
        paymentMethod: method,
        transactionReference: reference,
      });
      if (res.success === false) throw res.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portalData', portalToken] });
    },
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedback: string) => {
      const res = await PortalService.submitFeedback(portalToken, feedback);
      if (res.success === false) throw res.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portalData', portalToken] });
    },
  });

  const approveProposalMutation = useMutation({
    mutationFn: async () => {
      const res = await PortalService.approveProposal(portalToken);
      if (res.success === false) throw res.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portalData', portalToken] });
    },
  });

  const generateVerificationCode = async () => {
    const res = await PortalService.generateVerificationCode(portalToken);
    if (res.success === false) throw res.error;
    return res.data;
  };

  const verifyCode = async (code: string) => {
    const res = await PortalService.verifyCode(portalToken, code);
    if (res.success === false) throw res.error;
    return res.data;
  };

  return {
    portalData: portalQuery.data || null,
    isLoading: portalQuery.isLoading,
    error: portalQuery.error,
    signContract: signContractMutation.mutateAsync,
    submitPayment: submitPaymentMutation.mutateAsync,
    submitFeedback: submitFeedbackMutation.mutateAsync,
    approveProposal: approveProposalMutation.mutateAsync,
    generateVerificationCode,
    verifyCode,
  };
}

export default useClientPortal;
