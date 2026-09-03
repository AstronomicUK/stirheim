import { describe, expect, it } from "vitest";
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword, RosterWarband } from "../../types/roster";
import type { Stats } from "../../types";
import { HIRED_SWORDS } from "../../data/campaign/hiredSwords";
import { HIRED_SWORD_DEFAULT_RATING, parseHiredSwordRating, warbandRating } from "../rating";

// TODO switch to ./fixtures makeWarband once the shared fixtures file lands.
const BASE: Stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 };

function hero(id: string, xp: number, over: Partial<RosterHero> = {}): RosterHero {
  return {
    id,
    name: id,
    unitTemplateId: "mercenaries_reikland_champions",
    stats: { ...BASE },
    xp,
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

function group(id: string, size: number, xp: number, over: Partial<RosterHenchmanGroup> = {}): RosterHenchmanGroup {
  return {
    id,
    name: id,
    unitTemplateId: "mercenaries_reikland_warriors",
    size,
    stats: { ...BASE },
    xp,
    levelUps: 0,
    statIncreases: {},
    equipment: [],
    ...over,
  };
}

function hiredSword(id: string, hiredSwordId: string, xp: number, over: Partial<RosterHiredSword> = {}): RosterHiredSword {
  return {
    id,
    hiredSwordId,
    name: id,
    stats: { ...BASE },
    xp,
    levelUps: 0,
    skillIds: [],
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
    wyrdstone: 0,
    veteranPool: null,
    heroes: [hero("captain", 20), hero("champion", 8), hero("youngblood", 0)],
    henchmenGroups: [group("warriors", 3, 2)],
    hiredSwords: [],
    stash: [],
    ...over,
  };
}

describe("warbandRating", () => {
  it("is 5 per model plus total experience", () => {
    const wb = makeWarband();
    const r = warbandRating(wb);
    // 6 models x 5 = 30; xp 20 + 8 + 0 + 3 x 2 = 34.
    expect(r.total).toBe(64);
    expect(r.breakdown).toHaveLength(4);
    expect(r.breakdown.find((l) => l.subjectId === "warriors")).toMatchObject({ points: 21 });
    expect(r.notes).toEqual([]);
  });

  it("excludes dead, retired and captured heroes", () => {
    const wb = makeWarband({
      heroes: [
        hero("captain", 20),
        hero("dead", 30, { status: "dead" }),
        hero("retired", 10, { status: "retired" }),
        hero("captured", 10, { status: "captured" }),
      ],
      henchmenGroups: [],
    });
    expect(warbandRating(wb).total).toBe(25);
  });

  it("large creatures are worth 20 instead of 5", () => {
    const wb = makeWarband({ heroes: [hero("ogre", 4, { isLarge: true })], henchmenGroups: [group("rats", 2, 1, { isLarge: true })] });
    expect(warbandRating(wb).total).toBe(24 + 42);
  });

  it("a Troll Slayer with 3 xp adds 15 (12 + 1 per xp)", () => {
    const wb = makeWarband({ hiredSwords: [hiredSword("grim", "dwarf_troll_slayer", 3)] });
    const r = warbandRating(wb);
    expect(r.total).toBe(64 + 15);
    expect(r.breakdown.find((l) => l.subjectId === "grim")).toMatchObject({ points: 15, reason: "12 (hired sword) + 3 xp" });
  });

  it("ignores hired swords who died or left", () => {
    const wb = makeWarband({
      hiredSwords: [hiredSword("a", "dwarf_troll_slayer", 3, { status: "left" }), hiredSword("b", "ogre_bodyguard", 1, { status: "dead" })],
    });
    expect(warbandRating(wb).total).toBe(64);
  });

  it("falls back to 5 + xp with a note when the entry's rating text cannot be read", () => {
    const wb = makeWarband({ heroes: [], henchmenGroups: [], hiredSwords: [hiredSword("x", "not_a_real_hired_sword", 4)] });
    const r = warbandRating(wb);
    expect(r.total).toBe(9);
    expect(r.notes).toHaveLength(1);
  });

  it("does not mutate the warband", () => {
    const wb = makeWarband();
    const before = structuredClone(wb);
    warbandRating(wb);
    expect(wb).toEqual(before);
  });
});

describe("parseHiredSwordRating", () => {
  it("reads base points and the per-xp clause", () => {
    expect(parseHiredSwordRating("A Dwarf Troll Slayer increases the warband’s rating by 12 points plus 1 point for each Experience point he has.")).toEqual({ base: 12, perXp: true, parsed: true });
    expect(parseHiredSwordRating("An Ogre Bodyguard increases the warband’s rating by +25 points, plus 1 point for each Experience point he has.")).toEqual({ base: 25, perXp: true, parsed: true });
    expect(parseHiredSwordRating("A Pathfinder increases the warband's rating + 25 points, plus 1 point for each Experience point he has.")).toEqual({ base: 25, perXp: true, parsed: true });
    expect(parseHiredSwordRating("A Warrior Priest of Sigmar increases the warband rating by + 16 points plus 1 point for each Experience point he has.")).toEqual({ base: 16, perXp: true, parsed: true });
    expect(parseHiredSwordRating("A Dwarf Treasure Hunter increases the warband’s rating by +24 points plus one point for each Experience Point he has.")).toEqual({ base: 24, perXp: true, parsed: true });
    expect(parseHiredSwordRating("A Snake Charmer increases the warband rating by 5 points, + 1 point for each Experience point he has and + 5 points for each snake.")).toEqual({ base: 5, perXp: true, parsed: true });
  });

  it("recognises flat ratings with no experience clause", () => {
    expect(parseHiredSwordRating("A Ninja increases the warband's rating by +45 points.")).toEqual({ base: 45, perXp: false, parsed: true });
    expect(parseHiredSwordRating("An Elf Mage increases a warband's rating by 23 points.")).toEqual({ base: 23, perXp: false, parsed: true });
  });

  it("falls back to the rulebook default for empty or unreadable text", () => {
    expect(parseHiredSwordRating("")).toEqual(HIRED_SWORD_DEFAULT_RATING);
    expect(parseHiredSwordRating(undefined)).toEqual(HIRED_SWORD_DEFAULT_RATING);
    expect(parseHiredSwordRating("Nothing useful here")).toEqual({ base: 5, perXp: true, parsed: false });
  });

  it("parses every non-empty rating line in the hired swords data", () => {
    const unparsed = HIRED_SWORDS.filter((h) => h.detail?.rating && !parseHiredSwordRating(h.detail.rating).parsed).map((h) => h.id);
    expect(unparsed).toEqual([]);
  });
});
