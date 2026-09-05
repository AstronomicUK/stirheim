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
13. Battle helper depth: the existing tracker's XP / out-of-action tally only, or real wound, turn and rout
    tracking?
14. Embed the combat-odds simulator as a tab inside a battle?
15. Printing / PDF roster sheets: needed?
16. Importing the existing campaign from the existing tracker: manual re-entry acceptable, or worth
    building a CSV import from its Battle Records export?

### E. Look and feel
17. Reuse the simulator's visual style, or start a new dark "grimdark ledger" style like the existing tracker?
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
- **First release (Q12):** The full suite, equivalent to a version 1 of the existing tracker: roster
  builder, post-battle wizard and advancements, trading post and stash, live battle helper,
  campaign membership with scheduling, match reports and records, GM console.
- **Battle helper (Q13–14):** v1 matches the existing tracker (XP tally, out-of-action, loot, notes,
  opponent stats). **First planned upgrade after v1:** an attack calculator inside the battle —
  pick one of your warriors and one enemy model, see the to-hit and to-wound targets (and
  armour save), with an optional dice roll button at each stage. This reuses the simulator's
  engine (`reference/simulator-src/engine`), so the data model must keep full stat lines,
  weapons with rules, skills and traits for every model on both sides.
- **Scenarios (Q9):** core rulebook scenarios with full rules text plus a custom-scenario form.
  Full ~100 library is a later addition.
- **Devices (Q18):** mobile-first for everything, including roster building and GM tools.
  Design for one-handed phone use; desktop is the secondary layout.
- **Existing data (Q16):** import the current the existing tracker campaign. Build an importer for its
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
- **the existing tracker test data:** Tom will delete the ZZ TEST campaign and rosters himself.
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

## Phase 4 decisions (2026-09-04)

- **Builder is a pure draft model** (`src/rules/resolve/builder.ts`): the screen only calls
  `newWarbandDraft`, `addDraftHero`, `addDraftEquipment`, `draftCosts`, `validateDraft`,
  `draftToCreatePayload`. Drafts persist in localStorage so a phone lock does not lose them.
- **Equipment-list costs are parsed from the source strings** (`equipmentCost.ts`): "1st free/2 gc"
  gives one free dagger per model, "15 gc (30 for a brace)" prices pairs, "3 times the cost" and
  similar are `unknown` and the player types the price. 62 distinct cost strings are covered.
- **Equipment-list names map to the item catalogue** via `src/rules/data/items/aliases.ts`
  (86% of 253 names). The 35 unresolved names (warband-specific gear such as Katana, Draich,
  Bone Helmet) are kept as custom-named items with the list's cost; the test pins the list so
  new gaps are noticed.
- **Two SQL functions own roster writes**: `create_warband(payload)` and
  `update_roster(warband_id, reason, changes)`; both run under the caller's RLS. The manual
  editor sends a minimal diff with reason `manual_edit`, so GM edits and manual edits are
  distinguishable in `audit_log`.
- **Screens**: `/` list, `/warbands/new` template picker, `/warbands/new/:templateId` builder,
  `/warbands/:id` roster view, `/warbands/:id/edit` manual editor, `/warbands/:id/print` sheet.
- **Bundle size**: the rules data makes the main chunk about 1.3 MB; route-level code splitting
  and a lazy scenario library are noted for Phase 9 polish.

## Phase 5 decisions (2026-09-04)

- **Campaign membership and settings stay in the tables from Phase 3**; Phase 5 adds only two
  SQL helpers (`regenerate_invite_code`, `leave_campaign`) and foreign keys from
  `campaign_members.user_id` / `campaigns.gm_id` to `profiles` so PostgREST can embed display
  names in one query.
- **Rating on the dashboard is computed client-side** from each member warband's heroes and
  groups (items are not needed for rating), using the same `warbandRating` as the roster view.
- **Activity feed = the audit log** filtered to the campaign and its member warbands, rendered as
  plain sentences. No separate events table.
- **Rules text is Markdown** rendered with marked and sanitised with DOMPurify (the only two
  runtime dependencies added since Phase 0), because GMs and other members author some of it.
