import { describe, expect, it } from "vitest";
import { findItem } from "../../data/items";
import type { Item } from "../../types/items";
import { defaultCampaignHouseRules } from "../../types/roster";
import { RulesError } from "../errors";
import {
  buyItem,
  canSearch,
  canSellWyrdstone,
  isHalfPriceEligible,
  itemPrice,
  markSearch,
  markSold,
  moveItem,
  newTradePhaseState,
  rareSearch,
  searchesRemaining,
  sellItem,
  type InventoryLocation,
} from "../trading";
import { makeWarband } from "./fixtures";

function item(id: string): Item {
  const found = findItem(id);
  if (!found) throw new Error(`fixture item ${id} missing from catalogue`);
  return found;
}

const halfOn = defaultCampaignHouseRules();
const halfOff = { ...defaultCampaignHouseRules(), halfPriceArmour: false };

function code(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (e) {
    return (e as RulesError).code;
  }
  return undefined;
}

describe("itemPrice", () => {
  it("halves armour when the house rule is on", () => {
    expect(itemPrice(item("light_armour"), halfOn)).toMatchObject({ base: 20, total: 10, halfPriceApplied: true });
    expect(itemPrice(item("gromril_armour"), halfOn)).toMatchObject({ base: 150, total: 75, halfPriceApplied: true });
    expect(itemPrice(item("heavy_armour"), halfOn)).toMatchObject({ base: 50, total: 25, halfPriceApplied: true });
  });

  it("rounds down", () => {
    const odd: Item = { ...item("light_armour"), id: "test_plate", name: "Test Plate", price: { base: 25, text: "25 gc" } };
    expect(itemPrice(odd, halfOn).total).toBe(12);
  });

  it("leaves shields, bucklers and helmets at full price", () => {
    expect(itemPrice(item("shield"), halfOn)).toMatchObject({ base: 5, total: 5, halfPriceApplied: false });
    expect(itemPrice(item("buckler"), halfOn)).toMatchObject({ base: 5, total: 5, halfPriceApplied: false });
    expect(itemPrice(item("helmet"), halfOn)).toMatchObject({ base: 10, total: 10, halfPriceApplied: false });
    expect(isHalfPriceEligible(item("shield"))).toBe(false);
    expect(isHalfPriceEligible(item("light_armour"))).toBe(true);
    expect(isHalfPriceEligible(item("sword"))).toBe(false);
  });

  it("charges full price with the house rule off", () => {
    expect(itemPrice(item("light_armour"), halfOff)).toMatchObject({ base: 20, total: 20, halfPriceApplied: false });
    expect(itemPrice(item("gromril_armour"), halfOff)).toMatchObject({ total: 150, halfPriceApplied: false });
    expect(itemPrice(item("light_armour"), halfOff).text).toBe("20 gc");
  });

  it("never halves non-armour", () => {
    expect(itemPrice(item("sword"), halfOn)).toMatchObject({ base: 10, total: 10, halfPriceApplied: false });
  });

  it("adds the rolled dice for variable-priced items", () => {
    const ale = item("bugmans_ale");
    expect(ale.price).toMatchObject({ base: 50, dice: "3D6" });
    const q = itemPrice(ale, halfOn, 11);
    expect(q).toMatchObject({ base: 50, total: 61, halfPriceApplied: false });
    expect(q.text).toContain("61 gc");
  });

  it("returns an unknown total until the dice are rolled", () => {
    const q = itemPrice(item("bugmans_ale"), halfOn);
    expect(q.total).toBeNull();
    expect(q.base).toBe(50);
    expect(q.text).toContain("3D6");
  });

  it("rejects a dice total outside the expression's range", () => {
    expect(code(() => itemPrice(item("bugmans_ale"), halfOn, 2))).toBe("trading.diceOutOfRange");
    expect(code(() => itemPrice(item("bugmans_ale"), halfOn, 19))).toBe("trading.diceOutOfRange");
    expect(itemPrice(item("bugmans_ale"), halfOn, 3).total).toBe(53);
    expect(itemPrice(item("bugmans_ale"), halfOn, 18).total).toBe(68);
  });

  it("passes through items with no listed cost", () => {
    const free: Item = { ...item("sword"), id: "free_thing", price: { base: null, text: "Not listed" } };
    expect(itemPrice(free, halfOn)).toEqual({ base: null, total: null, halfPriceApplied: false, text: "Not listed" });
  });
});

describe("rareSearch", () => {
  it("common items are always available", () => {
    expect(rareSearch(item("sword"), 2)).toEqual({ available: true, needed: null });
  });

  it("rare items need roll >= rarity", () => {
    const gromril = item("gromril_armour"); // Rare 11
    expect(rareSearch(gromril, 10)).toEqual({ available: false, needed: 11 });
    expect(rareSearch(gromril, 11)).toEqual({ available: true, needed: 11 });
    expect(rareSearch(gromril, 12)).toEqual({ available: true, needed: 11 });
  });

  it("special availability without a number cannot be rolled for", () => {
    const special: Item = { ...item("sword"), availability: { kind: "special", text: "Reward only" } };
    expect(rareSearch(special, 12)).toEqual({ available: false, needed: null });
  });
});

