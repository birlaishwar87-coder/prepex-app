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
- [x] **Phase 5** — Groq plan-generation engine + /api/plan/generate + minimal /today wire-up
- [x] **Phase 6** — Daily Plan home (real UX with check-in, task cards, regenerate, Bad Day, right panel)
- [x] **Phase 7** — Revision Scheduler (interval engine, phase transitions, /revision queue, shared RevisionSession)
- [x] **Phase 8** — Backlog Management (/backlog with health tiers, recovery mode, manual add, first-7-days hide)
- [x] **Phase 9** — AI Chat (/chat with Groq llama-3.3, context-aware reply, ephemeral history)
- [x] **Phase 10** — Settings + /wellness + real backlog badge + clock times on tasks + chat regen-from-intent + Anthropic Claude as optional provider
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

## Plan generation engine (Phase 5)

The brain. Triggered explicitly via `POST /api/plan/generate` or the server action `generateTodayPlanAction`. Phase 6 wires this into the polished UX.

### File map

```
lib/utils/
  day-boundary.ts          getCurrentPlanDate, getFirstPlanDate, getHoursTargetForDate
                            — chronotype-aware day rollover (PRD §1.2.2)
                            — late-night-signup detection (PRD §1.0.4, ≤3h to boundary)
  backlog-priority.ts      computeBacklogPriority — formula max(0.2, 1.0 - days × 0.05) (PRD §11.2)

lib/groq/
  client.ts                getGroqClient() + GROQ_PLAN_MODEL = "llama-3.3-70b-versatile"
  types.ts                 PlanContext (input), GroqPlanOutput (output), validateGroqOutput
  system-prompt.ts         Locked PLAN_SYSTEM_PROMPT — encodes Order of Precedence,
                            subject-window map, check-in modulation, anti-patterns
  context.ts               gatherPlanContext(userId) — reads profile, checkin, syllabus,
                            studied, revisions_due, backlog, recovery_modes; sorts by priority
  generate-plan.ts         generateDailyPlan({ userId, regenerate?, reason? }) →
                            { ok, plan, tasks, fallback? } | { ok: false, error }

app/api/plan/generate/route.ts        POST handler — auth, calls generateDailyPlan, returns JSON
app/(app)/today/actions.ts            Server action wrapper (with revalidatePath)
app/(app)/today/generate-button.tsx   Client button using useFormState + useFormStatus
app/(app)/today/page.tsx              Reads existing plan/tasks; offers Generate or shows tasks
```

### Locked invariants

- **Order of Precedence routing** (PRD §1.2.1): the system prompt enforces, AND the generator short-circuits where possible. Sequence: `no_study_day` → `mock_day` → `recovery_week` → `bad_day_protocol` → `standard` / `regenerate`.
- **Strict JSON output** — `response_format: { type: "json_object" }` forces it. Parse via `JSON.parse` + `validateGroqOutput` (custom validator, no Zod). Failures trigger the fallback path.
- **Fallback on Groq error** (PRD §1.6): returns the most recent successful plan as-is with `fallback: true` + `fallbackReason`. UI shows the "Couldn't refresh today's plan — using yesterday's structure" banner (Phase 6).
- **Chapter sanity** — generator filters Groq's `chapter_id` values against the syllabus before insert. Hallucinated UUIDs are stripped (row still saves with `chapter_id = null` and free-form `chapter` text).
- **Regeneration** deletes `pending` tasks only (preserves `completed`), bumps `regenerate_count`, and inserts a `daily_plan_regenerations` row for Disengagement Detection (PRD §4.4.1).
- **Cached output**: every successful generation writes `daily_plans.cached_groq_response` for replay/debug.
- **Subject ↔ time window mapping** (PRD §1.2.3) and **check-in modulation** (PRD §1.5.1) live in the system prompt — never re-implement them client-side.
- **Anti-patterns**: explicitly banned in the system prompt — "warrior", "champion", "conquer", "crush", "behind", "must", "should", motivational quotes, rank prediction.

