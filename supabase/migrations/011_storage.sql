-- Migration 011: Supabase Storage Configuration & RLS Security

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']),
    ('contracts', 'contracts', false, 10485760, ARRAY['application/pdf']),
    ('proposals', 'proposals', false, 10485760, ARRAY['application/pdf']),
    ('invoices', 'invoices', false, 10485760, ARRAY['application/pdf']),
    ('deliverables', 'deliverables', false, 52428800, NULL), -- NULL allows any type for deliverables
    ('branding', 'branding', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- 2. Configure RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Owner Write Policy: Allow workspace owners to upload objects to subdirectories matching their workspace_id
CREATE POLICY "Allow workspace owner uploads" ON storage.objects 
FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    (storage.foldername(name))[0] IN (
        SELECT w.id::text FROM public.workspaces w WHERE w.profile_id = auth.uid()
    )
);

-- Owner Read/Write/Delete Policy
CREATE POLICY "Allow workspace owner all access" ON storage.objects 
FOR ALL USING (
    auth.role() = 'authenticated' AND 
    (storage.foldername(name))[0] IN (
        SELECT w.id::text FROM public.workspaces w WHERE w.profile_id = auth.uid()
    )
);

-- Portal Client read policy: Allow public read-only access to specific files via project portal token validation
CREATE POLICY "Allow portal client read access to deliverables" ON storage.objects
FOR SELECT USING (
    bucket_id = 'deliverables' AND
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.workspace_id::text = (storage.foldername(name))[0]
          AND p.id::text = (storage.foldername(name))[1]
          AND p.portal_token IS NOT NULL
    )
);

CREATE POLICY "Allow portal client read access to invoices" ON storage.objects
FOR SELECT USING (
    bucket_id = 'invoices' AND
    EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.workspace_id::text = (storage.foldername(name))[0]
          AND p.id::text = (storage.foldername(name))[1]
          AND p.portal_token IS NOT NULL
    )
);