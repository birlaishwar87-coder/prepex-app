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
| 2 | Supabase schema + RLS + migrations | ✅ Done |
| 3 | Auth — Google OAuth + email/password (phone OTP deferred) | ✅ Done |
| 4 | Onboarding flow (7 steps) | ✅ Done |
| 5 | Groq plan-generation engine | ✅ Done |
| 6 | Daily Plan home (real UX) | ✅ Done |
| 7 | Revision Scheduler (algorithm + session UI) | ✅ Done |
| 8 | Backlog Management (decay, health, Recovery Mode) | ✅ Done |
| 9 | AI Chat (Groq plan adjustments) | ✅ Done |
| 10 | Settings + Wellness + polish | ✅ Done |
| 11 | Mixpanel wiring + deploy prep | ⏳ Next |

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

## Production deploy

### 1. Push to GitHub
```powershell
gh repo create prepex-app --private --source . --remote origin --push
# or set the remote manually if you already have a GitHub repo
```

### 2. Vercel project
Import the GitHub repo into Vercel. Framework auto-detects (Next.js 14). No build setting changes required.

### 3. Vercel env vars
Set these in **Project Settings → Environment Variables** (mark all as Production + Preview):

| Name | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pqjufzuljwiujvzlqdlf.supabase.co` | Same as dev |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_…` | Same as dev |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role secret | Same as dev |
| `GROQ_API_KEY` | Groq key | Free at console.groq.com |
| `ANTHROPIC_API_KEY` | optional — Claude | If set, AI uses Claude instead of Groq |
| `NEXT_PUBLIC_MIXPANEL_TOKEN` | Mixpanel token | Optional but recommended for V1 launch |

### 4. Supabase dashboard — production redirects
Once Vercel gives you a production domain (e.g. `prepex.vercel.app` or your custom domain):

1. **Authentication → URL Configuration → Site URL** → `https://your-domain.com`
2. **Authentication → URL Configuration → Redirect URLs** → add `https://your-domain.com/auth/callback`
3. **Authentication → Sign in/up → Email** → turn **Confirm email** back ON for production (it's OFF for dev convenience). The signup action already self-confirms via service role for now — strip that block in `app/(auth)/signup/actions.ts` before launch if you want real email verification.
4. **Authentication → Providers → Google** (if used) → in your Google Cloud OAuth client, add the production redirect URI: `https://pqjufzuljwiujvzlqdlf.supabase.co/auth/v1/callback`. Already there for the dev domain.

### 5. Domain
Vercel → Project → Settings → Domains. Point your custom domain. Update Supabase Site URL.

### 6. Smoke test the deploy
- Open the production URL
- Sign up with a fresh email → should land on `/onboarding`
- Complete onboarding → `/today`
- Generate a plan → tasks appear
- Open `/chat` → send a message → reply within 5 seconds
- Open `/backlog` → "Building your rhythm" for new users (first 7 days)
- Open `/settings` → edit goal → save persists

### 7. Optional: Claude for AI surfaces
If chat replies feel weak with Groq's llama-3.3 and you want to pay for better quality:

1. Get an Anthropic API key: https://console.anthropic.com/settings/keys
2. Set `ANTHROPIC_API_KEY` on Vercel
3. Optional: override `ANTHROPIC_PLAN_MODEL` / `ANTHROPIC_CHAT_MODEL` (defaults to `claude-haiku-4-5`)
4. Redeploy

The provider auto-switches based on env. No code change.

## Locked PRD rules (must not deviate)

See [`CLAUDE.md`](./CLAUDE.md) for the full set. Highlights:
- **Revision intervals**: +1, +3, +7, +14, +30, +60. Hard→1, Medium→continue, Easy→×2.
- **Backlog priority decay**: `max(0.2, 1.0 - days_overdue × 0.05)`. Floor 0.2.
- **Recovery Mode**: student-initiated only at 25+, 50/30/20 split, streak protected.
- **First 7 days**: backlog count hidden.
- **Bad Day Protocol**: 2+ inactive days. No backlog dump on return. Streak silently resets.
- **Brand banlist**: "warrior", "champion", "must", "should", "behind", "crush", "missed".

## Reference docs

- PRD: `../Prepex Co worker/Prepex_PRD_v1_COMPLETE.pdf`
- Brand guide: `../Prepex Co worker/Prepex_Brand_Identity_Guide.pdf`
- Reference designs: `../prepex design jsx/` (JSX) and `../Claude designs/` (HTML)