- **Scenarios**: the nine core rulebook scenarios and the rest of the ~100-strong library ship
  with the client; full text is loaded lazily from a separate chunk. Custom scenarios are rows
  in `scenarios`, optionally scoped to a campaign the author runs, readable by everyone signed in.
- **Navigation**: a four-tab bottom bar (Warbands, Campaigns, Scenarios, Account) replaces the
  header link; it is hidden when printing.

## Phase 6 decisions (2026-09-04)

- **Match lifecycle is six SQL functions** (`schedule_match`, `respond_to_challenge`,
  `start_match`, `end_match`, `cancel_match`, `save_battle_session`), all SECURITY INVOKER so
  RLS still decides who may act. The GM books games with everyone pre-accepted; a member's
  challenge must include exactly one of their own warbands and the others accept or decline.
  Declining a two-warband challenge cancels it. Edge functions were not needed.
- **Battle sheets are per warband** (`battle_sessions.live_state`, shape in
  `src/domain/battle.ts`): turn, routed flag, wyrdstone found, loot lines, notes, and a tally
  per warrior or group (enemies out of action, own out of action, note). They are tallies, not
  reports; Phase 7's wizard reads them to pre-fill the report. Each participant creates their own
  row on first save (so RLS stays simple); saving is allowed while in progress or awaiting
  reports.
- **Realtime** subscriptions on matches, participants and battle_sessions for one match keep
  every phone at the table in step; the client just invalidates its queries on any change.
- **Rating on match pages** is computed from counts, experience and large flags only, which is
  all the rulebook formula needs, so the match query embeds a slim projection of each roster.
- **Attack calculator is still the first post-v1 upgrade**, not part of the battle helper.

## Phase 7 decisions (2026-09-04)

- **Rules are resolved on the phone, applied by the database.** The wizard runs the Phase 2
  resolvers with the dice the player rolled and sends one `BattleReport` (src/domain/report.ts)
  holding both the narrative (rolls, injury names, xp reasons, exploration) and the resulting
  roster patches. `submit_battle_report` stores the narrative, applies the patches to heroes,
  groups and treasury, adds stash items, removes lost items, creates `pending_advances`, and
  completes the match once every participant has filed. This departs from the framework's
  "re-run the rules in an edge function" idea: the group is small, every roll is on record, and
  the GM can withdraw a report and fix a roster by hand. Revisit if strangers ever share a campaign.
