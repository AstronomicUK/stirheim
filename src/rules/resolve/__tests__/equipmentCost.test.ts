import { describe, expect, it } from "vitest";
import { WARBAND_TEMPLATES } from "../../data/warbandTemplates";
import { equipmentLineCost, parseEquipmentCost, type EquipmentCost } from "../equipmentCost";

type Expected = Partial<Omit<EquipmentCost, "text">> & { kind: EquipmentCost["kind"] };

/** Every distinct cost string in data/warbandTemplates at the time of writing (62), with what it should parse to. */
const CASES: [string, Expected][] = [
  // Fixed gold prices.
  ["10 gc", { kind: "fixed", amount: 10, currency: "gc" }],
  ["5 gc", { kind: "fixed", amount: 5 }],
  ["15 gc", { kind: "fixed", amount: 15 }],
  ["3 gc", { kind: "fixed", amount: 3 }],
  ["20 gc", { kind: "fixed", amount: 20 }],
  ["25 gc", { kind: "fixed", amount: 25 }],
  ["50 gc", { kind: "fixed", amount: 50 }],
  ["35 gc", { kind: "fixed", amount: 35 }],
  ["30 gc", { kind: "fixed", amount: 30 }],
  ["2 gc", { kind: "fixed", amount: 2 }],
  ["200 gc", { kind: "fixed", amount: 200 }],
  ["40 gc", { kind: "fixed", amount: 40 }],
  ["75 gc", { kind: "fixed", amount: 75 }],
  ["80 gc", { kind: "fixed", amount: 80 }],
  ["7 gc", { kind: "fixed", amount: 7 }],
  ["8 gc", { kind: "fixed", amount: 8 }],
  ["45 gc", { kind: "fixed", amount: 45 }],
  ["90 gc", { kind: "fixed", amount: 90 }],
  ["150 gc", { kind: "fixed", amount: 150 }],
  ["60 gc", { kind: "fixed", amount: 60 }],
  ["12 gc", { kind: "fixed", amount: 12 }],
  ["70 gc", { kind: "fixed", amount: 70 }],
  ["300 gc", { kind: "fixed", amount: 300 }],
  ["100 gc", { kind: "fixed", amount: 100 }],
  ["65 gc", { kind: "fixed", amount: 65 }],
  ["175 gc", { kind: "fixed", amount: 175 }],
  // Fixed with a restriction in brackets.
  ["15 gc (Bergjaeger only)", { kind: "fixed", amount: 15, braceAmount: undefined }],
  // Surcharge (Dark Elf Blade weapon upgrade).
  ["+15 gc", { kind: "fixed", amount: 15 }],
  // Braces.
  ["15 gc (30 for a brace)", { kind: "fixed", amount: 15, braceAmount: 30 }],
  ["25 gc (50 for a brace)", { kind: "fixed", amount: 25, braceAmount: 50 }],
  ["30 gc (60 for a brace)", { kind: "fixed", amount: 30, braceAmount: 60 }],
  ["15 gc (30 gc for a brace)", { kind: "fixed", amount: 15, braceAmount: 30 }],
  ["20 gc (35 for a brace)", { kind: "fixed", amount: 20, braceAmount: 35 }],
  ["10 gc (20 for a brace)", { kind: "fixed", amount: 10, braceAmount: 20 }],
  ["30 gc (60 gc for a brace)", { kind: "fixed", amount: 30, braceAmount: 60 }],
  ["15 gc (30 for brace)", { kind: "fixed", amount: 15, braceAmount: 30 }],
  ["35 gc (70 for a brace)", { kind: "fixed", amount: 35, braceAmount: 70 }],
  ["35 gc (65 for a brace)", { kind: "fixed", amount: 35, braceAmount: 65 }],
  ["20 gc (40 for a brace)", { kind: "fixed", amount: 20, braceAmount: 40 }],
  ["15 gc (30 for Brace)", { kind: "fixed", amount: 15, braceAmount: 30 }],
  ["15 gc / 30 brace", { kind: "fixed", amount: 15, braceAmount: 30 }],
  ["25 gc (40 for a brace)", { kind: "fixed", amount: 25, braceAmount: 40 }],
  ["15 gc (30 gc for a Brace)", { kind: "fixed", amount: 15, braceAmount: 30 }],
  // Warpstone tokens (Clan Moulder).
  ["10 wt", { kind: "fixed", amount: 10, currency: "wt" }],
  ["20 wt", { kind: "fixed", amount: 20, currency: "wt" }],
  ["5 wt", { kind: "fixed", amount: 5, currency: "wt" }],
  ["3 wt", { kind: "fixed", amount: 3, currency: "wt" }],
  ["2 wt", { kind: "fixed", amount: 2, currency: "wt" }],
  ["15 wt", { kind: "fixed", amount: 15, currency: "wt" }],
  ["25 wt", { kind: "fixed", amount: 25, currency: "wt" }],
  ["50 wt", { kind: "fixed", amount: 50, currency: "wt" }],
  ["35 wt (70 for a brace)", { kind: "fixed", amount: 35, currency: "wt", braceAmount: 70 }],
  // First one free.
  ["1st free/2 gc", { kind: "firstFree", amount: 2, currency: "gc" }],
  ["1st free / 2 gc", { kind: "firstFree", amount: 2, currency: "gc" }],
  ["1st free/2 wt", { kind: "firstFree", amount: 2, currency: "wt" }],
  ["1st free/3 gc", { kind: "firstFree", amount: 3, currency: "gc" }],
  // Free and included.
  ["Free!", { kind: "free", amount: 0 }],
  ["included", { kind: "included", amount: 0 }],
  // Multipliers on a base weapon.
  ["3 times the cost", { kind: "multiplier", amount: null, multiplier: 3 }],
  ["2 x price", { kind: "multiplier", amount: null, multiplier: 2 }],
  ["3x cost", { kind: "multiplier", amount: null, multiplier: 3 }],
  ["3 x price", { kind: "multiplier", amount: null, multiplier: 3 }],
];

