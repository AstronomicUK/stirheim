# Overnight priority bugs — 13 September 2026

Latest instruction (14 September): stop implementation at ten fully completed items from the first twenty, then prepare and validate the combined release. Deployment subsequently approved and completed on 14 September (2026.09.14.1). Partial checkpoints do not count as completed tickets.

Tom originally authorised working through the following order, grouping related fixes when useful. If all twenty are resolved before his next message, assess and begin the next twenty outstanding items. Keep changes local for a combined release; the prior deployment permission was for the completed release.

Order: #15, #181, #191, #69, #152, #59, #70, #139, #161, #160, #76, #29, #114, #146, #142, #141, #136, #138, #144, #143.

For each item, reconcile old findings with the current code and source before editing. Core behavior already delivered must remain intact. Preserve player overrides, document ruling-dependent clauses and continue independent work. No Claude delegation while usage remains reserved. Full Khemri stays deferred.

## Final candidate status — 14 September

**Ten completed and deployed as version 2026.09.14.1.** Stop implementation here. See RELEASE-CANDIDATE-2026-09-14.md for deployment evidence.

| Completed item | Scope |
|---|---|
| #15 | Original named exploration outcomes verified; inaccurate historic requirements reconciled. |
| #181 | Magical Aptitude uses the correct single injury die and bands. |
| #191 | Penthesilea uses her printed 70 rating. |
| #70 | Original psychology coverage, including explicit Black Orc Animosity procedure choices. |
| #161 | Leadership item benefits, rerolls, timing, range confirmation and Standard capture. |
| #76 | Spell target selectors, intent and range hints across the catalogue. |
| #29 | Spell editing respects recorded/native lore access. |
| #142 | Pirate Treasure Map destinations, Facio purchases and rewards. |
| #136 | Eye of the Gods Mark/Spawn lifecycle and Condemned Fate at 90 XP. |
| #138 | Abomination shard reward, reanimation debt, payment and correction. |

The other ten remain open/partial: **#69, #152, #59, #139, #160, #114, #146, #141, #144, #143**. Completed component fixes in these tickets may ship with the batch, but do not close their umbrella issues. Censer/Disease Dagger ruling questions remain unanswered and do not block this release. Full Khemri remains deferred.

The numbered checkpoints below are historical implementation notes; the final status above supersedes their counts.

## Checkpoint 1

Regression tests cover all six Magical Aptitude injury faces; Penthesilea actual catalogue rating at 0/25 XP; direct Sling and Slingshot stationary/half-range conditions; new and legacy Powerful Build; extra picks cannot be omitted, unrelated, known or banned, do not charge a second advance, and do not grant permanent table access. Forest Goblin Brave removal consumes one skill advance and cannot repeat; the flag survives the typed roster and removes the Animosity text from roster/battle cards.

Mobile local QA (390×844): Big Bully → extra Strength choice → Strongman → refresh/reopen → review → confirm. Database verified both skills, unchanged skill tables, one level-up, resolved pending advance, readable resolution. Disposable fixture deleted. Exploration book integration 3/3 passes. Full ordinary suite, build/typecheck and lint pass (existing audit warnings only). No migration, push or deployment.

Censer/Disease Dagger retain previously recorded save/timing rulings. General Animosity turn automation is not claimed by the Brave advancement fix. Further Magical Aptitude second-attempt enforcement and state application remain part of broad skill/battle work, not the narrow #181 dice correction.

## Checkpoint 2 — Swivel ammunition (#69/#139)

Three purchasable supplies now exist: Ball Shot 5 gc, Chain Shot 2 gc, Grape Shot 2 gc. Ammunition itself grants no weapon. The first firing attempt declares one exact inventory row; the supply remains available all battle. No charge per shot, no consumption merely for selecting a profile, no unused-type loss. Report uses existing exact-row consumable settlement; changed/missing stock is blocked until corrected. Stock may be the gunner’s own or the warband stash, never another warband’s or an unrelated warrior’s kit. No-stock exceptions require a saved explanation and deduct no fabricated item/gold. Explained withdrawal preserves firing/damage history.

Mobile local QA (390×844): Chain unavailable without stock; Ball available from stash; begin shot records one supply and normal reload record; hit/wound/injury logged to both sheets; refresh retains supply. Database inspected exact row. Disposable campaign/match/warbands removed. Tests cover multiple shots, different types, unused stock, reload, exact-row settlement, foreign/empty stock, exception and correction. Full suite 2,514 ordinary tests passes; build/typecheck passes. No migration or deployment.

