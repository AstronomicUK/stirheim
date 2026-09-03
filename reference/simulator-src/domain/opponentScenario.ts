// Plain data + pure helpers for the lightweight "opponent scenario" concept — kept separate from
// components/shared.tsx (which holds the matching React editor) so the engine layer can depend on
// this without pulling UI/JSX into it.

import type { Armour, Character, DefenderProfile, Weapon } from "../types";

/**
 * A lightweight "opponent scenario" — NOT a full built defender character, and deliberately not
 * tied to any saved character. WS and Toughness are handled separately by each screen (usually
 * swept as grid axes, sometimes picked as a single reference point) — everything here is what
 * can't be swept on a 2D WS×T grid: armour, Parry, and defensive skills/traits. Shared by the Stat
 * Gain and Skill Gain Analysers so neither one needs you to build or select a full opponent
 * character first.
 */
export interface OpponentScenario {
  S: number;
  /** Ballistic Skill — only matters when the opponent shoots at the character (defensive ranged). */
  BS: number;
  /** Wounds — a W2+ opponent has to lose every Wound before Injury is rolled. */
  W: number;
  /** Attacks the opponent makes when they hit back (defending side). */
  A: number;
  armour: Armour;
  helmet: boolean;
  skillIds: string[];
  traitIds: string[];
  parryWeaponCount: 0 | 1 | 2;
  /** Whether a failed Parry may be re-rolled once (buckler + sword, Dwarf Axe + Parry weapon, Fighting Claws, Iron Fist pair — see parryRerollFromItems). */
  parryReroll: boolean;
  wardSaveThreshold: number | null;
}

export function defaultOpponentScenario(): OpponentScenario {
  return {
    S: 3,
    BS: 3,
    W: 1,
    A: 1,
    armour: { type: "none", shield: false, buckler: false },
    helmet: false,
    skillIds: [],
    traitIds: [],
    parryWeaponCount: 0,
    parryReroll: false,
    wardSaveThreshold: null,
  };
}

/** Weapons that count as carrying a buckler as well as a hand weapon (Spiked Gauntlet, 02:654). */
const BUCKLER_EQUIVALENT_WEAPON_IDS = ["spiked_gauntlet"];

export function countParryItems(weapons: Weapon[], armour: Armour): 0 | 1 | 2 {
  const count = weapons.filter((w) => w.parry).length + (armour.buckler ? 1 : 0);
  return count >= 2 ? 2 : count === 1 ? 1 : 0;
}

/**
 * Whether this loadout gets to re-roll a failed Parry once.
 * - Core rule 01:846: buckler + sword re-rolls; two swords do NOT.
 * - Dwarf Axe 02:296: two Dwarf axes, or a Dwarf axe + a sword etc, re-roll instead of parrying twice.
 * - Fighting Claws 02:308: re-roll "in the same way as a model armed with a sword and buckler".
 * - Iron Fist 02:409: re-roll if paired with a sword or another Iron Fist.
 * - Spiked Gauntlet 02:654 counts as a hand weapon and a buckler, so it pairs like a buckler.
 */
export function parryRerollFromItems(weapons: Weapon[], armour: Armour): boolean {
  const ids = weapons.map((w) => w.id);
  const parryWeapons = weapons.filter((w) => w.parry);
  const hasBuckler = armour.buckler || ids.some((id) => BUCKLER_EQUIVALENT_WEAPON_IDS.includes(id));
  if (ids.includes("fighting_claws")) return true;
  if (hasBuckler && parryWeapons.length >= 1) return true;
  if (ids.includes("dwarf_axe") && countParryItems(weapons, armour) >= 2) return true;
  const ironFists = ids.filter((id) => id === "iron_fist").length;
  if (ironFists >= 2) return true;
  if (ironFists === 1 && weapons.some((w) => w.isSword)) return true;
  return false;
}

/**
 * Pre-fills an OpponentScenario from an already-built character — so if you've built a
 * representative opponent (a rank-and-file Swordsman, a rival Hero, etc.) in Character Builder
 * once, you don't have to re-tick their skills/traits by hand every time you want to test against
 * them here. This is a one-time "load and prefill" copy — the result is a plain OpponentScenario
 * you can still freely edit afterward, not a live link back to the character.
 */
export function characterToOpponentScenario(character: Character, equippedWeapons: Weapon[]): OpponentScenario {
  return {
    S: character.stats.S,
    BS: character.stats.BS,
    W: character.stats.W,
    A: character.stats.A,
    armour: character.armour,
    helmet: character.helmet,
    skillIds: character.skills,
    traitIds: character.traits,
    parryWeaponCount: countParryItems(equippedWeapons, character.armour),
    parryReroll: parryRerollFromItems(equippedWeapons, character.armour),
    wardSaveThreshold: character.wardSaveThreshold,
  };
}

export function opponentScenarioToDefenderProfile(scenario: OpponentScenario, ws: number, t: number): DefenderProfile {
  return {
    WS: ws,
    T: t,
    S: scenario.S,
    W: scenario.W,
    armour: scenario.armour,
    helmet: scenario.helmet,
    activeSkillIds: scenario.skillIds,
    activeTraitIds: scenario.traitIds,
    parryWeaponCount: scenario.parryWeaponCount,
    parryReroll: scenario.parryReroll,
    wardSaveThreshold: scenario.wardSaveThreshold,
  };
}

/** Builds a character's own DefenderProfile — used when the character is the one being attacked. */
export function characterToDefenderProfile(character: Character, weapons: Weapon[]): DefenderProfile {
  return {
    WS: character.stats.WS,
    T: character.stats.T,
    S: character.stats.S,
    W: character.stats.W,
    armour: character.armour,
    helmet: character.helmet,
    activeSkillIds: character.skills,
    activeTraitIds: character.traits,
    parryWeaponCount: countParryItems(weapons, character.armour),
    parryReroll: parryRerollFromItems(weapons, character.armour),
    wardSaveThreshold: character.wardSaveThreshold,
  };
}