const STASH: InventoryLocation = { kind: "stash" };
const CAPTAIN: InventoryLocation = { kind: "hero", id: "captain" };
const CHAMPION: InventoryLocation = { kind: "hero", id: "champion" };
const WARRIORS: InventoryLocation = { kind: "henchmanGroup", id: "group-1" };

function qty(items: { itemId: string | null; quantity: number }[], id: string): number {
  return items.filter((i) => i.itemId === id).reduce((s, i) => s + i.quantity, 0);
}

describe("buyItem", () => {
  it("adds to the stash and pays", () => {
    const wb = makeWarband();
    const { value, events } = buyItem(wb, item("shield"), 5, STASH, 2);
    expect(value.gold).toBe(90);
    expect(value.stash).toEqual([{ itemId: "shield", quantity: 2 }]);
    expect(events[0].kind).toBe("item.bought");
    expect(events[0].message).toBe("Bought Shield x2 for 10 gc (5 gc each) into the stash");
  });

  it("merges into an existing stack on a hero", () => {
    const wb = makeWarband();
    const { value, events } = buyItem(wb, item("dagger"), 2, CAPTAIN);
    const captain = value.heroes.find((h) => h.id === "captain")!;
    expect(captain.equipment).toEqual([
      { itemId: "dagger", quantity: 2 },
      { itemId: "sword", quantity: 1 },
    ]);
    expect(value.gold).toBe(98);
    expect(events[0].subjectId).toBe("captain");
    expect(events[0].message).toBe("Bought Dagger x1 for 2 gc into Test Captain");
  });

  it("equips a henchman group", () => {
    const { value } = buyItem(makeWarband(), item("light_armour"), 10, WARRIORS, 2);
    expect(qty(value.henchmenGroups[0].equipment, "light_armour")).toBe(2);
    expect(value.gold).toBe(80);
  });

  it("refuses when gold is short or input is invalid", () => {
    const wb = makeWarband({ gold: 9 });
    expect(code(() => buyItem(wb, item("shield"), 5, STASH, 2))).toBe("trading.insufficientGold");
    expect(code(() => buyItem(wb, item("shield"), 5, STASH, 0))).toBe("trading.invalidQuantity");
    expect(code(() => buyItem(wb, item("shield"), -1, STASH))).toBe("trading.invalidPrice");
    expect(code(() => buyItem(wb, item("shield"), 5, { kind: "hero", id: "nobody" }))).toBe("trading.unknownHero");
    expect(code(() => buyItem(wb, item("shield"), 5, { kind: "henchmanGroup", id: "nobody" }))).toBe(
      "trading.unknownHenchmanGroup",
    );
  });

  it("allows a free item", () => {
    const { value } = buyItem(makeWarband({ gold: 0 }), item("dagger"), 0, STASH);
    expect(value.gold).toBe(0);
    expect(value.stash).toEqual([{ itemId: "dagger", quantity: 1 }]);
  });
});

describe("sellItem", () => {
  it("pays half the listed price, rounded down, and removes the item", () => {
    const wb = makeWarband({ stash: [{ itemId: "sword", quantity: 1 }] });
    const { value, events } = sellItem(wb, STASH, "sword", 1, 15);
    expect(value.gold).toBe(107);
    expect(value.stash).toEqual([]);
    expect(events[0].kind).toBe("item.sold");
    expect(events[0].message).toBe("Sold Sword x1 from the stash for 7 gc (half of 15 gc each)");
  });

  it("sells part of a stack from a hero", () => {
    const wb = makeWarband();
    const { value } = sellItem(wb, CAPTAIN, "sword", 1, 10);
    expect(value.gold).toBe(105);
    const captain = value.heroes.find((h) => h.id === "captain")!;
    expect(captain.equipment).toEqual([{ itemId: "dagger", quantity: 1 }]);
  });

  it("refuses to sell what is not held", () => {
    const wb = makeWarband();
    expect(code(() => sellItem(wb, STASH, "sword", 1, 10))).toBe("trading.notEnoughItems");
    expect(code(() => sellItem(wb, WARRIORS, "dagger", 3, 2))).toBe("trading.notEnoughItems");
    expect(code(() => sellItem(wb, CAPTAIN, "sword", 1, -5))).toBe("trading.invalidPrice");
  });
});

