// Campaign-phase rules that the scraped warband templates only carry as prose, written as data the
// resolvers can read: who never gains experience, who advances at half rate, who may never be
// promoted, injury-roll exceptions, upkeep for henchmen, exploration and income modifiers, hired
// sword and equipment restrictions, roster relations, and the data corrections found in the
// 2026-09-05 audit (docs/WARBAND-RULES-GAPS.md). Kept apart from the templates so the scrape stays
// a faithful copy of the source and every judgement lives here with its reason.
//
// Everything here is a *suggestion* the app makes with the rule quoted; where a player can act
// against it (an override with a reason) the screens say so.

import type { SkillCategory } from "../../types";
import type { StatKey } from "../../types/common";

export type EquipmentBan =
  | "armour" // no body armour or shields (helmets allowed unless "helmets" is also listed)
  | "heavyArmour"
  | "helmets"
  | "missile" // no missile weapons of any kind
  | "missileExceptThrown"
  | "blackPowder"
  | "poison"
  | "onlyBlackPowderMissiles" // ranged weapons must be black powder
  | "allEquipment";

export interface RosterRelation {
  /** Never more of this unit than the combined count of these units (times `ratio`, default 1). */
  noMoreThan?: { unitIds: string[]; ratio?: number; label: string };
  /** Only allowed while the warband has at least one of these units. */
  onlyWith?: { unitIds: string[]; label: string };
  /** Never alongside any of these units. */
  exclusiveWith?: { unitIds: string[]; label: string };
  /** Does not count towards the warband's maximum size. */
  outsideMaxModels?: boolean;
}

export interface InjuryException {
  /** D6 results on which the model dies (or leaves); default is 1-2. Empty means the unit never rolls. */
  deadOn: number[];
  /** What the bad result means: "dead", "leaves", "banished". */
  label: string;
  /** The rule, quoted or paraphrased, shown next to the dice. */
  note: string;
}

export interface UnitCampaignRules {
  /** Animals, undead, daemons and constructs: no +1 for surviving, no underdog bonus. */
  gainsExperience?: false;
  /** Ogres: twice the experience per advance box. */
  advanceRate?: "half";
  /** "The lad's got talent" restrictions. */
  promotion?: { never: true; note: string } | { tables: SkillCategory[]; note: string };
  /** Skills the unit starts with (added on recruitment). */
  startingSkillIds?: string[];
  /** Henchman injury exceptions; heroes still roll D66. */
  injury?: InjuryException;
  /** Gold owed after every battle, like a hired sword's upkeep. */
  upkeep?: { gold: number; note: string };
  /** Rated as a large creature (20 points) even though no rule is named "Large". */
  large?: boolean;
  /** Characteristic bonuses applied when the unit is hired ("Marksmen have +1 BS"). */
  statBonus?: Partial<Record<StatKey, number>>;
  /** May never be the leader (Leadership is not offered for rout checks and succession). */
  neverLeads?: boolean;
  /** Does not receive the warband's race traits (an Informer is not a Dwarf). */
  excludeRaceTraits?: boolean;
  /** How each model counts for the wyrdstone income chart (default 1); for a group, per model. */
  incomeCountsAs?: number;
  /** The whole group counts as this many models for income (Snotling mobs count as one). */
  groupIncomeCountsAs?: number;
  /** This hero gives no exploration die (Lazy). */
  noExplorationDie?: boolean;
  /** This hero may not search for rare items. */
  noRareSearch?: boolean;
  equipmentBans?: EquipmentBan[];
  relation?: RosterRelation;
  /** Which racial maximum row caps this unit (RACIAL_MAXIMUMS profile name). */
  racialProfile?: string;
}

export interface ExplorationRules {
  extraShards?: number;
  extraDice?: number;
  /** The extra die applies even when no hero survived (Snotlings' Scavengers). */
  extraDiceWithoutHeroes?: boolean;
  /** Gold crowns per enemy put out of action (Grave Goods). */
  goldPerEnemyOut?: number;
  /** When a unit of this type is in the warband, roll two dice for it and keep one. */
  rollTwoKeepOneWith?: string;
  note: string;
}

