-- ============================================================
-- Prepex · Phase 2 · Migration 6/5 (hotfix)
-- Revoke EXECUTE on internal trigger functions from API roles
-- ============================================================
-- The Supabase database linter (advisor 0028 + 0029) flags
-- SECURITY DEFINER functions that are callable via PostgREST RPC
-- (`/rest/v1/rpc/<name>`) by anon/authenticated. These four
-- functions are TRIGGER-ONLY helpers — they should never be
-- called as RPC endpoints. Triggers still fire because trigger
-- execution doesn't go through PostgREST role permissions.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.touch_last_active() from public, anon, authenticated;

-- rls_auto_enable() is a Supabase-shipped event trigger that
-- auto-enables RLS on any new table in `public`. Keep it active
-- (it's a safety net), but lock down its RPC surface.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
