# Natural attacks and special enemy experience — 11 September 2026

Tom approved completing tracker #163 and #112 after the previous production release. This is a separate, local batch; nothing here changes previously filed reports or live rosters.

## #163: no-equipment attack profiles

The core Fist entry expressly excludes creatures such as Zombies and animals (`reference/rules/02-weapons-armour-equipment.md`, Fist). Its ordinary profile has -1 Strength, one attack and +1 enemy armour save. The reviewed creature profiles instead use the warrior's actual Strength and Attacks without those penalties. Explicit IDs are recorded in `src/rules/data/campaignRules/naturalAttacks.ts`; there is no inference from an empty player's inventory or from all Undead units.

Reviewed every catalogue unit whose equipment list explicitly indicates none/no equipment, plus explicit unarmed clauses. The table below records the natural-attack whitelist. An equipped override still takes precedence, fixed companion weapons still take precedence, and the synthetic profile creates no inventory item or free off-hand weapon.

| Unit ID | Catalogue Strength | Catalogue Attacks |
|---|---:|---:|
| cult_of_the_possessed_the_possessed | 4 | 2 |
| skaven_giant_rats | 3 | 1 |
| skaven_rat_ogre | 5 | 3 |
| undead_ghouls | 3 | 2 |
| undead_dire_wolves | 4 | 1 |
| undead_zombies | 3 | 1 |
| witch_hunters_war_hounds | 4 | 1 |
| beastmen_warhounds_of_chaos | 4 | 1 |
| carnival_of_chaos_plague_bearers | 4 | 2 |
| carnival_of_chaos_nurglings | 3 | 1 |
| carnival_of_chaos_plague_cart | 3 | 1 |
| kislevites_trained_bear | 5 | 2 |
| orc_mob_cave_squigs | 4 | 1 |
| orc_mob_troll | 5 | 3 |
| black_orcs_troll | 5 | 3 |
| dark_elves_cold_one_beasthound | 4 | 1 |
| forest_goblins_gigantic_spider | 5 | 2 |
| horned_hunters_warhound | 4 | 1 |
| norse_wulfen | 4 | 2 |
| norse_wolf | 3 | 1 |
| skaven_pestilens_giant_rat | 3 | 1 |
| skaven_pestilens_rat_ogre | 5 | 3 |
| tomb_guardians_tomb_scorpion | 2 | 1 |
| court_of_pleasures_chaos_hounds | 4 | 1 |
| cursed_cavalcade_great_bear | 5 | 2 |
| cursed_cavalcade_wild_beasts | 4 | 2 |
| cursed_cavalcade_fighting_ape | 4 | 2 |
| lustrian_reavers_estalian_warhound | 4 | 1 |
| lustrian_reavers_barbary_monkey | 3 | 2 |
| lustrian_reavers_tilean_hunting_hawk | 4 | 1 |
| maneaters_sabretusks | 4 | 3 |
| marauders_condemned | 3 | 2 |
| marauders_warhounds_of_chaos | 4 | 1 |
| marauders_spawn_of_chaos | 4 | 4 |
| night_goblins_cave_squigs | 4 | 1 |
| night_goblins_troll | 5 | 3 |
| night_goblins_web_cave_squigs | 4 | 1 |
| night_goblins_web_great_squig | 5 | 3 |
| night_goblins_web_troll | 5 | 3 |
| restless_dead_zombies | 3 | 1 |
| restless_dead_scarecrows | 3 | 2 |
| druchii_slavehounds | 4 | 1 |
| halflings_piggies | 3 | 1 |
| masters_of_horror_wolfman | 4 | 2 |
| masters_of_horror_zombies | 3 | 1 |
| masters_of_horror_flesh_construct | 4 | 2 |
| mazzalupo_black_sheep | 3 | 1 |
| necrarchs_zombies | 3 | 1 |
| necrarchs_abomination | 4 | 3 |
| ogre_hunting_party_sabretusk_cubs | 4 | 1 |
| companion_filly | 3 | 2 |
| giant_rats | 3 | 1 |
| wolf_rats | 4 | 1 |
| rat_ogres | 5 | 3 |
| strigoi_vampire | 4 | 2 |
| ghouls | 3 | 2 |
| giant_bats | 3 | 1 |
| wolfhounds | 4 | 1 |
| restless_dead_variant_liche | 2 | 1 |
| restless_dead_variant_zombies | 3 | 1 |
| restless_dead_variant_bone_goliath | 5 | 3 |

