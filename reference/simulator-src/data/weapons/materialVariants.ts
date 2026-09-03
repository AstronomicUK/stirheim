// Gromril and Ithilmar are material qualities, not weapons in their own right (mordheimer.net,
// rules/02-weapons-armour-equipment.md: "gromril weapon" / "ithilmar weapon" — "you may choose
// which type of hand-to-hand weapon is offered"). Both apply to an ordinary trading-post hand
// weapon:
//   - Gromril: an extra -1 armour save modifier (stacks with the base weapon's own, e.g. Cutting
//     Edge on an axe), costs 4x the base weapon's price.
//   - Ithilmar: +1 Initiative in hand-to-hand combat (informational only — Initiative isn't wired
//     into the probability engine, same as the character sheet's own I stat), costs 3x.
//
// Generated here as proper named variants (e.g. "Gromril Sword") of the CORE rulebook's basic
// hand weapons only — the ordinary trading-post options a Dwarf or Elf-aligned warband would
// realistically requisition the upgrade for — not the setting's bespoke/magical named weapons
// (Cathayan Longsword, Starsword, Iron Fist, etc.), which are their own distinct items.

import type { Weapon } from "../../types";
import { MELEE_WEAPONS } from "./melee";

const BASE_WEAPON_IDS = [
  "dagger",
  "sword",
  "axe",
  "mace",
  "club",
  "hammer",
  "spear",
  "halberd",
  "flail",
  "double_handed_sword",
  "morning_star",
];

function findBase(id: string): Weapon {
  const weapon = MELEE_WEAPONS.find((w) => w.id === id);
  if (!weapon) throw new Error(`materialVariants: base weapon id "${id}" not found in MELEE_WEAPONS`);
  return weapon;
}

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

const BASES = BASE_WEAPON_IDS.map(findBase);

export const MATERIAL_VARIANT_WEAPONS: Weapon[] = [...BASES.map(gromrilVariant), ...BASES.map(ithilmarVariant)];
