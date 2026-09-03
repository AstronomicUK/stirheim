import { describe, expect, it } from "vitest";
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword } from "../../types/roster";
import { HERO_INJURIES, isValidD66 } from "../../data/campaign/injuries";
import {
  MULTIPLE_INJURIES_REROLL_CODES,
  STAT_FLOORS,
  applyHenchmanInjury,
  applyHeroInjury,
  applyHiredSwordInjury,
} from "../injuries";

// Local fixtures (a shared __tests__/fixtures.ts is being written by another agent).
function makeHero(over: Partial<RosterHero> = {}): RosterHero {
  return {
    id: "hero-1",
    name: "Test Captain",
    unitTemplateId: "mercenaries_reikland_mercenary_captain",
    stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
    xp: 20,
    levelUps: 0,
    skillTableIds: ["combat", "shooting", "academic", "strength", "speed"],
    skillIds: [],
    spellIds: [],
    injuries: [],
    flags: {},
    equipment: [
      { itemId: "sword", quantity: 1 },
      { itemId: "light_armour", quantity: 1 },
    ],
    status: "active",
    ...over,
  };
}

function makeGroup(over: Partial<RosterHenchmanGroup> = {}): RosterHenchmanGroup {
  return {
    id: "group-1",
    name: "Warriors",
    unitTemplateId: "mercenaries_reikland_warriors",
    size: 2,
    stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
    xp: 0,
    levelUps: 0,
    statIncreases: {},
    equipment: [{ itemId: "sword", quantity: 2 }],
    ...over,
  };
}

function makeSword(over: Partial<RosterHiredSword> = {}): RosterHiredSword {
  return {
    id: "hs-1",
    hiredSwordId: "pit_fighter",
    name: "Grod",
    stats: { M: 4, WS: 4, BS: 3, S: 4, T: 4, W: 1, I: 4, A: 1, Ld: 7 },
    xp: 17,
    levelUps: 0,
    skillIds: [],
    injuries: [],
    flags: {},
    equipment: [],
    status: "active",
    ...over,
  };
}

const ALL_D66 = [1, 2, 3, 4, 5, 6].flatMap((t) => [1, 2, 3, 4, 5, 6].map((u) => t * 10 + u));
const clone = <T,>(x: T): T => structuredClone(x);

