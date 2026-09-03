import { describe, expect, it } from "vitest";
import type { RosterHero, RosterWarband } from "../../types/roster";
import type { Stats } from "../../types";
import { findLocation } from "../../data/campaign/exploration";
import { RulesError } from "../errors";
import { applyExplorationGains, explorationDiceAllowed, locationOutcome, resolveExploration } from "../exploration";

// TODO switch to ./fixtures makeWarband once the shared fixtures file lands.
const BASE: Stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 };

function hero(id: string, over: Partial<RosterHero> = {}): RosterHero {
  return {
    id,
    name: id,
    unitTemplateId: "mercenaries_reikland_champions",
    stats: { ...BASE },
    xp: 0,
    levelUps: 0,
    skillTableIds: ["combat"],
    skillIds: [],
    spellIds: [],
    injuries: [],
    flags: {},
    equipment: [],
    status: "active",
    ...over,
  };
}

function makeWarband(over: Partial<RosterWarband> = {}): RosterWarband {
  return {
    id: "wb",
    name: "Test Band",
    warbandTemplateId: "mercenaries_reikland",
    gold: 100,
    wyrdstone: 2,
    veteranPool: null,
    heroes: [hero("h1"), hero("h2"), hero("h3"), hero("h4")],
    henchmenGroups: [],
    hiredSwords: [],
    stash: [],
    ...over,
  };
}

describe("resolveExploration", () => {
  it("[5,5,5,3] totals 18 for 4 shards and triples of 5 = Market Hall", () => {
    const r = resolveExploration([5, 5, 5, 3]);
    expect(r.total).toBe(18);
    expect(r.shards).toBe(4);
    expect(r.multiple).toEqual({ kind: "triples", value: 5, count: 3 });
    expect(r.location?.id).toBe("market_hall");
    expect(r.events.map((e) => e.kind)).toEqual(["exploration.rolled", "exploration.multiple"]);
    expect(r.events[1].message).toContain("Market Hall");
  });

  it("two doubles: the higher value wins ([1,1,3,3] -> doubles of 3)", () => {
    const r = resolveExploration([1, 1, 3, 3]);
    expect(r.multiple).toEqual({ kind: "doubles", value: 3, count: 2 });
    expect(r.location?.id).toBe("corpse");
  });

  it("the most numerous set wins over a higher-valued smaller one ([2,2,5,5,5] -> triples 5)", () => {
    const r = resolveExploration([2, 2, 5, 5, 5]);
    expect(r.multiple).toEqual({ kind: "triples", value: 5, count: 3 });
  });

  it("a lower triple beats a higher double ([6,6,1,1,1] -> triples of 1)", () => {
    expect(resolveExploration([6, 6, 1, 1, 1]).multiple).toEqual({ kind: "triples", value: 1, count: 3 });
  });

  it("no multiples gives a null location", () => {
    const r = resolveExploration([1, 2, 3, 4]);
    expect(r.total).toBe(10);
    expect(r.shards).toBe(2);
    expect(r.multiple).toBeNull();
    expect(r.location).toBeNull();
  });

  it("six of a kind maps to sixOfAKind", () => {
    const r = resolveExploration([6, 6, 6, 6, 6, 6]);
    expect(r.multiple).toEqual({ kind: "sixOfAKind", value: 6, count: 6 });
    expect(r.total).toBe(36);
    expect(r.shards).toBe(7);
  });

  it("rejects seven dice", () => {
    expect(() => resolveExploration([1, 2, 3, 4, 5, 6, 1])).toThrow(RulesError);
    try {
      resolveExploration([1, 2, 3, 4, 5, 6, 1]);
    } catch (err) {
      expect((err as RulesError).code).toBe("exploration.tooManyDice");
    }
  });

  it("rejects die values outside 1..6", () => {
    expect(() => resolveExploration([0, 3])).toThrow(RulesError);
    expect(() => resolveExploration([7])).toThrow(RulesError);
    expect(() => resolveExploration([2.5])).toThrow(RulesError);
  });

  it("does not mutate the rolls", () => {
    const rolls = [3, 1, 3];
    resolveExploration(rolls);
    expect(rolls).toEqual([3, 1, 3]);
  });
});

