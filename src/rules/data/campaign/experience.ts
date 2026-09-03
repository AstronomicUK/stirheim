// Experience — reference/rules/03-campaigns-magic-optional-rules.md lines 230-338
// (mordheimer.net/docs/campaigns/experience): underdog bonuses, the Hero and Henchman Advance
// tables and the racial maximum characteristics table.

import type { AdvanceResult, RacialMaximum, UnderdogBonus } from "../../types/campaign";
import type { CharacterRole } from "../../types";
import type { SourceRef } from "../../types/common";

export const EXPERIENCE_SOURCE: SourceRef = {
  publication: "Mordheim Rulebook (mordheimer.net/docs/campaigns/experience)",
  file: "03-campaigns-magic-optional-rules.md:230-338",
};

/**
 * Experience totals at which a warrior earns an Advance roll — the thick-bordered boxes on the
 * official roster sheet. The scrape only says "when the accumulated experience reaches a box
 * that has thick borders" (03:250), so these come from the Mordheim Rulebook roster sheet.
 */
export const HERO_XP_THRESHOLDS: number[] = [
  2, 4, 6, 8, 11, 14, 17, 20, 24, 28, 32, 36, 41, 46, 51, 57, 63, 69, 76, 83, 90,
];

/** Henchman-group Advance boxes, from the Mordheim Rulebook roster sheet (see above). */
export const HENCHMAN_XP_THRESHOLDS: number[] = [2, 5, 9, 14];

/** "Henchmen never add more than +1 point to any of their initial characteristics." (03:278) */
export const HENCHMAN_MAX_INCREASE_PER_STAT = 1;

function thresholdsFor(role: CharacterRole): number[] {
  return role === "hero" ? HERO_XP_THRESHOLDS : HENCHMAN_XP_THRESHOLDS;
}

/** Number of Advance boxes crossed going from `oldXp` to `newXp` (thresholds t with oldXp < t <= newXp). */
export function advancesEarned(oldXp: number, newXp: number, role: CharacterRole): number {
  return thresholdsFor(role).filter((t) => t > oldXp && t <= newXp).length;
}

/** The next Advance box strictly above `xp`, or null once the roster sheet runs out. */
export function nextThreshold(xp: number, role: CharacterRole): number | null {
  return thresholdsFor(role).find((t) => t > xp) ?? null;
}

// ---- Underdogs ----

/** Open-ended top band ("301+"). */
const UNBOUNDED = 9999;

export const UNDERDOG_BONUSES: UnderdogBonus[] = [
  { band: { min: 0, max: 50 }, bonus: 0 },
  { band: { min: 51, max: 75 }, bonus: 1 },
  { band: { min: 76, max: 100 }, bonus: 2 },
  { band: { min: 101, max: 150 }, bonus: 3 },
  { band: { min: 151, max: 300 }, bonus: 4 },
  { band: { min: 301, max: UNBOUNDED }, bonus: 5 },
];

/** Extra Experience for fighting a warband whose rating exceeds yours by `ratingDifference` (0 if not the underdog). */
export function underdogBonus(ratingDifference: number): number {
  if (ratingDifference <= 0) return 0;
  const row = UNDERDOG_BONUSES.find((b) => ratingDifference >= b.band.min && ratingDifference <= b.band.max);
  return row ? row.bonus : UNDERDOG_BONUSES[UNDERDOG_BONUSES.length - 1].bonus;
}

// ---- Advance rolls (2D6) ----

const HERO_NEW_SKILL_TEXT =
  "New Skill. Select one of the Skill tables available to the Hero and pick a skill. If he is a wizard he may choose to randomly generate a new spell instead of a skill. See the Magic section.";

