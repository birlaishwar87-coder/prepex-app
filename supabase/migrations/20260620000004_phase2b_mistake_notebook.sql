-- ============================================================
-- Phase 2b · Migration 4/7
-- mistake_notebook_entries (PRD §5.6.2)
-- ============================================================
-- Auto-populated by app code (not DB trigger) on wrong question_attempts
-- and on revision difficulty='hard' (per PRD §5.6.1 rule 3, after 2+
-- Hard ratings — wired in Phase 2.7).

CREATE TABLE public.mistake_notebook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- ── Origin ──────────────────────────────────────────────────
  source notebook_source_t NOT NULL DEFAULT 'practice',
  entry_type notebook_entry_type_t NOT NULL DEFAULT 'text_question',

  -- ── Reference ───────────────────────────────────────────────
  question_id uuid REFERENCES public.questions(id) ON DELETE SET NULL,
  -- For PRD §12 Mock-OCR Phase-2 entries (deferred to V3 per scope).
  cropped_image_url text,

  -- Captured snapshot — kept alongside the reference so the notebook
  -- doesn't break if the source question is later edited/removed.
  student_answer text,
  correct_answer text,
  topic text,
  sub_topic text,

  -- ── Tags + student annotation ───────────────────────────────
  mistake_tags mistake_tag_t[] DEFAULT '{}'::mistake_tag_t[],
  difficulty_rating difficulty_t,
  student_note text,

  -- ── Spaced revision schedule (PRD §5.6.2) ───────────────────
  current_interval_days int DEFAULT 1 CHECK (current_interval_days > 0),
  next_review_date date NOT NULL DEFAULT (current_date + interval '1 day')::date,
  last_reviewed_at timestamptz,
  review_count int DEFAULT 0 CHECK (review_count >= 0),

  -- PRD §5.6.4 — 3 consecutive Easy → mastered (archived)
  consecutive_easy_count int DEFAULT 0 CHECK (consecutive_easy_count >= 0),
  archived_at timestamptz,

  first_wrong_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- An entry must have either a question reference (text) OR an image (image-type).
  CHECK (
    (entry_type = 'text_question' AND question_id IS NOT NULL)
    OR (entry_type = 'image_question' AND cropped_image_url IS NOT NULL)
  )
);

-- Due-today queries are the hot path; partial index avoids scanning archived rows.
CREATE INDEX idx_notebook_user_due
  ON public.mistake_notebook_entries (user_id, next_review_date)
  WHERE archived_at IS NULL;
CREATE INDEX idx_notebook_user_topic
  ON public.mistake_notebook_entries (user_id, topic);
CREATE INDEX idx_notebook_question ON public.mistake_notebook_entries (question_id)
  WHERE question_id IS NOT NULL;

CREATE TRIGGER trg_notebook_updated_at
  BEFORE UPDATE ON public.mistake_notebook_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
