export const PROJECT_STATUS = {
  LEAD: 'lead',
  PROPOSAL: 'proposal',
  APPROVED: 'approved',
  CONTRACT_SIGNED: 'contract_signed',
  ADVANCE_PAID: 'advance_paid',
  IN_PROGRESS: 'in_progress',
  DELIVERED: 'delivered',
  INVOICE_SENT: 'invoice_sent',
  PAID: 'paid',
  ARCHIVED: 'archived',
} as const;

export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

export const PROPOSAL_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVISION_REQUESTED: 'revision_requested',
} as const;

export type ProposalStatus = typeof PROPOSAL_STATUS[keyof typeof PROPOSAL_STATUS];

export const CONTRACT_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  SIGNED: 'signed',
} as const;

export type ContractStatus = typeof CONTRACT_STATUS[keyof typeof CONTRACT_STATUS];

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
} as const;

export type InvoiceStatus = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  CONTRACTS: 'contracts',
  PROPOSALS: 'proposals',
  INVOICES: 'invoices',
  DELIVERABLES: 'deliverables',
  BRANDING: 'branding',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

export const APP_ROUTES = {
  WORKSPACE: '/',
  PORTAL: '/portal/:token',
  PORTAL_PREFIX: '/portal',
} as const;
