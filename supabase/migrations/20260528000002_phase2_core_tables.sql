-- ============================================================
-- Prepex · Phase 2 · Migration 2/5
-- Core tables (12 tables)
-- ============================================================
-- Conventions:
--   • PK = uuid via gen_random_uuid()
--   • All timestamps timestamptz
--   • user_id stored on every user-scoped row (denormalized for RLS perf)
--   • References to auth.users use ON DELETE CASCADE so a deleted user
--     takes all their data with them (DPDP §B.6).

-- ============================================================
-- profiles — extends auth.users 1:1
--   Auto-created by trigger handle_new_user (migration 3).
--   PRD §1.0 collects most of these during onboarding.
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  -- identity
  first_name text,
  phone text,

  -- onboarding answers
  goal goal_type,
  exam_date date,
  current_class class_type,
  coach_type coach_type,
  coaching_name text,
  batch text,

  -- study capacity
  daily_hours_weekday smallint default 6 check (daily_hours_weekday between 0 and 24),
  daily_hours_weekend smallint default 8 check (daily_hours_weekend between 0 and 24),
  same_daily_target boolean default false,
  time_windows time_window_t[] default '{}'::time_window_t[],

  -- chronotype + day boundary (PRD §1.2.2)
  chronotype chronotype_t default 'day',
  day_boundary_time time default '05:00:00',
  timezone text default 'Asia/Kolkata',

  -- onboarding progress (PRD §1.0.7 — resume mid-flow)
  onboarding_completed_at timestamptz,
  onboarding_current_step smallint default 1 check (onboarding_current_step between 1 and 7),

  -- streak system (PRD §10 partial in V1 — counters only)
  streak_count int default 0 check (streak_count >= 0),
  best_streak int default 0,
  streak_freezes_available smallint default 1 check (streak_freezes_available >= 0),

  -- inactivity detection for Bad Day Protocol (PRD §4.3)
  last_active_at timestamptz default now(),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- chapters — master JEE syllabus
--   Seeded once in migration 5. Global read-only via RLS.
-- ============================================================
create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  subject subject_t not null check (subject in ('physics', 'chemistry', 'maths')),
  name text not null,
  exams text[] default '{jee_main,jee_adv}'::text[],
  chapter_order smallint,
  created_at timestamptz default now(),
  unique (subject, name)
);

create index idx_chapters_subject_order on public.chapters (subject, chapter_order);

-- ============================================================
-- user_topic_state — per-user spaced repetition state (PRD §2.8)
--   One row per (user, chapter, optional sub-topic).
--   `next_revision_due` powers the revision queue.
-- ============================================================
create table public.user_topic_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  topic text,  -- nullable sub-topic; null means whole chapter

  phase topic_phase_t not null default 'not_started',
  first_studied_at timestamptz,
  last_revised_at timestamptz,
  next_revision_due date,
  revision_count int default 0 check (revision_count >= 0),

  -- The interval used the NEXT revision. After Easy → doubled.
  -- After Hard → reset to 1. Starts at 1.
  current_interval_days int default 1 check (current_interval_days > 0),

  latest_difficulty_rating difficulty_t,
  -- difficulty_history: [{rating: 'medium', date: '2026-05-28'}, ...]
  difficulty_history jsonb default '[]'::jsonb,

  -- PRD §2.2.3 — chapters marked studied during onboarding seed at +7d
  onboarding_marked boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, chapter_id, topic)
);

-- Hot query: "what's due today for this user?" (Phase 7)
create index idx_topic_state_due on public.user_topic_state (user_id, next_revision_due)
  where phase = 'in_revision';

-- ============================================================
-- daily_plans — one plan per user per day (PRD §1.9)
-- ============================================================
create table public.daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null,

  generated_at timestamptz default now(),
  generation_reason plan_reason_t default 'standard',

  total_tasks int default 0,
  total_minutes int default 0,
  completed_tasks int default 0,
  completed_minutes int default 0,
  regenerate_count int default 0 check (regenerate_count >= 0),

  status plan_status_t default 'active',

  -- PRD §1.6 — on Groq API error, fall back to cached previous plan
  cached_groq_response jsonb,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, plan_date)
);

create index idx_daily_plans_user_date on public.daily_plans (user_id, plan_date desc);

-- ============================================================
-- tasks — line items inside a daily plan (PRD §1.9 daily_plan_tasks)
--   plan_id is nullable so a task can exist before being assigned
--   to a plan (e.g. fresh backlog items).
-- ============================================================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.daily_plans(id) on delete cascade,

  task_order smallint default 0,
  subject subject_t not null,
  chapter_id uuid references public.chapters(id) on delete set null,
  chapter text,    -- denormalized name for fast list rendering
  topic text,
  sub_topic text,

  task_type task_type_t not null,
  estimated_minutes smallint not null check (estimated_minutes > 0 and estimated_minutes <= 240),
  time_window time_window_t default 'anytime',
  specific_time time,

  is_anchor boolean default false,    -- user-pinned (PRD §1.2.1 step 4)
  is_custom boolean default false,    -- user-added vs AI-generated
  is_backlog boolean default false,   -- originated from backlog redistribution
  source text,                         -- free-form: 'ai' | 'user' | 'backlog' | etc

  status task_status_t default 'pending',
  completed_at timestamptz,
  focus_minutes_actual int check (focus_minutes_actual is null or focus_minutes_actual >= 0),
  difficulty_rating difficulty_t,      -- for revision tasks (PRD §2.2.2)

  -- PHASE_2 — resource_link_ids will reference a resource_links table
  -- when PRD §18 ships. For V1 it's a free-floating uuid array.
  resource_link_ids uuid[] default '{}'::uuid[],

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_tasks_plan on public.tasks (plan_id, task_order);
create index idx_tasks_user_status on public.tasks (user_id, status);

