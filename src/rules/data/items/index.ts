// Full equipment catalogue (shopping/inventory view) — every "###" entry in
// rules/02-weapons-armour-equipment.md across all six sections, one file per category.

import { SCENARIO_REWARD_ITEMS } from "./scenarioRewards";
import type { Item, ItemCategory } from "../../types/items";
import { MELEE_ITEMS } from "./melee";
import { MISSILE_ITEMS } from "./missile";
import { BLACKPOWDER_ITEMS } from "./blackpowder";
import { ARMOUR_ITEMS } from "./armour";
import { MISC_ITEMS } from "./misc";
import { ANIMAL_ITEMS } from "./animals";
import { MATERIAL_VARIANT_ITEMS } from "./materialVariants";
import { WARBAND_SPECIAL_ITEMS } from "./warbandSpecial";

export { MELEE_ITEMS, MISSILE_ITEMS, BLACKPOWDER_ITEMS, ARMOUR_ITEMS, MISC_ITEMS, ANIMAL_ITEMS, MATERIAL_VARIANT_ITEMS, WARBAND_SPECIAL_ITEMS };

export const ITEMS: Item[] = [
  ...MELEE_ITEMS,
  ...MISSILE_ITEMS,
  ...BLACKPOWDER_ITEMS,
  ...ARMOUR_ITEMS,
  ...MISC_ITEMS,
  ...ANIMAL_ITEMS,
  ...WARBAND_SPECIAL_ITEMS,
  ...MATERIAL_VARIANT_ITEMS,
  ...SCENARIO_REWARD_ITEMS,
];

/** The catalogue as offered for purchase: superseded entries (generic gromril / ithilmar weapon) left out. */
export const SHOP_ITEMS: Item[] = ITEMS.filter((item) => !item.superseded && !item.scenarioRewardOnly);

const BY_ID = new Map(ITEMS.map((item) => [item.id, item]));

export function findItem(id: string): Item | undefined {
  return BY_ID.get(id);
}

export function itemsByCategory(category: ItemCategory): Item[] {
  return ITEMS.filter((item) => item.category === category);
}

export * from "./aliases";
