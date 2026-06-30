-- Migration 006: Contracts & Signatures
CREATE TABLE public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
    content TEXT,
    signed_copy_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.contract_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE UNIQUE NOT NULL,
    signature_name TEXT NOT NULL,
    signature_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;

-- Owner Policies
CREATE POLICY "Owner access to contracts" ON public.contracts FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.workspaces WHERE id = contracts.workspace_id AND profile_id = auth.uid()
    )
);

CREATE POLICY "Owner access to contract signatures" ON public.contract_signatures FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.workspaces WHERE id = contract_signatures.workspace_id AND profile_id = auth.uid()
    )
);

-- Client Portal Policies
CREATE POLICY "Portal access to contracts" ON public.contracts FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = contracts.project_id AND portal_token IS NOT NULL
    )
);

CREATE POLICY "Portal update/sign contracts" ON public.contracts FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = contracts.project_id AND portal_token IS NOT NULL
    )
);

CREATE POLICY "Portal sign contract signatures" ON public.contract_signatures FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.contracts c
        JOIN public.projects proj ON proj.id = c.project_id
        WHERE c.id = contract_signatures.contract_id AND proj.portal_token IS NOT NULL
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_workspace ON public.contracts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contracts_project ON public.contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_contract ON public.contract_signatures(contract_id);
