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

## Combat milestone 3 — natural attacks and living creatures (local)

#163: Added explicit naturalWeapons metadata for the three source-confirmed examples: Norse Wulfen and Eshin/Pestilens Rat Ogres (sources grade-1b-part2:768–772,2040; core-and-grade-1a:841). Roster combatants and simulator template previews carry the trait; loadoutFor supplies Teeth and claws at printed Strength and Attacks, no fist armour bonus or extra off-hand. No permanent inventory item is created, fixed animal weaponIds still win, and equipment supplied through approved overrides is preserved. Full real-template → combatant → kit → odds regressions verify Wulfen S4/A2, both Rat Ogres S5/A3, human fist fallback and no free off-hand. **#163 stays partially fixed:** wider no-equipment unit catalogue still requires source-by-source review (variants already mention Zombie Claws, Bone Goliaths and other creatures). Do not give every unequipped human natural attacks.

#164: Explicit Living heading overrides broad kind inference; Tomb Scorpion also has its documented race-trait exclusion. Survivors of Strigos now has an explicit Undead unit whitelist (Strigoi Vampire only). Source grade-1b-part2:2542 and grade-2a-part2:1626. Real-template regressions cover living Ghouls, Giant Bats, Tomb Scorpion (no Undead/Fear/psychology immunity) and retained Vampire Undead classification. This is a core creature-classification correction, not deferred Khemri-system implementation.

Focused creature/simulator tests: 41 passed. Typecheck and lint passed (existing audit-probe warnings only). No deployment or database changes. Next: finish wider #163 natural-weapon review, then #165 innate combat bonuses, #169/#171 critical handling. Preserve earlier completed combat work and do not rerun release/deploy.

## Combat milestone 4 — #165 innate bonuses / #171 Misericordia (local)

#165: Exact unit-rule headings Blessed Sight and Perfect Killer become innate combat traits. The Augur receives one failed-hit reroll in either phase (no stacking into repeat rerolls); Assassin Adept applies an additional -1 enemy armour modifier to melee and shooting, including interaction with weapon armour modifiers. Ordinary units receive neither. Source core-and-grade-1a:598,778 read. Real catalogue → roster → combatant → odds tests compare both phases to a control without the innate trait. This closes the combat scope, not a claim that every Augur characteristic-test consumer is automated.

#171: Replaced the misleading failed-wound-reroll mapping with explicit woundHighestOfTwo. Actual roller always asks for both dice, retains their separate app/manual source logs, and selects the higher face before checking criticals. Probability engine uses the maximum-of-two distribution, giving 27/36 wounds and 11/36 critical triggers at 4+ to wound, rather than 1/6 criticals. A 6+ wound requirement still forbids criticals. All 36 ordered dice pairs tested through the interactive state machine. Source02:502 read. The generic rerollToWound field remains separate for genuine rerolls.

294 engine/fight tests and typecheck passed. Build and lint passed (existing warnings only). No deployment/database changes. Next: #169 Body Blow needs an extra-attack event in BOTH probability aggregation and actual roller while preserving one critical per warrior. #163 remains partial for wider natural-weapon catalogue; review explicit no-unarmed-penalty units without assigning natural attacks to every disarmed human. Then broader #59/#68–70 and combat-specific #149–160. Do not revisit completed #162/#164–166/#170–175 or source-question #167 without new evidence.

## Combat milestone 5 — #163 Restless Dead variant (local)

Source-confirmed natural attacks now cover variant Zombies and Bone Goliaths, preserving printed S3/A1 and S5/A3 without asking players to manually equip Zombie Claws. Source restless-dead-variant:305–308,399–401 explicitly waives unarmed penalties. 45 real combatant/simulator tests passed. #163 remains partial; no deployment. Next: #169 Body Blow requires extra attacks in numerical aggregation and the interactive roller, preserving one critical per warrior and remaining parries. Source03:4258–4267 confirms additional to-hit/to-wound with normal saves; currently flavour only. Then continue remaining combat priority entries.

## Combat milestone 6 — #169 Body Blow (local)

Implemented typed extraAttack critical flag, conditional bonus wound events and an unconditioned nested normal attack. Probability DP carries wounds/critical/parries through that bonus; highest-hit partitions now preserve remaining parry capacity. Interactive roller inserts one plan after the original damage, with aligned pre-collected hits, and retains the consumed critical flag. Saved original still grants the bonus; original OOA ends resolution. Source03:4258–4267 checked. Seven regressions: numeric hand calculations, printed chart, remaining parry, saved original, no critical chain, OOA stop and multiattack hit alignment. Full ordinary suite 1,738 passed /169 skipped before the final printed-chart test; all four probability tests then passed. Build/typecheck/lint pass, existing warnings only. No deployment/database changes.

