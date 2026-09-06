// Prices and rarities that depend on the buyer (audit A2). The catalogue entry is rewritten for
// the shop: a Skink hero sees Black Lotus at 10 gc and Common, a Gunnery School officer sees a
// cheaper handgun, and the notes say why. Data in data/itemRules/pricing.ts.

import { findItem } from "../data/items";
import { itemPricing, warbandInAny, type PriceRule } from "../data/itemRules";
import type { Item } from "../types/items";
import type { RosterHero, RosterWarband } from "../types/roster";

export interface Buyer {
  unitTemplateId?: string;
  role?: "hero" | "henchman";
  /** The hero the item is for, when known (Chaos Armour's cost falls with experience). */
  hero?: RosterHero;
}

export interface EffectivePricing {
  /** The catalogue entry with price and availability replaced where a rule matched. */
  item: Item;
  /** Why the price or rarity differs from the listed one. */
  notes: string[];
  /** Bonus to this item's 2D6 rare roll from the rules (on top of the warband's own). */
  rareRollBonus: number;
  /** The gold is spent even when the rare roll fails (Familiar). */
  paidOnFailure: boolean;
  /** The item is won by a D6 roll equal to or under the buyer's Strength rather than a rare roll. */
  strengthHunt: { free: boolean } | null;
}

function ruleMatches(rule: PriceRule, warband: RosterWarband, buyer: Buyer): boolean {
  const w = rule.when;
  if (w.warbands && !warbandInAny(warband.warbandTemplateId, w.warbands)) return false;
  if (w.units && (!buyer.unitTemplateId || !w.units.includes(buyer.unitTemplateId))) return false;
  if (w.role && buyer.role !== w.role) return false;
  if (w.warbandHasUnits && !warband.henchmenGroups.some((g) => g.size > 0 && w.warbandHasUnits!.includes(g.unitTemplateId))) return false;
  return true;
}

/** The item as this buyer sees it. */
export function effectivePricing(item: Item, warband: RosterWarband, buyer: Buyer = {}, opts: { atCreation?: boolean } = {}): EffectivePricing {
  const pricing = itemPricing(item.id);
  const out: EffectivePricing = { item, notes: [], rareRollBonus: 0, paidOnFailure: Boolean(pricing?.paidOnFailure), strengthHunt: null };
  if (!pricing) return out;

  const rule = pricing.rules?.find((r) => ruleMatches(r, warband, buyer));
  if (rule) {
    let next: Item = { ...item };
    if (rule.price !== undefined) next = { ...next, price: { ...item.price, base: rule.price, text: item.price.dice ? `${rule.price} + ${item.price.dice} gc` : `${rule.price} gc` } };
    if (rule.rarity === "common") next = { ...next, availability: { kind: "common", restriction: item.availability.restriction, text: `Common${item.availability.restriction ? ` (${item.availability.restriction})` : ""}` } };
    else if (typeof rule.rarity === "number") next = { ...next, availability: { kind: "rare", rarity: rule.rarity, restriction: item.availability.restriction, text: `Rare ${rule.rarity}${item.availability.restriction ? ` (${item.availability.restriction})` : ""}` } };
    if (rule.rareRollBonus) out.rareRollBonus += rule.rareRollBonus;
    out.item = next;
    out.notes.push(rule.note);
  }

  switch (pricing.dynamic) {
    case "chaosArmour": {
      const xp = buyer.hero?.xp ?? 0;
      if (item.price.base !== null && xp > 0) {
        const price = Math.max(0, item.price.base - xp);
        out.item = { ...out.item, price: { ...out.item.price, base: price, text: `${price} gc` } };
        out.notes.push(`Chaos armour costs 1 gc less per experience point of the hero (${xp} xp): ${price} gc.`);
      }
      out.notes.push("Rarity: +1 to the roll for each enemy the hero took out of action in the previous battle (add it to the dice by hand).");
      break;
    }
    case "rhinox":
      out.notes.push("The rider adds his Strength to the rarity roll; on arrival he passes a Strength test or rolls on the injury chart (table rule).");
      break;
    case "familiar":
      out.notes.push("Only a spellcaster may look; the cost is paid whether or not the roll succeeds.");
      break;
    case "strengthHunt": {
      const free = Boolean(opts.atCreation && pricing.strengthHuntFreeAtCreationFor && warbandInAny(warband.warbandTemplateId, pricing.strengthHuntFreeAtCreationFor));
      out.strengthHunt = { free };
      out.notes.push(free ? "Bought at creation: no hunt roll needed for this warband." : "The hero pays and then rolls a D6: equal to or under his Strength and the cloak is his; the gold is spent either way.");
      break;
    }
    default:
      break;
  }
  return out;
}

/** Rare roll bonus the warband as a whole enjoys from what it owns: an Opulent Coach (+3), a Trade Wagon's Reputation. */
export function warbandRareRollBonus(warband: RosterWarband): { bonus: number; notes: string[] } {
  let bonus = 0;
  const notes: string[] = [];
  const everything = [...warband.stash, ...warband.heroes.filter((h) => h.status === "active").flatMap((h) => h.equipment), ...warband.henchmenGroups.flatMap((g) => g.equipment)];
  for (const entry of everything) {
    if (!entry.itemId) continue;
    const coach = itemPricing(entry.itemId)?.warbandRareRollBonus;
    if (coach) {
      bonus += coach;
      notes.push(`${findItem(entry.itemId)?.name ?? entry.itemId}: +${coach} to rare rolls.`);
      break;
    }
  }
  if (everything.some((e) => e.itemId === "trade_wagon") || warband.henchmenGroups.some((g) => g.unitTemplateId === "merchant_trade_wagon" && g.size > 0)) {
    const rareInStash = new Set(warband.stash.filter((e) => e.itemId && findItem(e.itemId)?.availability.kind === "rare").map((e) => e.itemId)).size;
    const reputation = Math.floor(rareInStash / 5);
    if (reputation > 0) {
      bonus += reputation;
      notes.push(`Trade Wagon Reputation: +${reputation} (${rareInStash} different rare items stored).`);
    }
  }
  return { bonus, notes };
}
