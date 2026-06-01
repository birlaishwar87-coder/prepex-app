-- ============================================================
-- Phase 2b · Migration 3/7
-- practice_sessions + question_attempts (PRD §5.3 – §5.5)
-- ============================================================

-- ── practice_sessions ─────────────────────────────────────────
CREATE TABLE public.practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  mode practice_mode_t NOT NULL,
  filters jsonb DEFAULT '{}'::jsonb,
  -- question_ids preserves the order they were shown so we can replay analysis
  question_ids uuid[] DEFAULT '{}'::uuid[],

  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  planned_duration_sec int CHECK (
    planned_duration_sec IS NULL OR planned_duration_sec BETWEEN 60 AND 14400
  ),

  total_questions int DEFAULT 0 CHECK (total_questions >= 0),
  correct_count int DEFAULT 0 CHECK (correct_count >= 0),
  skipped_count int DEFAULT 0 CHECK (skipped_count >= 0),
  marked_for_review_count int DEFAULT 0 CHECK (marked_for_review_count >= 0),
  time_taken_sec int DEFAULT 0 CHECK (time_taken_sec >= 0),

  status practice_session_status_t DEFAULT 'active',

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_practice_sessions_user_started
  ON public.practice_sessions (user_id, started_at DESC);
CREATE INDEX idx_practice_sessions_mode_active
  ON public.practice_sessions (user_id, mode)
  WHERE status = 'active';

CREATE TRIGGER trg_practice_sessions_updated_at
  BEFORE UPDATE ON public.practice_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── question_attempts ─────────────────────────────────────────
CREATE TABLE public.question_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,

  selected_answer text,                  -- nullable when skipped
  is_correct boolean,                    -- nullable when skipped
  time_spent_sec int DEFAULT 0 CHECK (time_spent_sec >= 0),
  marked_for_review boolean DEFAULT false,

  -- PRD §5.5.3 — tagged AFTER session ends, not during
  mistake_tag mistake_tag_t,
  attempted_at timestamptz DEFAULT now(),
  tagged_at timestamptz
);

-- Hot paths
CREATE INDEX idx_attempts_session ON public.question_attempts (session_id);
CREATE INDEX idx_attempts_user_time
  ON public.question_attempts (user_id, attempted_at DESC);
CREATE INDEX idx_attempts_question ON public.question_attempts (question_id);
-- PRD §5.7 pattern recognition queries the wrong attempts by tag
CREATE INDEX idx_attempts_user_tag
  ON public.question_attempts (user_id, mistake_tag)
  WHERE mistake_tag IS NOT NULL;
