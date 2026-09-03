// Scenarios — pre-battle rules and the scenario index table from mordheimer.net, as captured in
// reference/rules/03-campaigns-magic-optional-rules.md lines 1289-1446.
//
// IMPORTANT: the scrape only captured the index (title / one-line description / setting / author /
// source) plus the pre-battle sequence and the two random-scenario tables. The full rules for each
// scenario (setup, special rules, ending, experience) were NOT captured, so `rulesMarkdown` is left
// undefined on every entry. Only the core rulebook scenarios need it for v1.
//
// Generated from the Markdown source; edit the source and regenerate rather than hand-editing rows.

import type { NamedRule, SourceRef } from "../../types/common";
import type { ScenarioSummary } from "../../types/campaignContent";

export const SCENARIOS_SOURCE: SourceRef = {
  publication: "mordheimer.net — Campaigns: Scenarios (https://mordheimer.net/docs/campaigns/scenarios)",
  file: "03-campaigns-magic-optional-rules.md:1289-1446",
};

/**
 * "Starting the game" (source lines 1293-1336), one entry per sub-heading. The two scenario tables
 * are kept as Markdown in `text` so the UI can render them as-is.
 */
export const SCENARIO_GENERAL_RULES: NamedRule[] = [
  {
    name: "Pre-battle Sequence",
    text: "Although you can simply decide with your opponent which scenario you want to play, most players prefer to generate their scenarios randomly. To do this, work your way through the following sequence before the battle.\n\n1. The player with the lowest warband rating rolls on the Scenario table to determine which scenario is played. In the scenarios where there is an attacker and a defender, the same player may choose which he is.\n2. Roll for warriors with old battle wounds to see whether they can take part or not.\n3. Set up the terrain and warbands according to the rules for the scenario you are playing. The more buildings the better, so you should place all the terrain you have.",
  },
  {
    name: "Mordheim Rulebook Scenario Table",
    text: "| 2D6 | Result |\n|---|---|\n| 2 | The player with the lower warband rating may choose which scenario is played. |\n| 3 | Play Scenario 5: Street Fight. |\n| 4 | Play Scenario 7: Hidden Treasure. |\n| 5 | Play Scenario 3: Wyrdstone Hunt. |\n| 6 | Play Scenario 8: Occupy. |\n| 7 | Play Scenario 2: Skirmish. |\n| 8 | Play Scenario 4: Breakthrough. |\n| 9 | Play Scenario 9: Surprise Attack. |\n| 10 | Play Scenario 6: Chance Encounter. |\n| 11 | Play Scenario 1: Defend the Find. |\n| 12 | The player with the lower warband rating may choose which scenario is played. |",
  },
  {
    name: "Chaos on the Streets Scenarios",
    text: "Town Cryer #5 introduced a set of scenarios designed specifically for more than two players. To determine which scenario will be used for multiplayer games, players may either choose to play a particular scenario or roll on the following chart:\n\n| 2D6 | Result |\n|---|---|\n| 2 | The player with the lowest warband rating may choose which scenario is played. |\n| 3 | Play Scenario 7: Monster Hunt |\n| 4 | Play Scenario 4: The Wizard's Mansion |\n| 5-6 | Play Scenario 1: Treasure Hunt |\n| 7 | Play Scenario 2: Street Brawl |\n| 8-9 | Play Scenario 6: Ambush! |\n| 10 | Play Scenario 5: The Pool |\n| 11 | Play Scenario 3: The Lost Prince |\n| 12 | The player with the lowest warband rating may choose which scenario is played. |\n\nSee Chaos on the Streets (Optional Rules — Multiplayer Games) for more information on multiplayer games.",
  },
];

/**
 * Every row of the scenario index table (source lines 1339-1446). Ids are snake_case of the title;
 * where several scenarios share a title the later ones get a source (and, if needed, author) suffix.
 */
