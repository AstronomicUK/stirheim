import { describe, expect, it } from "vitest";
import { WARBAND_TEMPLATES } from "../warbandTemplates";
import { WARBAND_SKILL_TABLES, findWarbandSkill, skillTablesForWarband } from "../campaign/warbandSkills";

describe("warband skill tables", () => {
  it("has the expected number of tables and skills", () => {
    expect(WARBAND_SKILL_TABLES.length).toBe(54);
    expect(WARBAND_SKILL_TABLES.reduce((n, t) => n + t.skills.length, 0)).toBe(266);
  });

  it("only references warband ids that exist in WARBAND_TEMPLATES", () => {
    const templateIds = new Set(WARBAND_TEMPLATES.map((w) => w.id));
    for (const t of WARBAND_SKILL_TABLES) {
      expect(templateIds.has(t.warbandId), `${t.id}: unknown warband ${t.warbandId}`).toBe(true);
    }
  });

  it("has unique table ids and unique, table-prefixed skill ids", () => {
    const tableIds = new Set<string>();
    const skillIds = new Set<string>();
    for (const t of WARBAND_SKILL_TABLES) {
      expect(tableIds.has(t.id), `duplicate table id ${t.id}`).toBe(false);
      tableIds.add(t.id);
      for (const s of t.skills) {
        expect(skillIds.has(s.id), `duplicate skill id ${s.id}`).toBe(false);
        skillIds.add(s.id);
        expect(s.id.startsWith(`${t.id}_`), `${s.id} is not prefixed with ${t.id}`).toBe(true);
        expect(s.id).toMatch(/^[a-z0-9_]+$/);
      }
    }
  });

  it("gives every table a name, a source, at least one skill, and every skill a name and text", () => {
    for (const t of WARBAND_SKILL_TABLES) {
      expect(t.name.length, t.id).toBeGreaterThan(0);
      expect(t.source.publication.length, t.id).toBeGreaterThan(0);
      expect(t.source.file, t.id).toMatch(/^warbands\/[a-z0-9-]+\.md:\d+-\d+$/);
      expect(t.skills.length, t.id).toBeGreaterThan(0);
      for (const s of t.skills) {
        expect(s.name.trim().length, s.id).toBeGreaterThan(0);
        expect(s.text.trim().length, s.id).toBeGreaterThan(0);
        // Markdown bold markers should have been stripped from names and never leak into rule text.
        expect(s.name, s.id).not.toContain("**");
        if (s.restriction !== undefined) expect(s.restriction.trim().length, s.id).toBeGreaterThan(0);
      }
    }
  });

  it("gives Dwarf Treasure Hunters a Dwarf list with True Grit and a Troll Slayer list", () => {
    const tables = skillTablesForWarband("dwarf_treasure_hunters");
    expect(tables.map((t) => t.name)).toEqual(["Dwarf Skill Table", "Troll Slayer Skills"]);
    const dwarf = tables.find((t) => t.name === "Dwarf Skill Table")!;
    expect(dwarf.skills.map((s) => s.name)).toEqual([
      "Master of Blades",
      "Extra Tough",
      "Resource Hunter",
      "True Grit",
      "Thick Skull",
    ]);
    const slayer = tables.find((t) => t.name === "Troll Slayer Skills")!;
    expect(slayer.skills.map((s) => s.name)).toEqual(["Ferocious Charge", "Monster Slayer", "Berserker"]);
    for (const s of slayer.skills) expect(s.restriction).toBe("Troll Slayers only");
  });

  it("gives the Sisters of Sigmar their own list", () => {
    const tables = skillTablesForWarband("sisters_of_sigmar");
    expect(tables).toHaveLength(1);
    expect(tables[0].skills.map((s) => s.name)).toEqual([
      "Sign of Sigmar",
      "Protection of Sigmar",
      "Utter Determination",
      "Righteous Fury",
      "Absolute Faith",
    ]);
    expect(tables[0].skills[2].restriction).toBe("Only the Matriarch may have this skill");
  });

  it("gives Skaven of Clan Eshin a list starting with Black Hunger", () => {
    const tables = skillTablesForWarband("skaven_of_clan_eshin");
    expect(tables).toHaveLength(1);
    expect(tables[0].skills[0].name).toBe("Black Hunger");
    expect(tables[0].skills[0].text).toContain("+1 attack and +D3\"");
    expect(tables[0].skills.map((s) => s.name)).toContain("Art of Silent Death");
  });

  it("applies sub-heading restrictions (Lizardmen: Skinks Only / Saurus Only)", () => {
    const [lizardmen] = skillTablesForWarband("lizardmen");
    expect(lizardmen.skills.map((s) => [s.name, s.restriction])).toEqual([
      ["Infiltration", "Skinks Only"],
      ["Great Hunter", "Skinks Only"],
      ["Bellowing Battle Roar", "Saurus Only"],
      ["Toughened Hide", "Saurus Only"],
    ]);
  });

  it("keeps the Restless Dead (Variant) list distinct from the grade-1c Restless Dead list", () => {
    const [variant] = skillTablesForWarband("the_restless_dead_variant");
    expect(variant.skills.map((s) => s.name)).toEqual([
      "Corpse Bomb",
      "Deathspeaker",
      "Wraith Touch",
      "Dark Ritual",
      "Summoner",
    ]);
    const [btb] = skillTablesForWarband("the_restless_dead");
    expect(btb.skills.map((s) => s.name)).toContain("Forbidden Rite");
  });

  it("returns no tables for warbands that only use the standard lists", () => {
    for (const id of ["mercenaries_reikland", "witch_hunters", "the_undead", "cult_of_the_possessed"]) {
      expect(skillTablesForWarband(id)).toEqual([]);
    }
  });

  it("finds a skill by id together with its table", () => {
    const hit = findWarbandSkill("dwarf_treasure_hunters_dwarf_skills_true_grit")!;
    expect(hit.table.warbandId).toBe("dwarf_treasure_hunters");
    expect(hit.skill.name).toBe("True Grit");
    expect(findWarbandSkill("nope")).toBeUndefined();
  });
});
