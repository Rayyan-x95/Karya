-- Migration 008: Payments
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'UPI',
    transaction_reference TEXT,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Owner Policies
CREATE POLICY "Owner access to payments" ON public.payments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.workspaces WHERE id = payments.workspace_id AND profile_id = auth.uid()
    )
);

-- Portal Client Policies (Allows portal client to submit payments and select their own payment details)
CREATE POLICY "Portal access to payments" ON public.payments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.invoices inv
        JOIN public.projects proj ON proj.id = inv.project_id
        WHERE inv.id = payments.invoice_id AND proj.portal_token IS NOT NULL
    )
);

CREATE POLICY "Portal submit payments" ON public.payments FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.invoices inv
        JOIN public.projects proj ON proj.id = inv.project_id
        WHERE inv.id = payments.invoice_id AND proj.portal_token IS NOT NULL
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_workspace ON public.payments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
