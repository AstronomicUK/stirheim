// Accessors for the item rules overlay. See ./types.ts for the shape and ./restrictions,
// ./pricing, ./effects for the data.

import { findItem } from "../items";
import { ITEM_EFFECTS } from "./effects";
import { ITEM_PRICING } from "./pricing";
import { ITEM_RESTRICTIONS } from "./restrictions";
import type { ItemEffect, ItemPricing, ItemRestriction, ItemRule } from "./types";

export type { ItemEffect, ItemPricing, ItemRestriction, ItemRule, PreBattleEffect, PriceRule } from "./types";
export { ITEM_EFFECTS, ITEM_PRICING, ITEM_RESTRICTIONS };
export { WARBAND_GROUPS, describeWarbandRefs, warbandInAny, warbandMatches } from "./warbandGroups";

const EMPTY: ItemRestriction = {};

/**
 * The restriction rules for an item, with the rulebook default folded in: miscellaneous equipment
 * is Heroes only unless the entry says otherwise. Unknown ids get the default for their category.
 */
export function itemRestriction(itemId: string): ItemRestriction {
  const own = ITEM_RESTRICTIONS[itemId] ?? EMPTY;
  const item = findItem(itemId);
  if (item?.category === "misc" && own.heroesOnly === undefined) return { ...own, heroesOnly: true };
  return own;
}

export function itemPricing(itemId: string): ItemPricing | undefined {
  return ITEM_PRICING[itemId];
}

export function itemEffect(itemId: string): ItemEffect | undefined {
  return ITEM_EFFECTS[itemId];
}

export function itemRule(itemId: string): ItemRule {
  return { restriction: itemRestriction(itemId), pricing: itemPricing(itemId), effect: itemEffect(itemId) };
}

/** Is this item used up (per battle or per use)? */
export function isConsumable(itemId: string): boolean {
  return itemEffect(itemId)?.consumable !== undefined;
}