function everyCostStringInData(): string[] {
  const costs = new Set<string>();
  for (const warband of WARBAND_TEMPLATES) {
    for (const list of warband.equipmentLists) {
      for (const entry of [...list.meleeWeapons, ...list.missileWeapons, ...list.armour]) costs.add(entry.cost);
    }
  }
  return [...costs];
}

describe("parseEquipmentCost", () => {
  it.each(CASES)("parses %j", (text, expected) => {
    const parsed = parseEquipmentCost(text);
    expect(parsed.kind).toBe(expected.kind);
    expect(parsed.text).toBe(text);
    if ("amount" in expected) expect(parsed.amount).toBe(expected.amount);
    if ("currency" in expected) expect(parsed.currency).toBe(expected.currency);
    if ("braceAmount" in expected) expect(parsed.braceAmount).toBe(expected.braceAmount);
    if ("multiplier" in expected) expect(parsed.multiplier).toBe(expected.multiplier);
  });

  it("covers every distinct cost string in the warband templates", () => {
    const inData = everyCostStringInData();
    const covered = new Set(CASES.map(([text]) => text));
    const missing = inData.filter((c) => !covered.has(c));
    expect(missing).toEqual([]);
    for (const text of inData) expect(parseEquipmentCost(text).kind, text).not.toBe("unknown");
  });

  it("defaults to gold and trims", () => {
    expect(parseEquipmentCost("  10 gc ")).toMatchObject({ kind: "fixed", amount: 10, currency: "gc", text: "10 gc" });
    expect(parseEquipmentCost("FREE")).toMatchObject({ kind: "free", amount: 0 });
  });

  it("returns unknown for anything it cannot read", () => {
    expect(parseEquipmentCost("varies")).toEqual({ kind: "unknown", amount: null, currency: "gc", text: "varies" });
    expect(parseEquipmentCost("")).toMatchObject({ kind: "unknown", amount: null });
    expect(parseEquipmentCost("see below")).toMatchObject({ kind: "unknown" });
  });
});

describe("equipmentLineCost", () => {
  const dagger = parseEquipmentCost("1st free/2 gc");
  const sword = parseEquipmentCost("10 gc");
  const pistol = parseEquipmentCost("15 gc (30 for a brace)");
  const oddBrace = parseEquipmentCost("35 gc (65 for a brace)");
  const gromril = parseEquipmentCost("3 times the cost");
  const pebble = parseEquipmentCost("Free!");
  const included = parseEquipmentCost("included");

  it("gives the first copy free and charges the rest", () => {
    expect(equipmentLineCost(dagger, 1, false)).toBe(0);
    expect(equipmentLineCost(dagger, 2, false)).toBe(2);
    expect(equipmentLineCost(dagger, 3, false)).toBe(4);
  });

  it("charges every copy when the free one is already owned", () => {
    expect(equipmentLineCost(dagger, 1, true)).toBe(2);
    expect(equipmentLineCost(dagger, 2, true)).toBe(4);
  });

  it("multiplies fixed prices", () => {
    expect(equipmentLineCost(sword, 1, false)).toBe(10);
    expect(equipmentLineCost(sword, 3, false)).toBe(30);
    expect(equipmentLineCost(sword, 1, true)).toBe(10);
  });

  it("prices a brace as a pair and odd ones singly", () => {
    expect(equipmentLineCost(pistol, 1, false)).toBe(15);
    expect(equipmentLineCost(pistol, 2, false)).toBe(30);
    expect(equipmentLineCost(pistol, 3, false)).toBe(45);
    expect(equipmentLineCost(pistol, 4, false)).toBe(60);
    expect(equipmentLineCost(oddBrace, 2, false)).toBe(65);
    expect(equipmentLineCost(oddBrace, 3, false)).toBe(100);
  });

  it("is zero for free, included and empty lines", () => {
    expect(equipmentLineCost(pebble, 5, false)).toBe(0);
    expect(equipmentLineCost(included, 1, false)).toBe(0);
    expect(equipmentLineCost(sword, 0, false)).toBe(0);
    expect(equipmentLineCost(gromril, 0, false)).toBe(0);
  });

  it("is null for multiplier and unknown kinds", () => {
    expect(equipmentLineCost(gromril, 1, false)).toBeNull();
    expect(equipmentLineCost(parseEquipmentCost("2 x price"), 2, false)).toBeNull();
    expect(equipmentLineCost(parseEquipmentCost("ask"), 1, false)).toBeNull();
  });
});
