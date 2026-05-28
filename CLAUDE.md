# Prepex — project memory

This file is loaded automatically in every Claude Code session inside this folder. Keep it tight; it's the bridge between sessions.

## What we're building

Prepex V1 — the execution app for JEE aspirants. Three features:
1. **AI Study Planner** (PRD §1 + §1.0 onboarding)
2. **Smart Revision Scheduler** (PRD §2)
3. **Backlog Management** (PRD §11)

Plus connective surfaces: landing, auth (Google + email/phone via Supabase), 7-step onboarding, Daily Plan home, AI Chat (Groq), revision session, backlog + Recovery Mode, emotional check-in + Bad Day Protocol, settings.

Features the PRD mentions but **NOT V1**: Practice Engine, Mock Analysis, Streak Leaderboard, Accountability Partner, Win Journal, Parent Reports. Stub gracefully with `// PHASE_2` — never break, never fake.

## Stack (locked)

- Next.js 14 App Router + TypeScript + Tailwind v3
- Framer Motion (transitions)
- `@supabase/supabase-js` + `@supabase/ssr` (Postgres + Auth + RLS)
- `groq-sdk` — `llama-3.3-70b-versatile` (server-only)
- `mixpanel-browser` (browser analytics)
- `lucide-react` (icons — **never** Material Icons font)
- Deploy: Vercel via GitHub

## Build conventions

- Mobile-first → tablet (768px) → desktop (1440px)
- All Groq calls happen server-side. Anything importing `lib/groq/client.ts` uses the `server-only` package so client imports throw at build time.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Bypasses RLS — use only for trusted operations.
- Mixpanel is a no-op when `NEXT_PUBLIC_MIXPANEL_TOKEN` is missing.
- Design tokens live in CSS vars (`globals.css`) AND Tailwind theme (`tailwind.config.ts`). Use Tailwind utilities for layout/spacing; use the `.glass`, `.pill`, `.btn`, `.field`, `.aurora-bg`, `.t-*` component classes for brand surfaces.
- No comments explaining WHAT — only WHY (hidden constraints, brand rules, surprising behavior).

## Brand voice (strict)

Older-sibling tone. The brand guide §05 has a hard banlist. Anything I write — copy, errors, empty states, notifications — passes the older-sibling test.

**Banned** (will fail brand review):
- "RISE AND SHINE WARRIOR", "Crush your goals", "Don't lose your streak", "You missed X days! Get back NOW", "You've fallen behind", motivational-poster phrases
- ALL CAPS for emphasis (use bold or coral color shift)
- More than 1 emoji per message, more than 1 exclamation per message

**Always**:
- Acknowledge feelings before solutions ("Tough day. Let's go light today.")
- Specific over vague ("Your Calculus accuracy is 47%" not "you need to improve")
- Trust the student. They are 17, not 7.

## Locked PRD rules (must not deviate)

- **Revision intervals** (PRD §2.2): +1, +3, +7, +14, +30, +60 days. Hard → reset to +1; Medium → continue; Easy → double. Onboarding-marked chapters seed at +7.
- **Backlog priority decay** (PRD §11.2): `max(0.2, 1.0 - days_overdue × 0.05)`. Floor 0.2, never 0. Manual review resets to 1.0.
- **Backlog Recovery Mode** (PRD §11.5): activates at 25+ tasks, **student-initiated only**, 50/30/20 split (backlog/revision/new), auto-exits at 7d or <10 tasks. Streak auto-protected during Recovery Mode.
- **First 7 days**: backlog count **not visible** to new user (PRD §11.8).
- **Plan generation Order of Precedence** (PRD §1.2.1): No-Study Day → Mock Day → Recovery Week → Standard with anchors. First match wins.
- **Subject ↔ time window** (PRD §1.2.3): Maths morning, Physics conceptual morning, Physics problem-solving midday/evening, Chemistry Physical morning/midday, Chemistry Organic evening, Inorganic evening/night.
- **Check-in modulation** (PRD §1.5.1): Drained → 40% lighter + wellness; Heavy → standard minus stretch; Steady → default; Good → +1 bonus; Strong → +1 stretch.
- **Bad Day Protocol** (PRD §4.3): triggers at 2+ inactive days. No backlog dump on return. Streak silently resets — no popup.