## Checkpoint 3 — inherent starting skills (#59)

Fighting Ape Agile skills now reach the battle calculator, including the ranged-only 5+ Dodge. All six Pit Fighter types carry their printed starting skill; their existing racial combat bonus remains non-stacking. Existing hero rows receive inherent battle skills without database backfills, and advancement choices reject learning an already inherent skill again (also Brutes/Companions). Master of Finances receives starting Haggle; legacy rows qualify both in trading UI and server eligibility. No other trade validation changed. Migration 137 applied locally only. Focused tests 158/158; actual local Haggle transactions 6/6 including legacy inherent eligibility, retry, concurrency, dead phase/OOA and failed shared search; build/typecheck passes. Remaining mounted grants and broader supplementary skill work are not closed.

The same checkpoint also opens Tomb Guardians/Sorcerous Society additional Academic tables only for their own Academic-capable heroes, both in selection and validation. Learned Barbarian Courage now grants All Alone immunity; learned Heart of the Warrior grants Fear/All Alone immunity (its Rout reroll was already connected). Barbarian Courage’s Fear reroll is still a table action; this does not claim general Animosity automation.

## Checkpoint 4 — Powder Keg (#69/#152), local integration

A scenery target now uses the ordinary weapon roller and firing/reload ledger, Toughness 4, a 4+ explosion test after wounding and automatic explosion for a valid critical. It never creates a roster warrior, wound tally or casualty for the keg. Ranged hit modifiers remain normal; melee asks for an agreed hit requirement because the printed keg has no WS. Non-listed similar igniters require an explanation. Double barrels retain the second wound if the first fails to explode the keg and stop once it explodes. Chain Shot cannot knock the keg down.

Explosion follow-up persists D6+3 radius, the separate Horrors of Underground 4+ cave-in, named friend/enemy/group-member victims, individual automatic S6 hits and correction history. Owned inventory kegs use exact-row post-battle settlement only on explosion; scenario scenery costs no item. A correction withdraws consumption without silently erasing damage. Shared visible session state prevents reselecting a known destroyed keg; no claim of server-locking simultaneous scenery declarations is made.

Desktop local QA: Handgun ignition 4 hit/5 wound, one fired weapon record, no keg casualty, radius 6, enemy S6 hit 2 wound/2 injury logged to both sheets, refresh marks blast resolved. Mobile 390×844: no horizontal overflow; ordinary ignition 4/5/4 with follow-up radius, app die 5 survived refresh then changed to 2, separate cave-in 4, zero-victim completion. Plain-English log explicitly showed the override. Follow-up log was then consolidated into a single evolving entry to avoid clutter. Disposable fixture removed; temporary tab closed and viewport reset. Tests cover explosion faces, criticals, both barrels, inventory/correction/report patches, saved dice and duplicate confirmation. Full ordinary suite: 2,545 passed, 350 database tests skipped by this ordinary run. Build/typecheck and lint passed (existing audit-file warnings only). No deployment.

## Checkpoint 5 — standard Animosity (#70)

Orc Mob henchmen and the named Forest Goblin units now have separate start-of-own-turn tests for each physical model. Trigger/result dice, app originals, player changes, exemptions and explained corrections survive saving. Already-engaged and Boss Pole exemptions are recorded explicitly because positions are resolved at the table. Forest Goblin Brave removal remains respected. Squabble blocks normal attacks while permitting melee defence. Rush requires acknowledgement of the extra movement/required charge. Friendly-fight outcomes expose individual friendly targets, require the table’s nearest-target/charge-priority confirmation, reject Goblin melee charges against Orc henchmen, and consume the forced action only after the shared attack saves. Restarting the roller cannot repeat a consumed forced action. Positional movement and separation remain table responsibilities.

Local browser QA on desktop/mobile 390×844: model 1 squabbled and could defend but not attack normally; model 2 in the same group passed independently; Goblin illegal Orc charge blocked; all three results saved independently and survived refresh. Explained correction followed by a legal Orc-to-Goblin missed attack saved to the shared log and blocked a second forced attack. No horizontal overflow. Disposable fixture removed and viewport reset. Full ordinary suite 2,562 passed, 350 database tests skipped; build/typecheck and lint passed (existing audit warnings). Black Orc conflicting LD/D6 wording remains deferred, and the broader psychology tracker stays open. No deployment.

