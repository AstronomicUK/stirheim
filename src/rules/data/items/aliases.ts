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
import { SCENARIO_REWARD_ITEMS } from "./scenarioRewards";
import { ANIMAL_ITEMS } from "./animals";
import { ARMOUR_ITEMS } from "./armour";
import { BLACKPOWDER_ITEMS } from "./blackpowder";
import { MATERIAL_VARIANT_ITEMS } from "./materialVariants";
import { MELEE_ITEMS } from "./melee";
import { MISC_ITEMS } from "./misc";
import { MISSILE_ITEMS } from "./missile";
import { WARBAND_SPECIAL_ITEMS } from "./warbandSpecial";

// Built from the category files rather than ./index so that index.ts can re-export this module
// without a circular import evaluating ITEMS before it exists.
const ITEMS: Item[] = [...MELEE_ITEMS, ...MISSILE_ITEMS, ...BLACKPOWDER_ITEMS, ...ARMOUR_ITEMS, ...MISC_ITEMS, ...ANIMAL_ITEMS, ...WARBAND_SPECIAL_ITEMS, ...MATERIAL_VARIANT_ITEMS, ...SCENARIO_REWARD_ITEMS];

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
  "Holy Relic": "holy_unholy_relic",
  "Cavalry Spear": "spear",
  "Dueling Pistols": "duelling_pistol",
  "Double Handed Axe": "double_handed_weapon",
  "Lucky Rabbit’s foot": "rabbits_foot",
  "vial of Blessed Water": "blessed_water",

  "Battle Axe": "axe",
  "Scimitar": "sword",
  "Scimitar (counts as a Sword)": "sword",
  "Repeating Crossbow": "repeater_crossbow",
  "Dark Cloak (counts as Elven Cloak)": "elven_cloak",
  "Ninja Robe (counts as Hardened Leathers)": "toughened_leathers",
  "Mining Pick": "double_handed_weapon",
  "Pick (two-handed weapon)": "double_handed_weapon",
  "Pickaxe (uses rules of a 'axe' for combat)": "axe",
  "Two-handed sword": "double_handed_weapon",
  "Torches": "torch",
  "Rope and Grapple": "rope_and_hook",
  "cloak (acts as a Buckler in close combat)": "buckler",
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
  // Phase 16: the source's own note says the Katana is the Dragon Sword; a plain Staff is a club
  // (the Tomb Guardians list prices it at 3 gc); "Shield/Buckler" is a 5 gc choice, taken as the shield.
  "Katana": "dragon_sword",
  "Staff": "club",
  "Cooking pot": "cooking_pot_helmet",
  "Throwing Daggers": "throwing_knives_stars",
  "Throwing Dagger": "throwing_knives_stars",
  "Cooking Pot": "cooking_pot_helmet",
  "Shield/Buckler": "shield",
  "Darksteel blade": "darksteel_blade",
  "Beastwhip (Packmaster or Apprentices only)": "beastwhip",
  "Thingcatcher (Packmaster or Apprentices only)": "thingcatcher",
  "Boar Spear (Aristocrat only)": "boar_spear",
  "Bone Helmet (Skink Priest only)": "bone_helmet",
  "Hedonist Whip (Heroes only)": "hedonist_whip",
  "Slaaneshi Man-Catcher (Whipmaster only)": "slaaneshi_man_catcher",
  "Shield of Sigmar (Heroes only)": "shield_of_sigmar",
  "Pebble (fixed, x1, included)": "pebble",
  // #66: exploration-chart reward names phrased as "a suit/brace/quiver of X", which never
  // normalised-match the catalogue's own singular item names.
  "Suit of Light Armour": "light_armour",
  "Suits of Light Armour": "light_armour",
  "Suit of Heavy Armour": "heavy_armour",
  "Suits of Heavy Armour": "heavy_armour",
  "Suit of Ithilmar Armour": "ithilmar_armour",
  "Brace of Pistols": "pistol",
  "Brace of Duelling Pistols": "duelling_pistol",
  "Flasks of Superior Blackpowder": "superior_blackpowder",
  "Quiver of Hunting Arrows": "hunting_arrows",
  // Same "take the plain option" reading already used for "Shield/Buckler" above.
  "Shields or Bucklers (choose which)": "shield",
  "Double-handed axes": "double_handed_weapon",
  "Gromril Axe": "gromril_axe",
  "Gromril Hammer": "gromril_hammer",
  "Double-handed Gromril Axe": "gromril_great_axe",
  // #66: the Jewelsmith/Alchemist's Laboratory/Fighting Arena treasures now have real (if some
  // unpriced) catalogue entries — see the bottom of data/items/misc.ts.
  "Quartz stones": "quartz_stones",
  "Amethyst": "amethyst",
  "Necklace": "jewelsmith_necklace",
  "Ruby": "ruby",
  "Alchemist's notebook": "alchemists_notebook",
  "Training manual": "training_manual",
};

/**
 * Equipment-list lines that are a set of items bought together (the Pit Fighters' fighting styles).
 * The builder adds every component; the list price is charged once, on the first component. Where
 * the style offers a choice ("Trident or Javelins"), the first option is taken and the player may
 * swap it afterwards.
 */
export const EQUIPMENT_BUNDLES: Record<string, string[]> = {
  "Chaos Style — Helmet; Dagger; Flail; Shield; Light armour": ["helmet", "dagger", "flail", "shield", "light_armour"],
  "Empire Style — Helmet; Dagger; Double-handed Weapon; Light armour": ["helmet", "dagger", "double_handed_weapon", "light_armour"],
  "Orc Style — Helmet; Dagger; Axe; Shield": ["helmet", "dagger", "axe", "shield"],
  "Undead Style — Helmet; Dagger; Spiked Gauntlet; Sword": ["helmet", "dagger", "spiked_gauntlet", "sword"],
  "Skink Style — Helmet; Dagger; Trident or Javelins; Net or Buckler": ["helmet", "dagger", "trident", "net"],
  "Witch Elf Style — Helmet; Dagger; 2 x Sword or Spear & Net": ["helmet", "dagger", "sword", "sword"],
};

/** The component item ids of a bundle line, or undefined when the name is not a bundle. */
export function equipmentBundle(name: string): Item[] | undefined {
  const ids = EQUIPMENT_BUNDLES[name.trim()];
  if (!ids) return undefined;
  return ids.map((id) => BY_ID.get(id)).filter((i): i is Item => i !== undefined);
}

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
  return equipmentListNames().filter((name) => resolveEquipmentName(name) === undefined && equipmentBundle(name) === undefined);
}
