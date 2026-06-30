-- Migration 015: Karya Production Stabilization & Database Hardening

-- 1. Update Invoice status check constraints to support the complete lifecycle
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check CHECK (
    status IN ('draft', 'sent', 'viewed', 'pending_verification', 'paid', 'overdue', 'cancelled')
);

-- 2. Add Unique UTR constraint to prevent duplicate payments
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_transaction_reference_key;
ALTER TABLE public.payments ADD CONSTRAINT payments_transaction_reference_key UNIQUE (transaction_reference);

-- 3. Project State Machine Validation Trigger
CREATE OR REPLACE FUNCTION public.validate_project_status_transition()
RETURNS trigger AS $$
BEGIN
  -- If status is not changing, allow it
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Allow new project initialization
  IF OLD.status IS NULL THEN
    RETURN NEW;
  END IF;

  -- Enforce valid transition paths. Allow archiving to 'archived' from any state.
  IF NEW.status = 'archived' THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'lead' AND NEW.status NOT IN ('proposal') THEN
    RAISE EXCEPTION 'Invalid transition from lead to %', NEW.status;
  ELSIF OLD.status = 'proposal' AND NEW.status NOT IN ('approved') THEN
    RAISE EXCEPTION 'Invalid transition from proposal to %', NEW.status;
  ELSIF OLD.status = 'approved' AND NEW.status NOT IN ('contract_signed') THEN
    RAISE EXCEPTION 'Invalid transition from approved to %', NEW.status;
  ELSIF OLD.status = 'contract_signed' AND NEW.status NOT IN ('advance_paid', 'in_progress') THEN
    RAISE EXCEPTION 'Invalid transition from contract_signed to %', NEW.status;
  ELSIF OLD.status = 'advance_paid' AND NEW.status NOT IN ('in_progress') THEN
    RAISE EXCEPTION 'Invalid transition from advance_paid to %', NEW.status;
  ELSIF OLD.status = 'in_progress' AND NEW.status NOT IN ('delivered') THEN
    RAISE EXCEPTION 'Invalid transition from in_progress to %', NEW.status;
  ELSIF OLD.status = 'delivered' AND NEW.status NOT IN ('invoice_sent') THEN
    RAISE EXCEPTION 'Invalid transition from delivered to %', NEW.status;
  ELSIF OLD.status = 'invoice_sent' AND NEW.status NOT IN ('paid') THEN
    RAISE EXCEPTION 'Invalid transition from invoice_sent to %', NEW.status;
  ELSIF OLD.status = 'archived' AND NEW.status NOT IN ('lead', 'in_progress', 'proposal') THEN
    RAISE EXCEPTION 'Invalid transition from archived to %', NEW.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_status_transition_trigger ON public.projects;
CREATE TRIGGER projects_status_transition_trigger
  BEFORE UPDATE OF status ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.validate_project_status_transition();

