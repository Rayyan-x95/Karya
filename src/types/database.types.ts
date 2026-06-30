export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      workspaces: {
        Row: {
          id: string;
          profile_id: string;
          name: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['workspaces']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['workspaces']['Row']>;
      };
      workspace_settings: {
        Row: {
          id: string;
          workspace_id: string;
          company_name: string | null;
          gstin: string | null;
          bank_name: string | null;
          bank_account_no: string | null;
          bank_ifsc: string | null;
          upi_id: string | null;
          address: string | null;
          phone: string | null;
          logo_url: string | null;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workspace_settings']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['workspace_settings']['Row']>;
      };
      clients: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          company: string | null;
          email: string;
          phone: string | null;
          whatsapp: string | null;
          address: string | null;
          notes: string | null;
          status: 'active' | 'archived';
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['clients']['Row']>;
      };
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          client_id: string;
          name: string;
          budget: number;
          timeline_start: string | null;
          timeline_end: string | null;
          deliverables: any;
          notes: string | null;
          status: string;
          portal_token: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'portal_token' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['projects']['Row']>;
      };
      project_briefs: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string;
          description: string | null;
          goals: string | null;
          deadline: string | null;
          budget: number | null;
          references: string | null;
          attachments: any;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['project_briefs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['project_briefs']['Row']>;
      };
      proposals: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string;
          introduction: string | null;
          scope: string | null;
          deliverables: any;
          timeline: string | null;
          pricing: number;
          revision_policy: string | null;
          terms: string | null;
          status: string;
          client_feedback: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['proposals']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['proposals']['Row']>;
      };
      proposal_sections: {
        Row: {
          id: string;
          workspace_id: string;
          proposal_id: string;
          title: string;
          content: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['proposal_sections']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['proposal_sections']['Row']>;
      };
      contracts: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string;
          content: string | null;
          signed_copy_url: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['contracts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['contracts']['Row']>;
      };
      contract_signatures: {
        Row: {
          id: string;
          workspace_id: string;
          contract_id: string;
          signature_name: string;
          signature_date: string;
          ip_address: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['contract_signatures']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['contract_signatures']['Row']>;
      };
      invoices: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string;
          invoice_number: string;
          invoice_date: string;
          due_date: string;
          notes: string | null;
          gstin: string | null;
          subtotal: number;
          cgst: number;
          sgst: number;
          igst: number;
          total: number;
          status: string;
          pdf_url: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['invoices']['Row']>;
      };
      invoice_items: {
        Row: {
          id: string;
          workspace_id: string;
          invoice_id: string;
          description: string;
          quantity: number;
          rate: number;
          gst_rate: number;
          hsn_code: string | null;
          amount: number;
        };
        Insert: Omit<Database['public']['Tables']['invoice_items']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['invoice_items']['Row']>;
      };
      payments: {
        Row: {
          id: string;
          workspace_id: string;
          invoice_id: string;
          amount: number;
          payment_method: string;
          transaction_reference: string | null;
          payment_date: string;
          status: string;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['payments']['Row']>;
      };
      deliverables: {
        Row: {
          id: string;
          workspace_id: string;
          project_id: string;
          name: string;
          file_url: string;
          file_type: string | null;
          file_size: number | null;
          uploaded_at: string;
          downloaded_at: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['deliverables']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['deliverables']['Row']>;
      };
      file_uploads: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          storage_path: string;
          bucket: string;
          size: number | null;
          mime_type: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['file_uploads']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['file_uploads']['Row']>;
      };
      activity_logs: {
        Row: {
          id: string;
          workspace_id: string;
          profile_id: string | null;
          project_id: string | null;
          action: string;
          details: any;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['activity_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['activity_logs']['Row']>;
      };
      email_logs: {
        Row: {
          id: string;
          workspace_id: string;
          profile_id: string;
          recipient: string;
          subject: string;
          body: string | null;
          resend_id: string | null;
          status: string;
          error_message: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['email_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['email_logs']['Row']>;
      };
    };
  };
}
