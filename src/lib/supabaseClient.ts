import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isMock = !supabaseUrl || !supabaseAnonKey;

// In-memory Mock Database for Karya local development
const mockStorageKey = 'karya_mock_db';

interface MockDB {
  profiles: any[];
  workspaces: any[];
  workspace_settings: any[];
  clients: any[];
  projects: any[];
  project_briefs: any[];
  proposals: any[];
  contracts: any[];
  contract_signatures: any[];
  invoices: any[];
  invoice_items: any[];
  payments: any[];
  deliverables: any[];
  activity_logs: any[];
  notifications: any[];
  email_logs: any[];
  portal_verifications: any[];
  auth_user: any | null;
}

const getInitialDbState = (): MockDB => ({
  profiles: [],
  workspaces: [],
  workspace_settings: [],
  clients: [],
  projects: [],
  project_briefs: [],
  proposals: [],
  contracts: [],
  contract_signatures: [],
  invoices: [],
  invoice_items: [],
  payments: [],
  deliverables: [],
  activity_logs: [],
  notifications: [],
  email_logs: [],
  portal_verifications: [],
  auth_user: null,
});

const loadMockDb = (): MockDB => {
  try {
    const data = localStorage.getItem(mockStorageKey);
    if (data) {
      const parsed = JSON.parse(data);
      // Backfill workspaces array if it's missing in local storage DB
      if (!parsed.workspaces) parsed.workspaces = [];
      if (!parsed.contract_signatures) parsed.contract_signatures = [];
      if (!parsed.email_logs) parsed.email_logs = [];
      if (!parsed.activity_logs) parsed.activity_logs = [];
      if (!parsed.portal_verifications) parsed.portal_verifications = [];
      return parsed;
    }
  } catch (e) {
    console.error('Error loading mock DB from local storage', e);
  }
  return getInitialDbState();
};

const saveMockDb = (db: MockDB) => {
  try {
    localStorage.setItem(mockStorageKey, JSON.stringify(db));
  } catch (e) {
    console.error('Error saving mock DB to local storage', e);
  }
};

let mockDb = loadMockDb();

