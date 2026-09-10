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