Next: continue combat priority #59/#68–70 and combat-specific #149–160, reconciling latest code first. #163 remains partial for wider catalogue; five explicit natural-attack templates now covered. #167 source disagreement remains open without changing the engine. Do not reimplement completed #162/#164–166/#168–175. After combat, proceed through the priority groups above.

## Combat milestone 7 — #68 henchman Rout Leadership (local)

Eligible surviving henchman groups now enter Rout Leadership selection and are suggested over lesser heroes once the leader is out of action. Partially depleted groups count; wiped-out/absent groups do not. Explicit never-leaders and hired swords cannot be suggested; removed fallback to an ineligible/fallen warrior when no eligible option remains. UI asks for explicit manual selection then; approved overrides preserved. Source01:1052–1060. Forty battle-helper tests plus typecheck/build/lint pass, existing warnings only. No deployment.

Next within #68: conditionsFor already computes stunned/knocked-down events in sheet.ts; RoutCheck currently receives only roster/template/sheet, so wire event-derived stun eligibility without losing per-model group semantics. Broader rout counting, Bribery and wagon abandonment remain. Continue other combat #59/#69/#70/#149–160 after reconciliation.

## Combat milestone 8 — #68 recorded stun eligibility (local)

RoutCheck now receives conditionsFor(events, roster.id, shown.turn, recoveries). Hero/single-model group stuns exclude suggestions; Knocked down is eligible under source01:1060. Recovery/reverted-event regressions cover the real condition resolver. Multi-model groups lack member identities, so retain availability with an explicit “confirm an unstunned member remains” note rather than disabling all members for one stun. Manual overrides preserved. Forty-two battle tests passed; final twelve Rout tests after adding the reminder passed. Typecheck/build/lint passed. No deployment or database changes.

Next #68 rout counting: startingModels still sums every group member; insignificantOut only handles equipment animals. sheetTotals and routStatus require consistent weighted denominator/casualties, not just changing the displayed threshold. Read the distinct Snotling/Night Goblin/Orc/Battle Monk/Ogre clauses first. Bribery and wagon abandonment remain.

## Combat milestone 9 — #68 casualty-only weights (local)

Typed routCasualtyWeight: Orc Mob Goblins/Squigs 0.5, Cathay Raging Peasants/Maneater Sabretusks 0. Actual casualties remain distinct; sheetTotals.routCasualties and routStatus share the resolver, with a visible explanation when adjusted. Starting denominator unchanged for these clauses. Source1a:2694,2711 /1c:237,1924. Audit incorrectly attributed Ignored Sabretusks to Ogre Hunting Party; actual source is Maneaters. Forty-nine battle/animal tests, typecheck/build/lint pass. No deployment/database changes.

Next: Night Goblin Just Squigs affects both starting count and casualties, and Snotling mobs count as one (different mob/all-warband wording across two lists). Read 1c:2816,3150,3172 and Snotling warband source before deciding grouping. startingModels is also used by enemy casualty UI, so keep actual model display distinct if introducing weighted denominator. Bribery and wagon abandonment remain.

## Combat milestone 10 — #68 Snotling collectives (local)

night_goblins_snotling_mob /night_goblins_web_snotlings pool by unit type across fighting groups, count as one starting Rout model, and one casualty only after final member lost. Actual startingModels/ownOutOfAction retained; separate routModels plus routCasualties drive test/own top-strip/warning. Fifty-one battle/animal tests and typecheck/build/lint pass. Source1c:2798–2816,3154–3172. No deployment.

Next: Just Squigs is only in Night Goblins WEB source3150, absent from non-web2760–2772; do not apply broadly. Needs denominator+casualty half weights with correct reachable quarter threshold. EnemyStanding currently aggregates enemy models into a fictitious one-warband Rout threshold; fix to per-warband advice or omit aggregate prediction, keeping actual casualties. EnemyView also inspect. Bribery/wagon abandonment still open.

## Combat milestone 11 — #68 web Squigs and enemy display (local)

