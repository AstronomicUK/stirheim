# Stirheim - Campaign Ledger

Stirheim is a warband roster builder, campaign manager and post-battle helper for Mordheim,
modelled on the workflows of Relic & Ruin (relicandruin.net) and built on the rules data and
combat engine from the sibling `mordheim-simulator` project. Named after the River Stir that
flows through Mordheim.

Status (2026-09-04): **Phase 9 (Relic & Ruin importer, onboarding, help, installable app, code splitting, Playwright e2e) complete.** Live at
https://stirheim.netlify.app (Netlify, auto-deploys from `main`). See `docs/FRAMEWORK.md` for the full plan and
`docs/PLANNING.md` for every scoping decision.

## Development

```bash
npm install
npm run dev        # Vite dev server
npm test           # Vitest, rules and resolver tests
npm run lint       # oxlint
npm run build      # tsc -b && vite build -> dist/

npm run db:start   # local Supabase stack (Docker Desktop + Supabase CLI), see docs/SUPABASE.md
npm run db:reset   # re-apply migrations and the dev seed
npm run db:types   # regenerate src/api/database.types.ts from the local schema
npm run test:integration   # RLS tests against the local stack (needs keys, see docs/SUPABASE.md)
```

Rules and resolvers need only Node. The database work needs Docker Desktop (Apple silicon
build) and the Supabase CLI; copy `.env.example` to `.env.local` and paste the anon key from
`npm run db:status`. Seed sign-ins: gm@stirheim.test / player@stirheim.test, password
`stirheim-dev`.

## Testing

Three layers, from fastest to slowest:

| Command | What runs | Needs |
|---|---|---|
| `npm test` | Vitest: rules, resolvers, domain mappers, screen helpers (`src/**/*.test.ts`) | Node only |
| `npm run test:integration` | RLS and SQL-function tests in `src/api/__tests__/*.integration.test.ts` | local Supabase (`npm run db:start`) and `.env.local` |
| `npm run e2e` | Playwright, the real app in Chromium on a Pixel 7 viewport (`e2e/*.spec.ts`) | local Supabase, `.env.local`, Chromium (`npx playwright install chromium`) |

The e2e suite drives the wizards end to end: sign-in, the warband builder, the campaign join
screen and dashboard, a whole match (schedule, battle sheet, both post-battle reports, battle
records) and the between-battles screens (trading post, recruitment, advances). Dice are typed,
never rolled, so every run records the same result.

- **Fresh seed every run.** `e2e/global-setup.ts` runs `npm run db:reset` once before the first
  spec, then waits until the auth service accepts the seed GM's password again. Set
  `E2E_SKIP_RESET=1` to skip the reset when iterating on one spec against the current data.
- **One worker, files in order.** All specs share the one seeded database, so they run serially
  and the file names are numbered (`01-auth`, `02-builder`, ... `05-between-battles`); the match
  spec is `serial` because its tests hand the match id along.
- **Dev server.** `playwright.config.ts` reuses a running `npm run dev` on port 5174 or starts one.
- **One spec / one test:** `npx playwright test e2e/04-match.spec.ts` or
  `npx playwright test -g "trading post"`. `npm run e2e:ui` opens the Playwright UI; a failed test
  leaves a trace under `test-results/` (`npx playwright show-trace <trace.zip>`).

CI (`.github/workflows/ci.yml`) runs lint, unit tests and the build first, then a second job that
starts a local Supabase stack with the CLI (`supabase start`, which applies the migrations and
`seed.sql`), writes `.env.local` from `supabase status`, installs Chromium and runs the same e2e
suite. The Playwright report is uploaded as an artifact when it fails.

## Folder layout

```
src/
  rules/          pure rules data and functions, no React, no IO
    engine/       exact-probability combat engine (from mordheim-simulator, unchanged)
    data/         warband templates, unit types, weapons, skills, traits (from the simulator);
                  further tables added in Phase 1
    resolve/      rating, thresholds, injuries, advances, exploration, income, trading,
                  recruitment, roster validation, warband builder draft model
    types/        rules-level TypeScript types (from the simulator)
    domain/       opponent-scenario helpers (from the simulator)
  domain/         zod schemas for every table row + row <-> RosterWarband mappers
  api/            Supabase client, auth wrappers, generated database.types.ts, RLS tests
  features/       one folder per screen group (account, roster, campaign, scenarios, match,
                  postBattle, records)
  ui/             shared components
  app/            router, app shell, session store, auth gate
supabase/
  migrations/     SQL schema, RLS policies and functions, audit log
  seed.sql        local dev data (never pushed)
  functions/      edge functions (Phase 7+)
docs/
  FRAMEWORK.md                  stack, architecture, data model, phases
  PLANNING.md                   scoping questions and decisions
  SUPABASE.md                   local stack, schema changes, access model, hosting steps
  relic-and-ruin-walkthrough.md hands-on notes on the reference product
reference/
  rules/                        verbatim mordheimer.net rules as Markdown (start at 00-index.md)
  simulator-src/                read-only snapshot of mordheim-simulator/src taken 2026-09-03
```

## Provenance and licensing

- Rules text is from mordheimer.net, a fan compilation of Games Workshop material. Fine for a
  private group tool; not for commercial redistribution.
- Relic & Ruin was studied for its workflows and data model only. No text, artwork or CSS from
  that site is used here.
