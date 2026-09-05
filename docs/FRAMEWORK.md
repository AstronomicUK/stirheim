# Project framework

Product name: **Stirheim**, full title **"Stirheim - Campaign Ledger"** (used on the landing page, page titles, app store style listings and documentation headers; "Stirheim" alone in the UI, repo and URLs). Named after the River Stir that flows through Mordheim. This document turns the
scoping decisions in `PLANNING.md` into a concrete build framework. It is the reference for
every later implementation session.

## 1. Goals

- Run a full Mordheim campaign for Tom's group on phones, end to end: build warbands, arrange
  and record battles, resolve the post-battle sequence, trade, level up, and see campaign
  history. Version 1 is functionally equivalent to the existing tracker's current feature set.
- Be openable to other groups afterwards without rework: real accounts, campaigns joined by
  invite code, no group-specific hardcoding, house rules as per-campaign settings.
- Reuse the rules data and the exact-probability combat engine already built in
  `mordheim-simulator`, and make the first post-v1 upgrade an in-battle attack calculator.

Non-goals for v1: full tabletop state tracking (wounds, turns, rout tests), the ~100-scenario
library, magic casting automation, payments or public discovery features.

## 2. Stack

| Layer | Choice | Why |
|---|---|---|
| Front end | React 18 + TypeScript + Vite, same toolchain as the simulator | Reuse engine and data with no translation; one build pipeline |
| Styling | Tailwind CSS, mobile-first, dark theme by default | Utility classes fit a phone-first app; matches the reference product's feel without copying it |
| Routing | React Router (nested routes, URL state for warband/campaign/match) | Deep links for "open this battle on my phone" |
| Client state | TanStack Query for server data, small Zustand store for wizard state, localStorage for drafts | Wizards must survive a phone lock and reload ("Continue Later") |
| Backend | Supabase: Postgres, Auth (email + password), Row Level Security, Realtime, Storage | Managed, free at this scale, no server to run |
| Server logic | Postgres functions and triggers for invariants; Supabase Edge Functions (Deno/TS) for multi-step writes such as "submit battle report" | Gains must apply atomically; RLS alone cannot express "apply all of this or none" |
| Hosting | Netlify static site; Supabase cloud | Same as the simulator's Netlify target |
| Testing | Vitest for rules and domain functions; Playwright for the wizards on a mobile viewport | Rules logic is where bugs hide; wizards are where regressions show |
| Tooling | oxlint as in the simulator, Prettier, GitHub Actions for test + deploy | Consistency with the sibling repo |

Rules and data are plain TypeScript modules shipped with the client, exactly as the simulator
does today. The database stores only player-created state and references rules entities by
stable string ids (for example `mercenaries_reikland`, `sword`, `combat_master`). This keeps
the database small, makes rules updates a deploy rather than a migration, and lets the battle
sheet work offline once loaded.

## 3. Architecture

```
apps/web (Vite React app)
  src/
    rules/        pure data + pure functions, no React, no IO   <- from simulator + new extraction
      data/       warband templates, unit types, equipment catalogue, skills, spells,
                  hired swords, scenarios, injury tables, advance tables, exploration chart,
                  income chart, XP thresholds
      engine/     combat probability engine (copied from simulator, unchanged)
      resolve/    applyInjury, resolveAdvance, resolveExploration, incomeFor, rating,
                  rarityTarget, canRecruit, validateRoster, applyHouseRules
    domain/       TypeScript types for persisted entities (mirrors DB schema) + zod schemas
    api/          Supabase client, typed queries and mutations, edge-function calls
    features/     one folder per screen group (roster, campaign, battle, postBattle,
                  trading, advancement, gm, scenarios, account, importer)
    ui/           shared components (stat line, dice input, item chip, wizard shell, sheets)
    app/          routes, layout, auth gate, theme
supabase/
  migrations/     SQL schema, RLS policies, functions, triggers
  functions/      edge functions: submit_battle_report, apply_advancement, purchase_item,
                  sell_wyrdstone, schedule_match, import_rr_csv (join_campaign is a SQL function)
  seed/           dev seed (a test campaign with two warbands)
docs/             this framework, planning, the the existing tracker walkthrough, ADRs as decisions change
reference/        rules Markdown and the simulator snapshot (read-only)
```

