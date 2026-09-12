# Feedback, resurrection and reloading — approved 12 September 2026

Tom approved #230 first, then #229, then #231. Keep a single release batch. Core Priority 1–5 is already deployed; do not repeat that work. Codex owns design, frontend and integration; Claude assists with bounded backend implementation and source audit. Questions to Tom go through Codex.

## #230 backend contract (Codex/Claude)

UI types: src/features/feedback/types.ts. Tables/RPC names below are interface agreement, not implemented status.

- feedback_issues public readable: fields exactly FeedbackIssue. ID bigint starts at 232 so imported #1–231 retain original IDs. kind bug/improvement; priority high/medium/low; status reported/reviewed/working_on/implemented/confirmed. No raw internal audit data. Public notes are plain text.
- feedback_releases: FeedbackRelease fields. Public reads published only; maintainers can read drafts. Version unique. No publication before actual deployment.
- app_notifications: FeedbackNotification plus private user_id. Owners read and mark read only; no arbitrary notifications to other players. Reusable for later #229.
- feedback_maintainers: user_id, service-role-managed only. No self-promotion or trusting editable auth metadata. Tom's maintainer identity is pending.
- feedback_subscriptions: user_id + issue_id unique, owner readable; use RPC to follow/unfollow (including canonical merged issue). Original reporter follows automatically.
- RPC submit_feedback(p_kind text,p_title text,p_notes text) returns bigint id. Requires sign-in, reported default, medium provisional priority, actual profile display_name attribution (no spoofed model name). Trim/validate lengths title 5–140, notes 10–12000. Rate limit 10 submissions/hour/user. User-facing form explains reports public.
- RPC is_feedback_maintainer() returns boolean.
- RPC follow_feedback(p_issue_id bigint,p_follow boolean) returns void.
- RPC review_feedback(p_issue_id bigint,p_title text,p_notes text,p_priority text,p_status text,p_kind text,p_release_id uuid default null) returns void. Maintainer-only; implemented/confirmed require published linked release. Concurrent changes should reject stale edits: add p_expected_updated_at timestamptz (required UI argument).
- RPC merge_feedback(p_issue_id bigint,p_target_id bigint) returns void, maintainer-only, lock rows stable order, reject cycles/self and existing duplicate targets or resolve canonical. Transfer subscriptions, retain visible duplicate link and notes. Must not send false fix notifications.
- RPC publish_feedback_release(p_release_id uuid) returns void: service role or maintainer only, publish draft, transition linked working_on issues to implemented; atomically notify subscribers exactly once per issue/release. Reviewed/reported issues should not be silently advanced. Repeat idempotent. Existing implemented issues in this release also handled idempotently.
- RPC mark_notification_read(p_id uuid) returns void, owner only.

Claude: own migration 088, src/api/database.types.ts generation, backend integration tests only. Codex: API wrapper src/api/feedback.ts and frontend. Local disposable DB verification only, no deployment. Reconcile imports separately; don't bulk-import historical raw tracker into public tables.

## Acceptance still outstanding

Backend RLS/RPC tests; public and signed-in responsive board; exhaustive pagination/search; detail view; report form; follow and private inbox; maintainer review/merge; release history and publication tooling; reviewed historical tracker import; mobile/desktop visual QA. #229 source audit then implementation; #231 source audit and chamber UI mockups then implementation. Nothing in this batch is complete or deployed yet.

## Tracker milestone — frontend and real local journey

Public /feedback route and discreet Account link built. Desktop board, phone stage selector, full-title/details search, report detail deep links, signed-in submission, follow controls, maintainer review/merge, private release draft/publication and owner-only inbox are wired. All three board unit tests pass. Actual disposable two-user browser journey passes at 390px/1440px: submit → automatic follow → reload → maintainer review → private release draft/link → publish → implemented → one notification → detail link/read. Fixtures removed. Script in audits/2026-09-12-feedback/browser-acceptance.mjs. Layout-only screenshots use illustrative cards, not historical verification claims.

Claude backend checkpoint daf2e6a is local. Codex requested concurrency/idempotency hardening and verified the happy path; final backend test handoff remains to be read. Historical import manifest still needs review; tooling refuses unreviewed entries and never overwrites an existing report. Tom's maintainer identity is pending. No changes deployed.

## Awakening milestone — core path, not the whole #229 scope

Codex added migration 089, report-backed Awakening opportunities, owner-only notifications and an After the battle card on both affected warband screens. Applied reports preserve pre-death characteristics and kit; catalogue weapons/armour transfer to a separate Zombie group; miscellaneous kit/skills do not. A surviving caster and both applied reports are checked at acceptance. Duplicate acceptance is serialized; accepting blocks reversal of either report until the raised warrior is reversed. Changed raised rosters are not silently deleted by a correction. Decline/reversal notes and notifications are recorded. Multiple eligible recipient allocation remains pending Tom's ruling; no arbitrary first claimant is chosen. Only ordinary Heroes are covered by this source-defined path, not hired characters.

