-- Migration 005: Proposals & Proposal Sections
CREATE TABLE public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.proposal_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_sections ENABLE ROW LEVEL SECURITY;

-- Owner Policies
CREATE POLICY "Owner access to proposals" ON public.proposals FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.workspaces WHERE id = proposals.workspace_id AND profile_id = auth.uid()
    )
);

CREATE POLICY "Owner access to proposal sections" ON public.proposal_sections FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.workspaces WHERE id = proposal_sections.workspace_id AND profile_id = auth.uid()
    )
);

-- Client Portal Policies
CREATE POLICY "Portal access to proposals" ON public.proposals FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = proposals.project_id AND portal_token IS NOT NULL
    )
);

CREATE POLICY "Portal approve proposals" ON public.proposals FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = proposals.project_id AND portal_token IS NOT NULL
    )
);

CREATE POLICY "Portal access to proposal sections" ON public.proposal_sections FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.proposals p
        JOIN public.projects proj ON proj.id = p.project_id
        WHERE p.id = proposal_sections.proposal_id AND proj.portal_token IS NOT NULL
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_proposals_workspace ON public.proposals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_proposals_project ON public.proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_proposal_sections_proposal ON public.proposal_sections(proposal_id);
