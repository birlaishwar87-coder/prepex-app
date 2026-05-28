-- ============================================================
-- Prepex · Phase 2 · Migration 1/5
-- Extensions + enum types
-- ============================================================
-- pgcrypto is already installed (Supabase default) — we need gen_random_uuid().
-- uuid-ossp also pre-installed; we don't use it (pgcrypto is cleaner).
-- No new extensions required for V1.

-- ============================================================
-- ENUMS — declared once, used everywhere. Locked enums make
-- API contracts stable and prevent free-text drift over time.
-- ============================================================

-- Onboarding: goal selection (PRD §1.0.2 step 2)
create type goal_type as enum (
  'jee_main',
  'jee_adv',
  'neet',
  'cuet',
  'jee_cuet',
  'boards',
  'other'
);

-- Onboarding: current academic year (PRD §1.0.2 step 3)
create type class_type as enum (
  'class_11',
  'class_12',
  'dropper_1',
  'dropper_2',
  'other'
);

-- Onboarding: coaching arrangement (PRD §1.0.2 step 4)
create type coach_type as enum (
  'yes',     -- in a coaching
  'self',    -- self-prep only
  'online'   -- online courses + self-prep
);

-- Derived from time_windows selection (PRD §1.2.2 day-boundary)
create type chronotype_t as enum ('day', 'mixed', 'night');

-- Subject grouping used on tasks AND chapter rows.
-- The two non-academic values ('revision','wellness') are valid on tasks
-- only — chapters have a check constraint allowing only the three real
-- subjects.
create type subject_t as enum (
  'physics',
  'chemistry',
  'maths',
  'revision',
  'wellness'
);

-- Time-of-day slots (PRD §1.2.3 subject-time-window mapping)
create type time_window_t as enum (
  'morning',  -- 5 AM – 11 AM
  'midday',   -- 11 AM – 4 PM
  'evening',  -- 4 PM – 9 PM
  'night',    -- 9 PM – 4 AM
  'anytime'   -- no preference (revision tasks, wellness)
);

-- Task category (PRD §1.3.3)
create type task_type_t as enum (
  'new_learning',
  'revision',
  'practice',
  'dpp',
  'mock_review',
  'wellness'
);

-- Task lifecycle status (PRD §1.9)
create type task_status_t as enum (
  'pending',
  'completed',
  'skipped',
  'removed'
);

-- Daily plan lifecycle (PRD §1.9)
create type plan_status_t as enum ('active', 'completed', 'abandoned');

-- Plan generation trigger reason (PRD §1.2.1 order of precedence)
create type plan_reason_t as enum (
  'standard',
  'regenerate',
  'no_study_day',
  'mock_day',
  'recovery_week',
  'bad_day_protocol'
);

-- Difficulty rating after every revision (PRD §2.2.2)
-- Hard → reset to +1 day · Medium → continue · Easy → double
create type difficulty_t as enum ('easy', 'medium', 'hard');

-- Topic lifecycle phase (PRD §2.3.1)
create type topic_phase_t as enum ('not_started', 'in_revision', 'mastered');

-- Daily emotional check-in 5-emoji response (PRD §3.2.2)
create type checkin_response_t as enum (
  'drained',  -- 😞  40% lighter plan + wellness task
  'heavy',    -- 😐  standard minus one stretch
  'steady',   -- 🙂  default
  'good',     -- 😊  +1 bonus task
  'strong'    -- 🔥  +1 stretch challenge
);

-- Backlog item state (PRD §11)
create type backlog_state_t as enum (
  'active',         -- in normal rotation, AI may surface it
  'held',           -- user paused; nudge after 7 days
  'user_added',     -- student manually added (PRD §11.6)
  'redistributed'   -- already pulled into a future plan
);

-- Manual-add priority (PRD §11.6.1)
create type backlog_priority_t as enum ('urgent', 'normal', 'low');

-- Two types of "recovery" exist in the PRD:
--   backlog → student-initiated, PRD §11.5
--   burnout → auto-triggered by signals, PRD §4.2.3
-- Same shape, different trigger source — single table, discriminator column.
create type recovery_type_t as enum ('backlog', 'burnout');

create type recovery_end_reason_t as enum (
  'completed_7_days',
  'student_ended',
  'threshold_resolved'   -- e.g. backlog dropped below 10
);

-- Burnout detection signals (PRD §4.2.1)
create type burnout_signal_t as enum (
  'consecutive_drained',
  'tasks_skipped',
  'focus_decline',
  'app_open_decline',
  'mock_decline',
  'hard_rating_spike'
);