-- ============================================================
-- daily_plan_regenerations — tracks every regen request (PRD §1.9)
--   Used by Disengagement Detection: 3+ in a week = signal (PRD §4.4.1).
-- ============================================================
create table public.daily_plan_regenerations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.daily_plans(id) on delete cascade,
  reason text,
  requested_at timestamptz default now()
);

create index idx_regen_user_time on public.daily_plan_regenerations (user_id, requested_at desc);

-- ============================================================
-- revision_sessions — one row per completed (or skipped) revision (PRD §2.8)
-- ============================================================
create table public.revision_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_state_id uuid not null references public.user_topic_state(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,

  completed_at timestamptz default now(),
  difficulty_rating difficulty_t,   -- null only when skipped=true
  duration_seconds int check (duration_seconds is null or duration_seconds >= 0),
  skipped boolean default false,

  created_at timestamptz default now(),
  check (skipped = true or difficulty_rating is not null)
);

create index idx_revision_user_time on public.revision_sessions (user_id, completed_at desc);

-- ============================================================
-- backlog_items — missed tasks held for redistribution (PRD §11)
--   priority_weight is COMPUTED in app on read:
--     max(0.2, 1.0 - (days_overdue × 0.05))
--   where days_overdue = current_date - last_reviewed_at.
--   We don't store it because the value drifts every midnight.
-- ============================================================
create table public.backlog_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,  -- null for user_added

  subject subject_t not null,
  chapter_id uuid references public.chapters(id) on delete set null,
  chapter text,
  topic text,
  task_type task_type_t,
  estimated_minutes smallint check (estimated_minutes is null or (estimated_minutes > 0 and estimated_minutes <= 240)),

  original_date date not null,       -- when it was originally planned
  last_reviewed_at date default current_date,  -- resets to today on user touch (PRD §11.2)

  state backlog_state_t default 'active',
  priority backlog_priority_t default 'normal',
  source text,

  -- Held tasks (PRD §11.7): nudge after 7 days, once only.
  held_since timestamptz,
  nudge_sent boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_backlog_user_state on public.backlog_items (user_id, state, last_reviewed_at);

-- ============================================================
-- daily_checkins — one row per user per day (PRD §3.9)
--   Skip is also recorded as a row (skipped=true) so we can detect
--   patterns like "skipped 3 days in a row".
-- ============================================================
create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null,

  response checkin_response_t,
  response_at timestamptz default now(),
  late_response boolean default false,
  skipped boolean default false,

  applied_to_plan_id uuid references public.daily_plans(id) on delete set null,

  -- Optional free-form note (PRD §3 doesn't ask for one but allowing it
  -- costs nothing and Phase 9 chat may surface this).
  note text,

  created_at timestamptz default now(),
  unique (user_id, checkin_date),
  check (skipped = true or response is not null)
);

create index idx_checkin_user_date on public.daily_checkins (user_id, checkin_date desc);

-- ============================================================
-- recovery_modes — backlog OR burnout recovery (PRD §4.2.3 / §11.5)
--   Discriminator column `type` separates the two flavors.
--   Only one ACTIVE row per user per type at a time
--   (enforced by partial unique index).
-- ============================================================
create table public.recovery_modes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type recovery_type_t not null,

  active boolean default true,
  started_at timestamptz default now(),
  ended_at timestamptz,
  end_reason recovery_end_reason_t,
  duration_days int default 7 check (duration_days > 0),

  created_at timestamptz default now(),
  check ((active = true and ended_at is null) or (active = false and ended_at is not null))
);

create unique index idx_recovery_one_active on public.recovery_modes (user_id, type) where active = true;
create index idx_recovery_user on public.recovery_modes (user_id, started_at desc);

-- ============================================================
-- burnout_signals — atomic detection events (PRD §4.2)
--   Aggregated to compute Tier 1-5 severity.
-- ============================================================
create table public.burnout_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  signal_type burnout_signal_t not null,
  detected_at timestamptz default now(),
  tier_at_detection smallint check (tier_at_detection between 1 and 5),
  signal_data jsonb,
  resolved boolean default false,
  resolved_at timestamptz
);

create index idx_burnout_user_open on public.burnout_signals (user_id, detected_at desc)
  where resolved = false;

-- ============================================================
-- bad_day_protocols — one row per re-entry after 2+ inactive days (PRD §4.3)
-- ============================================================
create table public.bad_day_protocols (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  triggered_at timestamptz default now(),
  inactive_days int check (inactive_days is null or inactive_days >= 2),
  welcome_seen boolean default false,
  plan_id uuid references public.daily_plans(id) on delete set null,
  created_at timestamptz default now()
);

create index idx_bad_day_user on public.bad_day_protocols (user_id, triggered_at desc);
