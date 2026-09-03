# Stirheim - Campaign Ledger

Stirheim is a warband roster builder, campaign manager and post-battle helper for Mordheim,
modelled on the workflows of Relic & Ruin (relicandruin.net) and built on the rules data and
combat engine from the sibling `mordheim-simulator` project. Named after the River Stir that
flows through Mordheim.

Status (2026-09-03): **Phase 1 (rules data extraction) complete.** Live at
https://stirheim.netlify.app (Netlify, auto-deploys from `main`). See `docs/FRAMEWORK.md` for the full plan and
`docs/PLANNING.md` for every scoping decision.

## Development

```bash
npm install
npm run dev        # Vite dev server
npm test           # Vitest, rules and resolver tests
npm run lint       # oxlint
npm run build      # tsc -b && vite build -> dist/
```

Phases 0 to 2 need only Node. From Phase 3 the local Supabase stack needs Docker Desktop
(Apple silicon build) and the Supabase CLI.

## Folder layout

```
src/
  rules/          pure rules data and functions, no React, no IO
    engine/       exact-probability combat engine (from mordheim-simulator, unchanged)
    data/         warband templates, unit types, weapons, skills, traits (from the simulator);
                  further tables added in Phase 1
    resolve/      Phase 2: rating, thresholds, injuries, advances, exploration, income, trading
    types/        rules-level TypeScript types (from the simulator)
    domain/       opponent-scenario helpers (from the simulator)
  domain/         persisted entity types + zod schemas (mirror the DB schema)
  api/            Supabase client, typed queries and mutations
  features/       one folder per screen group
  ui/             shared components
  app/            routes, layout, auth gate, theme
supabase/
  migrations/     SQL schema, RLS, functions (Phase 3)
  functions/      edge functions (Phase 7+)
docs/
  FRAMEWORK.md                  stack, architecture, data model, phases
  PLANNING.md                   scoping questions and decisions
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