## Env vars

| Name | Where | Required? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | yes (for admin ops) |
| `GROQ_API_KEY` | server only | yes (Phase 5+) |
| `NEXT_PUBLIC_MIXPANEL_TOKEN` | browser | optional (no-op when missing) |

## Phase status

- [x] **Phase 1** — Project setup, design tokens, base components, routing skeleton
- [x] **Phase 2** — Supabase schema + RLS + migrations (12 tables, 18 enums, 4 trigger functions, 54 seed chapters)
- [x] **Phase 3** — Auth (Google OAuth + email/password). Phone OTP deferred
- [x] **Phase 4** — Onboarding flow (7 steps, resume-from-step, chapter seeding)
- [ ] **Phase 5** — Groq integration + plan generation engine
- [ ] **Phase 6** — Daily Plan home
- [ ] **Phase 7** — Revision Scheduler
- [ ] **Phase 8** — Backlog Management
- [ ] **Phase 9** — AI Chat
- [ ] **Phase 10** — Settings + empty/loading/error states + polish
- [ ] **Phase 11** — Mixpanel wiring + final QA + deploy prep

## Layout map

```
app/
  layout.tsx                  Root — Plus Jakarta Sans, Source Serif Pro, Mixpanel provider, aurora-bg
  page.tsx                    Landing (placeholder, real lands later)
  globals.css                 Design tokens + .glass, .pill, .btn, .field, .aurora-bg, .t-* classes
  (auth)/login/page.tsx       Phase 3
  (auth)/signup/page.tsx      Phase 3
  onboarding/page.tsx         Phase 4
  (app)/layout.tsx            Wraps with AppShell (sidebar + mobile nav)
  (app)/today/page.tsx        Phase 6
  (app)/revision/page.tsx     Phase 7
  (app)/backlog/page.tsx      Phase 8
  (app)/chat/page.tsx         Phase 9
  (app)/settings/page.tsx     Phase 10
  dev/preview/page.tsx        Internal — primitives visual smoke test

components/
  ui/                         Logo, Button, GlassCard, Pill, Field, Modal, ProgressRing, AuroraBackground
  layout/                     AppShell, Sidebar, MobileBottomNav

lib/
  utils/cn.ts                 clsx + tailwind-merge
  supabase/client.ts          getSupabaseBrowserClient() — typed against Database
  supabase/server.ts          getSupabaseServerClient(), getSupabaseAdminClient() — typed
  supabase/database.types.ts  AUTO-GENERATED — regenerate via MCP after schema changes
  groq/client.ts              getGroqClient() — server-only, GROQ_PLAN_MODEL constant
  analytics/mixpanel.ts       initMixpanel, track, identify, resetMixpanel + PrepexEvent type
  analytics/mixpanel-provider.tsx  Client provider that calls initMixpanel once

supabase/
  README.md                   Folder docs
  migrations/                 7 SQL files — source-of-truth schema, replay-safe
```

## Database schema (Phase 2)

Supabase project: **`pqjufzuljwiujvzlqdlf`** (ap-northeast-1, Postgres 17.6).

### 12 tables, all RLS-enforced

| Table | Purpose |
|---|---|
| `profiles` | 1:1 with `auth.users`. Onboarding data, capacity, streak counters, `last_active_at` |
| `chapters` | 54 master JEE chapters (18 × 3 subjects). Global read-only |
| `user_topic_state` | Per-user spaced-repetition state. `next_revision_due` powers the queue |
| `daily_plans` | One per user per day. `cached_groq_response` for §1.6 fallback |
| `tasks` | Plan line items. `is_anchor`, `is_custom`, `is_backlog` flags |
| `daily_plan_regenerations` | Append-only — powers Disengagement signal |
| `revision_sessions` | Append-only history with `difficulty_rating` |
| `backlog_items` | Missed-task pool. Priority computed in app from `original_date` + `last_reviewed_at` |
| `daily_checkins` | One per user per day. 5-emoji response or `skipped=true` |
| `recovery_modes` | Discriminator `type` enum (backlog | burnout). Partial unique index on (user, type) where active |
| `burnout_signals` | Atomic events aggregated to Tier 1–5 |
| `bad_day_protocols` | One row per re-entry after 2+ inactive days |