## Checkpoint 6 — Elven Wine (#139/#140)

Elven Wine now has a whole-warband before-battle declaration on My Warband for Shadow Warriors, using a selected stock row in the stash or an active hero’s kit. Carrying it grants no automatic immunity; the recorded declaration grants Fear immunity to the whole roster. Explained withdrawal removes the effect and exact-row consumption. Legacy per-warrior ticks cannot deduct a second supply when a warband declaration exists. No migration or inventory backfill.

Mobile local QA: stash supply, confirmation, combat Fear-immunity badge, refresh, correction, badge withdrawn; width 390 with no overflow. Unit regressions cover wrong warbands, dead/foreign/missing stock, duplicate declarations, restored state, whole-roster immunity and exact-row settlement. 43 focused tests and full ordinary suite 2,567 passed (350 database tests skipped), build/typecheck and lint passed with existing audit warnings only. Disposable fixture removed. Other supplementary consumables remain open; no deployment.

## Checkpoint 7 — Cathayan Silk Clothes and reusable horns (#161/#139)

Core Cathayan Silk Clothes now offer a Mercenary warband its first failed Rout-test reroll when its leader wears the clothes. The initial failure does not route the warband until the player declines or fails the reroll. Both dice reroll; the second result stands. Pending choice/resolution survives refresh, retries do not add a second test, and an explained correction can withdraw a mistaken pending test without deleting dice. A completed failure remains spent after manually undoing a rout. Non-leaders/stash/wrong warbands grant no benefit. This uses the existing Mercenary template names; no blanket grant to all factions. The existing post-battle ruined-clothes check is unchanged.

Rout dice are now preserved as a readable entry with app/table provenance and the reroll. Mobile QA: first 6+5 failure, refresh, choose reroll, 2+3 pass; later 6+6 fails without another offer. Shared dice history verified. Pending corrections and invalid dice covered by regressions. Ordinary suite 2,573 passed (350 database tests skipped); build/typecheck and lint passed with existing audit warnings only. Disposable fixture removed. War Horn/War Horn of Nagarythe are no longer consumables, so even legacy used-item ticks do not delete them; their timed Leadership activation and other banners remain outstanding. No deployment.

## Checkpoint 8 — timed Leadership items (#161)

War Horn and War Horn of Nagarythe now record one activation per owned physical copy per battle. Liturgicus Infecticus follows its printed beginning-of-turn/before-Rout chant; the scrape gives no once-per-battle limit, so later-turn chanting remains available. All grant a saved +1 Leadership until the next player turn, feed the combatants and Rout/Stupidity consumers, preserve equipment, and allow explained withdrawal. The manual legacy turn counter has an explicit expiry instruction. Item/faction eligibility and active-owner/stash selection are visible. Simultaneous overlapping Leadership-item bonuses are intentionally left to the table rather than silently stacked; that ruling-dependent edge is not claimed resolved.

Mobile QA: activate before test, Captain Ld7→8, Stupidity 4+4 passes, Rout choices show effective Ld8; finish own turn, Rout choices return to Ld7. Domain reload/copy/duplicate/correction/expiry tests pass. Ordinary suite 2,577 passed (350 database tests skipped), build/typecheck and lint passed with existing audit warnings only. Disposable fixture removed and browser restored. Other banners and supplementary consumables remain open. No deployment.

## Checkpoint 9 — spell-editor lore eligibility (#29)

Ordinary spell additions now respect recorded lore choices, native caster allocations, hired-sword multi-lore access and recorded magic books. Unknown casters no longer receive the entire catalogue. Existing spells remain intact; an explicit off-lore exception requires a reason saved alongside the spell in the warrior’s notes. This is editor eligibility, not closure of all magic/advancement issues.

Local browser QA: a Fire Magus sees only six Fire spells; checking exception without a reason does not expand the list; adding an explained Lesser Magic spell saves both spell and note. Reopening preserves both, with ordinary choices still restricted to Fire. Disposable fixture removed. Six focused tests and ordinary suite 2,583 passed (350 database tests skipped); build/typecheck and lint passed with existing warnings. No deployment.

