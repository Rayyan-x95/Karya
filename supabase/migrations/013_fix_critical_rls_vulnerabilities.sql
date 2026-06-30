-- Migration 013: Critical RLS Security Fix - Remove Direct Portal Table Access
-- This migration addresses the critical vulnerability where portal_token IS NOT NULL
-- checks allow anonymous users to read all records with any portal token.

-- 1. Drop ALL vulnerable portal access policies (direct table access)
DROP POLICY IF EXISTS "Portal access to projects" ON public.projects;

DROP POLICY IF EXISTS "Portal access to client details" ON public.clients;

DROP POLICY IF EXISTS "Portal access to briefs" ON public.project_briefs;
DROP POLICY IF EXISTS "Portal update to briefs" ON public.project_briefs;

DROP POLICY IF EXISTS "Portal access to proposals" ON public.proposals;
DROP POLICY IF EXISTS "Portal approve proposals" ON public.proposals;
DROP POLICY IF EXISTS "Portal access to proposal sections" ON public.proposal_sections;

DROP POLICY IF EXISTS "Portal access to contracts" ON public.contracts;
DROP POLICY IF EXISTS "Portal update/sign contracts" ON public.contracts;
DROP POLICY IF EXISTS "Portal sign contract signatures" ON public.contract_signatures;

DROP POLICY IF EXISTS "Portal access to invoices" ON public.invoices;
DROP POLICY IF EXISTS "Portal access to invoice items" ON public.invoice_items;

DROP POLICY IF EXISTS "Portal access to activity logs" ON public.activity_logs;

-- 2. Fix Storage Policies - Remove vulnerable portal_token IS NOT NULL checks
DROP POLICY IF EXISTS "Allow portal client read access to deliverables" ON storage.objects;
DROP POLICY IF EXISTS "Allow portal client read access to invoices" ON storage.objects;

-- Replace with secure function-based storage access
-- Portal clients can only access files through the secure RPC functions
CREATE POLICY "Allow portal client read access to deliverables" ON storage.objects
FOR SELECT USING (
    bucket_id = 'deliverables' AND
    auth.uid() IS NULL AND
    -- Must be accessed through secure function, not direct table access
    false
);

CREATE POLICY "Allow portal client read access to invoices" ON storage.objects
FOR SELECT USING (
    bucket_id = 'invoices' AND
    auth.uid() IS NULL AND
    -- Must be accessed through secure function, not direct table access
    false
);

-- 3. Grant execute permissions on secure portal functions to authenticated users
-- These functions will be called from the application layer with proper token validation
GRANT EXECUTE ON FUNCTION public.get_portal_project(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_portal_client(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_portal_settings(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_portal_proposal(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_portal_contract(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_portal_invoices(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_portal_deliverables(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_portal_signature(text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_portal_payment(text, UUID, NUMERIC, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_portal_brief_feedback(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_portal_proposal(text) TO authenticated;

-- 4. Add comment documenting the security model
COMMENT ON TABLE public.projects IS 'Portal access MUST go through get_portal_project() function. Direct table access is blocked for security.';
COMMENT ON TABLE public.clients IS 'Portal access MUST go through get_portal_client() function. Direct table access is blocked for security.';
COMMENT ON TABLE public.proposals IS 'Portal access MUST go through get_portal_proposal() function. Direct table access is blocked for security.';
COMMENT ON TABLE public.contracts IS 'Portal access MUST go through get_portal_contract() function. Direct table access is blocked for security.';
COMMENT ON TABLE public.invoices IS 'Portal access MUST go through get_portal_invoices() function. Direct table access is blocked for security.';
COMMENT ON TABLE public.deliverables IS 'Portal access MUST go through get_portal_deliverables() function. Direct table access is blocked for security.';
