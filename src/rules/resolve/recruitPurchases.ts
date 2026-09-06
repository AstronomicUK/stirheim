// Purchases made at recruitment (Phase 17, warband audit A17): mutations for the Possessed, Mutants,
// Court heroes, Marauder Mutants and Clan Moulder Rat Ogres; Blessings of Nurgle for Tainted Ones.
// The rules for both say the first is bought at the listed price and second and subsequent ones on
// the same model cost double, and that none may be bought after recruitment.

import { findItem } from "../data/items";
import { ITEM_RESTRICTIONS, warbandInAny } from "../data/itemRules";
import type { Item } from "../types/items";

/** Items a warrior of this unit type may buy when hired, in catalogue order. */
export function recruitPurchaseOptions(warbandTemplateId: string, unitTemplateId: string): Item[] {
  const out: Item[] = [];
  for (const [id, rule] of Object.entries(ITEM_RESTRICTIONS)) {
    if (!rule.recruitOnly) continue;
    if (rule.onlyWarbands && !warbandInAny(warbandTemplateId, rule.onlyWarbands)) continue;
    if (rule.onlyUnits && !rule.onlyUnits.includes(unitTemplateId)) continue;
    const item = findItem(id);
    if (item) out.push(item);
  }
  return out;
}

/** What the nth (0-based) recruit-time purchase for one model costs: the listed price, then double. */
export function recruitPurchasePrice(item: Item, index: number): number {
  const base = item.price.base ?? 0;
  return index === 0 ? base : base * 2;
}

/** Total for a set of purchases on one model, cheapest first so the doubling costs the least. */
export function recruitPurchasesTotal(items: readonly Item[]): { total: number; lines: { item: Item; price: number }[] } {
  const sorted = [...items].sort((a, b) => (b.price.base ?? 0) - (a.price.base ?? 0));
  const lines = sorted.map((item, i) => ({ item, price: recruitPurchasePrice(item, i) }));
  return { total: lines.reduce((n, l) => n + l.price, 0), lines };
}
