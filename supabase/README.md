# Supabase

Schema, row-level security, SQL functions and the audit log live in `migrations/` as plain SQL.
`seed.sql` is local-only development data. Edge functions (Phase 7+) go in `functions/`.

Everything about running the local stack, making schema changes, the access model and moving
to a hosted project is in `../docs/SUPABASE.md`. Short version:

```bash
npm run db:start    # Docker Desktop must be running
npm run db:reset    # apply migrations from scratch, then seed.sql
npm run db:types    # regenerate src/api/database.types.ts
```
