import { describe, expect, it } from "vitest";
import { findWarbandTemplate } from "../../data/warbandTemplates";
import type { RosterHero, RosterWarband } from "../../types/roster";
import { emptyCampaignBans } from "../../types/roster";
import { availableSkills } from "../advances";
import { skillIdByName, skillRestrictionBlock, unitAnswersTo } from "../skillRestrictions";

const stats = { M: 3, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 9 };
const hero = (id: string, unit: string, over: Partial<RosterHero> = {}): RosterHero => ({
  id, name: id, unitTemplateId: unit, stats, xp: 0, levelUps: 0, skillTableIds: ["combat", "warband-unique"], skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [], status: "active", ...over,
});
const warband = (templateId: string, heroes: RosterHero[]): RosterWarband => ({
  id: "w", name: "W", warbandTemplateId: templateId, gold: 0, wyrdstone: 0, veteranPool: null, heroes, henchmenGroups: [], hiredSwords: [], stash: [],
});

describe("skill restrictions", () => {
  it("reads unit names loosely", () => {
    expect(unitAnswersTo("Troll Slayers", "Slayers only")).toBe(true);
    expect(unitAnswersTo("Skink Priest", "Skinks Only")).toBe(true);
    expect(unitAnswersTo("Saurus Totem Warrior", "Skinks Only")).toBe(false);
    expect(unitAnswersTo("Ogre Hunter", "Ogres only")).toBe(true);
  });

  it("finds skills by name for prerequisites", () => {
    expect(skillIdByName("Strongman")).toBe("strongman");
    expect(skillIdByName("Nothing Of The Sort")).toBeUndefined();
  });

  it("blocks a prerequisite that is missing and an 'X only' for another unit", () => {
    const DWARF = findWarbandTemplate("dwarf_slayer_cult")!;
    const rememberer = hero("r", "dwarf_slayer_cult_rememberer_hero");
    expect(skillRestrictionBlock("Requires the Strongman skill", { hero: rememberer, template: DWARF })).toMatch(/Requires Strongman first/);
    expect(skillRestrictionBlock("Requires the Strongman skill", { hero: { ...rememberer, skillIds: ["strongman"] }, template: DWARF })).toBeNull();
    expect(skillRestrictionBlock("Slayers Only", { hero: rememberer, template: DWARF })).toMatch(/Rememberer/);
    expect(skillRestrictionBlock("Slayers Only", { hero: hero("g", "dwarf_slayer_cult_giant_slayer"), template: DWARF })).toBeNull();
    expect(skillRestrictionBlock("Rememberer only", { hero: rememberer, template: DWARF })).toBeNull();
  });

  it("leader-only and warband-wide limits", () => {
    const REIK = findWarbandTemplate("mercenaries_reikland")!;
    const champ = hero("c", "mercenaries_reikland_champions");
    const cap = hero("cap", "mercenaries_reikland_captain");
    expect(skillRestrictionBlock("This skill may only be taken by the warband leader", { hero: champ, template: REIK })).toMatch(/leader/);
    expect(skillRestrictionBlock("This skill may only be taken by the warband leader", { hero: cap, template: REIK })).toBeNull();
    const roster = warband(REIK.id, [cap, { ...champ, skillIds: ["x"] }, hero("d", "mercenaries_reikland_champions", { skillIds: ["x"] })]);
    expect(skillRestrictionBlock("There may never be more than two Elves with this skill in the warband at any one time", { hero: cap, roster, template: REIK, skillId: "x" })).toMatch(/already does/);
    expect(skillRestrictionBlock("There may never be more than two Elves with this skill in the warband at any one time", { hero: cap, roster: warband(REIK.id, [cap]), template: REIK, skillId: "x" })).toBeNull();
  });

  it("availableSkills carries the block and leaves banned skills out", () => {
    const DWARF = findWarbandTemplate("dwarf_slayer_cult")!;
    const rememberer = hero("r", "dwarf_slayer_cult_rememberer_hero");
    const tables = availableSkills(rememberer, DWARF.id, { roster: warband(DWARF.id, [rememberer]) });
    const special = tables.filter((t) => t.tableId !== "combat").flatMap((t) => t.skills);
    expect(special.some((s) => s.blocked)).toBe(true);
    const banned = availableSkills(rememberer, DWARF.id, { bans: { ...emptyCampaignBans(), skills: ["strike_to_injure"] } });
    expect(banned.find((t) => t.tableId === "combat")!.skills.some((s) => s.id === "strike_to_injure")).toBe(false);
  });
});
