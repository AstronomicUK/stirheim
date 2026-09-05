// Trading resolvers — prices, rare-item searches, buying, selling and moving equipment, and the
// once-per-phase bookkeeping of the post battle sequence (rulebook Trading section; data in
// data/campaign/trading and data/items).

import type { CampaignHouseRules, Resolution, ResolutionEvent, RosterItem, RosterWarband } from "../types/roster";
import type { Item } from "../types/items";
import { rareItemAvailable, sellPrice } from "../data/campaign/trading";
import { findItem } from "../data/items";
import { minMax } from "./dice";
import { RulesError } from "./errors";

// ---- Prices ----

export interface ItemPriceQuote {
  /** Listed fixed part of the price, null when the item has no listed cost. */
  base: number | null;
  /** What the warband pays, null when it cannot be known yet (no listed cost, or dice not rolled). */
  total: number | null;
  halfPriceApplied: boolean;
  /** Plain-English line for the shop UI. */
  text: string;
}

/**
 * Half-price armour house rule exclusions. Tom's group: "Half price armour cost (excluding
 * shields and helmets), rounding down" (docs/PLANNING.md, House rules). Bucklers are small
 * shields so they are excluded too. Matched on id and name so future catalogue entries behave.
 */
const HALF_PRICE_EXCLUSIONS = ["shield", "buckler", "helmet", "helm", "pavise"];

export function isHalfPriceEligible(item: Item): boolean {
  if (item.category !== "armour") return false;
  const haystack = `${item.id} ${item.name}`.toLowerCase();
  return !HALF_PRICE_EXCLUSIONS.some((word) => haystack.includes(word));
}

/**
 * Price of one item. `rolledDice` is the total of `item.price.dice` as rolled by the player and is
 * required for variable-priced items; it is validated against the expression's range. The
 * half-price armour rule halves the whole cost (base plus any dice) and rounds down.
 */
export function itemPrice(item: Item, houseRules: CampaignHouseRules, rolledDice?: number): ItemPriceQuote {
  const base = item.price.base;
  if (base === null) return { base, total: null, halfPriceApplied: false, text: item.price.text };

  let variable = 0;
  if (item.price.dice) {
    if (rolledDice === undefined) {
      return { base, total: null, halfPriceApplied: false, text: `${item.price.text} (roll ${item.price.dice})` };
    }
    const range = minMax(item.price.dice);
    if (!Number.isInteger(rolledDice) || rolledDice < range.min || rolledDice > range.max) {
      throw new RulesError(
        "trading.diceOutOfRange",
        `${item.name}: ${item.price.dice} must total ${range.min}-${range.max}, got ${rolledDice}`,
      );
    }
    variable = rolledDice;
  }

  const listed = base + variable;
  const halfPriceApplied = houseRules.halfPriceArmour && isHalfPriceEligible(item);
  const total = halfPriceApplied ? Math.floor(listed / 2) : listed;

  const parts: string[] = [];
  if (item.price.dice) parts.push(`${base} + ${variable} rolled`);
  if (halfPriceApplied) parts.push(`half price armour, from ${listed} gc`);
  const text = parts.length ? `${total} gc (${parts.join("; ")})` : `${total} gc`;
  return { base, total, halfPriceApplied, text };
}

// ---- Rare items ----

/**
 * Whether a hero's 2D6 search finds the item. Common items are always available. Items with a
 * rarity number succeed on roll >= rarity. An availability with no number ("special") cannot be
 * resolved by a roll, so it is reported unavailable with `needed: null` and the UI should show
 * `item.availability.text`.
 */
export function rareSearch(item: Item, roll2d6: number): { available: boolean; needed: number | null } {
  if (item.availability.kind === "common") return { available: true, needed: null };
  const needed = item.availability.rarity;
  if (needed === undefined) return { available: false, needed: null };
  return { available: rareItemAvailable(roll2d6, needed), needed };
}

// ---- Inventories ----

export type InventoryLocation =
  | { kind: "stash" }
  | { kind: "hero"; id: string }
  | { kind: "henchmanGroup"; id: string };

