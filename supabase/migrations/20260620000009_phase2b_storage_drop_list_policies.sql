-- ============================================================
-- Phase 2b · Migration 9 (hotfix)
-- Drop public-list SELECT policies on storage.objects
-- ============================================================
-- Supabase advisor 0025 flagged: public buckets serve files via their
-- public URL endpoint and DON'T need an explicit SELECT policy on
-- storage.objects. The policies from migration 8 were broader than
-- intended — they allow clients to LIST all files in the bucket, not
-- just fetch known URLs.
--
-- Dropping them preserves direct URL access (handled by bucket.public=true)
-- while stopping the listing exposure.

DROP POLICY IF EXISTS "Public read library-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Public read question-images" ON storage.objects;
