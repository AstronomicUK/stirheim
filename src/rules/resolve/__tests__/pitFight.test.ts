import { describe, expect, it } from "vitest";
import type { RosterHero, RosterWarband } from "../../types/roster";
import { RulesError } from "../errors";
import { PIT_FIGHT_WIN_GOLD, PIT_FIGHT_WIN_XP, pitFightsOwed, resolvePitFightLoss, resolvePitFightWin } from "../pitFight";

function makeHero(over: Partial<RosterHero> = {}): RosterHero {
  return {
    id: "hero-1",
    name: "Test Captain",
    unitTemplateId: "mercenaries_reikland_mercenary_captain",
    stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 },
    xp: 20,
    levelUps: 0,
    skillTableIds: [],
    skillIds: [],
    spellIds: [],
    injuries: [],
    flags: { pitFightOwed: true },
    equipment: [
      { itemId: "sword", quantity: 1 },
      { itemId: "light_armour", quantity: 1 },
    ],
    status: "active",
    ...over,
  };
}

function makeWarband(over: Partial<RosterWarband> = {}, heroes: RosterHero[] = [makeHero()]): RosterWarband {
  return {
    id: "w1",
    name: "Test Cult",
    warbandTemplateId: "cult_of_the_possessed",
    gold: 100,
    wyrdstone: 0,
    veteranPool: null,
    heroes,
    henchmenGroups: [],
    hiredSwords: [],
    stash: [],
    ...over,
  };
}

describe("pitFightsOwed", () => {
  it("lists standing heroes with the flag, ignoring inactive ones and those without it", () => {
    const wb = makeWarband({}, [
      makeHero({ id: "a", name: "Owed" }),
      makeHero({ id: "b", name: "Not owed", flags: {} }),
      makeHero({ id: "c", name: "Dead but owed", status: "dead" }),
    ]);
    expect(pitFightsOwed(wb)).toEqual([{ heroId: "a", heroName: "Owed" }]);
  });
});

describe("resolvePitFightWin", () => {
  it("pays the warband 50 gc, gives the hero +2 xp, clears the flag, and keeps his kit", () => {
    const wb = makeWarband();
    const r = resolvePitFightWin(wb);
    expect(r.value.gold).toBe(100 + PIT_FIGHT_WIN_GOLD);
    const hero = r.value.heroes[0];
    expect(hero.xp).toBe(20 + PIT_FIGHT_WIN_XP);
    expect(hero.flags.pitFightOwed).toBeUndefined();
    expect(hero.equipment).toHaveLength(2);
    expect(r.events[0].message).toContain(`${PIT_FIGHT_WIN_GOLD} gc`);
  });

  it("refuses when nobody is owed a fight", () => {
    expect(() => resolvePitFightWin(makeWarband({}, [makeHero({ flags: {} })]))).toThrow(RulesError);
  });
});

describe("resolvePitFightLoss", () => {
  it("strips his equipment and applies a direct-resolving injury (Chest Wound, 26)", () => {
    const wb = makeWarband();
    const r = resolvePitFightLoss(wb, 26);
    const hero = r.value.warband.heroes[0];
    expect(hero.equipment).toEqual([]);
    expect(hero.flags.pitFightOwed).toBeUndefined();
    expect(hero.injuries).toHaveLength(1);
    expect(hero.injuries[0].injuryCode).toBe("chest_wound");
    expect(r.value.needsSubRoll).toBeUndefined();
    expect(r.events.some((e) => e.kind === "pitFightLost")).toBe(true);
  });

  it("leaves the flag set and equipment already stripped while a sub-roll is pending (Arm Wound, 23)", () => {
    const wb = makeWarband();
    const r = resolvePitFightLoss(wb, 23);
    const hero = r.value.warband.heroes[0];
    expect(r.value.needsSubRoll).toBeDefined();
    expect(hero.equipment).toEqual([]);
    expect(hero.flags.pitFightOwed).toBe(true); // not yet resolved
    expect(hero.injuries).toHaveLength(0); // not recorded until the sub-roll completes
  });

  it("completes a pending sub-roll on the second call and then clears the flag", () => {
    const wb = makeWarband();
    const pending = resolvePitFightLoss(wb, 23);
    const done = resolvePitFightLoss(pending.value.warband, 23, 1);
    const hero = done.value.warband.heroes[0];
    expect(done.value.needsSubRoll).toBeUndefined();
    expect(hero.flags.pitFightOwed).toBeUndefined();
    expect(hero.injuries).toHaveLength(1);
    expect(hero.injuries[0].injuryCode).toBe("arm_wound");
  });

  it("a Dead result still strips equipment (harmless) and clears the flag", () => {
    const wb = makeWarband();
    const r = resolvePitFightLoss(wb, 11);
    const hero = r.value.warband.heroes[0];
    expect(hero.status).toBe("dead");
    expect(hero.equipment).toEqual([]);
  });

  it("rejects a roll outside 11-35", () => {
    const wb = makeWarband();
    expect(() => resolvePitFightLoss(wb, 10)).toThrow(RulesError);
    expect(() => resolvePitFightLoss(wb, 36)).toThrow(RulesError);
    expect(() => resolvePitFightLoss(wb, 66)).toThrow(RulesError);
  });

  it("refuses when nobody is owed a fight", () => {
    expect(() => resolvePitFightLoss(makeWarband({}, [makeHero({ flags: {} })]), 26)).toThrow(RulesError);
  });
});
