import { describe, expect, it } from "vitest";
import type { RosterHenchmanGroup, RosterHero, RosterWarband } from "../../types/roster";
import type { Stats } from "../../types";
import { findWarbandTemplate } from "../../data/warbandTemplates";
import { leaderTemplate, parseRosterLimit, validateRoster, warbandHeroCount, warbandModelCount } from "../roster";

// TODO switch to ./fixtures makeWarband once the shared fixtures file lands.
const BASE: Stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 };
const REIKLAND = findWarbandTemplate("mercenaries_reikland")!;

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
    equipment: [{ itemId: "sword", quantity: 1 }],
    status: "active",
    ...over,
  };
}

function group(id: string, unitTemplateId: string, size: number, over: Partial<RosterHenchmanGroup> = {}): RosterHenchmanGroup {
  return {
    id,
    name: id,
    unitTemplateId,
    size,
    stats: { ...BASE },
    xp: 0,
    levelUps: 0,
    statIncreases: {},
    equipment: [],
    ...over,
  };
}

/** A legal Reikland roster: captain, 2 champions, 2 youngbloods, 3 warriors, 2 marksmen = 10 models. */
function legalReikland(over: Partial<RosterWarband> = {}): RosterWarband {
  return {
    id: "wb",
    name: "Reikland Test",
    warbandTemplateId: REIKLAND.id,
    gold: 20,
    wyrdstone: 0,
    veteranPool: null,
    heroes: [
      hero("captain", "mercenaries_reikland_captain"),
      hero("champ1", "mercenaries_reikland_champions"),
      hero("champ2", "mercenaries_reikland_champions"),
      hero("yb1", "mercenaries_reikland_youngbloods"),
      hero("yb2", "mercenaries_reikland_youngbloods"),
    ],
    henchmenGroups: [group("warriors", "mercenaries_reikland_warriors", 3), group("marksmen", "mercenaries_reikland_marksmen", 2)],
    hiredSwords: [],
    stash: [{ itemId: null, customName: "Old boots", quantity: 1 }],
    ...over,
  };
}

function codes(warband: RosterWarband, opts?: { atCreation?: boolean }): string[] {
  return validateRoster(warband, REIKLAND, opts).problems.map((p) => p.code);
}

describe("parseRosterLimit", () => {
  it("handles every form in the data", () => {
    expect(parseRosterLimit("1")).toEqual({ min: 1, max: 1 });
    expect(parseRosterLimit("0-2")).toEqual({ min: 0, max: 2 });
    expect(parseRosterLimit("0-10")).toEqual({ min: 0, max: 10 });
    expect(parseRosterLimit("any")).toEqual({ min: 0, max: null });
    expect(parseRosterLimit("Any")).toEqual({ min: 0, max: null });
    expect(parseRosterLimit("1+")).toEqual({ min: 1, max: null });
    expect(parseRosterLimit("0-1 (taken instead of a Champion or Petty Thief)")).toEqual({
      min: 0,
      max: 1,
      note: "taken instead of a Champion or Petty Thief",
    });
    expect(parseRosterLimit("0-1 (replaces one Templar)")).toEqual({ min: 0, max: 1, note: "replaces one Templar" });
    expect(parseRosterLimit("0-3, may never exceed the number of Knights (Questing Knight + Knights Errant) in the warband")).toEqual({
      min: 0,
      max: 3,
      note: "may never exceed the number of Knights (Questing Knight + Knights Errant) in the warband",
    });
    expect(parseRosterLimit("0-2, only if the warband includes a Beastmaster")).toEqual({
      min: 0,
      max: 2,
      note: "only if the warband includes a Beastmaster",
    });
  });

  it("keeps unparseable prose as the note and treats it as unlimited", () => {
    const text = "may not exceed the number of Orc Boyz in the warband";
    expect(parseRosterLimit(text)).toEqual({ min: 0, max: null, note: text });
  });
});