function describeLocation(warband: RosterWarband, loc: InventoryLocation): string {
  switch (loc.kind) {
    case "stash":
      return "the stash";
    case "hero":
      return warband.heroes.find((h) => h.id === loc.id)?.name ?? `hero ${loc.id}`;
    case "henchmanGroup":
      return warband.henchmenGroups.find((g) => g.id === loc.id)?.name ?? `henchman group ${loc.id}`;
  }
}

function itemName(itemId: string): string {
  return findItem(itemId)?.name ?? itemId;
}

function assertQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new RulesError("trading.invalidQuantity", `Quantity must be a whole number of at least 1 (got ${quantity})`);
  }
}

/** Returns a new list with `quantity` of `itemId` merged into any existing plain stack of the same item. */
function addStack(items: RosterItem[], itemId: string, quantity: number): RosterItem[] {
  const idx = items.findIndex((i) => i.itemId === itemId && !i.customName);
  if (idx === -1) return [...items, { itemId, quantity }];
  return items.map((i, n) => (n === idx ? { ...i, quantity: i.quantity + quantity } : i));
}

/** Returns a new list with `quantity` of `itemId` removed, dropping emptied stacks; throws if short. */
function removeStack(items: RosterItem[], itemId: string, quantity: number, where: string): RosterItem[] {
  const held = items.filter((i) => i.itemId === itemId).reduce((sum, i) => sum + i.quantity, 0);
  if (held < quantity) {
    throw new RulesError(
      "trading.notEnoughItems",
      `${where} has ${held} x ${itemName(itemId)}, cannot remove ${quantity}`,
    );
  }
  let remaining = quantity;
  const out: RosterItem[] = [];
  for (const stack of items) {
    if (stack.itemId !== itemId || remaining === 0) {
      out.push(stack);
      continue;
    }
    const take = Math.min(stack.quantity, remaining);
    remaining -= take;
    if (stack.quantity > take) out.push({ ...stack, quantity: stack.quantity - take });
  }
  return out;
}

function readInventory(warband: RosterWarband, loc: InventoryLocation): RosterItem[] {
  switch (loc.kind) {
    case "stash":
      return warband.stash;
    case "hero": {
      const hero = warband.heroes.find((h) => h.id === loc.id);
      if (!hero) throw new RulesError("trading.unknownHero", `No hero with id ${loc.id}`);
      return hero.equipment;
    }
    case "henchmanGroup": {
      const group = warband.henchmenGroups.find((g) => g.id === loc.id);
      if (!group) throw new RulesError("trading.unknownHenchmanGroup", `No henchman group with id ${loc.id}`);
      return group.equipment;
    }
  }
}

function writeInventory(warband: RosterWarband, loc: InventoryLocation, items: RosterItem[]): RosterWarband {
  switch (loc.kind) {
    case "stash":
      return { ...warband, stash: items };
    case "hero":
      return { ...warband, heroes: warband.heroes.map((h) => (h.id === loc.id ? { ...h, equipment: items } : h)) };
    case "henchmanGroup":
      return {
        ...warband,
        henchmenGroups: warband.henchmenGroups.map((g) => (g.id === loc.id ? { ...g, equipment: items } : g)),
      };
  }
}

function sameLocation(a: InventoryLocation, b: InventoryLocation): boolean {
  if (a.kind !== b.kind) return false;
  return a.kind === "stash" || a.id === (b as { id: string }).id;
}

/**
 * Buy `quantity` of `item` at `price` gold each (the agreed unit price, normally from itemPrice)
 * and place them in `destination`. Hired swords cannot receive purchases (their kit is fixed).
 */
export function buyItem(
  warband: RosterWarband,
  item: Item,
  price: number,
  destination: InventoryLocation,
  quantity = 1,
): Resolution<RosterWarband> {
  assertQuantity(quantity);
  if (!Number.isInteger(price) || price < 0) {
    throw new RulesError("trading.invalidPrice", `Price must be a whole number of gold crowns (got ${price})`);
  }
  const cost = price * quantity;
  if (cost > warband.gold) {
    throw new RulesError("trading.insufficientGold", `${item.name} x${quantity} costs ${cost} gc but the warband has ${warband.gold} gc`);
  }
  const inventory = readInventory(warband, destination);
  const next = writeInventory({ ...warband, gold: warband.gold - cost }, destination, addStack(inventory, item.id, quantity));
  const each = quantity > 1 ? ` (${price} gc each)` : "";
  const event: ResolutionEvent = {
    kind: "item.bought",
    subjectId: destination.kind === "stash" ? undefined : destination.id,
    message: `Bought ${item.name} x${quantity} for ${cost} gc${each} into ${describeLocation(warband, destination)}`,
    data: { itemId: item.id, quantity, unitPrice: price, cost, destination },
  };
  return { value: next, events: [event] };
}

