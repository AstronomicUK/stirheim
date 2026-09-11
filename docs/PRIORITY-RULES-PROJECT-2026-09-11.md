# Priority rules project — 11 September 2026

Tom authorised deploying the completed second feedback batch, then spending today working through the larger tracker areas in this order:

1. Combat and psychology: #59, #68–70, #149–175 (only combat-related entries in that range).
2. Experience, advancement and leadership: #62, #111–122, #178, #211.
3. Special warband mechanics: #120, #129–138, #147.
4. Equipment, trading and item lifetimes: #67, #139–146, #152–161.
5. Injuries, capture and recovery exceptions: #95–96, #124–128, #138, #158–159.
6. Magic rules and spellcasting consistency: #28–29, #32, #76, #85, #137, #179–186.
7. Game-day scheduling: #83.

These groups overlap. Reconcile each item against current code and evidence before implementing; older status lines are stale. Do not redo completed work or count a source/ruling question as a confirmed defect. Read source clauses before code and follow docs/RULES-AUDIT-METHOD.md. Preserve approved player overrides. Khemri #227 remains deferred. Do not alter live player histories for QA. No proactive subagents. Preserve unrelated dirty audit documents and selectively stage tracker changes.

Keep new work in local commits and accumulate the next release rather than deploying every fix. User authorised the completed second batch deployment; checkpoint that separately in SECOND-FEEDBACK-BATCH.md. Stop the daytime continuation after 11 September Europe/London unless Tom extends it; leave a concrete checkpoint of completed work, verification and next steps. Do not pause on one ambiguous rule if independent work in the current priority is possible.

## Current checkpoint

Second feedback release 5a8cac8 / Netlify 6aa396398993652a4f163c6f is deployed; migration72 applied and all100servedfiles verified. Follow the latest combat milestone below. New rules changes remain local.

## Combat milestone 1 — #173 Trick Shooter

Confirmed against reference/rules/03-campaigns-magic-optional-rules.md:421–425. Cover immunity must belong to the shooter. buildAttackInput incorrectly read defenderSkills; now reads attackerSkills for terrain/pavise cover. Regression verifies shooter vs defender ownership, hit probabilities and retained movement/range penalties. Engine and interactive-roller suites passed. Local only; do not redeploy per fix.

Next: #174 Eagle Eyes removes every long-range penalty instead of extending range by 6 inches. Source read at reference/rules/03-campaigns-magic-optional-rules.md:403–407. Current buildAttackInput.ts skips the penalty for any rangeExtension; combat UI has only a boolean longRange toggle. Need maintain true long-range penalty while exposing the extended threshold accurately, checking both simulator and battle consumers before changing. #166 WS0 automatic hits also confirmed still absent (source01:435); preserve normal wound/injury behaviour, do not reuse knocked-down auto-OOA flag. Other #162–175 remain to reconcile.

## Combat milestone 2 — #162/#166/#170/#172/#174/#175 (local)

- #162: combatantsOf now honours excludeRaceTraits for henchmen, matching the hero path. Real Black Dwarf Informer / Sons of Hashut Hobgoblin definitions lose Dwarf defences; real Dwarf counterparts retain them. Source grade-1c:248,3498–3502.
- #166: WS0 defenders are automatically hit in melee only. Shared automatic-hit input retains ordinary wound/save/injury behaviour, no invented natural-six poison trigger, no parry; stunned/knocked-down precedence retained. Both numerical UI tiles say Automatic and real roller explains WS0. Source01:435. Real disposable mobile roll-through passes wound/injury sequence.
- #170: shared missilePenaltyRules bridges printed tags for balanced thrown, awkward thrown and Accurate weapons. Balanced thrown ignore movement/range; awkward thrown and Accurate retain movement. Cover remains unless Trick Shooter. Situation toggles hide irrelevant penalties in simulator and battle. Sources02:belaying pins, Cathayan Candles, Firepots, fish-hook, javelins, sun weapons, knives.
- #174: Eagle Eyes no longer erases long-range penalty. Long-range toggle explicitly means beyond half the extended maximum; a visible mobile/desktop hint supplies that threshold and +6 inches. Source03:403–407. Real BS3 bow mobile test verifies 15/30-inch hint and 5+ long-range roller.
- #172: a cloak’s own save receives enabled Strength erosion, tested S3–6 melee/missile with house rule on/off. No new stacking interpretation; existing best-save policy preserved. Source02:2140.
- #175: Dodge resolves before a Lucky Charm; successful Dodge preserves it, failed Dodge offers it and never repeats Dodge. Choosing Keep the charm no longer incorrectly marks it used. Source03:557. Persistent battle state already consumes this same charmUsed field. Existing odds explicitly omit first-hit charms; no claim of new numerical Charm support.

Verification: 1,719 ordinary tests passed before adding the final #162 regression; #162 then passed all 32 combatant tests. Production build and lint passed before #162 (existing warnings only); final typecheck passed. No database changes, no deployment. Mobile WS0 also verified Log → View Rosters → My warband.

Hosted release CI34567376962: test/build job passed; browser12passed/1failed/3notrun. Remaining failure at e2e04:89 was the old direct My warband selector while Log was open. Corrected to View Rosters first and verified local real navigation. #201 stays open until hosted full suite passes on next batched push; do not push merely to re-run it.

Next combat work: #163 natural attacks and #164 living-kind classification; #165 innate Augur/Assassin bonuses; #169 Body Blow and #171 Misericordia multi-die critical distributions. Then broader #59/#68–70 and remaining combat entries #149–160. #167 remains an unresolved original-chart verification question: do not change the S2/T5 table from a questionable scrape. #228 Pit Fighter mini-battle is low-priority future work outside today’s priority batch.
