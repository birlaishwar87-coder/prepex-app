-- ============================================================
-- Prepex · Phase 2 · Migration 7/5 (hotfix)
-- Add covering indexes for foreign keys
-- ============================================================
-- Postgres needs an index on FK columns for fast CASCADE delete
-- and join performance. Migration 2 indexed most hot paths, but
-- secondary FK columns were left bare. The Supabase performance
-- linter (0001_unindexed_foreign_keys) flagged 9 — adding all here.

create index idx_backlog_chapter on public.backlog_items (chapter_id);
create index idx_backlog_task on public.backlog_items (task_id);
create index idx_bad_day_plan on public.bad_day_protocols (plan_id);
create index idx_checkin_applied_plan on public.daily_checkins (applied_to_plan_id);
create index idx_regen_plan on public.daily_plan_regenerations (plan_id);
create index idx_revision_task on public.revision_sessions (task_id);
create index idx_revision_topic_state on public.revision_sessions (topic_state_id);
create index idx_tasks_chapter on public.tasks (chapter_id);
create index idx_topic_state_chapter on public.user_topic_state (chapter_id);
