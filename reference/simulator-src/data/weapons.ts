// Weapon catalogue — full database, extracted from rules/02-weapons-armour-equipment.md
// (mordheimer.net) via two extraction agents reading close-combat/missile/blackpowder/animal
// bestiary sections directly. See rules/00-index.md for provenance. Replaces the earlier
// ~25-item starter seed — that file's own comment (now stale) said its ranged Strength/range
// values were general knowledge, not verbatim; these are now the real, sourced figures.
//
// A handful of ids from the old starter seed aren't covered by the source pages themselves
// (Wight Blade is Undead-specific special equipment, not a general catalogue weapon; Zombies and
// Double-handed Hammers don't appear as their own entries in the scraped Weapons or Animal
// Bestiary pages) — kept below as small manual additions rather than dropped, since real saved
// characters and the Undead warband's own henchman roster reference them.

import type { Weapon } from "../types";
import { MELEE_WEAPONS } from "./weapons/melee";
import { RANGED_AND_CREATURE_WEAPONS } from "./weapons/ranged-and-creatures";
import { MATERIAL_VARIANT_WEAPONS } from "./weapons/materialVariants";

const MANUAL_ADDITIONS: Weapon[] = [
  // Wight Blades (Restless Dead — Grave Guards, rules/warbands/grade-1c.md:3371, verified against the
  // original Border Town Burning PDF on broheim.net): "All close combat 'to hit' rolls of a 6 will
  // automatically wound. You may roll 'to wound' as normal to determine if it is a 'critical hit'".
  // Same mechanic as Black Lotus poison. There is no lowered crit threshold in the source.
  {
    id: "wight_blade",
    name: "Wight Blade (Grave Guard)",
    type: "melee",
    strength: "user",
    critCategory: "bladed",
    concussion: false,
    autoWoundOnNaturalSixToHit: true,
    special: ["magical"],
    rangedProfile: null,
  },
  {
    id: "zombie_claws",
    name: "Zombie Claws",
    type: "melee",
    strength: "user",
    critCategory: "unarmed",
    concussion: false,
    special: [],
    rangedProfile: null,
  },
];

export const WEAPONS: Weapon[] = [...MELEE_WEAPONS, ...RANGED_AND_CREATURE_WEAPONS, ...MATERIAL_VARIANT_WEAPONS, ...MANUAL_ADDITIONS];

export function findWeapon(id: string, customWeapons: Weapon[] = []): Weapon | undefined {
  return WEAPONS.find((w) => w.id === id) ?? customWeapons.find((w) => w.id === id);
}
