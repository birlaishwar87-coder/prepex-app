-- ============================================================
-- Phase 2b · Migration 6/7
-- library_content + library_bookmarks
-- ============================================================
-- Global content (notes / formulas / keypoints / concept_map) — read-only
-- for authenticated users. Service_role seeds rows; files live in the
-- library-pdfs Storage bucket (created in migration 7-storage).

CREATE TABLE public.library_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  subject subject_t NOT NULL CHECK (subject IN ('physics', 'chemistry', 'maths')),
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE SET NULL,
  -- denormalized to allow filtering without a JOIN
  chapter text NOT NULL,
  type library_type_t NOT NULL,

  title text NOT NULL,

  -- Path inside the library-pdfs bucket (or absolute URL). One of file_url
  -- OR content_json must be set.
  file_url text,
  file_size_bytes bigint CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  page_count int CHECK (page_count IS NULL OR page_count > 0),

  -- For formulas / keypoints: structured records like
  --   [{ latex, description, tags, examples }, ...]
  -- so we can render with KaTeX without parsing a PDF.
  content_json jsonb,

  thumbnail_url text,
  author text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),

  CHECK (file_url IS NOT NULL OR content_json IS NOT NULL)
);

CREATE INDEX idx_library_subject_chapter_type
  ON public.library_content (subject, chapter_id, type);
CREATE INDEX idx_library_chapter_id ON public.library_content (chapter_id);
CREATE INDEX idx_library_type ON public.library_content (type);


-- ── Bookmarks (per-user) ──────────────────────────────────────
CREATE TABLE public.library_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.library_content(id) ON DELETE CASCADE,
  bookmarked_at timestamptz DEFAULT now(),
  UNIQUE (user_id, content_id)
);

CREATE INDEX idx_bookmarks_user
  ON public.library_bookmarks (user_id, bookmarked_at DESC);
CREATE INDEX idx_bookmarks_content ON public.library_bookmarks (content_id);
