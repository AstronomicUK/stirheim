// GENERATED from reference/rules/06-scenarios.md via the scraped scenario details.
// What a scenario yields during the battle itself: the verbatim Wyrdstone section where it has one,
// and whether its rules place treasure or loot counters.
//
// KNOWN lists every scenario the catalogue carries, so a scenario that yields nothing (a Skirmish)
// is told apart from one the app has never heard of (something your group wrote). Only the first
// should have its wyrdstone and loot fields hidden; the second gets both, since the app cannot say.
//
// Regenerate rather than hand-edit: the scenario details are too large to ship to the battle sheet,
// so this is the slice of them the sheet needs.

export interface ScenarioObjectives {
  /** The scenario's own Wyrdstone rule, verbatim; null where it grants none during the game. */
  wyrdstone: string | null;
  /** Its rules place treasure or loot counters on the table. */
  treasure: boolean;
}

const OBJECTIVES: Record<string, ScenarioObjectives> = {
  a_night_in_the_graveyard: { wyrdstone: null, treasure: true },
  ambush_archive_pestilen_michael_reuvers: { wyrdstone: "The defending warband gains all the wyrdstone they were carrying at the beginning of the battle, minus the number of their own Heroes that were taken Out Of Action during the game, down to a minimum of zero. The attacking warband gains one shard of wyrdstone for each enemy Hero they take Out Of Action, up to the maximum number of shard the opposing warband was carrying at the beginning of the battle.", treasure: false },
  bar_room_brawl: { wyrdstone: null, treasure: true },
  battle_for_the_farm: { wyrdstone: null, treasure: true },
  chance_encounter: { wyrdstone: "Both warbands gain all the wyrdstone they were carrying at the beginning of the battle, minus the number of their own Heroes that were taken out of action during the game, down to a minimum of zero. In addition, they gain one extra shard of wyrdstone for each enemy Hero they take out of action, up to the maximum number of shards the opposing warband was carrying at the beginning of the battle.", treasure: false },
  defend_the_find: { wyrdstone: "One shard of wyrdstone for each Hero of either warband who is inside the objective building at the end of the game (up to a maximum of three shards per warband).", treasure: false },
  defend_the_village: { wyrdstone: null, treasure: true },
  don_t_wake_the_giant: { wyrdstone: null, treasure: true },
  finders_keepers: { wyrdstone: "Your warriors earn one shard of wyrdstone for each counter still in their possession at the end of the battle.", treasure: false },
  haunted_treasure: { wyrdstone: null, treasure: true },
  haunted_treasure_archive_pestilen: { wyrdstone: null, treasure: true },
  hidden_treasure: { wyrdstone: null, treasure: true },
  raids: { wyrdstone: null, treasure: true },
  the_battle_at_koleshire_keep: { wyrdstone: null, treasure: true },
  the_caravan_archive_pestilen: { wyrdstone: "If your warband ends the game in possession of the cargo, it may keep all of the wyrdstone. If the merchant successfully keeps the cargo, the guarding warband receives 1 shard plus D6x5 gold crowns for their trouble.", treasure: false },
  the_frenzied_mob: { wyrdstone: null, treasure: true },
  the_gauntlet: { wyrdstone: null, treasure: true },
  the_hunters_become_the_hunted: { wyrdstone: null, treasure: true },
  the_mummy: { wyrdstone: null, treasure: true },
  the_recipe: { wyrdstone: null, treasure: true },
  tomb_raid: { wyrdstone: null, treasure: true },
  treasure_hunt: { wyrdstone: "Your warriors earn one shard of wyrdstone for each counter in their possession at the end of the battle.", treasure: false },
  wyrdstone_hunt: { wyrdstone: "Your warriors earn one shard of wyrdstone for each counter still in their possession at the end of the battle. ![](/assets/images/scenario-3-7ee356af5ba18971636a5a628ad19292.jpg)", treasure: false },
};

const KNOWN = new Set<string>([
  "a_night_in_the_graveyard",
  "a_stroll_in_the_garden",
  "ambush",
  "ambush_archive_pestilen",
  "ambush_archive_pestilen_michael_reuvers",
  "assault_on_the_rock",
  "bar_room_brawl",
  "battle_for_the_farm",
  "blood_hunt",
  "blood_on_the_pasturelands",
  "bounty_hunting",
  "breakthrough",
  "breakthrough_archive_pestilen",
  "brigands_in_the_pasturelands",
  "burn_the_witches",
  "chance_encounter",
  "death_in_the_mists",
  "defend_the_find",
  "defend_the_oasis",
  "defend_the_village",
  "don_t_wake_the_giant",
  "down_at_the_docks",
  "encampment_raid",
  "finders_keepers",
  "forbidden_square",
  "gathering_of_the_horde",
  "gift_of_the_truthsayers",
  "grudge_match",
  "happy_harpy_hunting_grounds",
  "haunted_treasure",
  "haunted_treasure_archive_pestilen",
  "hidden_treasure",
  "hunt_the_heretic",
  "in_the_dead_of_the_night",
  "island_hopping",
  "it_s_all_mine",
  "jungle_skirmish_the_fog_of_war",
  "kidnapped",
  "lost_in_the_bogs",
  "lost_temple_of_the_slann",
  "monster_hunt",
  "mordheim_s_burning",
  "mule_train",
  "night_of_the_dead",
  "occupy",
  "one_man_s_rescue_is_another_man_s_kidnap",
  "protect_hornsby_s_ferry",
  "protect_the_prince",
  "raid",
  "raids",
  "rat_attack",
  "rawhide",
  "rescue",
  "river_watch",
  "romero_s_pride",
  "round_up_at_the_mordheim_corral",
  "scourge_and_purge",
  "scourge_and_purge_archive_pestilen",
  "scripts_of_sigmar",
  "skirmish",
  "stagecoash_ambush",
  "stake_out",
  "stop_thief",
  "street_brawl",
  "street_fight",
  "surprise_attack",
  "surrounded",
  "that_s_all_mine",
  "the_battle_at_koleshire_keep",
  "the_bodyguards",
  "the_caravan",
  "the_caravan_archive_pestilen",
  "the_forbidden_square",
  "the_frenzied_mob",
  "the_gauntlet",
  "the_hunters_become_the_hunted",
  "the_item_lost",
  "the_lair_of_the_snake",
  "the_lost_prince",
  "the_mummy",
  "the_night_of_the_headless_one",
  "the_ogham_stones",
  "the_pool",
  "the_rat_s_lair",
  "the_recipe",
  "the_restless_dead",
  "the_script_of_sigmar",
  "the_secrets_of_beujuntae",
  "the_square_of_the_snake",
  "the_sword_of_the_herald",
  "the_thing_in_the_woods",
  "the_watchers",
  "the_watchtower",
  "the_wizard_s_mansion",
  "the_wizard_s_tower",
  "through_black_fire_pass",
  "tomb_raid",
  "treasure_hunt",
  "upon_the_eerie_downs",
  "wolf_hunt",
  "wyrdstone_hunt",
]);

/** What this scenario yields during the battle. A scenario with no entry yields neither. */
export function scenarioObjectives(scenarioId: string | null | undefined): ScenarioObjectives {
  return (scenarioId ? OBJECTIVES[scenarioId] : undefined) ?? { wyrdstone: null, treasure: false };
}

/** Whether the catalogue carries this scenario's rules at all. */
export function scenarioIsKnown(scenarioId: string | null | undefined): boolean {
  return Boolean(scenarioId && KNOWN.has(scenarioId));
}
