-- Migration 009: Deliverables & File Uploads
CREATE TABLE public.deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    downloaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    bucket TEXT NOT NULL,
    size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- Owner Policies
CREATE POLICY "Owner access to deliverables" ON public.deliverables FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.workspaces WHERE id = deliverables.workspace_id AND profile_id = auth.uid()
    )
);

CREATE POLICY "Owner access to file uploads" ON public.file_uploads FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.workspaces WHERE id = file_uploads.workspace_id AND profile_id = auth.uid()
    )
);

-- Client Portal Policies
CREATE POLICY "Portal access to deliverables" ON public.deliverables FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = deliverables.project_id AND portal_token IS NOT NULL
    )
);

CREATE POLICY "Portal update deliverables" ON public.deliverables FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = deliverables.project_id AND portal_token IS NOT NULL
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deliverables_workspace ON public.deliverables(workspace_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_project ON public.deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_workspace ON public.file_uploads(workspace_id);