- **Reports are insert-once**; the GM's `withdraw_battle_report` deletes one and reopens the
  match, but does not undo roster changes (they are in audit_log and the report's `applied`).
- **Advances are not resolved in the wizard**: crossing a threshold creates a pending advance;
  rolling and choosing happens in Phase 8's advancement flow. `level_ups` increments there.
- **Hired swords** roll D6 for injuries (henchman style) per the mordheimer text, and earn xp
  as heroes.
- **Filing with the match still "in progress"** is allowed and moves it to awaiting reports, for
  tables that forget to tap "Battle over".
- **Battle records** are read straight from matches + match_reports; CSV export is built in the
  browser (RFC 4180) so no server work is needed.

## Phase 8 decisions (2026-09-04)

- **Client-supplied ids on insert.** `update_roster` (re-created in
  `20260904000008_advances_trading.sql`) takes the change's `id` as the new row's uuid for
  `insert` on heroes, henchman_groups and items. A phone can therefore hire a hero and hand him
  his kit in one atomic batch: the item inserts use the hero's uuid as `holder_id`, and the
  holder-check trigger sees him because the rows land in order in the same transaction. Ids are
  generated with `crypto.randomUUID()`; `diffRoster` refuses anything that is not a uuid.
- **`diffRoster(rows, next)`** (`src/domain/rosterDiff.ts`) is the bridge between the Phase 2
  resolvers and the database: a screen runs `buyItem` / `recruitHero` / `promoteHenchman` /
  `hireHiredSword` / `payUpkeep` / `applyStatIncrease` on the loaded `RosterWarband`, and the
  diff against the loaded rows becomes the `update_roster` batch. It sends only changed columns,
  reconciles items per holder by `(item_rules_id ?? custom_name)`, turns a stack that moved
  between holders into a holder update (the row keeps its identity), and leaves the kit of a
  deleted warrior to the `*_release_items` trigger unless the resolver put it somewhere else.
- **`resolve_pending_advance(advance_id, resolution, changes)`** applies the diff with reason
  `advancement` and closes the `pending_advances` row in one transaction; an already-resolved
  advance is refused. `resolution` is the narrative (roll, choice) and its shape belongs to the
  advances screen (`advanceResolutionSchema` stays a loose record until it settles).
- **`record_trade(warband_id, match_id, changes, wyrdstone_sold, heroes_searched)`** applies the
  diff with reason `trading` and, when a match is given, upserts `trade_phase_state` and refuses
  a second wyrdstone sale or a repeat rare-item search by the same hero in that phase.
- **The trading phase is the warband's latest match report** (`useLatestReport`): the
  trading post passes that report's `match_id`. A warband that has never filed a report has no
  phase, passes `null`, and trades with no once-per-phase limits. This is deliberate for fresh
  warbands at campaign start; a GM who wants a stricter rule can withdraw/refile reports.
- **Recruitment** needs no new SQL: screens call `diffRoster` then `useUpdateRoster` with reason
  `recruitment`. The veteran pool is written back by the henchmen screen (the resolver only
  returns `poolRemaining`), so the `warbands.veteran_pool` check was relaxed to 0-12: null still
  means "no pool rolled", 0 means "spent".
- **Promotion queues its follow-ups.** "The lad's got talent" resolves with
  `resolution.followUps = [{subjectType, subjectId, thresholdXp}]`; `resolve_pending_advance`
  inserts those as new `pending_advances` (the new hero's immediate hero-table roll and the
  remaining group's re-roll), so nothing has to be remembered by hand.
- **Hired sword restrictions are prose** in the scraped data, so the recruit screen reads them
  heuristically (named / excluded / check) and only hard-blocks duplicates and non-gold fees;
  otherwise it warns and lets the player "hire anyway". Casters are detected from known spells or
  the wizard-allocation labels, since templates do not flag them.

## Phase 9 decisions (2026-09-04)

- **Importer (Q16) is tolerant CSV plus column mapping**, not a parser for one known file: we
  still have no sample of the existing tracker's Battle Records export, so `/campaigns/:id/import` (GM
  only) reads any RFC 4180 CSV (`src/domain/csv.ts`), guesses which column is the date, warband,
  result, match id, scenario, player, XP, casualties, notes, winner or second warband from header
  synonyms (`src/features/importer/model.ts` `SYNONYMS`), and lets the GM correct the guess before a
  preview. Two row shapes are handled: one row per warband report (grouped by match id, else by
  date + scenario in file order) and one row per battle with an opponent column. **Re-check the
  synonym defaults against a real export once Tom saves one** and add its headers to
  `model.test.ts`.
- **Imports write history only.** `import_battle_records(campaign_id, matches)` (migration 10,
  SECURITY INVOKER, GM only, audit reason `import`) inserts completed `matches` with the new
  `match_origin` value `'import'` (migration 9, its own file because a new enum value cannot be
  used in the transaction that adds it), pre-accepted `match_participants`, and one
  `match_reports` row per participant filed by the GM at the battle's date. XP and casualties are
  stored as a single summary line each in `xp_log` / `ooa`, shaped like the wizard's lines so the
  records page and standings add them up. Rosters, treasuries and pending advances are **not**
  touched: players re-enter their warbands with the builder and manual editor. Warband names in
  the file must match warbands already enrolled in the campaign; the screen blocks otherwise.
  Scenario names are matched to the built-in library by normalised title, else kept at the top of
  the match notes. There is no undo beyond `withdraw_battle_report`; imported matches cannot be
  deleted from the app (`cancel_match` refuses a completed match).
- **Onboarding** is a checklist, not a tour: the empty home screen lists the three first steps
  (build a warband, join or start a campaign, "from the existing tracker"), the GM dashboard carries a
  dismissible checklist (localStorage `stirheim.gmChecklist.<campaignId>`), invites offer copy
  link + Web Share, and `/help` is a single plain-English field manual with anchors.
- **Installable**: `public/manifest.webmanifest` + SVG icons, no service worker (the app needs
  the network anyway; offline drafts stay in localStorage).
- **Route-level code splitting**: every screen is a `lazy()` chunk (`lazyPage` in
  `src/app/router.tsx`, Suspense fallback in `AppShell`). The scenario library and warband
  templates are the largest chunks and load only when visited.
- **Playwright** runs on a Pixel 7 viewport against the local Supabase seed, one worker, five
  numbered specs (auth, builder, campaign, match + both post-battle reports, between battles);
  global setup runs `db reset` and waits for GoTrue. CI runs it in a second job with
  `supabase start`. Fixed on the way: the new-match form's fieldsets needed `min-w-0` so the
  sticky submit stayed tappable on phones.


## Phase 10 decisions (2026-09-05)

- **The attack calculator lives on the battle sheet**, as a fourth tab ("Attack") next to My
  warband, Enemy and Notes, not on its own route: it needs the same rosters, the same live sheet
  and the same house rules the sheet already has, and a player should reach it in one tap mid-turn.
  Spectators (GM not fielding a warband) do not get it; they have nothing to attack with.
- **The simulator engine is used unchanged** (`src/rules/engine`). Phase 10 only adds the adapter
  from a roster warrior to the engine's `Character` / `DefenderProfile`
  (`src/features/match/fight/combatants.ts`, `odds.ts`): items resolve through `Item.weaponId`,
  armour through a fixed id list falling back to `Item.armourSave` (6 light, 5 heavy, 4 gromril),
  shields/bucklers/helmets by id, Enchanted Skins as a 6+ ward save. "Gromril weapon" / "Ithilmar
  weapon" items take their base weapon from the item note (default sword, said so on screen). Traits
  come from the template's `raceTraits`, the unit's `traitIds`, injury flags (Frenzy, Bitter Enmity ->
  Hatred, Large) and special-rule *headings* that name a modelled trait (Frenzy, Hatred, Large, No
  Pain, Hard to Kill, Hard Head, Immune to Poison, Undead Construct). Hired swords do not inherit
  race traits. Custom items and unmodelled weapons are listed under the odds as "Not modelled";
  miscellaneous gear is left out silently.
- **One model at a time.** A henchman group is offered as "one of N": the same stats and per-model
  kit for every member, so the group is a single entry. Groups already fully out of action, and
  heroes out of action, stay in the list but are marked.
- **Hands are chosen by the player, with sensible defaults**: primary = biggest Strength bonus,
  then anything but a dagger; off-hand = the first one-handed weapon that may be used in the other
  hand (two-handers, pairs, spears and morning stars excluded). Every carried melee weapon and every
  missile weapon is a primary option; the shooting phase and the hand-to-hand phase are never mixed.
- **Situation toggles are filtered** to what can change the numbers for this attacker and weapon:
  melee shows Charging always, First turn only for Heavy weapons, Fighting 2+ / Inside buildings /
  Hated enemy only when the attacker has the skill or trait; shooting shows Moved, Long range, Cover,
  Large target. The campaign's house rules set the erosion flag and the optional crit tables.
- **"Roll it through" is a pure state machine** (`rollThrough.ts`) fed by the engine's
  `AttackInput`, so the thresholds it asks for are exactly the ones the odds were computed from. It
  applies the order of play (hit, reroll, parry with reroll / Master of Blades, dodge, wound, one
  critical per phase from the campaign's table, armour save incl. Bladestorm's per-wound saves,
  Step Aside, Ward, injury with modifiers and remaps, helmet / No Pain / Undead Construct), tracks
  the target's Wounds across attacks, and stops early on an out of action. The defender's optional
  parry has a "No parry" button. Dice are typed or rolled with the existing DieField.
- **Logging goes one way.** An out of action result offers "Log +1 enemy out for <attacker>", which
  is the sheet's `addEnemyOut`; nothing is written to the opponent's sheet (RLS: each player owns
  their own row), so the screen says the other player marks their casualty. Henchman attackers get
  no log button (no experience for kills).
- **No schema change.** Phase 10 is front-end only; no migration, no new tables, nothing in the
  audit log.

## Phase 11 scope (agreed 2026-09-05)

Tom's answers to the decision review, in the order they will be built:

1. **Combat mode per game: "App calculates" or "Players calculate".** Chosen when a match starts
   (players-calculate is the the existing tracker way: tally sheets only, no calculator). A campaign
   setting gives the default and a lock so players cannot change it; the GM can.
2. **Tap a weapon to see its profile** (range, Strength, special rules) anywhere kit is listed.
3. **Kite shield and pavise get their real rules**, not "counts as a shield". **Gromril and
   ithilmar become named variants of every eligible hand-to-hand weapon** in the shop and the
   engine, so a Gromril Axe keeps Cutting Edge; the generic "Gromril weapon" item is retired.
4. **The calculator carries state between fights**: lost Wounds persist across turns (tracked on
   the sheet for multi-Wound models), the target's parry is once per turn across all attackers,
   several wounds in one turn take the highest injury roll, and an attacker may split attacks
   between targets. Fights resolve one at a time in the order the players choose; the app shows
   Initiative and strikes-first/last rules but does not sequence the combat.
5. **Advances are rolled inside the post-battle wizard**, with "Pick later" on skill and spell
   choices. Outstanding picks show as a highlighted "Bestow advancements" entry on the warband
   page and the campaign dashboard; the battle sheet warns when a warrior fights with a pick due.
6. **GM may amend a filed report**: roster effects reversed and reapplied in one transaction, the
   report tagged "Amended by GM", a change log of before/after. **Campaign setting "reports need GM
   approval"**: a filed report waits, applying nothing, until the GM approves or returns it.
7. **Shared combat log** (this phase if it fits, else Phase 12): one event stream per match that
   any participant appends to, pushed to every phone; sheets derive from it; any event can be
   reverted (kept, marked reverted by whom). Replaces "tell the other player to mark it".
8. **Suggested, not forced, dice and awards in the post-battle wizard** (added 2026-09-05): the
   wizard shows "suggested" counts (exploration dice, veteran pool, and so on) and lets the player
   roll more or fewer, and add bonus experience per warrior, each with a reason. Every override is
   recorded on the report and shown in the battle record as an adjustment log. Reason: missed rules,
   odd interactions, and map-campaign bonuses the ledger does not model yet.
9. **the existing tracker import of the eight rosters and the battle-records CSV** from Tom's account,
   read through his signed-in Chrome with his explicit permission, each roster checked on screen
   before saving. Also pins the CSV column mapping.

Deferred / roadmap (recorded, not built): server-side re-run of the post-battle rules (only
worth it when strangers share a campaign; the report contract already carries rolls + patches);
hired-sword restriction hard blocks with a "ask your GM to override" request; multi-attacker
odds in one figure (not needed given fights resolve one at a time); full Mordheim map-campaign
support (territories, movement between locations, map-driven scenario selection).

Confirmed as-is: hired swords roll D6 injuries and earn xp as heroes; veteran pool stored on the
warband; anyone may schedule; GM edits any warband; email + password sign-in; installable but
online-only.

## Phase 11 decisions (2026-09-05)

- **Combat mode is a column on `matches`** (`combat_mode`, enum app | players), set by
  `start_match(p_match_id, p_combat_mode default null)` from the campaign default
  (`settings.combatMode`); `settings.lockCombatMode` makes a different choice GM-only. The battle
  sheet hides the Attack tab in players mode.
- **Kit lines are tappable everywhere** (`ItemLines` in `src/features/roster/view/bits.tsx`): range,
  Strength or armour save on the line, the weapon's rules, price and rarity on tap.
- **Kite shield and pavise are engine rules** (`Armour.kiteShield`, `Armour.pavise`,
  `CombatContext.paviseFront`), not "counts as a shield". **Gromril / ithilmar variants exist for
  every ordinary hand weapon** (`isMaterialVariantBase` in `data/weapons/materialVariants.ts`; shop
  entries generated in `data/items/materialVariants.ts`, 4x / 3x price, Rare 11 / 9). The generic
  items are `superseded`: hidden from the shop (`SHOP_ITEMS`) and expanded in the builder into the
  variants of the hand weapons on the same equipment list. A pavise is excluded from half-price
  armour.
- **Carry-over between fights**: `TurnOptions` on the engine (wounds already taken, attack cap,
  parry override); `woundsLost` per tally on the live sheet for multi-Wound models; the calculator
  remembers, per phone, what earlier fights did to a target this turn (parry used, Wounds lost,
  worst result) because the opponent's sheet is read-only. Initiative and strikes-first/last are
  shown, never sequenced.
- **Advances in the wizard** are a two-phase affair: the report files as before and creates the
  pending rows; then `applyWizardAdvances` resolves each advance rolled in the wizard through
  `resolve_pending_advance` against the freshly loaded roster, or stores the dice in
  `pending_advances.rolled` for "Pick later". A failure leaves the advance pending, where Bestow
  Advancements (the renamed screen) picks it up. An untouched advance never blocks filing.
- **Reports can wait, be returned and be amended** (migration 13/14). `match_reports.status`
  (pending | applied | returned), `undo` (what apply changed: before-values, treasury deltas, stash
  rows, removed items, advances created), `revision` / `amended_*` and the `report_revisions` table
  (every superseded version verbatim with the note). `submit_battle_report` files, refiles a returned
  report, or amends when the GM passes a note: revision logged, effects reverted, new effects
  applied. Revert refuses while an advance from the report has been rolled or resolved. Withdraw now
  reverts too. Campaign setting `reportApproval` holds player reports until `approve_battle_report`;
  `return_battle_report` sends one back with a note. The report functions run as **security
  definer** with their own permission checks, because players must not update the bookkeeping
  columns directly.
- **Suggested, not forced, exploration dice**: the wizard shows the rulebook's count and lets the
  player roll another number (1-12) with a required reason; the report carries it in
  `adjustments` (label, suggested, used, reason), shown on the report card as "Adjusted". Bonus
  experience already goes through `xpExtras` with a reason per line.

## Phase 12 scope (agreed 2026-09-05)

1. **the existing tracker import of the eight rosters and the battle-records CSV** from Tom's account,
   read through his signed-in Chrome (read-only; his go given with "go ahead with Phase 12"), each
   roster checked on screen before saving; pins the CSV column mapping.
2. **"Suggested, not forced" across every decision the app makes for the player**, wizards
   included: casualties and injury dice, experience awards, veteran pool, henchman survival,
   upkeep and income, rare-item searches, advance rolls. The app shows its suggestion, the player
   may change it with a reason, and the change is logged (report `adjustments`, or the audit
   reason for roster writes) and shown in the record.
3. **Cost override on purchases**: a tick box on every buy / hire (trading post, recruitment,
   builder) to enter a different price, with the reason logged and shown ("cost overridden").
4. **Shared combat log with undo** (carried over from Phase 11): one event stream per match that
   any participant appends to; both sheets derive from it; any event can be reverted, kept and
   marked. Replaces per-player-only tallies for combat results.

Explained to Tom (2026-09-05): untouched advances leave the report unblocked (design choice,
not forced); report functions are security definer with their own permission checks (the
bookkeeping columns are GM-only for direct updates).

## Phase 12 decisions (2026-09-05)

- **Roster import reads page text, not an API.** the existing tracker keeps its bearer token in the
  browser and the walkthrough forbade reading it, so `/warbands/import` parses the text of the
  printer-friendly roster page (own warbands) or the campaign's "View details" panel (others),
  which is what a GM can copy by hand too. `src/features/importer/rosterText.ts` (parser) and
  `rosterImport.ts` (name matching, payloads) are tested against all ten rosters of Tom's campaign
  and the real battle-records CSV (`src/features/importer/fixtures/`, copy in
  `reference/existing-tracker/`). Matching: warband and unit types by normalised name (plurals,
  underscores, "The"), untyped henchman groups by stat line within one advance of a template,
  items via the builder's alias table (unknown ones become custom items), skills / spells /
  injuries / hired swords by name. the existing tracker lists Frenzy, Hardened and Horrible Scars as
  injuries: they become flags. Advances already taken are counted from experience so none are owed
  on import. The importer owns the warband; **`transfer_warband`** (owner or a campaign GM; the
  owner-change trigger admits it only there) hands it over once the player has signed up.
- **The battle-records importer knows the real export**: `match_id`, `match_created_at`,
  `scenario`, `warband_name`, `won`, `hero_exp_gained` ("Name: 2 (Survived +1, Win +1); …" is
  summed per warrior), `hero_deaths`, `notes`. Other players' hero names come out as slugs
  ("cool-meadow") in that export; the summary lines keep them.
- **Overrides carry a reason into the record.** `src/domain/override.ts` + `ui/OverrideField`:
  a tick box, the figure to use, a required reason. Roster writes put the note in the audit reason
  (`record_trade` gained `p_reason`; `useCommit` takes a reason), so the activity feed reads
  "trading · Sword price overridden: 10 gc → 5 gc (GM ruling)". In the wizard the note becomes a
  report `adjustment` (shown as "Adjusted"): exploration dice (Phase 11), a waived injury roll
  ("No injury roll needed", counts as recovered), a different number of henchman injury dice.
  Prices at the trading post, hero and henchman hire costs, hired-sword fees and upkeep all take
  an override; experience already does through `xpExtras`.
- **The shared combat log is an overlay, not a second writer.** `battle_events` (one row per
  attack result, appended by a participant while the battle is in progress, Realtime-published)
  is laid over each player's own `battle_sessions` sheet on every phone (`applyBattleEvents` in
  `src/domain/battleEvent.ts`): the attacker's warband gains the kill, the target's warband the
  Wounds lost and the out-of-action. Nothing writes to the other player's row, so there is no
  race with the debounced autosave, and the post-battle wizard seeds from the overlaid sheet.
  `revert_battle_event` (participant or GM) marks an entry reverted with a note; it stays in the
  Log tab struck through. Manual taps still work on the player's own part; the stepper cannot go
  below what the log contributed ("1 from the log"), so a logged kill is undone from the log, not
  by tapping.