These are baseline profiles; variable printed characteristics (e.g. a Spawn's random Attacks) still use the current roster value. This is not a new implementation of random characteristics or positioning rules.

### Explicit exceptions

- Dragon Monks: open-hand profile, +1 Attack, 5–6 critical trigger only on the unarmed attack. They can select unarmed while carrying a weapon. A Quarter Staff resolves its own profile followed by one bare-hand attack, so the staff does not inherit the 5+ critical. Both share the normal phase-critical limit. Sources: `warbands/grade-1c.md:187–199`; weapons source Quarter Staff/Freestyle.
- Warrior Monks: same unarmed choice/+1 Attack and staff split, ordinary critical trigger. Source `grade-1c.md:215–221`.
- Raging Peasants: improvised tools, no weakened-fist penalties, no invented bonus Attack. Source `grade-1c.md:224–229`.
- Ogre Hunting Party Ogre Hunter: normal Strength and printed Attacks but retain +1 enemy armour save; available only without another melee weapon. No extra off-hand attack. Source `grade-2a-part1.md:2923–2933`. Do not infer this exception for all Ogres.
- Both Night Goblin Snotling versions: a free Pointy Stick counts as a dagger, not an ordinary Fist or penalty-free natural weapon. The fallback retains +1 enemy armour save without the Fist Strength reduction or one-attack cap. Sources `grade-1c.md:2806,3162`.
- Ordinary disarmed warriors retain the original Fist profile.

The Bitten's conditional transformation, learned skill activation (e.g. Energy Focus/Skaven Art of Silent Death), Centigor Trample, natural-attack poison/magical effects and other bespoke creature rules remain under their existing broader skill/combat entries (#59/#69/#70). They are not claimed as implemented by this baseline-profile correction. A Bitten in human form is deliberately excluded from the unconditional whitelist. Existing approved equipment overrides are preserved.

## #112: experience earned for defeating small enemies

Sources: `warbands/grade-2a-part2.md:1265–1280` (Runts); `warbands/grade-1c.md:3154–3172` (WEB Night Goblin Snotlings). The Rigors of Leadership survival correction was in the previous release and is unchanged.

- A hero's ordinary kill tally is reduced by the separately identified Runts/Snotlings, avoiding double awards.
- Each defeated Runt receives a post-battle D6 test: 5–6 awards one XP, 1–4 awards none. The printed enemy Henchman-group exception is supported too; it does not grant ordinary kill XP to groups.
- WEB Snotlings give heroes half an XP each, accumulated and rounded down per warrior after the battle. Other Snotling lists are not assigned this rule. These special fixed awards do not scale with a scenario's ordinary kill-XP value.
- Active attack events identify the victim by unit template ID. New events preserve that ID even if the roster entry is subsequently removed; older events use the opposing roster. Raw player-calculated sheets can supply named casualty attribution too. Matching manual/logged counts are not added twice.
- The Experience step exposes editable special casualty counts for table-resolved or incomplete old records. For heroes, special counts must fit within their total casualty tally. A player who combines separate manually recorded and logged casualties may need to correct the pre-filled count; no exact group-member identity is invented.
- Original app dice, replacement dice and entered results persist in the report draft. Failed tests and the original-to-edited history are preserved in plain English in `xp_log`, including zero-XP outcomes. Missing required tests prevent submission. Dead/no-XP warriors and wiped groups are excluded.
- No database migration, retroactive XP mutation, deletion of player records or alteration to approved manual overrides.

## Verification

Focused regressions cover the real catalogue → roster → combatant → loadout path, all whitelist IDs, normal Fist fallback, selected weapons/off-hands, Monk critical separation, Ogre/Pointy Stick exceptions, XP calculation, original roll history and the final report log. Mobile browser checks use disposable local warbands and confirm staff/open-hand selection, automatic Runt identification and edited-roll persistence after reload. Final suite/build/browser results are recorded in the tracker checkpoint.

Final verification: 1,969 ordinary tests, 16 isolated browser regressions and the dedicated mobile flow passed. Production build/typecheck and lint passed with existing warnings only. No database migration or production deployment.
