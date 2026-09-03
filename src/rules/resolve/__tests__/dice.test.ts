import { describe, expect, it } from "vitest";
import { RulesError } from "../errors";
import { minMax, multiplesIn, parseDice, rollDice, rollDie, sumDice } from "../dice";
import { seededRng } from "./fixtures";

describe("parseDice", () => {
  const cases: [string, { count: number; sides: number; multiplier: number; bonus: number }][] = [
    ["D6", { count: 1, sides: 6, multiplier: 1, bonus: 0 }],
    ["1D6", { count: 1, sides: 6, multiplier: 1, bonus: 0 }],
    ["2D6", { count: 2, sides: 6, multiplier: 1, bonus: 0 }],
    ["3D6", { count: 3, sides: 6, multiplier: 1, bonus: 0 }],
    ["D3", { count: 1, sides: 3, multiplier: 1, bonus: 0 }],
    ["D66", { count: 1, sides: 66, multiplier: 1, bonus: 0 }],
    ["D6x5", { count: 1, sides: 6, multiplier: 5, bonus: 0 }],
    ["D6 x 10", { count: 1, sides: 6, multiplier: 10, bonus: 0 }],
    ["D6 x 25", { count: 1, sides: 6, multiplier: 25, bonus: 0 }],
    ["2D6x5", { count: 2, sides: 6, multiplier: 5, bonus: 0 }],
    ["5D6x5", { count: 5, sides: 6, multiplier: 5, bonus: 0 }],
    ["10 + D6", { count: 1, sides: 6, multiplier: 1, bonus: 10 }],
    ["75 + 3D6", { count: 3, sides: 6, multiplier: 1, bonus: 75 }],
    ["45 + 2D6 gc", { count: 2, sides: 6, multiplier: 1, bonus: 45 }],
    ["D6+1", { count: 1, sides: 6, multiplier: 1, bonus: 1 }],
    ["200 + D6 x 10 gc", { count: 1, sides: 6, multiplier: 10, bonus: 200 }],
    ["d6", { count: 1, sides: 6, multiplier: 1, bonus: 0 }],
    ["  2D6  ", { count: 2, sides: 6, multiplier: 1, bonus: 0 }],
  ];

  it.each(cases)("parses %s", (expr, expected) => {
    expect(parseDice(expr)).toEqual({ ...expected, text: expr.trim() });
  });

  it.each(["", "6", "D", "D6x", "+ D6", "2D6D6", "gc", "D6 + D6", "0D6", "D1"])("throws on %j", (expr) => {
    expect(() => parseDice(expr)).toThrow(RulesError);
    try {
      parseDice(expr);
    } catch (e) {
      expect((e as RulesError).code).toBe("dice.unparseable");
    }
  });
});

describe("minMax", () => {
  it.each([
    ["D6", 1, 6],
    ["2D6", 2, 12],
    ["D3", 1, 3],
    ["D66", 11, 66],
    ["D6x5", 5, 30],
    ["2D6x5", 10, 60],
    ["10 + D6", 11, 16],
    ["75 + 3D6", 78, 93],
    ["D6+1", 2, 7],
    ["200 + D6 x 10 gc", 210, 260],
  ])("%s -> %i..%i", (expr, min, max) => {
    expect(minMax(expr)).toEqual({ min, max });
    expect(minMax(parseDice(expr))).toEqual({ min, max });
  });
});

describe("rollDice", () => {
  it("is deterministic with a seeded rng and honours multiplier and bonus", () => {
    // rng 0 -> face 1, rng 0.99 -> face 6
    expect(rollDice("2D6", seededRng([0, 0.99]))).toEqual({ rolls: [1, 6], total: 7 });
    expect(rollDice("2D6x5", seededRng([0.5, 0.5]))).toEqual({ rolls: [4, 4], total: 40 });
    expect(rollDice("75 + 3D6", seededRng([0, 0, 0]))).toEqual({ rolls: [1, 1, 1], total: 78 });
    expect(rollDice("D6+1", seededRng([0.99]))).toEqual({ rolls: [6], total: 7 });
    expect(rollDice(parseDice("D3"), seededRng([0.4]))).toEqual({ rolls: [2], total: 2 });
  });

  it("rolls a D66 as tens and units", () => {
    expect(rollDice("D66", seededRng([0.99, 0]))).toEqual({ rolls: [61], total: 61 });
    expect(rollDice("D66", seededRng([0, 0]))).toEqual({ rolls: [11], total: 11 });
    expect(rollDice("D66", seededRng([0.99, 0.99]))).toEqual({ rolls: [66], total: 66 });
    const { rolls } = rollDice("D66", seededRng([0.5, 0.2]));
    expect(rolls[0] % 10).toBeGreaterThanOrEqual(1);
    expect(rolls[0] % 10).toBeLessThanOrEqual(6);
  });

  it("never leaves the minMax range", () => {
    let seed = 12345;
    const rng = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x80000000;
    };
    for (const expr of ["D6", "3D6", "D66", "2D6x5", "10 + D6", "45 + 2D6 gc", "D3"]) {
      const { min, max } = minMax(expr);
      const spec = parseDice(expr);
      for (let i = 0; i < 500; i++) {
        const { total, rolls } = rollDice(expr, rng);
        expect(rolls).toHaveLength(spec.count);
        expect(total).toBeGreaterThanOrEqual(min);
        expect(total).toBeLessThanOrEqual(max);
        for (const r of rolls) {
          expect(r).toBeGreaterThanOrEqual(spec.sides === 66 ? 11 : 1);
          expect(r).toBeLessThanOrEqual(spec.sides);
        }
      }
    }
  });

  it("clamps an rng that returns exactly 1", () => {
    expect(rollDie(6, () => 1)).toBe(6);
  });

  it("uses Math.random by default and stays in range", () => {
    for (let i = 0; i < 50; i++) {
      const { total } = rollDice("2D6");
      expect(total).toBeGreaterThanOrEqual(2);
      expect(total).toBeLessThanOrEqual(12);
    }
  });
});

describe("sumDice and multiplesIn", () => {
  it("sums", () => {
    expect(sumDice([])).toBe(0);
    expect(sumDice([1, 2, 3])).toBe(6);
  });

  it("finds doubles", () => {
    expect(multiplesIn([5, 5, 1, 3])).toEqual([{ value: 5, count: 2 }]);
  });

  it("sorts by count desc then value desc", () => {
    expect(multiplesIn([2, 2, 4, 4, 4])).toEqual([
      { value: 4, count: 3 },
      { value: 2, count: 2 },
    ]);
    expect(multiplesIn([1, 1, 6, 6])).toEqual([
      { value: 6, count: 2 },
      { value: 1, count: 2 },
    ]);
  });

  it("returns nothing when all dice differ", () => {
    expect(multiplesIn([1, 2, 3, 4, 5, 6])).toEqual([]);
    expect(multiplesIn([])).toEqual([]);
  });

  it("does not mutate its input", () => {
    const rolls = [3, 1, 3];
    multiplesIn(rolls);
    expect(rolls).toEqual([3, 1, 3]);
  });
});