Principles:

1. **Rules are pure and tested.** Everything in `src/rules` is deterministic given inputs and
   dice values. Dice are inputs, never rolled inside rules code. This is what makes "players
   roll, app records" and "roll for me" the same code path.
2. **Server owns state transitions.** Creating a warband, recruiting, buying, selling, filing
   a report, applying an advance, promoting a henchman: each is one edge function or SQL
   function that validates against the rules (re-run server-side from the same TS rules
   package bundled into the Deno function) and writes atomically. The client never writes
   derived gold or XP directly.
3. **Everything is scoped to a campaign membership.** A warband exists on its own (roster
   list) and can be enrolled in a campaign; gold, wyrdstone, XP, injuries and history live on
   the warband, the campaign scopes matches and settings. Same model as the existing tracker, which proved
   simple for players.
4. **Manual edit is an escape hatch, logged.** Owner or GM can open the raw editor; every
   change is written to an audit table with actor and diff.
5. **Mobile first.** Every screen is designed at 390px wide first: single column, sticky action
   bar at the bottom, sheets instead of modals, big tap targets for dice and counters.

## 4. Data model (Postgres)

Built in Phase 3 as `supabase/migrations/20260904000001_schema.sql` (tables), `...02_rls.sql`
(policies and the join function) and `...03_audit.sql` (audit log). Ids are UUIDs. Columns
ending `_rules_id` are stable string keys into the shipped rules data. jsonb columns use the
same camelCase shapes as `src/rules/types/roster.ts`, so a row maps onto the resolver model
with no translation (`src/domain/roster.ts`).

- `profiles` (user_id, display_name) — created by trigger on sign-up from the
  `display_name` the sign-up form puts in user metadata
- `warbands` (id, owner_id, name, type_rules_id, gold, wyrdstone, veteran_pool, notes,
  archived) — owner cannot be changed (trigger)
- `heroes` (id, warband_id, name, is_hired_sword, unit_type_rules_id | hired_sword_rules_id,
  stats jsonb Stats, xp, level_ups, skill_tables text[], skills text[], spells text[],
  injuries jsonb AppliedInjury[], flags jsonb WarriorFlags, equipment_locked, is_large,
  status enum(active, dead, retired, captured, left), notes, sort_order)
- `henchman_groups` (id, warband_id, name, unit_type_rules_id, size, stats, xp, level_ups,
  stat_increases jsonb, is_large, notes, sort_order)
- `items` (id, warband_id, holder_type enum(stash, hero, group), holder_id, item_rules_id,
  custom_name, quantity, notes) — one row per stack; holder checked by trigger; deleting a
  warrior returns its items to the stash
- `campaigns` (id, gm_id, name, invite_code unique (generated `xxxx-xxxx`), settings jsonb
  CampaignSettings {startingGold, maxRosters, houseRules {strengthArmourPiercing,
  optionalCriticalTables, halfPriceArmour}, dicePolicy}, rules_markdown, archived)
- `campaign_members` (campaign_id, warband_id, user_id, joined_at, left_at) — user_id set by
  trigger to the warband owner; a warband is active in at most one campaign
- `scenarios` (id, owner_id, campaign_id nullable, name, setting, summary, rules_markdown) —
  custom scenarios only; built-ins ship with the client and are referenced by rules id
- `matches` (id, campaign_id, scenario_rules_id | custom_scenario_id, state enum(scheduled,
  in_progress, awaiting_reports, completed, cancelled), created_by, created_via enum(gm,
  challenge), scheduled_for, started_at, completed_at, notes)