Five initial DB integration tests passed, with actual report filing and withdrawal, followed by added concurrent/correction tests. The actual two-owner 390px browser journey passed: source death report, notification, recipient warband prompt, raise and reload retaining profile/equipment. No page errors or overflow. See audits/2026-09-12-awakening/browser-acceptance.mjs. Local migration history is older than its already-applied schema; ordinary migration-up hit an existing column in migration 051. Applied only 089 directly, transactionally, to the local database instead; no reset or production access. Further source/edge-case review and broader #229 capture/Pirates work remain.

## Chamber display milestone — existing core guns only

The metallic chamber component is connected to ordinary blackpowder pistols and core handgun/rifle controls. A brace shows each physical copy separately and lets the player select it. Crossbow pistols retain their bolt-oriented controls rather than displaying a lead ball. Existing firing/reload logic is unchanged. Fifteen focused tests pass; an actual mobile battle proves firing empties only the selected pistol and reopening preserves one empty/one loaded copy without overflow or page errors. Script: audits/2026-09-12-chambers/core-pistols-browser.mjs. The double-barrel mockup uses illustrative states. Double-barrel persistence, wound sequence and house-rule integration are not yet implemented. Tom was asked whether the extra chamber bonus is per warrior versus per weapon; no answer yet.

### Chamber ledger checkpoint — 12 September, 19:21 BST (local only)

Added a backward-compatible chamber reload ledger and barrel count on firing attempts. The domain layer now tracks each model and physical gun separately, rejects firing more barrels than remain loaded, records one-barrel-per-gun reloads, blocks firing in the same reload phase, preserves corrections, and rejects reloads while a misfire remains unresolved. Existing ordinary-gun cadence remains unchanged. Focused chamber, blackpowder, reload and pistol tests pass (23); TypeScript passed before the final pending-misfire guard/test.

This is a foundation, not a finished double-barrel feature: the firing UI, shared hit/separate wound sequence and house-rule choices still need integration. No deployment performed. Claude was asked to confirm the corrected historical-import handover before continuing the Captured backend; no fresh handover had arrived at this checkpoint.

### View Rosters mini chambers — user addition

User requested: “Can we have a mini version on the unit box in ‘View Rosters’ on the battle sheet?” Added compact, always-visible physical-gun indicators inside own and opposing warrior/group cards. Uses the same core pistol/handgun availability calculation as the firing controls; group copies identify their model where equipment divides evenly. No controls are hidden behind these indicators. Double-barrel integration remains part of the ongoing #231 work.

Validation: full `tsc -b` and targeted lint pass. Disposable local mobile browser journey fired one pistol from a brace, reloaded the page, and verified the roster shows two mini indicators with exactly one loaded chamber, no overflow or page errors. First browser run stopped because the test left the firing dialog open; the corrected test closes it normally and passes. Local only; not deployed.

### Double-barrel firing and historical import verification — local

Nuln ranged weapons now declare one/both barrels, use one hit roll with separate wound/critical sequences, and persist spent barrels and explicit end-of-Shooting reloads. Each gun has its own state; mixed ordinary/double-barrel pistols share the model's Pistolier shot allowance. Two-barrel probability aggregation preserves the shared hit and separate criticals. The compact roster display now also shows both barrels. Raw reload bonus house rules remain pending Tom's clarification; Ostlander-specific rules and melee integration still require their own work.

Validation: 2,326 ordinary tests passed before the final mixed-pistol test (that new focused test also passes). Full TypeScript build passes. Local mobile double-barrel journey covers selecting both barrels inside the attack panel, a missed shot spending only the selected gun, page reload, mini roster, next-phase reload, and persistence. During verification the firing event was initially placed inside the ordinary-pistol branch; this was corrected and the browser test passed. The historical manifest was corrected against later evidence, then all 221 public records were imported into local Supabase, checked anonymously through mobile search/details, and the created fixtures removed. Nothing imported remotely.

The automation now references this batch rather than the completed core project. Claude resumed and is implementing Captured under explicit two-owner consent and strict roster-scope constraints. #181/#191 remain open: independent code inspection confirmed Claude's findings, superseding Codex's earlier recollection. Current batch #229–231 all marked working_on in the import manifest. Account links its version to the changelog; planned production identifier is 2026.09.12.1, which must match the final release record after deployment verification (local dev says Development preview).

### Pirates rule foundation and inbox pagination