### RLS pattern (uniform)

- `profiles.id = (select auth.uid())` for self
- `chapters` → read-only for authenticated; writes only via service_role
- Everything else → `user_id = (select auth.uid())` for select/insert/update; deletes restricted on history tables (revision_sessions, regenerations, burnout_signals, recovery_modes)

### Triggers

- `handle_new_user` (on `auth.users`) — auto-creates profiles row, pulling `first_name` from `raw_user_meta_data`
- `set_updated_at` — touches `updated_at` on UPDATE for profiles/topic_state/plans/tasks/backlog
- `touch_last_active` — keeps `profiles.last_active_at` fresh on task/checkin/revision activity. Powers Bad Day Protocol inactivity detection
- All trigger functions: `SECURITY DEFINER` with `set search_path = ''`; EXECUTE revoked from anon/authenticated (callable only via trigger, not RPC)

### 18 enums

Locked API contracts: `goal_type`, `class_type`, `coach_type`, `chronotype_t`, `subject_t`, `time_window_t`, `task_type_t`, `task_status_t`, `plan_status_t`, `plan_reason_t`, `difficulty_t`, `topic_phase_t`, `checkin_response_t`, `backlog_state_t`, `backlog_priority_t`, `recovery_type_t`, `recovery_end_reason_t`, `burnout_signal_t`.

When adding a new enum value: `alter type X add value 'new_value'` — never replace.

### Key invariants (don't break)

- **`user_id` lives on every user-scoped row** — for direct RLS check without joins.
- **`profiles` rows are auto-created by trigger** — never `INSERT INTO profiles` from app code on signup.
- **Cascade delete from `auth.users`** removes all user data (DPDP §B.6 compliance).
- **`backlog_items.priority_weight` is NOT stored.** Always compute: `max(0.2, 1.0 - (current_date - last_reviewed_at) × 0.05)`.
- **`revision_sessions` + `daily_plan_regenerations` are append-only** — no UPDATE/DELETE policies.

### Regenerating types after schema changes

Whenever you modify the schema (alter tables, add columns, etc.), regenerate types:
1. Apply the new migration via MCP `apply_migration` (records to `supabase_migrations.schema_migrations`)
2. Add the SQL file to `supabase/migrations/` for source control
3. Run MCP `generate_typescript_types`, overwrite `lib/supabase/database.types.ts`
4. Run `npx tsc --noEmit` to catch breakage in consuming code

### Env vars needed for Phase 3+

```
NEXT_PUBLIC_SUPABASE_URL=https://pqjufzuljwiujvzlqdlf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_lYUjDxhnBHspx1B1sfJSMg_vJJqEk8e
SUPABASE_SERVICE_ROLE_KEY=  # Dashboard → Settings → API → service_role (secret)
```

## Auth (Phase 3)

### Flow
- `/signup` → Google OAuth or email/password. Email/password collects `first_name` + phone; phone goes onto profile (NOT used as auth method — phone OTP deferred per founder decision).
- `/login` → Google OAuth or email/password.
- Server actions in `app/(auth)/login/actions.ts` and `app/(auth)/signup/actions.ts` call `supabase.auth.signInWithPassword` / `signUp`.
- OAuth callback at `/auth/callback` exchanges code → session, then routes to `/onboarding` (no `onboarding_completed_at`) or `/today`.
- Signout at `/auth/signout` (POST only) → redirects to `/`.
- Middleware (`middleware.ts` + `lib/supabase/middleware.ts`) refreshes session every request, redirects unauth → `/login` for protected routes, redirects auth → `/today` from `/login`+`/signup`.

### Files added in Phase 3
```
middleware.ts                          Root middleware — calls updateSession
lib/supabase/middleware.ts             updateSession helper (getAll/setAll cookie pattern)
lib/supabase/get-user.ts               getCurrentUser, getCurrentProfile — React-cached per request

app/(auth)/layout.tsx                  Shared auth shell (back-home link, footer)
app/(auth)/signup/page.tsx             Server page
app/(auth)/signup/signup-form.tsx      Client form ('use client')
app/(auth)/signup/actions.ts           Server action signupAction
app/(auth)/login/page.tsx              Server page
app/(auth)/login/login-form.tsx        Client form
app/(auth)/login/actions.ts            Server action loginAction

app/auth/callback/route.ts             OAuth code exchange
app/auth/signout/route.ts              POST signout

components/auth/google-button.tsx      Reusable Google OAuth CTA

app/(app)/layout.tsx                   Now async — pulls profile via getCurrentProfile,
                                        passes name + streak to AppShell.
                                        `export const dynamic = 'force-dynamic'`.
components/layout/sidebar.tsx          Renders Sign-out form when signedIn=true
components/layout/app-shell.tsx        signedIn prop forwarded to Sidebar
```

