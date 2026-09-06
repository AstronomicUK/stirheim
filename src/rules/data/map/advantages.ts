// What each district of the Mordheim Campaign Map does, as structured rules the app can apply
// (the legend text itself is in districts.ts). Hired swords, items and units are named by their
// ids in the rules data; anything the legend says that the app cannot yet act on stays as text.
//
// Rules: reference/map/campaign-rules.md ("District advantages").

export interface InjuryRewrite {
  /** D66 band the rewrite applies to, inclusive. */
  min: number;
  max: number;
  /** A D6 the player must roll; the rewrite happens on this or more. Absent = automatic. */
  test?: number;
  /** What the result becomes: the 41-55 Full Recovery entry. */
  to: "full_recovery";
}

export interface DistrictEffect {
  /** Extra exploration dice ("Roll one extra dice in the Exploration Procedure"). */
  explorationDice?: number;
  /** City Hall: modify one exploration die by +1 or -1. */
  explorationModifyOne?: boolean;
  /** Rich Quarter, Clock Tower: gold and equipment found at a location are always the maximum. */
  explorationMaxFinds?: boolean;
  /** The Rock: extra gold when selling wyrdstone, as a fraction (0.2 = 20%), rounded down. */
  wyrdstoneSaleBonus?: number;
  /** Hired swords (or Dramatis Personae) hired at half their fee. */
  halfPriceHires?: string[];
  /** Items bought at half price (item ids; `prefix:` entries match every id starting so). */
  halfPriceItems?: string[];
  /** Market Square: added to the rare-item roll. */
  rareRollBonus?: number;
  /** Raven Barracks: weapons and armour sell back at their purchase price. */
  resaleAtFull?: boolean;
  /** Quayside, Memorial Gardens: the veteran pool is rolled on 3D6 for groups of this kind. */
  veteranDice?: "human" | "nonHuman";
  /** Sage's Hall: a new spell may be chosen rather than rolled. */
  chooseSpell?: boolean;
  /** The Cemetery: Undead recruits at these prices (unit id -> gc). */
  cheapRecruits?: Record<string, number>;
  /** The Cemetery, other warbands: immune to Fear; Terror counts as Fear. */
  fearImmunity?: boolean;
  /** Statue of Count Gotthard: the leader's Leadership. */
  leaderLd?: number;
  /** Serious Injury results rewritten. */
  injuryRewrites?: InjuryRewrite[];
  /** Amphitheatre: a hero Sold to the Pits wins the fight automatically. */
  pitFightAutoWin?: boolean;
  /** The Gates: a hero looking for Luthor Wolfenbaum finds him. */
  findsLuthor?: boolean;
  /** Text the app does not act on itself, shown as a reminder. */
  reminder?: string;
}

const GATE: DistrictEffect = { halfPriceHires: ["luthor_wolfenbaum"], findsLuthor: true };

export const DISTRICT_EFFECTS: Record<string, DistrictEffect> = {
  "artisan-quarter": { halfPriceItems: ["cathayan_silk_clothes", "hunting_arrows", "lantern", "net", "rope_and_hook", "superior_blackpowder"] },
  "count-steinhardts-palace": { halfPriceHires: ["freelancer"], halfPriceItems: ["riding_draft_horse", "warhorse", "wardogs"] },
  "dwarven-district": { halfPriceHires: ["dwarf_troll_slayer"], halfPriceItems: ["bugmans_ale", "gromril_armour", "gromril_weapon", "prefix:gromril_"] },
  "executioners-square": { explorationDice: 1 },
  "memorial-gardens": { veteranDice: "nonHuman" },
  "raven-barracks": { halfPriceHires: ["ogre_bodyguard"], resaleAtFull: true },
  "rich-quarter": { explorationMaxFinds: true },
  "statue-of-count-gotthard": { leaderLd: 1 },
  "temple-of-morr": { injuryRewrites: [{ min: 11, max: 15, test: 5, to: "full_recovery" }] },
  "the-cemetery": {
    cheapRecruits: { undead_zombies: 10, undead_ghouls: 30 },
    fearImmunity: true,
    reminder: "Undead warband: Zombies 10 gc and Ghouls 30 gc to hire. Other warbands: immune to Fear; Terror is treated as Fear.",
  },
  "the-gaol": { halfPriceHires: ["gaoler"], injuryRewrites: [{ min: 61, max: 61, to: "full_recovery" }] },
  amphitheatre: { halfPriceHires: ["pit_fighter"], halfPriceItems: ["net"], pitFightAutoWin: true },
  "city-hall": { explorationModifyOne: true },
  "clock-tower": { explorationMaxFinds: true },
  "fence-alley": { halfPriceItems: ["black_lotus", "crimson_shade", "dark_venom", "mad_cap_mushrooms", "mandrake_root", "reptile_venom", "poisoned_weapon"] },
  "little-moot": { halfPriceHires: ["halfling_scout"], halfPriceItems: ["halfling_cookbook"] },
  "merchants-quarter": { halfPriceHires: ["elf_ranger"], halfPriceItems: ["elf_bow", "elven_cloak", "ithilmar_armour", "ithilmar_weapon", "prefix:ithilmar_"] },
  "market-square": { rareRollBonus: 2 },
  "poor-quarter": { explorationDice: 1 },
  quayside: { veteranDice: "human" },
  "sages-hall": { halfPriceHires: ["warlock"], halfPriceItems: ["tome_of_magic"], chooseSpell: true },
  "temple-of-sigmar": { injuryRewrites: [{ min: 22, max: 35, test: 5, to: "full_recovery" }] },
  "the-great-library": { halfPriceItems: ["halfling_cookbook", "holy_tome", "mordheim_map", "tome_of_magic"] },
  "the-pit": { reminder: "During exploration a found location may be changed to The Pit (Heroes devoured on a 1 or 2); Possessed Heroes always return with the maximum shards." },
  "middle-bridge": { reminder: "Toll: 2D6 gc at the end of any game where another warband crossed the bridge to reach the battle." },
  "the-rock": { wyrdstoneSaleBonus: 0.2 },
  "river-gate": GATE,
  "east-gate": GATE,
  "south-gate": GATE,
  "west-gate": GATE,
};

export function districtEffect(districtId: string): DistrictEffect {
  return DISTRICT_EFFECTS[districtId] ?? {};
}

/** True when an id list from a district effect names this item. */
export function matchesItemList(list: readonly string[] | undefined, itemId: string): boolean {
  if (!list) return false;
  return list.some((entry) => (entry.startsWith("prefix:") ? itemId.startsWith(entry.slice(7)) : entry === itemId));
}
