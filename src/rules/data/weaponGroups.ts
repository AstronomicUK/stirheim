// Display grouping for the 140-item weapon catalogue — used to build <optgroup>s in every weapon
// dropdown so the list reads as Melee / Missile / Blackpowder / Creature / Gromril / Ithilmar
// instead of one flat, unsorted run.

import type { Weapon } from "../types";

export type WeaponGroup = "Hand-to-hand" | "Missile" | "Blackpowder" | "Creature attacks" | "Gromril weapons" | "Ithilmar weapons";

const BLACKPOWDER_IDS = new Set([
  "blunderbuss",
  "chaos_dwarf_blunderbuss",
  "double_barrelled_duelling_pistol",
  "double_barrelled_handgun",
  "double_barrelled_pistol",
  "duelling_pistol",
  "hand_held_mortar",
  "handgun",
  "hersten_wenkler_pigeon_bombs",
  "hochland_long_rifle",
  "ostlander_double_barrelled_hunting_rifle",
  "ostlander_double_barrelled_pistol",
  "pistol",
  "repeater_handgun",
  "repeater_pistol",
  "swivel_gun_ball_shot",
  "swivel_gun_chain_shot",
  "swivel_gun_grape_shot",
  "warplock_pistol",
]);

const CREATURE_IDS = new Set(["gnoblar_sharp_stuff", "zombie_claws"]);

export function weaponGroup(weapon: Weapon): WeaponGroup {
  if (weapon.id.startsWith("gromril_")) return "Gromril weapons";
  if (weapon.id.startsWith("ithilmar_")) return "Ithilmar weapons";
  if (CREATURE_IDS.has(weapon.id) || /_(attack|bite|gore)$/.test(weapon.id)) return "Creature attacks";
  if (weapon.type === "ranged") return BLACKPOWDER_IDS.has(weapon.id) ? "Blackpowder" : "Missile";
  return "Hand-to-hand";
}

export const WEAPON_GROUP_ORDER: WeaponGroup[] = ["Hand-to-hand", "Missile", "Blackpowder", "Creature attacks", "Gromril weapons", "Ithilmar weapons"];

/** Weapons grouped and alphabetised for a dropdown. */
export function groupWeapons(weapons: Weapon[]): { group: WeaponGroup; weapons: Weapon[] }[] {
  const byGroup = new Map<WeaponGroup, Weapon[]>();
  for (const w of weapons) {
    const g = weaponGroup(w);
    const list = byGroup.get(g) ?? [];
    list.push(w);
    byGroup.set(g, list);
  }
  return WEAPON_GROUP_ORDER.filter((g) => byGroup.has(g)).map((g) => ({
    group: g,
    weapons: [...byGroup.get(g)!].sort((a, b) => a.name.localeCompare(b.name)),
  }));
}

/**
 * Loadout sanity warnings (02:12, 01:811, 02:272, 02:513, 02:648). Informational — the engine
 * still computes whatever is equipped, these just tell the user when a loadout isn't legal.
 */
export function loadoutWarnings(weapons: Weapon[], buckler: boolean): string[] {
  const melee = weapons.filter((w) => w.type === "melee");
  const warnings: string[] = [];
  if (melee.length > 2) warnings.push("A warrior can carry at most two close-combat weapons (plus the free dagger counts as one of them) — extra weapons here still add attacks.");
  const twoHanded = melee.filter((w) => w.special.includes("twoHanded"));
  if (twoHanded.length > 0 && (melee.length > 1 || buckler)) warnings.push(`${twoHanded[0].name} is two-handed: it can't be used with another weapon or a buckler in close combat.`);
  const oneHandOnly = melee.filter((w) => w.special.includes("difficultToUseOffHand") || w.special.includes("unwieldyOffHandOnly") || w.special.includes("freestyleNoOtherWeapon") || w.special.includes("cumbersomeNoOtherWeapons"));
  if (oneHandOnly.length > 0 && melee.length > 1) warnings.push(`${oneHandOnly[0].name} can't be combined with a second weapon.`);
  if (melee.filter((w) => w.paired).length > 0 && melee.length > 1) warnings.push("A paired weapon (claws, weeping blades, poison daggers) already counts as two weapons — the extra attack is built in, don't add a second weapon.");
  return warnings;
}