### Manual Supabase dashboard config (Ishwar)

Before Google OAuth works:
1. **Authentication → URL Configuration → Site URL** = `http://localhost:3000` (dev) / production URL when deploying
2. **Authentication → URL Configuration → Redirect URLs** add: `http://localhost:3000/auth/callback`
3. **Authentication → Providers → Google** → enable; paste OAuth credentials from a Google Cloud OAuth web client. Redirect URI to paste into Google Cloud: `https://pqjufzuljwiujvzlqdlf.supabase.co/auth/v1/callback`
4. **Email/password** is enabled by default. To skip email-confirmation for local testing: **Authentication → Sign in/up → Email** → turn OFF "Confirm email". Keep ON for production.

### Auth invariants

- **`first_name` arrives via `raw_user_meta_data`** on signup; the `handle_new_user` trigger picks it up. Don't try to INSERT a profile row from app code.
- **Phone is stored on profile but NOT used as auth method** in V1 — collected for partner matching / parent connection per PRD §1.0.2.
- **Auto-confirm via service role** — the signup action calls `admin.auth.admin.updateUserById(id, { email_confirm: true })` then signs the user in immediately. DEV CONVENIENCE — revisit before prod launch if you want real email verification. Set `AUTO_CONFIRM_EMAIL` env or strip the admin call when hardening.
- **`auth.uid()` everywhere** for RLS. All server-side reads go through `getSupabaseServerClient()` so cookies → session → uid flows correctly.

## Onboarding (Phase 4)

### Flow
- Server `app/onboarding/page.tsx` loads profile + chapters, picks up where the user left off (`onboarding_current_step`). Already done? Redirect to `/today`.
- Client `onboarding-flow.tsx` is the 7-step state machine — every step calls a server action that persists and advances `onboarding_current_step` before client moves to next step.
- Step 6 batch-upserts `user_topic_state` rows for every chapter the user marked: `phase='in_revision'`, `next_revision_due = today + 7d`, `current_interval_days=7`, `onboarding_marked=true` (per PRD §2.2.3).
- Step 7 sets `onboarding_completed_at` and `redirect('/today')` after a ~6.5s neural-viz loading sequence (UX matches `onboarding.jsx`).

### Files
```
app/onboarding/
  page.tsx                Server — guards + pre-fetches chapters
  onboarding-flow.tsx     Client — 7-step state machine with all step UIs
  actions.ts              saveGoalAction, saveExamAction, saveCoachingAction,
                          saveHoursAction, saveTopicsAction, completeOnboardingAction
```

### Invariants

- **Resume is server-driven**: client reads `initialStep` + `initialData` from server props, never localStorage. If a user clears cookies and re-logs-in, they pick back up at the right step.
- **Chronotype + day_boundary are DERIVED** in `saveHoursAction` from selected time windows, not user input. Day → 5 AM, Night → 12 PM noon, Mixed → 6 AM (PRD §1.2.2 locked).
- **Chapter seeding is idempotent** — `ON CONFLICT (user_id, chapter_id, topic) DO NOTHING`. Re-onboarding doesn't double-seed.
- **`(profile data).update(...)` requires `as never` cast** to work around a postgrest-js v2.x generic-inference glitch. Use the `updateProfile()` helper in `actions.ts` — it preserves `TablesUpdate<'profiles'>` type-safety at the call site.
- **Step 4 coaching upload is a UI stub** (PHASE_2). The "Coming soon" button never uploads. Real upload + OCR ships when PRD §1.0.2 step 4 lands fully.
- **Late-night signup behavior (PRD §1.0.4)** is NOT enforced here — Phase 5 (plan generation) reads `onboarding_completed_at` vs `day_boundary_time` to decide "today" vs "tomorrow" first-plan target.