### Stubs for now (wired in later phases)

- **`is_no_study_day`, `is_mock_day`** → always `false`. Calendar (PRD §9) ships in Phase 8/9.
- **`anchors[]`** → always `[]`. Custom Day Plan UI ships later.
- **Bad Day Protocol short-circuit** — currently flows through the system prompt's drained branch when `checkin.response === 'drained'`. Dedicated 2+ inactive-days trigger (PRD §4.3) ships in Phase 6.
- **Weakness frequency boost** (PRD §14) → not in V1.

## Daily Plan home (Phase 6)

The full `/today` UX. Lives at `app/(app)/today/`.

### File map

```
app/(app)/today/
  page.tsx                      Server — reads plan + tasks + checkin + heatmap + tomorrow,
                                 detects Bad Day Protocol, hands off to client renderer.
  today-client.tsx              Client — top-level state (modals, selected task) + composition.
  actions.ts                    Server actions: submitCheckin, toggleTaskCompleted,
                                 regeneratePlan, addCustomTask, removeTask, acknowledgeBadDay.
  components/
    checkin-modal.tsx           PRD §3 — 5 emojis + Skip; submit gens plan when none yet.
    task-card.tsx               PRD §1.3 — subject color bar, optimistic checkbox, CTA.
    task-detail-modal.tsx       Mark complete / Move to backlog / Remove.
    add-task-modal.tsx          PRD §1.4.2 — subject + topic + type + duration + window.
    regenerate-modal.tsx        PRD §1.3.4 — reason capture, logs daily_plan_regenerations.
    bad-day-welcome.tsx         PRD §4.3 — no backlog count, silent streak reset, "Start fresh".
    fallback-banner.tsx         PRD §1.6 — "Couldn't refresh today's plan…".
    right-panel.tsx             StreakCard (28-day heatmap) + ProgressRing +
                                 QuickStats + TomorrowPreview. Visible ≥1200 px.
```

### Locked invariants

- **Check-in is dismissible** (PRD §3.2.1). Shown as a modal that opens on first load when no
  daily_checkins row exists. Skip stores `skipped=true` row — pattern still feeds Burnout
  Detection later.
- **Plan generation kicks off automatically** on first check-in submit when no plan exists.
  Subsequent same-day check-in changes do NOT auto-regen — disruptive. User clicks Regenerate
  manually if they want.
- **Task completion is optimistic** via useTransition. Roll back on action error.
- **Streak increments on FIRST completed task of the day** (`completed_tasks` 0→1 transition).
  Unchecking never decrements — surprising UX (PRD §10 intent).
- **Bad Day Protocol** (PRD §4.3.1) triggers when `last_active_at ≥ 2 days ago` AND not the
  first plan ever. Server inserts a `bad_day_protocols` row with `welcome_seen=false`, silently
  resets `streak_count = 0` (PRD §4.3.5, NO popup), shows BadDayWelcome. User taps
  "Start fresh" → action marks `welcome_seen=true` and generates the gentle 3-task plan.
- **NO backlog count is shown on Bad Day Welcome** (PRD §4.3.4). Don't ever surface it there.
- **Bad Day plan shape** (PRD §4.3.3): 3 tasks, 15–25 min each, no `new_learning`, subject mix,
  first task should be a comfortable chapter. Enforced by the system prompt's
  `is_bad_day_return` branch.
- **Streak heatmap**: 28 days back from plan_date. Intensity 0–4 based on `completed_tasks /
  total_tasks` ratio. No completions → 0.
- **Right panel is hidden <1200 px** — there's no real estate. Phase 10 can decide whether
  to compose a mobile-only Activity tab.

### Stubs deliberately deferred

- **Drag-reorder tasks** (PRD §1.4.4) → Phase 10 polish. Manual reorder requires DnD lib.
- **Drag time-to-adjust** on task duration → Phase 10.
- **Focus session timer** (PRD §15) → Phase 8/2-of-roadmap.
- **Mid-day check-in change auto-regen** (PRD §3.6 edge) → disabled; user can hit Regenerate.
- **Subject icon glyphs** on TaskCard → using subject color bar only. Phase 10 polish.