export const HERO_ADVANCES: AdvanceResult[] = [
  { band: { min: 2, max: 5 }, kind: "newSkill", text: HERO_NEW_SKILL_TEXT },
  {
    band: { min: 6, max: 6 },
    kind: "statSubRoll",
    text: "Characteristic Increase. Roll again: 1-3 = +1 Strength; 4-6 = +1 Attack.",
    subRoll: [
      { band: { min: 1, max: 3 }, stat: "S" },
      { band: { min: 4, max: 6 }, stat: "A" },
    ],
  },
  {
    band: { min: 7, max: 7 },
    kind: "statChoice",
    text: "Characteristic Increase. Choose either +1 WS or +1 BS.",
    choice: ["WS", "BS"],
  },
  {
    band: { min: 8, max: 8 },
    kind: "statSubRoll",
    text: "Characteristic Increase. Roll again: 1-3 = +1 Initiative; 4-6 = +1 Leadership.",
    subRoll: [
      { band: { min: 1, max: 3 }, stat: "I" },
      { band: { min: 4, max: 6 }, stat: "Ld" },
    ],
  },
  {
    band: { min: 9, max: 9 },
    kind: "statSubRoll",
    text: "Characteristic Increase. Roll again: 1-3 = +1 Wound; 4-6 = +1 Toughness.",
    subRoll: [
      { band: { min: 1, max: 3 }, stat: "W" },
      { band: { min: 4, max: 6 }, stat: "T" },
    ],
  },
  {
    band: { min: 10, max: 12 },
    kind: "newSkill",
    text: "New Skill. Select one of the Skill tables available to the Hero and pick a skill. If he is a wizard he may choose to randomly generate a new spell instead of a skill.",
  },
];

/**
 * Henchmen never add more than +1 point to any of their initial characteristics. If the dice roll
 * indicates an increase in a characteristic which has already been increased (or is at its racial
 * maximum), roll again until an unincreased characteristic is rolled. All warriors in the group
 * gain the same advance.
 */
export const HENCHMAN_ADVANCES: AdvanceResult[] = [
  { band: { min: 2, max: 4 }, kind: "statIncrease", text: "Advance. +1 Initiative.", stat: "I" },
  { band: { min: 5, max: 5 }, kind: "statIncrease", text: "Advance. +1 Strength.", stat: "S" },
  { band: { min: 6, max: 7 }, kind: "statChoice", text: "Advance. Choose either +1 BS or +1WS.", choice: ["BS", "WS"] },
  { band: { min: 8, max: 8 }, kind: "statIncrease", text: "Advance. +1 Attack.", stat: "A" },
  { band: { min: 9, max: 9 }, kind: "statIncrease", text: "Advance. +1 Leadership.", stat: "Ld" },
  {
    band: { min: 10, max: 12 },
    kind: "ladsGotTalent",
    text: "The lad's got talent. One model in the group becomes a Hero. If you already have the maximum number of Heroes, roll again. The new Hero remains the same Henchman type (e.g., a Ghoul stays as a Ghoul) and starts with the same experience the Henchman had, with all his characteristic increases intact. You may choose two skill lists available to Heroes in your warband. These are the skill types your new Hero can choose from when he gains new skills. He can immediately make one roll on the Heroes Advance table. The remaining members of the Henchmen group, if any, roll again for the advance that they have earned, re-rolling any results of 10-12.",
  },
];

export function lookupAdvance(roll2D6: number, role: CharacterRole): AdvanceResult {
  const table = role === "hero" ? HERO_ADVANCES : HENCHMAN_ADVANCES;
  const hit = table.find((a) => roll2D6 >= a.band.min && roll2D6 <= a.band.max);
  if (!hit) throw new RangeError(`No ${role} advance covers 2D6 ${roll2D6}`);
  return hit;
}

// ---- Racial maximum characteristics ----

/**
 * "Characteristics for certain warriors may not be increased beyond the maximum limits shown on the
 * following profiles." Notes (03:335): profiles other than Human, Elf, Dwarf, Ogre, Halfling,
 * Possessed and Vampire are from their respective Warband lists. Skinks and Saurus are from the
 * 2002 Annual. The Ogre profile was updated in the 2005 Errata.
 */
