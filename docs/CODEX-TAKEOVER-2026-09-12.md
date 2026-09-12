# Today's core project: Codex takeover

Tom requested Codex take over Claude's remaining Priority 1–5 work on 12 September because Claude is approaching its usage limit. Keep the existing core-first scope and batch-release policy. This is a working continuation checklist, not a claim of release readiness.

## Handover

Completed via session handoff `ee58fbfe`. Claude stopped editing and released all claims; Codex accepted ownership. Read `CLAUDE-HANDOVER-2026-09-12.md` for its detailed evidence. Claude's addiction work is saved in `37496e3` (allocation) and `c67cd14` (database and application integration). Claude reports 2,183 ordinary tests and 11 upkeep/addiction integration tests passing, fixtures cleaned, and local migration 87 applied directly. Codex independently confirmed the final checkpoint compiles.

Correction to the handover's release suggestion: production migrations through 86 were already applied and verified in the preceding release. Only new migrations need deployment, after inspecting actual production history. Do not reapply 51–86, reset the database, or infer new deployment authority from a peer's handover. #53 remains subject to its acceptance criteria, not automatically closed because Claude recommends closure.

## Remaining work to reconcile and complete

1. **Core magic:** finish affected-model handling for personal spell protections, including Daemon Soul and area-spell Protection of Sigmar; verify the complete core casting paths and saved outcomes.
2. **Combat and psychology:** finish physical handgun/pistol reload integration and browser checks; reconcile remaining #59/#70/#96/#156 clauses; complete Holy Relic first-test history and explained corrections for table Leadership tests. Banner is supplementary.
3. **Equipment:** review and verify the addiction handover, including last-copy effect availability, historical reports, warnings, permissions and corrections. Finish one-vial/one-weapon poison selection; Healing Herbs action and approved house rule; Blessed Water; Garlic; remaining Tail Fighting choice semantics.
4. **Source decisions:** verify and document approved characteristic floors and concurrent recovery (#193), preserving source distinctions. The wound chart and advancement thresholds were already researched; reconcile evidence rather than redo them.
5. **Usability and release acceptance:** reconcile Claude's completed Priority 5 work against the brief, especially #53, and verify the approved dice/mobile flows. Run final relevant database, application, build and browser checks only after the implementation batch is coherent.

All three owner rulings are recorded in `CORE-RULINGS-2026-09-12.md`. Do not ask them again.

## Initial independent review

- Sixteen focused reload, supply-overlay and report-model tests passed during takeover preparation. They do not replace database or browser acceptance.
- Review the addiction ledger's original stock identity: the current foreign key sets `item_row_id` to null when a last copy is deleted. Check whether the saved audit evidence is sufficient for an explained correction; preserve a stable source snapshot if necessary.
- Claude's work was actively changing during the first compile check. Recheck after the safe checkpoint; do not report temporary missing imports as final defects.
- Codex's handgun work remains uncommitted in FightTab and reloadRules tests. Preserve all unrelated tracker/audit edits and stage only deliberate files.

No new push or deployment has occurred.

## Addiction integration verification after takeover

Codex's disposable 390px browser fixture exercised the real Start battle action, the supplied-dose confirmation, deletion of the last physical dose, creation of the per-match ledger, taking that dose and rolling its D3, reload, and switching to the opponent's battle sheet. Fixtures were deleted in cleanup.

The check exposed two integration defects: enemy rosters lacked the battle-supply overlay, and strike-order text used undosed Initiative even when the attack calculation used the drug effects. Both are fixed. The opponent now sees the supplied hero strike first with the saved I4–6 value. Own roster and report screens also wait for the supply query and show a load error rather than treating missing supply data as an empty ledger.

Validation: 78 odds/supply/report-model tests pass, including both-sided Initiative and no double application. Script: `/tmp/stirheim-addiction-mobile-qa.mjs`. Screenshot: `/tmp/stirheim-addiction-mobile.png`. The complete report filing/withdrawal browser sequence remains separate from this checked battle flow; earlier report-model and database coverage must not be described as a browser check.

Next: implement Healing Herbs reusable default plus single-use campaign setting and exact-use records; preserve every printed timing/target restriction and correction provenance. Also finish handgun UI verification before committing its separate current changes. #193 policy verification is complete in `a06bb3b`.

## Healing Herbs in progress

The campaign house-rule foundation now has `healingHerbsSingleUse`, default false for both new and older saved campaigns. Settings expose “Single-use Healing Herbs” with the printed Hero/recovery/outside-combat restrictions. Explicit true survives JSON persistence. The setting flows through existing settings-save and English activity-label machinery. Thirty-four settings/row/form/house-rule tests and compilation pass. This is **not yet a functioning healing action**; do not release or close the Herbs clause on this foundation alone.

Next implementation detail: `MyWarbandTab` displays `applyBattleEvents`-overlaid tallies while `edit` changes the raw sheet. Merely setting raw `woundsLost` to zero does not remove logged attack wounds. Healing needs an explicit saved use with original wound contributions and a reversible effect that both players' overlays read. Preserve the association with healed attack events so reversing an old attack cannot cause an old healing amount to erase unrelated future wounds. Record actual single-use quantities per physical inventory row, allowing a stack of doses to support separate uses; a boolean `itemsUsed` tick alone is insufficient. Report filing/withdrawal must consume/restore the recorded count exactly once. Keep normal reusable uses out of consumption. Hero-only, start-of-recovery and outside-combat confirmations remain required; do not revive OOA warriors.

### Healing action implemented locally

Heroes carrying herbs now have an action requiring confirmation of recovery timing and no hand-to-hand engagement. `healingHerbUses` persists the physical row, single-use policy at use time, restored manual Wounds and healed attack identities. Both players' battle-event overlays exclude those healed events, leaving later attacks intact even when an old attack is reverted. OOA, no wounds, wrong holder and exhausted-dose attempts are rejected. Corrections require a reason, restore reserved doses and old wounds, preserve later attacks, and require later uses to be corrected first. Conflicting later manual wound edits are explicitly blocked rather than overwritten.

The report deducts actual single-use counts by physical row, never reusable or corrected uses and never a legacy Herbs checkbox. Changed/missing stock blocks report review. This uses ordinary reversible report item patches; no migration is required for the JSON sheet field.

Disposable mobile check `/tmp/stirheim-herbs-mobile-qa.mjs` passed reusable and single-use modes, confirmation, saved use, reload, last-dose action availability and explained correction. Fixtures cleaned. Fifty-eight focused healing/event/sheet/kit/report tests pass. Full suite and final compilation recorded in the next checkpoint. **Still verify a real report file/withdraw cycle and cross-player healed-Wound display before closing the equipment clause.** No deployment.

Full ordinary suite: 2,189 passed with one legacy fixture failure (214 database tests skipped). That fixture used Herbs on henchmen as a generic consumable; switched it to Black Lotus so it still tests casualty-equipment ambiguity without contradicting the new Hero-only/reusable policy. Its six tests now pass. Compilation and targeted lint pass. Do not call this a new full clean rerun; only the failing fixture was changed and rechecked.

### Healing Herbs verification completed

`/tmp/stirheim-herbs-report-qa.mjs` passed actual mobile report filing with a final single-use dose: the item row was removed exactly once, and report withdrawal restored its original quantity. `/tmp/stirheim-herbs-opponent-qa.mjs` also passed: after healing, the opposing player's melee screen showed the Hero with all three Wounds remaining in both modes. Reusable/single-use reload and correction tests remain passing. All fixtures cleaned. Healing Herbs' core action and Tom's optional single-use rule are now ready for the combined release, not deployed.

Garlic next: the charge reminder is wired to an actual charging Vampire facing a target carrying garlic; ordinary fighters and subsequent non-charge rounds do not receive it. The Leadership roll remains table-confirmed. **Garlic's automatic one-battle expiry is still pending**; do not call the item complete. Source `02-weapons-armour-equipment.md:1687` says it expires even unused, so do not use an optional Taken-this-battle checkbox as the only consumption trigger. Account for warriors sitting out and group equipment allocation.

### Garlic expiry now implemented and verified

Carried garlic expires automatically via the report, without a used checkbox. Stash, absent Heroes (including Old Battle Wound flares) and absent group members retain their cloves. Even group allocations are proportional; uneven stacks in partly absent groups require a quantity in Review, validated against current stock/size. Report notes explain expiry. Actual disposable mobile report filing and withdrawal passed in `/tmp/stirheim-garlic-report-qa.mjs`; stock was consumed and restored correctly. Eight expiry/group-equipment tests, compilation and lint passed. This completes the Garlic core clause for the batch, with the charge Leadership test explicitly table-managed. No deployment.

Next independent Priority 3 work: Blessed Water action or one-vial/one-weapon poison selection. Pending handgun work is still uncommitted and needs actual UI verification; do not lose it. Earlier pending statements above are historical checkpoints superseded by these later sections.

### Core handgun reload checkpoint verified

The pending FightTab handgun integration now passed `/tmp/stirheim-handgun-mobile-qa.mjs`: start attacks and roll a die, autosave, reload the phone-sized battle sheet, see the reload restriction, verify Begin attacks is disabled, then record a reasoned correction and regain availability. Nineteen reload/physical-weapon tests pass, including per-copy independence, Hunter next-turn cadence and serialized state. Compilation and lint pass. The popup may still open for reviewing setup while reloading; its Begin action is blocked. No fixture remains.

This checkpoints the handgun path only. Pistols/brace allocation remain outstanding in #73, as do broader shooting-phase limits outside per-gun reload. Do not claim the whole tracker item closed. Continue core equipment/remaining combat work; no deployment.

### Blessed Water calculation foundation (not yet an available action)

Added an explicit automatic-wound path to both the probability engine and sequential dice resolution: a hit causes one Wound with no wound die/critical, while Dodge, non-armour saves and final-Wound injury resolution remain available. The isolated Blessed Water profile uses twice current Strength for range, ignores movement/long-range penalties but retains cover, disallows Undead/Possessed throwers, and wounds only Undead/Daemon/Possessed targets. It is deliberately not in the weapon catalogue until physical vial spending is wired in.

Validation: 203 focused calculation/dice tests pass; the complete ordinary suite now passes **2,206 tests**, with 214 database tests skipped. TypeScript passes. Lint passes with only three existing unused-import warnings in an unrelated audit probe. No browser claim for Blessed Water and no deployment.

Next: expose the action for a carried physical vial; reserve a vial even on a miss, persist exact row/use identity, allow explained correction, deduct quantities once in report filing and restore on withdrawal. Check actual roster trait derivation for daemonic Carnival units (the profile currently consumes explicit traits; do not assume every daemon is already mapped). Do not mark Blessed Water complete on this foundation. Preserve unrelated dirty audit/tracker documents and the remaining core project checklist above.

### Blessed Water vial ledger and report foundation

The sheet now saves each declared throw with physical inventory row, warrior/name, turn and optional shared attack link. Declaration reserves one vial even before a result; duplicate callbacks are idempotent, exhausted stacks are blocked, and corrections retain their explanation and restore availability. A linked damage event must first be reverted in the combat log before its vial can be returned. The report uses exact active throw counts, preserves legacy ticks only where no explicit records supersede them, and records readable consumption notes. Missing/insufficient/transferred stock blocks review. This is still **not exposed in the battle UI**; the caller must link the saved damage event and use the existing shared attack flow.

Seventeen focused ledger/report/sheet tests pass, including serialized state, stacks, last copies, corrections, linked-attack guard and no duplicate legacy spending. TypeScript passes; lint has only the pre-existing audit-probe warnings. The prior full-suite count belongs to the preceding calculation checkpoint, not a fresh rerun of these ledger changes. Next: action UI and real mobile report filing/withdrawal; daemon identity mapping remains to inspect. No deployment.

### Daemon target identity checked

Actual Carnival templates use both “Demonic” and “Daemonic” identity headings (source core-and-grade-1a.md:1950/1970). `kindTraits` now recognises those exact headings as `daemon`; neither Daemonic Aura nor Daemon Soul alone grants that identity. Tests exercise real Plague Bearer/Nurgling templates and exclude living Brethren/Brutes. This supports the core Blessed Water target rule without treating an entire Chaos warband as Daemons. 129 combatant/Blessed Water tests pass.

UI integration trace for next work: FightTab builds its weapons list at ~160, starts rolls in RollSection's `onProgress` (~660), and submits shared damage in `onLog` (~701). The onLogEvent interface currently returns Promise<void> (BattlePage discards the inserted row), so the new vial ledger's attack link needs an intentional callback/result or persisted payload association; don't assume a shared event ID is currently returned. RollSection creates its attempt ID internally. Preserve sequential resolution and one-vial-per-attempt reservation through reload/restart. No Blessed Water UI has been added yet.

### Blessed Water action available locally; mobile last-vial check passed

FightTab now offers carried Blessed Water as a ranged choice, including when the warrior carries no conventional ranged weapon. It uses the shared automatic-wound calculation, reserves one physical vial before each attempt, blocks another attempt/restart once exhausted, and offers an explained latest-throw correction. Shared attack payloads carry `blessedWaterUseId`; the correction helper refuses to return a vial while its linked event remains active. Existing attacks keep their prior callbacks and behaviour. The throw-range reminder uses the calculated Strength.

`/tmp/stirheim-water-mobile-qa.mjs` passed the actual 390px flow: open Ranged Attack, select Blessed Water, Begin, roll, verify last-vial restart blocked, close, wait for autosave, reload, verify another Begin blocked, correct with reason, verify availability restored. Disposable fixtures cleaned. This exposed and fixed the early “no ranged weapons” screen rejecting water-only carriers. Ninety-five focused odds/event/ledger tests pass, TypeScript passes and lint retains only unrelated audit-probe warnings.

**Still needed before closure:** real shared-log hit/miss/link and revert checks, a stack with multiple throws, real report filing/withdrawal, and ordinary-target no-effect presentation. Current nonqualifying targets have an impossible wound threshold (no damage); the roller still displays that impossible wound step. Do not claim the entire action acceptance complete yet. No deployment.

### Blessed Water report filing and withdrawal verified

`/tmp/stirheim-water-report-qa.mjs` passed actual mobile report filing after a real declared throw: the last physical vial was removed, the report contained the English vial-spending note, and `withdraw_battle_report` restored the original item quantity. Fixtures cleaned. This checks the withdrawal RPC, not a UI withdrawal button. The initial test advanced before the second declaration's autosave (an active-count-only poll matched the old record); it now waits for both use records and explicitly confirms the later casualty in the report.

Nonqualifying targets now skip the impossible wound die and receive a clear “only wounds Undead, Daemons or Possessed” log explanation. Seventy-five dice/Blessed Water tests and compilation pass. Remaining: actual shared-event logging/link/revert, plus a multiple-throw stack browser case. No deployment.

### Blessed Water core action ready for the batch

`/tmp/stirheim-water-log-qa.mjs` passed a real mobile two-vial stack: a tabletop-entered 6 hit a Vampire and caused exactly one Wound without a wound roll; a 1 missed. Both results were submitted to the shared log with distinct persisted `blessedWaterUseId` links and spent one vial each. Trying to return a vial while its event was active was blocked. Reverting the event through the authenticated RPC, reloading after sheet autosave, and correcting the throw restored one available vial. Earlier tests cover report filing/withdrawal and last-copy restrictions. Fixtures cleaned. The shared-log button is now offered for water misses as well as hits.

The full ordinary suite passes **2,216 tests**, with 214 database tests skipped; compilation passes. The earlier report and log scripts exercise local database writes separately but are not a rerun of all database tests. Blessed Water's core action is ready for the combined release; do not close mixed umbrella items #139/#140/#160 while their other clauses remain. No deployment.

Next assigned work: one-vial/one-weapon poison choice, remaining core magic personal protections/affected-model selection, pistol/brace cadence, Relic table tests/corrections, and Tail Fighting's alternative selection. Prioritise a coherent bounded clause; no outstanding owner ruling blocks these. Preserve the historical tracker/audit changes. Claude remains handed over and inactive despite the stale heartbeat wording.

### One-vial/one-weapon poison work started

Core source `02-weapons-armour-equipment.md:1966–1967` explicitly prohibits blackpowder and limits one vial to one weapon for one battle. `PreBattleEffect.weaponChoiceId` now scopes a coating to one physical profile identity. `computeOdds` preserves that choice when selecting the coated profile, so choosing an uncoated twin sword does not substitute the coated first sword. Missing selected identity applies to nothing. Tests cover primary/off-hand twins and the blackpowder restriction.

Also replaced the old Strength/save-modifier heuristic with the existing catalogue-based `isBlackpowderWeapon`: a pistol remains prohibited in its melee profile, while a non-blackpowder weapon is not prohibited merely because it has a strong armour modifier. Ninety-six odds/loadout tests pass, compilation passes and lint has only the prior audit-probe warnings.

**Foundation only:** the existing consumable checkbox still has no weapon selector, so ordinary legacy effects remain unscoped until the new UI/ledger is wired. Do not claim one-vial/one-weapon complete. Next implementation needs saved per-vial physical weapon bindings (row + copyIndex), exact use counts/corrections, and identical weapon choices in both attacker and defender views. `physicalWeaponChoices` in fight/weaponLoss.ts already supplies `${itemRowId}:${copyIndex}` keys; preserve them through loadout selection rather than matching only catalogue ID. Respect partially equipped henchman groups and broken copies. No deployment.

### Physical poison application ledger added (UI still pending)

`poisonApplications` saves each Black Lotus/Dark Venom vial's row, warrior and full physical weapon snapshot/copy index. Helpers accept carried or explicitly selected same-warband stash stock, reject depleted stock, unavailable/broken weapon copies, blackpowder and duplicate application of the same poison to the same weapon. A reasoned correction restores vial availability and records that earlier attack results require separate combat-log correction. Pair-profile weapons currently require an individual blade selection instead of coating both from one vial; that UI/profile split remains outstanding.

Post-battle context now reads these applications, deducts active per-row counts once, validates stock availability and writes English application notes. Eighteen ledger/report/sheet tests pass, with serialization, two sword copies, broken copies, stash and last-stock cases. Compilation and lint pass (existing audit warnings only). No new browser claim and no deployment.

Before exposing this in UI: propagate physical profile keys in both players' loadouts, replace core poison ticks with weapon/vial selection and explained correction, reconcile existing legacy ticks (especially mixed legacy/new uses from a shared stash, rather than silently dropping a dose), and inspect Dark Venom against poison-immune targets. Keep paired and per-member group weapon identity explicit. The earlier general all-weapon tick still exists; do not close the one-vial rule yet.

### Core poison immunity corrected

Dark Venom's +1 weapon Strength previously survived a target's poison immunity, unlike Black Lotus's special auto-wound. Core Black Lotus/Dark Venom effects now explicitly identify themselves as poison coatings; matchup preparation filters only incoming coatings against native, equipment-granted or active-effect poison immunity. The warrior's own drugs remain independent. Main odds and sensitivity preparation use the same target-aware step, and the sensitivity helper now preserves physical weapon choice IDs as well.

Regression evidence: Dark Venom vs an immune T3 target stays S3 with 25% hit-and-wound for the test matchup; the normal target still faces S4. Adding the user's own +1 Strength drug gives S4 even against immunity. Venom Ring immunity rejects both coatings. Ninety-eight odds/loadout tests and compilation pass; lint retains only the known audit-probe warnings. This fixes an actual calculation clause but does not finish the pending weapon-selection UI or poison ledger browser acceptance. No deployment.

### Selected poison weapon identities and legacy stock counts prepared

`FightSetup.weaponChoiceKeys` can bind the selected primary/off-hand profiles to physical inventory keys without expanding the original attack allowance. Both main odds and sensitivity respect the binding. Tests cover identical sword objects with poison only on the off-hand copy and a single selected henchman weapon from a five-member group; no extra attacks are granted.

Report poison counting now combines legacy uses with explicit applications rather than silently dropping a legacy use from another warrior sharing a stash row. A corrected explicit application supersedes only that warrior/item's old tick. Missing/insufficient stock remains a Review problem. Ninety-six focused odds/report/group-equipment tests pass, compilation and lint pass (existing audit warnings only).

Next UI wiring detail: FightTab's `physicalBindings` currently comes from `odds.weapons` after odds calculation. To pass keys into odds without a cycle, derive the poison bindings from selected primary/off-hand profiles first (or use a separate small binding helper), then pass those keys into `computeOdds`. Keep extra/natural attack bindings and Sword Breaker behaviour intact. Show the physical-copy chooser when poison applications exist, not only for Sword Breaker. Replace the core poison tick with the application control and read recorded effects for each player's sheet. No UI claim yet and no deployment.

### Claude invited to resume after usage reset

Tom authorised renewed parallel work. Handoff `ed8d5551` sent to `Stirheim Developer [8aefaa]`: finish core magic personal/area protections and five-lore acceptance, then Priority 5 reconciliation (especially #53). Codex released CastTab, casting resolver/test, magic types/data, nativeCaster test and the magic checkpoint. Claude must acknowledge/claim before editing. Codex retains battle shared state, FightTab/odds, equipment and report integration; shared interface requests should be coordinated explicitly. No acknowledgement at dispatch, so do not claim Claude has started yet.

Codex continues poisons, then remaining combat/equipment clauses and final integration. Existing approved rulings are unchanged. No deployment or push authorised by this handoff. The automation's old Priority 1 ownership instructions are stale: honour this current split and the bus claims.

### Poison selection UI — 12 September, mobile and report acceptance

Added an explicit vial/physical-weapon selector to the battle sheet. Legacy unscoped poison ticks pause their bonus until selected or corrected with a reason. Both hand selectors distinguish separate copies; used vials cannot exceed stock. Corrections remove future coating and preserve earlier attack results with an explanation.

Verified disposable local mobile battle: two sword copies, two-vial stack, selection persistence after reload, stock exhaustion and explained correction. Filed the actual post-battle report with one active and one corrected application: exactly one vial deducted; withdrawing the report restored the original two-vial stack. Focused poison/odds/report checks pass; TypeScript and lint pass (only existing audit probe warnings). QA scripts: /tmp/stirheim-poison-mobile-qa.mjs and /tmp/stirheim-poison-report-qa.mjs.

Individual blades of paired weapon profiles remain a separate integration gap; the UI explicitly excludes them instead of granting both blades a one-vial coating. Do not mark the entire poison workstream complete yet. Next: pistol/brace firing and the remaining combat integration checks. No push or deployment.

### Core pistol shooting — 12 September

Pistolier now checks actual per-warrior weapon quantities before granting the extra shot. A single ordinary, duelling or crossbow pistol remains one shot; an actual brace grants two with Pistolier. Added physical pistol selection and saved shooting/reload enforcement for core pistols. Resolve one shot fully before choosing another gun. A normal brace permits alternating loaded guns across turns, not two shots in one turn. Pistolier permits two loaded copies, after which both spend the next own turn reloading. Group members have explicit separate model selections; uneven stacks are flagged rather than silently assigned. Corrections preserve the previous attack outcome and restore only firing availability.

Acceptance: /tmp/stirheim-pistol-mobile-qa.mjs verifies normal-brace limit/reload persistence and correction; /tmp/stirheim-pistolier-mobile-qa.mjs verifies two distinct saved copies, no third shot, turn 2 reload and turn 3 availability. New helper tests cover normal brace, Pistolier, correction and group separation. Full suite: 2238 pass, 214 DB skipped; two failures are Claude's current casting tests referring to undefined spellOf (sent to Claude, whose files remain reserved). Lint passes with only existing audit-probe warnings.

Still open: close-combat pistol/brace profiles and once-per-combat tracking, paired-blade poison assignment, remaining combat checklist. These ranged-pistol checks do not close the entire #73 umbrella. No deployment.

### Further continuous work — 12 September

Actual addiction report acceptance now passes: battle start takes one dose from a stack of two; filing the report with Crimson Shade side effects resolved does not take a second dose; withdrawing the report leaves the original battle-start consumption intact. Script /tmp/stirheim-addiction-report-qa.mjs, disposable fixtures deleted.

Holy Relic now offers Fear, All Alone and a named tabletop Leadership test on individually tracked bearer cards. Player confirms first test; saved table/rout/stupidity history shares the benefit. Added an explained correction for tabletop declarations without erasing other Leadership history or claiming to reverse movement/outcomes. Mobile All Alone pass/reload/correction accepted (/tmp/stirheim-relic-mobile-qa.mjs). Multi-member group relic tracking remains manual.

Combatants now carry the exact saved flags.hates prose into a Bitter Enmity reminder and the Hatred toggle hint; no opponent is assumed to match automatically. Full structured target storage remains #96.

Claude handed over P1/P5 in fccb52c3 (b3f9e57, f1656dc, f346443). Assigned next task #96 in 14788f46. Released rules/types/roster.ts, injuries resolver tests, postBattle/model/derive.ts, model/state.ts and PostBattlePage.tsx for Claude to claim. Codex retains combatants/odds/FightTab; Claude must send the flag shape/helper interface for combat integration. Continue equipment, paired poison and close-combat pistols while Claude handles #96. No user ruling blocks this split.
