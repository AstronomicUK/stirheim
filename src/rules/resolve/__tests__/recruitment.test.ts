import { describe, expect, it } from "vitest";
import type { RosterHenchmanGroup, RosterHero, RosterWarband } from "../../types/roster";
import type { Stats } from "../../types";
import { findUnitTemplate, findWarbandTemplate } from "../../data/warbandTemplates";
import { RulesError } from "../errors";
import {
  DUPLICATE_HIRED_SWORD,
  canRecruit,
  dismissWarrior,
  hireHiredSword,
  payUpkeep,
  recruitHenchmen,
  recruitHero,
} from "../recruitment";

// TODO switch to ./fixtures makeWarband once the shared fixtures file lands.
const BASE: Stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 };
const REIKLAND = findWarbandTemplate("mercenaries_reikland")!;
const CAPTAIN = "mercenaries_reikland_captain";
const CHAMPIONS = "mercenaries_reikland_champions";
const WARRIORS = "mercenaries_reikland_warriors";

function hero(id: string, unitTemplateId: string, over: Partial<RosterHero> = {}): RosterHero {
  return {
    id,
    name: id,
    unitTemplateId,
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

function group(id: string, unitTemplateId: string, size: number, xp = 0, over: Partial<RosterHenchmanGroup> = {}): RosterHenchmanGroup {
  return {
    id,
    name: id,
    unitTemplateId,
    size,
    stats: { ...BASE },
    xp,
    levelUps: 0,
    statIncreases: {},
    equipment: [],
    ...over,
  };
}

function makeWarband(over: Partial<RosterWarband> = {}): RosterWarband {
  return {
    id: "wb",
    name: "Reikland Test",
    warbandTemplateId: REIKLAND.id,
    gold: 500,
    wyrdstone: 0,
    veteranPool: null,
    heroes: [],
    henchmenGroups: [],
    hiredSwords: [],
    stash: [],
    ...over,
  };
}

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (err) {
    return err instanceof RulesError ? err.code : `not a RulesError: ${String(err)}`;
  }
  return undefined;
}

describe("recruitHero", () => {
  it("deducts the cost and copies stats, skill tables and starting experience from the template", () => {
    const wb = makeWarband();
    const before = structuredClone(wb);
    const r = recruitHero(wb, REIKLAND, CAPTAIN, "Hans", "cap");
    const captain = findUnitTemplate(REIKLAND, CAPTAIN)!;
    expect(r.value.gold).toBe(440);
    expect(r.value.heroes).toHaveLength(1);
    expect(r.value.heroes[0]).toMatchObject({
      id: "cap",
      name: "Hans",
      unitTemplateId: CAPTAIN,
      xp: 20,
      levelUps: 0,
      status: "active",
      equipment: [],
      skillTableIds: captain.skillTableIds,
      stats: captain.stats,
    });
    expect(r.value.heroes[0].stats).not.toBe(captain.stats);
    expect(r.events[0].kind).toBe("hero.recruited");
    expect(wb).toEqual(before);
  });

  it("refuses a second captain", () => {
    const wb = makeWarband({ heroes: [hero("cap", CAPTAIN)] });
    expect(codeOf(() => recruitHero(wb, REIKLAND, CAPTAIN, "Second", "cap2"))).toBe("recruitment.notAllowed");
    expect(canRecruit(wb, REIKLAND, CAPTAIN)).toMatchObject({ ok: false });
  });

  it("refuses when the treasury is short", () => {
    const wb = makeWarband({ gold: 30 });
    expect(codeOf(() => recruitHero(wb, REIKLAND, CHAMPIONS, "Poor", "c1"))).toBe("recruitment.notEnoughGold");
    expect(canRecruit(wb, REIKLAND, CHAMPIONS).reason).toContain("35 gc");
  });

  it("refuses a henchman unit type and unknown ids", () => {
    const wb = makeWarband();
    expect(codeOf(() => recruitHero(wb, REIKLAND, WARRIORS, "x", "h"))).toBe("recruitment.notAHero");
    expect(codeOf(() => recruitHero(wb, REIKLAND, "nope", "x", "h"))).toBe("recruitment.unknownUnit");
  });

  it("respects the hero capacity and warband maximum", () => {
    const full = makeWarband({
      heroes: [hero("cap", CAPTAIN)],
      henchmenGroups: [group("w", WARRIORS, 14)],
    });
    expect(canRecruit(full, REIKLAND, CHAMPIONS)).toMatchObject({ ok: false });
    expect(canRecruit(full, REIKLAND, CHAMPIONS).reason).toContain("at most 15");
  });
});

describe("recruitHenchmen", () => {
  it("forms a new group and charges cost x size", () => {
    const wb = makeWarband();
    const before = structuredClone(wb);
    const r = recruitHenchmen(wb, REIKLAND, WARRIORS, "The Lads", 3, "lads");
    expect(r.value.warband.gold).toBe(425);
    expect(r.value.warband.henchmenGroups).toEqual([
      expect.objectContaining({ id: "lads", name: "The Lads", unitTemplateId: WARRIORS, size: 3, xp: 0, equipment: [] }),
    ]);
    expect(r.value.poolRemaining).toBeNull();
    expect(wb).toEqual(before);
  });

  it("adds raw recruits to a 0-xp group without touching the veteran pool", () => {
    const wb = makeWarband({ henchmenGroups: [group("lads", WARRIORS, 2)] });
    const r = recruitHenchmen(wb, REIKLAND, WARRIORS, "", 2, "ignored", { intoGroupId: "lads" });
    expect(r.value.warband.henchmenGroups[0].size).toBe(4);
    expect(r.value.warband.gold).toBe(450);
    expect(r.value.poolRemaining).toBeNull();
  });

  it("veterans: an xp-6 group with pool 7 allows one recruit at base + 12 gc, then refuses a second", () => {
    const wb = makeWarband({ veteranPool: 7, henchmenGroups: [group("vets", WARRIORS, 3, 6)] });
    const first = recruitHenchmen(wb, REIKLAND, WARRIORS, "", 1, "x", { intoGroupId: "vets" });
    expect(first.value.warband.gold).toBe(500 - 25 - 12);
    expect(first.value.warband.henchmenGroups[0]).toMatchObject({ size: 4, xp: 6 });
    expect(first.value.poolRemaining).toBe(1);
    expect(first.events.map((e) => e.kind)).toContain("veterans.hired");

    const poolUsed = 7 - first.value.poolRemaining!;
    expect(codeOf(() => recruitHenchmen(first.value.warband, REIKLAND, WARRIORS, "", 1, "y", { intoGroupId: "vets", poolUsed }))).toBe(
      "recruitment.veteranPoolExceeded",
    );
    // Two at once would also exceed the pool.
    expect(codeOf(() => recruitHenchmen(wb, REIKLAND, WARRIORS, "", 2, "y", { intoGroupId: "vets" }))).toBe("recruitment.veteranPoolExceeded");
  });

  it("veterans need the 2D6 pool to have been rolled", () => {
    const wb = makeWarband({ veteranPool: null, henchmenGroups: [group("vets", WARRIORS, 3, 6)] });
    expect(codeOf(() => recruitHenchmen(wb, REIKLAND, WARRIORS, "", 1, "x", { intoGroupId: "vets" }))).toBe("recruitment.noVeteranPool");
  });

  it("recruits must join a group of their own type", () => {
    const wb = makeWarband({ henchmenGroups: [group("sw", "mercenaries_reikland_swordsmen", 2)] });
    expect(codeOf(() => recruitHenchmen(wb, REIKLAND, WARRIORS, "", 1, "x", { intoGroupId: "sw" }))).toBe("recruitment.groupTypeMismatch");
  });

  it("rejects sizes below one and hero unit types", () => {
    const wb = makeWarband();
    expect(codeOf(() => recruitHenchmen(wb, REIKLAND, WARRIORS, "g", 0, "g"))).toBe("recruitment.invalidSize");
    expect(codeOf(() => recruitHenchmen(wb, REIKLAND, CAPTAIN, "g", 1, "g"))).toBe("recruitment.notAHenchman");
  });
});

describe("dismissWarrior", () => {
  it("retires a hero and moves their equipment to the stash", () => {
    const wb = makeWarband({ heroes: [hero("cap", CAPTAIN, { equipment: [{ itemId: "sword", quantity: 1 }] })] });
    const before = structuredClone(wb);
    const r = dismissWarrior(wb, "cap");
    expect(r.value.heroes[0]).toMatchObject({ status: "retired", equipment: [] });
    expect(r.value.stash).toEqual([{ itemId: "sword", quantity: 1 }]);
    expect(wb).toEqual(before);
  });

  it("removes one henchman and one copy of the group's kit; disbands an emptied group", () => {
    const wb = makeWarband({ henchmenGroups: [group("lads", WARRIORS, 2, 0, { equipment: [{ itemId: "sword", quantity: 1 }] })] });
    const one = dismissWarrior(wb, "lads");
    expect(one.value.henchmenGroups[0].size).toBe(1);
    expect(one.value.stash).toHaveLength(1);
    const none = dismissWarrior(one.value, "lads");
    expect(none.value.henchmenGroups).toEqual([]);
    expect(none.value.stash).toHaveLength(2);
  });

  it("a dismissed hired sword leaves with his equipment", () => {
    const wb = hireHiredSword(makeWarband(), "dwarf_troll_slayer", "grim").value;
    const r = dismissWarrior(wb, "grim");
    expect(r.value.hiredSwords[0].status).toBe("left");
    expect(r.value.stash).toEqual([]);
  });

  it("rejects unknown ids", () => {
    expect(codeOf(() => dismissWarrior(makeWarband(), "ghost"))).toBe("recruitment.unknownWarrior");
  });
});

describe("hireHiredSword / payUpkeep", () => {
  it("hires a Troll Slayer for 25 gc with the entry's profile and equipment text", () => {
    const wb = makeWarband();
    const before = structuredClone(wb);
    const r = hireHiredSword(wb, "dwarf_troll_slayer", "grim");
    expect(r.value.gold).toBe(475);
    expect(r.value.hiredSwords[0]).toMatchObject({
      id: "grim",
      hiredSwordId: "dwarf_troll_slayer",
      name: "Dwarf Troll Slayer",
      xp: 0,
      status: "active",
      stats: { M: 3, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 9 },
    });
    expect(r.value.hiredSwords[0].equipment).toEqual([
      { itemId: null, customName: "Two Axes or a Double-Handed Axe (the hiring player may choose).", quantity: 1 },
    ]);
    expect(r.events[0].message).toContain("10 gc");
    expect(wb).toEqual(before);
  });

  it("refuses a duplicate of the same type while one is active, but allows a replacement after one leaves", () => {
    const wb = hireHiredSword(makeWarband(), "dwarf_troll_slayer", "grim").value;
    expect(codeOf(() => hireHiredSword(wb, "dwarf_troll_slayer", "grim2"))).toBe(DUPLICATE_HIRED_SWORD);
    const gone = dismissWarrior(wb, "grim").value;
    expect(hireHiredSword(gone, "dwarf_troll_slayer", "grim2").value.hiredSwords).toHaveLength(2);
  });

  it("refuses unknown hired swords and short treasuries", () => {
    expect(codeOf(() => hireHiredSword(makeWarband(), "nobody", "x"))).toBe("recruitment.unknownHiredSword");
    expect(codeOf(() => hireHiredSword(makeWarband({ gold: 10 }), "dwarf_troll_slayer", "x"))).toBe("recruitment.notEnoughGold");
  });

  it("pays upkeep when affordable", () => {
    const wb = { ...hireHiredSword(makeWarband(), "dwarf_troll_slayer", "grim").value, gold: 10 };
    const r = payUpkeep(wb, "grim");
    expect(r.value.paid).toBe(true);
    expect(r.value.warband.gold).toBe(0);
    expect(r.value.warband.hiredSwords[0].status).toBe("active");
  });

  it("the hired sword leaves when upkeep cannot be paid", () => {
    const wb = { ...hireHiredSword(makeWarband(), "dwarf_troll_slayer", "grim").value, gold: 5 };
    const before = structuredClone(wb);
    const r = payUpkeep(wb, "grim");
    expect(r.value.paid).toBe(false);
    expect(r.value.warband.gold).toBe(5);
    expect(r.value.warband.hiredSwords[0].status).toBe("left");
    expect(r.events[0].kind).toBe("hiredSword.left");
    expect(wb).toEqual(before);
  });

  it("supports an overridden fee (Troll Slayer with Elves pays 20)", () => {
    const wb = { ...hireHiredSword(makeWarband(), "dwarf_troll_slayer", "grim").value, gold: 20 };
    expect(payUpkeep(wb, "grim", { amountOverride: 20 }).value.warband.gold).toBe(0);
  });
});
