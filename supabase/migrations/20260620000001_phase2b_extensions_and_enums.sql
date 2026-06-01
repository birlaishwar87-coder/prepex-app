-- ============================================================
-- Phase 2b · Migration 1/7
-- Extend difficulty_t + create 13 new enum types
-- ============================================================
-- PRD §5.2.2 has 4 difficulty levels. Phase-1 enum only has 3.
-- ADD VALUE is non-breaking — existing rows are unaffected.
ALTER TYPE difficulty_t ADD VALUE IF NOT EXISTS 'very_hard';

-- ============================================================
-- New enums — locked API contracts for Phase 2.
-- ============================================================

-- PRD §5.2.2 — question shapes
CREATE TYPE question_type_t AS ENUM (
  'single_correct',
  'multiple_correct',
  'integer',
  'assertion_reason'
);

-- PRD §5.2.2 — content provenance
CREATE TYPE question_source_t AS ENUM (
  'curated',
  'jee_main_pyq',
  'jee_advanced_pyq'
);

-- PRD §5.3 — practice session modes
CREATE TYPE practice_mode_t AS ENUM (
  'chapter',          -- standard chapter practice from planner
  'pyq',              -- Previous-Year Question drill
  'mistake_retest',   -- reviewing items from Mistake Notebook
  'mock',             -- long mixed-question mock test (V2: basic; full §12 OCR deferred)
  'dpp',              -- Sunday Daily Practice Problems framing
  'custom'            -- Custom Practice Builder (PRD §5.3.3)
);

-- PRD §5.5.3 — mistake taxonomy
CREATE TYPE mistake_tag_t AS ENUM (
  'silly_error',
  'conceptual_gap',
  'time_pressure',
  'wild_guess'
);

-- PRD §5.6.1 — what populates the Mistake Notebook
CREATE TYPE notebook_source_t AS ENUM ('practice', 'mock', 'revision');

-- PRD §5.6.2 — text vs image-captured entry
CREATE TYPE notebook_entry_type_t AS ENUM ('text_question', 'image_question');

-- PRD §15.2 + §15.5 — three Focus Mode entry points
CREATE TYPE focus_session_type_t AS ENUM ('plan_linked', 'quick_focus', 'cross_app');

-- PRD §15.3.2 — five timer modes
CREATE TYPE focus_timer_mode_t AS ENUM (
  'stopwatch',
  'pomodoro_25',
  'pomodoro_45',
  'pomodoro_60',
  'custom'
);

-- PRD §15.4 / §15.7 — how the session ended (anti-gaming records this)
CREATE TYPE focus_terminated_t AS ENUM (
  'completed',
  'manual_end',
  'timeout',
  'crash',
  'exceeded_5min_bg',
  'phone_call'
);

-- Library content categorisation. concept_map added because Content Raw
-- has a Concept Maps folder.
CREATE TYPE library_type_t AS ENUM ('notes', 'formulas', 'keypoints', 'concept_map');

-- PRD §5.2.2 — JEE marks weightage (for smart filtering / recommendation)
CREATE TYPE jee_weightage_t AS ENUM ('high', 'medium', 'low');

-- PRD §5.2.2 — which exam paper the question is for
CREATE TYPE syllabus_tag_t AS ENUM ('jee_main', 'jee_advanced', 'both');

-- Practice session lifecycle
CREATE TYPE practice_session_status_t AS ENUM ('active', 'completed', 'abandoned');