-- 4. Project Transition History Logging Trigger
CREATE OR REPLACE FUNCTION public.log_project_status_transition()
RETURNS trigger AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_logs (id, workspace_id, project_id, action, details)
    VALUES (
      gen_random_uuid(),
      NEW.workspace_id,
      NEW.id,
      'Project Status Updated',
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_status_log_trigger ON public.projects;
CREATE TRIGGER projects_status_log_trigger
  AFTER UPDATE OF status ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_project_status_transition();

-- 5. Invoice Content Immutability Trigger
CREATE OR REPLACE FUNCTION public.enforce_invoice_immutability()
RETURNS trigger AS $$
BEGIN
  IF OLD.status <> 'draft' THEN
    -- Prevent altering anything other than status, pdf_url, updated_at, deleted_at
    IF OLD.project_id <> NEW.project_id OR
       OLD.invoice_number <> NEW.invoice_number OR
       OLD.invoice_date <> NEW.invoice_date OR
       OLD.due_date <> NEW.due_date OR
       OLD.notes IS DISTINCT FROM NEW.notes OR
       OLD.gstin IS DISTINCT FROM NEW.gstin OR
       OLD.subtotal <> NEW.subtotal OR
       OLD.cgst <> NEW.cgst OR
       OLD.sgst <> NEW.sgst OR
       OLD.igst <> NEW.igst OR
       OLD.total <> NEW.total
    THEN
      RAISE EXCEPTION 'Sent/Paid invoices are immutable and cannot be updated';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoices_immutability_trigger ON public.invoices;
CREATE TRIGGER invoices_immutability_trigger
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.enforce_invoice_immutability();

-- 6. Invoice Line Items Immutability Trigger
CREATE OR REPLACE FUNCTION public.enforce_invoice_items_immutability()
RETURNS trigger AS $$
DECLARE
  v_status TEXT;
  v_invoice_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_invoice_id := OLD.invoice_id;
  ELSE
    v_invoice_id := NEW.invoice_id;
  END IF;

  SELECT status INTO v_status FROM public.invoices WHERE id = v_invoice_id;
  IF v_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Invoice line items are locked since invoice is not in draft state';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoice_items_immutability_trigger ON public.invoice_items;
CREATE TRIGGER invoice_items_immutability_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.enforce_invoice_items_immutability();

-- 7. Invoice Versions Table & Trigger (Archiving Revisions)
CREATE TABLE IF NOT EXISTS public.invoice_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    version INT NOT NULL,
    invoice_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.invoice_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access to invoice versions" ON public.invoice_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w WHERE w.id = invoice_versions.workspace_id AND w.profile_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.archive_invoice_revision()
RETURNS trigger AS $$
DECLARE
  v_version INT;
  v_items JSONB;
BEGIN
  IF OLD.status = 'draft' AND NEW.status = 'sent' THEN
    SELECT COALESCE(MAX(version), 0) + 1 INTO v_version 
    FROM public.invoice_versions 
    WHERE invoice_id = NEW.id;

    SELECT json_agg(t) INTO v_items 
    FROM (SELECT * FROM public.invoice_items WHERE invoice_id = NEW.id) t;

    INSERT INTO public.invoice_versions (invoice_id, workspace_id, version, invoice_data)
    VALUES (
      NEW.id,
      NEW.workspace_id,
      v_version,
      jsonb_build_object(
        'invoice_number', NEW.invoice_number,
        'invoice_date', NEW.invoice_date,
        'due_date', NEW.due_date,
        'notes', NEW.notes,
        'gstin', NEW.gstin,
        'subtotal', NEW.subtotal,
        'cgst', NEW.cgst,
        'sgst', NEW.sgst,
        'igst', NEW.igst,
        'total', NEW.total,
        'items', v_items
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoice_revision_archive_trigger ON public.invoices;
CREATE TRIGGER invoice_revision_archive_trigger
  AFTER UPDATE OF status ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.archive_invoice_revision();

-- 8. Client Identity Verification Infrastructure
CREATE TABLE IF NOT EXISTS public.portal_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.portal_verifications ENABLE ROW LEVEL SECURITY;
-- Verification records are internally queried via SECURITY DEFINER functions, no direct access.

-- Generate OTP verification code
CREATE OR REPLACE FUNCTION public.generate_portal_verification(token_val text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id UUID;
  v_client_email TEXT;
  v_workspace_id UUID;
  v_code TEXT;
BEGIN
  -- Validate portal token
  SELECT p.id, cl.email, p.workspace_id INTO v_project_id, v_client_email, v_workspace_id
  FROM public.projects p
  JOIN public.clients cl ON cl.id = p.client_id
  WHERE p.portal_token = token_val AND p.deleted_at IS NULL;

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Invalid portal token';
  END IF;

  -- Generate 6-digit random code
  v_code := floor(random() * 900000 + 100000)::text;

  -- Insert verification entry expiring in 15 minutes
  INSERT INTO public.portal_verifications (project_id, email, code, expires_at)
  VALUES (v_project_id, v_client_email, v_code, now() + interval '15 minutes');

  -- Simulate sending email by logging into email_logs table
  INSERT INTO public.email_logs (id, workspace_id, project_id, recipient, subject, body, status)
  VALUES (
    gen_random_uuid(),
    v_workspace_id,
    v_project_id,
    v_client_email,
    'Verify your identity for contract signing - OTP Code',
    'Your 6-digit verification code is: ' || v_code || '. It will expire in 15 minutes.',
    'sent'
  );

  RETURN v_client_email;
END;
$$;

-- Verify OTP code input
CREATE OR REPLACE FUNCTION public.verify_portal_code(token_val text, input_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id UUID;
  v_client_email TEXT;
  v_verify_id UUID;
BEGIN
  -- Validate portal token
  SELECT p.id, cl.email INTO v_project_id, v_client_email
  FROM public.projects p
  JOIN public.clients cl ON cl.id = p.client_id
  WHERE p.portal_token = token_val AND p.deleted_at IS NULL;

  IF v_project_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if a matching code exists and is valid
  SELECT id INTO v_verify_id
  FROM public.portal_verifications
  WHERE project_id = v_project_id
    AND email = v_client_email
    AND code = input_code
    AND verified = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_verify_id IS NULL THEN
    RETURN false;
  END IF;

  -- Set verified to true
  UPDATE public.portal_verifications
  SET verified = true
  WHERE id = v_verify_id;

  RETURN true;
END;
$$;

-- Refactor submit_portal_signature to enforce verification check
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
  v_is_verified BOOLEAN;
BEGIN
  -- Validate project token
  SELECT p.id, p.workspace_id, cl.email INTO v_project_id, v_workspace_id, v_client_email
  FROM public.projects p
  JOIN public.clients cl ON cl.id = p.client_id
  WHERE p.portal_token = token_val 
    AND p.deleted_at IS NULL;
   
  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Invalid portal token';
  END IF;

  -- Check if verified entry exists in the last 15 minutes
  SELECT EXISTS(
    SELECT 1 FROM public.portal_verifications
    WHERE project_id = v_project_id
      AND email = v_client_email
      AND verified = true
      AND expires_at + interval '15 minutes' > now()
  ) INTO v_is_verified;

  IF NOT v_is_verified THEN
    RAISE EXCEPTION 'Client identity not verified. Request and verify OTP code first.';
  END IF;

  -- Get contract ID
  SELECT c.id INTO v_contract_id
  FROM public.contracts c
  WHERE c.project_id = v_project_id 
    AND c.deleted_at IS NULL;
   
  IF v_contract_id IS NULL THEN
    RAISE EXCEPTION 'Contract not found for this project';
  END IF;

  -- Insert signature log
  INSERT INTO public.contract_signatures (id, workspace_id, contract_id, signature_name, ip_address, signature_date)
  VALUES (
    gen_random_uuid(), 
    v_workspace_id, 
    v_contract_id, 
    sig_name, 
    COALESCE(ip_addr, 'unknown'),
    now()
  );

  -- Update contract status
  UPDATE public.contracts 
  SET status = 'signed', updated_at = now() 
  WHERE id = v_contract_id;

  -- Update project status (allowed via state machine)
  UPDATE public.projects 
  SET status = 'contract_signed', updated_at = now() 
  WHERE id = v_project_id;
END;
$$;

-- Refactor submit_portal_payment to enforce state sync and duplicate checks
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
  v_invoice_status TEXT;
BEGIN
  -- Validate project token
  SELECT id, workspace_id INTO v_project_id, v_workspace_id 
  FROM public.projects 
  WHERE portal_token = token_val 
    AND deleted_at IS NULL;
   
  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Invalid portal token';
  END IF;

  -- Verify invoice details and status
  SELECT status, EXISTS(
    SELECT 1 FROM public.invoices 
    WHERE id = invoice_id_val 
      AND project_id = v_project_id 
      AND deleted_at IS NULL
  ) INTO v_invoice_status, v_invoice_exists
  FROM public.invoices
  WHERE id = invoice_id_val;
  
  IF NOT v_invoice_exists THEN
    RAISE EXCEPTION 'Invoice does not belong to the verified project';
  END IF;

  IF v_invoice_status = 'paid' THEN
    RAISE EXCEPTION 'Invoice is already paid';
  ELSIF v_invoice_status = 'cancelled' THEN
    RAISE EXCEPTION 'Invoice is cancelled';
  END IF;

  -- Verify UTR uniqueness specifically before insert (redundant safety with unique constraint)
  IF EXISTS(SELECT 1 FROM public.payments WHERE transaction_reference = tx_ref) THEN
    RAISE EXCEPTION 'Duplicate transaction reference (UTR) already used';
  END IF;

  -- Record payment transaction
  INSERT INTO public.payments (id, workspace_id, invoice_id, amount, payment_method, transaction_reference, status, payment_date)
  VALUES (gen_random_uuid(), v_workspace_id, invoice_id_val, amt, pay_method, tx_ref, 'pending', now());

  -- Update invoice status to pending_verification (synced transactionally!)
  UPDATE public.invoices
  SET status = 'pending_verification', updated_at = now()
  WHERE id = invoice_id_val;

  -- Log Activity
  INSERT INTO public.activity_logs (id, workspace_id, project_id, action, details)
  VALUES (
    gen_random_uuid(),
    v_workspace_id,
    v_project_id,
    'Payment Submitted',
    jsonb_build_object('invoice_id', invoice_id_val, 'amount', amt, 'transaction_reference', tx_ref)
  );
END;
$$;

-- Grant EXECUTE permissions on the new validation functions to anon and authenticated
GRANT EXECUTE ON FUNCTION public.generate_portal_verification(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_portal_code(text, text) TO anon, authenticated;