/**
 * Sell `quantity` of `itemId` from `from` for half the listed price each, rounded down. For
 * variable-priced items pass the basic cost only ("merchants are far better at haggling").
 */
export function sellItem(
  warband: RosterWarband,
  from: InventoryLocation,
  itemId: string,
  quantity = 1,
  listedBase: number,
): Resolution<RosterWarband> {
  assertQuantity(quantity);
  if (!Number.isInteger(listedBase) || listedBase < 0) {
    throw new RulesError("trading.invalidPrice", `Listed price must be a whole number of gold crowns (got ${listedBase})`);
  }
  const where = describeLocation(warband, from);
  const inventory = removeStack(readInventory(warband, from), itemId, quantity, where);
  const each = sellPrice(listedBase);
  const income = each * quantity;
  const next = writeInventory({ ...warband, gold: warband.gold + income }, from, inventory);
  const event: ResolutionEvent = {
    kind: "item.sold",
    subjectId: from.kind === "stash" ? undefined : from.id,
    message: `Sold ${itemName(itemId)} x${quantity} from ${where} for ${income} gc (half of ${listedBase} gc each)`,
    data: { itemId, quantity, listedBase, unitSale: each, income, from },
  };
  return { value: next, events: [event] };
}

/** Move `quantity` of `itemId` between two inventories in the same warband. */
export function moveItem(
  warband: RosterWarband,
  from: InventoryLocation,
  to: InventoryLocation,
  itemId: string,
  quantity = 1,
): Resolution<RosterWarband> {
  assertQuantity(quantity);
  if (sameLocation(from, to)) {
    throw new RulesError("trading.sameLocation", "Source and destination are the same inventory");
  }
  const fromName = describeLocation(warband, from);
  const toName = describeLocation(warband, to);
  const source = removeStack(readInventory(warband, from), itemId, quantity, fromName);
  const target = readInventory(warband, to); // validates the destination exists before we write
  let next = writeInventory(warband, from, source);
  next = writeInventory(next, to, addStack(target, itemId, quantity));
  const event: ResolutionEvent = {
    kind: "item.moved",
    subjectId: to.kind === "stash" ? undefined : to.id,
    message: `Moved ${itemName(itemId)} x${quantity} from ${fromName} to ${toName}`,
    data: { itemId, quantity, from, to },
  };
  return { value: next, events: [event] };
}

// ---- Once-per-phase bookkeeping ----

/** Rare-item searches a warband still has: one per eligible hero (those not taken out of action). */
export function searchesRemaining(heroesEligible: number, searchesUsed: number): number {
  return Math.max(0, heroesEligible - searchesUsed);
}

/** What has already happened this post-battle trading phase. */
export interface TradePhaseState {
  /** "Sell Wyrdstone. This can only be done once per post battle sequence." */
  wyrdstoneSold: boolean;
  /** heroId -> has this hero used their one rare-item roll. */
  heroSearches: Record<string, boolean>;
}

export function newTradePhaseState(): TradePhaseState {
  return { wyrdstoneSold: false, heroSearches: {} };
}

export function canSellWyrdstone(state: TradePhaseState): boolean {
  return !state.wyrdstoneSold;
}

export function canSearch(state: TradePhaseState, heroId: string): boolean {
  return !state.heroSearches[heroId];
}

export function markSearch(state: TradePhaseState, heroId: string): TradePhaseState {
  return { ...state, heroSearches: { ...state.heroSearches, [heroId]: true } };
}

export function markSold(state: TradePhaseState): TradePhaseState {
  return { ...state, wyrdstoneSold: true };
}