- `match_participants` (match_id, warband_id, invited_at, accepted_at) — acceptance used for
  challenges
- `battle_sessions` (match_id, warband_id, live_state jsonb) — the in-progress sheet
- `match_reports` (id, match_id, warband_id, submitted_by, won, xp_log, ooa, injuries, loot,
  exploration jsonb, veteran_pool_roll, notes, submitted_at) — no update policy, so immutable
  once submitted; the GM may delete one so the player can resubmit
- `pending_advances` (id, warband_id, subject_type enum(hero, group), subject_id,
  threshold_xp, created_at, resolved_at, resolution jsonb)
- `trade_phase_state` (warband_id, match_id, wyrdstone_sold, heroes_searched uuid[])
- `audit_log` (id, at, actor_id, table_name, row_id, warband_id, campaign_id, action, reason,
  before jsonb, after jsonb) — filled by triggers on every table above except sessions and
  trade state; `reason` comes from `set_config('stirheim.audit_reason', ..., true)`

Row Level Security in one sentence each: users read and write their own warbands; campaign
members read every warband and match in their campaigns; the GM can additionally update
warbands and settings in their campaigns; reports are insert-once by the owning member;
scenarios are readable by all, writable by owner. Joining uses the SQL function
`join_campaign(invite_code, warband_id)` (and `campaign_preview(invite_code)` for the
confirmation screen) so nobody needs to read a campaign before belonging to it. Realtime is
enabled on matches, participants, sessions and reports. See `docs/SUPABASE.md`.

## 5. Rules data to extract (from `reference/rules`)

Already typed in the simulator snapshot: warband templates and unit types (72 + variant),
weapons with rules and material variants, skills, traits, to-hit/to-wound/crit/injury/armour
charts. Still to extract into `src/rules/data`:

1. Full equipment catalogue beyond weapons: armour, miscellaneous equipment, animals and
   mounts, with `price` as fixed or dice expression, `rarity` (Common or number), restriction
   text, category. Source: `02-weapons-armour-equipment.md` (251 items) and the trading post
   price lists in `03-*.md`.
2. Experience thresholds for heroes and henchmen; hero and henchman advance tables including
   the sub-rolls and "The lad's got talent"; racial characteristic maximums per warband.
