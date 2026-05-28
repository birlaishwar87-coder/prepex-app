-- ============================================================
-- Prepex · Phase 2 · Migration 3/5
-- Trigger functions
-- ============================================================
-- All functions use SECURITY DEFINER with `set search_path = ''`
-- — every schema-qualified call inside must be explicit (public.xxx,
-- auth.xxx). This protects against search_path manipulation attacks.

-- ============================================================
-- set_updated_at — generic "touch updated_at on UPDATE" trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_topic_state_updated_at
  before update on public.user_topic_state
  for each row execute function public.set_updated_at();

create trigger trg_plans_updated_at
  before update on public.daily_plans
  for each row execute function public.set_updated_at();

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create trigger trg_backlog_updated_at
  before update on public.backlog_items
  for each row execute function public.set_updated_at();

-- ============================================================
-- handle_new_user — auto-create profiles row when a new auth.users row lands
-- ============================================================
-- The Supabase signUp() call sends additional fields via raw_user_meta_data
-- (we wire this in Phase 3). Phone may come from auth.users.phone directly.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, phone, first_name)
  values (
    new.id,
    nullif(new.phone, ''),
    coalesce(new.raw_user_meta_data->>'first_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- touch_last_active — keep profiles.last_active_at fresh
-- ============================================================
-- Called from triggers on tables that represent user activity.
-- Bad Day Protocol (PRD §4.3) needs accurate "last_active_at"
-- to trigger after 2+ inactive days.
create or replace function public.touch_last_active()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set last_active_at = now()
  where id = new.user_id;
  return new;
end;
$$;

create trigger trg_tasks_touch_active
  after insert or update of status, completed_at on public.tasks
  for each row execute function public.touch_last_active();

create trigger trg_checkins_touch_active
  after insert on public.daily_checkins
  for each row execute function public.touch_last_active();

create trigger trg_revisions_touch_active
  after insert on public.revision_sessions
  for each row execute function public.touch_last_active();