## Revision Scheduler (Phase 7)

Spaced repetition with locked PRD §2 math. Single shared `RevisionSession` modal serves both `/today` task cards AND the `/revision` queue.

### File map

```
lib/revision/
  intervals.ts            computeNextInterval (Hard→1, Medium→continue, Easy→double),
                           addDaysISO, todayISO. Pure functions.
  transitions.ts          shouldMaster (5 non-Hard across 30+ days),
                           shouldUnmaster (one Hard from mastered),
                           isAllHardFirstRevisionPattern (PRD §2.2.3 detection).

app/(app)/revision/
  page.tsx                Server — fetches user_topic_state where phase='in_revision'
                           AND next_revision_due ≤ today+7d. Buckets into Overdue / Due today
                           / Coming soon.
  queue-client.tsx        Client — holds revisionTarget state, renders groups + session modal.
  actions.ts              submitRevisionAction (rating → interval math + history append +
                           phase transition + linked task update),
                           skipRevisionAction (→ backlog with weight 1.0, PRD §2.5.3).
  components/
    revision-session.tsx  Shared 2-step modal: intro + self-quiz → Hard/Medium/Easy rating.
                           Imported by /today's TaskCard for revision tasks.

app/(app)/today/
  page.tsx                Now also builds revisionTopicStateByChapter +
                           chapterMetaById maps for routing revision tasks.
  today-client.tsx        Accepts maps; revision tasks open RevisionSession instead of detail.
  components/task-card.tsx  Accepts onStartRevision callback; routes revision tasks to it.
```

### Locked invariants

- **Intervals**: `[1, 3, 7, 14, 30, 60]` — Medium steps forward in this progression. Easy doubles (max 60). Hard resets to 1.
- **Phase transitions**: `not_started → in_revision` (first study, handled at onboarding); `in_revision → mastered` (5 non-Hard ratings across ≥30 days); `mastered → in_revision` (one Hard).
- **Difficulty history** — JSONB array appended every revision: `[{rating, date}, ...]`. Source of truth for transitions + analytics.
- **Skip moves to backlog** with state='active', priority='normal' — the decay formula reads `last_reviewed_at` to compute weight on read (PRD §2.5.3 + §11.2).
- **Linked task completion** — when a revision is launched from a /today task, submitting also marks the task complete + bumps plan counters. From /revision queue, only topic_state updates.
- **revision_sessions is append-only** (RLS) — every revision (and every skip) leaves a row for Disengagement Detection + analytics.

### Stubs deferred to later phases

- **All-Hard onboarding pattern prompt** (PRD §2.2.3) — `isAllHardFirstRevisionPattern` is implemented but the UX prompt ships in Phase 10 polish.
- **Question bank for recall step** (PRD §2.5.2 step 1) — not in V1. Self-quiz textarea replaces it.
- **Curated resource links per revision** (PRD §18) — full Phase 2 of business roadmap.
- **Skipped 3+ times = Disengagement signal** (PRD §2.5.3 last bullet) — recorded but signal aggregation lands later.

## Backlog Management (Phase 8)

`/backlog` UI + the streak protection during Recovery Mode (PRD §11).

### File map

```
app/(app)/backlog/
  page.tsx                Server — first-7-days gate, fetch + decorate items,
                           compute Health tier + Recovery state.
  backlog-client.tsx      Client — Priority / User-added / Other / Held groups +
                           AddBacklogModal + RecoveryModePrompt + RecoveryModeBanner.
  actions.ts              addBacklogItemsAction, holdBacklogItemAction,
                           resumeBacklogItemAction, skipBacklogItemAction,
                           addBacklogToTodayPlanAction, acknowledgeHeldNudgeAction,
                           enterBacklogRecoveryAction, exitBacklogRecoveryAction.
  components/
    health-indicator.tsx     4-tier label + computeHealthTier() (PRD §11.4).
    recovery-mode-prompt.tsx Shown at ≥25 backlog when not in recovery.
    recovery-mode-banner.tsx Active-recovery banner with "End Recovery Mode".
    backlog-row.tsx          Per-item row with Add-to-plan / Hold / Skip + held-nudge.
    add-backlog-modal.tsx    Chapter picker grouped by subject + priority radio.

app/(app)/today/page.tsx  Streak reset on Bad Day SKIPPED when an active
                          recovery_modes row exists (PRD §11.5.2).
```

