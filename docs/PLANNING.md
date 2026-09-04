# Planning

## Open scoping questions

Answers get recorded in the Decisions section below as they arrive.

### A. Who and how many
1. Is this for Tom's own group only (the 8-warband map campaign) or something others could use?
2. Does every player need their own login, or is a shared campaign code enough?
3. Does the GM role matter (scheduling battles, removing warbands, house-rules text), or is
   everyone equal?

### B. Where the data lives
4. Local-first (browser storage + JSON import/export, no server) vs hosted (accounts, shared
   state, one source of truth per campaign) vs hybrid (local play, sync a match report).
5. If hosted: appetite for running a small backend (Supabase / Firebase / a tiny Go or Node
   API) vs staying on a free static host like Netlify.
6. Offline use at the table: needed (phones with no signal in a garage) or nice-to-have?

### C. Rules scope
7. Warbands: all 72 from mordheimer.net, or the six core plus the ones the group actually plays?
8. Optional rules and house rules the group uses (e.g. the simulator already disables Strength
   armour erosion by house rule). Which need to be switches?
9. Scenarios: do we need the full ~100-scenario library with rules text, or just the core
   rulebook scenarios plus the ability to type a custom one?
10. Hired Swords and Dramatis Personae: in scope for v1?
11. Magic: spell lists and casting tracking in the battle helper, or just a text list on the
    roster?

### D. Features and order
12. Minimum useful first release: roster builder + post-battle wizard + trading + advancements
    (single-player) seems the natural core. Agree?
13. Battle helper depth: R&R's XP / out-of-action tally only, or real wound, turn and rout
    tracking?
14. Embed the combat-odds simulator as a tab inside a battle?
15. Printing / PDF roster sheets: needed?
16. Importing the existing campaign from Relic & Ruin: manual re-entry acceptable, or worth
    building a CSV import from its Battle Records export?

### E. Look and feel
17. Reuse the simulator's visual style, or start a new dark "grimdark ledger" style like R&R?
18. Mobile-first (phones at the table) or desktop-first?

## Decisions

Recorded 2026-09-03 from Tom's answers.

- **Audience (Q1–2):** Tom's group first, but designed from day one so it can be opened to other
  players once the group has tested it thoroughly. Implies real accounts, per-campaign access
  via invite code, and no group-specific hardcoding.
- **Backend (Q4–5):** Managed service, Supabase (Postgres + Auth + Realtime), static front end
  on Netlify.
- **Rules scope (Q7):** All 72 mordheimer.net warbands, plus The Restless Dead (Variant) with the
  Bone Golem / Bone Goliath, which is already in the simulator's data
  (`reference/simulator-src/data/warbandTemplates/variants.ts` and
  `reference/rules/warbands/restless-dead-variant.md`).
- **First release (Q12):** The full suite, equivalent to a version 1 of Relic & Ruin: roster
  builder, post-battle wizard and advancements, trading post and stash, live battle helper,
  campaign membership with scheduling, match reports and records, GM console.
- **Battle helper (Q13–14):** v1 matches Relic & Ruin (XP tally, out-of-action, loot, notes,
  opponent stats). **First planned upgrade after v1:** an attack calculator inside the battle —
  pick one of your warriors and one enemy model, see the to-hit and to-wound targets (and
  armour save), with an optional dice roll button at each stage. This reuses the simulator's
  engine (`reference/simulator-src/engine`), so the data model must keep full stat lines,
  weapons with rules, skills and traits for every model on both sides.
- **Scenarios (Q9):** core rulebook scenarios with full rules text plus a custom-scenario form.
  Full ~100 library is a later addition.
- **Devices (Q18):** mobile-first for everything, including roster building and GM tools.
  Design for one-handed phone use; desktop is the secondary layout.
- **Existing data (Q16):** import the current Relic & Ruin campaign. Build an importer for its
  Battle Records CSV export plus a guided re-entry (or paste) of the 8 rosters.
- **Sign-in:** email and password (Supabase Auth), with password reset by email.
- **Dice policy:** players roll physical dice and enter results; the app applies the rules. An
  optional "roll for me" button is available at every dice step.
- **GM powers (Q3):** GM can edit any warband in the campaign (logged as GM edits) and set
  campaign house rules and settings. Scheduling is *not* GM-only (players can arrange matches
  too); battle reports do *not* need GM approval.
- **House rules (Q8) needed as per-campaign switches:** Strength armour-save erosion off;
  optional critical hit tables; half-price armour (excluding shields and helmets), rounding
  down. Plus a free-text house-rules document.

- **Environments:** develop against a local Supabase stack (Supabase CLI + Docker) with all
  schema in `supabase/migrations`; create the free hosted project when the group starts
  testing and push the same migrations. Netlify account exists; Supabase account to be created
  then. Free tier is expected to be enough for the group phase; watch the inactivity pause.
- **R&R test data:** Tom will delete the ZZ TEST campaign and rosters himself.
- **App name (confirmed 2026-09-03):** **Stirheim**, full title **"Stirheim - Campaign Ledger"**
  where a descriptive title is appropriate. After the River Stir, which flows through Mordheim
  and divides the city (core rulebook, Sisters of Sigmar background). Domains
  stirheim.com/.app/.net showed no DNS records on 2026-09-03; register before launch.

## Phase 3 decisions (2026-09-04)

