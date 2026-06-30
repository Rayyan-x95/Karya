-- Migration 012: Security & RLS Recovery Refactor

-- 1. Drop existing public client portal RLS policies
DROP POLICY IF EXISTS "Portal access to client details" ON public.clients;
DROP POLICY IF EXISTS "Portal access to client info" ON public.clients;

DROP POLICY IF EXISTS "Portal access to projects" ON public.projects;

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

DROP POLICY IF EXISTS "Portal access to payments" ON public.payments;
DROP POLICY IF EXISTS "Portal submit payments" ON public.payments;

DROP POLICY IF EXISTS "Portal access to deliverables" ON public.deliverables;
DROP POLICY IF EXISTS "Portal update deliverables" ON public.deliverables;

DROP POLICY IF EXISTS "Portal access to activity logs" ON public.activity_logs;

-- 2. Storage Buckets policy fixes (Ensure workspace owner directories validation matches standard structure)
DROP POLICY IF EXISTS "Allow portal client read access to deliverables" ON storage.objects;
DROP POLICY IF EXISTS "Allow portal client read access to invoices" ON storage.objects;
DROP POLICY IF EXISTS "Allow workspace owner uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow workspace owner all access" ON storage.objects;

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

-- 3. Define SECURITY DEFINER RPC Functions for Secure Token-Based Portal Access

-- Get Project details by token
CREATE OR REPLACE FUNCTION public.get_portal_project(token_val text)
RETURNS SETOF public.projects
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT * FROM public.projects 
  WHERE portal_token = token_val 
    AND deleted_at IS NULL;
END;
$$;

-- Get Client details associated with project portal token
CREATE OR REPLACE FUNCTION public.get_portal_client(token_val text)
RETURNS SETOF public.clients
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT c.* FROM public.clients c
  JOIN public.projects p ON p.client_id = c.id
  WHERE p.portal_token = token_val 
    AND c.deleted_at IS NULL;
END;
$$;

-- Get Workspace Settings associated with project portal token
CREATE OR REPLACE FUNCTION public.get_portal_settings(token_val text)
RETURNS SETOF public.workspace_settings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT s.* FROM public.workspace_settings s
  JOIN public.projects p ON p.workspace_id = s.workspace_id
  WHERE p.portal_token = token_val;
END;
$$;

-- Get Proposal details by portal token
CREATE OR REPLACE FUNCTION public.get_portal_proposal(token_val text)
RETURNS SETOF public.proposals
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT prop.* FROM public.proposals prop
  JOIN public.projects p ON p.id = prop.project_id
  WHERE p.portal_token = token_val 
    AND prop.deleted_at IS NULL;
END;
$$;

-- Get Contract details by portal token
CREATE OR REPLACE FUNCTION public.get_portal_contract(token_val text)
RETURNS SETOF public.contracts
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT contr.* FROM public.contracts contr
  JOIN public.projects p ON p.id = contr.project_id
  WHERE p.portal_token = token_val 
    AND contr.deleted_at IS NULL;
END;
$$;

-- Get Invoices list by portal token
CREATE OR REPLACE FUNCTION public.get_portal_invoices(token_val text)
RETURNS SETOF public.invoices
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT i.* FROM public.invoices i
  JOIN public.projects p ON p.id = i.project_id
  WHERE p.portal_token = token_val 
    AND i.deleted_at IS NULL;
END;
$$;

-- Get Deliverables list by portal token
CREATE OR REPLACE FUNCTION public.get_portal_deliverables(token_val text)
RETURNS SETOF public.deliverables
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT d.* FROM public.deliverables d
  JOIN public.projects p ON p.id = d.project_id
  WHERE p.portal_token = token_val 
    AND d.deleted_at IS NULL;
END;
$$;

