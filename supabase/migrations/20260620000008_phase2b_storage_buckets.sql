-- ============================================================
-- Phase 2b · Migration 8 (storage)
-- Create storage buckets + public read policies
-- ============================================================

-- library-pdfs: 50 MB cap, PDFs + cover images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'library-pdfs',
  'library-pdfs',
  true,
  52428800,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- question-images: 10 MB cap, raster + SVG question/solution figures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'question-images',
  'question-images',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Public read policies on storage.objects
-- ============================================================
-- Writes use service_role (RLS bypassed) — no INSERT/UPDATE/DELETE
-- policies needed. Students never directly write to either bucket.

CREATE POLICY "Public read library-pdfs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'library-pdfs');

CREATE POLICY "Public read question-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'question-images');
