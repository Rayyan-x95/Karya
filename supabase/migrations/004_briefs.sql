-- Migration 004: Project Briefs
CREATE TABLE public.project_briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
    description TEXT,
    goals TEXT,
    deadline DATE,
    budget NUMERIC(12, 2),
    references TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.project_briefs ENABLE ROW LEVEL SECURITY;

-- Owner policy
CREATE POLICY "Owner access to briefs" ON public.project_briefs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.workspaces WHERE id = project_briefs.workspace_id AND profile_id = auth.uid()
    )
);

-- Portal access policy (allows select/update for clients possessing portal_token)
CREATE POLICY "Portal access to briefs" ON public.project_briefs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = project_briefs.project_id AND portal_token IS NOT NULL
    )
);

CREATE POLICY "Portal update to briefs" ON public.project_briefs FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = project_briefs.project_id AND portal_token IS NOT NULL
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_briefs_workspace ON public.project_briefs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_briefs_project ON public.project_briefs(project_id);
