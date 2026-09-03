/// <reference types="node" />
// The app tsconfig only pulls in vite/client types; this test reads the source Markdown with node:fs.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { HIRED_SWORDS, HIRED_SWORD_RULES, findHiredSword } from "../campaign/hiredSwords";
import { DRAMATIS_PERSONAE, DRAMATIS_PERSONAE_RULES, findPersona } from "../campaign/dramatisPersonae";
import { CORE_RULEBOOK_SCENARIO_IDS, SCENARIOS, SCENARIO_GENERAL_RULES, findScenario } from "../campaign/scenarios";

const SOURCE = join(process.cwd(), "reference/rules/03-campaigns-magic-optional-rules.md");

/**
 * Counts the data rows of the Markdown table that follows `heading`: the first `| ` line after the
 * heading is the column header, the next is the `|---|` separator, then rows run until the first
 * line that isn't a `| ` row.
 */
function countTableRows(heading: string): number {
  const lines = readFileSync(SOURCE, "utf8").split("\n");
  const start = lines.findIndex((l) => l.startsWith(heading));
  expect(start, `heading ${heading} not found in source`).toBeGreaterThan(-1);
  let i = start + 1;
  while (i < lines.length && !lines[i].startsWith("| ")) i++;
  const header = lines[i];
  expect(header, `no table header after ${heading}`).toMatch(/^\| /);
  expect(lines[i + 1], `no separator row after ${heading}`).toMatch(/^\|\s*-/);
  let count = 0;
  for (i += 2; i < lines.length && lines[i].startsWith("| "); i++) count++;
  return count;
}

function expectUniqueIds(items: { id: string }[], label: string) {
  const seen = new Set<string>();
  for (const item of items) {
    expect(seen.has(item.id), `${label}: duplicate id ${item.id}`).toBe(false);
    seen.add(item.id);
  }
}

describe("hired swords", () => {
  it("has one entry per row of the source index table", () => {
    expect(HIRED_SWORDS.length).toBe(countTableRows("### list of hired swords"));
  });

  it("captures the four general rule subsections", () => {
    expect(HIRED_SWORD_RULES.map((r) => r.name)).toEqual([
      "Recruiting Hired Swords",
      "Hire Fee",
      "Injuries",
      "Hired Swords and Experience",
    ]);
  });

  it("parses the core rulebook entries", () => {
    const slayer = findHiredSword("dwarf_troll_slayer")!;
    expect(slayer.hireCost).toEqual({ base: 25, text: "25 gc" });
    expect(slayer.upkeep).toEqual({ base: 10, text: "10 gc" });
    expect(slayer.grade).toBe("core");

    const ogre = findHiredSword("ogre_bodyguard")!;
    expect(ogre.hireCost.base).toBe(80);
    expect(ogre.upkeep?.base).toBe(30);
  });

  it("keeps non-gold and footnoted fees verbatim without inventing a number", () => {
    expect(findHiredSword("elf_mage")!.upkeep).toBeNull();
    expect(findHiredSword("priest_of_morr")!.hireCost).toEqual({ base: null, text: "Hero" });
    expect(findHiredSword("ninja")!.hireCost).toEqual({ base: 70, dice: "3D6", text: "70 +3D6" });
    const thief = findHiredSword("halfling_thief")!;
    expect(thief.upkeep).toEqual({ base: 15, text: "15 gc*" });
    expect(thief.notes).toBeDefined();
  });

  it("has unique ids and no invented detail", () => {
    expectUniqueIds(HIRED_SWORDS, "hired swords");
    for (const h of HIRED_SWORDS) expect(h.detail).toBeUndefined();
  });
});

describe("dramatis personae", () => {
  it("has one entry per row of the source index table", () => {
    expect(DRAMATIS_PERSONAE.length).toBe(countTableRows("### list of dramatis personae"));
  });

  it("captures the general rule subsections", () => {
    expect(DRAMATIS_PERSONAE_RULES.map((r) => r.name)).toEqual([
      "Dramatis Personae",
      "Looking for Special Characters",
      "Hire Fee",
      "Experience, Injuries and Equipment",
    ]);
  });

  it("models characters that cannot be hired for gold with a null hire cost", () => {
    const bertha = findPersona("bertha_bestraufrung_high_matriarch_of_the_sisterhood")!;
    expect(bertha.name).toMatch(/^Bertha Bestraufrung/);
    expect(bertha.hireCost).toBeNull();
    expect(bertha.upkeep).toBeNull();

    const johann = findPersona("johann_the_knife")!;
    expect(johann.hireCost).toEqual({ base: 70, text: "70 gc" });
    expect(johann.upkeep).toEqual({ base: 30, text: "30 gc" });
  });

  it("has unique ids and no invented detail", () => {
    expectUniqueIds(DRAMATIS_PERSONAE, "dramatis personae");
    for (const p of DRAMATIS_PERSONAE) expect(p.detail).toBeUndefined();
  });
});

describe("scenarios", () => {
  it("has one entry per row of the source index table", () => {
    expect(SCENARIOS.length).toBe(countTableRows("### list of scenarios"));
  });

  it("splits 'starting the game' on its sub-headings", () => {
    expect(SCENARIO_GENERAL_RULES.map((r) => r.name)).toEqual([
      "Pre-battle Sequence",
      "Mordheim Rulebook Scenario Table",
      "Chaos on the Streets Scenarios",
    ]);
  });

  it("lists the nine core rulebook scenarios, set in Mordheim", () => {
    expect(CORE_RULEBOOK_SCENARIO_IDS).toHaveLength(9);
    expect(CORE_RULEBOOK_SCENARIO_IDS).toContain("skirmish");
    expect(CORE_RULEBOOK_SCENARIO_IDS).toContain("wyrdstone_hunt");
    for (const id of CORE_RULEBOOK_SCENARIO_IDS) {
      const s = findScenario(id)!;
      expect(s, `missing core scenario ${id}`).toBeDefined();
      expect(s.source).toBe("Mordheim Rulebook");
      expect(s.setting).toBe("Mordheim");
    }
  });

  it("disambiguates scenarios that share a title", () => {
    expect(findScenario("scourge_and_purge")!.source).toBe("Town Cryer #7");
    expect(findScenario("scourge_and_purge_archive_pestilen")!.source).toBe("Archive Pestilen");
    expect(findScenario("breakthrough")!.source).toBe("Mordheim Rulebook");
    expect(findScenario("breakthrough_archive_pestilen")!.source).toBe("Archive Pestilen");
  });

  it("has unique ids and no invented rules text", () => {
    expectUniqueIds(SCENARIOS, "scenarios");
    for (const s of SCENARIOS) expect(s.rulesMarkdown).toBeUndefined();
  });
});
