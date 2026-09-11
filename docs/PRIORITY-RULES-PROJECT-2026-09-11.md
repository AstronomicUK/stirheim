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

## Source checkpoint — #150 and further #163 coverage

Read Serpent Staff source02:597–605: its alternative is not merely WS4/S4. Bearer forgoes ALL normal attacks AND parries that round; staff makes exactly one attack and always strikes first. Existing data only tag alternativeStaffAttackWs4S4; do not expose a partial mode without suppressing offhand/bonus attacks and persisting lost parry eligibility. Ordinary staff is two-handed and can parry. Standalone clause is not dependent on full deferred Khemri campaign systems.

Source1c:224–237 confirms Raging Peasants fight unarmed without penalties; monks additionally gain +1Attack unarmed. Generic naturalWeapons currently displays “Teeth and claws”, inappropriate for peasants’ improvised tools. Extend weapon display/profile metadata before adding these to #163. No source change retained in this checkpoint; next turn resume substantive combat fixes, keeping these constraints.

## Combat milestone 16 — #163 Cathayan unarmed fallback (local)

Explicit unarmedProfile metadata flows roster hero/group +simulator→loadoutFor. RagingPeasants Improvised tools S3/A1, WarriorMonks Open-hand fighting S3/A2 including printed bonus. No ordinary fist penalties or inventory mutation; equipped weapons retained. Source1c:213–229. Fifty-five combatant/simulator tests +typecheck/build/lint pass. No deployment. Dragon Monk critical5+ and quarterstaff/unarmed split not yet covered; #163 stays partial.

Next meaningful scope: #156 selected defender weapons, #149 Barrage or #150 full staff alternative (constraints above), rather than more isolated reminder edits. Bribery/abandonment and remaining psychology require larger state flows.

## Combat milestone 17 — #156 charge/Strike First ties (local)

strikeOrder now resolves equal charge/StrikeFirst priority by Initiative per01:799–801; when-charged tags don't give the attacker a blanket first-round priority. Both StrikeLast falls through to Initiative. Thirty-seven odds tests +typecheck/build/lint pass. No deployment. #156 still partial: dWeapons=all carried defender melee weapons, UI has no explicit hand selection yet; weapon-specific Pike/Whip exceptions remain.

#149 source02:585–595 read: Barrage triggers on HIT but FAILED WOUND, not a missed hit (data tag misleading). Each follow-up at-1tohit, cap6+, continues on hit/failedwound; requires exact infinite-tail probability +live additional rolls while respecting remaining parries/critical limit. Do not implement as a simple reroll or fixed extra attack.

## Broad regression checkpoint — 11 September, 09:18 London

Full ordinary suite now 1,763 passed /169 DB skipped after all accumulated source changes, including latest strike-order fix. Output /tmp/stirheim-priority-morning-tests.log. No deployment/migrations. Tracker #156 status reconciled to partial.

Next implementation: finish defender hand selection for #156. FightTab currently derives defenderKit directly from loadoutFor(defender), while attacker has indexed WeaponChoice. Add defender choice keyed by defender id with valid main/offhand options, pass selected melee kit to shared odds so parry and Initiative use the SAME active weapons, and retain all carried gear for display/selection. Simulator already selects each side’s primary/offhand through controls; inspect its FightSetup construction so it can pass the chosen defender weapons rather than infer all carried gear. Validate a defender carrying spear+dagger+double-handed weapon: only selected weapon affects parry/strike order, switching warrior resets selection, both hands clear when invalid. This is the concrete next source change; avoid more reminder-only increments.

## Combat milestone 18 — #156 actual defender hand selection (local)

kitWithSelectedWeapons limits melee list for parries/order, removes shield/buckler/kite shield in melee when hands full but retains shooting shield protection. FightTab defender choice keyed by warrior id, missing-defender guard, main/offhand controls. Simulator defence/reverse odds uses existing chosen weapons. 158 focused tests +build/lint pass; final tsc after null guard passes. Real disposable mobile script /tmp/stirheim-defender-hands-mobile-qa.mjs passes selection changes, strike-order change, WS0 rolling and navigation. Earlier fixture-default failures corrected by selecting acting warband and attacker sword explicitly. No live changes/deploy.

Next: #156 remaining specialist Pike/Whipcrack order; #149 exact Barrage or #150 complete alternative staff constraints above. Need final batch full suite/QA once scope settles, not another deploy per fix.

## Combat milestone 19 — #156/#152 Pike specifics (local)

Merchant Pike initiativeFirstTurnBonus1 applied only opening round; firstTurn toggle relevance now considers selected defender gear as well. Tilean Pike twoHanded tag fixes offhand/shield handling; manSizedWielderOnly replaces misleading largeCreaturesOnly, with explicit reach/wielder table notes. Source02:538–560. Thirty-nine odds tests +build/typecheck/lint pass; explanatory note strings afterward. No deploy. Still partial: Tilean Pike over Spear precedence and Whipcrack separate bonus strike, plus broader special effects.