-- Submit digital contract signature from portal with enhanced security
CREATE OR REPLACE FUNCTION public.submit_portal_signature(token_val text, sig_name text, ip_addr text, email_verified boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id UUID;
  v_workspace_id UUID;
  v_contract_id UUID;
  v_client_email TEXT;
BEGIN
  -- Validate project token
  SELECT id, workspace_id INTO v_project_id, v_workspace_id 
  FROM public.projects 
  WHERE portal_token = token_val 
    AND deleted_at IS NULL;
   
  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Invalid portal token';
  END IF;

  -- Require email verification for legally binding signature
  IF NOT email_verified THEN
    RAISE EXCEPTION 'Email verification required for signature';
  END IF;

  -- Get contract ID and client email
  SELECT c.id, cl.email INTO v_contract_id, v_client_email
  FROM public.contracts c
  JOIN public.projects p ON p.id = c.project_id
  JOIN public.clients cl ON cl.id = p.client_id
  WHERE c.project_id = v_project_id 
    AND c.deleted_at IS NULL;
   
  IF v_contract_id IS NULL THEN
    RAISE EXCEPTION 'Contract not found for this project';
  END IF;

  -- Insert signature log with real IP address and verification timestamp
  INSERT INTO public.contract_signatures (id, workspace_id, contract_id, signature_name, ip_address, signature_date)
  VALUES (
    gen_random_uuid(), 
    v_workspace_id, 
    v_contract_id, 
    sig_name, 
    COALESCE(ip_addr, 'unknown'), -- Use provided IP or mark as unknown
    now()
  );

  -- Update contract status
  UPDATE public.contracts 
  SET status = 'signed', updated_at = now() 
  WHERE id = v_contract_id;

  -- Update project status
  UPDATE public.projects 
  SET status = 'contract_signed', updated_at = now() 
  WHERE id = v_project_id;
END;
$$;

-- Submit client payment notification
CREATE OR REPLACE FUNCTION public.submit_portal_payment(
  token_val text, 
  invoice_id_val UUID, 
  amt NUMERIC, 
  pay_method text, 
  tx_ref text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id UUID;
  v_workspace_id UUID;
  v_invoice_exists BOOLEAN;
BEGIN
  -- Validate project token
  SELECT id, workspace_id INTO v_project_id, v_workspace_id 
  FROM public.projects 
  WHERE portal_token = token_val 
    AND deleted_at IS NULL;
   
  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Invalid portal token';
  END IF;

  -- Verify invoice matches project
  SELECT EXISTS(
    SELECT 1 FROM public.invoices 
    WHERE id = invoice_id_val 
      AND project_id = v_project_id 
      AND deleted_at IS NULL
  ) INTO v_invoice_exists;
  
  IF NOT v_invoice_exists THEN
    RAISE EXCEPTION 'Invoice does not belong to the verified project';
  END IF;

  -- Record payment transaction
  INSERT INTO public.payments (id, workspace_id, invoice_id, amount, payment_method, transaction_reference, status, payment_date)
  VALUES (gen_random_uuid(), v_workspace_id, invoice_id_val, amt, pay_method, tx_ref, 'pending', now());
END;
$$;

-- Share proposal feedback / request revisions from portal
CREATE OR REPLACE FUNCTION public.submit_portal_brief_feedback(token_val text, feedback_val text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id UUID;
  v_proposal_id UUID;
BEGIN
  -- Validate project token
  SELECT id INTO v_project_id 
  FROM public.projects 
  WHERE portal_token = token_val 
    AND deleted_at IS NULL;
   
  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Invalid portal token';
  END IF;

  -- Get proposal ID
  SELECT id INTO v_proposal_id 
  FROM public.proposals 
  WHERE project_id = v_project_id 
    AND deleted_at IS NULL;
   
  IF v_proposal_id IS NULL THEN
    RAISE EXCEPTION 'Proposal not found';
  END IF;

  -- Update proposal status and feedback
  UPDATE public.proposals 
  SET status = 'revision_requested', 
      client_feedback = feedback_val, 
      updated_at = now()
  WHERE id = v_proposal_id;
END;
$$;

-- Approve proposal from portal
CREATE OR REPLACE FUNCTION public.approve_portal_proposal(token_val text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id UUID;
  v_proposal_id UUID;
BEGIN
  -- Validate project token
  SELECT id INTO v_project_id 
  FROM public.projects 
  WHERE portal_token = token_val 
    AND deleted_at IS NULL;
   
  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Invalid portal token';
  END IF;

  -- Get proposal ID
  SELECT id INTO v_proposal_id 
  FROM public.proposals 
  WHERE project_id = v_project_id 
    AND deleted_at IS NULL;
   
  IF v_proposal_id IS NULL THEN
    RAISE EXCEPTION 'Proposal not found';
  END IF;

  -- Update proposal and project status
  UPDATE public.proposals 
  SET status = 'approved', updated_at = now() 
  WHERE id = v_proposal_id;

  UPDATE public.projects 
  SET status = 'approved', updated_at = now() 
  WHERE id = v_project_id;
END;
$$;