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