### Locked invariants

- **First 7 days hide** (PRD §11.8) — `account_age_days < 7` → "Building your rhythm" placeholder.
  Items still computed silently for AI planning, never surfaced.
- **Priority weight computed live** from `original_date`, `last_reviewed_at`, and `state`/`priority`
  via `lib/utils/backlog-priority.ts`. Never stored — it drifts daily.
- **Recovery Mode is student-initiated only** (PRD §11.5, §11.10). The prompt shows at ≥25 active
  items; the student decides. Code never auto-enters.
- **End Recovery Mode button always visible** while active (PRD §11.5.2 locked trust feature).
- **Streak protection during recovery** — the Bad Day trigger on /today skips `streak_count = 0`
  when any recovery is active.
- **Add-to-plan uses state='redistributed'** to preserve audit. Skip permanently uses `DELETE`.
- **Held-nudge fires once** — 7 days after `held_since`, single soft prompt with "Hold longer"
  acknowledge action. After acknowledge, `nudge_sent=true` and it never re-shows.
- **Health tier thresholds** aligned with Recovery prompt threshold (25+) — both inflect at the
  same point so the UI tells a coherent story.

### Stubs deferred

- **Backlog count badge in Sidebar** — still hard-coded "8" in the design; Phase 10 polish wires
  the real count (and hides it for accounts < 7 days old).
- **Auto-exit recovery at <10 backlog** (PRD §11.5.2) — manual exit works; auto-exit happens at
  the next plan-gen if we encode it into the system prompt rule 3a. Phase 10.
- **Old-items bulk purge at 100+** (PRD §11.9 edge case) — not in V1.

## AI Chat (Phase 9)

Open chat at `/chat`. Calls Groq `llama-3.3-70b-versatile` with a brand-strict older-sibling system prompt and a JSON context snapshot of the student's current state.

### File map

```
lib/groq/chat.ts            CHAT_SYSTEM_PROMPT (locked) + sendChatMessage helper.
app/(app)/chat/
  page.tsx                  Server — friendly time-of-day greeting only.
  chat-client.tsx           Client — message list, composer, 4 suggested prompts,
                             auto-scroll, thinking-dots, "Regenerate" link to /today.
  actions.ts                sendChatTurnAction — builds context (profile, today's plan,
                             checkin, streak, recovery, backlog count, days_to_exam),
                             calls Groq with last 6 turns of history, returns reply text.
```

### Locked invariants

- **Chat is for EXECUTION, never CONTENT** — system prompt forbids academic answers.
  If asked for a formula or NCERT topic, the AI redirects: "I'd point you to your NCERT for that
  one — I'm here for the plan side."
- **Same banlist as plan generation** — "warrior", "champion", "conquer", "crush", "behind",
  "must", "should", motivational quotes. Plus ALL-CAPS and multi-`!`.
- **Context snapshot prepended** to every user turn in `[CONTEXT]…[/CONTEXT]` wrapping so the
  model can be specific without us doing a system-message reshuffle per turn.
- **Ephemeral conversation** — V1 keeps history in client state only. Refresh clears.
  Phase 11 can persist if we want continuity.
- **History clamped to last 6 turns** in the API call to keep latency low.
- **Regenerate is NOT triggered by the model** — there's a "Regenerate" link in the composer
  that takes the user to /today (where the reason-capture modal lives). The model can suggest
  hitting it in text.