describe("counts", () => {
  it("count active heroes and henchmen, never hired swords or dead heroes", () => {
    const wb = legalReikland({
      heroes: [...legalReikland().heroes, hero("dead", "mercenaries_reikland_champions", { status: "dead" })],
      hiredSwords: [
        {
          id: "hs",
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
    expect(warbandHeroCount(wb)).toBe(5);
    expect(warbandModelCount(wb)).toBe(10);
  });
});

describe("validateRoster", () => {
  it("treats the first hero line with a minimum of 1 as the leader", () => {
    expect(leaderTemplate(REIKLAND)?.id).toBe("mercenaries_reikland_captain");
  });

  it("passes a legal Reikland roster", () => {
    const wb = legalReikland();
    const before = structuredClone(wb);
    expect(validateRoster(wb, REIKLAND)).toEqual({ ok: true, problems: [] });
    expect(validateRoster(wb, REIKLAND, { atCreation: true }).ok).toBe(true);
    expect(wb).toEqual(before);
  });

  it("flags a second captain", () => {
    const wb = legalReikland({ heroes: [...legalReikland().heroes, hero("captain2", "mercenaries_reikland_captain")] });
    const result = validateRoster(wb, REIKLAND);
    expect(result.ok).toBe(false);
    expect(result.problems.map((p) => p.code)).toContain("roster.multipleLeaders");
    // The heroes total (6) also breaks the 5-hero capacity.
    expect(result.problems.map((p) => p.code)).toContain("roster.tooManyHeroes");
  });

  it("flags a missing captain", () => {
    const wb = legalReikland({ heroes: legalReikland().heroes.filter((h) => h.id !== "captain") });
    expect(codes(wb)).toContain("roster.noLeader");
  });

  it("flags too many champions", () => {
    const wb = legalReikland({
      heroes: [
        ...legalReikland().heroes.filter((h) => h.unitTemplateId !== "mercenaries_reikland_youngbloods"),
        hero("champ3", "mercenaries_reikland_champions"),
      ],
    });
    const result = validateRoster(wb, REIKLAND);
    expect(result.problems).toEqual([{ code: "roster.unitLimit", message: "3 Champions but the limit is 0-2" }]);
  });

  it("flags 16 models", () => {
    const wb = legalReikland({
      henchmenGroups: [group("warriors", "mercenaries_reikland_warriors", 9), group("marksmen", "mercenaries_reikland_marksmen", 2)],
    });
    expect(warbandModelCount(wb)).toBe(16);
    expect(codes(wb)).toEqual(["roster.tooManyModels"]);
  });

  it("henchman limits count models across groups", () => {
    const wb = legalReikland({
      henchmenGroups: [group("sw1", "mercenaries_reikland_swordsmen", 3), group("sw2", "mercenaries_reikland_swordsmen", 3)],
    });
    expect(codes(wb)).toEqual(["roster.unitLimit"]);
  });

  it("enforces the minimum size only at creation", () => {
    const wb = legalReikland({ heroes: [hero("captain", "mercenaries_reikland_captain")], henchmenGroups: [group("w", "mercenaries_reikland_warriors", 1)] });
    expect(codes(wb)).toEqual([]);
    expect(codes(wb, { atCreation: true })).toEqual(["roster.tooFewModels"]);
  });

  it("flags negative gold, empty groups, unknown units and unknown items", () => {
    const wb = legalReikland({
      gold: -5,
      heroes: [
        hero("captain", "mercenaries_reikland_captain", { equipment: [{ itemId: "not_an_item", quantity: 1 }] }),
        hero("stranger", "skaven_assassin_adept"),
      ],
      henchmenGroups: [group("ghosts", "mercenaries_reikland_warriors", 0)],
      stash: [{ itemId: null, quantity: 1 }, { itemId: "sword", quantity: 0 }],
    });
    const found = codes(wb);
    for (const code of ["roster.negativeGold", "roster.emptyGroup", "roster.unknownUnit", "roster.unknownItem", "roster.unnamedItem", "roster.invalidQuantity"]) {
      expect(found).toContain(code);
    }
    const unknownItem = validateRoster(wb, REIKLAND).problems.find((p) => p.code === "roster.unknownItem");
    expect(unknownItem?.subjectId).toBe("captain");
  });

  it("does not count hired swords against the model or hero limits", () => {
    const wb = legalReikland({
      henchmenGroups: [group("warriors", "mercenaries_reikland_warriors", 10)],
      hiredSwords: [
        {
          id: "hs",
          hiredSwordId: "dwarf_troll_slayer",
          name: "Grim",
          stats: { ...BASE },
          xp: 0,
          levelUps: 0,
          skillIds: [],
          injuries: [],
          flags: {},
          equipment: [{ itemId: null, customName: "Two Axes", quantity: 1 }],
          status: "active",
        },
      ],
    });
    expect(warbandModelCount(wb)).toBe(15);
    expect(validateRoster(wb, REIKLAND).ok).toBe(true);
  });
});
