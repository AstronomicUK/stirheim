// Full equipment catalogue (shopping/inventory view) — every "###" entry in
// rules/02-weapons-armour-equipment.md across all six sections, one file per category.

import type { Item, ItemCategory } from "../../types/items";
import { MELEE_ITEMS } from "./melee";
import { MISSILE_ITEMS } from "./missile";
import { BLACKPOWDER_ITEMS } from "./blackpowder";
import { ARMOUR_ITEMS } from "./armour";
import { MISC_ITEMS } from "./misc";
import { ANIMAL_ITEMS } from "./animals";

export { MELEE_ITEMS, MISSILE_ITEMS, BLACKPOWDER_ITEMS, ARMOUR_ITEMS, MISC_ITEMS, ANIMAL_ITEMS };

export const ITEMS: Item[] = [
  ...MELEE_ITEMS,
  ...MISSILE_ITEMS,
  ...BLACKPOWDER_ITEMS,
  ...ARMOUR_ITEMS,
  ...MISC_ITEMS,
  ...ANIMAL_ITEMS,
];

const BY_ID = new Map(ITEMS.map((item) => [item.id, item]));

export function findItem(id: string): Item | undefined {
  return BY_ID.get(id);
}

export function itemsByCategory(category: ItemCategory): Item[] {
  return ITEMS.filter((item) => item.category === category);
}

export * from "./aliases";