describe("explorationDiceAllowed", () => {
  it("one die per surviving active hero, plus one for winning", () => {
    const wb = makeWarband({ heroes: [hero("a"), hero("b"), hero("c"), hero("d"), hero("dead", { status: "dead" })] });
    const r = explorationDiceAllowed(wb, { won: true, heroesOutOfAction: ["c"] });
    expect(r.count).toBe(4);
    expect(r.capped).toBe(false);
    expect(r.reason).toContain("3 surviving heroes");
  });

  it("caps at six", () => {
    const wb = makeWarband({ heroes: ["a", "b", "c", "d", "e", "f"].map((id) => hero(id)) });
    const r = explorationDiceAllowed(wb, { won: true, heroesOutOfAction: [] });
    expect(r.count).toBe(6);
    expect(r.capped).toBe(true);
  });

  it("adds extra dice from skills and equipment before capping", () => {
    const wb = makeWarband({ heroes: [hero("a"), hero("b")] });
    expect(explorationDiceAllowed(wb, { won: false, heroesOutOfAction: [], extraDice: 2 }).count).toBe(4);
    expect(explorationDiceAllowed(wb, { won: true, heroesOutOfAction: [], extraDice: 5 })).toMatchObject({ count: 6, capped: true });
  });

  it("hired swords do not roll", () => {
    const wb = makeWarband({
      heroes: [hero("a")],
      hiredSwords: [
        {
          id: "hs1",
          hiredSwordId: "dwarf_troll_slayer",
          name: "Grim",
          stats: { ...BASE },
          xp: 0,
          levelUps: 0,
          skillIds: [],
          injuries: [],
          flags: {},
          equipment: [],
          status: "active",
        },
      ],
    });
    expect(explorationDiceAllowed(wb, { won: false, heroesOutOfAction: [] }).count).toBe(1);
  });
});

describe("applyExplorationGains", () => {
  it("adds shards and gold and puts items in the stash without mutating the input", () => {
    const wb = makeWarband({ stash: [{ itemId: "sword", quantity: 1 }] });
    const before = structuredClone(wb);
    const r = applyExplorationGains(wb, {
      shards: 4,
      gold: 12,
      items: [{ itemId: "lucky_charm", quantity: 1 }],
      notes: ["Hero h1 misses the next game"],
    });
    expect(r.value.wyrdstone).toBe(6);
    expect(r.value.gold).toBe(112);
    expect(r.value.stash).toEqual([{ itemId: "sword", quantity: 1 }, { itemId: "lucky_charm", quantity: 1 }]);
    expect(r.events.map((e) => e.kind)).toEqual(["exploration.wyrdstone", "exploration.gold", "exploration.item", "exploration.note"]);
    expect(wb).toEqual(before);
  });

  it("rejects negative gains", () => {
    expect(() => applyExplorationGains(makeWarband(), { shards: -1, gold: 0, items: [] })).toThrow(RulesError);
    expect(() => applyExplorationGains(makeWarband(), { shards: 0, gold: -5, items: [] })).toThrow(RulesError);
  });
});

describe("locationOutcome", () => {
  const corpse = findLocation("doubles", 3)!;
  const well = findLocation("doubles", 1)!;
  const marketHall = findLocation("triples", 5)!;

  it("asks for a sub-roll when the location has a D6 table and none was given", () => {
    const r = locationOutcome(corpse);
    expect(r.needsSubRoll).toEqual({ die: "D6", prompt: corpse.subRoll!.prompt });
    expect(r.rewards).toEqual([]);
  });

  it("picks the outcome whose band contains the sub-roll", () => {
    expect(locationOutcome(corpse, 1).rewards[0]).toMatchObject({ kind: "gold", amount: "D6" });
    expect(locationOutcome(corpse, 2).rewards[0]).toMatchObject({ kind: "gold" });
    expect(locationOutcome(corpse, 5).text).toBe("Sword");
    expect(locationOutcome(corpse, 5).needsSubRoll).toBeUndefined();
  });

  it("rejects a sub-roll off the table", () => {
    expect(() => locationOutcome(corpse, 7)).toThrow(RulesError);
  });

  it("flags a characteristic test and returns the conditional rewards", () => {
    const r = locationOutcome(well);
    expect(r.needsTest?.stat).toBe("T");
    expect(r.rewards).toHaveLength(1);
    expect(r.rewards[0].kind).toBe("wyrdstone");
  });

  it("returns fixed rewards for plain locations", () => {
    const r = locationOutcome(marketHall);
    expect(r.rewards).toEqual([{ kind: "gold", amount: "2D6", text: "several items worth 2D6 gc in total" }]);
    expect(r.needsSubRoll).toBeUndefined();
    expect(r.needsTest).toBeUndefined();
  });
});
