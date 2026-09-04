// Equipment-list names -> catalogue items. Warband templates write their equipment lists as free
// text ("Long bow", "Ball & Chain", "Cutlass (Sword)", "Throwing Knives (Heroes Only)") while the
// catalogue has one canonical `Item.name` per entry, so the warband builder needs a lookup that
// tolerates casing, punctuation, plurals and bracketed restrictions, plus an explicit alias table
// for the names that are genuinely different words for the same thing.
//
// Resolution order (first hit wins):
//   1. exact `Item.name`, case-insensitively;
//   2. EQUIPMENT_ALIASES, keyed on the full list name (compared case- and punctuation-insensitively,
//      so "Cutlass (Sword)" and "cutlass (sword)" both hit) — explicit beats heuristic, which matters
//      for "Cleaver (counts as axe)" where a heuristic strip would find the Mootlander Cleaver;
//   3. normalised match: qualifiers in (...) / [...] dropped, "&" -> "and", non-alphanumerics
//      removed, trailing plural "s" ignored — so "Long bow" = "Longbow", "Belaying Pin" = "Belaying
//      Pins", "Sea Dragon Cloak (Heroes and Corsairs only)" = "Sea Dragon Cloak".
//
// Warband-specific gear with no catalogue entry (Katana, Pry Bar, Bearcloak, the Pit Fighter style
// bundles …) is meant to stay unresolved: the builder keeps it as a `customName` item at the list's
// price. `unresolvedEquipmentNames()` lists the current gaps; the aliases test pins the count.

import type { Item } from "../../types/items";
import { WARBAND_TEMPLATES } from "../warbandTemplates";
import { ANIMAL_ITEMS } from "./animals";
import { ARMOUR_ITEMS } from "./armour";
import { BLACKPOWDER_ITEMS } from "./blackpowder";
import { MELEE_ITEMS } from "./melee";
import { MISC_ITEMS } from "./misc";
import { MISSILE_ITEMS } from "./missile";

// Built from the category files rather than ./index so that index.ts can re-export this module
// without a circular import evaluating ITEMS before it exists.
const ITEMS: Item[] = [...MELEE_ITEMS, ...MISSILE_ITEMS, ...BLACKPOWDER_ITEMS, ...ARMOUR_ITEMS, ...MISC_ITEMS, ...ANIMAL_ITEMS];

/**
 * Equipment-list names that are different words for a catalogue item. Keys are the names as written
 * in the templates (any casing); values are `Item.id`s. Rule judgements:
 *   - Names that say what they count as ("Cutlass (Sword)", "Choppa (Counts as a Morning star)",
 *     "Naginata (Halberd)") map to that item.
 *   - Throwing axes/stars/weapons all use the Throwing Knives/Stars profile ("same as Throwing
 *     Knives" in the Norse and Marauder lists).
 *   - "Hochland Long Rifle" and "Long rifle" are the rulebook's Hunting Rifle.
 *   - Slash-separated club-type choices ("Mace/Club", "Staff/Club/Mace") map to the rulebook's
 *     "Club, Mace or Hammer" entry, which covers all of them.
 *   - The plain "Pike" only appears in Tilean lists at 12 gc, so it is the Tilean pike; the Merchant
 *     Caravans list names its own.
 *   - "Horse" (Bretonnian Knights, Mazzalupo) is a riding horse, not a warhorse (listed separately).
 */
