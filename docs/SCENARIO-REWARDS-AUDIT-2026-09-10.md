# Scenario rewards audit — Between Battles

Local implementation record, 10 September 2026. This is **not a completed audit of all 103 scenarios**. Do not infer “no rewards” from absence below. Sources are the full matching scenario sections in the local Mordheimer scrape, preserved in `src/rules/data/campaign/scenarioDetails.ts`, with each page’s URL and source-file lines. No deployment has been made.

Normal treasure paths implemented and checked:

| Scenarios | Source section / applied rule |
| --- | --- |
| Skirmish, Breakthrough, Street Fight, Surprise Attack, Occupy | Reviewed scenario rules: no additional treasure. Their experience and ordinary exploration remain separate. Extra loot requires an explained adjustment. |
| Defend the Find | Wyrdstone: name Heroes inside the building at the end; one shard each, capped at three; either side. |
| Wyrdstone Hunt | Wyrdstone/Special Rules: held counters, with a maximum of four counters supplied by D3+1. |
| Treasure Hunt | Wyrdstone/Set-up: held counters; D3 counters per warband in the original setup. |
| Finders Keepers | Wyrdstone/Terrain: held counters, maximum three in the stash. |
| Chance Encounter | Special Rules/Wyrdstone: both initial D3 amounts; own participating Hero casualties reduce retained shards to a minimum of zero; enemy Hero casualties grant captured shards capped at the enemy’s initial amount. Does not subtract existing treasury shards. |
| Hidden Treasure | Special Rules/Ending: winner gets chest. Gold 3D6 automatic; independent D6 finds for D3 shards (5+), light armour (4+), sword (3+), D3 10-gc gems (5+). Gems remain stash items. |
| The Lost Prince | Special Rules/The Reward: winner plus explicit surviving-son condition. Gold 5D6 automatic; independent finds for D3 swords (4+), heavy armour (5+), light armour/shield/helmet (4+), D3 10-gc gems (5+). |
| One Man’s Rescue is Another Man’s Kidnap | Ending: winner gets 5D6+10 gc. |
| Bar Room Brawl | Special Rules, Sam: winner and Sam out of action required; 3D6 gc and Bugman’s Ale supply. Existing XP heading/body conflict choice remains separate. |
| A Night in the Graveyard | Special Rules, A Dead Man’s Gold: explicit Erasmus-defeated/driven-off and grave-looted condition; 4D6+20 gc; no invented winner requirement. |
| The Secrets of Beujuntae | Rewards: follow explicit **2D6 per item**, despite table heading “D6”. Gold 2D6+5 automatic; sickle 6+, D6 10-gc gems 7+, bone armour 8+. Special items retain their source effects in custom stash names; this does not add new combat-engine handling for them. |
| The Mummy | Treasure Board: explicit defeated-mummy/secured-hoard condition; separate rolls for every printed row, including **both** light armours. Gold 5D6 and Lucky Charm automatic. Jewellery quantity is one item, with separately rolled D6×10 value. |
| The Wizard’s Tower | Treasures: per-chest D6, 1–2 nothing, 3–5 3D6 gc, 6 6D6 gc. No exploration, but explained adaptation remains available. Implemented in the preceding checkpoint. |

Cross-cutting behavior: raw dice persist in the local draft; changing a discovery clears its quantity dice; incomplete successful finds block filing; failed/irrelevant branches do not award stale values. Treasury/stash are derived without accumulating rewards on repeated renders. Independent report notes record conditions, failed finds, dice, quantities and gold. Normal forms contain only that scenario’s reward options; a separate collapsed adjustment permits explained niche cases and old manually entered draft amounts.

## Verification

Unit/report tests cover caps, invalid/out-of-range dice, stale failed finds, non-participants, casualty calculations, winner/condition changes, both armour rows, variable jewellery value, flat bonuses and the 2D6 source discrepancy.

`/tmp/stirheim-rules-qa.mjs` creates and deletes disposable **local** campaign/warbands/matches. At mobile width 390px, Hidden Treasure resolves all finds, retains dice through reload, resets quantity after changing discovery, blocks incomplete filing, and files a real report: +6 gc, +2 shards, a sword and three 10-gc gems. Desktop layout also inspected. Screenshots `/tmp/between-scenario-rewards-mobile.png` and `/tmp/between-scenario-rewards-desktop.png`.

