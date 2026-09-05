// Gromril and Ithilmar are material qualities, not weapons in their own right (mordheimer.net,
// rules/02-weapons-armour-equipment.md: "gromril weapon" / "ithilmar weapon" — "you may choose
// which type of hand-to-hand weapon is offered"). Both apply to an ordinary trading-post hand
// weapon:
//   - Gromril: an extra -1 armour save modifier (stacks with the base weapon's own, e.g. Cutting
//     Edge on an axe), costs 4x the base weapon's price.
//   - Ithilmar: +1 Initiative in hand-to-hand combat (informational only — Initiative isn't wired
//     into the probability engine, same as the character sheet's own I stat), costs 3x.
//
// Generated here as proper named variants (e.g. "Gromril Sword", "Ithilmar Axe") of every
// ordinary hand-to-hand weapon (isMaterialVariantBase), so a Gromril Axe keeps Cutting Edge and a
// Gromril Sword keeps Parry. The equipment catalogue (data/items/materialVariants.ts) generates the
// matching shop entries. Phase 11 decision: the generic "Gromril weapon" item is superseded.

import type { Weapon } from "../../types";
import { MELEE_WEAPONS } from "./melee";

/**
 * Which hand-to-hand weapons can be had in gromril or ithilmar: anything that strikes with the
 * wielder's own Strength and is an ordinary forged weapon. Excluded: paired specials sold as a set
 * (Fighting Claws, Weeping Blades...), poisoned or magical blades, weapons that ignore armour
 * altogether, fists, and anything with a fixed Strength of its own.
 */
export function isMaterialVariantBase(weapon: Weapon): boolean {
  if (weapon.type !== "melee" || weapon.strength !== "user") return false;
  if (weapon.paired || weapon.autoWoundOnNaturalSixToHit || weapon.poisoned || weapon.ignoresArmourSave) return false;
  if (weapon.special.includes("magical") || weapon.special.includes("permanentPoison")) return false;
  if (["unarmed", "zombie_claws", "wight_blade", "brass_knuckles", "iron_fist", "spiked_gauntlet", "katar"].includes(weapon.id)) return false;
  return true;
}

const BASES = MELEE_WEAPONS.filter(isMaterialVariantBase);

function gromrilVariant(base: Weapon): Weapon {
  return {
    ...base,
    id: `gromril_${base.id}`,
    name: `Gromril ${base.name}`,
    saveModifier: (base.saveModifier ?? 0) + 1,
    special: [...base.special, "gromrilMinus1ArmourSave"],
  };
}

function ithilmarVariant(base: Weapon): Weapon {
  return {
    ...base,
    id: `ithilmar_${base.id}`,
    name: `Ithilmar ${base.name}`,
    initiativeModifier: (base.initiativeModifier ?? 0) + 1,
    special: [...base.special, "ithilmarPlus1Initiative"],
  };
}


export const MATERIAL_VARIANT_WEAPONS: Weapon[] = [...BASES.map(gromrilVariant), ...BASES.map(ithilmarVariant)];