export const EQUIPMENT_ALIASES: Record<string, string> = {
  "Battle Axe": "axe",
  "Two-handed weapon": "double_handed_weapon",
  "Hochland Long Rifle": "hunting_rifle",
  "Long rifle": "hunting_rifle",
  "Double-barrelled hunting rifle": "ostlander_double_barrelled_hunting_rifle",
  "Mace/Club": "club_mace_or_hammer",
  "Mace/Hammer": "club_mace_or_hammer",
  "Staff/Club/Mace": "club_mace_or_hammer",
  "Cutlass (Sword)": "sword",
  "Sword (Scimitar)": "sword",
  "Wakizashi (Sword)": "sword",
  "Machete (Sword) [Halfling Cooks only]": "sword",
  "Cleaver (counts as axe)": "axe",
  "Meat Cleaver (Axe) [Halfling Cooks only]": "axe",
  "Choppa (Counts as a Morning star)": "morning_star",
  "Stone Axe (counts as a club)": "club",
  "Hankyu (Short Bow)": "short_bow",
  "Nagamaki (Cathayan Longsword)": "cathayan_longsword",
  "Naginata (Halberd)": "halberd",
  "Shovel (Halberd)": "halberd",
  "Sai (Sword Breaker)": "sword_breaker",
  "Shuriken (Throwing Stars)": "throwing_knives_stars",
  "Tanto (Dagger)": "dagger",
  "Pairing Knife (Dagger) [Halfling Cooks only]": "dagger",
  "Dagger (Jambiya)": "dagger",
  "Dagger/Pointy Stick": "dagger",
  "Teppo (Handgun)": "handgun",
  "Yari (Spear)": "spear",
  "Spear (Pitch Fork)": "spear",
  "Yumi (Bow)": "bow",
  "Cooking Pot (Helmet) [Halfling Cooks only]": "cooking_pot_helmet",
  "Throwing Knives": "throwing_knives_stars",
  "Throwing stars": "throwing_knives_stars",
  "Throwing Axe": "throwing_knives_stars",
  "Throwing Axes": "throwing_knives_stars",
  "Throwing Axes (same as Throwing Knives)": "throwing_knives_stars",
  "Throwing Knives (Heroes Only)": "throwing_knives_stars",
  "Throwing Weapons": "throwing_knives_stars",
  "Pigeon Bombs": "hersten_wenkler_pigeon_bombs",
  "Horse": "riding_draft_horse",
  "Horse (Fallen nobles only if the Captain is mounted)": "riding_draft_horse",
  "Pike": "pike_tileans",
  "Pike (Sell-swords only)": "pike_merchant_caravans",
};

/** Lowercase, "&" -> "and", everything but letters and digits removed. */
function normaliseKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "");
}

/** Drop bracketed qualifiers: "Sword (Heroes only)" -> "Sword", "Bow [may not …]" -> "Bow". */
function stripQualifiers(text: string): string {
  return text
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .trim();
}

/** Ignore a trailing plural "s" ("Pistols" -> "pistol"), but not a double "s" ("Cutlass"). */
function singular(key: string): string {
  return key.length > 3 && key.endsWith("s") && !key.endsWith("ss") ? key.slice(0, -1) : key;
}

const BY_EXACT_NAME = new Map<string, Item>(ITEMS.map((item) => [item.name.toLowerCase(), item]));
const BY_NORMALISED_NAME = new Map<string, Item>();
for (const item of ITEMS) {
  const key = singular(normaliseKey(item.name));
  if (!BY_NORMALISED_NAME.has(key)) BY_NORMALISED_NAME.set(key, item);
}
const BY_ALIAS = new Map<string, string>(Object.entries(EQUIPMENT_ALIASES).map(([name, id]) => [normaliseKey(name), id]));
const BY_ID = new Map<string, Item>(ITEMS.map((item) => [item.id, item]));

/** Find the catalogue item an equipment-list name refers to, or undefined for warband-specific gear. */
export function resolveEquipmentName(name: string): Item | undefined {
  const trimmed = name.trim();
  if (trimmed.length === 0) return undefined;

  const exact = BY_EXACT_NAME.get(trimmed.toLowerCase());
  if (exact) return exact;

  const aliasId = BY_ALIAS.get(normaliseKey(trimmed));
  if (aliasId) return BY_ID.get(aliasId);

  return BY_NORMALISED_NAME.get(singular(normaliseKey(stripQualifiers(trimmed))));
}

/** Every distinct equipment-list item name across all warband templates, sorted. */
export function equipmentListNames(): string[] {
  const names = new Set<string>();
  for (const warband of WARBAND_TEMPLATES) {
    for (const list of warband.equipmentLists) {
      for (const entry of [...list.meleeWeapons, ...list.missileWeapons, ...list.armour]) names.add(entry.name);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

/** Equipment-list names with no catalogue item (see the aliases test for the expected set). */
export function unresolvedEquipmentNames(): string[] {
  return equipmentListNames().filter((name) => resolveEquipmentName(name) === undefined);
}
