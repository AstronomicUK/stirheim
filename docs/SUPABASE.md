# Supabase: local development and hosting

Stirheim stores only player-created state in Postgres; every rule, table and warband template
ships with the client. The database is therefore small: 15 tables plus an audit log, defined as
plain SQL in `supabase/migrations/` and applied in filename order.

## Local stack

Requirements: Docker Desktop (Apple silicon build) running, and the Supabase CLI
(`brew install supabase/tap/supabase`).

```bash
supabase start        # first run pulls ~2 GB of images; later runs take seconds
supabase status       # prints API URL, anon key, Studio URL
supabase db reset     # drop, re-run all migrations, then supabase/seed.sql
supabase stop         # keeps data; `supabase stop --no-backup` wipes it
```

Local URLs: API `http://127.0.0.1:54321`, Mailpit mail catcher `http://127.0.0.1:54324`
(password-reset and confirmation emails land here). Studio is disabled in `config.toml`
(`[studio] enabled = false`) because starting its container wedged Docker Desktop on Tom's Mac;
flip it back on if you want the web UI, or use psql:

```bash
docker exec -it supabase_db_stirheim psql -U postgres
```

Copy `.env.example` to `.env.local` and paste the anon key from `supabase status`. The Vite dev
server (`npm run dev`, port 5174) then talks to the local stack. Sign in with either seed
account:

| Email | Password | Role |
|---|---|---|
| gm@stirheim.test | stirheim-dev | GM of "Ruins of the Stir", owns Reikland Watch |
| player@stirheim.test | stirheim-dev | Owns Claws of Eshin, enrolled in the campaign |

Invite code for the seed campaign: `test-2026`.

## Docker Desktop on this Mac: two gotchas

- **Socket path.** Docker Desktop does not create `/var/run/docker.sock` unless "Allow the
  default Docker socket to be used" is ticked in Settings > Advanced. The Supabase CLI looks
  there, so either tick that box or export the Desktop socket before running it:

  ```bash
  export DOCKER_HOST="unix://$HOME/.docker/run/docker.sock"
  ```

  The `db:*` npm scripts in `package.json` set this for you.
- **Resource Saver.** Docker Desktop stops its Linux VM after five minutes with no running
  container, and an image pull does not count as activity. The first `supabase start` pulls
  about 2 GB, so it stalls silently. Either untick Settings > Resources > Advanced >
  Resource Saver, or keep a tiny container running while it pulls:

  ```bash
  docker run -d --name stirheim-keepalive --restart unless-stopped alpine:3.22 sleep infinity
  ```

  Once the Supabase containers exist and are running, Resource Saver is no longer a problem.

## Making a schema change

1. `supabase migration new <name>` creates an empty timestamped file in `supabase/migrations/`.
2. Write the SQL. Keep the conventions in the header of `20260904000001_schema.sql`.
3. `supabase db reset` to apply from scratch and check the seed still loads.
4. Regenerate the TypeScript types the client uses:

   ```bash
   npm run db:types
   ```

5. Run `npm test`. The RLS integration tests (`src/api/__tests__/*.integration.test.ts`) only
   run when `SUPABASE_LOCAL=1` is set, because they need the local stack.

## Access model

Row Level Security is on for every table and anonymous users can read nothing. The predicates
live in `20260904000002_rls.sql`:

- `owns_warband`, `can_read_warband`, `can_edit_warband`: owner; anyone sharing an active
  campaign may read; the GM of that campaign may edit (audited).
- `is_campaign_gm`, `is_campaign_member`, `can_read_campaign`.
- Joining goes through the `join_campaign(invite_code, warband_id)` function so nobody needs to
  read a campaign before they belong to it. `campaign_preview(invite_code)` shows the name, GM
  and member count for the confirmation screen.
- Match reports have no update policy: they are immutable once submitted. The GM can delete one
  so the player can resubmit.
- `owner_id` (warbands, scenarios) and `gm_id` (campaigns) default to `auth.uid()`, so the client
  never sends them. Their SELECT policies test that column on the row itself before falling back
  to the helper functions: a STABLE helper cannot see a row inserted by the current statement,
  so `insert ... returning` would otherwise fail its select check with a misleading
  "violates row-level security policy" error.

Roster writes go through SQL functions, all SECURITY INVOKER so RLS still applies. The client
never inserts roster rows directly.

| Function | Migration | Purpose |
|---|---|---|
| `create_warband(payload)` | 4 | Warband, warriors and items in one transaction. |
| `update_roster(warband_id, reason, changes)` | 4, re-created in 8 | A batch of whitelisted row changes, atomic, audited with `reason` (`manual_edit`, `trading`, `recruitment`, `advancement`, `post_battle`, ...). Since migration 8 an `insert` honours the change's `id` (uuid) so items can reference a warrior created earlier in the same batch. |
| `join_campaign(invite_code, warband_id)`, `leave_campaign`, `campaign_preview`, `regenerate_invite_code` | 5 | Membership without reading the campaign first. |
| `schedule_match`, `respond_to_challenge`, `start_match`, `end_match`, `cancel_match`, `save_battle_session` | 6 | Match lifecycle and the live battle sheet. |
| `submit_battle_report(match_id, warband_id, report)`, `withdraw_battle_report` | 7 | File a post-battle report and apply its roster patches; GM removes one. |
| `resolve_pending_advance(advance_id, resolution, changes)` | 8 | Apply an advance's roster changes (reason `advancement`) and close the `pending_advances` row; refuses one already resolved. |
| `record_trade(warband_id, match_id, changes, wyrdstone_sold, heroes_searched)` | 8 | Apply a trading-post batch (reason `trading`); with a match, enforce and record the once-per-phase limits in `trade_phase_state`. `match_id` null = no limits. |

Every write to warbands, warriors, items, campaigns, memberships, matches and reports is
recorded in `audit_log` with the acting user and the row before and after. The app can label a
transaction (`set_config('stirheim.audit_reason', 'manual_edit', true)`) so GM edits and manual
editor changes are distinguishable in the history.

## Hosted project (when the group starts testing)

1. Create a free project at supabase.com (region: London). Note the project ref.
2. `supabase link --project-ref <ref>` then `supabase db push` applies the same migrations. Do
   not push `seed.sql`; it is local only.
3. Authentication > URL configuration: Site URL `https://stirheim.netlify.app`, add
   `https://stirheim.netlify.app/**` to the redirect list.
4. Authentication > Providers > Email: keep "Confirm email" on for the hosted project.
5. Netlify > Site configuration > Environment variables: `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` from Project Settings > API. Redeploy.
6. Free-tier projects pause after a week without traffic. A weekly scheduled ping (Netlify
   scheduled function or a cron hitting the REST endpoint) keeps it awake; see
   `docs/PLANNING.md`.
