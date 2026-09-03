import { describe, expect, it } from "vitest";
import { HERO_INJURIES, HENCHMAN_INJURY, isValidD66, lookupHeroInjury } from "../campaign/injuries";
import {
  HERO_ADVANCES,
  HENCHMAN_ADVANCES,
  RACIAL_MAXIMUMS,
  advancesEarned,
  nextThreshold,
  underdogBonus,
} from "../campaign/experience";
import {
  SHARDS_FOUND,
  WARBAND_SIZE_BANDS,
  WYRDSTONE_INCOME,
  shardsFound,
  warbandSizeBandIndex,
  wyrdstoneIncome,
} from "../campaign/income";
import { POST_BATTLE_SEQUENCE, TRADING_RULES, rareItemAvailable, sellPrice, warbandRating } from "../campaign/trading";

const ALL_D66 = [1, 2, 3, 4, 5, 6].flatMap((t) => [1, 2, 3, 4, 5, 6].map((u) => t * 10 + u));

describe("serious injuries", () => {
  it("covers every valid D66 result exactly once", () => {
    for (const v of ALL_D66) {
      const hits = HERO_INJURIES.filter((r) => v >= r.band.min && v <= r.band.max);
      expect(hits.length, `D66 ${v} matched ${hits.map((h) => h.name).join(", ")}`).toBe(1);
    }
    expect(ALL_D66).toHaveLength(36);
    expect(new Set(HERO_INJURIES.map((r) => r.code)).size).toBe(HERO_INJURIES.length);
  });

  it("rejects D66 values with a 0 or 7-9 digit", () => {
    for (const bad of [0, 10, 17, 20, 39, 67, 70, 77, 6.5]) {
      expect(isValidD66(bad), `${bad}`).toBe(false);
      expect(() => lookupHeroInjury(bad)).toThrow(RangeError);
    }
  });

  it("looks up specific results", () => {
    const leg = lookupHeroInjury(22);
    expect(leg.name).toBe("Leg Wound");
    expect(leg.effects).toEqual([{ kind: "statDelta", stat: "M", delta: -1 }]);

    const recovery = lookupHeroInjury(43);
    expect(recovery.name).toBe("Full Recovery");
    expect(recovery.effects).toEqual([]);

    expect(lookupHeroInjury(11).name).toBe("Dead");
    expect(lookupHeroInjury(21).name).toBe("Multiple Injuries");
    expect(lookupHeroInjury(63).name).toBe("Hardened");
    expect(lookupHeroInjury(66).effects).toEqual([{ kind: "experience", delta: 1 }]);
  });

  it("henchmen die on a 1-2", () => {
    expect(HENCHMAN_INJURY.deadOn).toEqual([1, 2]);
  });
});

describe("experience", () => {
  it("advance tables cover 2-12 with no gaps or overlaps", () => {
    for (const table of [HERO_ADVANCES, HENCHMAN_ADVANCES]) {
      for (let roll = 2; roll <= 12; roll++) {
        const hits = table.filter((a) => roll >= a.band.min && roll <= a.band.max);
        expect(hits.length, `2D6 ${roll}`).toBe(1);
      }
    }
  });

  it("counts advances earned from thresholds crossed", () => {
    expect(advancesEarned(22, 25, "hero")).toBe(1);
    expect(advancesEarned(0, 2, "henchman")).toBe(1);
    expect(advancesEarned(8, 10, "hero")).toBe(0);
    expect(advancesEarned(0, 8, "hero")).toBe(4);
    expect(nextThreshold(0, "hero")).toBe(2);
    expect(nextThreshold(2, "hero")).toBe(4);
    expect(nextThreshold(14, "henchman")).toBeNull();
  });

  it("racial maximums has 29 rows and Human is 4/6/6/4/4/3/6/4/9", () => {
    expect(RACIAL_MAXIMUMS).toHaveLength(29);
    const human = RACIAL_MAXIMUMS.find((r) => r.profile === "Human");
    expect(human?.stats).toEqual({ M: 4, WS: 6, BS: 6, S: 4, T: 4, W: 3, I: 6, A: 4, Ld: 9 });
    expect(RACIAL_MAXIMUMS.find((r) => r.profile === "Saurus")?.note).toContain("4+1");
  });

  it("underdog bonus", () => {
    expect(underdogBonus(80)).toBe(2);
    expect(underdogBonus(50)).toBe(0);
    expect(underdogBonus(51)).toBe(1);
    expect(underdogBonus(301)).toBe(5);
    expect(underdogBonus(5000)).toBe(5);
    expect(underdogBonus(-40)).toBe(0);
  });
});

describe("income", () => {
  it("shards found bands are contiguous from 1", () => {
    let expected = 1;
    for (const row of SHARDS_FOUND) {
      expect(row.band.min).toBe(expected);
      expected = row.band.max + 1;
    }
    expect(shardsFound(9)).toBe(2);
    expect(shardsFound(36)).toBe(7);
    expect(shardsFound(40)).toBe(7);
    expect(shardsFound(1)).toBe(1);
  });

  it("wyrdstone income chart", () => {
    expect(WARBAND_SIZE_BANDS).toHaveLength(6);
    for (const row of WYRDSTONE_INCOME) expect(row.byWarbandSize).toHaveLength(WARBAND_SIZE_BANDS.length);
    expect(warbandSizeBandIndex(1)).toBe(0);
    expect(warbandSizeBandIndex(12)).toBe(3);
    expect(warbandSizeBandIndex(16)).toBe(5);
    expect(wyrdstoneIncome(2, 5)).toBe(55);
    expect(wyrdstoneIncome(1, 1)).toBe(45);
    expect(wyrdstoneIncome(9, 20)).toBe(100);
    expect(wyrdstoneIncome(0, 5)).toBe(0);
  });
});

describe("trading", () => {
  it("rare item availability is equal-or-greater", () => {
    expect(rareItemAvailable(9, 9)).toBe(true);
    expect(rareItemAvailable(8, 9)).toBe(false);
  });

  it("sell price is half, floored", () => {
    expect(sellPrice(10)).toBe(5);
    expect(sellPrice(15)).toBe(7);
  });

  it("warband rating and post battle sequence", () => {
    expect(warbandRating([{ experience: 8 }, { experience: 0 }, { experience: 3, largeCreature: true }])).toBe(41);
    expect(POST_BATTLE_SEQUENCE).toHaveLength(10);
    expect(TRADING_RULES.map((r) => r.name)).toContain("Availability");
  });
});
