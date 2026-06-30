-- Migration 014: Grant Portal RPC Access to Anon and Authenticated Roles
-- Secure portal RPC functions check token_val inside, so it is safe to allow anon execution.

GRANT EXECUTE ON FUNCTION public.get_portal_project(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_portal_client(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_portal_settings(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_portal_proposal(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_portal_contract(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_portal_invoices(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_portal_deliverables(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_portal_signature(text, text, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_portal_payment(text, UUID, NUMERIC, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_portal_brief_feedback(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_portal_proposal(text) TO anon, authenticated;