- **Schema lives in three SQL migrations** under `supabase/migrations/`, applied by the CLI in
  filename order; `supabase/seed.sql` is local-only dev data (two accounts, two warbands, one
  campaign with invite code `test-2026`). Details and conventions: `docs/SUPABASE.md`.
- **Hired swords share the `heroes` table** (`is_hired_sword`, `hired_sword_rules_id`,
  `equipment_locked`) rather than a table of their own; the domain mapper splits them back out
  into `RosterWarband.hiredSwords`. Status `left` is a hired sword leaving; for a hero it maps
  to `retired`.
- **Custom scenarios only in the database.** The ~100 built-in scenarios ship with the client;
  a match references either a rules id or a custom scenario row.
- **Joining a campaign is a SQL function**, not an edge function: `join_campaign` runs as
  definer, validates the code, ownership, archive state and `maxRosters`, and re-opens an old
  membership if the same warband rejoins. There is deliberately no insert policy on
  `campaign_members`.
- **Match reports are immutable by policy** (no UPDATE policy). The GM can delete one so the
  player resubmits; that deletion is audited.
- **Audit is trigger-based** on warbands, warriors, items, campaigns, memberships, matches,
  reports and pending advances, recording actor, before and after. The app labels
  transactions via `set_config('stirheim.audit_reason', 'manual_edit', true)`.
- **Campaign settings jsonb uses the TypeScript names** (`houseRules.halfPriceArmour`), not
  snake_case, so the same object flows from the form to the resolvers. Defaults: 500 gc,
  no roster cap, house rules off/on/on, players roll.
- **Docker Desktop quirks on Tom's Mac** (socket path, Resource Saver stopping the VM during
  the first image pull) are documented in `docs/SUPABASE.md`; the `db:*` npm scripts set
  `DOCKER_HOST` so `supabase` finds the engine.
- **Local email confirmations are off** (`supabase/config.toml`) so seed accounts sign in
  immediately; the hosted project should keep them on. Password-reset mails land in the local
  Mailpit at http://127.0.0.1:54324.

## Known gaps in the scraped rules (found starting Phase 1, 2026-09-03)

The mordheimer.net scrape in `reference/rules` is missing three things the app needs. Filled
from canonical rulebook values where possible, otherwise left as typed optional fields to be
populated by a follow-up scrape:

1. **Wyrdstone income chart** — RESOLVED 2026-09-03. The site renders it as an image
   (`reference/rules/wyrdstone-income-table.jpg`); the encoded values match it exactly.
2. **Hired Swords and Dramatis Personae** — RESOLVED 2026-09-03 by rescraping the grade pages
   into `reference/rules/04-hired-swords.md` and `05-dramatis-personae.md`; full detail is being
   extracted into the `detail` fields.
3. **Scenarios** — RESOLVED 2026-09-03 by rescraping all 103 scenario pages into
   `reference/rules/06-scenarios.md`; full rules text is being extracted per scenario. The
   campaign-setting scenario sets (Border Town Burning etc.) are not yet scraped.
5. **Scraper uncertainty markers.** About 55 equipment rule texts carried "❓" or "✏️" markers
   from the mordheimer.net scrape (transcription doubts, mostly "takes a complete turn to
   reload" on blackpowder weapons, Lance cavalry bonus, Gromril/Ithilmar armour). Stripped from
   `src/rules/data/items/*.ts`; the markers remain in `reference/rules/02-*.md` for review.
6. **Magical artefacts** are unique per campaign per the source; nothing enforces that yet.
4. **XP thresholds** are not stated in the text (they are boxes on the roster sheet); encoded
   from the rulebook: heroes 2,4,6,8,11,14,17,20,24,28,32,36,41,46,51,57,63,69,76,83,90 and
   henchmen 2,5,9,14.

Assumptions taken without asking (flag if wrong):
- Players may edit only their own warbands through the rules-driven flows; a labelled manual
  editor exists for corrections (as in R&R), and the GM's edits are logged.
- A challenge needs acceptance from every challenged warband; a GM-scheduled match does not.
- Each participant files their own battle report; the match completes when all are in. The
  two sides' "did you win" answers may disagree, and the GM console shows both.
- Rating = 5 per model + total XP, with hired swords and large creatures per the rulebook.

The full framework (stack, architecture, modules, data model, phases) is in `FRAMEWORK.md`.

## Phased plan (draft, to be revised after the answers)

1. **Data extraction** from `reference/rules/03-campaigns-magic-optional-rules.md`: XP
   thresholds, hero and henchman advance tables, serious injury tables (D66 and D6),
   exploration chart with sub-tables, income chart, trading rarity rules, hired swords.
   Extend the equipment DB from weapons-only to the full catalogue (armour, misc, animals).
2. **Domain model**: Warband, Hero, HenchmanGroup, Item, Campaign, Match, MatchReport,
   Challenge as sketched in the walkthrough notes. Pure functions for rating, thresholds,
   advance resolution, injury application, exploration resolution, income.
3. **Roster builder** (template-driven recruitment, equipment lists, validation, rating).
4. **Post-battle wizard** (injuries, experience, exploration, submission) and
   **advancements** (skill pick, stat pick, promotion).
5. **Trading post and stash** (rarity rolls, one search per hero, wyrdstone sale by size).
6. **Battle helper** (per-warband sheet, XP and OOA tally, loot, opponent view).
7. **Campaign layer** (memberships, scheduling, match lifecycle, reports, records, GM tools)
   with whatever sync model is chosen in B.
8. Printing, import, polish.