Added resolvePirateKidnapped with five source-based tests covering exact casualty eligibility, excluded warriors, henchman recovery, both players' dice and original edits, the winner bonus, ties, Crew capacity and Crew/Swabbie profile/kit consequences. This is deliberately a pure resolver: Claude owns the following durable offer and two-roster integration, still outstanding. campaign_state.inheritedSkillIds is parsed and carried into Pirate Swabbie combatants and roster displays; a consumer test confirms retained Dodge affects real shooting defence and ordinary groups ignore this field. No Swabbie casting or experience access is introduced.

Feedback inbox, followed reports and release retrieval now paginate rather than silently cap results. A disposable local two-account browser journey passed submission, review, release publication, notification/read receipt, and visibility of 205 additional older notifications. All fixture accounts/records were removed. Full TypeScript build passes after peer cleaned up its temporary unused test variable. Batch remains local and incomplete; pending Tom's three rulings/identity questions, Captured/Pirates persistence, remaining reload variants/melee/house-rule wiring, final regression and one deployment.

### Further chamber and capture review — local

The actual mobile two-barrel roller passed a successful shared hit, failed first wound, successful second wound and injury roll, followed by persistent chamber/reload and mini-roster checks. Archived as audits/2026-09-12-chambers/double-wounds-browser.mjs. Ordinary pistol and handgun attempts now retain the henchman model index, so firing another tracked weapon blocks that model's reload. A source review also restored Prepare Shot cadence after a single-barrel Nuln shot; an unfired barrel is still physically loaded but the weapon cannot fire on the immediately following own turn. Focused regression tests pass. Full production build passed before that final cadence-only change, with existing CSS/chunk warnings.

Pirate recovery dice now preserve the original app roll and player edit even when body recovery fails. An Awakening consumer test confirms the raised Zombie actually uses retained characteristics, weapons and armour without skills or XP.

Claude delivered core Captured persistence and a two-owner browser journey. Review requested further safeguards before acceptance: proposal wording must match the actual permitted roster changes, and all affected report dependencies (including exchanged captives) must block unsafe report withdrawal. Claude is addressing those before durable Pirates integration. This handoff is not final acceptance and nothing has been deployed.

### Ostlander and close-combat chamber integration — local

Ostlander pistols/rifles now use the same persistent physical chamber controls and mini roster view. Their two hits retain separate Dodge/Lucky Charm checks and the normal one-critical limit; Nuln retains its shared hit and independent critical exception. Ostlander full guns fire both loaded barrels, while a partly reloaded gun fires its remaining barrel. Nuln keeps the explicit one/both choice. The probability engine now preserves shared-hit parries for Nuln and separate-hit parries for Ostland.

Double-barrel pistol combat profiles are available in melee, with per-pistol barrel choices, shared shooting/reload history and the existing once-per-combat restrictions. The roller's recording boundary now uses the actual active plan rather than counting barrel outcomes, preventing an unused brace pistol being spent when the first pistol takes the target OOA. Mobile tests passed for both Ostlander shooting/reload/mini roster and Nuln melee: first barrel fails to wound, second wounds and causes OOA, second physical pistol remains loaded after refresh. Archived scripts in audits/2026-09-12-chambers. Engine/roller/odds focused checks passed (191 before the final melee additions); profile/ledger tests passed (12). Full final regression is next. No deployment.

Regression checkpoint: all 2,350 ordinary tests passed, production build passed, and lint completed with only three pre-existing unused imports in the September 9 reconciliation probe. These checks cover the local reload/melee changes; Captured/Pirates backend acceptance remains separate and ongoing. No deployment performed.

### Players-calculated ammunition — local

The own-roster cards now offer Manage ammunition in player-calculated battles, since those battles do not expose the app attack roller. It reuses the chamber display and physical-gun ledger, records tabletop misses/shots as spent ammunition, respects core Hunter/Pistolier shooting cadence, offers the explicit no-shooting end-phase reload confirmation, and retains reasoned corrections. This is shooting/ammunition bookkeeping; damage remains player-calculated. The compact roster indicators stay visible on both sides.

The actual 390px local browser journey passed: tabletop both-barrel shot → saved complete plain-English log → reload page with only that gun empty → next own turn → confirmed reload → reload page with three of four chambers loaded. First test attempt queried a row before autosave had created it; polling was corrected and the full journey passed. All fixtures removed. Awakening and feedback backend regressions also passed 15/15. Captured/Pirates and the pending house-rule/allocation/maintainer answers remain outstanding; no deployment.

### Forced capture and Pirates review — local