## Test round 1 (2026-09-05)

Tom tested the first live build and sent a change list. The interface, not the rules, was the main
complaint: a phone column on desktop, secondary buttons dark-on-dark, browser-default monospace
for every figure, a tiny text-only tab bar, bland action buttons. He wants the redesign thought
through (desktop vs mobile especially) and approved before it is built, and no Netlify deploy
without his approval while credits are short.

Fixed straight away (commit 6f2e29d, not yet deployed): Getting Started only for accounts with no
warband and no campaign; dice/combat settings in the same order and wording; bottom sheets capped
at 85dvh with a Done button on the equipment sheet; grade chips wrap; free dagger on adding a unit
in the builder; "Henchman groups" labels; the other tracker's name removed from product copy,
README and comments (still in these docs and in the fixture file names, pending his decision).

Proposal sent as a page with mockups: two directions (A "Ledger", light paper/ink/oxblood/brass;
B "Lantern", dark with a real contrast ladder and brass primary), type pairing IM Fell English +
Source Sans 3 (alt Alegreya pair), desktop rail + two columns from 1024px, action tiles, nine-cell
stat block, segmented experience track at the advance boxes, tooltip cards for skills/kit.
Phase 13 = visual rebuild + layout + tooltips + warbands grouped by campaign + XP track.
Phase 14 = per-campaign aliases, per-model names in henchman groups, warband templates, records
importer wyrdstone/gold/veteran-pool columns (then a fresh campaign and re-import), free dagger for
recruits. Decisions awaited: direction, type pairing, rail vs top bar, XP track vs box grid, who
sets aliases, template sharing, deploy the fixes now or with Phase 13, scrub docs/fixture names.