## Checkpoint 10 — Hardtack recovery (#139/#140, partial)

Tainted Hardtack now adds one missed game to injury recovery rather than taking only the longer absence. The report regression combines two-game Deep Wound with tainted Hardtack to give three games, checks repeat derivation remains three and leaves the input roster unchanged. Outcome wording states the additional absence. Per-model group Hardtack and turn-limited Toughness activation remain outstanding. No deployment.

## Checkpoint 11 — Magical Aptitude allowance and shared injury (#181)

The first resolved spell now saves its pending Toughness/injury follow-up, which can be resumed after closing or refreshing. A recorded pass allows one second attempt; that attempt cannot offer another test for a third. Hand-to-hand disables the aptitude benefit. Failed/declined/legacy-unverified tests do not silently grant another cast. Extra casts remain possible through an explained exception saved with the attempt. Each attempt updates one record rather than duplicating it at every follow-up. Outstanding failed-test injuries remain resolvable after a turn change.

Rolled knock-down/stun has an explicit Apply injury to both sheets action, feeding the existing shared combat condition/recovery machinery without wounds, OOA or XP. Existing event corrections remain available. Client in-flight protection and visible-event matching prevent normal repeated application; no new server uniqueness constraint or multi-device concurrency guarantee is claimed.

Local browser QA: 4+4 cast, refresh pending test, resume 2 pass, second 4+4 cast, no third offer; next turn first cast available; Toughness 6 fails, refresh pending injury, injury 6 becomes Stunned; apply action shows Stunned on roster. Mobile 390px exception control fits and enables an explained override. Disposable fixture removed. Full ordinary suite 2,586 passed (350 database tests skipped), build/typecheck and lint passed with existing audit warnings. No deployment.

