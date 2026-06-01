-- ============================================================
-- Phase 2b · Migration 5/7
-- focus_sessions (PRD §15)
-- ============================================================
-- Powers streak qualification, Effort Score, weakness signals.
-- Anti-gaming rules (PRD §15.4) live in the client — DB just stores
-- foreground vs background seconds and a terminated_reason.

CREATE TABLE public.focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- ── Linkage ─────────────────────────────────────────────────
  linked_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  session_type focus_session_type_t NOT NULL DEFAULT 'plan_linked',

  -- ── Display context (carries when there's no linked task) ───
  subject subject_t,
  chapter text,
  topic text,
  task_type task_type_t,

  -- ── Timer ───────────────────────────────────────────────────
  timer_mode focus_timer_mode_t NOT NULL DEFAULT 'stopwatch',
  -- 5 min – 4h. Stopwatch sessions leave this null.
  planned_duration_sec int CHECK (
    planned_duration_sec IS NULL OR planned_duration_sec BETWEEN 300 AND 14400
  ),

  -- ── Tracking ────────────────────────────────────────────────
  -- foreground only — see PRD §15.4 anti-gaming rules
  actual_duration_sec int DEFAULT 0 CHECK (actual_duration_sec >= 0),
  background_seconds int DEFAULT 0 CHECK (background_seconds >= 0),

  -- ── Milestones (PRD §15.3.3 — templated per task_type in app) ──
  milestones jsonb DEFAULT '[]'::jsonb,
  completed_milestone_count int DEFAULT 0 CHECK (completed_milestone_count >= 0),
  total_milestone_count int DEFAULT 0 CHECK (total_milestone_count >= 0),

  -- ── Cross-App (PRD §15.5) ───────────────────────────────────
  cross_app_category text,   -- 'pw_lecture' | 'physical_book' | 'youtube' | etc.

  -- ── Outcome ─────────────────────────────────────────────────
  -- difficulty_rating is null unless task_type='revision'
  difficulty_rating difficulty_t,
  session_notes text,
  terminated_reason focus_terminated_t,

  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_focus_sessions_user_time
  ON public.focus_sessions (user_id, started_at DESC);
CREATE INDEX idx_focus_sessions_task
  ON public.focus_sessions (linked_task_id)
  WHERE linked_task_id IS NOT NULL;
-- For PRD §15.5.4: enforce 6h/day Cross-App cap by summing today's rows.
CREATE INDEX idx_focus_sessions_cross_app_user_day
  ON public.focus_sessions (user_id, started_at)
  WHERE session_type = 'cross_app';
