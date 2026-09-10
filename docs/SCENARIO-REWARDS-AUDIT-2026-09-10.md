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
