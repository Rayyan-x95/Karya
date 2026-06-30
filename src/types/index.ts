import { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Workspace = Database['public']['Tables']['workspaces']['Row'];
export type WorkspaceSettings = Database['public']['Tables']['workspace_settings']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type ProjectBrief = Database['public']['Tables']['project_briefs']['Row'];
export type Proposal = Database['public']['Tables']['proposals']['Row'];
export type ProposalSection = Database['public']['Tables']['proposal_sections']['Row'];
export type Contract = Database['public']['Tables']['contracts']['Row'];
export type ContractSignature = Database['public']['Tables']['contract_signatures']['Row'];
export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
export type Deliverable = Database['public']['Tables']['deliverables']['Row'];
export type FileUpload = Database['public']['Tables']['file_uploads']['Row'];
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
export type EmailLog = Database['public']['Tables']['email_logs']['Row'];

// Composite domain model aggregates
export interface ProjectWithClient extends Project {
  clients?: Client;
  project_briefs?: ProjectBrief | null;
  proposals?: Proposal | null;
  contracts?: Contract | null;
  invoices?: Invoice[];
}

export interface InvoiceWithItems extends Invoice {
  invoice_items?: InvoiceItem[];
  projects?: Project & { clients?: Client };
}

export interface ProposalWithSections extends Proposal {
  proposal_sections?: ProposalSection[];
  projects?: Project & { clients?: Client };
}

export interface ContractWithSignature extends Contract {
  contract_signatures?: ContractSignature | null;
  projects?: Project & { clients?: Client };
}

// Service Result Type for clean, error-safe programming
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Query options for repository pagination, searching, sorting, and filtering
export interface QueryOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filter?: Record<string, any>;
}

// Universal paginated result wrapper
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
