-- Migration 003: Projects
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Owner policy
CREATE POLICY "Owner access to projects" ON public.projects FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.workspaces WHERE id = projects.workspace_id AND profile_id = auth.uid()
    )
);

-- Public client policy
CREATE POLICY "Portal access to projects" ON public.projects FOR SELECT USING (portal_token IS NOT NULL);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_portal_token ON public.projects(portal_token);