export const RACIAL_MAXIMUMS: RacialMaximum[] = [
  { profile: "Human", stats: { M: 4, WS: 6, BS: 6, S: 4, T: 4, W: 3, I: 6, A: 4, Ld: 9 } },
  { profile: "Elf", stats: { M: 5, WS: 7, BS: 7, S: 4, T: 4, W: 3, I: 9, A: 4, Ld: 10 } },
  { profile: "Dwarf", stats: { M: 3, WS: 7, BS: 6, S: 4, T: 5, W: 3, I: 5, A: 4, Ld: 10 } },
  { profile: "Ogre", stats: { M: 6, WS: 6, BS: 5, S: 5, T: 5, W: 5, I: 6, A: 5, Ld: 9 } },
  { profile: "Halfling", stats: { M: 4, WS: 5, BS: 7, S: 3, T: 3, W: 3, I: 9, A: 4, Ld: 10 } },
  { profile: "Possessed", stats: { M: 6, WS: 8, BS: 0, S: 6, T: 6, W: 4, I: 7, A: 5, Ld: 10 } },
  { profile: "Vampire", stats: { M: 6, WS: 8, BS: 6, S: 7, T: 6, W: 4, I: 9, A: 4, Ld: 10 } },
  { profile: "Skaven", stats: { M: 6, WS: 6, BS: 6, S: 4, T: 4, W: 3, I: 7, A: 4, Ld: 7 } },
  { profile: "Skaven (Clan Pestilens)", stats: { M: 5, WS: 6, BS: 6, S: 4, T: 5, W: 3, I: 7, A: 4, Ld: 7 } },
  { profile: "Ghoul", stats: { M: 5, WS: 5, BS: 2, S: 4, T: 5, W: 3, I: 5, A: 5, Ld: 7 } },
  {
    profile: "Saurus",
    stats: { M: 4, WS: 6, BS: 0, S: 5, T: 5, W: 3, I: 4, A: 4, Ld: 10 },
    note: 'Attacks is listed as "4+1" in the source.',
  },
  { profile: "Skink", stats: { M: 6, WS: 5, BS: 6, S: 4, T: 3, W: 3, I: 7, A: 4, Ld: 8 } },
  { profile: "Goblin", stats: { M: 4, WS: 5, BS: 6, S: 4, T: 4, W: 3, I: 6, A: 4, Ld: 7 } },
  { profile: "Orc", stats: { M: 4, WS: 6, BS: 6, S: 4, T: 5, W: 3, I: 5, A: 4, Ld: 9 } },
  { profile: "Black Orc", stats: { M: 4, WS: 7, BS: 6, S: 5, T: 6, W: 3, I: 5, A: 4, Ld: 9 } },
  { profile: "Werecreature (Norse) Wulfen/Ulfwerenar", stats: { M: 8, WS: 6, BS: 0, S: 6, T: 5, W: 4, I: 7, A: 4, Ld: 9 } },
  { profile: "Tomb Lord (Tomb Guardians)", stats: { M: 4, WS: 6, BS: 6, S: 5, T: 5, W: 5, I: 5, A: 4, Ld: 9 } },
  { profile: "Liche Priest & Acolyte (Tomb Guardians)", stats: { M: 4, WS: 6, BS: 6, S: 4, T: 4, W: 3, I: 6, A: 4, Ld: 9 } },
  { profile: "Liche (Restless Dead)", stats: { M: 5, WS: 4, BS: 4, S: 4, T: 4, W: 8, I: 6, A: 3, Ld: 10 } },
  { profile: "Grave Guard (Restless Dead)", stats: { M: 5, WS: 5, BS: 5, S: 4, T: 4, W: 4, I: 5, A: 4, Ld: 10 } },
  { profile: "Bull Centaur (Black Dwarfs)", stats: { M: 8, WS: 7, BS: 6, S: 5, T: 5, W: 4, I: 6, A: 5, Ld: 10 } },
  { profile: "Bull Centaur (The Sons of Hashut)", stats: { M: 7, WS: 7, BS: 3, S: 5, T: 5, W: 4, I: 4, A: 5, Ld: 9 } },
  { profile: "Hobgoblin (The Sons of Hashut)", stats: { M: 4, WS: 5, BS: 5, S: 4, T: 4, W: 3, I: 5, A: 3, Ld: 8 } },
  { profile: "Marauder Of Chaos", stats: { M: 4, WS: 7, BS: 7, S: 4, T: 4, W: 3, I: 7, A: 4, Ld: 9 } },
  { profile: "Warrior Of Chaos", stats: { M: 4, WS: 8, BS: 8, S: 5, T: 5, W: 3, I: 8, A: 5, Ld: 9 } },
  { profile: "Ungor", stats: { M: 6, WS: 6, BS: 6, S: 4, T: 4, W: 3, I: 7, A: 4, Ld: 7 } },
  { profile: "Centigor", stats: { M: 9, WS: 7, BS: 6, S: 4, T: 5, W: 4, I: 6, A: 4, Ld: 9 } },
  { profile: "Minotaur", stats: { M: 6, WS: 6, BS: 5, S: 5, T: 5, W: 5, I: 6, A: 5, Ld: 9 } },
  { profile: "Other Beastmen", stats: { M: 5, WS: 7, BS: 6, S: 4, T: 5, W: 4, I: 6, A: 4, Ld: 9 } },
];

export function findRacialMaximum(profile: string): RacialMaximum | undefined {
  const key = profile.trim().toLowerCase();
  return RACIAL_MAXIMUMS.find((r) => r.profile.toLowerCase() === key);
}