export interface IncomeRules {
  /** Shift the size band this many columns (-1 = one band smaller, more gold). */
  bandShift?: number;
  /** Only when this unit is present (Halfling Cook). */
  bandShiftWith?: string;
  /** Multiply the counted size (Snotlings: 0.5, rounded up). */
  sizeFactor?: number;
  note: string;
}

export interface HiredSwordRules {
  /** "none": no hired swords at all. Otherwise ids of the only hired swords allowed. */
  allow?: "none" | string[];
  /** Hired sword ids never allowed. */
  deny?: string[];
  /** Hired swords whose name or entry names one of these races are refused ("elf"). */
  denyKeywords?: string[];
  note: string;
}

export interface WarbandCampaignRules {
  exploration?: ExplorationRules;
  income?: IncomeRules;
  /** Multiply the rating (Snotlings 0.5). */
  ratingFactor?: number;
  /** Gold the warband is founded with instead of the campaign's default 500 (Marienburg 600). */
  startingGold?: number;
  /** Bonus to every rare-item search roll. */
  rareRollBonus?: number;
  hiredSwords?: HiredSwordRules;
  /** Bans that apply to every warrior of the warband. */
  equipmentBans?: EquipmentBan[];
  /** Overrides the sum of hero upper bounds where slots are shared. */
  heroCapacity?: number;
  notes?: string[];
}

// ---------------------------------------------------------------------------------------------
// Per-unit rules
// ---------------------------------------------------------------------------------------------

const NO_XP: UnitCampaignRules = { gainsExperience: false };
const ANIMAL: UnitCampaignRules = { gainsExperience: false, promotion: { never: true, note: "Animals are never promoted." } };
const UNDEAD_HENCHMAN: UnitCampaignRules = { gainsExperience: false, promotion: { never: true, note: "The dead do not learn." } };
const OGRE: UnitCampaignRules = {
  advanceRate: "half",
  large: true,
  incomeCountsAs: 2,
  promotion: { tables: ["combat", "strength"], note: "Ogres may only take Combat and Strength skills." },
};
const TROLL: UnitCampaignRules = {
  gainsExperience: false,
  promotion: { never: true, note: "Trolls are never promoted." },
  injury: { deadOn: [], label: "dead", note: "Trolls regenerate: no injury roll is made for a Troll taken out of action." },
  upkeep: { gold: 15, note: "Always Hungry: 15 gc after every battle, or the Troll wanders off." },
};
const SLAYER_BANS: EquipmentBan[] = ["armour", "helmets", "missileExceptThrown"];

