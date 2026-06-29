-- BYOK (bring-your-own-key) for AI providers.
-- Each user stores their own Gemini / Groq / Anthropic key. Server actions
-- read these per-call to avoid the shared-pool rate-limit problem that hits
-- a community demo (one free-tier key + 20 users = instant 429).
-- Existing RLS on profiles (id = auth.uid()) already covers owner-only access.

alter table public.profiles
  add column if not exists gemini_api_key text,
  add column if not exists groq_api_key text,
  add column if not exists anthropic_api_key text,
  add column if not exists ai_key_prompt_dismissed_at timestamptz;

comment on column public.profiles.gemini_api_key is 'User-provided Google Gemini API key (https://aistudio.google.com). NULL when not configured.';
comment on column public.profiles.groq_api_key is 'User-provided Groq API key (https://console.groq.com). NULL when not configured.';
comment on column public.profiles.anthropic_api_key is 'User-provided Anthropic Claude API key (https://console.anthropic.com). NULL when not configured.';
comment on column public.profiles.ai_key_prompt_dismissed_at is 'When the user clicked "Skip for now" on the AI key prompt. NULL means show prompt; non-NULL means hide it (they can still add via Settings).';