## Phase 13 scope (agreed 2026-09-05, built the same day)

Tom's answers to the redesign proposal: Direction A "Ledger" (light paper, ink, oxblood primary,
brass state), type pairing 1 (IM Fell English headings, Source Sans 3 text, tabular figures, no
monospace anywhere), navigation rail on the left from 1024px and 64px icon tabs on phones,
experience as a segmented track at the advance boxes, aliases set by the player with GM override,
templates private first but with a `campaign_id` column reserved for sharing, Phases 13 and 14
merged into one release, and the previous tracker referred to generically everywhere (docs,
fixture names, identifiers).

Built:
- Tokens/fonts in `src/index.css` + `index.html`; `.font-headline` pinned to weight 400; body
  `font-variant-numeric: tabular-nums`. Button ladder in `src/ui/buttonStyles.ts`.
- `src/app/SideRail.tsx` + `BottomNav.tsx` share `navTabs.ts`; `AppShell` is a grid from `lg`.
  `src/ui/Layout.tsx` `TwoColumn`, `src/ui/useMediaQuery.ts` `useIsDesktop`. Warband, campaign,
  builder and battle pages use them (battle: my warband left, other tabs right).
- `StatLine` nine-cell grid with `raised` keys; `XpBar` segmented via `xpTrack()` in
  `roster/view/lookups.ts`; `ActionTile`; `HoverCard` on kit lines, skills and spells (ItemLine
  no longer toggles; `detailed` still prints everything open).
