-- Onboarding previously used a binary toggle ("did you study this chapter?").
-- Community feedback (2026-06-28): users marked partially-studied chapters
-- and the AI then advanced them to later chapters before they'd finished
-- the prerequisites. Switching to 3-state: none / partial / full.

create type public.study_depth_t as enum ('none', 'partial', 'full');

alter table public.user_topic_state
  add column if not exists study_depth public.study_depth_t default 'full';

comment on column public.user_topic_state.study_depth is 'How thoroughly the user has studied this chapter. Default full for backward compat with rows created before 2026-06-29. Plan generator must not advance past a chapter marked partial in a subject without first finishing it.';
