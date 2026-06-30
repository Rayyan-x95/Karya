-- Migration 010: Activity & Email Auditing Logs
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT,
    resend_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Owner Policies
CREATE POLICY "Owner access to activity logs" ON public.activity_logs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.workspaces WHERE id = activity_logs.workspace_id AND profile_id = auth.uid()
    )
);

CREATE POLICY "Owner access to email logs" ON public.email_logs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.workspaces WHERE id = email_logs.workspace_id AND profile_id = auth.uid()
    )
);

-- Portal Client access to logs (if linked to project)
CREATE POLICY "Portal access to activity logs" ON public.activity_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.projects WHERE id = activity_logs.project_id AND portal_token IS NOT NULL
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace ON public.activity_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project ON public.activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_workspace ON public.email_logs(workspace_id);
