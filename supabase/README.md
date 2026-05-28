# Prepex · Supabase

This folder holds the **source-of-truth migrations** for the Prepex database.

## Folder structure

```
supabase/
├── README.md            (this file)
└── migrations/
    ├── 20260528000001_phase2_extensions_and_enums.sql
    ├── 20260528000002_phase2_core_tables.sql
    ├── 20260528000003_phase2_triggers.sql
    ├── 20260528000004_phase2_rls_policies.sql
    └── 20260528000005_phase2_seed_chapters.sql
```

Migrations are committed to git so the schema is fully replayable. Filenames use the standard Supabase CLI prefix format (`YYYYMMDDHHMMSS_<snake_case_name>.sql`).

## How migrations get applied

Claude applies them via the **Supabase MCP** `apply_migration` tool, project `pqjufzuljwiujvzlqdlf`. The MCP records each migration in `supabase_migrations.schema_migrations` so they aren't replayed.

If you ever need to apply manually:

1. Install Supabase CLI: `npm install -g supabase` (or via scoop/brew)
2. `supabase link --project-ref pqjufzuljwiujvzlqdlf`
3. `supabase db push`

## Conventions

- **All tables have RLS enabled.** Users see only their own rows. `chapters` is global read-only.
- **`user_id` is stored on every user-scoped row** for direct RLS check (no join needed).
- **Soft delete is not used** — Postgres `on delete cascade` from `auth.users` removes everything when a user closes their account (DPDP Act §B.6 compliance).
- **Backlog priority weight is COMPUTED in app**, not stored. Formula: `max(0.2, 1.0 - days_overdue × 0.05)`. Source columns: `original_date`, `last_reviewed_at`.
- **Trigger functions use `SECURITY DEFINER` with `set search_path = ''`** — every schema-qualified call must be explicit (`public.x`, `auth.x`).

## TypeScript types

Generated types live at `lib/supabase/database.types.ts`. Re-generate after any schema change via MCP `generate_typescript_types`.
