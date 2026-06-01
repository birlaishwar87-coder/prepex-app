-- ============================================================
-- Phase 2b · Migration 2/7
-- questions — global content bank (PRD §5.2)
-- ============================================================
-- Read-only for authenticated users (enforced by RLS in migration 7).
-- Service_role bypasses RLS for seed/admin operations.

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Classification ──────────────────────────────────────────
  subject subject_t NOT NULL CHECK (subject IN ('physics', 'chemistry', 'maths')),
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE SET NULL,
  -- chapter (denormalized name) is required so filtering doesn't need a JOIN
  -- and so seeded questions stay attributable when chapter_id is unset.
  chapter text NOT NULL,
  topic text,
  sub_topic text,
  concept_tags text[] DEFAULT '{}'::text[],

  -- ── Content ─────────────────────────────────────────────────
  question_type question_type_t NOT NULL DEFAULT 'single_correct',
  question_text text NOT NULL,
  question_image_url text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  -- 'A'/'B'/etc. for MC; numeric string for integer-type; bitmask "ABD" for
  -- multiple_correct (seeded as string).
  correct_answer text NOT NULL,
  solution_text text,
  solution_image_url text,

  -- ── Metadata ────────────────────────────────────────────────
  difficulty difficulty_t NOT NULL DEFAULT 'medium',
  expected_time_seconds int CHECK (
    expected_time_seconds IS NULL OR expected_time_seconds BETWEEN 30 AND 1800
  ),
  jee_weightage jee_weightage_t DEFAULT 'medium',
  syllabus_tag syllabus_tag_t DEFAULT 'both',

  -- ── Source ──────────────────────────────────────────────────
  source question_source_t NOT NULL DEFAULT 'curated',
  pyq_year smallint CHECK (pyq_year IS NULL OR pyq_year BETWEEN 2000 AND 2099),
  pyq_paper text,    -- 'jan_shift_1', 'apr_shift_2', 'paper_1', etc.
  pyq_shift text,

  -- ── Aggregate stats (denormalized — batch-updated, not transactional) ──
  times_attempted int DEFAULT 0 CHECK (times_attempted >= 0),
  times_correct int DEFAULT 0 CHECK (times_correct >= 0),
  sum_time_taken_seconds bigint DEFAULT 0 CHECK (sum_time_taken_seconds >= 0),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Hot paths
CREATE INDEX idx_questions_subject_chapter_diff
  ON public.questions (subject, chapter_id, difficulty);
CREATE INDEX idx_questions_chapter_id ON public.questions (chapter_id);
CREATE INDEX idx_questions_source_year
  ON public.questions (source, pyq_year)
  WHERE source <> 'curated';

-- updated_at trigger (reuses the function from Phase 2)
CREATE TRIGGER trg_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