Wretch reconnaissance (#114): first Talent must reroll; second needs an individual Hero injury. Current group state does not carry individual permanent injury/flags, so this requires a deliberate individual-member implementation, not an injury applied to the entire group. Remains outstanding.

## Checkpoint 12 — explicit riding grants (#59, partial)

Battle Monks’ Emissary receives Ride Horse; Chapel Questing Knight and Merchant Knights Vanguard receive Ride Warhorse. New recruits receive the skill and legacy battle profiles derive it from unit identity; advancement cannot buy the already-granted skill again. No other mount type is granted by implication. Generic unnamed Ride clauses and tribe-dependent grants remain open. 192 focused recruitment/advancement/combat tests passed; included in subsequent full suite/build checks. No deployment.

## Checkpoint 13 — Pirate Treasure Map choice and rewards (#142, partial)

Exploration now offers regular city exploration or one exact owned Treasure Map, including stash maps. A map replaces ordinary exploration, uses only the selected stock row, and retains its destination/reward dice across refresh. Switching back ignores its rewards; unavailable selected stock blocks filing. Legacy battle ticks default to an eligible map but can be corrected. Map rolls live on Exploration, not back in the injury step.

Long Drong grants a barrel of Bugman’s Ale. Black-Wyrd grants 2+D3 shards and a Mordheim Map (no invented gold). The trapped chest requires a surviving Hero and Initiative D6: pass awards that Hero a Lucky Charm, failure adds a recovery game under ordinary concurrent recovery, and either receives the gold. App/table dice and later changes are recorded explicitly. Facio’s Common purchase entitlement, deferred notebook payment and next-game recruitment bonus remain outstanding; #142 is not closed.

Mobile local QA: select stash map, destination 2 and gold 3+4, refresh, switch back; destination 6/D3 3 review shows +5 shards and Mordheim Map; destination 5 with app Initiative 3 changed by player to 6, gold 4+4+4. Filed the disposable report and read the local database: gold100→220, map quantity2→1, missNextGames1. No ordinary exploration income. Width390 fits. Fixture removed. Full ordinary suite2,589 passed (350 database tests skipped), build/typecheck and lint pass with existing warnings. No deployment.

## Checkpoint 14 — Facio recruitment timing (#142, still partial)

New Facio map results save a structured campaign consequence. The first subsequent battle receives +1 Captain Leadership (maximum 10) for Stragglers, Prisoners and Kidnapped! contests. Base characteristics are unchanged. The original battle identity remains attached to delayed captive cases, and withdrawing the original report removes eligibility. Historical map results without structured Facio data are not inferred from prose.

Validated: 88 focused ordinary tests, 11 local database Kidnapped! tests, and TypeScript. Migration 138 applied to the local database only. Facio’s Common purchase and deferred notebook money are the next work; #142 remains open. No deployment.

## Checkpoint 15 — Facio purchase and notebook sale (#142, implemented locally)

Facio no longer awards notebook gold during exploration. Trading offers one regular Price Chart item as Common, retains ordinary prices/restrictions and Haggle, and requires affordability before paying. A separate notebook card appears only after purchase; 2D6×10 gc is then added, with dice provenance in the audit reason. Server receipts prevent repeated or concurrent purchases/payouts; withdrawing the reward or starting the next game invalidates an unused purchase. An already purchased notebook payout remains recoverable after refresh. Found-only rewards and Pirate-specific items are excluded.

Together with checkpoints 13–14 this implements the listed Pirate Treasure Map destinations, exploration replacement and next-game recruitment effects. No retroactive inference from old prose-only rewards. Historical results need manual reconciliation. Ordinary trading still supports explained restrictions/price adjustments.

Validation: 2,593 ordinary tests passed (358 database tests skipped in that run); seven actual local Facio database tests and eleven Kidnapped tests passed, including concurrent retries, affordability, stacks, Haggle, expiry and withdrawn rewards. Build/typecheck and lint passed (existing warnings). Mobile 390×844: one Duelling Pistol costs 30, quantity two blocked, rarity dice omitted, search allowance unchanged, refresh retains unpaid notebooks, 3+4 adds 70 once; database confirms one item and one receipt. No horizontal overflow. Disposable data and tab removed. Migrations 138–139 are local only; not deployed.

## Checkpoint 16 — supplementary spell target selection (#76, partial)

Classified all 30 spells in Nurgle Rituals, Onogal Rituals, Prayers of Taal, Prayers of Ulric and Waaaagh! Magic from their saved source text. Single enemies, friendly buffs, any-model effects, caster-only effects and area effects now use the existing appropriate target controls. Target notes include range and positional restrictions; these notes now display for self and area spells as well as selected-model spells. Stench of Nurgle’s conflicting friend/foe wording remains an explicit table ruling. This does not claim automation of supplementary spell damage or buffs. Other unreviewed lores remain outstanding.

Validated: 58 focused casting/data tests before the shared note-display adjustment; 25 focused target data/UI tests afterwards; build/typecheck pass. Local desktop and mobile 390×844 verified Buboes enemy selection, Scabrous Hide caster-only display, Pestilence affected-enemy checkboxes and visible 12-inch hint; no horizontal overflow. Disposable fixture and tab removed. No migration or deployment.

## Checkpoint 17 — complete catalogue target categories (#76, implemented locally)

All 225 spells across 38 current lores now have reviewed target categories. Existing source text, names, difficulty values and lore introductions are unchanged. Helpers retain explicit limitations for range, line of sight, first/closest targets, species, mixed friend/foe areas, random victims and non-combat timing. Ambiguous Woodland Incantations and Stench wording is visibly left for a table ruling. Mortuary Scrolls receive target guidance only; no full Khemri system has been added. Custom/imported spells can still use the legacy fallback.

This completes the catalogue selector/colour/hint scope of #76 locally, not the broader spell-effect automation in #58 or #29. New ordinary tests cover all catalogue lores, existing UI tests cover each category, and the original prose preservation check passes. Full ordinary suite 2,628 passed; 358 database tests skipped in that run. Build/typecheck and lint pass with existing warnings. No deployment.

## Scope reconciliation after checkpoint 17

Implemented locally within the stated tracker scope: **#15, #181, #191, #29, #76, #142**. This is six of the first twenty, with substantial component fixes in several of the remaining umbrellas. None is newly deployed. #15’s original named exploration cases are covered through Hero selection, item assignment/study, the Freetraders symbol and leader XP; the tracker’s old reopened prose predates those implementations. No blanket claim is made for unrelated exploration mechanics. Remaining first-twenty work: #69, #152, #59, #70, #139, #161, #160, #114, #146, #141, #136, #138, #144, #143.


## Checkpoint 18 — Parrot combat calculation (#160, partial)

A carried Parrot now exposes a relevant melee-only failed Leadership test control, alongside first-round selection. The engine applies −1 to hit only against that bearer in the first round (including a charge); later rounds, successful tests, absent/zero-quantity Parrots and shooting are unaffected. The Leadership roll is currently made at the table and confirmed by the player; this does not complete the broader equipment item or add a saved in-app Parrot test sequence. Source: equipment scrape, Parrot / Town Cryer 9.

Validation: 122 focused combat tests passed. Local changes only; no deployment.


## Checkpoint 19 — Sashimono Stupidity reroll and saved test progress (#161, partial)

Sashimono bearers can reroll their Stupidity test once, including a passed initial test as permitted by the printed “all non-rout” wording. Both original app rolls and any manual edits are logged; the second result stands. Pending first/second tests and movement dice now persist in the battle state and resume on reopening, replacing the previous unsaved local form. Manual dice also consume Holy Relic first-test eligibility, and choosing an automatic relic pass retires an unrolled draft.

Focused component/domain tests cover reopening both stages, edited second dice, a failed second result and absent equipment. Other non-rout test types and banner proximity remain outstanding. Local only.

Checkpoint 19 validation: 2,634 ordinary tests passed; 358 database tests skipped by that run. Production build/typecheck and lint passed (existing audit warnings only).


## Checkpoint 20 — Nehekharan Map shared rules (#143, partial)

The Nehekharan Map now requires the same purchase-grade D6 as the Mordheim Map and supplies its Vague/Accurate/Master exploration aids. Its aid keys remain separate from Mordheim Maps held by the same warrior/stash, and used non-Master maps receive spent marking on the correct item type. Zero-quantity maps offer no benefit. This is the source’s explicit use-the-rulebook-map clause, not a Khemri campaign implementation. Fake/Catacomb scenario selection and Cathay remain open.

Validation: 92 focused exploration/report tests passed, including all grades, owner out-of-action and spent marking without touching a different map type.

Also corrected the shared Master Map condition: it requires an active Hero bearer who avoided going out of action; a Master Map in the stash grants no reroll. Two source-condition tests added.


## Checkpoint 21 — Nuln and Bedouin rare-search bonuses (#144, partial)

Impeccable Care now adds +2 for every blackpowder weapon search by a Gunnery School warband, including weapons with no discounted-price rule. It does not apply to ammunition/blackpowder supplies or other equipment. Bedouin Desert Trader adds +1 once when an active Bedouin is present, never +2 for two. Both feed the existing rare-search total and explanations. Removed zero-stock equipment/empty groups from equipment-based search bonuses.

Sources: grade-1b-part1.md Impeccable Care (2005) and Desert Trader (674). Sixteen pricing/restriction tests passed. Chaos Armour per-kill bonus, Rhinox and structured Marauder tribe modifiers remain outstanding.


## Checkpoint 22 — Chaos Armour per-takedown rarity (#144, partial)

New reports retain each participating Hero’s actual enemy takedown count separately from XP. Trading reads that count from the latest report and applies +1 per takedown for Chaos Armour / Mechanical Suit searches, using the searching Hero rather than the equipment recipient. Old reports remain explicitly unknown and ask for a count, including zero. Changing a recorded count requires a reason, included in successful and failed purchase-search logs. Search totals now show dice plus modifiers numerically. A report-loading error stops trading rather than treating missing report facts as empty.

Verification: 77 focused UI/report-generation tests passed. Five actual local-database report tests passed, including persisted battle facts through the real submit/withdraw path. No database migration needed: optional facts live within the existing applied-report JSON. No production changes.

Checkpoint 22 complete validation: 2,644 ordinary tests passed; 358 database-only tests skipped in that run. The separate five-test local report database suite passed. Build/typecheck and lint passed with the existing audit warnings only.


## Checkpoint 23 — Brace prices, brace rarity and Nuln fixed discounts (#144, partial)

Found a concrete parser defect: “46 + 2D6 gc for a brace” could be read as a fixed 6 gc brace. The parser now retains the whole quote; variable quotes cannot masquerade as fixed amounts. Buying a brace changes its price dice and Rare threshold together, quotes the cost for two pistols, and deducts it once. Explained price overrides apply to that displayed brace total and reset when quantity changes. Existing flat brace parsing remains covered.

Source reconciliation also found Nuln’s five old price overrides contradicted its printed equipment lists and seven gun discounts were absent. All twelve blackpowder weapon prices now follow the fixed starting-list prices that Impeccable Care explicitly retains after recruitment, including their brace discounts; no catalogue price dice are added to Nuln’s fixed quotes. Non-Nuln variable-price quotes remain variable. Sources: grade-1b-part1.md equipment lists 2064–2113; equipment scrape 1020/1056 for the two higher brace rarities.

Focused tests cover a normal brace at 46+3+4=53 gc / Rare 10, a Nuln 35 gc brace adding exactly two pistols for one search, the rarity boundary and all twelve Nuln prices. Rhinox capture/injury and structured Marauder tribe modifiers still remain.

Checkpoint 23 validation: 2,648 ordinary tests passed; 358 database tests skipped. Build/typecheck and lint passed with the existing audit warnings only.


## Checkpoint 24 — Marauder tribe foundation (#136/#144/#59, partial)

Tribe is now an optional, validated warband field, not a leader flag. New Marauder warbands require a choice; existing warbands can record it, with a reason to correct it later. Hung's 12-model cap is applied in builder, roster validation and recruitment. Kurgan's Warhound exception applies to recruitment checks and the displayed cap. Norse +1/Kurgan −1 rare searches (Great Axe/Barbed Whip exceptions) and Hung's fixed 40 gc Warhorse quote are connected. No default tribe is invented. Three actual database tests cover creation, preservation, correction, another player's denial and atomic invalid-value rejection. Four rules tests cover recruitment boundaries, listings and pricing. Migration 140 is local only. The remaining advertised tribe rules must be connected or explicitly labelled before release; this is not a ticket completion.

## Checkpoint 25 — Abomination Powered (#138)

Post-battle asks which opposing warrior took each Abomination down. The applied report awards one shard to that warband, retains the Abomination and its equipment, and records a reanimation debt. Existing per-model absence handling keeps unpaid models out of subsequent battles while leaving other group members available. The roster offers payment of one shard per model, with a guarded refund/undo. Rewards and payments are transactional. Repeat payment requests do not charge twice. A spent opponent reward or subsequent reanimation blocks report withdrawal until restored; successful withdrawal reverses the opponent reward and original debt. The report and payment audit reasons are plain English. Migration 141 applied only locally.

Three report-generation tests passed; actual local report integration covers own-side invalid recipient rejection, forbidden direct access to the internal apply helper, repeat report rejection, spent-reward withdrawal rollback, payment retry, payment-before-withdrawal dependency, refund and complete withdrawal. Existing Flesh Construct report integration also passed through the new wrapper. Full ordinary suite: 2,655 passed, 362 database tests skipped (separate actual integration results above). Typecheck passes. Browser acceptance and final combined release validation remain before declaring the batch ready.

Checkpoint 25 mobile acceptance: reanimation paid 1 shard (1 → 0), ready-state survived refresh, undo restored the shard and reanimation debt (0 → 1). The initial history-rendering defect was corrected and regression-tested; final history contains plain sentences, not the receipt object. 390px content width equals viewport width. Hung tribe saved, persisted across reload, and a subsequent correction required a reason. Both disposable fixtures deleted; viewport reset and tab closed. #138 is implemented locally, bringing completed first-twenty issues to seven.

## Checkpoint 26 — Black Orc Animosity procedure (#70)

Boyz and Shootaz now join the per-model test workflow. Their source conflict is explicit: players choose the warband-wide D6 procedure or the printed unit Leadership procedure and record their agreement. No default ruling is imposed. Leadership, original app dice, changed dice, result and agreement persist in battle state. An unresolved choice cannot roll; failed tests use the existing Animosity result/action restrictions. Engaged/range exemptions remain table declarations available before rolling. Promoted Heroes, Nuttaz and Trolls are excluded. Tests cover both procedures, persistence, player dice changes and action restrictions. Full source reconciliation and browser acceptance remain before closing #70.

Checkpoint 26 acceptance: desktop model 1 chose the unit Leadership rule, rolled 4+1 in-app, refreshed with roll locked, changed to 6+6 and resolved effect 3 (squabble). Mobile model 2 independently chose the D6 rule and passed on 2. Saved database state retains both agreements, app originals and edits; only the Leadership procedure writes a first-Leadership-test entry. No horizontal overflow at 390px. Fixture and tab removed, viewport reset. Actual rule eligibility tests exclude Nuttaz/Trolls/promoted Heroes; friendly targets retain hired swords and eligible Orc/Goblin henchmen, excluding Troll groups. #70 closed in its original psychology scope; Oi Behave! special-skill work remains #59, banners #161. Eight of the first twenty are now implemented locally: #15, #181, #191, #70, #76, #29, #142, #138.

## Checkpoint 27 — Leadership item consumers (14 September, local only)

Completed #161's item consumers: Banner and Clan Pestilens Banner failed All Alone rerolls; Jolly Roger immunity for eligible Pirates; Sashimono non-Rout tests, including Black Orc Leadership Animosity; Standard of Nagarythe failed Leadership/Stupidity/Rout rerolls and capture consequences. Range and individual bearer identity are explicit table confirmations. Movement remains a table action. Existing Holy Relic, Silk, War Horn and Liturgicus controls remain integrated.

New Leadership controls retain app originals, edited faces, both tests, pending rerolls and reasoned corrections. Current-turn horn bonus feeds the suggested Leadership. Standard capture gives own Shadow Warriors Hatred, removes the reroll and prevents voluntary Rout; failed Rout remains available.

Verification: 2,670 ordinary tests passed (362 database-gated skipped) and production build passed before final small UI/horn wiring; extra Standard/Stupidity regression passed afterwards. Mobile 390px real local battle: Sashimono app 1+6 edited to 6+6, second app 6+4 persisted through refresh, edited to 1+2 and confirmed; grouped Standard range gate, failed test and capture notice checked. Local database retained both originals, edits and single Leadership ledger entry per test. Disposable data removed. Final full checks required before release.

Source correction for #70: Forest Goblin Boss Pole grants nearby Goblin Animosity immunity; Squig Prodder extends Squig Minder range instead. The hint now uses Boss Pole.

**Completed count: 9 of 20** (#15, #181, #191, #70, #76, #29, #142, #138, #161). Remaining partially implemented tickets are not counted. No deployment.

## Checkpoint 28 — Eye of the Gods and final release validation

#136 now distinguishes a Seer’s starting Mark from an Eye-awarded Mark; honors the actual leader’s participation, Norse and Tattooed Body thresholds, win/loss modifiers, patron compatibility and optional reward refusal. Legacy saved Eye dice are retained. New app dice cannot be rerolled by reopening; edited faces remain explicit in the report. Crow adds Toughness, Arkhar adds Frenzy/anti-spell protection, and Eagle grants a random Tchar spell with the novice casting penalty where appropriate. Mark identity is visible on the roster.

A doomed leader becomes the actual Spawn unit with no inherited XP, skills, injuries or kit. An existing surviving Spawn prevents a second one. Condemned Fate is a separate late report decision after advances; legacy placeholder stats never prove that variable attributes were fixed. Explicit confirmation of fixed attributes persists and unlocks the normal Hero equipment list. A still-variable Condemned at 90 XP becomes a Spawn or leaves. Its last earned advance remains reachable before this decision, and any discarded advance is explained. General Condemned variable-stat advancement and per-turn Spawn/Mark combat clauses remain under the broader specialist skill/combat work; this closes the lifecycle scope of #136.

Actual local database tests: Mark saved once with +1 Toughness, duplicate submission rejected, withdrawal restores original flags/stats; Spawn and lost kit commit together, duplicate submission rejected, withdrawal removes the Spawn and restores the old Hero and exact kit. Mobile 390px: Eye app 1+5 changed to 6+6, prepared transformation survives refresh, switching to a win offers the Mark, Condemned Fate is after advances, report filed with Crow and a Condemned Spawn, saved roster displays both correctly. Disposable fixture removed; no horizontal overflow.

The full database regression sweep caught two pending migration regressions before release: migration 140’s broad notes replacement touched Hero/group UPDATE statements; it is now scoped uniquely to the warband UPDATE. Migration 141’s withdrawal wrapper now preserves the existing campaign-GM permission instead of requiring roster-edit access. The complete suite passes after both repairs.

Final checks: **2,683 application tests passed; all 364 database tests passed; TypeScript/production build passed; all 135 migration files replayed successfully in a separate empty database, then removed.** Lint passes with nine warnings (eight historical audit/design warnings and an existing BuyTab memo dependency warning). No new lint errors. Public release and tracker update are prepared separately; do not stage the mixed historical tracker file wholesale. Nothing pushed or deployed.
