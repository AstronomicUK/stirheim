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

## Phase 14 scope (proposed 2026-09-05, awaiting Tom's approval)

Agreed so far: sign-in / sign-up / password screens in the "Banner" layout with the transparent logo
(`public/brand/stirheim-logo-tight.png`); promises copy "Build a legal warband from any published list
and keep it up to date between games", "Run the battle with optional full calculations and tracking of
wounds, kills and OOA models", "File the report and let the wizard take you through a seamless
post-battle sequence"; rail wordmark vs logo still to be chosen; the rout check prompt; and the warband
rules gaps from `docs/WARBAND-RULES-GAPS.md`.

The audit is far larger than one phase, so the proposal is to build the *mechanisms* that cover the
most warbands first (each as data flags on units/warbands read by the resolvers), and park the
bespoke one-warband flows:

Tier 1 (proposed for Phase 14):
- A4 units that never gain experience (`gainsExperience: false` on ~50 unit templates; the wizard
  skips them, the veteran rule ignores them) and A5 half-rate advances (ogres).
- A6 promotion restrictions (never promoted / table restrictions / special results) as unit flags,
  and A16 skills a unit starts with.
- A1 exploration modifiers (+shards, +dice, roll-two-keep-one, reroll one, +gc per kill) and A2 income
  modifiers (size band shifts, count-as-two, count-as-one) as warband/unit hooks that *suggest* the
  figure (Tom's "suggested not forced" rule) with the reason shown.
- A3 rating modifiers and the section C data fixes (Reikland Marksmen +1 BS, Marienburg 600 gc,
  large ogres rated 20, racial maxima rows for Druchii / Necrarch / Wolfman / Snotlings / Gnoblars /
  Wights, race traits not applied to Informers and Hobgoblins, Merchant Trade Wagon, shared hero
  slots).
- A7 racial maxima per unit where the audit found the wrong row.
- A9 hired sword restrictions declared on the warband (with the agreed "ask your GM to override"
  request instead of a hard block) and A10 equipment bans per unit/warband in the trading post and
  builder (shown as blocked lines with the override-with-reason pattern).
- A11 prose roster limits as structured relations ("no more than" / "only with" / "instead of").
- A13 henchman upkeep and A14 injury-roll exceptions per unit (no roll, dies on 1-3, 1-4, only on 1,
  banished, reroll once).
- Rout check prompt on the battle sheet (25% of starting models out of action → header + roll in app
  or mark taken → failed check offers "End the battle"; no turn tracking by design).

Tier 2 (parked, listed so nothing is lost): A12 leader succession flows, A15 capture flows, A17
recruit-time purchases and mutations, A18 between-battle special actions and rare-roll modifiers
beyond a per-warband rarity bonus, per-warband bespoke tables (Wheelo, Eye of the Gods, Nurgle's Rot).

## Phase 14 built (2026-09-05)

- Sign-in, sign-up and password screens in the Card layout with the transparent logo
  (`src/features/account/FormPage.tsx`, promises on the doorway screens only); the logo in the desktop
  rail; "House rules of Tom's group" renamed "Default house rules".
- Rout check (`src/features/match/battle/RoutCheck.tsx`, helpers in `routCheckRules.ts`): header at a
  quarter of the starting models out, roll 2D6 vs a chosen Leadership (leader suggested; never-leaders
  not suggested), "Passed at the table", "We rout"; a failed roll routs and offers to end the battle.
- Campaign rules overlay `src/rules/data/campaignRules/index.ts` (`UNIT_RULES`, `WARBAND_RULES`,
  accessors `unitRules`, `warbandRules`, `unitGainsExperience`, `equipmentBansFor`) read by:
  - experience (`xpThresholds(role, rate)`, `advancesEarned`/`nextThreshold`/`pendingAdvances` take an
    `AdvanceRate`; `xp.ts` skips no-experience units; `XpBar` shows "Gains no experience" / half rate),
  - promotion (`planGroup`: never-promoted units re-roll with the rule quoted; table restrictions filter
    the skill-table picker),
  - injuries (`henchmanInjuryException`, `applyHenchmanInjury` reads `deadOn`; no-roll units default to
    0 dice in the wizard; the card says why),
  - exploration (`explorationDiceAllowed` adds rule dice, skips Lazy heroes, Scavengers without heroes;
    `explorationBonuses` adds shards and gold to the record with notes),
  - income (`incomeSize` with per-unit counts, group counts, size factor, band shift;
    `wyrdstoneIncome(shards, size, bandShift)`; sale tab explains the count),
  - rating (`ratingFactor`), builder (`unitIsLarge` reads `large`, `unitStartingStats` applies
    `statBonus`, `startingGold` from the warband), recruitment (stat bonus, starting skills, henchman
    upkeep `henchmanUpkeepDue`/`payHenchmanUpkeep` with a section on the Hired swords tab),
  - racial maxima (`racialProfile` per unit; rows added for the Necrarch Vampire and the Wolfman),
  - hired swords (`warbandRestriction` in recruitment helpers → the existing "restricted / hire anyway"
    flow), rare searches (`noRareSearch` heroes excluded; `rareRollBonus` added to the roll),
  - roster validation (relations noMoreThan / onlyWith / exclusiveWith / outsideMaxModels, equipment
    bans as `roster.equipmentBan` problems, `heroCapacity` override), fight calculator
    (`excludeRaceTraits`).
- Deviation from the earlier idea of a GM override *request* for hired swords: the app keeps the
  "suggested not forced" pattern instead (the player may hire anyway with the reason logged), so no
  request table was added.
- Not in Tier 1 (still text): everything under Tier 2 in the Phase 14 scope above.

## Phase 15 scope (agreed 2026-09-05)

Tom accepted the recommendation and added two checks of his own. Phase 15 is built before the single
release of Phases 13-15.

Small:
- Weekly keep-awake ping for the free Supabase tier.
- Roll-two-keep-one exploration dice (Augur, Mountain Guide, Chronicler).
- Merchant Caravans' Trade Wagon as a unit.
- Template sharing with a campaign (column exists; add the switch and the list).
- After release: fresh campaign and re-import of the records CSV.

Medium:
- Leader succession prompts (the list's named replacement; Black Orcs, Necrarchs, Protectorate, Clan
  Moulder, Ogre Hunting Party, Pirates, Merchants, Mazzalupo, Dreamwalkers, Strigos, Battle Monks,
  Lizardmen, Order of the Mare, Court of Pleasures; units that never lead).
- Pre-battle prompts on the battle sheet (Blessing of the Lady, Nurgle's Rot, Guiding Dream,
  Runesmith inscriptions, Tarot Cards).

Tom's additions (2026-09-05):
- **Out of action cannot search.** Rulebook 03:1087: "Warriors taken out of action during the last
  battle may not look for rare items." The trading post currently offers every active hero once per
  phase; it must read the filed report's `ooa` lines for the match (`trade_phase_state.match_id`) and
  exclude those heroes, and say why.
- **Dramatis Personae search** as the alternative to a rare search: pick the character, choose the
  searching heroes (not out of action, each forgoes a rare search), roll a D6 per searcher against
  Initiative (under = found), one hire per character; data already in
  `src/rules/data/campaign/dramatisPersonae.ts` (rules text at 03:1230).
- **Item prompts** where the catalogue text carries a campaign-phase effect:
  - Mordheim Map: D6 table on purchase (Fake / Vague / Catacomb / ... ) with the exploration effect
    recorded on the item; the wizard suggests the extra dice it grants.
  - Tarot Cards: pre-battle Leadership test (fail by 3+ = bad); on a pass, ±1 to one exploration die.
  - Wyrdstone Pendulum: post-battle Leadership test if the hero was not out of action; pass = re-roll
    one exploration die (not re-rollable again).
  - Rabbit's Foot: one exploration-die re-roll if the wearer can search and did not use it in battle.
  - Lucky Charm and Healing Herbs are tabletop effects: the fight calculator can offer the charm's
    4+ discard on the first hit; herbs stay text.
  All of these follow "suggested not forced": the prompt proposes the roll and its effect, the
  player can decline or override with a reason, and the log keeps it.

## Phase 15 built (2026-09-05)

- **Searches.** `PhaseInfo.heroesOutOfAction` comes from the filed report's `ooa` lines for the phase's
  match (`TradingPage` reads `useMatchReports`); `eligibleSearchers` and the Characters tab exclude
  them and say so. `characterSearchers` / `resolveCharacterSearch` in `rules/resolve/dramatis.ts`;
  the Characters tab (`features/trading/CharactersTab.tsx`) records searchers on the phase through
  `record_trade` with no roster change, then hires a found persona with `hireHiredSword` (which now
  resolves Dramatis Personae ids too via `findHiredSword`).
- **House rule** `rabbitsFootBattleOnly` (default on).
- **Exploration aids** (`rules/resolve/explorationAids.ts`): Mordheim Map graded by the D6 rolled at
  purchase (kept in the item's notes; `buyItem` takes `notes`), Wyrdstone Pendulum (Ld test in the
  step), Rabbit's Foot (unless the house rule), Tarot Cards (pre-battle pass recorded on the sheet),
  and the list's roll-two-keep-one hero. `ExplorationDraft.aids` records each use; the record's
  notes carry them. Report draft version bumped to 3 (older drafts are dropped).
- **Before the battle** (`features/match/battle/PreBattle.tsx`): Tarot Cards for any holder, plus
  `WARBAND_RULES.preBattle` (Blessing of the Lady, Guiding Dream, Inscribe Runes). Outcomes go to
  `BattleLiveState.preBattle` and the sheet notes; the wizard reads them through `ReportContext.preBattle`.
- **Leader succession** (`rules/resolve/succession.ts`, card on the warband page): candidates from
  `WARBAND_RULES.succession` (Black Orcs, Necrarchs, Protectorate, Clan Moulder, Ogre Hunting Party,
  Pirates, Merchants, Dreamwalkers, Strigos, Battle Monks, Lizardmen, Court) or any hero; never-leaders
  excluded; `appointLeader` re-templates the hero. Migration 19 lets `update_roster` change
  `heroes.unit_type_rules_id`; `HeroPatch` carries it.
- **Trade Wagon** unit on the Merchant Caravans list (added to the template with a note; no
  experience, outside the maximum, counts nothing for income).
- **Template sharing**: `shareTemplate` sets `campaign_id`; the template sheet has a campaign picker
  for the owner; shared templates show a "Shared" mark and a line for non-owners.
- **Keep-awake**: `.github/workflows/keep-awake.yml` (cron, needs repository variables
  `SUPABASE_URL` and `SUPABASE_ANON_KEY`).
- Not done: Nurgle's Rot (needs the Blessing purchase from Tier 2), the Guiding Dream outcome table
  (the scrape truncates it), automatic "map spent" marking after a Vague/Accurate map is used (note it
  on the item).

## Phase 16 built (2026-09-06)

Tier 1 of the scope below, in five commits. Where it lives:

- **Item rules overlay** `src/rules/data/itemRules/` (`restrictions.ts`, `pricing.ts`, `effects.ts`,
  `warbandGroups.ts` for the rules' race and creed words). Accessors `itemRestriction` (misc kit
  defaults to Heroes only), `itemPricing`, `itemEffect`, `isConsumable`.
- **Catalogue**: `data/items/warbandSpecial.ts` (30 warband-page items incl. the six Blessings of
  Nurgle) with engine entries in `data/weapons/warbandSpecial.ts`; `EQUIPMENT_BUNDLES` for the Pit
  Fighter styles; Katana, Staff and Shield/Buckler aliased. `data/items/classify.ts` classifies armour,
  helmets and thrown weapons from data (the equipment bans use it).
- **Section C fixes** in the weapon data (Ostlander -2 saves, Lance mounted charge, Ogre Club
  two-handed, Cathayan Longsword WS, Chain Sticks, Starblade, Sigmarite Warhammer, Misericordia, Ball
  and Chain, Ladle, Dark Elf Blade as an upgrade with `critTableRollModifier`), Cooking Pot Helmet
  and Mechanical Suit in the loadout, Swivel Gun shot types, `altFire` on repeaters and slings.
- **Engine** (`engine/buildAttackInput.ts`, `resolveAttack.ts`): new Weapon fields (`wsBonus`,
  `firstTurnBonusAttacks`, `unarmedBonusAttack`, `parryThreshold`, `ignoresArmourSaveExceptShield`,
  `saveModifierTwoHandedOnly`, `strengthBonusMountedChargeOnly`, `toWoundHighestOf2D6VsKnockedDown`,
  `vsTraits`, `defenderToBeHitModifier`, `altFire`), CombatContext `mounted`, `twoHanded`,
  `targetKnockedDown`, `altFire`; DefenderProfile `toBeHit`, `saveBonus`, `ownSave`, `afterSaveThreshold`
  (Peg Leg), `missileWardSaveThreshold`, `stunSave`, `parryThreshold`. Whipcrack fires when charged.
- **Calculator** (`features/match/fight/combatants.ts` loadout, `odds.ts`, `rollThrough.ts`,
  `FightTab.tsx`): kit traits and saves, Hook Hand and Sword-Gnoblar attacks, Lucky Charm offered on
  the first hit when rolling, Peg Leg step, Misericordia second die, a "Taken or applied this battle"
  checklist per attacker (`BattleLiveState.itemsUsed`, `setItemUsed`) that coats weapons or doses the
  warrior (`applyPreBattle`), kind traits `undead` / `possessed` / `vampire` from the roster.
- **Report**: `applied.item_patches` (consumables one fewer, spent maps noted) with migration 20's
  `apply_battle_report` / `revert_battle_report`; Tarot disaster and Nurgle's Rot outcomes applied
  from `ReportContext.preBattle`; `ReportContext.itemsUsed`.
- **Restrictions and pricing** (`resolve/itemRestrictions.ts`, `resolve/itemPricing.ts`): warnings
  with a reason in the shop (`BuyTab`), problems on the roster (`validateRoster` code
  `roster.itemRestriction`, bans through `ValidateRosterOptions.bans`), `sellItem` refuses
  unsellable kit, `moveItem` refuses fused kit; the shop rewrites price and rarity per buyer, adds
  Opulent Coach / Trade Wagon bonuses to rare rolls, asks the base weapon for upgrades (kept on the
  item note as `base: <weapon id>`), runs Wolfcloak hunts and Familiar paid-on-failure searches.
- **Bans** (`CampaignHouseRules.bans`, `campaignBansSchema`, `features/campaign/BansEditor.tsx`,
  `bans.ts`): hidden in `BuyTab`, `CharactersTab`, `hiredSwordOptions`, `availableSkills`,
  `unknownSpells`; `isBanned` / `bansCount` in `resolve/houseRules.ts`. Migration 20 updates the
  settings column default. Pages that needed the campaign now load it (`useWarbandCampaign`).
- **Skill restrictions** (`resolve/skillRestrictions.ts`): prerequisites, leader only, warband-wide
  limits, exclusions and "X only" read from the tables; `AvailableSkill.blocked` shown in the picker
  and noted in the resolution text when taken anyway.
- **Hero advance at a maximum** (`features/advances/model.ts`): the pair's other characteristic
  first, then a skill or a re-roll.
- **Nurgle's Rot**: `WarriorFlags.nurglesRot`, conditions checklist on the hero editor, a D6
  Toughness test in Before the battle (`rot:<id>` outcomes), -1 T / death applied by the report.
- **Guiding Dream** outcomes on the Dreamwalkers pre-battle rule; **free dagger** for recruits
  joining a group that carries them.
- Migration `20260906000020_phase16.sql` is applied locally; pushing to the hosted project waits for
  Tom's OK (the client parses older settings rows without it).
- Tier 2 stays parked (mounts, animals as warriors, black powder cadence, strike order, post-battle
  item consequences, spell items).

## Phase 16 scope (collected 2026-09-05)

Tom asked for the small gaps left by Phases 14-15 to go here, plus a campaign "bans"
house rule; a weapons and armour audit he is running may add more.

Small gaps carried over:
- Lucky Charm: the attack calculator offers the 4+ discard on the first hit of the battle.
- Nurgle's Rot and the Blessing of Nurgle purchase (Carnival of Chaos): buy at recruitment, the
  pre-battle Toughness test, permanent -1 T, death at zero, a 6 spreading it. Only when not banned.
- Guiding Dream outcome table: recover the six results from the source (the scrape truncates the
  rule) and wire them into the pre-battle prompt.
- Mark a Vague / Accurate Mordheim Map as spent when its re-rolls are used (needs an item-notes patch
  in `apply_battle_report`, so a migration).
- Free dagger for recruits joining an existing henchman group (matching the group's kit).
- Skill prerequisites and "X only" restrictions carried on skills, enforced in learnSkill with the
  usual override-with-reason.
- Hero advance at a racial maximum (Tom, 2026-09-05): a sub-rolled result (6, 8 or 9 on the hero
  table) whose characteristic is already at its maximum should offer the other characteristic of the
  pair first ("take the other option"); only when both are maxed does the player re-roll or take a
  skill. Today the wizard jumps straight to a skill. The choice results and the henchman re-roll
  already follow the book.

New house rule: **Bans.** Campaign settings gain a section where the GM removes items and spells (and
optionally hired swords, Dramatis Personae and warband skills) from the campaign. Stored as id lists
in `settings.houseRules.bans`; the trading post, builder equipment lists, spell pickers, the Characters
tab and the hire sheet hide banned entries (or show them struck through with "banned in this
campaign"); the roster validator flags a banned item already on a roster. Nurgle's Rot is the first
expected entry and is commonly banned. Shipped with a short default list to pick from and a free-text
search over the catalogue.

From the weapons and armour audit (`docs/WEAPONS-ARMOUR-RULES-GAPS.md`, 2026-09-05), proposed for
Phase 16, mechanisms first:

Tier 1 (fixes and broad mechanisms):
- Section C data errors: Swivel Gun engine weapon (link the three ammunition profiles); -2 save on the
  Ostlander double-barrelled rifle and pistol; Cooking Pot Helmet as a 5+ unmodifiable stun save,
  Master Chef only, not stacking with Thick Skull; Dark Elf Blade as a +20 gc upgrade keeping the base
  weapon's rules, +1 on the critical chart; Sons of Hashut obsidian keeping the base weapon's rules;
  Lance only when mounted on a warhorse; Ogre Club -1 save only two-handed; Toughened Leathers never
  with a shield and unsellable; Mechanical Suit as Chaos armour; equipment-ban matching by weapon data
  (thrown flag, heavy-armour class) rather than id substrings; Tarot "disaster" makes the hero miss the
  next game; the 34 unresolved equipment-list names get catalogue and engine entries (Katana aliased
  to Dragon Sword).
- A1 who may buy or carry: miscellaneous equipment Heroes only (Rain Coat, Winter Furs excepted); the
  two hand weapons + dagger and two missile weapons cap (brace = one); arrows need a bow; one-per-
  warband / once-per-campaign items; creation-only items; race restrictions on Obsidian, Bugman's Ale,
  Garlic, Blessed Water, Tears of Shallaya, Halfling Cookbook; fused Chaos Armour and Mechanical Suit.
  Shown in the shop and on the roster as warnings with the override-with-reason pattern.
- A2 conditional prices and rarities per warband or unit (Blowpipe, Black Lotus, Dark Venom, Holy
  Relic, Blessed Water, Mad Cap Mushrooms, Healing Herbs, Amulet of the Moon, Lizardmen light armour,
  Gunnery School black powder, Chaos Armour by kills and experience, Rhinox by Strength, Familiar paid
  on failure, Wolfcloak and Bearcloak Strength roll, Opulent Coach and Trade Wagon rare-roll bonuses).
- A6 items that grant traits or saves the calculator already knows: Frenzy, Hatred, Immune to Poison,
  Sea Dragon Cloak and Wolfcloak saves, Amulet of the Moon, Elven and Forest Cloaks, Lucky Charm (from
  the carried-over list), Peg Leg, Hook Hand as a dagger, Enchanted Skins against magic, Holy Relic /
  Jolly Roger / Banners / War Horns for Leadership, Bugman's Ale and Elven Wine against fear.
- A4 pre-battle item toggles on the attack calculator (coated or drunk this battle): Dark Venom, Black
  Lotus, Spider Spittle, Manticore Spoor, Reptile Venom, Poisoned Weapon, Hunting Arrows, Asp Arrows,
  Superior Blackpowder, Mandrake Root, Crimson Shade, Mad Cap Mushrooms, Hardtack, with A3 consumables
  used up when marked.
- A10 multi-shot choice (single shot for repeaters, the Sling's double shot at half range) and A12
  the weapon tags the engine never reads (Cathayan Longsword +1 WS, Chain Sticks first-turn attacks,
  Starblade 4+ parry, Sigmarite Warhammer holy bonus, Ladle saves, Whipcrack when charged, Quarter
  Staff unarmed attack, Misericordia versus knocked down, Ball and Chain -1 to be hit).
- A13 selling rules (Toughened Leathers unsellable).
- The bans house rule above hides banned items and spells everywhere.

Tier 2 (parked): A7 mounts and mounted combat, A8 animals bought as equipment fighting as warriors, A9
black powder cadence, misfires, blast and scatter, pistols in hand-to-hand, A11 strike order and
Initiative modifiers, A5 post-battle item consequences (Crimson Shade addiction, Mandrake Root,
Cathayan Silk, Lamp of the Djinn, Monkey's Paw, Treasure Map, captures), A14 spell and prayer items
(needs the spell flow), remaining consumables.

## Release (2026-09-06)

Phases 13 to 17 went live at https://stirheim.netlify.app in one deploy (local `npm run build`, then
`npx netlify deploy --prod --dir=dist --no-build`), deploy id 6a9d2234a24809d1090a2f14, after migration 20
was pushed to the hosted project. Next: a fresh campaign and a re-import of the battle records CSV, and
handing the other players' warbands over.

## Release (2026-09-06, second)

Tom: "Push the next update to the database and Netlify". Migrations 22 and 23 were already on the
hosted project; `npm run build` + `npx netlify deploy --prod --dir=dist --no-build` (deploy
6a9d6a1b240b531d2c8c5b9b) put Test round 2, Phase 20 and the two follow-up fixes live at commit
0f5c0ef. Mobile testing follows. Tom's rulings this session: the two-missile-weapon warning stays
(rulebook, Weapons & Armour intro); no stash at creation (rules as written); imported rosters are
matched silently, no button.

## Phase 20 built (2026-09-06)

Map campaigns, part two, plus the battle-sheet request from test round 2. Tom said "go" on the
scope listed under "Phase 20" in the conversation; built in three commits.

**3/3: who took whom out.**
- `BattleLiveState.takenOutBy` (warrior or group id -> one `TakenOutBy` per model out: enemy
  warband and model ids with a printable name, or a fall / terrain / spell with none). Marking a
  warrior out of action on the sheet, in either combat mode, opens `TakenOutBySheet` listing the
  enemy warriors and groups fit to fight, plus "A fall, terrain or a spell" and "Not sure, skip";
  the answer can be changed from the card. `applyBattleEvents` lays the calculator's logged kills
  over it (the attacker's name), and marking a warrior back in trims the entries.
- Report: `OoaLine.by` (names), filled from the sheet through `ReportContext.takenOutBy`; the
  report card's Casualties block reads "Taken out by …". Help copy updated.

**2/3: in battle, and the tolls.**
- `BattleBoosts` (`features/match/fight/combatants.ts`, `useBattleBoosts`): the Statue of Count
  Gotthard's +1 Ld on the leader, +1 Ld for a leader whose warband held the battle's district
  against a Surprise Attack (`MapState.defenderLd`, from battles whose scenario was Surprise Attack
  and whose controller won), and the Cemetery's Fear immunity (new trait `immune_to_fear` on every
  warrior). Applied to the calculator's combatants on both sides, to the rout check's Leadership
  options, and shown in a "From the map" notice on the battle sheet.
- Tolls: migration 23 `map_tolls` + `pay_map_toll(match, warband, kind, amount, to_warband, note)`
  (security definer: owner or GM pays; the gold leaves the payer and reaches the bridge's
  controller in one transaction; one payment per toll per battle; audited as `toll`). The match
  page's district block lists each toll due with a Pay button (the bridge's 2D6 entered there) and
  what has been paid. Integration test `api/__tests__/phase20.integration.test.ts`.

**1/3: advantages applied in the report and the trading post.**
- `rules/data/map/advantages.ts`: every district's legend as structured effects (exploration dice,
  modify-one, maximum finds, wyrdstone sale bonus, half-price hires and items, rare-roll bonus,
  resale at purchase price, 3D6 veteran pool by henchman kind, chosen spells, cheap Undead
  recruits, Fear immunity, leader Ld, injury rewrites, pit-fight auto-win, finding Luthor, and
  reminders for the rest). `rules/resolve/mapAdvantages.ts`: `mapPerksFor(state, warbandId)` folds
  the districts a warband holds the advantage of (a foothold; control where Hard Fought) into one
  `MapPerks` object; `halfPriceItemSource`, `halfPriceHireSource`, `injuryRewriteFor`,
  `describeMapPerks`. `features/map/useMapPerks` reads them for a warband (optionally as the map
  stood before a given match). `MapPerksCard` lists them on the trading post and recruitment.
- Report (`ReportContext.map`): extra exploration dice with the districts named in the reason;
  City Hall as a modify-one aid; Rich Quarter / Clock Tower take the maximum of a location's dice
  finds; the Abundance D3 (draft `abundanceRoll`, required for the winner, added to wyrdstone with
  a note); Temple of Morr / Temple of Sigmar offer a D6 (`districtTest` pending, `districtRoll` on
  the flow) and the Gaol rewrites Captured outright, all recorded as "→ Full Recovery"; a third
  veteran die (`veteranPoolExtra`) where Quayside / Memorial Gardens apply. Draft version 5.
- Trading post: half-price items (rounded down, after the house rule), Market Square's +2 on rare
  rolls, Raven Barracks resale at purchase price, The Rock's +20% on wyrdstone (income.ts
  `bonusRate`), Luthor Wolfenbaum at half fee and found automatically from a gate. Recruitment:
  half-fee hired swords, the Cemetery's Zombies and Ghouls. Advances: Sage's Hall lets a new spell
  be chosen (`AdvanceBody.chooseSpell`).
- Tests: `rules/resolve/__tests__/mapAdvantages.test.ts`, `features/postBattle/model/mapPerks.test.ts`.

## Test round 2 (2026-09-06)

Tom released Phases 18-19 to Netlify (deploy 6a9d4a51dafe2bbae7543921) and sent his first desktop
test list; mobile testing to follow. Fixed the same day (built, not yet deployed):

- **Hero maximum.** `heroCapacity` is now the rulebook ceiling: six heroes for every list (the
  list's slots plus one from The Lad's Got Talent), or the list's own total where it is higher
  (`HERO_MAXIMUM`, `listedHeroSlots`). Witch Hunters with six heroes no longer show a roster
  problem.
- **Experience track** redrawn: one pip per point over the whole sheet, every advance box a taller
  node, "next advance at N (k to go)". Henchman groups show their four boxes, heroes all twenty-one.
- **Stat colours** on the roster: heroes and hired swords compare against their starting profile
  (`startingProfile`, `statDrift`): raised in green, lowered (injuries) in oxblood, with a title.
- **Injuries from the importer**: "Roll again" injuries record the outcome that was rolled
  ("Madness (Frenzy)" with the frenzy text), never the sub-table; an unknown outcome says so.
- **Brace of pistols**: two braceable pistols read "Brace of Pistols" on kit lines and summaries;
  the shop charges the bracketed brace price for exactly two.
- **Saves**: body armour and a shield each show the save they make together
  ("4+ save · 3+ with shield", "6+ save · 3+ with Gromril Armour").
- **Roster and warbands list icons** (gold, wyrdstone, rating, models, heroes, henchmen); the
  trading post and recruitment use icon tabs (`ui/IconTabs`) instead of text pills.
- **Warband history** section on the roster page (every audit row for the warband, manual edits
  with what changed); campaign activity lines carry an icon and link to the warband or match.
- **Rabbit's Foot** under the battle-only house rule: the exploration sentence struck through
  "(disabled by house rules)" via `RosterViewContext`.
- "Note" headings dropped from item rules; Range and Strength on their own rows in tooltips; the
  "Group totals shown" note removed (imported groups now hold size × kit); "Often banned" removed
  from the bans editor; oxblood link-buttons use light text; underdog line on the match page.

Answers for Tom: the two-missile-weapon warning is the rulebook's own rule ("up to two different
missile weapons ... a brace of pistols counts as a single missile weapon", Weapons and Armour); the
underdog bonus is computed from the ratings and offered as a tick in the report (now also shown on
the match page); the campaign move shipped with Phase 18; the Sorcerous Society spells were added in
Phase 17, so a re-import links them; "Hunter's cloak" is a custom item from the old tracker with no
rulebook entry, so it has no tooltip. Still to build: out-of-action attribution ("taken out by") on
the battle sheet and key events in the report (planned with Phase 20).

## Phase 19 built (2026-09-06)

Map campaigns, part one: the map, the districts, footholds and control, scheduling in a district.
Tom confirmed his group plays the published map rules as written and will clear the image with its
author before release. Migration 22 was pushed to the hosted project the same day; nothing has gone
to Netlify. Where it lives:

- **Data** (`rules/data/map/districts.ts`, generated from `reference/map/districts.json`): the 30
  districts with image coordinates, advantage text, `abundance` / `hard` / `gate` flags and 63
  two-way links. The rules text is `reference/map/campaign-rules.md`. The web copy of the map is
  `public/map/mordheim-campaign-map.jpg` (2400 px, 1.6 MB), loaded only on the map page.
- **Resolver** (`rules/resolve/mapCampaign.ts`, 11 tests): the map state is *derived*, never
  stored. Events are battles fought in a district (both sides explore it; the winner gains a
  foothold, the loser loses theirs; a draw or an unreported battle changes no footholds) and the
  GM's adjustments, folded in time order. From the state: `controllerOf` (the only foothold),
  `reachFor` / `canReach` (gates always; explored districts that connect to a gate through explored
  districts, plus their neighbours), `gateToll` (5 gc without a foothold at a usable gate),
  `bridgeTollOwedTo` (2D6 gc to the Middle Bridge's controller when it is the only way through),
  `suggestedScenario` (Surprise Attack with the controller defending; Defend the Find when both
  have footholds), `advantagesFor` (footholds; control where Hard Fought) and `standings`.
- **Schema** (migration 22): `matches.district_id`; `schedule_match(..., p_district_id)`;
  `set_match_district` (GM or participant, open matches only, audited as `set_district`);
  `map_adjustments` (GM-only insert with `reason`, campaign readers select, never deleted);
  `settings.mapCampaign` default false. `api/map.ts` builds the event list (matches in progress or
  later with a district plus non-returned reports, and the adjustments) and writes adjustments.
- **Screens**: campaign settings toggle "Play on the Mordheim Campaign Map"; `/campaigns/:id/map`
  (`features/map/`): the image with an SVG overlay (`MapCanvas`: pan, wheel and pinch zoom, circles
  filled in the controller's ink, foothold dots, reach highlight for a chosen warband), the
  district panel (advantage, flags, controller, footholds, explored, borders, "Book a battle here",
  GM corrections with a reason), standings, a warband's advantages in play, every district with
  reach and toll, and the GM corrections log; a map card on the campaign page; the schedule form's
  district picker (grouped by who can reach it, the rules' scenario with a "Use it" button, tolls,
  a warning when a side cannot reach it); the match page's district line with Move / Set.
- Integration test `api/__tests__/phase19.integration.test.ts` (3).

The report and trading side of the map (advantages, tolls, the defender's Leadership) was built as
Phase 20; see "Phase 20 built" above. Still text-only: the Pit's exploration swap and the
Amphitheatre's automatic pit-fight win (shown as reminders).

## Phase 18 built (2026-09-06)

Built straight after the Phase 13-17 release, per Tom's ordering: campaign transfer and the
simulator, with strike order and the two bespoke tables as fillers. Migration 21 was pushed to the
hosted project the same day; nothing has gone to Netlify. Where it lives:

- **Move a warband to another campaign** (migration 21 `move_warband_campaign`, `api/campaigns.ts`
  `useMoveWarbandCampaign`, `MoveCampaign` on the warband page beside Hand over): owner-only, invite
  code lookup with the same checks as joining (code, archived, roster cap), the current membership is
  closed with `left_at` rather than deleted, the new one is upserted (moving back reopens the old
  row). Battle records stay with the campaign they were fought in. Integration test
  `api/__tests__/phase18.integration.test.ts`.
- **The simulator** (`features/simulator/`, route `/simulator`, fifth navigation tab): the combat
  engine turned loose on any two warriors. Sides: my warbands (`useMyWarbands` + `useWarband` ->
  `combatantsOf`), a campaign roster (members via `useCampaign`, rosters readable through the
  `can_read_warband` co-member policy), or any published unit type (`combatantFromTemplate`: starting
  stats, kit ticked from `equipmentOptionsFor`, skills searched from the lists it may use, race and
  kind traits). Weapon / other hand / situation as on the battle calculator; house rules from a chosen
  campaign or the group defaults. Tabs: **Odds** (per-weapon thresholds, injury split, strike order,
  whole-phase chain), **Stat gains** (`computeStatGainBreakdown`: +1 to each characteristic,
  attacking and defending, in percentage points) and **Skill gains** (`computeSkillSensitivity`
  ranked, respecting the warrior's skill lists via the new `Combatant.skillTableIds`). Bars are plain
  CSS; nothing is rolled or saved.
- **Strike order** (`odds.ts` `strikeOrder`): Strike Last weapons, charging, Strike First on the
  first turn or when charged, then Initiative with the weapon's modifier, equal -> roll off. Shown
  on the calculator and the simulator.
- **Bespoke tables**: Wheelo (never promoted, destroyed on a 1) and Marauders' Eye of the Gods
  (`WarbandCampaignRules.postBattle`, rolled in "Kit after the battle" with the loss / win modifiers,
  Chaos Spawn after a loss retires the leader).

Not in this phase (unchanged from the candidates list): map campaigns (19-20), black powder,
captures, mounts, spell items.

## Phase 17 built (2026-09-06)

Tom approved the scope below minus the items left for a later phase (mounts, black powder, strike
order, captures, spell items, bespoke tables, the roadmap). Migration 20 was pushed to the hosted
project the same day; nothing has gone to Netlify. Where it lives:

- **Kit after the battle** (`features/postBattle/model/kit.ts`, `ItemEffect.postBattle` prompts in
  `data/itemRules/effects.ts`): Crimson Shade, Mandrake Root, Mad Cap Mushrooms, Hardtack, Cathayan
  Silk Clothes, Treasure Map, Lamp of the Djinn and Monkey's Paw. Rolled in the injuries step
  ("Kit after the battle"); `ReportDraft.kit` / `kitExtra`, report draft version 4; the report
  applies stat deltas, `stupidity` / `missNextGames` / `addictedTo` flags, lost items (item patches),
  gold and shards, and writes each outcome to the notes. Warpstone Amulet is an exploration aid.
- **Nurgle's Rot in play**: `AttackEventPayload.nurgles_rot` (a carrier's natural 6 to wound in
  close combat, `RollState.rotPassed`); the victim's `ReportContext.rotVictims` marks the flag; the
  pre-battle spread picks the warband member (`rot_spread:<id>` on the sheet); infected warriors carry
  the `nurgles_rot` trait into fights.
- **Animals as warriors** (`rules/resolve/animals.ts`): Wardogs and Gnoblar Fighters on a fighting
  hero are combatants (`kind: "animal"`, fixed weapons), an Animals section on the battle sheet with
  out toggles, starting models and rout tests (Gnoblars excluded), an Animals (D6 each) injuries
  section (`ReportDraft.animalsOut` / `animalInjuries`, dead on 1-2 = one fewer of the item), the
  warband maximum and five rating points each.
- **Recruit-time purchases** (`rules/resolve/recruitPurchases.ts`, `ItemRestriction.recruitOnly`):
  nine mutations as items (Great Claw and Scorpion Tail fight in the calculator) for the Possessed,
  Mutants, Court heroes, Marauder Mutants and Clan Moulder Rat Ogres; the hero hire sheet offers
  mutations and Blessings with the recruit, first at list price and later ones double.
- **Between-battle actions** (`rules/resolve/betweenBattles.ts`, "Instead of searching" on the
  Characters tab): Master of Poisons, Banditry, Slick Operator, the Merchant's Trade; each spends
  the hero's search and is written to the trade reason.
- **Elemental Lores** (Water, Fire, Earth, Air) in `data/campaign/magic.ts`; the Sorcerous Society
  rows in the wizard table point at "choose one".
- **Loose ends**: `SUBJECT_UNITS` in `resolve/skillRestrictions.ts`; the shop's destination shown
  before the rare search; the builder started for a campaign (`WarbandDraft.campaignId`, bans kept
  out of the lists and flagged on the draft).
- Left for a later phase: mounts and mounted combat, black powder handling, strike order, capture
  flows, spell and prayer items, Wheelo and Eye of the Gods, the roadmap items.

## Phase 17 scope (proposed 2026-09-06, approved the same day)

Everything still outstanding after Phase 16, gathered from the two audits, the parked roadmap and
what came up while building. Grouped so Tom can strike or reorder.

**A. Release chores (before or with the deploy)**
- Push migration 20 to the hosted project (`npx supabase db push --yes`), then the single Netlify
  release of Phases 13-16 (local build + `netlify deploy --prod --no-build`).
- After release: a fresh campaign and a re-import of the battle records CSV (shards and gold), hand
  the other players' warbands over, delete the ZZ TEST data on the old tracker when Tom says.

**B. Weapons and armour audit, Tier 2**
- A5 post-battle item consequences: Crimson Shade addiction and permanent +1 I, Mandrake Root -1 T,
  Mad Cap stupidity, Hardtack miss-a-game, Cathayan Silk Clothes ruined, Lamp of the Djinn and
  Monkey's Paw tables, Treasure Map and Map of Cathay exploration, Warpstone Amulet re-roll.
- A8 animals bought as kit fighting as warriors (Wardogs, Gnoblar Fighters): a combatant on the
  battle sheet, counted in the warband maximum, henchman injury rolls.
- A7 mounts and mounted combat: mounted saves, Barding, Lance and spear cavalry bonuses, mount
  attacks and stat lines, Cold One and Boar saves, mount deaths, rating for Rhinox and Temple Dog.
- A9 black powder: reload cadence and the Hunter skill, pistols in hand-to-hand, misfires (and the
  always-Experimental weapons), double-barrelled second wound roll, Blunderbuss line, mortar scatter,
  Pigeon Bomb flat D6, grape and chain shot effects.
- A11 strike order and Initiative modifiers (a note today; could become an "who strikes first" line
  on the calculator).
- A14 spell and prayer items once a spell flow exists (Tome of Magic, Book of the Dead, Liber
  Bubonicus, Holy Tome, Familiar re-rolls, Scroll of the Rat Familiar).
- Remaining consumables and tabletop items as prompts (Nets recovered, Bolas, Caltrops, Flash
  Powder, Fire Bomb).

**C. Warband rules audit, Tier 2**
- A17 recruit-time purchases and upgrades: mutations (Possessed, Court, Clan Moulder, Marauders),
  Blessings of Nurgle offered in the hire sheet itself (today they are shop items with a warning),
  Wolfcloak at creation for Middenheimers in the builder.
- A18 between-battle actions instead of a rare search (Banditry, Slick Operator, Master of Poisons)
  and rare-roll modifiers beyond the per-warband bonus.
- A15 capture flows: Pirates' Kidnapped, Stragglers, ransom and exchange between warbands.
- Per-warband bespoke tables: Wheelo, Eye of the Gods.
- Nurgle's Rot caught in a fight: the calculator logs a 6 to wound from a Rot carrier and the
  victim's owner is prompted to mark it; the spread victim on a 6 picked in the prompt rather than
  by hand.

**D. Loose ends noticed in Phase 16**
- Rare items: the destination (and so the "who may carry it" warnings) only appears after a
  successful search; show the destination first so the warning comes before the roll.
- The builder does not apply campaign bans (a warband is built before it joins a campaign); the
  roster validator catches it on joining, but the builder could take a campaign code up front.
- Sorcerous Society spells missing from the lore data (Frostbolts, Geyser, Crows Feast, Blindness
  of the Depths); custom items from the import ("Hunter's cloak") still unmatched.
- Skill restrictions are read from prose: unit names the reader cannot match (Gnoblar heroes are
  "Trappers") show a warning that the player may dismiss; a table of explicit unit ids would be firmer.
- Engine TODOs in `data/weapons/ranged-and-creatures.ts` (Bolas entangle, Cathayan Candles
  backfire, double-barrelled hits) overlap with B above.

**E. Roadmap (unchanged)**
- Server-side re-run of the post-battle rules; GM override request system for hired-sword and
  restriction blocks; full map-campaign support (territories, movement, map-driven scenarios);
  per-user light/dark toggle; a domain name; the CSV column mapping wants a real export sample.

## Release (2026-09-06, third)

Tom: "Okay can you push this update". No migrations pending (24 went up with Phase 21); local build
plus `npx netlify deploy --prod --dir=dist --no-build`, deploy 6a9d77bf5f1ecc77077bac99, commit
ca5dbc4. Live: Phase 21 (half-price armour switches at creation and in the shop, Rewards of the
Shadowlord) and the import questions sheet.

## Import questions (2026-09-06)

Tom, on being told the Bone Goliath fix would be undone by a re-import: "Maybe just a pop-up for
any import related issues like this? When the warband is first opened, it asks about any import
issues and asks them how to resolve."

`features/importer/questions.ts` derives the open questions from the roster itself (nothing new is
stored): a custom item the catalogue can name exactly or by a near match ("Cooking pot (counts as a
Helmet)" -> Cooking Pot Helmet), a name left in a hero's "Skills/spells to check" note with the
nearest skill or spell offered ("Flight Of Zim" -> Flight of Zimmeran), a hired sword whose name
matches a unit in the warband's own list (the Restless Dead Variant's Bone Goliath), and a henchman
group whose unit type is not in the template. Each question carries its answers as RosterChange[].
`features/roster/view/ImportQuestions.tsx` asks them in a sheet the first time the roster is opened,
saves each answer as one `import_fixup` edit, and remembers "Stop asking" per warband in
localStorage. The silent `fixups.ts` pass still handles exact matches without asking.

Live data, same day: The Call of the Grave was already on The Restless Dead (Variant) (the importer
picks the variant when a Bone Goliath is on the roster), and its Bone Goliath was converted from a
hired sword to the variant's own 0-1 henchman with a SQL one-off (audit reason `import_fixup`).
Rating fell 45 (the hired sword entry gave a flat +50; a henchman gives 5 + xp), it stops earning
experience (Mindless) and now counts toward the income band.

## Phase 21 built (2026-09-06)

Tom's answers: Cult of the Possessed only, Magister and Mutants as written; Wrath takes the kit;
Nothing spends the advance; Possessed! moves the kit to the stash with a note; mutation choices
unlimited; half-price armour applies at creation too, rounding down.

- **Half-price armour switches** (commit 1/2): `halfPriceShields`, `halfPriceHelmets` under the
  existing rule (sub-switches in settings, `isHalfPriceEligible(item, rules)`,
  `halfPriceIfEligible`, `describeHouseRules`, trading post copy); the builder prices under the
  campaign's house rules (`draftItemCost(item, houseRules)`, `draftCosts` / `validateDraft` /
  `draftToRosterWarband` / `draftToCreatePayload` take them, `BuilderRulesContext`); migration 24
  updates the settings default (pushed to hosted 2026-09-06).
- **Rewards of the Shadowlord** (commit 2/2): house rule `rewardsOfTheShadowlord`; data
  `rules/data/campaign/rewards.ts` (table, eligibility, Possessed mutation ids, allowed kit);
  resolver `rules/resolve/rewards.ts` (`planReward`: needs and outcomes for every row); new item and
  weapon `daemon_weapon` (S+1, +1 to hit, fused, unsellable); `WarriorFlags.daemonPossessed` with a
  roster warning when such a warrior holds other kit and a "Possessed by a Daemon" tag; the advance
  flow (`AdvanceDraft.mode 'reward'`, `AdvanceDraft.reward`, `setReward`, `HeroPlan.allowReward` /
  `reward`, outcome `'reward'` on the record, pick-later keeps the mode) with a `RewardPicker` in
  `AdvanceBody` used by both Bestow advancements and the wizard; `AdvanceContext.houseRules`
  threaded from the advances page, the wizard and the wizard's applier. Tests:
  `rules/resolve/__tests__/rewards.test.ts`, `features/advances/model.test.ts`.

## Phase 21 candidates (added 2026-09-06 by Tom)

- **Half-price armour, finer grained.** The existing house rule (armour at half price, shields and
  helmets excepted) gains two sub-switches: include shields (shield, buckler, kite shield, pavise)
  and include helmets. Small: `CampaignHouseRules.halfPriceArmour` becomes a small object or two
  extra booleans, `isHalfPriceEligible` reads them, settings UI and `describeHouseRules` follow.
  Open question: whether the discount also applies in the builder at creation (today it applies
  only in the trading post).
- **Rewards of the Shadowlord** (Mordheim rulebook optional rule; mordheimer.net
  /docs/optional-rules/mordheim-rulebook-optional-rules/rewards-of-the-shadowlord). As written:
  a Magister or Mutant of a Cult of the Possessed warband may, on a New Skill advance, roll 2D6 on
  the Rewards table instead of picking a skill. 2 Wrath (the warrior vanishes); 3-6 nothing; 7-8
  Mutation (D6: 1 lose a characteristic point of the player's choice, 2+ choose a mutation from the
  Possessed list, free); 9-10 Chaos Armour (4+ save, spells unaffected); 11 Daemon Weapon (+1 S in
  close combat, +1 to hit, chosen form, none of the base weapon's special rules); 12 Possessed!
  (+1 WS, S, A, W not counting to maxima; lose D3 skills of the player's choice; no weapons or
  armour except Chaos Armour and Daemon weapons). No other warband list in the data refers to the
  table. Tom wants it as a house rule (campaign switch) with a pop-up choice in the advance flow
  (wizard and Bestow advancements) for the specified heroes, and asked for questions first: which
  warbands beyond the Possessed, which hero types, how Wrath treats the kit, whether a "nothing"
  result still spends the advance, and how Possessed! is enforced on equipment. Large: new items
  (Daemon Weapon), a new advance branch with sub-rolls, a warrior flag, roster validation.

## Phase 18+ candidates (2026-09-06, awaiting Tom's ordering)

Tier 1 of both audits is done (Phases 14-17). Tom added three items; here they sit against the Tier 2
leftovers, with a proposed order.

**New requests**
- **Campaign transfer.** Move a warband from one campaign to another (leave + join in one step,
  keeping the roster; battle records stay with the campaign they were fought in; the GM of the
  target campaign can be asked to approve, or an invite code used). Small: one SQL function, a
  "Move to another campaign" action on the warband page, a settings toggle for whether joins need
  GM approval.
- **Simulator in Stirheim.** Bring the `mordheim-simulator` screens in as a menu section: the
  Character Builder (any published warrior or a custom profile), the odds analyser, the Stat Gain
  and Skill Gain analysers, house rules taken from the campaign. New: pick warriors straight from
  the user's active warbands (and enemies from the campaign's other rosters) instead of typing
  them. The engine and data already live in Stirheim (`src/rules/engine`, the simulator snapshot
  is `reference/simulator-src`), so this is screens plus a roster picker (~1,800 lines of React in
  the original, recharts for the analysers). Medium: one phase.
- **Map campaigns.** Interactive map of the region: a high-resolution image with a pan-and-zoom
  SVG overlay of nodes and links; per node its benefits (extra wyrdstone, income, rare-roll
  bonuses, scenario effects), whether it is a fort (one warband may hold it), who controls it;
  GM tools to set control and resolve contests; hooks into scheduling (fight for a node), the
  post-battle report (capture, node bonuses into exploration and income) and the campaign page
  (territory map, standings). Large: two phases (data + map + GM controls, then the battle and
  report integration).
  Source: the fan-made Mordheim Campaign Map by Philip (Beyond the Tabletop) with Tuomas Pirinen and
  others, https://beyondthetabletop.com/mordheim-campaign-map/ (English "for screen" JPG 4000 x 2829,
  5 MB; A2 print version 13 MB; French, German, Italian, Spanish, Ukrainian versions). The map is a
  standalone piece with its own campaign rules printed on it: districts with a key of benefits,
  Foothold tokens for winning a battle in a district, Exploration tokens for fighting there without
  winning, adjacency between districts, and Hard Fought Districts that only one warband may hold (the
  "fort" nodes). It is not official Games Workshop material, so embedding the image in Stirheim
  should be cleared with the author (or the map linked out / uploaded per campaign by the GM).
  Still needed from Tom: the node-link (adjacency) data from the CoWork project (any export: CSV,
  JSON, a table) and the benefit and Hard Fought list per district if it differs from the map's key.

**Tier 2 leftovers**
- Strike order and Initiative on the calculator (small).
- Wheelo and Eye of the Gods tables (small).
- Capture flows: Kidnapped, Stragglers, ransom and exchange (medium).
- Black powder handling: reload cadence, misfires, pistols in hand-to-hand, blasts (medium-large).
- Mounts and mounted combat (large).
- Spell and prayer items (blocked on a spell-casting flow).

**Proposed order**
1. Phase 18: campaign transfer + the simulator, with strike order and the two bespoke tables as
   fillers. Self-contained, no inputs needed, and the simulator is the first of the two USPs.
2. Phase 19 and 20: map campaigns, once the map image, node links and benefits are in hand
   (Tom gathers them while 18 is built).
3. Phase 21: black powder + captures; mounts after that; spell items when spells exist.

## Phase 22 built: spellcasting (2026-09-06)

The last of the magic gap. `rules/resolve/casting.ts` plays a cast as the rulebook does: 2D6
against the spell's Difficulty, with Sorcery and a Holy Tome always on, a Scribe's scroll, Dark
Ritual and Forbidden Rite spent by the player, re-rolls named and limited (Familiar and Rosary per
turn, Magic Gubbinz behind its own 4+, a Rat Familiar once a game, Mind Focus on one die of the
two), the enemy's dispel, and Magical Aptitude's second spell on a Toughness test with an injury
roll for failing it. Armour, a shield or a buckler stops a wizard; helmets, Chaos Armour and every
prayer are exempt. `BattleLiveState.casts` records each attempt, which is what makes
one-spell-per-turn and the once-a-game re-rolls hold between attempts.

`rules/resolve/grimoires.ts` reads the three books — Tome of Magic (own lore or Lesser Magic, or
Lesser Magic for a warrior with Arcane Lore; bound to its reader), Book of the Dead (Necromancy,
for a Necromancer or a Vampire with Arcane Lore), Liber Bubonicus (the Horned Rat list for a
Pestilens Sorcerer, or spellcasting for a Plague Priest with Magical Aptitude; spent, once per
campaign). A spell rolled twice is re-rolled or taken at one lower Difficulty. `GrimoireCard` on
the warband page.

Still text only: Staff of Damnation (warband special equipment, no catalogue item).

## Test round 3 (2026-09-06)

Tom's mobile pass. Fixed: the Restless Dead's missing skills and the hyphenated "warband-unique"
tab (one bug — nothing expanded the pseudo-table); the Warlock's staff (a hired sword's kit
sentence was one custom item; the entry's kit line is parsed into catalogue items now, and a Staff
is the rulebook's Club / Mace / Hammer entry, confirmed with Tom); trait tags as ids in lower case
with no tooltip; the bans list's strikethrough and its colour; no way back on a phone; "Hand over
to another player" renamed; the campaign map switch buried in the house rules; Members listing
warbands; a time on the schedule date; the simulator's analysers reduced to one-metric bars and
losing your weapon choice when the other side reloaded; the warband card's figures not lining up;
the Notes tab offering wyrdstone in a Skirmish; the Enemy tab's filler line and text-heavy header;
no sign of a fixture on the warband page.

Two faults the work turned up rather than Tom: a caster who knew spells from two lores only saw
one lore's, and both roll-throughs recorded twice because they stepped their state machine inside
a setState updater.

New shared pieces: `ui/Dice.tsx` (tappable pip faces, a tumbling Roll, and `RollResult`),
`match/battle/BattleNav.tsx`, `match/fight/CritWheel.tsx`, `match/schedule/RandomScenario.tsx`,
`rules/data/campaign/scenarioObjectives.ts` (generated; regenerate rather than hand-edit).

Waiting on Tom: which hero icon (six drawn, artifact). Decided by Tom: the experience bar is the
stretch to the next advance only, one notch per point, the point he stands on filled.

**Next phase.** Location negotiation: propose a district, approve, counter or roll off, with a
notice on the campaign screen. Needs a table and a migration. The defender's own device asking for
its saves belongs with it — the shared log only carries finished attacks today, so both want the
same widening of `battle_events`.

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
