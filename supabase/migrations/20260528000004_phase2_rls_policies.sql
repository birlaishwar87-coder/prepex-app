-- ============================================================
-- Prepex · Phase 2 · Migration 4/5
-- Row-Level Security — strict user-scoped access
-- ============================================================
-- Pattern:
--   • profiles: select/update where auth.uid() = id.
--                INSERT only via trigger (no client policy).
--   • chapters: read-only for any authenticated user.
--                Writes only via service_role (no client policy).
--   • all other tables: select/insert/update/delete where auth.uid() = user_id.

-- ============================================================
-- Enable RLS everywhere
-- ============================================================
alter table public.profiles enable row level security;
alter table public.chapters enable row level security;
alter table public.user_topic_state enable row level security;
alter table public.daily_plans enable row level security;
alter table public.tasks enable row level security;
alter table public.daily_plan_regenerations enable row level security;
alter table public.revision_sessions enable row level security;
alter table public.backlog_items enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.recovery_modes enable row level security;
alter table public.burnout_signals enable row level security;
alter table public.bad_day_protocols enable row level security;

-- ============================================================
-- profiles — self-only
-- ============================================================
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No INSERT/DELETE policies: profiles are created by handle_new_user trigger
-- and deleted via CASCADE from auth.users.

-- ============================================================
-- chapters — global read-only
-- ============================================================
create policy chapters_select_all
  on public.chapters
  for select
  to authenticated
  using (true);

-- No INSERT/UPDATE/DELETE policies — only service_role can mutate.

-- ============================================================
-- user_topic_state
-- ============================================================
create policy topic_state_select_own
  on public.user_topic_state for select to authenticated
  using ((select auth.uid()) = user_id);
create policy topic_state_insert_own
  on public.user_topic_state for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy topic_state_update_own
  on public.user_topic_state for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy topic_state_delete_own
  on public.user_topic_state for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================
-- daily_plans
-- ============================================================
create policy daily_plans_select_own
  on public.daily_plans for select to authenticated
  using ((select auth.uid()) = user_id);
create policy daily_plans_insert_own
  on public.daily_plans for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy daily_plans_update_own
  on public.daily_plans for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy daily_plans_delete_own
  on public.daily_plans for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================
-- tasks
-- ============================================================
create policy tasks_select_own
  on public.tasks for select to authenticated
  using ((select auth.uid()) = user_id);
create policy tasks_insert_own
  on public.tasks for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy tasks_update_own
  on public.tasks for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy tasks_delete_own
  on public.tasks for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================
-- daily_plan_regenerations
-- ============================================================
create policy regens_select_own
  on public.daily_plan_regenerations for select to authenticated
  using ((select auth.uid()) = user_id);
create policy regens_insert_own
  on public.daily_plan_regenerations for insert to authenticated
  with check ((select auth.uid()) = user_id);
-- No update/delete — regen history is immutable.

-- ============================================================
-- revision_sessions
-- ============================================================
create policy revisions_select_own
  on public.revision_sessions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy revisions_insert_own
  on public.revision_sessions for insert to authenticated
  with check ((select auth.uid()) = user_id);
-- No update/delete — sessions are append-only history.

-- ============================================================
-- backlog_items
-- ============================================================
create policy backlog_select_own
  on public.backlog_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy backlog_insert_own
  on public.backlog_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy backlog_update_own
  on public.backlog_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy backlog_delete_own
  on public.backlog_items for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================
-- daily_checkins
-- ============================================================
create policy checkins_select_own
  on public.daily_checkins for select to authenticated
  using ((select auth.uid()) = user_id);
create policy checkins_insert_own
  on public.daily_checkins for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy checkins_update_own
  on public.daily_checkins for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
-- No delete — Settings page offers "Clear history" via service_role
-- (PRD §3.5 — resetting burnout baseline), not direct DELETE.

-- ============================================================
-- recovery_modes
-- ============================================================
create policy recovery_select_own
  on public.recovery_modes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy recovery_insert_own
  on public.recovery_modes for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy recovery_update_own
  on public.recovery_modes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
-- No delete — recovery history is preserved (audit + Win Journal source).

-- ============================================================
-- burnout_signals — read-only for client; writes via service_role
-- ============================================================
create policy burnout_select_own
  on public.burnout_signals for select to authenticated
  using ((select auth.uid()) = user_id);
-- INSERT/UPDATE only via service_role (detection runs server-side).

-- ============================================================
-- bad_day_protocols
-- ============================================================
create policy badday_select_own
  on public.bad_day_protocols for select to authenticated
  using ((select auth.uid()) = user_id);
create policy badday_insert_own
  on public.bad_day_protocols for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy badday_update_own
  on public.bad_day_protocols for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
-- No delete — keep welcome-back history.
