# Prepex

Plan · Execute · Survive · Win.

The execution app for JEE aspirants. Real prep that shows up — even on bad days.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Framer Motion** for transitions
- **Supabase** — Postgres + Auth + Storage (with `@supabase/ssr`)
- **Groq** — `llama-3.3-70b-versatile` for AI plan generation (server-only)
- **Mixpanel** — browser analytics
- **Lucide React** — icons

## Setup

```powershell
# From this folder
npm install
cp .env.example .env.local
# Fill in real values in .env.local — Supabase URL/keys, Groq API key, Mixpanel token.

npm run dev
# http://localhost:3000
```

The app boots without any env vars filled in — Supabase + Groq clients fail loudly only when actually called, and Mixpanel is a no-op when its token is missing.

## Phase status

| Phase | What | Status |
|---|---|---|
| 1 | Project setup, design tokens, base components, routing skeleton | ✅ Done |
| 2 | Supabase schema + RLS + migrations | ⏳ Next |
| 3 | Auth — Google + email/phone | ⏳ |
| 4 | Onboarding flow (7 steps) | ⏳ |
| 5 | Groq integration + plan generation engine | ⏳ |
| 6 | Daily Plan home | ⏳ |
| 7 | Revision Scheduler | ⏳ |
| 8 | Backlog Management | ⏳ |
| 9 | AI Chat | ⏳ |
| 10 | Settings + polish | ⏳ |
| 11 | Mixpanel wiring + deploy prep | ⏳ |

## Routes (Phase 1 skeleton)

- `/` — Landing (placeholder hero)
- `/login`, `/signup` — Auth screens (Phase 3)
- `/onboarding` — 7-step onboarding (Phase 4)
- `/today` — Daily Plan home (Phase 6)
- `/revision` — Revision queue (Phase 7)
- `/backlog` — Backlog Management (Phase 8)
- `/chat` — AI Chat (Phase 9)
- `/settings` — Profile + preferences (Phase 10)
- `/dev/preview` — internal primitives preview (remove or gate before launch)

## Reference docs

- PRD: `../Prepex Co worker/Prepex_PRD_v1_COMPLETE.pdf`
- Brand guide: `../Prepex Co worker/Prepex_Brand_Identity_Guide.pdf`
- Reference designs: `../prepex design jsx/` (JSX) and `../Claude designs/` (HTML)

See [`CLAUDE.md`](./CLAUDE.md) for build conventions, locked PRD rules, and phase-by-phase memory.
