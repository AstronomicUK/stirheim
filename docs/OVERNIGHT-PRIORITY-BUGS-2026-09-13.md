# Overnight priority bugs — 13 September 2026

Tom authorised working through the following order, grouping related fixes when useful. If all twenty are resolved before his next message, assess and begin the next twenty outstanding items. Keep changes local for a combined release; the prior deployment permission was for the completed release.

Order: #15, #181, #191, #69, #152, #59, #70, #139, #161, #160, #76, #29, #114, #146, #142, #141, #136, #138, #144, #143.

For each item, reconcile old findings with the current code and source before editing. Core behavior already delivered must remain intact. Preserve player overrides, document ruling-dependent clauses and continue independent work. No Claude delegation while usage remains reserved. Full Khemri stays deferred.

| Item | Progress |
|---|---|
| #15 | Existing scope verified locally: Well/Pit selected hero, books, held gems, Freetrader symbol, leader sacrifice XP. Old permanent-jewel/Haggle wording was incorrect. Book database regressions pass. |
| #181 | Fixed one-D6 injury roll and bands; preserves app/manual provenance. |
| #191 | Fixed Penthesilea’s 70-point rating, without adding XP. |
| #69/#152 | Sling/Slingshot double-shot conditions fixed. Censer/Disease Dagger ruling-dependent wounds remain deferred; Powder Keg ignition and blast follow-up implemented locally (checkpoint 4). Many historical weapon bullets already implemented. |
| #59/#70 | Powerful Build future Strength access, Big Bully/Renowned Virtue immediate single bonus pick, and Brave removal of Animosity implemented locally. Larger supplementary skill/psychology scope still open. |
| #139–#143 | Remaining items pending in approved order. |

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