describe("moveItem", () => {
  it("moves between hero and stash, merging stacks", () => {
    const wb = makeWarband({ stash: [{ itemId: "dagger", quantity: 1 }] });
    const { value, events } = moveItem(wb, WARRIORS, STASH, "dagger", 1);
    expect(value.henchmenGroups[0].equipment).toEqual([{ itemId: "dagger", quantity: 1 }]);
    expect(value.stash).toEqual([{ itemId: "dagger", quantity: 2 }]);
    expect(value.gold).toBe(100);
    expect(events[0].kind).toBe("item.moved");
    expect(events[0].message).toBe("Moved Dagger x1 from Warriors to the stash");
  });

  it("moves between two heroes", () => {
    const { value } = moveItem(makeWarband(), CAPTAIN, CHAMPION, "sword");
    expect(qty(value.heroes[0].equipment, "sword")).toBe(0);
    expect(qty(value.heroes[1].equipment, "sword")).toBe(1);
  });

  it("rejects same location, missing items and unknown destinations", () => {
    const wb = makeWarband();
    expect(code(() => moveItem(wb, CAPTAIN, CAPTAIN, "sword"))).toBe("trading.sameLocation");
    expect(code(() => moveItem(wb, STASH, STASH, "sword"))).toBe("trading.sameLocation");
    expect(code(() => moveItem(wb, CHAMPION, STASH, "sword"))).toBe("trading.notEnoughItems");
    expect(code(() => moveItem(wb, CAPTAIN, { kind: "hero", id: "ghost" }, "sword"))).toBe("trading.unknownHero");
  });
});

describe("round trips and immutability", () => {
  function totals(wb: ReturnType<typeof makeWarband>) {
    const all = [...wb.stash, ...wb.heroes.flatMap((h) => h.equipment), ...wb.henchmenGroups.flatMap((g) => g.equipment)];
    const counts: Record<string, number> = {};
    for (const i of all) if (i.itemId) counts[i.itemId] = (counts[i.itemId] ?? 0) + i.quantity;
    return counts;
  }

  it("buy then sell at the same listed price returns half the gold and no item", () => {
    const wb = makeWarband();
    const bought = buyItem(wb, item("light_armour"), 20, STASH).value;
    const sold = sellItem(bought, STASH, "light_armour", 1, 20).value;
    expect(sold.gold).toBe(90);
    expect(totals(sold)).toEqual(totals(wb));
  });

  it("moving around the warband preserves item totals", () => {
    const wb = makeWarband();
    const start = totals(wb);
    let cur = moveItem(wb, CAPTAIN, STASH, "sword").value;
    cur = moveItem(cur, STASH, WARRIORS, "sword").value;
    cur = moveItem(cur, WARRIORS, CHAMPION, "sword").value;
    cur = moveItem(cur, CHAMPION, CAPTAIN, "sword").value;
    expect(totals(cur)).toEqual(start);
    expect(cur.heroes[0].equipment).toEqual(wb.heroes[0].equipment);
    expect(cur.gold).toBe(wb.gold);
  });

  it("never mutates the input warband", () => {
    const wb = makeWarband({ stash: [{ itemId: "shield", quantity: 1 }] });
    const before = structuredClone(wb);
    buyItem(wb, item("shield"), 5, STASH, 3);
    buyItem(wb, item("helmet"), 10, CAPTAIN);
    sellItem(wb, CAPTAIN, "sword", 1, 10);
    sellItem(wb, STASH, "shield", 1, 5);
    moveItem(wb, CAPTAIN, WARRIORS, "sword");
    moveItem(wb, WARRIORS, STASH, "dagger", 2);
    expect(wb).toEqual(before);
  });

  it("returned objects do not share inventory arrays with the input", () => {
    const wb = makeWarband();
    const { value } = buyItem(wb, item("shield"), 5, CAPTAIN);
    expect(value.heroes[0].equipment).not.toBe(wb.heroes[0].equipment);
    expect(value.heroes[1]).toBe(wb.heroes[1]); // untouched heroes may be shared
  });
});

describe("once-per-phase helpers", () => {
  it("searchesRemaining", () => {
    expect(searchesRemaining(4, 0)).toBe(4);
    expect(searchesRemaining(4, 3)).toBe(1);
    expect(searchesRemaining(2, 5)).toBe(0);
  });

  it("tracks wyrdstone sale and hero searches immutably", () => {
    const s0 = newTradePhaseState();
    expect(canSellWyrdstone(s0)).toBe(true);
    expect(canSearch(s0, "captain")).toBe(true);

    const s1 = markSold(s0);
    expect(canSellWyrdstone(s1)).toBe(false);
    expect(canSellWyrdstone(s0)).toBe(true);

    const s2 = markSearch(s1, "captain");
    expect(canSearch(s2, "captain")).toBe(false);
    expect(canSearch(s2, "champion")).toBe(true);
    expect(canSearch(s1, "captain")).toBe(true);
    expect(s2).toEqual({ wyrdstoneSold: true, heroSearches: { captain: true } });
  });
});
