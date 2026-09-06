// GENERATED from reference/rules/06-scenarios.md via the scraped scenario details.
// What a scenario yields during the battle itself: the verbatim Wyrdstone section where it has one,
// and whether its rules place treasure or loot counters. A scenario missing from this map yields
// neither — wyrdstone still comes from exploration afterwards, which is a different screen.
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

/** What this scenario yields during the battle. Unknown ids (custom scenarios) yield neither. */
export function scenarioObjectives(scenarioId: string | null | undefined): ScenarioObjectives {
  return (scenarioId ? OBJECTIVES[scenarioId] : undefined) ?? { wyrdstone: null, treasure: false };
}

/** Whether the catalogue knows this scenario at all: a custom one should not be second-guessed. */
export function scenarioIsKnown(scenarioId: string | null | undefined): boolean {
  return Boolean(scenarioId && scenarioId in OBJECTIVES);
}