export const UNIT_RULES: Record<string, UnitCampaignRules> = {
  // Core
  mercenaries_reikland_marksmen: { statBonus: { BS: 1 } },
  skaven_giant_rats: ANIMAL,
  skaven_rat_ogre: { ...ANIMAL, large: true },
  undead_dire_wolves: ANIMAL,
  undead_zombies: UNDEAD_HENCHMAN,
  witch_hunters_flagellants: { neverLeads: true, equipmentBans: ["missile"] },
  witch_hunters_war_hounds: ANIMAL,
  // 1a
  averlander_halfling_scouts: { promotion: { tables: ["combat", "shooting", "speed", "academic"], note: "A promoted Halfling Scout may not take Strength skills." } },
  beastmen_ungor: { promotion: { never: true, note: "Lowest of the Low: Ungors are never promoted; roll again." } },
  beastmen_warhounds_of_chaos: ANIMAL,
  beastmen_minotaur: { large: true, promotion: { never: true, note: "The Minotaur gains experience but is never promoted; roll again." } },
  carnival_of_chaos_plague_bearers: { ...NO_XP, injury: { deadOn: [1, 2, 3], label: "banished", note: "Daemonic Instability: on a 1-3 the daemon is banished instead of an injury roll." } },
  carnival_of_chaos_nurglings: { ...NO_XP, injury: { deadOn: [1, 2, 3], label: "banished", note: "Daemonic Instability: on a 1-3 the swarm is banished." } },
  carnival_of_chaos_plague_cart: NO_XP,
  carnival_of_chaos_brutes: { startingSkillIds: ["strongman"] },
  dwarf_treasure_hunters_troll_slayers: { equipmentBans: SLAYER_BANS },
  kislevites_trained_bear: { ...ANIMAL, large: true, relation: { onlyWith: { unitIds: ["kislevites_bear_tamer"], label: "a Bear Tamer" } } },
  orc_mob_goblin_warriors: {
    promotion: { never: true, note: "Runts: a Goblin who rolls The lad's got talent is killed by the Orcs; roll again." },
    relation: { noMoreThan: { unitIds: ["orc_mob_boss", "orc_mob_shaman", "orc_mob_big_uns", "orc_mob_orc_boyz"], ratio: 2, label: "two Goblins per Orc" } },
  },
  orc_mob_cave_squigs: { ...ANIMAL, relation: { noMoreThan: { unitIds: ["orc_mob_goblin_warriors"], label: "the Goblins" } } },
  orc_mob_troll: TROLL,
  ostlander_ruffians: { neverLeads: true, equipmentBans: ["missile"] },
  ostlander_priest_of_taal: { equipmentBans: ["heavyArmour"] },
  ostlander_ogre: OGRE,
  // 1b
  arabian_tomb_raiders_slave: { promotion: { never: true, note: "Life of Slavery: a slave who rolls The lad's got talent is executed; roll again." } },
  black_orcs_orc_shoota: { relation: { noMoreThan: { unitIds: ["black_orcs_orc_boy"], label: "the Orc Boyz" } } },
  black_orcs_orc_nutta: { neverLeads: true, promotion: { tables: ["combat", "shooting", "strength", "speed"], note: "Nuttaz may not take Academic skills." } },
  black_orcs_troll: { ...TROLL, upkeep: { gold: 20, note: "Always Hungry: 20 gc after every battle, or the Troll counts as two models for income." } },
  bretonnian_knights_squire: { relation: { noMoreThan: { unitIds: ["bretonnian_knights_questing_knight", "bretonnian_knights_knight_errant"], label: "the Knights" } } },
  dark_elves_cold_one_beasthound: { ...ANIMAL, relation: { onlyWith: { unitIds: ["dark_elves_beastmaster"], label: "a Beastmaster" } } },
  dwarf_rangers_troll_slayer: { equipmentBans: SLAYER_BANS },
  forest_goblins_gigantic_spider: { ...ANIMAL, large: true },
  hochland_bandits_gutterscum: NO_XP,
  horned_hunters_warhound: ANIMAL,
  lizardmen_saurus_totem_warrior: { equipmentBans: ["missile"], promotion: { tables: ["combat", "strength", "speed", "warband-unique"], note: "Saurus may not take Academic skills or missile weapons." } },
  lizardmen_saurus_brave: {
    equipmentBans: ["missile"],
    promotion: { tables: ["combat", "strength", "speed", "warband-unique"], note: "Saurus may not take Academic skills." },
    relation: { noMoreThan: { unitIds: ["lizardmen_skink_brave"], label: "the Skink Braves" } },
  },
  lizardmen_kroxigor: { ...ANIMAL, large: true },
  norse_wulfen: { neverLeads: true },
  norse_wolf: { ...ANIMAL, relation: { onlyWith: { unitIds: ["norse_wulfen"], label: "a Wulfen" } } },
  pirates_swabbie: { ...NO_XP, promotion: { never: true, note: "Swabbies are rabble and never become heroes." }, relation: { noMoreThan: { unitIds: ["pirates_crew"], label: "the Crew" } } },
  pit_fighters_troll_slayer: { equipmentBans: SLAYER_BANS },
  pit_fighters_ogre: OGRE,
  shadow_warriors_shadow_weaver: {},
  skaven_pestilens_giant_rat: ANIMAL,
  skaven_pestilens_rat_ogre: { ...ANIMAL, large: true },
  tomb_guardians_liche_priest: { equipmentBans: ["armour", "helmets"] },
  tomb_guardians_skeleton_warrior: UNDEAD_HENCHMAN,
  tomb_guardians_tomb_scorpion: { ...ANIMAL },
  // 1c
  battle_monks_raging_peasants: { ...NO_XP, promotion: { never: true, note: "Raging Peasants are a mob, never promoted." } },
  black_dwarfs_informers: { excludeRaceTraits: true, promotion: { never: true, note: "Informers are never made heroes; roll again." } },
  bretonnian_knight_errant: { equipmentBans: ["helmets"] },
  bretonnian_battle_pilgrims: { promotion: { never: true, note: "Low Caste: Pilgrims are never knighted; roll again." } },
  bretonnian_bowmen: { promotion: { never: true, note: "Low Caste: Bowmen are never knighted; roll again." } },
  court_of_pleasures_danseuse: { equipmentBans: ["armour", "helmets"] },
  court_of_pleasures_chaos_hounds: ANIMAL,
  court_of_pleasures_wretches: { promotion: { never: true, note: "Slaves to Darkness: a Wretch who rolls The lad's got talent suffers a serious injury instead." } },
  cursed_cavalcade_captured_thrall: { ...NO_XP, promotion: { never: true, note: "Captured Thralls are never promoted." }, relation: { outsideMaxModels: true } },
  cursed_cavalcade_great_bear: { ...ANIMAL, large: true },
  cursed_cavalcade_wild_beasts: ANIMAL,
  cursed_cavalcade_fighting_ape: ANIMAL,
  cursed_cavalcade_companions: { startingSkillIds: ["expert_swordsman"] },
  maneaters_captain: { ...OGRE, promotion: undefined },
  maneaters_youngbloods: { advanceRate: "half", incomeCountsAs: 2, promotion: OGRE.promotion },
  maneaters_mountain_guide: { ...OGRE, neverLeads: true, promotion: undefined },
  maneaters_bulls: OGRE,
  maneaters_half_growns: { advanceRate: "half", incomeCountsAs: 2, promotion: OGRE.promotion },
  maneaters_sabretusks: { ...ANIMAL, relation: { onlyWith: { unitIds: ["maneaters_mountain_guide"], label: "a Mountain Guide" } } },
  marauders_warhounds_of_chaos: ANIMAL,
  marauders_spawn_of_chaos: { ...NO_XP, large: true, promotion: { never: true, note: "A Spawn has no mind left to promote." } },
  merchant_knights_vanguard: { neverLeads: true },
  merchant_magician: { neverLeads: true },
  merchant_blackguards: { neverLeads: true, promotion: { never: true, note: "Unreliable Hirelings: Blackguards never become heroes; roll again." } },
  night_goblins_fanatics: { ...NO_XP, promotion: { never: true, note: "Fanatics are never promoted." } },
  night_goblins_cave_squigs: { ...ANIMAL, relation: { noMoreThan: { unitIds: ["night_goblins_warriors"], label: "the Night Goblins" } } },
  night_goblins_troll: TROLL,
  night_goblins_snotling_mob: { promotion: { never: true, note: "Snotling Mobs are never promoted." }, groupIncomeCountsAs: 1 },
  night_goblins_web_warriors: { promotion: { tables: ["combat", "shooting", "speed", "warband-unique"], note: "Promoted Night Goblin henchmen may not take Strength skills." } },
  night_goblins_web_cave_squigs: { ...ANIMAL, relation: { noMoreThan: { unitIds: ["night_goblins_web_warriors"], label: "the Night Goblin Warriors" } } },
  night_goblins_web_snotlings: { promotion: { never: true, note: "Snotlings are never promoted." }, groupIncomeCountsAs: 1 },
  night_goblins_web_great_squig: { ...ANIMAL, large: true, relation: { exclusiveWith: { unitIds: ["night_goblins_web_troll"], label: "a Troll (Great Squig or Troll, not both)" } } },
  night_goblins_web_troll: { ...TROLL, relation: { exclusiveWith: { unitIds: ["night_goblins_web_great_squig"], label: "a Great Squig (Great Squig or Troll, not both)" } } },
  restless_dead_grave_guards: { noRareSearch: true },
  restless_dead_zombies: UNDEAD_HENCHMAN,
  restless_dead_skeletons: UNDEAD_HENCHMAN,
  restless_dead_wights: { promotion: { tables: ["combat", "strength"], note: "A promoted Wight takes Combat and Strength skills only and may not search for rare items." }, racialProfile: "Grave Guard (Restless Dead)" },
  restless_dead_scarecrows: UNDEAD_HENCHMAN,
  sons_of_hashut_hobgoblins: {
    excludeRaceTraits: true,
    promotion: { never: true, note: "Nobody cares about them: Hobgoblins never become heroes; roll again." },
    injury: { deadOn: [1, 2, 3], label: "leaves", note: "Skinny: a Hobgoblin taken out of action slinks off on a 1-3." },
  },
  // 2a
  dreamwalkers_priest_of_morr: { equipmentBans: ["armour", "helmets", "missile"], neverLeads: false },
  druchii_slavehounds: { ...ANIMAL, relation: { onlyWith: { unitIds: ["druchii_beastmaster"], label: "a Beastmaster" } } },
  dwarf_slayer_cult_rememberer_hero: { neverLeads: true },
  dwarf_slayer_cult_axe_hurlers: { equipmentBans: ["armour", "helmets"] },
  dwarf_slayer_cult_stubbles: { equipmentBans: SLAYER_BANS },
  dwarf_slayer_cult_troll_slayers: { equipmentBans: SLAYER_BANS },
  halflings_scouts: { promotion: { tables: ["combat", "shooting", "speed", "academic"], note: "Halfling Scouts may not take Strength skills." } },
  halflings_piggies: ANIMAL,
  halflings_village_ogre_henchman: OGRE,
  masters_of_horror_wolfman: { equipmentBans: ["allEquipment"], racialProfile: "Wolfman (Masters of Horror)" },
  masters_of_horror_zombies: UNDEAD_HENCHMAN,
  masters_of_horror_flesh_construct: { promotion: { never: true, note: "A Flesh Construct is never promoted." }, large: false },
  mazzalupo_black_sheep: ANIMAL,
  necrarchs_necrarch_vampire: { racialProfile: "Necrarch Vampire" },
  necrarchs_skeletal_warriors: UNDEAD_HENCHMAN,
  necrarchs_zombies: UNDEAD_HENCHMAN,
  necrarchs_abomination: { ...NO_XP, large: true, injury: { deadOn: [], label: "dead", note: "Powered: the Abomination ignores injury rolls; the opponent gains a shard and one is needed to reanimate it." } },
  nipponese_shinobi_hero: { neverLeads: true },
  ogre_hunting_party_ogre_hunter: { ...OGRE, noExplorationDie: true, noRareSearch: true, racialProfile: "Ogre", promotion: undefined },
  ogre_hunting_party_trappers: { racialProfile: "Goblin" },
  ogre_hunting_party_sabre_baiter: { racialProfile: "Goblin" },
  ogre_hunting_party_sabretusk_cubs: ANIMAL,
  pilgrims: { neverLeads: true, promotion: { never: true, note: "Peasants: Pilgrims never become heroes; roll again." } },
  companion_filly: { ...ANIMAL, relation: { onlyWith: { unitIds: ["dame_of_the_mare"], label: "the Dame of the Mare" } } },
  hounds: ANIMAL,
  giant_rats: ANIMAL,
  wolf_rats: ANIMAL,
  rat_ogres: { ...ANIMAL, large: true },
  snotling_shoota_team: { injury: { deadOn: [1, 2, 3], label: "dead", note: "Not-So-Tough Gits: Snotling henchmen die on a 1-3." } },
  snotling_mobs: { promotion: { never: true, note: "Snotling Mobs are never promoted." }, injury: { deadOn: [1, 2, 3], label: "dead", note: "Not-So-Tough Gits: Snotling henchmen die on a 1-3." } },
  runts: { injury: { deadOn: [1, 2, 3, 4], label: "dead", note: "Smallest of the Small: Runts die on a 1-4." } },
  companions: { neverLeads: true },
  giant_bats: { ...ANIMAL, large: true },
  pilgrims_of_the_dark_shroud: { neverLeads: true },
  wolfhounds: ANIMAL,
  restless_dead_variant_grave_guards: { noRareSearch: true },
  restless_dead_variant_zombies: UNDEAD_HENCHMAN,
  restless_dead_variant_skeletons: UNDEAD_HENCHMAN,
  restless_dead_variant_wights: { promotion: { tables: ["combat", "strength"], note: "A promoted Wight takes Combat and Strength skills only and may not search for rare items." }, racialProfile: "Grave Guard (Restless Dead)" },
  restless_dead_variant_bone_goliath: { ...NO_XP, large: true, promotion: { never: true, note: "A construct is never promoted." } },
};

