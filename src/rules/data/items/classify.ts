// What kind of thing a catalogue item is, read from its data rather than its id: the armour class
// the fight calculator and the equipment bans agree on, helmets, shields, and thrown weapons. One
// place to answer these so the roster validator and the calculator never disagree (audit, section C).

import type { Item } from "../../types/items";
import { findWeapon } from "../weapons";
import { findItem } from "./index";

export type ArmourClass = "light" | "heavy" | "gromril" | "helmet" | "shield" | "buckler" | "kiteShield" | "pavise" | "ward" | "none";

const LIGHT = ["light_armour", "toughened_leathers"];
const HEAVY = ["heavy_armour", "ithilmar_armour"];
const GROMRIL = ["gromril_armour", "chaos_armour", "lamellar_armour", "masterwork_heavy_armour", "mechanical_suit"];
const HELMETS = ["helmet", "cooking_pot_helmet", "bone_helmet"];

/** Which slot a piece of armour fills, or "none" for anything that is not armour the calculator knows. */
export function armourClass(item: Item): ArmourClass {
  if (item.id === "shield" || item.id === "shield_of_sigmar") return "shield";
  if (item.id === "buckler") return "buckler";
  if (item.id === "kite_shield") return "kiteShield";
  if (item.id === "pavise") return "pavise";
  if (item.id === "enchanted_skins") return "ward";
  if (HELMETS.includes(item.id) || /helmet|helm\b/i.test(item.id)) return "helmet";
  if (LIGHT.includes(item.id)) return "light";
  if (HEAVY.includes(item.id)) return "heavy";
  if (GROMRIL.includes(item.id)) return "gromril";
  if (item.category !== "armour") return "none";
  if (item.armourSave === 6) return "light";
  if (item.armourSave === 5) return "heavy";
  if (item.armourSave === 4) return "gromril";
  return "none";
}

export function isHelmet(item: Item): boolean {
  return armourClass(item) === "helmet";
}

/** Body armour (not a shield, buckler or helmet). */
export function isBodyArmour(item: Item): boolean {
  const c = armourClass(item);
  return c === "light" || c === "heavy" || c === "gromril";
}

export function isHeavyArmourClass(item: Item): boolean {
  const c = armourClass(item);
  return c === "heavy" || c === "gromril";
}

/** A missile weapon that is thrown (javelins, knives, belaying pins, bolas, pebbles ...), by its engine tags. */
export function isThrownWeapon(item: Item): boolean {
  const weapon = item.weaponId ? findWeapon(item.weaponId) : undefined;
  if (weapon) return weapon.special.some((tag) => /^thrown/i.test(tag));
  return /throw|javelin|bolas|pebble|dart/i.test(item.id);
}

/** Is `itemId` a missile or black powder weapon that counts towards the two a warrior may carry? */
export function countsAsMissileWeapon(itemId: string): boolean {
  const item = findItem(itemId);
  if (!item) return false;
  if (item.category !== "missile" && item.category !== "blackpowder") return false;
  const weapon = item.weaponId ? findWeapon(item.weaponId) : undefined;
  if (weapon?.special.includes("doesNotCountAsMissileWeapon")) return false;
  if (item.id === "sharp_stuff") return false;
  return true;
}

/** Is `itemId` a hand-to-hand weapon other than a dagger (the two a warrior may carry)? */
export function countsAsHandWeapon(itemId: string): boolean {
  const item = findItem(itemId);
  if (!item || item.category !== "melee") return false;
  if (item.id === "dagger" || item.id.endsWith("_dagger")) return false;
  const effectUpgrade = ["dark_elf_blade", "darksteel_blade", "sons_of_hashut_obsidian_weapon", "gromril_weapon", "ithilmar_weapon"];
  return !effectUpgrade.includes(item.id);
}
