-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- WORKSPACE SETTINGS TABLE
CREATE TABLE public.workspace_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    company_name TEXT,
    gstin TEXT,
    bank_name TEXT,
    bank_account_no TEXT,
    bank_ifsc TEXT,
    upi_id TEXT,
    address TEXT,
    phone TEXT,
    logo_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CLIENTS TABLE
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    address TEXT,
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PROJECTS TABLE
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    budget NUMERIC(12, 2) DEFAULT 0.00,
    timeline_start DATE,
    timeline_end DATE,
    deliverables JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'proposal', 'approved', 'contract_signed', 'advance_paid', 'in_progress', 'delivered', 'invoice_sent', 'paid', 'archived')),
    portal_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PROJECT BRIEFS TABLE
CREATE TABLE public.project_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
    description TEXT,
    goals TEXT,
    deadline DATE,
    budget NUMERIC(12, 2),
    references TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PROPOSALS TABLE
CREATE TABLE public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
    introduction TEXT,
    scope TEXT,
    deliverables JSONB DEFAULT '[]'::jsonb,
    timeline TEXT,
    pricing NUMERIC(12, 2) DEFAULT 0.00,
    revision_policy TEXT,
    terms TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'revision_requested')),
    client_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CONTRACTS TABLE
CREATE TABLE public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
    content TEXT,
    signature_name TEXT,
    signature_date TIMESTAMP WITH TIME ZONE,
    signed_copy_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INVOICES TABLE
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    invoice_number TEXT NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    notes TEXT,
    gstin TEXT,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cgst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sgst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    igst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (profile_id, invoice_number)
);

-- INVOICE ITEMS TABLE
CREATE TABLE public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 1.00,
    rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    hsn_code TEXT,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

-- PAYMENTS TABLE
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'UPI',
    transaction_reference TEXT,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- DELIVERABLES TABLE
CREATE TABLE public.deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    downloaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE
);

-- ACTIVITY LOGS TABLE
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Setup profile sync trigger from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create initial workspace settings
  INSERT INTO public.workspace_settings (profile_id, company_name)
  VALUES (new.id, 'My Freelance Workspace');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --- RLS POLICIES ---

-- Profiles
CREATE POLICY "Allow users to view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Workspace Settings
CREATE POLICY "Allow users to view their own settings" ON public.workspace_settings FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Allow users to update their own settings" ON public.workspace_settings FOR UPDATE USING (auth.uid() = profile_id);

-- Clients
CREATE POLICY "Allow owner workspace access to clients" ON public.clients FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Allow portal access to client info" ON public.clients FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE client_id = clients.id AND portal_token IS NOT NULL
    )
);

-- Projects
CREATE POLICY "Allow owner workspace access to projects" ON public.projects FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Allow client portal access to projects" ON public.projects FOR SELECT USING (portal_token IS NOT NULL);

-- Project Briefs
CREATE POLICY "Allow owner workspace access to briefs" ON public.project_briefs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = project_briefs.project_id AND profile_id = auth.uid()
    )
);
CREATE POLICY "Allow client portal access to briefs" ON public.project_briefs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = project_briefs.project_id AND portal_token IS NOT NULL
    )
);
CREATE POLICY "Allow client portal submission to briefs" ON public.project_briefs FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = project_briefs.project_id AND portal_token IS NOT NULL
    )
);

-- Proposals
CREATE POLICY "Allow owner workspace access to proposals" ON public.proposals FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = proposals.project_id AND profile_id = auth.uid()
    )
);
CREATE POLICY "Allow client portal access to proposals" ON public.proposals FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = proposals.project_id AND portal_token IS NOT NULL
    )
);
CREATE POLICY "Allow client portal approval on proposals" ON public.proposals FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = proposals.project_id AND portal_token IS NOT NULL
    )
);

-- Contracts
CREATE POLICY "Allow owner workspace access to contracts" ON public.contracts FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = contracts.project_id AND profile_id = auth.uid()
    )
);
CREATE POLICY "Allow client portal access to contracts" ON public.contracts FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = contracts.project_id AND portal_token IS NOT NULL
    )
);
CREATE POLICY "Allow client portal signature on contracts" ON public.contracts FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = contracts.project_id AND portal_token IS NOT NULL
    )
);

-- Invoices
CREATE POLICY "Allow owner workspace access to invoices" ON public.invoices FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Allow client portal access to invoices" ON public.invoices FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = invoices.project_id AND portal_token IS NOT NULL
    )
);

-- Invoice Items
CREATE POLICY "Allow owner workspace access to invoice items" ON public.invoice_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.invoices WHERE id = invoice_items.invoice_id AND profile_id = auth.uid()
    )
);
CREATE POLICY "Allow client portal access to invoice items" ON public.invoice_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.invoices WHERE id = invoice_items.invoice_id AND EXISTS (
            SELECT 1 FROM public.projects WHERE id = invoices.project_id AND portal_token IS NOT NULL
        )
    )
);

-- Payments
CREATE POLICY "Allow owner workspace access to payments" ON public.payments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.invoices WHERE id = payments.invoice_id AND profile_id = auth.uid()
    )
);
CREATE POLICY "Allow client portal submission/access of payments" ON public.payments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.invoices WHERE id = payments.invoice_id AND EXISTS (
            SELECT 1 FROM public.projects WHERE id = invoices.project_id AND portal_token IS NOT NULL
        )
    )
);

-- Deliverables
CREATE POLICY "Allow owner workspace access to deliverables" ON public.deliverables FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = deliverables.project_id AND profile_id = auth.uid()
    )
);
CREATE POLICY "Allow client portal access to deliverables" ON public.deliverables FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = deliverables.project_id AND portal_token IS NOT NULL
    )
);
CREATE POLICY "Allow client portal update downloads on deliverables" ON public.deliverables FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = deliverables.project_id AND portal_token IS NOT NULL
    )
);

-- Notifications
CREATE POLICY "Allow owner workspace access to notifications" ON public.notifications FOR ALL USING (auth.uid() = profile_id);

-- Activity Logs
CREATE POLICY "Allow owner workspace access to activity logs" ON public.activity_logs FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Allow client portal access to activity logs" ON public.activity_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = activity_logs.project_id AND portal_token IS NOT NULL
    )
);

-- Setup indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_projects_profile ON public.projects(profile_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_portal_token ON public.projects(portal_token);
CREATE INDEX IF NOT EXISTS idx_clients_profile ON public.clients(profile_id);
CREATE INDEX IF NOT EXISTS idx_invoices_profile ON public.invoices(profile_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON public.invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_project ON public.proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_project ON public.contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_project ON public.deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