Next tackle one larger sequence (#149 Rapier exact additional-attack loop or #150 full staff mode) using earlier source constraints. Avoid mislabelling table-only constraints as automated.

## Combat milestone 20 — #149 Rapier Barrage (local)

Implemented exact continuing hit/failed-wound attacks, cumulative -1 capped6+, unconditioned followups after highest-hit partitioning, remaining parries/critical limit preserved. Infinite6+ tail summed geometrically; successful wound ends chain even if saved. Interactive inserted plans preserve later batch hits. Source02:585–595. Fullordinary1772pass/169DBskipped; final build/typecheck/lint pass existingwarnings,58focusedpass. Mobile /tmp/stirheim-barrage-mobile-qa.mjs passes, fixtures cleaned. No deployment. #149 fixed locally.

Next priority: #150 complete Serpent Staff alternative (one WS4/S4 attack, always first, forgo ALL normal attacks and parries this round); #156 Tilean Pike/Spear and Whipcrack exceptions; #68 transaction-backed Bribery/abandonment and remaining #70 persistent psychology. Keep umbrella statuses partial and proceed through the remaining priority groups. All checkpoints remain local for combined release.

## Combat milestone 21 — #156 explicit Tilean Pike exception (local)

Defending Tilean Pike beats charging Spear even at lower Initiative, source02:550–557. Later rounds and other chargers keep shared priority rules.40odds tests +build/typecheck/lint pass existing warnings. No deployment. #156 still partial for Whipcrack/separate first-strike attacks.

#150 implementation investigation: current FightTab parryUsed is phone-local memory +override, insufficient for staff forfeiture. BattleLiveState is Zod-parsed JSON, saved by save_battle_session and read by both players through sessions. Add a structured per-warrior staff activation record there (round/turn identity and usage), not a local toggle or parsed log sentence. FightTab must read defender's session to disable parry once staff activated; attacker should get exactly one WS4/S4 attack, suppress all other/offhand/Frenzy/skill attacks, and log activation. RollAttempt presently has no warrior identity (label only), so cannot safely infer consumption from existing attempts. Source also confirms ordinary staff two-handed; data missing that tag. Need read full round/turn lifecycle before implementing durable expiry. Nothing for staff changed yet; this independent Pike exception is complete.

## Combat milestone 22 — #150 foundation, NOT finished (local)

CombatContext.serpentStaffPower makes computeAttackCount exactly1 for primary serpent_staff and0 for all other weapons; effectiveOffensiveStats returnsWS4/S4. strikeOrder labels staff-first. Ordinary staff now twoHanded. New BattleLiveState.serpentStaffUses (default[]) records warriorId,turnKey,at,used. Helpers serpentStaffUse/activateSerpentStaff/consumeSerpentStaff preserve consumption idempotently.46focusedtests +typecheck/build/lint pass existingwarnings. No UI exposes power yet; #150 still open, do not claim completion.

NEXT MUST finish UI/state wiring before moving on. BattleTurns has round + active_index + turn_order; key combat phase by `${round}:${activeWarbandId}` (not just round; hand-to-hand occurs in each player's turn). Fallback legacy sheet.turn key when no tracker. FightTab already uses turns hook and enemy sessions. Read own activation from sheet, defender activation from defenderSession.live_state, same phase key. Disable defender parry for active staff even when weapon selection changes; explain forfeiture and preserve explicit agreed override. Activation control only for selected staff, writes through edit before rolls, normal attacks forbidden while active. Begin attacks consumes single staff attack; don't reset consumption on modal close/reload/reselect. Respect app/manual rolling paths; add readable log/attempt metadata. Simulator may offer preview toggle through relevantToggles, but battle should handle this as durable activation rather than generic local checkbox. Need safe correction/override for accidental activation without silently restoring spent attacks. Source says forgo normal attacks AND parries; ensure no partial closure. Existing roll attempts have no actor IDs; table confirmation needed for any attacks/parries already taken before activation. New domain helpers not yet used beyond tests.

## Combat milestone 23 — #150 complete locally

Staff foundation now fully wired to BattleSheet: explicit confirmation, durable activation, consumption on Begin attacks, all normal attacks suppressed, shared defender parry forfeiture +forced held two-handed staff, logged reasoned correction restores approved overrides. Deliberate existing roll restarts retained. Phasekey sharedround:activewarband or legacy:turn; phasechange closes previousrollsheet. Query loading/error disables activation to avoid saving wrong phase key. Logs use shown turn not stale underlying sheet turn. Simulator power toggle previews sameengine; reverse calc reads opposite side mode and forfeits parries, stale staff toggle masked when another weapon selected.

1777ordinarypass/169DBskipped;178focusedpass aftersimwiring;build/lint pass existingauditwarnings;finaltsc afterheldweapon UIpass. Final mobile /tmp/stirheim-staff-mobile-qa.mjs passes (activation,oneattack,reloadconsumption,opponentparryforfeiture),fixturescleaned. No deploy. #150 fixedlocally; do not repeat foundation/UI work.

Next combat priorities still pending: #153 Sword Breaker/Ladle outcomes, #154 nonstandard shooting, #152 fire/entanglement/etc, #156 Whipcrack separate first-strike attacks; #68 transactional Merchant Bribery and Wagon abandonment; #70 persistent psychology. Reconcile sources and existing code per item. #167 source dispute remains unresolved, no invented ruling. After combat continue remaining six priority areas in original order. All local commits remain for combined release; production unchanged.

## Combat milestone 24 — #154 blunderbuss per-target hits (partial, local)

Core+ChaosDwarf autoHitLine16inLongBy1inWide consumed by engine: onehitS3 pertarget, automaticHits/automaticHitReason=blunderbussLine. No BS/accuracy roll or skill-addedshots. Roller automaticweaponhit followsnormalhitdefences, notspell path; wounding/crit/saves normal. Relevantaccuracytoggleshidden. Explicitnotes for16x1line/allmodelsincludingfriends +FireOnce/PrepareShot restrictions (not enforcedyet).327enginefighttests +build/typecheck/lint pass existingwarnings. Mobile /tmp/stirheim-blunderbuss-mobile-qa.mjs passes directlytowound,fixturescleaned. No deploy. #154 stayspartial: multi-model singlefiringevent+durablecadence, mortar,pigeon,specialammo remain.

Source checkpoint #153: Ladle02:439–448 natural6TOHIT drops opponentweapon, no printed recovery timing in this paragraph. SwordBreaker02:706–715 successfulPARRY thenD6 4+ breaks weapon used; victim swaps toanotherorunarmed. These require selectedweapon identity/persisted consequences, not normal damage. Do not guess Ladle permanentloss or delete inventory based on ambiguity. Next substantial combat work can wire persistent effect records or Merchant Bribery; keep original priorityorder and umbrella statuses honest.

## Combat milestone 25 — #68 Bribery quote foundation (NOT integrated)

briberyQuote in routCheckRules.ts returns learned survivingHero source, nonHero breakdown includingHS/animals,5gc cost, affordability, adjustedcasualties afterpaidExclusions, threshold andtestStillRequiredAfterPayment. animals useholderId; exclude benchedowner butownerOOAdoesnotremoveanimal.14Routtests +build/typecheck/lint pass existingwarnings. No UI/migration yet, no deploy; do not claim Bribery fixed.

Next MUST implement atomic payment +durable exclusion ledger and UI. Pattern: battle_dispels migration68 RLS can_read_campaign(match_campaign(id)), read-onlytable +securitydefinerRPC. can_edit_warband authorizesowner/GM; heroes.skills text[] includes merchant_caravans_skills_bribery. Use per-payment UUID idempotency, warbandrow lock, matchinprogress/participant checks, sufficientgold +expectedgold check, and persisted immutable receipt foramount/nonHero count/casualty exclusion. Ledger must be separate from autosaved battleLiveState, or a stale phone can erase a paid exclusion. Update routCasualties/status/totals via queried receipts WITHOUT altering actual casualtytallies. PassmatchId intoRoutCheck (currently absent), displayquote/pay action, invalidategold/ledger andlogreceipt. Query allmatchreceipts soopponenttotalsalsoadjust. Need decide zero-nonHero edge from source before enabling free repeatedexclusions; currently purequote cancost0, no paymentUI exposed. Do not let it silently grant unlimitedfreebribes.

Server does NOT currently have equivalent applyBattleEvents overlay helper: UI `shown` is handle.sheet +sharedbattleevents. Therefore nonHeroquote calculatedfromshown may differfromrawsavedlive_state. Avoid pretending client count is independentlyserververified. Either calculate canonical effectivecasualties inSQL or make count an explicitlyconfirmedtable declaration with audit andboundedinput; preserve approvedoverrides. Neverread/alterproductiondata for this. LocalSupabase migrationsupthrough72; nextunused73. Briberyserver/UI/integrationtests are nextsubstantialscope before movingtoanother smallreminder.

## Combat milestone 26 — #68 Bribery paid flow complete locally

Migration73 battle_bribes +pay_merchant_bribery securitydefiner: match/ownerGM/learnedskill checks, positiveconfirmednonHerocount,expectedgold/exclusions,match+warbandlocks,idempotentUUID,atomicgolddebit+immutableexclusionreceipt. Count is explicitlyplayerconfirmedtabledeclaration (not falselyclaimedSQLcanonicaloverlay). Zero-member/freepayment rejected; UIexplains tableexception. APIqueryrealtime+poll invalidatesledger andtreasury/matchroster. RoutCheck BriberyControl confirmscost, retryexactpayload, updatedquotes; paidexclusions passed separately tosheetTotals/routStatus andopponentcounts. Actualcasualties untouched. SharedLogpayments inbothcombatmodes, includingGM/observer fallback. UIdoesn’tshowdefinitiveRoutcheckwhenledgerloadfails; explainscheckattable.

1782ordinarypass/173DBskipped inordinary; finalALL173DBpass /tmp/stirheim-bribery-db-final-tests.log.52focusedbattlepass. Build/lintpass existingauditwarnings;finaltsc afterobserverLogbranch passes. Mobile /tmp/stirheim-bribery-mobile-qa.mjs and /tmp/stirheim-bribery-manual-mobile-qa.mjs bothpass (debit90from100,oneexclusion,actual2OOAretained,reload,log),fixturescleaned. InitialmobileLogexactlabelmissfixedregex. No deploy. #68stillpartialforWagonabandonment etc.

IMPORTANT LOCAL DB: `supabase migration up --local` history was missing oldappliedversions; it replayed50andstopped51columnalreadyexists. This temporarilydowngraded prepare_fanatic_supplies. Restored committed61 SQLdirectly andall173DBnowpass.73applieddirectly with dockerexecpsql; historyNOTrepaired. DO NOT blindly migrationup/reset localDB nextturn. Apply onlynewSQLfiledirectly or deliberatelyverify/repairhistory. Production migrationstateunchangedthrough72; apply73onlyatcombinedrelease. Generated database.types diffcontainsONLYnewtable/RPC. No sourcechange tooldmigrations.

Next priority: Merchant Wagon abandonment #68 source1c2457 (failedRout+nodriver;winnerloot/keep/ransom;captorraresearchblockunlessallMerchantOOA), or otherstillopencombatmechanics #153/#152/#154/#156/#70. Briberyquote/backend/UI done; do not reimplement. Keepumbrella partial andmove throughremainingpriorityareas asdocumented. #167sourcequestionstillunresolved; #227Khemrideferred;#228Pitminibattlelowpriority. Localcommitsonly untilnextcombinedrelease.

## Experience milestone 1 — #111 Flesh Construct survival test (local)

Started the next independent experience corrections after the morning combat pass; remaining combat subsystem work remains open, not silently closed. #111 exact masters_of_horror_flesh_construct now gates survivalXP by2D6<=postinjuryLd. New optional ReportDraft.survivalXpTests storesdice/source/previous snapshots. Missing/invalidtest blocks experience step forsurvivingparticipatinggroup; failure logs0XPline; underdog/objective/correctionawards retained. UI app-roll+editableDieFields; originalapp results andmanualchanges survive reload/filedXPlog. Deadgroupsdon’tneedtest.242postBattlemodeltests +build/typecheck/lintpass existingwarnings. Mobile /tmp/stirheim-construct-xp-mobile-qa.mjs passes definiteapp→manual6+6, reload+filing andXP0; initialQAfieldname corrected subjectId. No migration/deploy.

Next experience priorities #112 Rigors/+2survival, #113 WEB Snotlings noXP; then#114distinctpromotions/#115–118maxima/#121–122succession/#62half-rate/#178/#211, reconciling existingcode ratherthantrustingoldOpenlabels. Remainingcombat #68Wagon abandonment/#69Censer/#70persistentpsychology/#152–154specialeffects/#156Whipcrack stilltracked. SourceWagon1c2457readfully: capturesafterFAILED Rout+NOdriver;loot/keep/ransom;raresearchblockedunlessALLMerchantmodelsOOA. Representation is catalogue trade_wagon plus synthetic merchant_trade_wagon unit overlay; no driver/dispositionflowfound. Ladle recoveryduration andCenserwieldertesttiming notguessed. Allworkstayslocalforcombinedrelease;73onlynewmigrationpendingproduction.


## Experience milestone 2 — #112 Rigors / #113 WEB Snotlings

Rigors metadata covers four original Heroes plus promoted Runts and Shoota Teams; hero-only survival award is2. WEB Snotlings gainsExperience:false; distinct Snotling Mobs unaffected. Merged Shoota Team metadata preserving injury rule. Build/typecheck/lint and260focusedtests pass (3existing audit warnings). #112 remains partial for enemy-kill XP (Runts postbattle5+, WEB halfXP roundeddown);#113 fixedlocally. No migration/deployment. Next: thosekill procedures or #114specialpromotions. #125 Snotling Mobs injurydeadOn1–3 is wrong against source1–2 and remainsopen, not modified here.


## Experience milestone 3 — #115–117 printed maxima (local)

Added Druchii, Snotling, Ogre(OgreHuntingParty), Gnoblar(OgreHuntingParty) data rows from printed tables. Exact unit overrides include promotable henchmen; BulliedGoblin retainsGoblin; genericracialrows unchanged. Existing OHP UNIT_RULES overrides updated (they takeprecedenceoverwarbandoverride). 78advances/campaignRules tests pass; build/typecheck/lintpass (3old auditwarnings). Tests cover full9stats/renamedHeroes/maxedadvancement andgenericrowpreservation. Oldtest expectinggenericGnoblar/Ogre updated tocorrectsource. #115–117 fixedlocal, no retroactivedatachanges/deploy. Next#118ChosenOfChaos skill-basedprofile, thenremaining#114specialpromotion workflows/#112enemykillXP. Combat outstanding asabove; maintaincombinedreleaseonly.


## Experience milestone 4 — #118 Chosen of Chaos maxima (local)

resolveRacialProfile accepts optionalskillIds; exact learned marauders_of_chaos_skills_chosen_of_chaos overrides originalprofile withWarriorOfChaos, matchedBy=skill. Namealone notenough; removing skill restoresbase; no autocharacteristicincrease; TrainingManual stacks maximumWS.65focusedtests/build/typecheck/lintpass existing3warnings. #118fixedlocal; Heroequipmentlist consequence remainsbroader#59/equipment scope, notclaimedfixed. No deploy. Next#114specialpromotion or#112enemykillXP; oldercombat outstanding asabove.


## Experience milestone 5 — #114 promoted Wight rare searches (local)

Both restless_dead_wights and restless_dead_variant_wights now noRareSearch:true; eligibleSearchers already filters thismetadata. ExistingandnewpromotedHeroes covered byunitidentity.47tests/build/typecheck/lintpass existingwarnings. Sourcegrade1c3459 +restless-dead-variant381–387 confirmedboth. VariantpromotiondoesNOTgrantWightBladesinthatclause; donotcopy standardgrantblindly. #114partial.

Investigation fornext: warriorSpecialRules inroster/view/lookups.ts calledbyWarriorCard/GroupCard andbattle/names.ts; lacksroleparameter, so promotedRunts stilldisplayTeenyHands andlackMobRule. Rigors XP/maxima alreadycovered dynamically. No catalogue MobRule/Rigors skillentries; preferderivedpromotionrules withrole context ratherthanaddingselectableskills incorrectly. StandardWightBlades6hitautowound vsvariant5+crit differ; combatants.ts traitsFromRules hasgeneric /wight blades/=>wight_blades_5plus so standardGraveGuardmaywronglygainvarianttrait. Enginehaswight_bladecatalogueweapon autoWoundOnHit6 but standardtraitforallheldweaponsnotimplemented. ReviewthisbeforeclosingWightgrant. Other#114effects stillopen; prioritycombatleftasabove. No deploy.


## Experience/combat milestone 6 — #114 Wight Blades (local)

Removedambiguouswightheading→varianttrait parser. kindTraits exactstandardGraveGuard andhero-onlystandardWight grant wight_blades_auto_wound; variantGraveGuardkeeps5plus; no variantWightgrant. Engine standardtraitmakesmelee6hitautowound independentofpoisonimmunity, normalcriticalcheck; rangedunaffected. ExistingrolleralreadyhandlesautoWoundOnNaturalSixToHit withgenericnotes; itsregressiontests pass. Simulationtemplaterole passedtokindTraits;rostercombatantshero=true. warriorSpecialRules addedoptional5thisHeroarg, WarriorCard+battlenamespassit;promotedstandardWightappendssourceGraveGuardrule. UIgranttestandactualcombatantconversiontestpass. Build/lint+297engine/battle/simtests;finaltsc+63roster/battletests pass. No browserQA thismilestone; no deploy. #114otherconsequencesremain. Next Snotlingderivedpromotionrules orspecialTLGToutcomes/#112killXP; keepremainingcombatlargerflowsinview.


## Experience/injury milestone 7 — Snotling promotion display and #125 (local)

warriorSpecialRules hero+Rigorsmetadata pulls fullMobRule/RigorsfromBulliedGoblin, deduplicatesabbreviatedheadings;promotedRuntsloseTeenyHandsdisplay. Henchmenunchanged. RigorsXPalreadymechanical; nearbySnotcount/Ldbonusstilltablemanaged, no claimautomaticMobRulecalculation orunpromotedRuntequipmentenforcement. #114partial. #125adjacentHIGHfixed: MobdeadOn1–2 not1–3;Shoota1–3/Runts1–4retained,all18die/unitoutcomestested. Sourcegrade2apart2MobNotSoSmall rule. Build/lint+47display/XP/advancespass;finaltsc+261campaign/postbattlepass. No deploy/livechanges.

Next substantial remainingexperience: #114OrcGoblin/ArabianSlave death ratherthanreroll, Wretchrepeatedresultinjury,SlayerDeathWishreplacementroll,Chapelknighthood/Lustrianreplacement,Sorcerousroletransition; #112enemykillXP. Manyarebackend/UItransactionalflows; do notclaimcompletefromtextalone. #121–122succession/#62half-rate/#178/#211 stillreconcile. Combatremainingasabove.


## Experience milestone 8 — #114 Arabian Slave execution (local)

Promotionnevermetadata optionalcasualty=executed onlyArabianSlave. planGroupTLGT returnscasualtyresult beforegenericreroll/cap: removeone, retainedgroupunchangedXP/levelups, followUpgroupcurrentthreshold;lastremovednofollowup. ExistingdiffRoster/groupcasualtyinventorysemantics retained. Newoutcomecasualty+summary, standarddiceauditpreserved. ResolveSheet skipsirrelevantpromotionname/tableschoicetoreview;GroupChoicefallbackwarning. Confirmusesexistingatomicresolve_pending_advance. 58model/roster tests and4localphase8DBtests pass includingnewgroupcasualtydelete/shrink+queue+repeatrefusal. Build/lint/finaltscpass (3oldwarnings). No migration/deploy. No browserQAyet; nextverifyrealmobileadvancementflowusingdisposableSlavefixture, thenOrcGoblin/Wretch/etc. Orcsourcecoregrade1a2695 sayskillonebutnoremainderrerollclause; do notblindlycopyArabianunlesscoreTLGTremainderframeworksupports. #114stillpartial.


## Experience milestone 9 — Slave mobile verification

/tmp/stirheim-slave-advance-mobile-qa.mjs PASSactualmobile390:groups3and1,approllthenmanual5+5,ContinueReview(noName/tables),DBunchangedbeforeConfirm,removeone,followuponlysurvivors,audithistoryApp+Manualpersisted,reload/nooverflow;fixturescleaned. RollcardgenericTLGTtextchangedtopromotionRule.note soexplainscasualtyimmediately. tsc+36modeltestspass. No deploy.

Next bounded#114candidateSlayerCult: grade2apart1:961,977 Hurlers/Stubbles gainDeathWishINSTEADOFimmediateHeroroll. IDs dwarf_slayer_cult_axe_hurlers / dwarf_slayer_cult_stubbles. NoDeathWishcatalogueskillfound; derivepromotiongrant/traitandtooltipwithrole plus suppresshero followupandadvancecount appropriately;verifyprintedDeathWishdefinitionbeforecoding. Wretchgrade1c1045: firstTLGTreroll, secondTLGTSeriousInjuryasHeroimmediately (currentalwaysgenericrerollwrong). OrcGoblincoregrade1a2695killone;remainderprocedurequestionstillnotinvented.


## Experience milestone 10 — #114 Slayer Deathwish substitution (local)

Correctiontopriorcheckpoint: Deathwish EXISTScatalogue (spelledoneword), id dwarf_slayer_cult_skills_deathwish, sourcegrade2apart1:718/676. ExistingHurlers/Stubbles metadata merged withpromotionAdvanceSkill preservingequipmentbans. promoteHenchman grantsactualskill+1levelUps, replacesadvanceDuewithskillLearned;promotionFollowUpsomitsHeroroll,keepsgroup;resolution+choiceUIexplainmandatoryskill. ExistingShootingoptionverified. traitsFromSkills andhero-onlykindTraits grantdeathwish+immunePsych+AllAlone;warriorTraitsfiltershatred/frenzy/stupidity. EngineexplicitDeathwishsuppressesall3evenifincomingtraitsretain; originalSkittishhenchmennotgranted. lookupsheroSkittishtextremoved. 259focusedtests/build/lintpass;finaltsc+129enginepass. No deploy.

NEXT: mobileQArealpromotion forHurlers/Stubbles, confirms actualskill/levelups/followups/sourceaudit. Adapt /tmp/stirheim-slave-advance-mobile-qa.mjs: template dwarf_slayer_cult/unitids..., name+2tableschoose,ContinueReviewConfirm; DBnewHero.skill includesDeathwish,noHeroPending,groupPendingifsize2. #114remainingWretch/OrcGoblin/Sorcerous/Chapel/Lustrian. Broadcombatprioritiesremainasabove; noinventedrules.


## Experience milestone 11 — Slayer mobile pass and #121 succession

/tmp/stirheim-slayer-promotion-mobile-qa.mjs PASSbothHurlers2andStubbles1: app→manual10,Combat/Shooting,reviewDeathwish,actualDBskill+levelups1,noheroPending,groupPendingonlysurvivor,auditApp+Manual,reload/nooverflow;fixturescleaned. FirstattemptJWTissuedfuture localclocktransient; retryPASS.

#121 fixedlocal: defaultsortnamedpriority/Ld/XP;explicitbyexperiencekeepsXP. tiedIdsmetadata equalleadingrank/Ld/XP; SuccessionCardtiehasnopreselectedhero+disabledAppoint, promptsD6attablethenchoose. RetainsoriginalskillTableIds insteadofunionleaderlists. Existingunitretemplate stillforleaderaccess, #122species/tempflows NOTfixed. Sourcecore03:81. Build/typecheck/lint+5successiontests pass; /tmp/stirheim-succession-mobile-qa.mjs PASStieprompt,blankselection,disabledAppoint,choiceB,DBcaptainunit+originalCombatonly,reload. No deployment/livechanges.

Next priority #178 repeatedpromotion sameadvance isconfirmedstillopen: promotionFollowUpsgenericgrouprow hasnosourceflag; SQL migration8 resolve_pending_advance insertsfollowUpswithoutcontext; needdurablepromotionRerollmarker (prefercolumn orimmutablemetadata) andreadintoAdvanceContext so10–12rerollonlythatfollowup, persistsreload andmanualrollupdates. Nextunusedmigration74 (73Briberylocalapplied, productionthrough72). DoNOTmigrationup local duehistorymismatch;applynewSQLdirectly. #211optionalhero-dismissal remains; #122temp/speciesandmagicfollowupsremain. #114otherflowspendingasabove.


## Experience milestone 12 — #178 durable promotion remainder (local)

Migration74 adds pending_advances.promotion_reroll booldefaultfalse. resolve_pending_advance unchangedlock/auth flow; derivestrueforgroupfollowUpsafterpromotionofsamegroup; refusespromotionoutcomeonflaggedrowbeforeupdate_roster. Otherindependentadvancesdefaultfalse,Slavecasualtyfollowupfalse. ColumnseparatefromrolledJSON survivesmanualedits. Domainoptionalboolsupportslegacyread;APIselect*already;ResolveSheetpassesctxflag;planGroup10–12requiresreroll. No clientfollowupshapechange. GeneratedtypesONLY3newcolumnfields (stripped unrelatedgraphqlgenerationdiff). Applied74directly localdockerpsql; migrationhistoryNOTrepaired, donotmigrationup. Productionthrough72, pendingcombined73+74. No historicpendingrowguess/backfill.

54focusedmodel/rows tests +build/typecheck/lintpass old3warnings;all5phase8DBtests pass includingflagpersistence/secondpromotionRPCrefusal/freshadvancefalse. /tmp/stirheim-promotion-reroll-mobile-qa.mjs PASSnormalpromotiononehero+2pending, remaininggroup12blocked, reloadstillblocked,reroll2confirm,onlyoriginalHeroPending;fixturescleaned. #178fixedprospective locally;nodeploy.

Next #211 optionalhero-dismissal atcap (approveduserhouseRule offbydefault), or#122successiontemporaryspecies;#114otherexceptionspending. Needbroaderordinary/DBsuitebeforecombinedrelease since74changescoreadvanceRPC. Lastfulldbsuite173before74;phase8now5tests(+1sinceSlave,+1marker vsold3). Keepremainingcombatplaninview.


## Experience milestone 13 — #211 optional Hero replacement (local, QA pending)

CampaignHouseRules dismissHeroForTalent requiredboolean/defaultfalse;domainsettingsdefaultfalsebackfillsoldsettingsread;settingsForms switch+overviewdescription. Updatedexactdefaulttestexpectations;legacySQLinputremainsmissingflagandnormalizesfalse. AdvanceContextPick includesoptionalflag;draftoptional dismissHeroId clearedondicechange. AtcapenabledGroupPlan dismissalOptions activeheroes, needpromotionuntilchosen;disabledreroll;#178/never/executed checkedfirst. Pure dismissWarrior thenpromoteHenchman, no mutationuntilresultconfirmed. OriginalHero retired(history)+kittostash normalhelper. Summarynamesdismissedheroandnewhero. BothchangesonesameexistingRPCtransaction. Tests invalidtable/staleID/disabled/remainder/originalimmutability;DBrollbacktestretiretheninvalidduplicateinsert leavesactive+unresolved.

Build/typecheck/lintpass (3existingwarnings),72targettests pass acrossfinalruns (last4houseRulesre-runafteraddingdefaultfalseexpected);6phase8localDBpass. No migration/deploy. #211NOTclosedyet. NEXT mobileQA: campaign GM=localplayer withsettings.houseRules.dismissHeroForTalent true, sixactiveReiklandheroesandgroupXP2,pendingadvance. Roll10 ->dismissalprompt ->selectoldHero ->name+2tables ->review ->checkunchangedbeforeconfirm ->confirmactivecount6,oldretired,kitstash,newhero,summarybothnames,followups; reload. Verifyoff/missingflag forcesreroll andswitchappearsinCampaignSettings. ReuseQAauthprefix /tmp/stirheim-slayer-promotion-mobile-qa.mjs;cleanupcampaign+band. No sourcefilesdirtyexceptoldaudits aftercommit.


## Experience milestone 14 — #211 mobile pass / midday full regression

/tmp/stirheim-hero-replacement-mobile-qa.mjs PASSactualGMcampaignUI:missingflagdefaultoff capreroll;CampaignSettingsRules&bansswitchonSavepersists;advance10dismissalprompt,Hero2select/nameCombatSpeed,reviewDBstillactive,Confirmactive6/oldretired/swordstash/newhero,historynamesboth,reloadwidth390. Fixturescleaned. #211fixedlocal.

Fullordinary /tmp/stirheim-midday-full-tests.log 1803pass/176DBskipped. FirstordinaryrunonlyfailedoldRACIAL_MAXIMUMScount31expected;updated35because4printedrowsaddedearlier;rerunallpass. AllDBrun175pass1timeoutscenarioEquipment movesexistingkit (5000ms threshold, took8s underload); isolatedentire26scenarioEquipmenttests rerunPASS3.72s. All176DBverifiedacrossruns;notasinglecleanfullDBpassclaim. No prodchanges;pending73+74.

NextHIGH#62remaininghalf-rate startingLevelUps: tracker1843–1855 identifiesManeaterCaptain20XP/MountainGuide8/OgreHunter20 helpernormalratebug. ReadbuilderstartingLevelUps/recruitment/lookup beforefix; retainnormalrate behaviorandno retroactivehistoryediting. Then#122temporaryleadershipspecies/followups, #114otherexceptions/#112killXP. Allpriorcombatremainingstillopen.


## Experience milestone 15 — #62 half-rate starting counts (local)

startingLevelUps nowadvancesEarned(...,unitRules(unit.id).advanceRate??normal). Sharedbuildercreatepayload/import/recruit pathsusehelperalready. Tests actualcreation+payload+recruit+UIxpProgress forManeaterCaptain20/4,next22;MountainGuide8/2,next12;OgreHunter20/4,next22;eacharrival0owed,nextthreshold1owed. NormalCaptain8levelupsretainedbyexistingtests.80tests/build/typecheck/lintpass oldwarnings. SourceSlowWitted1c1674,2apart12931. #62fixedprospective, nohistoricallevelupsrewrite/deploy.

Next#122temporarysuccession/species requirescohesivechange: currentappointLeaderalwaysunitretemplates; needpreserveGnoblar/etc whilegrantingleaderaccess andtemporaryreplacementflow. No isLeader/actingLeaderflagcurrentlyinRoster;leaderTemplate used~15calls, inspectallbeforeintroducingroleflag. Currentcore#121ranking/skilllistfixed;do notrebreak. Alternative next#114Wretch/Chapel/Sorcerous/Lustrian or#112killXP iflargersuccessionneeds stagedwork. Stillreturnremainingcombatmechanicsbeforeclaimingarea complete.


## Experience milestone 16 — #122 Gnoblar temporary leadership

Implemented and locally verified Ogre Hunting Party succession without turning a Gnoblar into an Ogre Hunter. Persisted `temporaryLeader` in existing hero flags (no migration), shared current-leader selection across battle/rout/pre-battle/post-battle and leader-only skills, visible roster role, replacement recruitment clears old role. Includes promoted Gnoblar Fighters/Flingers. Starting roster still needs an Ogre Hunter. No historical identity reconstruction.

144 focused tests passed; build/typecheck/lint passed with the three existing audit-probe warnings. `/tmp/stirheim-temporary-leader-mobile-qa.mjs` passed against disposable local data, verifying appointment, original unit/stats/skills, stored role, label and reload at 390px. Recruitment/replacement and later death covered by resolver tests. #122 is still partial; next investigate the other named succession cases and their inherited abilities/purchase timing. All changes local, no push/deploy.


## Experience milestone 17 — #122 Merchant successor skill table

Added source-specific grantsSkillTableIds succession metadata; Merchant adds explicit merchant_caravans_skills and retains all original lists/learned skills. Tests availableSkills before/after include Bribery, no duplicate table. 36 focused tests and build/typecheck/lint pass (old audit warnings). Source grade-1c.md:2247. Generic succession remains original skill tables only. Local commit only.

Next #122 research notes: Dreamwalkers grade-2a-part1.md:20 is more than temporary replacement — creation Priest D6 4+ certifies Dreamer, failed certification allows retry after next battle, a genuine Dreamer’s death permanently prohibits another and Priest resumes. Current code only Guiding Dream pre-battle and a succession note; do not merely turn on temporary metadata and imply complete. Battle Monks grade-1c.md:175 Decree prohibits buying any other warriors/equipment until dead Emissary replaced; source does not explicitly prefer Officer over higher-Ld heroes (current metadata does). Requires purchase guards with careful free acquisition distinction. Lizardmen grade-1b-part2.md:345 at least one leaderless game before replacement. Black Orc Oi Behave is already present in Boss template and thus displayed after current re-templating, though source-specific skill persistence/other species concerns remain. Do not double-grant identical rules blindly. Continue pending priority work without claiming combat or succession finished.


## Experience milestone 18 — #122 Battle Monks Decree

Implemented temporary leadership (original unit/skills/stats retained) and removed unsupported Officer-first ranking. Source grade-1c:175; generic highest Ld then XP. New leaderReplacementPurchaseBlock checks a recorded dead Emissary with none active; blocks positive-cost warriors/equipment except replacement Emissary. Integrated canRecruit, recruitHero/Henchmen including veteranCost, buyItem and BuyTab warning/disabled CTA. Does not block cost-zero acquisitions, selling or moving existing kit. Replacement uses existing clear-temporary-role path. No database migration or historical fixes.

80 focused tests plus build/typecheck/lint pass (old audit warnings). `/tmp/stirheim-decree-mobile-qa.mjs` PASS disposable local390px: original Monk role preserved, temporary label/reload, paid sword warning and disabled button, Dragon Monk recruitment disabled, Emissary hired via app, temporary flag cleared, sword purchase re-enabled. Local commit only. #122 other cases remain. Next return remaining combat/psychology items or take independently bounded succession rules; do not fabricate Dreamwalkers certification/recruitment timing or Lizardmen one-game delay. Last full broad run remains earlier 1803 tests before experience milestones15–18; focused checks pass since.


## Combat milestone — #69/#156 off-hand Whipcrack

Shared weaponAttackCounts assigns chargeBonusAttacks to first actual whip only, including offhand after sword. computeAttackCount has optional sixth chargeBonusAvailable (default true); callers with a full loadout use shared helper. Updated totalAttackCount, resolveCharacterTurn, computeOdds and computeOddsSensitivity. Preserves existing firstTurnOfCombat representation of being charged. Frenzy/order/dual-whip/failedStupidity tested. 349 engine/battle/simulator tests plus build/typecheck/lint passed; old audit warnings. No browser QA, no deployment.

Next #156 separate when-charged Whipcrack strike priority still absent from strikeOrder in features/match/fight/odds.ts. Must distinguish the single bonus attack from all normal attacks; do not make the whole wielder Strike First. Actual opposing-side sequencing remains tabletop/player responsibility. Current advice function returns whole-combatant order, so use an explicit separate bonus-attack explanation/Initiative tie rather than falsely declaring all attacks first. Source02:692. Other pending combat items unchanged.


## Combat milestone — #156 separate bonus-attack strike advice

strikeOrder wrapper separates normalStrikeOrder and bonus attack advice. Known charging attacker vs selected defender whip: one bonus first, compare shared strikeInitiatives with charge, Strike Last/Strongman respected, one bonus/charger-only reminder. Whirling Blades distinct two early attacks (Dance of Doom and offhand) from grade-2a-part1:861–865. Generic attacking firstTurn context uses conditional “If … was charged”, not guessed charge identity. Normal later-round/unselected-whip advice unchanged. 119 focused tests/build/typecheck/lint pass, existing warnings. No browserQA, no deployment. This is advice only; cross-player interleaving still manual. #156 status refreshed from stale defender-hands pending wording.

Next useful combat items: #153 disarming consequence persistence, #69 Censer toxicity test timing (target on every hit explicit; self timing needs reading), #154 multi-target/single-use shooting cadence; #70 persistent psychology. Do not turn probabilistic expected values into definitive rolls. Remaining succession special cases described milestones17–18. Continue local batching; no production push.


## Combat milestone — #152 Lustria Sunstaff melee

Item additionalWeaponIds maps same item to secondary printed combat profile; only sunstaff_lustria uses it currently. Added sunstaff_lustria_melee, Strength user/A normal/ordinary saves, no unsupported parry/concussion/two-handed bonuses. Kept rangedS4/noarmour/longrange and other Sunstaff unchanged. Loadout includes secondary profiles/copy counts and existing shrine blessing if applied. 353 engine/battle/simulator tests and build/typecheck/lint pass (old warnings). `/tmp/stirheim-sunstaff-mobile-qa.mjs` PASS disposable390px Battle Sheet both selectors and ordinary hit roll. Initial test expected generic To hit label; observed weapon-prefixed label and reran passed, no product issue.

Broad ordinary validation before Sunstaff change: /tmp/stirheim-afternoon-full-tests.log 1817passed/176DBskipped. No new DB validation needed for catalogue addition. All local, no push/deploy. #152 partial, remaining nonstandard consequences still pending.

Research repeated this checkpoint: Censer02:180 target hit→T test with6always wound, wielder6wound, Undead/Possessedimmune; self-test cadence and whether parriedhit triggers need source-consistent decision, don't silently invent. SwordBreaker02:715 successfulparry→D6 4+breakcurrentlyusedweapon; implementing requires selected-weapon persistence and careful already-rolled hit-batch semantics. Blunderbuss once/battle cannot simply block after first target because all models in its line must be resolved; needs one-shot group with multiple targets first. Avoid a one-target usage guard that prevents remaining line victims. Those remain open.


## Combat milestone — #152 Tufenk dry-target profile

Added optional CombatContext.dryTarget (defaultfalse); only relevant Tufenk tag gets checkbox; effectiveOffensiveStats returns S3 when set, otherwise S2. Shared engine and displayed profile agree. Explicit odds note distinguishes separate ignition (2+ dry /4+ ordinary), S4 ongoing fire/Recovery extinguishing and reload from calculated initial hit. Does not automatically infer that every undead warrior is dry, or implement burning state. Standalone weapon math, no deferred full Khemri system required. Source02:979–988.

354 engine/battle/simulator tests + build/typecheck/lint pass (old warnings). `/tmp/stirheim-tufenk-mobile-qa.mjs` PASS disposable390px: checkbox S2→S3,2+fire note, switch toDaggerhidescheckbox, nooverflow/errors. Local only. Next substantial combat remaining includes persistent fire/other conditions, multi-target single-shot actions, SwordBreaker/Ladle persistence and Censer tests. Explicitly preserve their open scope instead of claiming the numerical improvements complete those whole tracker items.


## Psychology milestone — #70 recorded Stupidity lasts until next own turn

BattleLiveState.stupidityResults default[] stores warriorId/turnKey/failed. warbandTurnKey uses round minus1 when active_index precedes own index, so an effect recorded late in round1 survives early opponents in round2 until own turn2. Legacy fallback own sheetturn. recordStupidityResult logs player declaration/correction without fake dice, gets displayed sheet.turn explicitly to avoid stale raw turn logs. FightTab persistent perindividual checkbox, readonly respects saved state; failed trait blocks start, waiting/error shared turn data blocks unsafe new test/start. CastTab checks same saved flag and actual combatant trait (Deathwish respected), explains restriction and guards begin before any spell attempt.

Multi-member henchmen remain explicitly local per-calculation with actor/turn key, because no member identity selector exists; do not persist one failed member as whole group. Leadership/movement dice and automatic mandatory prompt remain open. No migration; existing JSON state. Source01:1116–1127.

Final full ordinary test run /tmp/stirheim-stupidity-full-tests.log:1821pass,176DBskipped. Build/typecheck/lint pass (old warnings). Initialfullrun one 5s timeout in Gnoblar succession test’s dynamic module imports; changed those to static top-level imports, full rerun passed. `/tmp/stirheim-stupidity-persistence-mobile-qa.mjs` PASS local390px: saved failure/reload/no attacks/no spells, opponent round boundary keeps effect, nextownturn restores casting. Fixture needed recovered:true to avoid the ordinary Recovery dialog and maybeSingle for the not-yet-created autosave row; neither a product error. All disposable data cleaned. #70partial, local only. Next remaining combat includes psychology prompts/member identity and persistent weapon/fire effects; no complete-area claim.


### #70 — Start-of-turn Stupidity tests (local, 11 September)

Added a Battle Sheet reminder and individual warrior tests with 2D6 Leadership resolution, an explained Leadership override (such as a nearby leader), and the failed-test movement D6 outside combat. App rolls are saved immediately as pending attempts; confirmation records the original dice, any player edits, movement and the final outcome together. Replacing an existing test requires a reason. Failure uses the persisted attack/spell restrictions until the next own turn.

Verified at 390px with disposable local data: app rolls and edits, Leadership explanation, movement edits, one completed history entry, reload persistence, restrictions during the opponent’s turn and expiry at the next own turn. Fourteen focused tests, build/typecheck and lint passed (three existing audit-file warnings). Not deployed. #70 remains partial: multi-member henchmen need individual model identities; their tests and physical movement remain at the table. The reminder does not prevent agreed manual play before a test is recorded.

Checkpoint: mobile QA /tmp/stirheim-stupidity-test-mobile-qa.mjs PASS. First run used wrong button locators for DieField inputs; corrected QA selectors, no product issue. No migration. Continue remaining combat/psychology priority; no whole-area completion claim. Keep all fixes local for the combined release; do not push solely to run CI.


### #69 — Fog-enhancing shards and Censer missile defence (local, 11 September)

The carried loadout now applies the printed -1 to enemy missile hit rolls when the warrior has both a Censer and Fog-Enhancing Warpstone Shards. Neither item alone grants concealment; extra shard quantities do not multiply it, and melee rolls are unchanged. The loadout explanation names the effect. Source: 02-weapons-armour-equipment.md:1665–1671. Twelve focused loadout tests, build/typecheck and lint passed (existing audit warnings). No deployment or live-data changes. Censer Fog of Death Toughness tests and wielder damage remain outstanding under #69.

Checkpoint 15:12 London: local-only loadout fix. No browser QA needed for unchanged UI; defender profile integration covered by test. Logs /tmp/stirheim-fog-build.log and /tmp/stirheim-fog-lint.log. Remaining combat priorities still include multi-target once-per-battle shooting, persistent fire/disarming and Censer tests; do not guess ambiguous self-test cadence. Stupidity test UI previous milestone committed c852dc9 and mobile QA passed. Continue priority order on next heartbeat; keep no-push batching and preserve unrelated tracker work.


### #152 — Bolas must not wound their target (local, 11 September)

Corrected Bolas resolution so a successful hit ends with entanglement, never an ordinary Strength 3 wound, armour save or injury roll. Target wound/OOA odds are zero while hit odds remain available. Dodge can discard the hit first. The result and notes describe no movement, -2 melee WS and Recovery 4+ to escape; a natural 1 logs the separate Strength 3 self-hit for table resolution. Source: 02-weapons-armour-equipment.md:777–786.

236 engine/odds/roll-through tests and build/typecheck/lint passed (existing audit warnings). Local only, no live data modified. #152 remains partial: the entangled condition/recovery, backfire damage and once-per-battle usage are explicitly table-managed for now; no claim of persisted entanglement or complete Bolas automation.

Checkpoint 15:20 London: no browser QA for this milestone; pure real-roll state-machine and odds paths tested. New AttackInput.entangleInsteadOfWound, buildAttackInput sets impossible wound + disables automatic poison wounds; resolveSingleAttack defensively normalizes same. askWound ends with Outcome.entangled, log explains table-managed condition; no auto casualty controls. Pending future: durable entanglement/Recovery and self-damage transaction, not yet implemented. No migration/deploy. Logs /tmp/stirheim-bolas-{tests,build,lint}.log. Continue substantial combat tasks without treating milestone as full #152 closure.


## Combined combat validation — 15:27 London

Full ordinary suite after Stupidity tests, fog shards and Bolas: **1830 passed, 176 DB tests skipped**, 135 files passed /33 skipped. Log /tmp/stirheim-afternoon-combat-full-tests.log. No failures and no reruns required. Latest build/typecheck/lint remain passed from Bolas milestone. No database changes in these milestones. Session bus checked: no newly active peer or competing claim; old inbox messages unchanged. Local working source clean, only unrelated audit/tracker work remains dirty. No push/deploy.

Next investigation: #152 Beastlash conditional Fear (02:67–78) exists only as causesFearInAnimals weapon tag, unused in engine. Fear checkbox and hit penalty currently require defender.traitIds causes_fear. Animal accessories have kind animal but traitIds empty; henchman animals need exact identification from unit metadata/rules, not broad name guessing. A correct change needs a shared conditional Fear predicate in the Battle Sheet and engine (without granting the Beastmaster universal Fear immunity), respects selected Beastlash and existing Frenzy/Fear exemptions, and preserves normal/non-animal results. Torch also causes Fear in animals (02:2240), but full mounted/animal identity coverage may require separate work. Do not blanket-add causes_fear to all Beastlash wielders: that would incorrectly frighten humans and grant universal Fear immunity. Remaining persistent Bolas recovery/self-hit/usage and other combat priorities unchanged.


### #152 — Beastlash Fear against identified animals (local, 11 September)

Wielding a Beastlash now exposes the existing failed-Fear-when-charged control against an explicitly identified animal and applies the required 6-to-hit result. Ordinary Fear exemptions still apply. Humans and Gnoblar companions are unaffected; the wielder does not gain universal Fear or Fear immunity. Removing the selected Beastlash removes the conditional effect. Wardog equipment companions now carry explicit animal identity; companion bookkeeping alone is not used because it also includes Gnoblars.

183 engine/odds/animal tests and build/typecheck/lint passed (existing audit warnings). Source: 02-weapons-armour-equipment.md:67–78. Local only. This does not yet identify every animal henchman, mount or custom simulator unit, nor automate Fear tests or failed charges. Those remain open rather than inferring species from names.

Checkpoint 15:34 London: shared causesFearAgainst predicate, optional Character.isAnimal /Combatant.isAnimal and DefenderProfile.causesFearInAnimals. ANIMAL_KINDS has explicit boolean: Wardog true, Gnoblar false; real combatantsOf tested. Important discovery: kind animal also labels humanoid companions, so NEVER infer biological animal identity solely from it. Engine and checkbox use same predicate. Tests /tmp/stirheim-beastlash-tests.log183pass, build/lint corresponding logs passed. No browser QA or deployment. Further animal henchman metadata needs careful catalogue audit; preserve true Fear/Frenzy exemptions and selected weapon semantics. Broad suite before this milestone1830pass/176DBskipped. Remaining higher-scope combat tasks unchanged.


### #152 — Extend conditional Fear to catalogue animal units (local, 11 September)

Extended explicit animal identity to the existing Animal category in unit rules, so animal henchmen such as Warhounds, Giant Rats, Wolves, Slavehounds, Piggies and Sabretusks can use the Beastlash Fear handling. Uses the catalogue category, not a model's name or simply its lack of experience gains. Human henchmen, Zombies and Nurglings are not classified as animals by this change; Gnoblar companions remain excluded.

105 combatant/odds/animal tests and build/typecheck/lint passed (existing audit warnings). The underlying category includes the printed Animal special rule for Kroxigor; existing Fear immunity still applies. Custom units, mounts and hired companions outside the existing companion catalogue remain separate scope. Local only.

Checkpoint 15:42 London: UnitCampaignRules.isAnimal true on existing ANIMAL metadata; hero/group combatants propagate it. No new broad inference from gainsExperience=false or names. Source spot checks warbands/grade-1b-part1:2820, grade-1c:2200/2770/3152, grade-2a-part2:859, grade-1b-part2:402–408. 105 focused tests passed. Test initially omitted explicit combatantsOf undefined arguments; corrected before final successful build. No browser QA or DB changes. Continue remaining persistent combat effects and action sequencing; local commits only. Latest broader suite1830pass/176DBskipped preceded Beastlash/animal updates.


### #152 — Torch combat profile (local, 11 September)

A carried Torch is now selectable as the printed makeshift club: user Strength, -1 to hit and Concussion. It uses the conditional Fear-in-animals handling, without granting universal Fear. Added an explicit reminder that Torch wounds cannot be regenerated, the spotting bonus is 4 inches and the Torch lasts one game. No invented Gromril/Ilthilmar Torch variants are generated. Source: 02-weapons-armour-equipment.md:2233–2240.

59 odds/catalogue tests, build/typecheck/lint passed (existing audit warnings). Disposable 390px browser check passed: Torch appears from equipment, starts its melee hit roll, no page errors or overflow. Regeneration suppression, building fires and one-game consumption remain table-managed as stated in the UI; no full fire-system completion claim. Local only.

Checkpoint 15:49 London: /tmp/stirheim-torch-mobile-qa.mjs PASS disposable fixtures cleaned. weaponId on misc Torch, melee profile toHitBonus-1/concussion, excludes materialVariants. Existing itemRules Torch consumable battle unchanged; loadout item weapon branch uses profile, no new automatic consumption promised. /tmp/stirheim-torch-{tests,build,lint}.log pass. Next return persistent action consequences/sequencing or remaining combat rules; no push/deploy. The creature identity framework now handles existing ANIMAL metadata, Wardogs explicitly and excludes Gnoblar companions; no generic name guessing.


### #152 — Bolas once-per-battle throws (local, 11 September)

The Battle Sheet now saves a Bolas throw for each individually identified warrior when app resolution begins, even if it misses, and blocks another new throw after reload or a turn change. Bolas resolve one throw rather than gaining extra shots from attack-count bonuses. Players can also record a tabletop throw explicitly. An explained correction restores availability while preserving prior dice history. A new battle starts with fresh availability; nothing is removed permanently from the roster.

117 domain/odds/roll-through tests passed; the final domain rerun (8 tests), build/typecheck and lint passed after the tabletop-recording control was added. Disposable 390px browser QA verified a missed throw, saved usage, reload, disabled second throw and explained correction. Multi-member henchmen still require tracking each member at the table; persistent entanglement/recovery and self-hit damage remain outstanding. No deployment.

Checkpoint 15:59 London: BattleLiveState.bolasThrows default[]; recordBolasThrow idempotent perwarrior acrossbattle, correctBolasThrow requiresreason/log. Fighter Begin attacks guards and records use, manual Record tabletop throw logs noappdice implied. RollSection approved Start again/history remains supported within the declared throw. Group>1 never gets one shared usageflag. Engine Bolascount1. No migration. /tmp/stirheim-bolas-use-mobile-qa.mjs PASS; first QA tried clicking background correction while roll dialog open, fixed script close/reopen navigation, no product issue. Manual tabletop button added after browserpass, build/domainchecks passed. Logs /tmp/stirheim-bolas-use-{tests,final-tests,build,lint}.log. Next ongoing entanglement must derive from shared battle events with reversal and Recovery support; don't persist only on attacker's sheet or accidentally modify savedwarbandstats. Keep local commits, no production push.


## In progress — persistent Bolas condition foundation (16:07 London)

Added optional attack payload.entangled; real completed roll-through logs it from state.outcomes. Shared summary now plain English “Captain entangled Skritch with Bolas.” New activeBolasEntanglements derives unreverted single-model events for a warband, minus sheet.bolasRecoveredEventIds. resolveBolasRecovery validates D6, records entered/app-original→edited provenance, 4+ marks ONLY currently active event IDs recovered, leaves future throws unaffected. No migration (existing shared JSON). 16 domain tests passed, build/typecheck/lint passed (old audit warnings); final summary wording test rerun passed. Logs /tmp/stirheim-entanglement-foundation-*.

THIS IS NOT COMPLETE OR READY TO CLAIM IN TRACKER: still wire derived effects into both FightTab mine and enemy combatants (currently enemies use raw session; do not apply all battleEvents there blindly because existing wound-memory logic may double-count), adjust only battle WS by−2 floor0 without altering roster, and add Recovery UI with one test per own turn, app roll persisted pending immediately, reasoned manual correction, opponent-turn gating and event-specific recovery. No forced global group condition; target_size>1 stays table-managed. Suggested helper maps combatants to copied stats and flag from active event IDs using each side's raw sheet recovery IDs, avoiding overlay mutation. New recovery UI can appear beside TurnControls but account for its initial Recovery Sheet overlay; user must be able to reach tests before/alongside generic Recover Units. Finish wiring/mobile QA before marking persistent entanglement implemented. Source02:777–786. Preserve table-managed backfire scope. Keep commits local; no push/deploy.


### #152 — Shared Bolas entanglement and Recovery (local, 11 September)

Logging a Bolas hit now records entanglement in the shared battle log. Both sides derive the affected warrior's battle-only Weapon Skill reduction (-2, minimum 0); the saved roster and shooting stats remain unchanged. The affected warrior cannot select charging. Reverting the attack removes its derived condition. Multi-member groups remain explicitly table-managed.

The defender gets a Recovery panel, reachable from the turn-start dialog. Recovery is available during their own turn; 4+ frees the warrior from the current throws. App dice are saved immediately, later edits remain visible, and another test in the same own turn requires an explanation. Failed tests remain active; successful Recovery survives reload and does not pre-clear future Bolas hits. Out-of-action warriors are excluded from the Recovery prompt.

Full ordinary suite: 1837 passed, 176 database tests skipped. Build/typecheck/lint passed (existing audit warnings). Disposable 390px browser QA passed shared hit logging, defender reload, opponent-turn restriction, turn-start access, failed Recovery, explained correction, successful clearance and reload. Remaining Bolas scope: automatic self-hit damage and individual identities for multi-member groups. No deployment or live player data changes.

Checkpoint 16:19 London: completes previous foundation wiring. withBolasEntanglement maps raw combatants only (does NOT apply shared wounds again to enemy sessions). Combatant.entangled and WS−2 used both sides; charging hidden/forcedfalse foraffected attacker. Event entangled now enables Log to both sheets button and plainEnglish outcome. BolasRecovery ownturn gating, pending app roll saved with test warriorId/turnKey/attemptId; confirmed attempt upserts same log. Duplicate/reopened attempt requiresreason; futureturnnewkeyallowed. Generic turn-start dialog has Resolve Bolas Recovery first button to dismiss overlay and reach panel. Existing Recover Units can still be used for manual table handling, consistent with approved overrides. No migration. /tmp/stirheim-bolas-recovery-mobile-qa.mjs PASS twice; second included actual battle_turns gating/dialog. Final OOA prompt filter added after browserpass, build/lint rechecked. /tmp/stirheim-entanglement-full-tests.log1837pass176DBskipped. All local; next persistent weapon consequences/selfhit/multitarget remain, don't claimwholecombatdone.


## Next combat target — #155 pre-battle effects (16:28 London)

Source reconciliation for next implementation: Guiding Dream in reference/rules/warbands/grade-2a-part1.md:266–278. 1:−1Movement. 2–3: choose one enemy Hero, Dreamer +1 to hit that model. 4–5: choose one enemy Hero, +1Strength when fighting it. 6: choose one enemy Hero, Frenzy against it. Existing preBattle prompt stores only prose under guiding_dream:<heroId>; metadata outcomes are stable prefixes Disturbing Vision /Vision of Truth /Empowering Vision /Infuriating Vision. prompts defined features/match/battle/preBattlePrompts.ts:55–62. PreBattle.tsx stamp appends notes + preBattle map, no target selection currently. No Guiding Dream mechanics changed yet.

Recommended cohesive implementation: persist explicit per-Dreamer target identity (warband+hero ID/name) in battle JSON; choose actual opponent hero from cached useEnemyRosters in a Before Battle companion panel; changing target needs a recorded reason, preserve approved overrides. Apply only when that Dreamer attacks designated Hero, never all its warband or every enemy. Strength is characteristic +1 (fixed-Strength weapons should remain fixed); +1tohit best passes through weapon.toHitBonus BEFORE existing failedFear-on-charge6override, not lowering a final6threshold afterward. Conditional Frenzy must appear in relevant toggles and respect Frenzy-ended, and NOT grant global Frenzy vs other targets. Keep base roster unchanged. Disturbing Vision battle Movement only, positions table-managed. Tests need wrong target/warband, all3buffs, fixedSweapon, no universalFear-immunity leakage and explicit correction logs. Browser QA should prove target selection survives reload and actual attack numbers change onlyvsselectedenemy.

#155 Blessing source grade-1b-part1:963: passed leaderLd curse, each opposing blackpowder shot rolls4+ tofire. Do not attach a fresh test to each Blunderbuss victim: one firing action can strike many. Same multi-target boundary as #154. GuidingDream can be implemented independently first; leave Blessing partial until proper firing-action semantics. Existing predecessor milestones local only; source working tree clean apart from unrelated audit/tracker work. No new push/deploy.


### #155 — Guiding Dream target and combat effects (local, 11 September)

After a relevant Guiding Dream result, players can designate an actual enemy Hero before fighting. The selection persists; changing it requires a recorded explanation. Only the Dreamer fighting that Hero gains the vision's +1 to hit, +1 characteristic Strength or Frenzy. Both sides of the Battle Sheet use the same target-specific effect; other Heroes and other targets remain unchanged. Fixed-Strength weapons retain their fixed Strength, failed Fear still requires 6s, and Frenzy can end through the existing control. Disturbing Vision reduces battle Movement by 1 inch without editing roster stats; physical movement remains at the table.

Full ordinary suite: 1841 passed, 176 database tests skipped. Build/typecheck/lint passed (existing audit warnings). Disposable 390px browser QA verified saved target selection after reload and a hit roll of 3 succeeding against the designated Hero but missing another Hero with identical WS. Source: warbands/grade-2a-part1.md:266–278. #155 remains partial because Blessing of the Lady's blackpowder firing procedure is still outstanding. Local only; no deployment.

Checkpoint 16:37 London: new domain/guidingDream.ts reads stable stored vision prefixes, setGuidingDreamTarget logs choices/corrections. BattleJSON guidingDreamTargets default{}. GuidingDreamTargets component uses cached actual opponent roster Heroes, excluded hired/group targets, shown forDreamwalkers only afterrelevantroll. withGuidingDream derives both selectedFightTab combatants from their ownsession vision+target; loadoutFor clonesweapon.toHitBonus+1 (includingfallbackfist), adds effectnote, S/Frenzy/Movement derive oncopy. No roster mutation or DBmigration. /tmp/stirheim-guiding-dream-mobile-qa.mjs PASS sourcefixture VisionTruth + real app designation; engine tests cover strength/fixedS,Frenzyend,wrongtarget/warband,nonHero,Movement,reason andfailedFearoverride. /tmp/stirheim-guiding-dream-full-tests.log1841pass176DBskipped. No push/deploy. Next #155Blessing needs one curse test per actual blackpowder firing action, not per victim in a line/blast; #154multi-targetaction remains shared prerequisite. Other combat/selfhit/persistentweapon consequences unchanged.


## In progress — #154 Blunderbuss firing-action foundation (16:47 London)

New domain/lineShot.ts and battle JSON lineShots[] preserve one declared line with frozen target identities before resolving victims. Normal Blunderbuss blocks further shots for battle; Chaos Dwarf version uses ownTurn and requires +2 since lastshot. Explicit correction cancels usage record but keeps old sharedresults, explains reversion separately. unreverted shared event lineShotId/lineShotTargetKey only completes a matching target identity and shooter; reverting a result reopens that target without declaring another shot. Friendlytargets supported. Four focusedtests pass (freeze/persist/idempotency/oneuse/reload/reversal/identitymatch/reason/invalidtargets), build/typecheck/lint pass oldwarnings. Source02:997–1020. No migration. This is FOUNDATION ONLY — no firing UI is wired, so do not mark#154complete or deployed.

Next implement in FightTab using existing RollSection rather than duplicating roller. Suggested minimal integration: a LineShotControls component next to selected weapon lets player declare every model in the straight16x1line (include friendly models), freezes list on Fire, lists unresolved targets. Parent state lineSelection:{shotId,targetKey}, target resolution picks from combined own/enemycombatants, uses existing one-autoS3hit odds, includes selectionkey in attackKey, and adds event shotID/targetkey onLog. Add RollSection forceLog so even all-saved/no-wound outcomes can complete each victim. Prevent normal Begin attacks bypass when lineweapon lacks a declared unresolved target; preserve retrospective reroll/history as approved manualcorrection. Show usage/reload and a reasoned correction. Use actual ownturn (round−1 if activeindexprecedesshooter) and ownturngating. Multi-member groups need explicit per-model slots and fresh Wounds for each slot; don't incorrectly reuse first victim's lostWounds for next member. If groupidentities remain manual, say so plainly and don't claim all linevictims automated. Multiple carried copies likewise need explicit identity or a stated limitation with correction path. Avoid blocking remainingvictims aftermarkingfirstshotused. No repeatedBlessingtest pervictim — eventual Blessing rolls once on declaration, not targetresolution. Local-only commits, no Netlify.


### #154 — Blunderbuss firing lines and usage (local, 11 September)

The Battle Sheet now asks players to select every model in the straight 16-by-1-inch line before firing, including friendly models. One saved declaration creates separate automatic Strength 3 hits for its targets. Each result, including a failed wound or successful save, can be logged and the remaining targets resumed after reload. Reverting a target result reopens only that target. Friendly casualties award no kill XP.

Normal Blunderbusses are limited to one shot per battle; Chaos Dwarf Blunderbusses require a complete own turn between shots. Group members have numbered slots so one member's shot does not consume the entire group's weapons. Players assign those numbers consistently at the table and identify models still in play. Each group target starts with its own wounds rather than inheriting the previous member's; prior wounds can be entered before resolving a multi-Wound model. Tracks one weapon of each type per model; extra copies and mistakes have an explained correction path that preserves existing result history.

Full ordinary suite: 1845 passed, 176 database tests skipped. Build/typecheck/lint passed (existing audit warnings). Disposable 390px browser QA passed a line containing an enemy and friend, harmless result logging, friendly casualty without kill XP, reload and prevention of a second shot. Reload cadence, distinct firing models, reversal and identity matching are covered by domain tests. #154 remains partial for Mortar, Pigeon Bombs and other special ammunition. No deployment.

Checkpoint ~17:00 London: LineShotControls integrated via parent lineSelection and existing RollSection forceLog. Targets combinedmine/enemies; frozenkey includeswarband/model/slot. Shootermodelslot stored/usagefiltered (default0 backwardscompat), assignedmanually consistently. Blankline forbidden andfiregatedownturn/notStupidity, resolvingpreviousdeclaredtargets remainspossible later. Standarddicebutton/Beginblockedwithoutdeclaredunresolvedline. lineTarget forces1attack; groupvictim woundsreset0 andeditableifW>1. Logged target payloadtags tie resulttoexactshot+targetkey; nofriendkillXP. Unrelatednormalattacks unchangedexceptfriendlykillguard. /tmp/stirheim-line-shot-mobile-qa.mjs PASS; firstscriptusedwrong Injury buttonlabel, correctedtoInjury roll. /tmp/stirheim-line-shot-full-tests.log1845pass176DBskipped; finalUIcleanupbuild/lintpass. No migration/deploy. #155Blessing can now be rolled once at Fire this line before declareLineShot; do not roll pervictim. Need track failedcurseattempt forownturn withoutconsumingactualshot/reload; nextturnmaytryagain, originaldice/edittrail and approvedreasoncorrection. Otherblackpowder shots need equivalent true-firingattempt semantics. Keep remainingmortar/pigeon/backfire/disarmingscope open.


### #155 — Blessing of the Lady ordinary shooting checks (local, 11 September)

A passed Bretonnian pre-battle blessing now adds a 4+ permission roll before each opposing ordinary blackpowder shot, even against another warband, and before other missiles target a Questing Knight or Knight Errant. Squires and ordinary troops receive no bow protection. Failed permission ends that shot before hit/wound/save; subsequent shots test separately. Odds and sensitivity tables include permission failure without losing probability mass. Printed source: reference/rules/warbands/grade-1b-part1.md:961–965.

Validation: 1849 ordinary tests passed; 176 database tests skipped. Build/typecheck and lint passed with existing warnings. Browser verification of this new branch remains outstanding. Blunderbuss line permission remains an explicit table-managed reminder, once for the whole firing line; it is deliberately excluded from per-victim rolls. Persisting permission attempts and handling failed firing/usage cadence, plus melee pistol firing modes, remain to investigate. #155 stays partial. No deployment.

Checkpoint 17:13 London: helper ladyBlessing.ts identifies catalogue blackpowder IDs and exact Knight unit IDs. CombatContext.firePermissionThreshold propagates through buildAttackInput into both odds and phaseChain sensitivity. resolveSingleAttack scales joint probabilities and adds failed permission to hitFaces face0. RollThrough begins firePermission before ordinary hit, including each repeated shot. Focused113 and full1849pass. Next browser QA, then one permission attempt for LineShotControls (not per target), preserving original/app/edited dice and failed-attempt own-turn state without incorrectly consuming actual shot. No migration/push.


### #155 — One Blessing test per Blunderbuss firing line (local, 11 September)

The firing-line UI now tests the Blessing once before creating its targets. A failed test fires nothing and consumes neither the once-per-battle shot nor the Chaos Dwarf reload cycle. Repeating an attempt in the same own turn requires an explanation; a later own turn or another numbered group member has its own attempt. App dice are saved immediately, with the chosen line frozen, and an unfinished test resumes after reload. Confirming an edited die records the original and replacement in plain English. Passing creates one line, with no further permission rolls for its victims. Tabletop rolls remain supported.

Disposable 390px browser QA passed: ordinary bow protection for Knights but not Squires, blackpowder against a Squire, failed line test, explained retry, app die preserved after reload, edited confirmation, two victims with one test, and the weapon's one-shot limit. Full ordinary tests: 1852 passed, 176 database tests skipped. Build/typecheck/lint passed with existing warnings. #155 remains partial for durable ordinary-shot usage/retry handling and any applicable melee pistol firing modes. No migration or deployment.

Checkpoint ~17:23 London: new battle JSON linePermissionTests[], startLinePermission immediately saves original die/frozen targets; finishLinePermission upserts history and creates one line only on4+. LineShotControls resumes pending test, requires reason for same-turn additional attempt, preserves original on edit. Separate model slots and own turns. /tmp/stirheim-blessing-mobile-qa.mjs and /tmp/stirheim-line-blessing-mobile-qa.mjs PASS, disposable cleanup complete. Full1852pass176skipped; build/lintpass. Next reconcile ordinary shooting usage and potential melee pistol rules against source; alternatively continue independent #152–154 weapon mechanics if ambiguity. No live mutations/Netlify. Automation must pause at end of Sep11 London.


### #154 — Pigeon Bomb launch table (local, 11 September)

Pigeon Bombs now use their printed flat D6 launch table instead of the warrior's Ballistic Skill, shooting modifiers or ordinary hit rerolls: 5–6 lands on target, 2–4 explodes harmlessly, and 1 explodes at the firer. The roller labels this a Pigeon Launch and distinguishes backfire from an ordinary miss. It explains that the firer and everyone within 1½ inches take a Strength 4 hit on backfire. On success, the selected target's wound/save/injury sequence works normally; additional blast victims and backfire wounds remain table-managed and are explicitly excluded from the displayed target odds. Source: reference/rules/02-weapons-armour-equipment.md:1126–1130.

Full ordinary suite: 1854 passed, 176 database tests skipped. Build/typecheck/lint passed with existing warnings. Disposable 390px browser QA passed backfire messaging and successful launch advancing to the wound roll. #154 stays partial for full blast-victim selection, Mortar scatter/misfire/reload and other special ammunition. No deployment.

Checkpoint ~17:32 London: buildAttackInput overrides hitThreshold5 and disables ordinary hit rerolls for temperamentalD6ToHitInsteadOfBS. AttackInput.temperamentalPigeon; RollKind.pigeonLaunch; Outcome.backfire is zero damage to selected target, explicitly table-managed self/area damage. Full1854pass176skipped, build/lintpass. /tmp/stirheim-pigeon-mobile-qa.mjs PASS after narrowing duplicate result/log selector. Next full multi-target blast workflow can reuse lineShot principles, but keep separate type/meaning: Pigeon1 blasts firer+nearby;5–6 target+nearby;Mortar miss scatters2D6 thenhitsallwithin1.5in, always experimental misfire. Ordinary Blessing firing state/melee pistols still partial. Source ambiguities in Censer/disarming not invented. No migration or Netlify.


### #154 — Persistent Pigeon Bomb blast foundation (local, 11 September)

Added a separate saved launch/blast model for the next Battle Sheet step: the intended target and original app die survive reload; confirmation records edits; a 1 centres the blast on the firer, 5–6 on the intended target, and 2–4 has no victims. Declaring nearby victims must include the central model and freezes distinct model identities. Matching shared results complete individual victims; reversing one result reopens it without repeating the launch. Additional same-turn launches require an explanation. Four domain tests plus build/typecheck/lint passed (existing warnings). This is a foundation only: the multi-victim UI is not yet connected, so backfire and other blast wounds remain table-managed in the current screen. No deployment.

Checkpoint ~17:40 London: new domain/pigeonLaunch.ts and battleJSONpigeonLaunches[]; exports via domainindex. SharedpayloadpigeonLaunchId/pigeonTargetKey optional. Foundation4tests pass, build/lintpass; no UI mutation this milestone. NEXT implement PigeonLaunchControls analogous LineShotControls, freeze intended target before appdie, resume pending apporiginal afterreload, confirm then choose all modelswithin1.5in including centralfirer on1 (mandatory). 2–4 no victims. For successful/failed blast, resolve every victim via existing RollSection with automatic S4 onehit, bypass temperamental reroll and Blessing pervictim, preserve armour/injury effects. Add selectedblasttarget alongside linetarget in FightTab; combinedmine/enemies allows self/friends; forceLog harmless targetresults; sharedpayloadpigeonIDs; kill false for self/friends. Keep group model slots consistent and freshwounds pervictim. Launch only ownturn/moveorfireallowed, record repeat reason; integrate Blessing once before launch (not pervictim) or explicit table-managed reminder if unsupported, never silently skip. Reuse current ordinary Pigeon engine as launch-preview only; avoid duplicate launch D6 in pervictimroll. No DBmigration/Netlify.


### #154 — Pigeon Bomb blast victims connected to Battle Sheet (local, 11 September)

The Battle Sheet now records a Pigeon launch separately, preserves app dice across reload and logs edited results. A backfire requires the firer among the blast victims; an on-target explosion requires the intended target. Players select every nearby friend and enemy, then resolve one automatic Strength 4 hit per model using the normal wound/save/injury roller. Harmless victim results can be logged, remaining victims survive reload, and self/friendly casualties award no kill XP. Numbered group victims start with separate wound assumptions. Launching respects the own turn and Move or Fire; explained replacement launches preserve history. Automatic blast and line hits now offer Dodge before Lucky Charm.

Full ordinary tests: 1860 passed, 176 database tests skipped; build/typecheck/lint passed with existing warnings. Disposable 390px browser QA passed app-die resume, edited backfire, mandatory firer, self/friend results, no friendly XP, and reload with one victim remaining. Pigeon Blessing permission is currently an explicit recorded tabletop confirmation before launch, not a built-in roll; do not mark #155 complete. #154 remains partial for Mortar and other special ammunition. No migration or deployment.

Checkpoint ~17:52 London: new PigeonLaunchControls. Launch intendedtarget uses all numbered enemy models; actual Guardian interception chosen at table. Hero-only launch (group exception manual), ownturn/notout/notStupidity/MoveOrFireunlessNimble. New state pigeonSelection + areaTarget combines line/blast. Context.pigeonBlastHit makes only Pigeon weapon count1, automatic S4 (new reasonpigeonBlast), disables repeatedlaunch andpermission. Existing pervictim armour/dodge/charm/injury apply; sharedpayloadpigeonids, forceLog, friendlykillguard. Pendingappdie resumes; fullblast victims immutable; replacementlaunchreason and revertoldresults instructions. CurrentPigeonBlessing checkbox recordspermissionNote; NEXT replace with actual persisted permission test before launch, since ordinary previousroller had automatedgate. No repeatedgatepervictim. Full1860pass176skipped. New Dodge test initially forgot charmAvailable=true; correctedfixture, allpassed. /tmp/stirheim-pigeon-blast-mobile-qa.mjs PASS. No migration/Netlify.


### #155 — Saved Blessing permission before Pigeon launch (local, 11 September)

Replaced the temporary tabletop-confirmation checkbox with an actual 4+ firing test before the Pigeon launch. Permission and launch dice are stored separately as soon as the app rolls them, survive reload, and retain original values when edited. Failed permission creates no launch or blast; another same-turn attempt needs an explanation. Passing allows exactly the following launch, with no repeated test per blast victim. Tabletop dice remain supported.

Full ordinary suite: 1862 passed, 176 database tests skipped. Build/typecheck/lint passed with existing warnings. Disposable mobile QA passed two separate reloads (permission then launch), edited confirmation, and subsequent blast victims without retesting. #155 remains partial for ordinary-shot durable usage/retry handling and applicable melee pistol modes. No migration or deployment.

Checkpoint ~18:01 London: Pigeon launch schema now permissionRequired/permissionOriginal/permissionDie (legacypermissionNote retained). startPigeonPermission/confirmPigeonPermission persist separate history ID, failedattempt has targets[] but no launchdie. startPigeonLaunch reuses sameID afterpass, preservespermission fields and originaltarget; confirm blockeduntilpass. UI resumes bothstages, no checkbox; failedpermission excludedfrompendingresume, repeatreasonrequired. Full1862pass176skipped/build/lintpass. /tmp/stirheim-pigeon-permission-mobile-qa.mjs PASS, disposablefixturescleaned. #154mainstatus/remainingparagraph updated to reflectBlunderbuss+Pigeonwork. Next priorities within#154: Mortar scatter/blast (source02:1093–1105; misfire rules need source identification), SwivelGrapeShotspread/ChainShotknockdown. Avoid scopeguessing. Ordinary#155firingusage/meleepistolsmaybe stillopen. Automation endsSep11London; no deployment.


### #154 — Swivel Gun Cumbersome restrictions (local, 11 September)

The carried Swivel Gun now reduces its bearer's Battle Sheet Movement and Initiative by 1 throughout the battle, including while using another weapon, without changing roster characteristics. The penalty applies once and ignores zero-quantity entries. All three ammunition profiles are limited to one calculated shot and cannot fire after movement, even with Nimble or extra-shot skills. Source: reference/rules/02-weapons-armour-equipment.md:1214.

109 focused tests passed; build/typecheck/lint passed with existing warnings. Disposable mobile QA confirmed movement disables firing and correcting that assumption restores it. Cross-action firing usage, ammunition supply, misfires, Chain Shot knock-down and Grape Shot spread remain outstanding; #154 stays partial. No deployment.

Checkpoint ~18:09 London: combatantsOf maps carriedpositiveqtyswivel_gun to clonedM−1I−1 (floor0), loadoutassumption explains. computeAttackCount for cumbersome tag overridesNimble/extraShot at1or0ifmoved, afterStupidityguard. Focused109pass/buildlint, /tmp/stirheim-swivel-cumbersome-mobile-qa.mjs PASS. Found complete misfire source in reference/rules/03-campaigns-magic-optional-rules.md:4309–4331: natural1tohit => D6;1selfS4noCrit+destroyweapon;2jamrestbattle;3extraownturnwait;4–5noextraeffect;6hitintendedtarget+1S. Swivelalwaysuses; Mortar/Repeaters experimental additionallyreloadonallnonBOOMoutcomes. Need implement actualweaponidentity/destruction/reload andmisfire probabilities or explicitlypartial; avoid ordinarynatural1=>scatter ifmisfirepreventslaunch. ChainShotnotwounded4+KD evenimmune (whether savedwoundcounts needscare); GrapeShotD6additionalnearestENEMIESwithin4inLOS, coveronlyifprimaryincover, hiddencount, friendlypiratesneverhit. Pigeon/Blunderbuss workflows alreadydone asabove. No migration/Netlify.


### #69/#71/#73/#154 — Blackpowder misfire and firing-state foundation (local, 11 September)

Added the printed six-result misfire resolver and persistent physical-weapon firing records. The foundation distinguishes destruction, battle-long jamming, an extra reload turn, harmless clicks, and a successful +1 Strength shot; BOOM self-hits explicitly cannot cause critical hits. Shared weapon keys prevent changing ammunition from bypassing reload. Pending app misfire dice survive reload, edited confirmation preserves the original, and explained corrections retain history. Experimental weapons reload after non-BOOM results.

Five focused domain tests plus build/typecheck/lint passed (existing warnings). This is foundation only: it is not yet connected to the firing UI, automatic damage, roster weapon removal or displayed probabilities. Existing partial tracker statuses remain. Source: reference/rules/03-campaigns-magic-optional-rules.md:4319–4331 and Experimental weapon clauses in 02. No migration or deployment.

Checkpoint ~18:17 London: new rules/resolve/blackpowderMisfire.ts, domain/blackpowderShot.ts exported, battleJSONblackpowderShots[]. recordBlackpowderShot freezes physicalweaponKey, startsmissingtohit history; recordMisfireDie persists original+pending, confirms once. blackpowderBlock destruction/jam/pending first, then nextownturn=shotturn+1+reloadTurns(+1Phut), Experimentalmin1reloadaftermisfire. correctBlackpowderShot needsreason anddoesnotundoexistingdamage/roster. Fivefocusedtests/buildlintpass. NEXT wire physicalfiring UI startingSwivel orMortar. Need per-model/weapon-copy identity becauseRosterItem has noinstanceID; numberedslots/correctionpath asBlunderbuss. GatefireonlyafterBlessingpass. Natural1tohit mustrollmisfire;6misfireauto-hit+1S;1selfS4noCrit andweaponremoval requireexactitem identification/authorizedrosteredit notjustbattleflag;2jamrestbattle;3extraownturn. The source’s Blunderbuss mention despiteauto-hit is unresolved (no naturaltohitroll), do notinvent extra test. Ordinaryshotdieprovenance durable; no phase-wide blanketmisfire probabilities untilactualbranchmodeled. No UIclaim/deploy.


### Misfire probability integration — exact branch support (local, 11 September)

The damage engine can now retain mutually exclusive ranged profiles through its wound/critical-state calculation. This is needed for an ordinary shot versus the misfire table's +1 Strength hit: averaging their wound/save profiles would lose correlations, especially after the phase's critical has been consumed. New mixRangedAttacks helper supplies weighted headline values and distinct SingleAttackBreakdown.branches; applyAttack runs each branch against the same current state and merges probability mass. Ranged only, no highest-hit parry partition. Tests compare two mixed attacks against explicit enumeration, including a two-Wound target and the shared critical limit. Full suite 1871 passed, 176 database skipped; build/typecheck/lint pass existing warnings. This is not yet activated for weapons or the rolling UI, so no claim that misfires are fixed. No deployment.

Checkpoint ~18:27 London: next wire mandatory Swivel misfire as a SINGLE-shot branch first. On natural1 original hit die, misfireD6 6 gives automatic +1S hit; other results no targethit (1selfhit separate). Need condition ordinary branch on originaldie2..6 rather than weight an ordinary unconditioned attack, else double-countnatural1. To-hit rerolls need natural1/misfire source treatment clarified; do not invent order. Only oneSwivelshot so no sharedweaponfailurestate acrossmultipleattacks; Repeatermulti-shot needs another explicit stop-on-jam/destruction state, not independentbranches. BlackpowderControls/physicalkeyUI and durable rollprogress remain needed. RollSection has record(next) + advance(step,rolled) suitable for an onProgress callback after Blessing permission passes, before shot declaration. Don’t record failedpermission as a firedshot. RosterItem lacks instanceID; actual destroyedweapon database removal needs exactitem lookup/atomicwrite or explicit manualfollowup. Keep unrelatedauditfiles untouched.


### #69/#71/#154 — Swivel Gun misfire rolls and target odds (local, 11 September)

A natural 1 to hit with a Swivel Gun now opens the mandatory misfire table in the roller. A 6 automatically hits at +1 Strength with the corresponding wound/save profile; 1–5 cause no hit on the intended target and explain the separate consequences. BOOM explicitly calls for a non-critical Strength 4 self-hit and weapon destruction. Target probabilities include the strengthened 1-in-36 hit branch and the Blessing permission check, preserving distinct damage profiles through the critical/wound calculation.

Full ordinary tests: 1873 passed, 176 database skipped. Build/typecheck/lint passed with existing warnings. Disposable mobile QA verified natural 1 → misfire 6 → Chain Shot at Strength 5 wounding Toughness 4 on 3+. Durable firing/jam/reload state and automatic self-damage/destruction are still not wired into this roller; those consequences remain explicitly table-managed. The to-hit-reroll interaction is also explicitly manual pending a source ruling. These tracker items remain partial; no deployment.

Checkpoint ~18:36 London: buildAttackInput adds misfireEnhanced only rangedSwivel(cumbersome tag), noordinaryhit-reroll. Enhanced recursion removescumbersome tag, fixesS=effectiveStrength+1 andstrengthBonus0. resolveSingleAttack branches:5/6 conditionedordinary(pHit/pWound etc×6/5),1/36autoenhanced,5/36targetmiss. Blessingwrapper now preserves/scalesbranches ratherthanjustheadline. RollKindmisfire triggersnatural1,6swapsplaninputenhanced thenDodge/Charm/wound;1misfireExplosion,2–5misfire outcomes. Attemptlog retainsdice; notyetblackpowderShot domainstate. UI manualnote forselfdamage/destroy/jam/reload; rerollinteractionexplicitmanualnote. Full1873pass176skipped/buildlint; /tmp/stirheim-swivel-misfire-mobile-qa.mjs PASS. Next wireonProgress recordshot onlyafterpermissionpass, recordMisfireDie whenmisfireanswered, UIphysicalgunkey andcorrectionreason. Do notblockongoingRollSection when its own shotrecord disablesnewfiring. Need selfhitroute andexactinventoryinstancebeforeautodestruction. Otherammo effectsGrape/Chain/Mortar remain. No migration/Netlify.


### #69/#71/#154 — Swivel firing, jamming and reload persisted (local, 11 September)

The Battle Sheet now records the physical Swivel Gun when firing begins, after any Blessing permission passes. Ammunition changes share the same gun's reload/jam state. Misfire results persist destruction, battle-long jamming and the extra Phut turn; pending misfires can be finished after reload with original app dice and edits preserved. Numbered group members are tracked separately. Explicit corrections preserve history, and the approved unrestricted Start again remains available with an automatic logged firing correction. Permanent inventory removal and BOOM self-damage remain manual.

The ordinary suite passed 1873 tests (176 database skipped); final build/typecheck/lint passed with existing warnings. Disposable mobile QA verified jam persistence across reload/ammunition changes, corrections, interrupted misfire recovery, failed Blessing consuming no shot, and unrestricted restart. QA exposed repeated development-effect initialization, now guarded, and was updated to await normal autosave before reloading. No deployment.

Checkpoint ~18:50 London: BlackpowderControls + RollSection.onProgress connect domainstate. Recordshotoninitialhitpending orfirePermission→hit (notfailedpermission); hit→misfire marksPending; answeredmisfire recordsdie+apporiginal. physicalkeyswivel:modelslot, allammo same; 1wholeownturnreload. Newshotbuttonsdisabledbyblock, ongoingrollerstaysmounted. Pendingcontrol canrollapp/saveoriginal/reload/confirm, but resumedKA-BOOMhit andBOOMselfhit explicitlytablemanaged. Startagain MUST stayunrestricted perTom: onRestart correctsoldshot withloggedreason thenstartrecordsnewshot; shareddamageundoneseparately. Added initializedref to preventStrictModeeffectdoubledeclaration. QA /tmp/stirheim-swivel-state-mobile-qa.mjs, -state-blessing-mobile-qa.mjs, -restart-mobile-qa.mjs allPASS afterautosaveawaits. Initialtest exposed doubleeffect, then prematuretestreload; bothaddressed. Full1873pass176skipped beforefinalUIguard/restart; finalbuildlint andbrowserpass. Nextselfhit/inventorydestruction exactinstance ornextGrapeShot/ChainShot/Mortar. Generalmulti-shotblackpowder/pistols stillnotwired. Ownturncountused; ordinaryBattleSheet tableoverridesretained. No migration/deploy.


### #69/#71/#154 — BOOM self-hit in the Battle Sheet (local, 11 September)

A destroyed Swivel Gun now offers a separate explosion self-hit action. It resolves one automatic Strength 4 hit against the firer through the normal wound/save/injury flow, forbids critical hits, and does not inherit the ammunition's armour modifier or the firer's offensive skill bonuses. The shared log records self-inflicted wounds/casualties without kill XP. Recording the hit disables its action; reverting that event makes it available again. Group members use the existing numbered firing model and separate wound assumption. Permanent gun removal remains manual.

Full ordinary suite: 1874 passed, 176 database tests skipped. Build/typecheck/lint passed with existing warnings. Disposable mobile QA verified BOOM → self-hit → natural-six wound without a critical → self-inflicted casualty with no XP and completed-action state. No deployment.

Checkpoint ~18:56 London: BlackpowderControls shows Resolve explosion self-hit for each active misfire1 without matchingunrevertedsharedblackpowderSelfShotId. FightTab selfShotId creates ownfirer areaTarget, usesneutralattacker(emptykit/skills/traits) plusactualdefenderkit andsynthetic rangedS4blackpowderSelfHitweapon. buildAttackInputauto reasonblackpowderExplosion +nocrit. Doesnotrecordanotherfiringattempt/onProgress, andblockedgunavailability doesnotblockselfdamage. PayloadblackpowderSelfShotId, selfkillfalse, forceLog includesharmlessresult. Corrections/revertedsharedresults retainhistory. Full1874pass176skipped/buildlintpass; /tmp/stirheim-boom-self-mobile-qa.mjs PASS. Next exactinventorydestruction: RosterItem currentlynoinstanceID, identifyactualitemrow for owner+holder+swivel_gun; respectquantity/groupgun slot; useatomicmutation withhistory/no liveQA. OrcontinueGrapeShot/Chain/Mortar ifdatabasechangebigger. No migration/push.


### #154 — Grape Shot armour saves (local, 11 September)

Grape Shot now honours its explicit no-armour-save-modifier rule, including when a KA-BOOM misfire increases Strength and the campaign enables Strength-based armour penetration. Defensive armour/wardrobe bonuses remain; the gun's offensive penetration is suppressed. Other ammunition keeps its printed modifiers. Source: reference/rules/02-weapons-armour-equipment.md:1230. Fifty-nine focused odds tests plus build/typecheck/lint passed with existing warnings. Grape Shot's additional-victim selection remains outstanding. No deployment.

Checkpoint ~19:03 London: buildAttackInput noArmourSaveModifier now suppressesStrengtherosion fornormal/owncloaksaves plusoffensiveweapon/traitpenetration, retainingdefenderbonuses. GrapeS3 andmisfireS4 bothlightarmour6+withhouseStrengthpiercing; BallShotstillpenetrates. Focused59pass/buildlint. No mobile needed forpureprobabilitymodifier coveredbysharedodds. NextGrapeD6additionalnearesteligibleenemyselection requirescover/LOS/hidden flagsfromtable; source02:1230. Originaltargethit only; friendsneverhit. PersistentshotIDfromBlackpowderShots canidentifycollateralresults. ChainShotnotwounded4+KD scopeandMortarscatterstillopen; selfBOOMdamagewired, permanentinventoryremovalmanual. Keeprestofsevenareas andend-of-daypauseinview. No migration/Netlify.


### #154 — Grape Shot spread foundation (local, 11 September)

Added nearby-victim selection rules: nearest eligible enemies within 4 inches and line of sight, excluding the primary model and friends; cover is allowed only when the primary target was in cover. Hidden models remain eligible. Separate group members retain their identities and equally close models retain the player’s selected order. Saved spread dice preserve app originals and edits through reload; confirmed victims freeze without consuming another shot. Shared-result identity supports resolving each victim once and reopening reverted results.

Five focused tests passed. This is domain/state groundwork only: Battle Sheet controls and automatic collateral damage are not yet connected, so #154 remains partial. Source: reference/rules/02-weapons-armour-equipment.md:1230. No migration or deployment.

Checkpoint ~19:15 London: domain/grapeShot.ts adds grapeShotTargets/startGrapeShotSpread/confirmGrapeShotSpread/unresolvedGrapeShotTargets; battle JSON grapeShotSpreads[], eventpayload grapeShotId/grapeTargetKey. API caller must establish primary hit and correct ammunition before starting; active firing record guard only checks notcorrected/nonfailedmisfire. UI not wired. Next connect on primary hit, persist original D6 immediately, show table-measured candidates with distance/LOS/cover/enemy flags (include hidden), freeze selection and resolve automatic S3/no-save-modifier hits via areaTarget pattern without firing/Blessing repeated. Need explicitly handle misfire6 +1S collateral interpretation; do not silently inherit attacker skill bonuses. Corrected firing records must hide old pending spreads. Add browser QA once connected. Existing Startagain remains unrestricted. No push/deploy.


### Tonight’s release scope — #154/#155 (11 September, local verification)

Tom approved finishing #154, then #155, taking #163 only if release-testing time remained, and deploying the verified batch together. #163 is deferred to the next batch; its partial status is unchanged.

#154: Grape Shot now creates a saved additional-hit action after a primary hit. Its D6 original/edit history survives reload; selection enforces distance, cover, enemy eligibility and nearest-first order, with numbered group models. Chain Shot offers a 4+ knock-down after a hit causes no unsaved wound, including saved wounds, and bypasses normal knock-down immunity; numerical probabilities include this outcome. Mortar now has saved permission, hit, mandatory misfire, 2D6 scatter/clockface direction and blast stages; stopped shells do not scatter. Friends/enemies resolve separate automatic hits with shared history, repeat prevention, corrections and reload. Per-firing critical consumption is shared across blast/line victims.

#155: Guiding Dream target modifiers and Blessing firing tests are implemented across existing shooting flows. The catalogue check now includes Experimental and Veskit’s built-in blackpowder. Weapon-specific checking also recognises a blackpowder pistol profile fired in melee without cursing ordinary blades; adding absent melee pistol profiles remains wider weapon work, not a new claim here. Existing unrestricted attack restarts/player overrides remain.

Mobile Grape spread, Chain knock-down and Mortar scatter/reload tests passed; desktop Mortar KA-BOOM test passed. The earlier full ordinary suite passed 1,887 tests; final shared-critical/permission changes are undergoing release checks. General blackpowder inventory destruction, ammunition supplies and other outstanding #69/#71/#73 consequences remain open. Mortar scatter geometry is determined on the physical table; numerical previews explicitly describe direct hits, not a guessed scatter probability. No deployment yet.


### #154/#155 release validation — 11 September

Final ordinary suite: 1,890 passed, 176 database tests skipped in that run; all 176 passed separately against local Supabase. Build/typecheck and lint passed (existing audit-probe/chunk warnings only). Mobile Grape Shot spread, Chain Shot knock-down and Mortar scatter/reload checks passed; desktop Mortar misfire/strengthened blast check passed. #154 and #155 are complete locally within their recorded scopes; wider #69/#71/#73 equipment consequences and #163 remain open. Full browser regression is being checked before deployment. Production preview contains exactly migrations 73 and 74; Netlify automatic builds remain paused.


### Final browser gate — 11 September

All 16 browser regression tests pass against disposable copies of the original seed fixtures. The first run used an altered shared local campaign (four members/map mode), so its fixed-baseline assertions failed; isolated reruns corrected fixture invite formatting and one hard-coded warband label without changing application behaviour. Test fixture IDs/names can now be overridden while CI defaults stay unchanged. Extra desktop QA verifies one critical across successive Mortar victims. All disposable fixtures cleaned. Final ordinary/database totals remain 1,890 +176, with build/typecheck/lint passing. Ready for one release; expected production migrations 73–74.