// ---------------------------------------------------------------------------------------------
// Per-warband rules
// ---------------------------------------------------------------------------------------------

const DWARF_NO_ELVES: HiredSwordRules = { denyKeywords: ["elf"], note: "Dwarfs will not hire Elves." };

export const WARBAND_RULES: Record<string, WarbandCampaignRules> = {
  mercenaries_marienburg: { startingGold: 600, rareRollBonus: 1, notes: ["Marienburgers start with 600 gc and add +1 to rare-item rolls."] },
  tileans_trantios: { startingGold: 600, notes: ["Trantios: an extra 100 gc when the warband is founded."] },
  sisters_of_sigmar: { exploration: { rollTwoKeepOneWith: "sisters_of_sigmar_augur", note: "Blessed Sight: the Augur rolls two exploration dice and keeps one." } },
  witch_hunters: {},
  beastmen_raiders: { hiredSwords: { allow: "none", note: "Beastmen Raiders never hire swords." } },
  carnival_of_chaos: { hiredSwords: { allow: "none", note: "The Carnival hires nobody." } },
  dwarf_treasure_hunters: { exploration: { extraShards: 1, note: "Incomparable Miners: +1 shard of wyrdstone whenever the warband finds any." }, hiredSwords: DWARF_NO_ELVES },
  dwarf_rangers: { exploration: { extraShards: 1, note: "Incomparable Miners: +1 shard of wyrdstone whenever the warband finds any." }, hiredSwords: DWARF_NO_ELVES },
  ostlander_mercenaries: { hiredSwords: { allow: ["ogre_bodyguard"], note: "Ostlanders only hire Ogres." } },
  amazons_lustria: { hiredSwords: { allow: "none", note: "Amazons hire only Amazon hired swords, none of which are in the data." } },
  amazons_mordheim: { hiredSwords: { allow: "none", note: "Amazons hire only Amazon hired swords, none of which are in the data." } },
  dark_elves: { equipmentBans: ["blackPowder"], notes: ["Dark Elves never use black powder weapons."] },
  gunnery_school_of_nuln: { equipmentBans: ["onlyBlackPowderMissiles"], notes: ["Gunnery School warriors use no ranged weapon but black powder."] },
  hochland_bandits: { income: { bandShift: 1, note: "Foragers: sell wyrdstone as a warband one size band larger." } },
  horned_hunters: { exploration: { extraDice: 1, note: "Pathfinder: +1 exploration die (once per warband)." } },
  shadow_warriors: { equipmentBans: ["poison"], hiredSwords: { denyKeywords: ["assassin", "chaos", "dark elf", "fury", "hillman", "possessed"], note: "Shadow Warriors hire nothing chaotic and no assassins." } },
  tomb_guardians: { exploration: { extraDice: 1, note: "Home Ground: +1 exploration die." } },
  tileans_miragleans: { hiredSwords: { denyKeywords: ["skaven", "skryre"], note: "Miragleans hire no Skaven." } },
  tileans_remasens: { hiredSwords: { denyKeywords: ["dark elf"], note: "Remasens hire no Dark Elves." } },
  battle_monks_of_cathay: { hiredSwords: { allow: "none", note: "Battle Monks hire nobody." }, equipmentBans: ["armour", "helmets", "poison"], notes: ["Monks never wear armour or use poison."] },
  the_cursed_cavalcade: { hiredSwords: { allow: "none", note: "The Cavalcade hires nobody but the Crow Master, who is not in the data." } },
  maneaters: { rareRollBonus: -1, hiredSwords: { allow: ["ogre_bodyguard", "halfling_scout", "halfling_thief"], note: "Maneaters hire only Ogres and Halflings until a Dog of War opens more." } },
  grave_robbers: { exploration: { goldPerEnemyOut: 1, note: "Grave Goods: +1 gc for every enemy put out of action." } },
  halflings: { income: { bandShift: -1, bandShiftWith: "halflings_cook", note: "Master Chef: with a Cook (on a 5+) the warband sells as one size band smaller." } },
  snotlings: {
    ratingFactor: 0.5,
    income: { sizeFactor: 0.5, note: "Snotlings count as half their number (rounded up) for income." },
    exploration: { extraDice: 1, extraDiceWithoutHeroes: true, note: "Scavengers: +1 exploration die, even with no surviving hero." },
    hiredSwords: { allow: "none", note: "Too Unruly: nobody will work for Snotlings." },
  },
  sorcerous_society: { hiredSwords: { deny: ["warlock", "witch", "dark_mage", "norse_shaman"], note: "The Society hires no wizards but the High Elf Mage." } },
  dwarf_slayer_cult: { hiredSwords: DWARF_NO_ELVES, equipmentBans: ["armour", "helmets"], notes: ["Slayers wear no armour and use no missile weapons but thrown axes."] },
  druchii: { exploration: { extraShards: 1, note: "Fey Acuity: +1 shard of wyrdstone whenever the warband finds any." }, equipmentBans: ["blackPowder"] },
  outlaws_of_stirwood_forest: { heroCapacity: 5, notes: ["The Cleric shares a slot with a Champion or a Petty Thief: five heroes at most."] },
  outlaws_of_stirwood_forest_redux: { heroCapacity: 5 },
  protectorate_of_sigmar: { heroCapacity: 5, notes: ["The Huntsman replaces a Templar: five heroes at most."] },
  the_restless_dead: {},
  the_restless_dead_variant: {},
};

// ---------------------------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------------------------

const EMPTY_UNIT: UnitCampaignRules = {};
const EMPTY_WARBAND: WarbandCampaignRules = {};

export function unitRules(unitTemplateId: string | null | undefined): UnitCampaignRules {
  return (unitTemplateId && UNIT_RULES[unitTemplateId]) || EMPTY_UNIT;
}

export function warbandRules(warbandTemplateId: string | null | undefined): WarbandCampaignRules {
  return (warbandTemplateId && WARBAND_RULES[warbandTemplateId]) || EMPTY_WARBAND;
}

export function unitGainsExperience(unitTemplateId: string | null | undefined): boolean {
  return unitRules(unitTemplateId).gainsExperience !== false;
}

/** Bans that apply to this warrior: the warband's plus the unit's. */
export function equipmentBansFor(warbandTemplateId: string | null | undefined, unitTemplateId: string | null | undefined): EquipmentBan[] {
  return [...(warbandRules(warbandTemplateId).equipmentBans ?? []), ...(unitRules(unitTemplateId).equipmentBans ?? [])];
}