describe("applyHeroInjury", () => {
  it("applies every valid D66 result without throwing, with a fixed sub-roll", () => {
    for (const d66 of ALL_D66) {
      expect(isValidD66(d66)).toBe(true);
      const hero = makeHero();
      const res = applyHeroInjury(hero, d66, 2);
      expect(res.events.length, `D66 ${d66}`).toBeGreaterThan(0);
      expect(res.value.needsSubRoll, `D66 ${d66} still wants a sub-roll`).toBeUndefined();
      expect(res.value.hero.injuries).toHaveLength(1);
      expect(res.value.hero.injuries[0].rolled.d66).toBe(d66);
      expect(res.value.hero.injuries[0].effect.length).toBeGreaterThan(0);
    }
  });

  it("records every injury code exactly once across the chart", () => {
    const codes = new Set(ALL_D66.map((d) => applyHeroInjury(makeHero(), d, 1).value.hero.injuries[0].injuryCode));
    expect(codes).toEqual(new Set(HERO_INJURIES.map((r) => r.code)));
  });

  it("Leg Wound: Movement 4 -> 3", () => {
    const res = applyHeroInjury(makeHero(), 22);
    expect(res.value.hero.stats.M).toBe(3);
    expect(res.value.hero.injuries[0]).toMatchObject({ injuryCode: "leg_wound", effect: "Movement 4 -> 3" });
    expect(res.events.some((e) => e.message.includes("Movement 4 -> 3"))).toBe(true);
  });

  it("Chest Wound: Toughness -1", () => {
    const res = applyHeroInjury(makeHero(), 26);
    expect(res.value.hero.stats.T).toBe(2);
  });

  it("Blinded In One Eye: BS -1 once and the flag; a second blinding retires the hero", () => {
    const first = applyHeroInjury(makeHero(), 31);
    expect(first.value.hero.stats.BS).toBe(3);
    expect(first.value.hero.flags.blindedInOneEye).toBe(true);
    expect(first.value.hero.status).toBe("active");

    const second = applyHeroInjury(first.value.hero, 31);
    expect(second.value.hero.status).toBe("retired");
    expect(second.value.hero.stats.BS).toBe(2);
  });

  it("stat deltas respect the floors", () => {
    const weak = makeHero({ stats: { M: 1, WS: 1, BS: 0, S: 1, T: 1, W: 1, I: 1, A: 1, Ld: 2 } });
    expect(applyHeroInjury(weak, 22).value.hero.stats.M).toBe(STAT_FLOORS.M);
    expect(applyHeroInjury(weak, 26).value.hero.stats.T).toBe(STAT_FLOORS.T);
    expect(applyHeroInjury(weak, 31).value.hero.stats.BS).toBe(STAT_FLOORS.BS);
    expect(applyHeroInjury(weak, 33).value.hero.stats.I).toBe(STAT_FLOORS.I);
    expect(applyHeroInjury(weak, 34).value.hero.stats.WS).toBe(STAT_FLOORS.WS);
  });

  it("Deep Wound: asks for a D3 sub-roll, then sets missNextGames", () => {
    const pending = applyHeroInjury(makeHero(), 35);
    expect(pending.value.needsSubRoll).toEqual({ die: "D3", prompt: expect.stringContaining("Deep Wound") });
    expect(pending.value.hero.injuries).toHaveLength(0);
    expect(pending.value.hero.flags.missNextGames).toBeUndefined();

    const done = applyHeroInjury(makeHero(), 35, 2);
    expect(done.value.needsSubRoll).toBeUndefined();
    expect(done.value.hero.flags.missNextGames).toBe(2);
    expect(done.value.hero.injuries[0].rolled).toEqual({ d66: 35, subRoll: 2 });
  });

  it("Arm Wound: sub-roll 1 amputates, 2-6 misses a game", () => {
    expect(applyHeroInjury(makeHero(), 23).value.needsSubRoll?.die).toBe("D6");
    const severe = applyHeroInjury(makeHero(), 23, 1).value.hero;
    expect(severe.flags.singleHandedWeaponsOnly).toBe(true);
    expect(severe.flags.missNextGames).toBeUndefined();
    const light = applyHeroInjury(makeHero(), 23, 4).value.hero;
    expect(light.flags.missNextGames).toBe(1);
    expect(light.flags.singleHandedWeaponsOnly).toBeUndefined();
  });

  it("Madness and Smashed Leg map their sub-rolls to flags", () => {
    expect(applyHeroInjury(makeHero(), 24, 2).value.hero.flags.stupidity).toBe(true);
    expect(applyHeroInjury(makeHero(), 24, 5).value.hero.flags.frenzy).toBe(true);
    expect(applyHeroInjury(makeHero(), 25, 1).value.hero.flags.noRunning).toBe(true);
    expect(applyHeroInjury(makeHero(), 25, 6).value.hero.flags.missNextGames).toBe(1);
  });

  it("Bitter Enmity records what the hero hates from the sub-roll", () => {
    expect(applyHeroInjury(makeHero(), 56).value.needsSubRoll).toBeDefined();
    const res = applyHeroInjury(makeHero(), 56, 4);
    expect(res.value.hero.flags.hates).toBe("The leader of the warband that caused the injury.");
  });

  it("Multiple Injuries returns needsMoreRolls and names the re-roll codes", () => {
    const res = applyHeroInjury(makeHero(), 16);
    expect(res.value.needsMoreRolls).toEqual({ count: "D6", note: expect.stringContaining("re-rolling") });
    expect(res.value.hero.status).toBe("active");
    expect(MULTIPLE_INJURIES_REROLL_CODES).toEqual(["dead", "captured", "multiple_injuries"]);
    for (const code of MULTIPLE_INJURIES_REROLL_CODES) {
      expect(HERO_INJURIES.some((r) => r.code === code)).toBe(true);
    }
  });

  it("Dead sets status and empties equipment", () => {
    const res = applyHeroInjury(makeHero(), 13);
    expect(res.value.hero.status).toBe("dead");
    expect(res.value.hero.equipment).toEqual([]);
    const lost = res.events.find((e) => e.kind === "equipmentLost");
    expect(lost?.message).toContain("sword");
    expect(lost?.message).toContain("light_armour");
  });

  it("Robbed empties equipment but the hero stays active", () => {
    const res = applyHeroInjury(makeHero(), 36);
    expect(res.value.hero.equipment).toEqual([]);
    expect(res.value.hero.status).toBe("active");
    expect(res.value.hero.injuries[0].effect).toContain("sword");
  });

  it("Captured marks the flag and status", () => {
    const res = applyHeroInjury(makeHero(), 61);
    expect(res.value.hero.flags.captured).toBe(true);
    expect(res.value.hero.status).toBe("captured");
  });

  it("Survives Against The Odds: +1 Experience", () => {
    const res = applyHeroInjury(makeHero({ xp: 20 }), 66);
    expect(res.value.hero.xp).toBe(21);
  });

  it("Full Recovery leaves the hero unchanged apart from the record", () => {
    const hero = makeHero();
    const res = applyHeroInjury(hero, 44, undefined, { matchId: "match-7" });
    expect(res.value.hero.stats).toEqual(hero.stats);
    expect(res.value.hero.injuries[0]).toMatchObject({ injuryCode: "full_recovery", matchId: "match-7" });
  });

  it("Sold To The Pits emits a pitFight follow-up event", () => {
    const res = applyHeroInjury(makeHero(), 65);
    expect(res.events.some((e) => e.kind === "pitFight")).toBe(true);
  });

  it("rejects values that are not real D66 rolls", () => {
    expect(() => applyHeroInjury(makeHero(), 17)).toThrow(RangeError);
    expect(() => applyHeroInjury(makeHero(), 70)).toThrow(RangeError);
  });

  it("never mutates its input", () => {
    const hero = makeHero();
    const before = clone(hero);
    for (const d66 of ALL_D66) applyHeroInjury(hero, d66, 3);
    applyHeroInjury(hero, 35);
    expect(hero).toEqual(before);
  });
});

