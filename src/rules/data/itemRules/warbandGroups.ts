// Named groups of warband templates the equipment pages refer to ("Undead or Possessed may not",
// "Dwarfs only", "Elves may not drink Bugman's"). Keys are the words the rules use; values are the
// template ids in data/warbandTemplates. A rule may name a group key or a template id directly.

export const WARBAND_GROUPS: Record<string, string[]> = {
  undead: ["the_undead", "the_restless_dead", "the_restless_dead_variant", "tomb_guardians", "necrarchs_the_soul_stealers", "survivors_of_strigos", "masters_of_horror"],
  possessed: ["cult_of_the_possessed", "carnival_of_chaos"],
  chaos: ["cult_of_the_possessed", "carnival_of_chaos", "marauders_of_chaos", "beastmen_raiders", "black_dwarfs", "the_sons_of_hashut", "court_of_the_profane_pleasures"],
  daemons: ["carnival_of_chaos"],
  elves: ["shadow_warriors", "dark_elves", "druchii", "wood_elves_of_athel_loren"],
  darkElves: ["dark_elves", "druchii"],
  highElves: ["shadow_warriors"],
  woodElves: ["wood_elves_of_athel_loren"],
  dwarfs: ["dwarf_treasure_hunters", "dwarf_rangers", "dwarf_slayer_cult"],
  chaosDwarfs: ["black_dwarfs", "the_sons_of_hashut"],
  slayers: ["dwarf_slayer_cult"],
  skaven: ["skaven_of_clan_eshin", "skaven_of_clan_pestilens", "skaven_of_clan_moulder"],
  clanPestilens: ["skaven_of_clan_pestilens"],
  clanMoulder: ["skaven_of_clan_moulder"],
  lizardmen: ["lizardmen"],
  amazons: ["amazons_lustria", "amazons_mordheim"],
  amazonsLustria: ["amazons_lustria"],
  orcsAndGoblins: ["orc_mob", "black_orcs", "forest_goblins", "night_goblins", "night_goblins_web", "snotlings"],
  goblins: ["forest_goblins", "night_goblins", "night_goblins_web", "snotlings"],
  forestGoblins: ["forest_goblins"],
  ogres: ["maneaters", "ogre_hunting_party"],
  maneaters: ["maneaters"],
  halflings: ["mootlanders", "halflings"],
  mootlanders: ["mootlanders"],
  beastmen: ["beastmen_raiders"],
  norse: ["norse_explorers"],
  marauders: ["marauders_of_chaos"],
  middenheimers: ["mercenaries_middenheim"],
  marienburgers: ["mercenaries_marienburg"],
  kislevites: ["kislevites"],
  pirates: ["pirates"],
  sistersOfSigmar: ["sisters_of_sigmar"],
  witchHunters: ["witch_hunters"],
  /** Warrior-Priest-led lists the priest exceptions apply to. */
  priests: ["sisters_of_sigmar", "witch_hunters", "protectorate_of_sigmar"],
  shadowWarriors: ["shadow_warriors"],
  merchants: ["merchant_caravans"],
  tileans: ["tileans_miragleans", "tileans_remasens", "tileans_trantios", "mazzalupo"],
  bretonnians: ["bretonnian_knights", "bretonnian_chapel_guard", "order_of_the_mare"],
  nipponese: ["nipponese_expedition"],
  cathayans: ["battle_monks_of_cathay"],
  cursedCavalcade: ["the_cursed_cavalcade"],
  lustrianReavers: ["lustrian_reavers"],
  gunnerySchool: ["gunnery_school_of_nuln"],
  strigany: ["survivors_of_strigos"],
  outlaws: ["outlaws_of_stirwood_forest", "outlaws_of_stirwood_forest_redux", "hochland_bandits"],
  graveRobbers: ["grave_robbers"],
  sorcerousSociety: ["sorcerous_society"],
  vampireHunters: ["vampire_hunters_of_sylvania"],
  dreamwalkers: ["dreamwalkers_cult_of_morr"],
  gnoblars: ["ogre_hunting_party"],
  snotlings: ["snotlings"],
  courtOfPleasures: ["court_of_the_profane_pleasures"],
  protectorate: ["protectorate_of_sigmar"],
};

/** Does `warbandTemplateId` fall under `ref` (a group key or a template id)? */
export function warbandMatches(warbandTemplateId: string | null | undefined, ref: string): boolean {
  if (!warbandTemplateId) return false;
  if (ref === warbandTemplateId) return true;
  return WARBAND_GROUPS[ref]?.includes(warbandTemplateId) ?? false;
}

export function warbandInAny(warbandTemplateId: string | null | undefined, refs: readonly string[]): boolean {
  return refs.some((ref) => warbandMatches(warbandTemplateId, ref));
}

/** "Undead or Possessed" for a list of refs, from the key or the template id. */
export function describeWarbandRefs(refs: readonly string[]): string {
  const names = refs.map((r) => GROUP_LABELS[r] ?? r.replace(/_/g, " "));
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}

const GROUP_LABELS: Record<string, string> = {
  undead: "Undead",
  possessed: "Possessed",
  chaos: "Chaos warbands",
  daemons: "Daemons",
  elves: "Elves",
  darkElves: "Dark Elves",
  highElves: "High Elves",
  woodElves: "Wood Elves",
  dwarfs: "Dwarfs",
  chaosDwarfs: "Chaos Dwarfs",
  slayers: "Slayers",
  skaven: "Skaven",
  clanPestilens: "Clan Pestilens",
  clanMoulder: "Clan Moulder",
  lizardmen: "Lizardmen",
  amazons: "Amazons",
  amazonsLustria: "Amazons (Lustria)",
  orcsAndGoblins: "Orcs and Goblins",
  goblins: "Goblins",
  forestGoblins: "Forest Goblins",
  ogres: "Ogres",
  maneaters: "Maneaters",
  halflings: "Halflings",
  mootlanders: "Mootlanders",
  beastmen: "Beastmen",
  norse: "Norse",
  marauders: "Marauders of Chaos",
  middenheimers: "Middenheimers",
  marienburgers: "Marienburgers",
  kislevites: "Kislevites",
  pirates: "Pirates",
  sistersOfSigmar: "Sisters of Sigmar",
  witchHunters: "Witch Hunters",
  priests: "Warrior-Priests and Sisters of Sigmar",
  shadowWarriors: "Shadow Warriors",
  merchants: "Merchant Caravans",
  tileans: "Tileans",
  bretonnians: "Bretonnians",
  nipponese: "the Nipponese",
  cathayans: "Battle Monks of Cathay",
  cursedCavalcade: "the Cursed Cavalcade",
  lustrianReavers: "Lustrian Reavers",
  gunnerySchool: "the Gunnery School",
  strigany: "Strigany",
  outlaws: "Outlaws",
  graveRobbers: "Grave Robbers",
  sorcerousSociety: "the Sorcerous Society",
  vampireHunters: "Vampire Hunters",
  dreamwalkers: "Dreamwalkers",
  gnoblars: "Gnoblars",
  snotlings: "Snotlings",
  courtOfPleasures: "the Court of Profane Pleasures",
  protectorate: "the Protectorate of Sigmar",
};
