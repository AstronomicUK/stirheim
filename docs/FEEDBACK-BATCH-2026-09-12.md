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