3. Serious injury tables: heroes D66 with effects (stat changes, flags like Fear, "miss next
   game", captured, sold to the pits, multiple injuries re-roll), henchmen D6.
4. Exploration: shard yield by dice total, and the doubles through six-of-a-kind location
   chart with each location's sub-table and rewards.
5. Income chart (shards by warband size band), effective-size rule.
6. Trading rules: rarity target, one search per hero per phase, once-per-phase wyrdstone sale.
7. Hired Swords (hire, upkeep, stats, equipment, skill tables, restrictions, rating value).
8. Core rulebook scenarios: name, setting, summary, full rules text.
9. Warband-specific skill tables and special rules text where the simulator's templates only
   hold ids.
10. Spells and prayers lists (text only for v1).

Each extraction is a small script plus a Vitest snapshot test that checks counts and spot
values against the Markdown, in the same style the simulator used for its 72 templates.

## 6. Feature modules and screens (all phone-first)

1. **Auth & account**: sign up, sign in, reset password, display name, delete account.
2. **Rosters**: list (cap per account), create (name, type, starting gold), builder (available
   warriors with min/max, ledger, per-warrior equipment from the warband list with quantities,
   live gold and rating, finalise), roster view, print view, manual editor (labelled, logged).
3. **Campaigns (player)**: list, join by invite code choosing a warband, dashboard per warband
   (rating, gold, wyrdstone, upcoming and completed battles, strategic actions, rivals),
   battle records with filters and CSV export, campaign rules view.
4. **Campaigns (GM)**: create, invite code, members with remove, settings and house-rule
   switches, rules editor, schedule match (scenario + participants), awaiting reports, active
   battles, archive, cancel match, edit any warband (logged).
5. **Challenges**: issue to one or more rivals with a scenario, accept or decline, match
   created on full acceptance.
6. **Battle helper**: prepare (forces, scenario rules), begin, per-warband sheet (XP log,
   OOA toggles and counters, loot counters, treasure from catalogue or text, notes, opponent
   stats), end battle.
7. **Post-battle wizard**: injuries (D66 and D6 inputs with cheat sheet), experience
   (survivor bonus, itemised deeds), exploration (dice total, multiples, location sub-rolls,
   battle gains summary), veteran pool, final submission; continue-later persistence.
8. **Advancements**: pending list gated by thresholds; 2D6 entry or roll; skill pick from the
   unit's tables with full text; stat pick on the stat line respecting maximums; henchman
   promotion (name, two skill tables, immediate hero roll, group shrink or disband).
9. **Trading post & stash**: catalogue with search and filters, purchase with editable price
   and assignment, rarity search per hero with found / not found, wyrdstone sale by size band,
   stash and per-warrior inventory with move and sell, hired sword recruitment.
10. **Recruitment**: hire heroes and henchmen mid-campaign against caps, veteran pool for
    experienced henchmen.
11. **Scenarios**: library of core scenarios, custom scenario form (name, setting, summary,
    Markdown rules).
12. **Importer**: the existing tracker Battle Records CSV to matches and reports; guided roster entry.

## 7. Post-v1 roadmap

1. **Attack calculator in battle** (built in Phase 10, 2026-09-05, as the "Attack" tab of the
   battle sheet): pick attacker and defender from the two sheets; show to-hit, to-wound, armour
   save and injury odds from the engine; optional dice roll at each step with an out of action
   result logged to the attacker's Enemies out tally. See PLANNING.md "Phase 10 decisions".
2. Full scenario library, magic and prayer tracking, full tabletop state tracking, public
   sign-up hardening (rate limits, abuse reporting), campaign map support if the group wants it.

## 8. Phases and rough order of work

| Phase | Output | Depends on |
|---|---|---|
| 0 | Repo scaffold: Vite app, Tailwind, Supabase project, CI, copy rules and engine into `src/rules` | — |
| 1 | Rules data extraction (section 5) with tests | 0 |
| 2 | Domain resolvers in `src/rules/resolve` with tests: rating, thresholds, injuries, advances, exploration, income, rarity, roster validation, house-rule application | 1 |
| 3 | Schema, RLS, audit log, seed; auth screens | 0 |
| 4 | Rosters: create, builder, view, print, manual editor | 2, 3 |
| 5 | Campaigns: create, join, dashboard, GM console, settings, scenarios | 4 |
| 6 | Matches: schedule, challenge, battle helper, live session persistence | 5 |
| 7 | Post-battle wizard and submit edge function; battle records; CSV export | 6 |
| 8 | Advancements, trading post, stash, recruitment, hired swords | 7 |
| 9 | Importer from the existing tracker; group onboarding; polish and Playwright coverage | 8 |
| 10 | Attack calculator (first upgrade) | 9 |
| 11 | Combat mode, kit details, shield and gromril rules, calculator carry-over, advances in the wizard, report approval and amendment, suggested dice (see PLANNING.md "Phase 11") | 10 |
| 12 | Shared combat log with undo; the existing tracker roster import; roadmap items as agreed | 11 |

Phases 1 to 2 are pure TypeScript and can run in parallel with 3. Phases 4 onward each end
with something the group can try on their phones.

## 9. Risks and mitigations

- **Rules edge cases** (warband-specific injuries, promotions of multi-member groups, racial
  maximums): keep the manual editor and audit log so play never blocks on a bug.
- **Concurrency** (two players ending the same match, GM editing during a battle): all state
  changes go through server functions with row locks; live sheets are per participant.
- **Supabase free-tier limits**: fine for one group; revisit before opening up.
- **IP**: fan-compiled rules text for a private group tool; do not ship as a commercial product.
