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