Only night_goblins_web_cave_squigs gains routModelWeight0.5 +routCasualtyWeight0.5 (source1c:3150). rosterRoutThreshold rounds quarter to reachable half increments when present; example5Goblins+2Squigs→6count→1.5threshold. Non-web unchanged. EnemyView/single-enemy top strip use weighted per-warband totals; multiplayer aggregate no longer invents shared threshold. Fifty-two battle/animal tests +typecheck/build/lint pass, existing warnings. No deployment.

Next #68: Merchant Bribery and Trade Wagon abandonment, source read needed and reconcile any existing implementation before coding. Per-member stun identity remains explicitly table-confirmed. Counting and leader integration now locally covered; don't redo. Broader combat #59/#69/#70/#149–160 then remaining priority groups.

## Combat milestone 12 — #59/#70 Fearsome trait (local)

Learned Fearsome now grants causes_fear via exact traitsFromSkills to roster combatants and simulator previews. Description clarifies tabletop Fear tests; no false claim of automated Fear math. Source03:503–507. Forty-seven focused tests and typecheck/build/lint pass, existing warnings. No deploy. #59/#70 stay partial.

Read Bribery source1c:2298: LEARNED Merchant skill, not warband innate; pay5gc per non-Hero still in game including hired swords; exclude one existing casualty, may still need test, repeatable. Needs atomic gold deduction +persistent battle accounting, not a reminder-only closure. Abandonment1c:2457 requires failed Rout/no driver and winner loot/keep/ransom +rare-search lock except if all Merchant models OOA. No implementation yet. #156 inspected: still uses ALL defender melee gear and conflates first-turn/when-charged; Strongman itself already respected. Next independent combat work can address #156 or remaining #70 mechanics while designing transaction-backed Bribery.

## Combat milestone 13 — #70 failed Stupidity attack lockout (local)

Explicit failedStupidity context field, shown only for Stupidity attackers in shared situation controls, sets computeAttackCount to0 for melee/off-hand/ranged. Stale flag on a different non-Stupidity warrior ignored. Odds note explains; existing fight action disabled for attacks<1. Test/movement/casting remain table-managed and tooltip says so. Source01:1113–1130. 305 engine/fight tests +typecheck/build/lint pass. No deployment.

Next #70: failed-Fear-when-charged needs6 to hit, whereas failed charge-Fear means cannot charge; do not conflate. Source01:1083–1096 read. Fear-causing creatures ignore Fear. Current relevantToggles lacks target Combatant (only defenderKit), so consider passing defender to show applicable controls rather than global toggles. Invincible Swordsman always2+ needs explicit source handling if interacting. #156 defender-selected weapons remains; #68 Bribery/abandonment require atomic state.

## Combat milestone 14 — #70 explicit failed-Fear hit restriction (local)

Added failedFearWhenCharged and shared ignoresFear. Target-aware relevantToggles now receives defender in Battle/Simulator; control shown for susceptible melee attacker vs Fear target. Engine6+ only for failed received-charge test, not shooting/charging/nonfear target; immune/causesFear/activeFrenzy exempt. Aenur explicit always2+ preserved (source05:190), noted in odds. Source01:1083–1104. Actual Leadership test and failed-charge prevention remain table managed; controls explain distinction. 306 engine/fight tests +final36odds after Aenur assertion, typecheck/build/lint pass. No deployment.

Next: #156 selected defender weapons/strike-order conditions; #70 All Alone/Animosity/persistent-state gaps; #68 transactional Bribery/abandonment. Continue independent combat work then advance to next priority group, without treating umbrella tickets as wholly closed.

## Combat milestone 15 — #59/#70 precise immunity grants (local)

Learned Beastmen Fearless→Fear+AllAlone immunity; Noblesse→Fear only; Darkstalker→AllAlone only. Exact IDs via traitsFromSkills already shared with previews. Unit Loner checks explicit All Alone text; does not misclassify Shinobi’s leader exclusion. Added separate AllAlone badge; fixed generic Fear tooltip wrongly extending Cemetery Terror rule to all immunity sources. Sources1a:1617,1c:1109,1878,2a1:193,1025,2692. 316 focused tests +build/typecheck/lint pass; final source-label-only adjustment afterward. No deployment.

Next combat: #156 strike-order selection/conditions, #149 Rapier Barrage, #150 Serpent Staff mode, #152–154 special weapon procedures, #68 transactional Bribery/abandonment. #70 Animosity/persistent psychology still partial. Broad work can proceed independently of table-only All Alone tests.