// Seed initial profile & workspace settings if mock user is logged in
export const seedMockUser = (email: string = 'freelancer@karya.in', name: string = 'Rohan Sharma', userId?: string) => {
  const finalUserId = userId || (email === 'freelancer@karya.in' ? 'mock-user-uuid-1234-5678' : crypto.randomUUID());
  mockDb.auth_user = {
    id: finalUserId,
    email,
    user_metadata: { full_name: name },
  };
  
  if (!mockDb.profiles) mockDb.profiles = [];
  if (!mockDb.profiles.find(p => p.id === finalUserId)) {
    mockDb.profiles.push({
      id: finalUserId,
      email,
      full_name: name,
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  const workspaceId = email === 'freelancer@karya.in' ? 'mock-workspace-uuid-1234' : crypto.randomUUID();
  if (!mockDb.workspaces) mockDb.workspaces = [];
  if (!mockDb.workspaces.find(w => w.profile_id === finalUserId)) {
    mockDb.workspaces.push({
      id: workspaceId,
      profile_id: finalUserId,
      name: `${name}'s Workspace`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  if (!mockDb.workspace_settings) mockDb.workspace_settings = [];
  if (!mockDb.workspace_settings.find(w => w.workspace_id === workspaceId || w.profile_id === finalUserId)) {
    mockDb.workspace_settings.push({
      id: crypto.randomUUID(),
      workspace_id: workspaceId,
      profile_id: finalUserId, // keep legacy profile_id key for safety
      company_name: email === 'freelancer@karya.in' ? 'Sharma Designs' : `${name} Workspace`,
      gstin: '27AAAAA1111A1Z1',
      bank_name: 'HDFC Bank',
      bank_account_no: '50100234567890',
      bank_ifsc: 'HDFC0000123',
      upi_id: 'rohan@okhdfcbank',
      address: '404, Bandra West, Mumbai, MH - 400050',
      phone: '9876543210',
      logo_url: '',
      updated_at: new Date().toISOString(),
    });
  }
  saveMockDb(mockDb);
};

// Auto-seed for local guest view if mock DB is empty
if (isMock && !mockDb.auth_user) {
  seedMockUser();
}

// Build a mock Supabase Client query emulator
class MockClientBuilder {
  private tableName: string;
  private filters: Array<(item: any) => boolean> = [];
  private matches: Record<string, any> = {};
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private operationValues: any = null;
  private isSingleResult: boolean = false;
  private isMaybeSingle: boolean = false;
  private rangeFrom: number = 0;
  private rangeTo: number = -1;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(_columns: string = '*') {
    this.operation = 'select';
    return this;
  }

  eq(column: string, value: any) {
    this.matches[column] = value;
    this.filters.push((item) => {
      // Handle nested joins or simple check
      if (column.includes('.')) {
        return true; // Simple mock ignore for nested check
      }
      return String(item[column]) === String(value);
    });
    return this;
  }

  ilike(column: string, value: string) {
    const cleanPattern = value.replace(/%/g, '').toLowerCase();
    this.filters.push((item) => {
      if (!item[column]) return false;
      return String(item[column]).toLowerCase().includes(cleanPattern);
    });
    return this;
  }

  is(column: string, value: any) {
    this.filters.push((item) => {
      if (value === null) {
        return item[column] === null || item[column] === undefined;
      }
      return item[column] === value;
    });
    return this;
  }

  or(filterString: string) {
    this.filters.push((item) => {
      const parts = filterString.split(',');
      return parts.some(part => {
        const subParts = part.split('.');
        if (subParts.length < 3) return false;
        const col = subParts[0];
        const op = subParts[1];
        const val = subParts.slice(2).join('.');
        
        if (!item[col]) return false;
        const itemVal = String(item[col]).toLowerCase();
        
        if (op === 'ilike') {
          const cleanPattern = val.replace(/%/g, '').toLowerCase();
          return itemVal.includes(cleanPattern);
        } else if (op === 'eq') {
          return itemVal === val.toLowerCase();
        }
        return false;
      });
    });
    return this;
  }

  order(_column: string, { ascending: _ascending = true } = {}) {
    return this;
  }

  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  limit(_num: number) {
    return this;
  }

  single() {
    this.isSingleResult = true;
    this.isMaybeSingle = false;
    return this;
  }

  maybeSingle() {
    this.isSingleResult = true;
    this.isMaybeSingle = true;
    return this;
  }

  insert(values: any | any[]) {
    this.operation = 'insert';
    this.operationValues = values;
    return this;
  }

  update(values: any) {
    this.operation = 'update';
    this.operationValues = values;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  private getData() {
    const tableData = mockDb[this.tableName as keyof MockDB] as any[] || [];
    let filtered = [...tableData];
    for (const filter of this.filters) {
      filtered = filtered.filter(filter);
    }
    return filtered;
  }

  async then(onfulfilled?: (value: any) => any) {
    let result: { data: any; error: any; count?: number } = { data: null, error: null };
    try {
      if (this.operation === 'select') {
        let data = this.getData();
        const count = data.length;
        if (this.rangeTo >= 0) {
          data = data.slice(this.rangeFrom, this.rangeTo + 1);
        }
        if (this.isSingleResult) {
          if (data.length === 0) {
            if (this.isMaybeSingle) {
              result = { data: null, error: null };
            } else {
              result = { data: null, error: { message: 'Row not found' } };
            }
          } else {
            result = { data: data[0], error: null };
          }
        } else {
          result = { data, error: null, count };
        }
      } else if (this.operation === 'insert') {
        const values = this.operationValues;
        const list = Array.isArray(values) ? values : [values];
        const tableData = mockDb[this.tableName as keyof MockDB] as any[] || [];
        
        const inserted: any[] = [];
        for (const val of list) {
          const row = {
            id: val.id || crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...val,
          };
          
          if (!row.profile_id && mockDb.auth_user) {
            row.profile_id = mockDb.auth_user.id;
          }

          // Validation guards
          if (this.tableName === 'payments' && row.transaction_reference) {
            const utrExists = tableData.some((p: any) => p.transaction_reference === row.transaction_reference);
            if (utrExists) {
              const err = { message: 'Duplicate transaction reference (UTR) already used' };
              result = { data: null, error: err };
              if (onfulfilled) return onfulfilled(result);
              return result;
            }
          }
          if (this.tableName === 'projects' && row.client_id) {
            const client = mockDb.clients.find((c: any) => c.id === row.client_id);
            if (client && client.workspace_id !== row.workspace_id) {
              const err = { message: 'Client does not belong to the same workspace as the project' };
              result = { data: null, error: err };
              if (onfulfilled) return onfulfilled(result);
              return result;
            }
          }
          if (this.tableName === 'payments' && row.invoice_id) {
            const invoice = mockDb.invoices.find((i: any) => i.id === row.invoice_id);
            if (invoice && invoice.workspace_id !== row.workspace_id) {
              const err = { message: 'Payment workspace must match invoice workspace' };
              result = { data: null, error: err };
              if (onfulfilled) return onfulfilled(result);
              return result;
            }
          }
          
          tableData.push(row);
          inserted.push(row);
        }
        
        mockDb[this.tableName as keyof MockDB] = tableData as any;
        saveMockDb(mockDb);
        
        // Log activity automatically
        if (this.tableName !== 'activity_logs' && this.tableName !== 'notifications') {
          const logTable = mockDb.activity_logs;
          logTable.push({
            id: crypto.randomUUID(),
            profile_id: mockDb.auth_user?.id || 'public',
            project_id: inserted[0].project_id || inserted[0].id,
            action: `Created ${this.tableName}`,
            details: inserted[0],
            created_at: new Date().toISOString(),
          });
          mockDb.activity_logs = logTable;
          saveMockDb(mockDb);
        }

        const returnedData = Array.isArray(values) ? inserted : inserted[0];
        if (this.isSingleResult) {
          result = { data: Array.isArray(returnedData) ? returnedData[0] : returnedData, error: null };
        } else {
          result = { data: returnedData, error: null };
        }
      } else if (this.operation === 'update') {
        const values = this.operationValues;
        const tableData = mockDb[this.tableName as keyof MockDB] as any[] || [];
        const matchedIndices: number[] = [];
        
        tableData.forEach((item, index) => {
          let isMatch = true;
          for (const [col, val] of Object.entries(this.matches)) {
            if (String(item[col]) !== String(val)) {
              isMatch = false;
            }
          }
          if (isMatch && this.filters.length > 0) {
            let passFilters = true;
            for (const filter of this.filters) {
              if (!filter(item)) passFilters = false;
            }
            if (passFilters) matchedIndices.push(index);
          } else if (isMatch) {
            matchedIndices.push(index);
          }
        });

        const updated: any[] = [];
        for (const index of matchedIndices) {
          const row = {
            ...tableData[index],
            ...values,
          };

          // Validation guards
          if (this.tableName === 'payments' && row.transaction_reference) {
            const utrExists = tableData.some((p: any, idx: number) => idx !== index && p.transaction_reference === row.transaction_reference);
            if (utrExists) {
              const err = { message: 'Duplicate transaction reference (UTR) already used' };
              result = { data: null, error: err };
              if (onfulfilled) return onfulfilled(result);
              return result;
            }
          }
          if (this.tableName === 'projects' && row.client_id) {
            const client = mockDb.clients.find((c: any) => c.id === row.client_id);
            if (client && client.workspace_id !== row.workspace_id) {
              const err = { message: 'Client does not belong to the same workspace as the project' };
              result = { data: null, error: err };
              if (onfulfilled) return onfulfilled(result);
              return result;
            }
          }
          if (this.tableName === 'payments' && row.invoice_id) {
            const invoice = mockDb.invoices.find((i: any) => i.id === row.invoice_id);
            if (invoice && invoice.workspace_id !== row.workspace_id) {
              const err = { message: 'Payment workspace must match invoice workspace' };
              result = { data: null, error: err };
              if (onfulfilled) return onfulfilled(result);
              return result;
            }
          }

          tableData[index] = {
            ...row,
            updated_at: new Date().toISOString(),
          };
          updated.push(tableData[index]);
          
          // Auto Log activity
          if (this.tableName !== 'activity_logs' && this.tableName !== 'notifications') {
            mockDb.activity_logs.push({
              id: crypto.randomUUID(),
              profile_id: mockDb.auth_user?.id || 'public',
              project_id: tableData[index].project_id || tableData[index].id,
              action: `Updated ${this.tableName}`,
              details: values,
              created_at: new Date().toISOString(),
            });
          }
        }

        mockDb[this.tableName as keyof MockDB] = tableData as any;
        saveMockDb(mockDb);

        if (this.isSingleResult) {
          result = { data: updated.length > 0 ? updated[0] : null, error: null };
        } else {
          result = { data: updated, error: null };
        }
      } else if (this.operation === 'delete') {
        const tableData = mockDb[this.tableName as keyof MockDB] as any[] || [];
        const beforeLength = tableData.length;
        
        const remaining = tableData.filter(item => {
          let isMatch = true;
          for (const [col, val] of Object.entries(this.matches)) {
            if (String(item[col]) !== String(val)) {
              isMatch = false;
            }
          }
          if (isMatch && this.filters.length > 0) {
            let passFilters = true;
            for (const filter of this.filters) {
              if (!filter(item)) passFilters = false;
            }
            return !passFilters;
          }
          return !isMatch;
        });

        mockDb[this.tableName as keyof MockDB] = remaining as any;
        saveMockDb(mockDb);

        result = { data: null, error: null, count: beforeLength - remaining.length };
      }
    } catch (e: any) {
      result = { data: null, error: { message: e.message || String(e) } };
    }
    return onfulfilled ? onfulfilled(result) : result;
  }
}

// Emulated Supabase Auth
const mockAuth = {
  signUp: async ({ email, password: _password, options }: any) => {
    const name = options?.data?.full_name || email.split('@')[0];
    seedMockUser(email, name);
    return { data: { user: mockDb.auth_user, session: {} }, error: null };
  },
  signInWithPassword: async ({ email, password: _password }: any) => {
    const existing = mockDb.profiles.find(p => p.email === email);
    const name = existing ? existing.full_name : email.split('@')[0];
    seedMockUser(email, name, existing?.id);
    return { data: { user: mockDb.auth_user, session: {} }, error: null };
  },
  signInWithOAuth: async ({ provider: _provider }: any) => {
    seedMockUser('google.user@gmail.com', 'Google User');
    return { data: { user: mockDb.auth_user, session: {} }, error: null };
  },
  signOut: async () => {
    mockDb.auth_user = null;
    saveMockDb(mockDb);
    return { error: null };
  },
  getUser: async () => {
    return { data: { user: mockDb.auth_user }, error: null };
  },
  getSession: async () => {
    return { data: { session: mockDb.auth_user ? { user: mockDb.auth_user } : null }, error: null };
  },
  resetPasswordForEmail: async (email: string, options: any) => {
    const mockToken = 'mock-recovery-token-xyz';
    const redirectUrl = `${options?.redirectTo || window.location.origin}/?type=recovery&access_token=${mockToken}`;
    console.log(`[Mock Auth] Reset password requested for ${email}. Redirect link: ${redirectUrl}`);
    return { data: { redirectUrl, token: mockToken }, error: null };
  },
  updateUser: async ({ password }: { password: string }) => {
    if (mockDb.auth_user) {
      mockDb.auth_user.password = password;
      saveMockDb(mockDb);
      return { data: { user: mockDb.auth_user }, error: null };
    }
    return { data: { user: null }, error: { message: 'Not authenticated' } };
  },
  onAuthStateChange: (callback: any) => {
    // Call immediately and return unsubscribe mock
    callback(mockDb.auth_user ? 'SIGNED_IN' : 'SIGNED_OUT', mockDb.auth_user ? { user: mockDb.auth_user } : null);
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
};

// Emulated Supabase Storage
const mockStorage = {
  from: (bucketName: string) => ({
    upload: async (path: string, _file: File) => {
      // Mock upload returns public URL
      const fileUrl = `https://karya-mock-storage.s3.ap-south-1.amazonaws.com/${bucketName}/${path}`;
      return { data: { path, publicUrl: fileUrl }, error: null };
    },
    getPublicUrl: (path: string) => {
      const fileUrl = `https://karya-mock-storage.s3.ap-south-1.amazonaws.com/${bucketName}/${path}`;
      return { data: { publicUrl: fileUrl } };
    }
  })
};

// Create real or mock Supabase client
const realClient = !isMock ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const supabase = !isMock ? realClient! : {
  auth: mockAuth,
  storage: mockStorage,
  from: (tableName: string) => new MockClientBuilder(tableName),
  rpc: async (fnName: string, args?: any) => {
    try {
      const token = args?.token_val || args?.token;
      if (!token) throw new Error('Token is required');

      // Helper to find project
      const proj = mockDb.projects.find(p => p.portal_token === token && !p.deleted_at);
      if (!proj) return { data: null, error: { message: 'Invalid portal token' } };

      switch (fnName) {
        case 'get_portal_project':
          return { data: [proj], error: null };

        case 'get_portal_client': {
          const client = mockDb.clients.find(c => c.id === proj.client_id && !c.deleted_at);
          return { data: client ? [client] : [], error: null };
        }

        case 'get_portal_settings': {
          const settings = mockDb.workspace_settings.find(s => s.workspace_id === proj.workspace_id);
          return { data: settings ? [settings] : [], error: null };
        }

        case 'get_portal_proposal': {
          const prop = mockDb.proposals.find(pr => pr.project_id === proj.id && !pr.deleted_at);
          return { data: prop ? [prop] : [], error: null };
        }

        case 'get_portal_contract': {
          const contr = mockDb.contracts.find(co => co.project_id === proj.id && !co.deleted_at);
          return { data: contr ? [contr] : [], error: null };
        }

        case 'get_portal_invoices': {
          const invs = mockDb.invoices.filter(i => i.project_id === proj.id && !i.deleted_at);
          return { data: invs, error: null };
        }

        case 'get_portal_deliverables': {
          const delivs = mockDb.deliverables.filter(d => d.project_id === proj.id && !d.deleted_at);
          return { data: delivs, error: null };
        }

        case 'generate_portal_verification': {
          const client = mockDb.clients.find(c => c.id === proj.client_id && !c.deleted_at);
          if (!client) return { data: null, error: { message: 'Client not found' } };

          const code = Math.floor(100000 + Math.random() * 900000).toString();
          
          if (!mockDb.portal_verifications) mockDb.portal_verifications = [];
          mockDb.portal_verifications.push({
            id: crypto.randomUUID(),
            project_id: proj.id,
            email: client.email,
            code,
            verified: false,
            expires_at: new Date(Date.now() + 15 * 60000).toISOString(),
            created_at: new Date().toISOString(),
          });

          // Simulate email sending by logging it in email_logs
          if (!mockDb.email_logs) mockDb.email_logs = [];
          mockDb.email_logs.push({
            id: crypto.randomUUID(),
            workspace_id: proj.workspace_id,
            project_id: proj.id,
            recipient: client.email,
            subject: 'Verify your identity for contract signing - OTP Code',
            body: `Your 6-digit verification code is: ${code}. It will expire in 15 minutes.`,
            status: 'sent',
            created_at: new Date().toISOString(),
          });

          saveMockDb(mockDb);
          return { data: client.email, error: null };
        }

        case 'verify_portal_code': {
          const codeInput = args?.input_code;
          const client = mockDb.clients.find(c => c.id === proj.client_id && !c.deleted_at);
          if (!client) return { data: false, error: { message: 'Client not found' } };

          const verifications = mockDb.portal_verifications || [];
          const record = verifications
            .filter(v => v.project_id === proj.id && v.email === client.email && v.code === codeInput && !v.verified && new Date(v.expires_at) > new Date())
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

          if (!record) {
            return { data: false, error: null };
          }

          record.verified = true;
          saveMockDb(mockDb);
          return { data: true, error: null };
        }

        case 'submit_portal_signature': {
          const sigName = args?.sig_name || args?.signature_name;
          const ipAddr = args?.ip_addr || args?.ip_address || '127.0.0.1';
          
          const client = mockDb.clients.find(c => c.id === proj.client_id && !c.deleted_at);
          const isVerified = (mockDb.portal_verifications || []).some(
            v => v.project_id === proj.id && v.email === client?.email && v.verified && new Date(v.expires_at + 15 * 60000) > new Date()
          );

          if (!isVerified) {
            return { data: null, error: { message: 'Client identity not verified. Request and verify OTP code first.' } };
          }

          const contract = mockDb.contracts.find(c => c.project_id === proj.id && !c.deleted_at);
          if (!contract) return { data: null, error: { message: 'Contract not found' } };

          // check or push signature
          if (!mockDb.contract_signatures) mockDb.contract_signatures = [];
          mockDb.contract_signatures.push({
            id: crypto.randomUUID(),
            workspace_id: proj.workspace_id,
            contract_id: contract.id,
            signature_name: sigName,
            ip_address: ipAddr,
            signature_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });

          // update contract
          contract.status = 'signed';
          contract.updated_at = new Date().toISOString();

          // update project
          proj.status = 'contract_signed';
          proj.updated_at = new Date().toISOString();

          // auto log activity
          mockDb.activity_logs.push({
            id: crypto.randomUUID(),
            profile_id: mockDb.auth_user?.id || 'public',
            project_id: proj.id,
            action: 'Contract Signed',
            details: { signatureName: sigName, ipAddress: ipAddr },
            created_at: new Date().toISOString(),
          });

          saveMockDb(mockDb);
          return { data: null, error: null };
        }

        case 'submit_portal_payment': {
          const invId = args?.invoice_id_val || args?.invoice_id;
          const amt = args?.amt || args?.amount;
          const payMethod = args?.pay_method || args?.payment_method || 'UPI';
          const txRef = args?.tx_ref || args?.transaction_reference;

          const invoice = mockDb.invoices.find(i => i.id === invId && i.project_id === proj.id && !i.deleted_at);
          if (!invoice) return { data: null, error: { message: 'Invoice not found' } };

          if (invoice.status === 'paid') {
            return { data: null, error: { message: 'Invoice is already paid' } };
          }
          if (invoice.status === 'cancelled') {
            return { data: null, error: { message: 'Invoice is cancelled' } };
          }

          // Check for duplicate UTR reference
          const payments = mockDb.payments || [];
          if (payments.some(p => p.transaction_reference === txRef)) {
            return { data: null, error: { message: 'Duplicate transaction reference (UTR) already used' } };
          }

          mockDb.payments.push({
            id: crypto.randomUUID(),
            workspace_id: proj.workspace_id,
            invoice_id: invId,
            amount: Number(amt),
            payment_method: payMethod,
            transaction_reference: txRef,
            status: 'pending',
            created_at: new Date().toISOString(),
            payment_date: new Date().toISOString(),
          });

          // Update invoice status to pending_verification (synced transactionally!)
          invoice.status = 'pending_verification';
          invoice.updated_at = new Date().toISOString();

          // auto log activity
          mockDb.activity_logs.push({
            id: crypto.randomUUID(),
            profile_id: mockDb.auth_user?.id || 'public',
            project_id: proj.id,
            action: 'Payment Submitted',
            details: { invoiceId: invId, amount: amt, UTR: txRef },
            created_at: new Date().toISOString(),
          });

          saveMockDb(mockDb);
          return { data: null, error: null };
        }

        case 'submit_portal_brief_feedback': {
          const feedback = args?.feedback_val || args?.feedback;
          const proposal = mockDb.proposals.find(p => p.project_id === proj.id && !p.deleted_at);
          if (!proposal) return { data: null, error: { message: 'Proposal not found' } };

          proposal.status = 'revision_requested';
          proposal.client_feedback = feedback;
          proposal.updated_at = new Date().toISOString();

          mockDb.activity_logs.push({
            id: crypto.randomUUID(),
            profile_id: mockDb.auth_user?.id || 'public',
            project_id: proj.id,
            action: 'Revision Requested',
            details: { feedback },
            created_at: new Date().toISOString(),
          });

          saveMockDb(mockDb);
          return { data: null, error: null };
        }

        case 'approve_portal_proposal': {
          const proposal = mockDb.proposals.find(p => p.project_id === proj.id && !p.deleted_at);
          if (!proposal) return { data: null, error: { message: 'Proposal not found' } };

          proposal.status = 'approved';
          proposal.updated_at = new Date().toISOString();
          proj.status = 'approved';
          proj.updated_at = new Date().toISOString();

          mockDb.activity_logs.push({
            id: crypto.randomUUID(),
            profile_id: mockDb.auth_user?.id || 'public',
            project_id: proj.id,
            action: 'Proposal Approved',
            details: {},
            created_at: new Date().toISOString(),
          });

          saveMockDb(mockDb);
          return { data: null, error: null };
        }

        default:
          return { data: null, error: { message: `Function ${fnName} not emulated in Mock DB` } };
      }
    } catch (e: any) {
      return { data: null, error: { message: e.message || String(e) } };
    }
  },
} as any;

export const resetMockDb = () => {
  mockDb = getInitialDbState();
  saveMockDb(mockDb);
  seedMockUser();
};
