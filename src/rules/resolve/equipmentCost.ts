// Equipment-list cost strings — parsing the free-text `EquipmentListItem.cost` values in
// data/warbandTemplates ("10 gc", "1st free/2 gc", "15 gc (30 for a brace)", "3 times the cost")
// into something the warband builder can add up.
//
// Rule judgements:
//   - "1st free" (daggers, Sharp Stuff) means one free per warrior; every further copy costs the
//     listed amount. Henchman groups get one free per model, since each member is a warrior.
//   - A brace is exactly two pistols bought together at the bracketed price. Buying more than two
//     prices whole braces at the brace price and any odd one at the single price.
//   - "3 times the cost" / "2 x price" (Gromril, Ithilmar) multiply the price of a *base* weapon the
//     player has not chosen yet, so the line cost is unknown until the UI asks for it (null).
//   - "+15 gc" (Dark Elf Blade "weapon upgrade") is a surcharge on top of a weapon bought separately;
//     it is treated as a fixed 15 gc line of its own.
//   - "wt" is warpstone tokens (Clan Moulder); the whole warband trades in it, so amounts add up like
//     gold within that warband. `currency` is reported for the UI to label.
//   - Bracketed restrictions such as "(Bergjaeger only)" are ignored for pricing.

export type EquipmentCostKind = "fixed" | "firstFree" | "free" | "included" | "multiplier" | "unknown";

export type EquipmentCurrency = "gc" | "wt";

export interface EquipmentCost {
  kind: EquipmentCostKind;
  /** Price of one item (the price after the free one for `firstFree`); 0 for free/included; null when it cannot be known from the string. */
  amount: number | null;
  currency: EquipmentCurrency;
  /** Price of a brace (a pair) when the string offers one, e.g. "15 gc (30 for a brace)" -> 30. */
  braceAmount?: number;
  /** For `multiplier`: the factor applied to the base weapon's price ("3 times the cost" -> 3). */
  multiplier?: number;
  /** The source string, trimmed, for display. */
  text: string;
}

const FREE_RE = /^free!?$/i;
const INCLUDED_RE = /^included$/i;
const FIRST_FREE_RE = /^1st\s*free\s*\/\s*(\d+)\s*(gc|wt)?\b/i;
const MULTIPLIER_RE = /^(\d+)\s*(?:x|times)\s*(?:the\s+)?(?:cost|price)\b/i;
const FIXED_RE = /^\+?(\d+)\s*(gc|wt)?\b(.*)$/is;
const BRACE_RE = /(\d+)\s*(?:gc|wt)?\s*(?:for\s+)?(?:a\s+)?brace\b/i;

/** Parse one equipment-list cost string. Never throws; unrecognised text comes back as kind "unknown". */
export function parseEquipmentCost(cost: string): EquipmentCost {
  const text = cost.trim();

  if (FREE_RE.test(text)) return { kind: "free", amount: 0, currency: "gc", text };
  if (INCLUDED_RE.test(text)) return { kind: "included", amount: 0, currency: "gc", text };

  const firstFree = FIRST_FREE_RE.exec(text);
  if (firstFree) {
    return { kind: "firstFree", amount: Number(firstFree[1]), currency: currencyOf(firstFree[2]), text };
  }

  const multiplier = MULTIPLIER_RE.exec(text);
  if (multiplier) {
    return { kind: "multiplier", amount: null, currency: "gc", multiplier: Number(multiplier[1]), text };
  }

  const fixed = FIXED_RE.exec(text);
  if (fixed) {
    const result: EquipmentCost = { kind: "fixed", amount: Number(fixed[1]), currency: currencyOf(fixed[2]), text };
    const brace = BRACE_RE.exec(fixed[3]);
    if (brace) result.braceAmount = Number(brace[1]);
    return result;
  }

  return { kind: "unknown", amount: null, currency: "gc", text };
}

function currencyOf(unit: string | undefined): EquipmentCurrency {
  return unit?.toLowerCase() === "wt" ? "wt" : "gc";
}

/**
 * Total for `quantity` copies of an item at this cost, for one warrior. `alreadyOwnedFree` says the
 * warrior has already taken their free copy of a "1st free" item (another stack of the same thing),
 * so every copy in this line is charged. Returns null when the price cannot be known from the list
 * (multiplier / unknown kinds); the UI should ask the player for a figure.
 */
export function equipmentLineCost(cost: EquipmentCost, quantity: number, alreadyOwnedFree: boolean): number | null {
  if (quantity <= 0) return 0;
  switch (cost.kind) {
    case "free":
    case "included":
      return 0;
    case "firstFree": {
      const amount = cost.amount ?? 0;
      const charged = alreadyOwnedFree ? quantity : quantity - 1;
      return amount * charged;
    }
    case "fixed": {
      const amount = cost.amount ?? 0;
      if (cost.braceAmount !== undefined && quantity >= 2) {
        const braces = Math.floor(quantity / 2);
        return braces * cost.braceAmount + (quantity % 2) * amount;
      }
      return amount * quantity;
    }
    case "multiplier":
    case "unknown":
      return null;
  }
}