describe("applyHenchmanInjury", () => {
  it("1-2 removes a warrior, 3-6 leaves the group alone", () => {
    const group = makeGroup({ size: 2 });
    expect(applyHenchmanInjury(group, 1).value?.size).toBe(1);
    expect(applyHenchmanInjury(group, 2).value?.size).toBe(1);
    for (const d6 of [3, 4, 5, 6]) expect(applyHenchmanInjury(group, d6).value).toEqual(group);
  });

  it("returns null when the last member dies", () => {
    const res = applyHenchmanInjury(makeGroup({ size: 1 }), 1);
    expect(res.value).toBeNull();
    expect(res.events.some((e) => e.kind === "groupDisbanded")).toBe(true);
  });

  it("rejects bad dice and does not mutate", () => {
    const group = makeGroup();
    const before = clone(group);
    expect(() => applyHenchmanInjury(group, 0)).toThrow(RangeError);
    expect(() => applyHenchmanInjury(group, 7)).toThrow(RangeError);
    applyHenchmanInjury(group, 1);
    expect(group).toEqual(before);
  });
});

describe("applyHiredSwordInjury", () => {
  it("1-2 dead, 3-6 fine", () => {
    const sword = makeSword();
    const before = clone(sword);
    expect(applyHiredSwordInjury(sword, 2).value.status).toBe("dead");
    expect(applyHiredSwordInjury(sword, 3).value.status).toBe("active");
    expect(sword).toEqual(before);
  });
});
