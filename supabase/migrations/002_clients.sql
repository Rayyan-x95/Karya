-- Migration 002: Clients
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    address TEXT,
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Owner policy
CREATE POLICY "Owner access to clients" ON public.clients FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.workspaces WHERE id = clients.workspace_id AND profile_id = auth.uid()
    )
);

-- Public portal client selection policy (allows client portal to fetch client details based on a project token)
CREATE POLICY "Portal access to client details" ON public.clients FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE client_id = clients.id AND portal_token IS NOT NULL
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_workspace ON public.clients(workspace_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