Subjugator of Mankind now records eligible Hero attacks as captures and carries the saved event into the victim Hero/hired-sword injury step, without a Serious Injury roll. Reasoned overrides and reverted attacks remain respected. The 390px browser journey passed through an actual attack, saved event, prefilled casualty and capture injury screen; focused model tests passed 75 checks. Henchmen, animals and other special capture triggers still need their separate durable workflows; this is not completion of all #229. Pirates and core captive backend tests independently passed 17 checks after Claude’s integration. Review requested that editing a Pirate app roll preserve its original dice and that inherited skills display their names. No deployment.

### Henchman capture report integration — local, backend acceptance pending

Captured group casualties now have a separate report field with the source attack, captor, casualty ordinal and exact equipment rows. They roll no survival dice, reduce the active group size, and appear as captured in review/history. Intact uniform groups retain multiple copies per model; mixed or used kit requires a recorded allocation, bounded by actual losses, and no equipment may disappear when all losses belong to captives. The mobile combat-to-injury journey passed and the focused report/history suite passed 89 tests; TypeScript passed. A prior full regression checkpoint passed 2,355 tests and the production build. Claude owns migration 092 and the safe release/ransom/sale workflow, so this report-side increment is not yet accepted end-to-end or deployed. Animals and other capture variants remain outstanding.

### Forced-captive warband actions — local

The warband screen now offers a dedicated release/ransom/sale form for captured henchmen, using the shared consent workflow. It distinguishes these captives from Pirate body-recovery opportunities. Sale uses the approved tumbling dice and explicitly preserves original-versus-edited values. Real mobile browser checks passed release (exactly one model plus two axes returned) and sale (model stays absent, exact gold and two axes transferred, edited app dice retained). TypeScript and focused UI lint passed. Returning to a group that is already five models now forms a separate group; backend/client regression covers it. The backend's over-strict item-loss equality was corrected because used supplies and casualty losses share the final item patches; the client still requires full allocation of actual captive equipment. Pirate mixed-kit allocation, henchman exchange, animals and remaining special capture rules are not yet finished. Nothing deployed.

### Tom’s overnight decisions

- Double-barrel Hunter/Pistolier house-rule semantics are deferred for discussion with Tom; do not choose the extra-reload allocation on his behalf. Continue other work.
- Multiple eligible Awakening warbands: record the recipient agreed by the players. Do not use first-accept-wins.
- Tracker maintainer: Tom authorizes his own existing Stirheim account. Resolve the actual signed-in account identity before assigning access; do not substitute a QA account or guess a username.

Tracker identity verified read-only in Tom’s existing live Chrome session: **AstronomicUK**. Use this existing account for the authorized tracker maintainer setup when the release is applied; no QA account substitution.

### Agreed Awakening recipient — verified locally

Tom’s ruling is implemented in migration 094 and the source warband’s Awakening cards. When several warbands are eligible, the fallen Hero’s player or GM records the agreed recipient; recipients cannot assign the Hero to themselves. All affected owners are notified and the source report records the agreement. Unchosen acceptance remains blocked, and an accepted Awakening must be reversed before reassignment. Nine database tests passed, including permissions and reassignment, and a three-owner mobile journey passed source selection → unchosen caster blocked → chosen caster raises the Hero. The tracker maintainer setup script is prepared for verified username AstronomicUK and has only been dry-run. No production changes.

### Companion capture and equipment checkpoint

Captured Wardogs/Gnoblar companions now bypass injury dice, count as captured, persist the source event in `applied.captured_companions`, and leave the correct equipment row. Companion identities remain unique across multiple rows of the same equipment type. The warband case supports release, ransom and sale with recorded dice provenance; returns preserve notes and use the original active handler, or a selected active Hero/stash. The mobile Wardog journey passed actual attack → captured casualty without injury die → report-backed case → return restoring quantity and notes.

Pirate mixed equipment allocation now has a player/GM form. Injury-stage equipment losses are recorded separately from supplies consumed during battle and subsequent exploration recruitment. A mobile test allocated three shields across two fallen models as two plus one, with both exact shares saved. Focused capture/equipment/animal tests: 22 passed; TypeScript and changed-file lint passed. No live changes. The case-exchange UI is being integrated and still needs browser acceptance.

### Combined verification checkpoint

The mobile mixed exchange passed: a captured Wardog and Hero returned together, exact companion quantity/notes were restored and both cases resolved. The latest ordinary regression suite passed **2,364 tests across 194 files**, and the production build passed (existing CSS marker/chunk-size warnings remain). The first combined database run passed **37 tests across seven files**, including Awakening, core captive resolution, Pirates, forced henchmen, companions, exchange and the three-warband cross-flow. Further captive-case/tracker checks follow separately. Reversal UI now explains that newer captive outcomes affecting either roster must be reversed first. No deployment.