The same browser check verifies #87 with a participating Hero: untouched advancement blocks Next through reload; rolling a skill enables deferral; Wizard’s Tower then skips exploration, resolves a chest, and files +6 gc with the Hero’s XP applied. No browser errors.

Remaining scenarios still need individual source audit and implementation. Do not close #72 or imply the whole app has lost its old unrestricted reward form yet. Scenario XP distribution, special recruit rewards, campaign artefacts and trading/next-game consequences remain separate outstanding cases where not already implemented elsewhere.

## Additional local source paths, milestone 15

| Scenario | Source / reward |
| --- | --- |
| Wolf Hunt | `06-scenarios.md:1986–2066`: 10 gc per slain wolf, either result; bears excluded. Free Ranger is explicitly temporary, not a permanent award. |
| The Rat’s Lair | `6166–6215`: 5 gc per vermin taken out of action, either result. |
| River Watch | `1740–1788`: winning defender only, D6×20 plus 5 gc per enemy taken out of action. |
| Ogham Stones | `6117–6161`: winning warband receives gems/jewels valued at 5D6 gc; kept as a valued stash item. |
| Battle for the Farm | `1431–1498`: separate looted-building entries; recorded D6 1 nothing, 2–5 2D6 gc, 6 one shard. Each building once. |
| Dem’s My Gubbinz | `3446–3475`: 2D6 separately per held non-sacred counter; at most five. |
| The Pool | `4862–4904`: held shard counters; D3+3 supplied (maximum six). |
| Ambush (Town Cryer 5) | `2976–3016`: shards carried off or still held by Heroes; each defending Hero started with D3. |
| Forbidden Square | `3709–3804`: stolen shards only, maximum eight from D6+2; offered shards vanish and must not enter the treasury. |
| Rat Attack, Surrounded, Scourge & Purge | Full corresponding pages reviewed: experience rewards, no additional treasure. Existing XP discrepancies remain distinct from this treasure audit. |
| Lair of the Snake, That’s All Mine, Jungle Skirmish, Island Hopping | Full pages reviewed: no additional treasure reward. |
| Script of Sigmar | Both linked missions reviewed: experience, no priced loot. A player-agreed replacement objective uses the explained adjustment. River deaths/equipment loss are not newly automated by this reward change. |
| Night of the Headless One | Explicit carried-off-skull condition; campaign relic saved with the printed future summoning rules. Winning by rout alone does not grant it. This records the item, not automatic future summoning/combat. |
| Wizard’s Mansion | `6737–6811`: each initial item must be declared not previously found before being awarded; no duplication of issued kit. Then all additional hoard rows separately. Wooden Man excluded; Athame and Scroll retain source effects/trade values. |
| Lost Temple of the Slann | Initial booty once; full additional table per standing participating Hero, capped at six. Guardian excluded. Cloak/Scroll retain source effects. |
| Monster Hunt | `4552–4741`, Treasure Hoard: controlling-lair condition, every row including both light armours; D3+1 shards; valued jewellery; artefact table shares the campaign ledger. |
| Death in the Mists, Blood Hunt, Lost in the Bogs | Full pages reviewed: no additional treasure. Blood Hunt’s free Persona is explicitly temporary. |
| A Stroll in the Garden | Full page reviewed: no separate treasure; existing extra exploration die and entire-pool reroll remain in Exploration and the report log. |

Local browser verification now also files Farm rewards after a loss (+7 gc, +1 shard), checks reload/dependent reset/incomplete gating, and files a Monster Hunt artefact into the real local campaign ledger. Migration 46 unifies exploration/scenario discovery checks; six local database tests pass, including simultaneous discovery across both sources and duplicate-in-one-report rollback. Neither this migration nor the client changes have been deployed.

## Additional local source paths, milestone 16