export const SCENARIOS: ScenarioSummary[] = [
  { id: "defend_the_find", title: "Defend the Find", description: "Defend a building from attackers.", setting: "Mordheim", author: "Tuomas Pirinen", source: "Mordheim Rulebook" },
  { id: "skirmish", title: "Skirmish", description: "Brawl between rival warbands.", setting: "Mordheim", author: "Tuomas Pirinen", source: "Mordheim Rulebook" },
  { id: "wyrdstone_hunt", title: "Wyrdstone Hunt", description: "Gain wealth by picking up wyrdstone.", setting: "Mordheim", author: "Tuomas Pirinen", source: "Mordheim Rulebook" },
  { id: "breakthrough", title: "Breakthrough", description: "The attacker needs to reach the other side of the board.", setting: "Mordheim", author: "Tuomas Pirinen", source: "Mordheim Rulebook" },
  { id: "street_fight", title: "Street Fight", description: "Both warbands try to reach the other side of the street.", setting: "Mordheim", author: "Tuomas Pirinen", source: "Mordheim Rulebook" },
  { id: "chance_encounter", title: "Chance Encounter", description: "Two warbands try to steal each other's wyrdstone.", setting: "Mordheim", author: "Tuomas Pirinen", source: "Mordheim Rulebook" },
  { id: "hidden_treasure", title: "Hidden Treasure", description: "Search the buildings for a hidden treasure.", setting: "Mordheim", author: "Tuomas Pirinen", source: "Mordheim Rulebook" },
  { id: "occupy", title: "Occupy", description: "Both warbands try to capture as many buildings as they can.", setting: "Mordheim", author: "Tuomas Pirinen", source: "Mordheim Rulebook" },
  { id: "surprise_attack", title: "Surprise Attack", description: "The Defender tries to fend off the attacker and starts with limited numbers.", setting: "Mordheim", author: "Tuomas Pirinen", source: "Mordheim Rulebook" },
  { id: "treasure_hunt", title: "Treasure Hunt", description: "Multiplayer. Similar to Wyrdstone Hunt.", setting: "Mordheim", author: "Mark Havener", source: "Town Cryer #5" },
  { id: "street_brawl", title: "Street Brawl", description: "Multiplayer. Similar to Skirmish.", setting: "Mordheim", author: "Mark Havener", source: "Town Cryer #5" },
  { id: "the_lost_prince", title: "The Lost Prince", description: "The warbands have heard rumours that a powerful man's son has wandered into the ruins and a handsome reward will be paid for his return.", setting: "Mordheim", author: "Mark Havener", source: "Town Cryer #5" },
  { id: "the_wizard_s_mansion", title: "The Wizard's Mansion", description: "Multiplayer. Similar to Skirmish with items at stake.", setting: "Mordheim", author: "Mark Havener", source: "Town Cryer #5" },
  { id: "the_pool", title: "The Pool", description: "Multiplayer. Root around for Wyrdstone in a pool in the centre of the table.", setting: "Mordheim", author: "Mark Havener", source: "Town Cryer #5" },
  { id: "ambush", title: "Ambush!", description: "Multiplayer. Wyrdstone carrying defenders have to get off the table alive.", setting: "Mordheim", author: "Mark Havener", source: "Town Cryer #5" },
  { id: "monster_hunt", title: "Monster Hunt", description: "Multiplayer. Warbands team up (or not) to take on a monster.", setting: "Mordheim", author: "Mark Havener", source: "Town Cryer #5" },
  { id: "kidnapped", title: "Kidnapped", description: "Possessed vs. any warband. Rescue a fair maiden before she gets sacrificed or sacrifice a fair maiden before she gets rescued, depending on your mood.", setting: "Mordheim", author: "Tuomas Pirinen", source: "Town Cryer #6" },
  { id: "rat_attack", title: "Rat Attack", description: "Skaven vs. any warband. Sewers. Defender must escape from opposite table edge. Skaven uses a mixture of decoy counters and warband counters to confuse the enemy.", setting: "Mordheim", author: "Christian Ellegaard", source: "Town Cryer #7" },
  { id: "scourge_and_purge", title: "Scourge & Purge", description: "Witch Hunters vs. any warband. Skirmish in the company of a possessed wizard.", setting: "Mordheim", author: "Donato Ranzato", source: "Town Cryer #7" },
  { id: "surrounded", title: "Surrounded", description: "Sewers. Defender must escape from centre of sewer network.", setting: "Mordheim", author: "Christian Ellegaard", source: "Town Cryer #7" },
  { id: "forbidden_square", title: "Forbidden Square", description: "A Witch Hunter Warband has been sent into a specific part of the City of the Damned by prominent members of the Order of the Templars of Sigmar.", setting: "Mordheim", author: "Donato Ranzato", source: "Town Cryer #8" },
  { id: "stake_out", title: "Stake-Out", description: "Sneaky attackers must kill the leader of the startled defenders. Defenders' leader must escape from table.", setting: "Mordheim", author: "Gavin Thorpe", source: "Town Cryer #8" },
  { id: "the_lair_of_the_snake", title: "The Lair of the Snake", description: "Four player scenario. Each player must take out his randomly specified enemy.", setting: "Mordheim", author: "Christian Ellegaard", source: "Town Cryer #9" },
  { id: "the_script_of_sigmar", title: "The Script of Sigmar", description: "Witch Hunters vs. Sisters of Sigmar. Two linked scenarios involving burgling the Sisters' Abbey.", setting: "Mordheim", author: "Paul Smith", source: "Town Cryer #9" },
  { id: "that_s_all_mine", title: "That's All Mine", description: "Attackers blow up a mine using gunpowder rules from Archive Pestilens (shamefully not described in the magazine) amid some random zombie shenanigans.", setting: "Mordheim", author: "Paul Smith", source: "Town Cryer #10" },
  { id: "the_caravan", title: "The Caravan", description: "Escort or rob a merchant's caravan train.", setting: "Mordheim", author: "Honza Skypala & Stepan Stepanov", source: "Town Cryer #11" },
  { id: "the_secrets_of_beujuntae", title: "The Secrets of Beujuntae", description: "Wyrdstone Hunt while a Daemon spirit flits around possessing random Heroes.", setting: "Lustria", author: "Stephanus Cornette", source: "Town Cryer #12" },
  { id: "jungle_skirmish_the_fog_of_war", title: "Jungle Skirmish / The Fog of War", description: "Light fog affecting movement and missile range.", setting: "Lustria", author: "Stephanus Cornette", source: "Town Cryer #12" },
  { id: "island_hopping", title: "Island Hopping", description: "Islands in a fast flowing river connected by bridges. Control as many as possible.", setting: "Lustria", author: "Stephanus Cornette", source: "Town Cryer #12" },
  { id: "the_night_of_the_headless_one", title: "The Night Of The Headless One", description: "Hidden Treasure except warbands look for skull of the Headless One while its awesome original owner creates carnage.", setting: "Mordheim", author: "Kevin J Coleman", source: "Town Cryer #12" },
  { id: "the_hunters_become_the_hunted", title: "The Hunters Become The Hunted", description: "Similar to Surprise Attack.", setting: "Lustria", author: "Lustria Development Team", source: "Town Cryer #13" },
  { id: "lost_temple_of_the_slann", title: "Lost Temple Of The Slann", description: "Similar to Wizard's Mansion.", setting: "Lustria", author: "Lustria Development Team", source: "Town Cryer #13" },
  { id: "the_sword_of_the_herald", title: "The Sword of the Herald", description: "Multiplayer scenario involving a mean sword, huge chunks of Wyrdstone & those ever-popular random zombies.", setting: "Mordheim", author: "Jeff Hogg", source: "Town Cryer #13" },
  { id: "finders_keepers", title: "Finders Keepers", description: "Run the length of the table, grab the Wyrdstone & run back again while trying not to die. Designed for mounted warriors but doesn't have to be.", setting: "Mordheim", author: "Roger Latham", source: "Town Cryer #14" },
  { id: "mule_train", title: "Mule Train", description: "The good guys try to lead the mule train along a country road while the bad guys try to steal them.", setting: "Mordheim", author: "Robert J Walker", source: "Town Cryer #14" },
  { id: "death_in_the_mists", title: "Death in the Mists", description: "Visibility reduced to 2D6\". Warriors might get lost.", setting: "Albion", author: "Nicodemus Kyme", source: "Town Cryer #15" },
  { id: "gift_of_the_truthsayers", title: "Gift of the Truthsayers", description: "Scrap over a magic item with random boggy happenings.", setting: "Albion", author: "Nicodemus Kyme", source: "Town Cryer #15" },
  { id: "the_mummy", title: "The Mummy", description: "Hidden Treasure except warbands look for the stash of a mummy while its scary original owner plus friends have their say.", setting: "Mordheim", author: "Rob Houdek", source: "Town Cryer #15" },
  { id: "the_ogham_stones", title: "The Ogham Stones", description: "Enhance powers for spell-casters with Truthsayers & Dark Emissaries tagging along for good measure.", setting: "Albion", author: "Nicodemus Kyme", source: "Town Cryer #15" },
  { id: "haunted_treasure", title: "Haunted Treasure", description: "Serious treasure guarded by equally serious Banshee.", setting: "Mordheim", author: "Michael Reuvers", source: "Town Cryer #18" },
  { id: "a_night_in_the_graveyard", title: "A Night In The Graveyard", description: "Warbands compete to plunder a dead man's grave while his restless spirit attempts to stop them.", setting: "Mordheim", author: "Jason \"Teacher Guy\" Kahler", source: "Town Cryer #19" },
  { id: "bar_room_brawl", title: "Bar Room Brawl", description: "A bar room brawl. Players start with 3 warriors in bar with more arriving during battle.", setting: "Mordheim", author: "Jason \"Teacher Guy\" Kahler", source: "Town Cryer #19" },
  { id: "defend_the_oasis", title: "Defend the Oasis", description: "Attackers must get more men within 6\" of a well than the defenders. Defenders must cause a rout test.", setting: "Khemri", author: "Khemri Development Team", source: "Town Cryer #19" },
  { id: "tomb_raid", title: "Tomb Raid", description: "As Defend The Tomb except the chest begins in the middle of the complex while both warbands begin at the edges.", setting: "Khemri", author: "Khemri Development Team", source: "Town Cryer #19" },
  { id: "protect_the_prince", title: "Protect the Prince", description: "Protect the Merchant's son.", setting: "Khemri", author: "Khemri Development Team", source: "Town Cryer #19" },
  { id: "burn_the_witches", title: "Burn the Witches", description: "Set in a huge temple which burns to the ground during the battle. Defender's Heroes must carry three relics from the temple. Attackers must stop them.", setting: "Mordheim", author: "Nicodemus Kyme", source: "Town Cryer #20" },
  { id: "one_man_s_rescue_is_another_man_s_kidnap", title: "One Man's Rescue is Another Man's Kidnap", description: "A prisoner is being guarded within one of several tents. The attacker must find the prisoner by entering the correct tent and then escort him from the table.", setting: "Khemri", author: "Khemri Development Team", source: "Town Cryer #20" },
  { id: "the_gauntlet", title: "The Gauntlet", description: "Classic Indiana Jones stuff. Warbands race along trap-laden corridors towards a great treasure. For 2+ warbands.", setting: "Mordheim", author: "Erik Johnson", source: "Town Cryer #21" },
  { id: "assault_on_the_rock", title: "Assault on the Rock", description: "Warbands infiltrate the Sisters' rock and attempt to steal a magical tome.", setting: "Mordheim", author: "Grayson Gaudreault", source: "Town Cryer #22" },
  { id: "in_the_dead_of_the_night", title: "In The Dead Of The Night", description: "Set in Mordheim's Cemetery of Saint Voller. Graveyard battle with Undead warband, half of which is unavailable, as the defenders.", setting: "Mordheim", author: "Space McQuirk & Chris Blair", source: "Town Cryer #22" },
  { id: "a_stroll_in_the_garden", title: "A Stroll In The Garden", description: "Skirmish set in Mordheim's Steinhardt Memorial Gardens. Warriors within 2\" of a tree or bush receive hits from the chaos-wracked foliage.", setting: "Mordheim", author: "Anonymous", source: "Town Cryer #23" },
  { id: "the_bodyguards", title: "The Bodyguards", description: "Town Cryer edit of \"Now Keep Me Safe, You Hear!?\"", setting: "Mordheim", author: "Anonymous", source: "Town Cryer #23" },
  { id: "blood_hunt", title: "Blood Hunt", description: "Clashing warbands gain the help of a Dramatis Personae, most likely Johann The Knife & Marriana Chevaux, free of charge.", setting: "Mordheim", author: "Mark Havener, et al.", source: "Town Cryer #25" },
  { id: "bounty_hunting", title: "Bounty Hunting", description: "An Empire In Flames scenario. Warbands attempt to round up a gang of bandits who are holed up in a remote hideout building.", setting: "The Empire", author: "Mark Havener, et al.", source: "Town Cryer #25" },
  { id: "down_at_the_docks", title: "Down At The Docks", description: "Warbands must attempt to gain cargo crates from smugglers' ship by carrying them off.", setting: "Mordheim", author: "Mark Havener, et al.", source: "Town Cryer #25" },
  { id: "lost_in_the_bogs", title: "Lost In The Bogs", description: "An Empire In Flames scenario. Highest rated warband is lost & must be deployed spread out.", setting: "The Empire", author: "Mark Havener, et al.", source: "Town Cryer #25" },
  { id: "stagecoash_ambush", title: "Stagecoash Ambush", description: "An Empire In Flames scenario. Defenders on horseback must protect a stagecoach from mounted attackers.", setting: "The Empire", author: "Mark Havener, et al.", source: "Town Cryer #25" },
  { id: "the_item_lost", title: "The Item Lost", description: "Nicodemus joins one warband in an attempt to retrieve a magic wand. Naturally the other warbands would like the wand for themselves.", setting: "Mordheim", author: "Mark Havener, et al.", source: "Town Cryer #25" },
  { id: "the_thing_in_the_woods", title: "The Thing In The Woods", description: "An Empire In Flames scenario. At least 1/2 the terrain is spooky fear-inducing woods.", setting: "The Empire", author: "Mark Havener, et al.", source: "Town Cryer #25" },
  { id: "gathering_of_the_horde", title: "Gathering of the Horde", description: "Massive multi-warband gang fight based upon the \"Gangs Of New York\" film, complete with special rules for horde fighting.", setting: "Mordheim", author: "Nicodemus Kyme", source: "Town Cryer #26" },
  { id: "the_watchers", title: "The Watchers", description: "Warbands attempt to gather random treasures from the SE quarter of Mordheim (right next to where the comet landed).", setting: "Mordheim", author: "Mark Havener, et al.", source: "Town Cryer #26" },
  { id: "the_frenzied_mob", title: "The Frenzied Mob", description: "An Empire In Flames scenario. Warbands attempt to loot a village consisting of D3+1 buildings. Each building is staunchly defended by D3+1 frenzied villagers.", setting: "The Empire", author: "Anonymous", source: "Town Cryer #27" },
  { id: "encampment_raid", title: "Encampment Raid", description: "Attackers attempt to take the defenders' camp. Plays as Defend The Find except the defenders have a number of advantages due to being on home turf.", setting: "The Empire", author: "Anonymous", source: "Town Cryer #28" },
  { id: "the_rat_s_lair", title: "The Rat's Lair", description: "Designed for several warbands to ally against a pack of Skaven run by a moderator. The warbands descend into an ingenious multi-leveled underground lair.", setting: "Mordheim", author: "Aaron Ishmael", source: "Town Cryer #28" },
  { id: "upon_the_eerie_downs", title: "Upon the Eerie Downs", description: "A sombre and mysterious place, the Eerie Downs holds a palpable dread for the folk of the Mark.", setting: "The Empire", author: "Nick Kyme", source: "Fanatic Magazine #1" },
  { id: "battle_for_the_farm", title: "Battle for the Farm", description: "There are many farmsteads around Ostermark. Mercenaries and brigands are drawn to them like moths to the flame.", setting: "The Empire", author: "Nick Kyme", source: "Fanatic Magazine #1" },
  { id: "blood_on_the_pasturelands", title: "Blood on the Pasturelands", description: "Rival warbands attempt to rustle some horses from a pasture. The frightened horses run randomly and need taming once caught. They are defended by six Outriders.", setting: "The Empire", author: "Nick Kyme", source: "Fanatic Magazine #3" },
  { id: "through_black_fire_pass", title: "Through Black Fire Pass", description: "One warband ambushes another as they make their way along the treacherous trade route.", setting: "The Empire", author: "Nick Kyme", source: "Fanatic Magazine #3" },
  { id: "brigands_in_the_pasturelands", title: "Brigands in the Pasturelands", description: "One warband attempts to hunt down the other, a lawless band of brigands hiding out in the forest.", setting: "The Empire", author: "Nick Kyme", source: "Fanatic Magazine #4" },
  { id: "the_watchtower", title: "The Watchtower", description: "Half of the defending warband starts on or near a well-defended central tower (with special rules to reflect this).", setting: "The Empire", author: "Nick Kyme", source: "Fanatic Magazine #4" },
  { id: "wolf_hunt", title: "Wolf Hunt!", description: "Both warbands have been offered a reward to kill a pack of troublesome wolves.", setting: "The Empire", author: "Nick Kyme", source: "Fanatic Magazine #6" },
  { id: "protect_hornsby_s_ferry", title: "Protect Hornsby's Ferry!", description: "Defenders must protect a boat & pull-rope style river ferry-crossing from sabotage. Attackers must sabotage it.", setting: "The Empire", author: "Mark Havener", source: "Fanatic Magazine #7" },
  { id: "stop_thief", title: "Stop Thief!", description: "Defenders must protect Halfling Thief HS (featured in this issue) from attacking warband.", setting: "The Empire", author: "Mark Havener", source: "Fanatic Magazine #7" },
  { id: "hunt_the_heretic", title: "Hunt the Heretic", description: "Four members of the defenders' warband attempt to protect a tooled-up Warlock HS from the attackers plus an accompanying Witch Hunter Captain.", setting: "The Empire", author: "Nick Kyme", source: "Fanatic Magazine #9" },
  { id: "river_watch", title: "River Watch", description: "Attackers at the south side must smuggle some loot across a east-west flowing river at night and get 25% of their band off the north edge.", setting: "The Empire", author: "Nick Kyme", source: "Fanatic Magazine #9" },
  { id: "night_of_the_dead", title: "Night Of The Dead", description: "Warband members must venture to the centre of the board, grab a Wyrdstone shard and escape from the table.", setting: "Mordheim", author: "Andy Tabor", source: "Fanatic Online" },
  { id: "happy_harpy_hunting_grounds", title: "Happy Harpy Hunting Grounds", description: "A group of 3 Harpies have nested in one of the tall buildings and their scavenging and attacks on unfortunate warbands has ensured a sizable stash of valuables.", setting: "Mordheim", author: "Chris Van Tigem", source: "Fanatic Online" },
  { id: "round_up_at_the_mordheim_corral", title: "Round-up at the Mordheim Corral", description: "Two to four wild boars have eaten a merchant's Wyrdstone. Warbands must kill randomly moving and aggressive boars to recover it. Optional suggestion of using mutations.", setting: "Mordheim", author: "Andy Tabor", source: "Fanatic Online" },
  { id: "the_recipe", title: "The Recipe", description: "Warbands must attempt to abduct an esteemed pie-maker who is being stoutly defended by his ballistically adept bodyguard.", setting: "Mordheim", author: "Mark Havener", source: "Fanatic Online" },
  { id: "ambush_archive_pestilen", title: "Ambush", description: "Some more devious gangs use the element of surprise as a safer alternative to a drawn out battle of attrition. These gangs are often smaller than their rivals and use the surprise to their advantage.", setting: "Mordheim", author: "Andrew \"Boss Orc\"", source: "Archive Pestilen" },
  { id: "ambush_archive_pestilen_michael_reuvers", title: "Ambush", description: "One warband is on the way back to their encampment with the wyrdstone they found in the ruins when suddenly they are surrounded.", setting: "Mordheim", author: "Michael Reuvers", source: "Archive Pestilen" },
  { id: "breakthrough_archive_pestilen", title: "Breakthrough", description: "Warbands must get half their models off opposite edge.", setting: "Mordheim", author: "Andrew \"Boss Orc\"", source: "Archive Pestilen" },
  { id: "defend_the_village", title: "Defend the Village!", description: "The Magnificent Seven without the cowboy hats.", setting: "The Empire", author: "Mark \"Rinku\" Dewis", source: "Archive Pestilen" },
  { id: "don_t_wake_the_giant", title: "Don't Wake the Giant", description: "Two warbands fight for the giant's goodies while trying not to wake him.", setting: "Mordheim", author: "David Gitchel", source: "Archive Pestilen" },
  { id: "grudge_match", title: "Grudge Match", description: "Honorable duel between two rival heroes, watched by their warbands and with a serious chance of crowd trouble breaking out.", setting: "Mordheim", author: "Mark \"rinku\" Dewis", source: "Archive Pestilen" },
  { id: "haunted_treasure_archive_pestilen", title: "Haunted Treasure", description: "There is a rumor that a treasure of unimaginable wealth lies in the ruins of a old house. Unfortunately, it is also rumored that the treasure is guarded by evil spirit whose howl is so terrible it will make you go mad. Two rival warbands have heard about this house and have come to loot the treasure, if they can.", setting: "Mordheim", author: "Michael Reuvers", source: "Archive Pestilen" },
  { id: "it_s_all_mine", title: "It's all MINE!!", description: "Attackers blow up a mine using gunpowder rules from Archive Pestilens (shamefully not described in the magazine) amid some random zombie shenanigans.", setting: "Mordheim", author: "Paul Smith", source: "Archive Pestilen" },
  { id: "raid", title: "Raid", description: "Attack on warband's camp. Defender in centre, attacker on edges.", setting: "Mordheim", author: "Andrew \"Boss Orc\"", source: "Archive Pestilen" },
  { id: "raids", title: "Raids", description: "Bad warband vs. townsfolk; Raid a village for loot & slaves.", setting: "The Empire", author: "Christian Ellegaard", source: "Archive Pestilen" },
  { id: "rawhide", title: "Rawhide", description: "Get a wagon train across the board using wagon rules from Wyrdstone Archive while your opponent tries to stop you.", setting: "The Empire", author: "Paul Smith", source: "Archive Pestilen" },
  { id: "rescue", title: "Rescue", description: "Rescue captive warrior. Defender in centre, attacker on edges.", setting: "Mordheim", author: "Andrew \"Boss Orc\"", source: "Archive Pestilen" },
  { id: "romero_s_pride", title: "Romero's Pride", description: "A variation on the random zombie invasion theme.", setting: "Mordheim", author: "Paul Smith, Lex & Donato", source: "Archive Pestilen" },
  { id: "scourge_and_purge_archive_pestilen", title: "Scourge and Purge", description: "(no description given)", setting: "Mordheim", author: "Donato Ranzato", source: "Archive Pestilen" },
  { id: "scripts_of_sigmar", title: "Scripts of Sigmar", description: "Witch Hunters vs. Sisters of Sigmar. Two linked scenarios involving burgling the Sisters' Abbey.", setting: "Mordheim", author: "Paul Smith", source: "Archive Pestilen" },
  { id: "the_battle_at_koleshire_keep", title: "The Battle At Koleshire Keep", description: "Skirmish over a keep.", setting: "The Empire", author: "Baby Cindi", source: "Archive Pestilen" },
  { id: "the_caravan_archive_pestilen", title: "The Caravan", description: "Guard or plunder a caravan of gold before it gets to the other side.", setting: "Mordheim", author: "Unknown", source: "Archive Pestilen" },
  { id: "the_forbidden_square", title: "The Forbidden Square", description: "(no description given)", setting: "Mordheim", author: "Christian Ellegaard", source: "Archive Pestilen" },
  { id: "the_restless_dead", title: "The Restless Dead", description: "Random zombies invade the table, attacking both players.", setting: "Mordheim", author: "Tom Webster-Deakin", source: "Archive Pestilen" },
  { id: "the_square_of_the_snake", title: "The Square Of The Snake", description: "Four player scenario. Each player must take out his randomly specified enemy.", setting: "Mordheim", author: "Christian Ellegaard", source: "Archive Pestilen" },
  { id: "the_wizard_s_tower", title: "The Wizard's Tower", description: "Your warband is peacefully making their way through the city to a Wyrdstone deposit when they are set upon by a rival warband. They have no choice but to fight their way through them to get to the Wyrdstone.", setting: "Mordheim", author: "Christian Ellegaard", source: "Archive Pestilen" },
  { id: "mordheim_s_burning", title: "Mordheim's Burning", description: "This scenario is set at the end of Mordheim's existence, and provides a very fitting ending to a campaign.", setting: "Mordheim", author: "Rowan Coupland", source: "Rynn Tyrr" },
];

/** Ids of the nine scenarios whose source is the original Mordheim Rulebook, in rulebook order. */
export const CORE_RULEBOOK_SCENARIO_IDS: string[] = [
  "defend_the_find",
  "skirmish",
  "wyrdstone_hunt",
  "breakthrough",
  "street_fight",
  "chance_encounter",
  "hidden_treasure",
  "occupy",
  "surprise_attack"
];

export function findScenario(id: string): ScenarioSummary | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
