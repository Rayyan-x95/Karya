-- Migration 016: Karya Database Hardening

-- 1. Enforce Client and Project Workspace Alignment
CREATE OR REPLACE FUNCTION public.check_project_workspace_alignment()
RETURNS trigger AS $$
DECLARE
  v_client_workspace_id UUID;
BEGIN
  SELECT workspace_id INTO v_client_workspace_id FROM public.clients WHERE id = NEW.client_id;
  IF v_client_workspace_id IS DISTINCT FROM NEW.workspace_id THEN
    RAISE EXCEPTION 'Client does not belong to the same workspace as the project';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_project_workspace_alignment ON public.projects;
CREATE TRIGGER enforce_project_workspace_alignment
  BEFORE INSERT OR UPDATE OF client_id, workspace_id ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.check_project_workspace_alignment();

-- 2. Enforce Invoice and Payment Workspace Alignment
CREATE OR REPLACE FUNCTION public.check_payment_workspace_alignment()
RETURNS trigger AS $$
DECLARE
  v_invoice_workspace_id UUID;
BEGIN
  SELECT workspace_id INTO v_invoice_workspace_id FROM public.invoices WHERE id = NEW.invoice_id;
  IF v_invoice_workspace_id IS DISTINCT FROM NEW.workspace_id THEN
    RAISE EXCEPTION 'Payment workspace must match invoice workspace';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_payment_workspace_alignment ON public.payments;
CREATE TRIGGER enforce_payment_workspace_alignment
  BEFORE INSERT OR UPDATE OF invoice_id, workspace_id ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.check_payment_workspace_alignment();

-- 3. Composite Index on payments for high-scale workspace querying
CREATE INDEX IF NOT EXISTS idx_payments_workspace_invoice ON public.payments(workspace_id, invoice_id);

-- 4. Constraint verifying payment amount is greater than zero
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_amount_positive;
ALTER TABLE public.payments ADD CONSTRAINT payments_amount_positive CHECK (amount > 0);
