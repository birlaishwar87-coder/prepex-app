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
- [ ] **Phase 2** — Supabase schema + RLS + migrations
- [ ] **Phase 3** — Auth (Google + email/phone)
- [ ] **Phase 4** — Onboarding flow (7 steps)
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
  supabase/client.ts          getSupabaseBrowserClient()
  supabase/server.ts          getSupabaseServerClient(), getSupabaseAdminClient()
  groq/client.ts              getGroqClient() — server-only, GROQ_PLAN_MODEL constant
  analytics/mixpanel.ts       initMixpanel, track, identify, resetMixpanel + PrepexEvent type
  analytics/mixpanel-provider.tsx  Client provider that calls initMixpanel once
```