- **Haunted Treasure variants:** both require the chest recovered to safety; all eight rows resolved separately and the artefact uses the shared ledger. Archive Pestilen states 5D6×5 gc. The [Town Cryer PDF, page 2](https://broheim.net/downloads/scenarios/cryofthebanshee.pdf) also omits the multiplier in the original table, so this version requires an explicit saved multiplier/reason rather than silently borrowing ×5.
- **Protect the Prince:** winning protector 4D6; winning attackers after the Prince’s death 2D6 plus two treasure pieces. The outcome selects the correct branch.
- **Burn the Witches:** defenders select only the named relics actually rescued, with no duplicates; attackers get D3+1 shards regardless of result.
- **The Watchers:** one D6 and corresponding item per retained Swag counter. Full page reviewed; its catalogue summary incorrectly describes a different encounter, so implementation follows the rules body.
- **Blood on the Pasturelands:** 0–6 stolen horses, less D3−1 after routing, floor zero; surviving mounts go to the stash.
- **Defend the Village:** mandatory one reward D6 for winner, +1 for attacker, then the selected row’s separate gold/shard dice.
- **Night of the Dead / Round-up at the Mordheim Corral:** actual safely recovered/retained shards, no duplicate reward roll for counters already resolved during battle. Night of the Dead’s optional victory-target D6+2 is not extra loot.
- **Don’t Wake the Giant:** separately selected two chests and bag; distinct find rolls for each, including each container’s gems. Removing a recovered container removes its rewards.
- **Ambush (Michael Reuvers):** starting D6 capped by defending Hero count; defender keeps initial less own Hero casualties, attacker captures per enemy Hero casualty capped at initial. Other Ambush versions remain separate.
- **Gift of the Truthsayers:** possession condition, mandatory 2D6 (despite D6 table heading), own named gift table, separate 5D6 value when applicable. These are not the core six campaign-unique artefacts.
- **Tomb Raid:** mandatory D3 find count and D6 per find, separate item quantity/value dice. A gemmed helmet remains one item.
- **The Gauntlet:** loose D3 counters have their own count; the Great Treasure is explicitly selected by the players in the source and uses the explained agreed-prize adjustment.
- **Full pages with no additional priced treasure:** Frenzied Mob, Eerie Downs, Black Fire Pass, Watchtower, Street Brawl, Boss Orc’s Ambush/Breakthrough, Grudge Match, It’s All Mine, Raid, Rescue, Archive Scourge and Purge, Scripts of Sigmar, Koleshire Keep, Restless Dead and Square of the Snake. Temporary arsenal/characters are not permanent awards. Rescue uses the existing captive record; linked/overlay scenarios and explicitly changed objectives retain explained adjustments. This does not newly automate unrelated special combat/injury consequences.

Mobile Village test passed through real filing, including fixed initial row, attacker modifier, reload, and clearing dependent rolls when the side changes. The previous Farm/Monster artefact/full batch browser checks continue to pass. Source-specific tests cover the added outcome branches, duplicate relic rejection, routing horses, both Ambush versions, and independent Giant containers.

- **Hunt the Heretic:** full page 1622–1675 reviewed. Winning Witch Hunter side receives D6×15 gc and D3 Blessed Water; winning Warlock side chooses each of D3 poison/drug doses. Changing the quantity clears choices; invalid or missing selections block filing.
- **The Item Lost:** full page 5773–5820 reviewed. Actual retrieval is required. Nicodemus’s employers receive two shards; other retrievers keep the Wand of Phyrros or sell it for 100 gc, never both. Temporary Nicodemus is not recruited permanently.
- **Mordheim’s Burning:** full page 2810–2875 reread. Corrected the earlier local interpretation: only the winning warband explores, with no winner bonus die. Explained overrides remain available; ordinary losing-side exploration defaults to zero. Triple sale income remains handled by the income step.

Milestone 16 verification: 1,441 tests pass / 96 database-dependent skipped. Typechecked production build passes; lint has only three existing audit-probe warnings. Tomb Raid and Truthsayer rewards both file through real mobile touch interaction, persist quantities/value/raw rolls, and save the Truthsayer catalogue ID. Review rows now wrap long descriptions and the action bar reserves the full navigation height. Twelve named scenario items use short catalogue identities, source-linked tooltip rules and exclusion from ordinary shop stock; the catalogue and alias tests cover this. These items’ acquisition/tooltips do not claim additional combat automation.

### Milestone 17 — combined treasure and role payments

- **Defend the Tomb (3391–3447):** exactly three Tomb treasure rolls, plus D6×10 gc and D3 gems individually valued at D6×5. Quantities and values stay separate; changing gem count clears prior values.
- **Protect Hornsby’s Ferry (1682–1735):** attacker victory 3D6, own roughing-up participation 2D6 even on a loss; unharmed-family defensive victory 5D6 less 2D6 patrol fees when applicable. Named agreed allocation supports allied victory; each warband files only its own share, without crediting allies a second time.
- **The Bodyguards (5386–5473):** choose qualifying role/outcome. Surviving merchant pays defender 7D6+20 and a 2D6 gift; attacker returning merchant/head receives 4D6+15 and the different gift table. Explicit Holy/Unholy choice; changing role clears all dependent dice and choices.
- **Bounty Hunting (3201–3245):** actual participant count determines 6+number of warbands bandits. Each head gets a separate D6+5 payment; six crossbows, D3 swords, 2D6 daggers. Missing participant context blocks calculation rather than guessing.
- **The Recipe (2308–2397):** only the nominated winning warband claims Geefer’s 5D6; intact carried pies survive routing. Losing pies pay 1 gc each, winning carried/cart pies pay half rounded up. Total bounded by the scenario’s 24-pie maximum.

Full suite: **1,448 passing / 96 database-dependent skipped**; typechecked build passes. Mobile Defend the Tomb, Bodyguards role reset/relic choice, Bounty participant count and Ferry shared payment all file correctly and retain their logs. Source map has 82 explicit entries including Wizard’s Tower; 21 scenarios remain without a complete reward implementation. Newly reviewed but not yet implemented campaign consequences include Encampment Raid’s captured stash/camp and Gathering’s control of Executioner’s Square; Balewolf lycanthropy is a separate injury consequence. Do not mark those complete based only on absence of a gold table.

## Milestone 18 source review

| Scenario | Source lines in `reference/rules/06-scenarios.md` | Applied path and limits |
| --- | --- | --- |
| Stagecoach Ambush | 5126–5180 | No extra quantified reward; one-off hires/mounts remain temporary. |
| Stake-Out | 5185–5240, original Broheim PDF pp. 4–5 | D6 loser/D6+1 winner income. Printed exploration ambiguity requires a recorded table reading; no invented draw award. |
| Sword of the Herald | 6396–6485 | Three shards per actual splinter, bounded by setup; recovered sword 100 gc or eligible retention. Optional non-campaign mode still receives these rewards. Source rules are in its item tooltip; this acquisition work does not introduce automatic sword-binding or capture combat behavior. |
| Kidnapped | 4297–4381 | Living victim +1 XP; rescued victim D6 XP +50 gc; sacrificed victim D6 XP and up to two optional Shadowlord rolls. Named XP allocation, direct hero equipment/skills/stats and logged consequences. |

Local mobile filing passed for Stake-Out, Herald and Kidnapped. Migration 47 is local only; direct equipment transaction/undo tests pass. The all-scenario audit remains open.

## Milestone 19 source review

- **Happy Harpy Hunting Grounds**, `06-scenarios.md:2073–2147`: nest requires victory and all three Harpies defeated before rivals rout. Setup shards are not rerolled. Ten independent treasure entries plus Straggler 5+; Straggler may assist now or next exploration. Saved benefit survives skipped exploration.
- **In the Dead of the Night**, `06-scenarios.md:4133–4206`: winner D3 shards; successful defending ritual may retain D3+3 Zombies within roster capacity, excess wander away. Six retained Zombies form groups of five and one; both persist in the report transaction.

Mobile tests filed both reports against disposable local warbands and checked saved shards, benefit and actual group sizes. No production changes.

### Local milestone 24 — Mule Train rewards (#72)

Full scenario source `06-scenarios.md:4748–4792` and Slaughtered Warband table reviewed. Record starting train and actual mules led off; defenders receive separate 2D6 payments even after a loss. Attackers keep the actual mules and receive one combined cargo search, with +1 per additional mule on discovery rolls only. Zero recovered mules grants nothing, and changing role/count clears dependent rolls. Forty reward tests, typecheck and mobile loss/payment/reload/report filing pass. Coverage is now 89 explicit scenario reward paths out of 103; 14 remain. No deployment.
