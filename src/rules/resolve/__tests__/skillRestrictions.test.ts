import { describe, expect, it } from "vitest";
import { findWarbandTemplate } from "../../data/warbandTemplates";
import type { RosterHero, RosterWarband } from "../../types/roster";
import { emptyCampaignBans } from "../../types/roster";
import { availableSkills } from "../advances";
import { leaderTemplate } from "../roster";
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

  it("restriction text that previously blocked the very unit it names now permits it (#59 D1-D6)", () => {
    // D1: "Troll Slayers only" used to block the warband's OWN Troll Slayer, since the explicit
    // SUBJECT_UNITS list named only the Dwarf Slayer Cult's units.
    const TREASURE = findWarbandTemplate("dwarf_treasure_hunters")!;
    expect(skillRestrictionBlock("Troll Slayers only", { hero: hero("t", "dwarf_treasure_hunters_troll_slayers"), template: TREASURE })).toBeNull();
    const RANGERS = findWarbandTemplate("dwarf_rangers")!;
    expect(skillRestrictionBlock("Troll Slayers only", { hero: hero("t", "dwarf_rangers_troll_slayer"), template: RANGERS })).toBeNull();

    // D2: "Night Goblin Big Boss only" — the unit's own name is just "Big Boss", so a plain word
    // match against "Night Goblin Big Boss" always failed on "night"/"goblin".
    const NIGHT_GOBLINS = findWarbandTemplate("night_goblins")!;
    expect(skillRestrictionBlock("Night Goblin Big Boss only", { hero: hero("b", "night_goblins_big_boss"), template: NIGHT_GOBLINS })).toBeNull();

    // D3: "halfling thieves only" — the explicit list named only the Mootlanders' Halfling Thief.
    const HALFLINGS = findWarbandTemplate("halflings")!;
    expect(skillRestrictionBlock("halfling thieves only", { hero: hero("h", "halflings_thief_hero"), template: HALFLINGS })).toBeNull();

    // D4: "Scout and Promoted Runts only" was read as one subject needing every word to match a
    // single unit's name; it actually names two alternative units.
    const SNOTLINGS = findWarbandTemplate("snotlings")!;
    expect(skillRestrictionBlock("Scout and Promoted Runts only", { hero: hero("s", "snotling_scouts"), template: SNOTLINGS })).toBeNull();
    expect(skillRestrictionBlock("Scout and Promoted Runts only", { hero: hero("s", "bigsnotz"), template: SNOTLINGS })).toBeNull();
    expect(skillRestrictionBlock("Scout and Promoted Runts only", { hero: hero("s", "bullied_goblin"), template: SNOTLINGS })).toMatch(/are not/);

    // D5: "Only one Elven Hero may possess this skill!" is a warband-wide limit, not a unit-type
    // restriction — it used to be re-parsed by the "X only" check as if "one elven hero" named a
    // specific unit type, which no hero could ever match, blocking everyone.
    const WOOD_ELVES = findWarbandTemplate("wood_elves_of_athel_loren")!;
    const scout = hero("s", WOOD_ELVES.heroTemplates[0].id);
    expect(skillRestrictionBlock("Only one Elven Hero may possess this skill!", { hero: scout, roster: warband(WOOD_ELVES.id, [scout]), skillId: "seeker", template: WOOD_ELVES })).toBeNull();
    const already = { ...scout, id: "other", skillIds: ["seeker"] };
    expect(
      skillRestrictionBlock("Only one Elven Hero may possess this skill!", { hero: scout, roster: warband(WOOD_ELVES.id, [scout, already]), skillId: "seeker", template: WOOD_ELVES }),
    ).toMatch(/already does/);

    // D6: "The Sorceress may never take this skill and no more than two warriors..." — the general
    // exclusion regex captured "this skill" (up to " and no") as the subject instead of "Sorceress",
    // so the Sorceress-specific fallback pattern never ran because the first regex had already matched.
    const DARK_ELVES = findWarbandTemplate("dark_elves")!;
    const sorceressUnit = DARK_ELVES.heroTemplates.find((h) => /sorceress/i.test(h.name))!;
    const sorceress = hero("sorc", sorceressUnit.id);
    const text = "The Sorceress may never take this skill and no more than two warriors in the warband may take this skill at any one time";
    expect(skillRestrictionBlock(text, { hero: sorceress, roster: warband(DARK_ELVES.id, [sorceress]), skillId: "powerful_build", template: DARK_ELVES })).toMatch(/Sorceress.*may not take/);
    // A non-Sorceress hero is still bound by the 2-warrior cap that the same text also states.
    const other1 = hero("o1", DARK_ELVES.heroTemplates[0].id, { skillIds: ["powerful_build"] });
    const other2 = hero("o2", DARK_ELVES.heroTemplates[0].id, { skillIds: ["powerful_build"] });
    const third = hero("o3", DARK_ELVES.heroTemplates[0].id);
    expect(skillRestrictionBlock(text, { hero: third, roster: warband(DARK_ELVES.id, [other1, other2, third]), skillId: "powerful_build", template: DARK_ELVES })).toMatch(/already does/);
  });

  it("restriction text that was previously never enforced in either direction now fires (#59 D7-D10)", () => {
    // D7: "A warband may only contain one pathfinder" names the skill itself, not a generic
    // "warriors/heroes" noun the limit regex used to require.
    const HORNED = findWarbandTemplate("horned_hunters")!;
    const first = hero("p1", HORNED.heroTemplates[0].id, { skillIds: ["pathfinder"] });
    const second = hero("p2", HORNED.heroTemplates[0].id);
    expect(skillRestrictionBlock("A warband may only contain one pathfinder", { hero: second, roster: warband(HORNED.id, [first, second]), skillId: "pathfinder", template: HORNED })).toMatch(/already does/);
    expect(skillRestrictionBlock("A warband may only contain one pathfinder", { hero: first, roster: warband(HORNED.id, [first]), skillId: "pathfinder", template: HORNED })).toBeNull();

    // D8: "Only a hero with the leader skill may gain this skill" means the leader ROLE (no such
    // skill exists in the catalogue) — a deliberate guard excluded exactly this phrasing.
    const NORSE = findWarbandTemplate("norse_explorers")!;
    const norseLeader = leaderTemplate(NORSE)!;
    const norseOther = NORSE.heroTemplates.find((h) => h.id !== norseLeader.id)!;
    const text = "Only a hero with the leader skill may gain this skill";
    expect(skillRestrictionBlock(text, { hero: hero("l", norseLeader.id), template: NORSE })).toBeNull();
    expect(skillRestrictionBlock(text, { hero: hero("o", norseOther.id), template: NORSE })).toMatch(/leader/);

    // D9: "Only for Dreamer" matched none of the "X only" patterns (no trailing "may"/"can", and
    // "only" comes first rather than last).
    const DREAMWALKERS = findWarbandTemplate("dreamwalkers_cult_of_morr")!;
    expect(skillRestrictionBlock("Only for Dreamer", { hero: hero("d", "dreamwalkers_dreamer"), template: DREAMWALKERS })).toBeNull();
    expect(skillRestrictionBlock("Only for Dreamer", { hero: hero("h", "dreamwalkers_priest_of_morr"), template: DREAMWALKERS })).toMatch(/are not/);

    // D10: "This skill may be taken only once and may not be taken by the Guide" — the Guide
    // exclusion already worked; "only once" (an implicit warband-wide cap of one) did not.
    const MANEATERS = findWarbandTemplate("maneaters")!;
    const onceText = "This skill may be taken only once and may not be taken by the Guide";
    const ogre1 = hero("m1", "maneaters_ogre", { skillIds: ["maneater"] });
    const ogre2 = hero("m2", "maneaters_ogre");
    expect(skillRestrictionBlock(onceText, { hero: ogre2, roster: warband(MANEATERS.id, [ogre1, ogre2]), skillId: "maneater", template: MANEATERS })).toMatch(/already does/);
    expect(skillRestrictionBlock(onceText, { hero: ogre2, roster: warband(MANEATERS.id, [ogre2]), skillId: "maneater", template: MANEATERS })).toBeNull();
    const guide = hero("g", "maneaters_mountain_guide");
    expect(skillRestrictionBlock(onceText, { hero: guide, roster: warband(MANEATERS.id, [guide]), skillId: "maneater", template: MANEATERS })).toMatch(/Guide.*may not take/);
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
