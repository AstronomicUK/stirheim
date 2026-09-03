# Supabase

Phase 3 onward. Schema, row-level security and SQL functions live in `migrations/` as plain
SQL so they can be written and reviewed before any database runs. Edge functions live in
`functions/`.

Local development uses the Supabase CLI with Docker Desktop (Apple silicon build):

```bash
brew install supabase/tap/supabase
supabase init      # once, creates config.toml
supabase start     # local Postgres, Auth, Realtime, Studio at http://localhost:54323
supabase db reset  # apply migrations from scratch
```

When the group starts testing, create a free hosted project, then `supabase link` and
`supabase db push` the same migrations. See `docs/FRAMEWORK.md` sections 2 and 4.