- Migration 18 (`20260905000018_phase13.sql`): `henchman_groups.model_names text[]` (+
  `jsonb_text_array()` and `update_roster` re-created to read it), `campaign_aliases` +
  `set_campaign_alias(p_campaign_id, p_user_id, p_alias)` (member sets own, GM sets anyone, blank
  deletes), `warband_templates` (owner-only RLS, `campaign_id` reserved), `import_battle_records`
  re-created to write `exploration` (minimal complete record) and `veteran_pool_roll` from the
  `shards` / `gold` / `veteran_pool` participant keys.
- Aliases applied in the API layer (`src/api/aliases.ts`: `fetchCampaignAliases`, `nameIn`), in
  campaign detail/activity, matches, reports and records; `AliasField` on the campaign page (self)
  and settings (GM per member).
- Templates: `rules/resolve/warbandTemplates.ts` (`rosterToTemplatePayload`, `draftFromTemplate`
  rebuilds a builder draft at today's prices), `api/templates.ts`, "Save as template" in the
  warband More sheet, "Your templates" on the new-warband screen (`SavedTemplates.tsx`),
  `draftStore.load()`.
- Warband list grouped by campaign (`groupByCampaign` in builder/helpers.ts; the list query joins
  `campaign_members(... campaigns(name))`).
- Importer fields `shards`, `gold`, `veteranPool` with synonyms for the old tracker's headers.
- `rules/resolve/freeDagger.ts` shared by the builder (`withFreeDagger`) and `recruitHero` /
  `recruitHenchmen` (new group only).
- Model names: `RosterHenchmanGroup.modelNames`, row schema, both diffs, `GroupEditor` textarea
  (one per line), shown on the group card and the print sheet.

Deferred from the proposal: a per-user light/dark toggle (Direction B as a theme), template
sharing UI, recruits joining an existing group do not get a dagger (they must match the group's
kit anyway).

## Phase 14 candidates (raised 2026-09-05, not yet scoped)

- **Warband special rules audit**: `docs/WARBAND-RULES-GAPS.md` (written by another agent on
  2026-09-05) lists every warband rule stored only as text that the app does not enforce or apply
  (cross-cutting mechanisms first, then per warband, then data errors found on the way). Tom wants
  the next phase to work through it.
- **Rout check prompt in the battle sheet**: when a warband's own out-of-action total reaches 25%
  of its starting models, show a "Rout check" header on the sheet with a button to roll it in the
  app (Leadership test on the leader / nearest hero per the rules) or mark it as taken at the table.
  A failed check prompts "End the battle?". There is no turn tracking by design, so the app can
  only remind, never force, the per-turn check; the header stays until the battle ends or the
  warband routs.
- **Sign-in screens with the logo**: `public/brand/stirheim-logo.png` (transparent, from Canva) and
  the tight crop `stirheim-logo-tight.png`; layout to be chosen from the mockup alternatives.

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
  editor exists for corrections (as in the existing tracker), and the GM's edits are logged.
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
