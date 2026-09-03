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

  it("has unique ids", () => {
    expectUniqueIds(HIRED_SWORDS, "hired swords");
  });

  it("has a detail write-up for every index row", () => {
    // All 72 index rows matched a "### Name" entry on the Grade 1A/1B/1C/2A pages in
    // reference/rules/04-hired-swords.md — none are missing.
    expect(HIRED_SWORDS.filter((h) => h.detail).length).toBe(72);
    expect(HIRED_SWORDS.length).toBe(72);
    for (const h of HIRED_SWORDS) {
      expect(h.detail!.sourceFile, h.name).toMatch(/^04-hired-swords\.md:\d+-\d+$/);
      expect(h.detail!.profiles.length, `${h.name} has no profile`).toBeGreaterThan(0);
    }
  });

  it("captures the Dwarf Troll Slayer write-up verbatim", () => {
    const d = findHiredSword("dwarf_troll_slayer")!.detail!;
    expect(d.sourceLine).toMatch(/^Source: Mordheim Rulebook/);
    expect(d.hireLine).toBe("25 gold crowns to hire +10 gold crowns upkeep");
    expect(d.profiles).toEqual([
      { name: "Troll Slayer", stats: { M: 3, WS: 4, BS: 3, S: 3, T: 4, W: 1, I: 2, A: 1, Ld: 9 } },
    ]);
    expect(d.rating).toContain("12 points");
    expect(d.mayBeHired).toMatch(/^Mercenaries and Witch Hunters may hire a Dwarf Troll Slayer/);
    expect(d.weaponsArmour).toBe("Two Axes or a Double-Handed Axe (the hiring player may choose).");
    expect(d.specialRules.map((r) => r.name)).toEqual(["Deathwish", "Hard to Kill", "Hard Head"]);
    expect(d.uniqueSkills?.tableName).toBe("TROLL SLAYER SKILLS");
    expect(d.uniqueSkills?.skills.map((s) => s.name)).toEqual(["Ferocious Charge", "Monster Slayer", "Berserker"]);
    // The scraper's review markers are stripped, nothing else.
    expect(d.uniqueSkills?.skills[2].text).toBe("The Dwarf may add +1 to his to hit rolls during the turn in which he charges.");
  });

  it("captures the Ogre Bodyguard profile and hoists Skills out of its Special Rules block", () => {
    const d = findHiredSword("ogre_bodyguard")!.detail!;
    expect(d.profiles).toEqual([{ name: "Ogre", stats: { M: 6, WS: 3, BS: 2, S: 4, T: 4, W: 3, I: 3, A: 2, Ld: 7 } }]);
    expect(d.rating).toContain("+25 points");
    expect(d.specialRules.map((r) => r.name)).toEqual(["Fear", "Large Target"]);
    expect(d.skills).toBe("An Ogre may choose from Combat and Strength skills when he gains new skills.");
  });

  it("keeps every profile row, including mounts and companions", () => {
    expect(findHiredSword("freelancer")!.detail!.profiles.map((p) => p.name)).toEqual(["Freelancer", "Warhorse"]);
    expect(findHiredSword("wolf_priest_of_ulric")!.detail!.profiles.map((p) => p.name)).toEqual(["Wolf Priests", "Wolf"]);
    // Tables without a Profile column fall back to the entry name.
    expect(findHiredSword("weaponsmith")!.detail!.profiles[0].name).toBe("Weaponsmith");
    expect(findHiredSword("ogre_slave_master")!.detail!.profiles[0].save).toBe("6+");
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

  it("has unique ids", () => {
    expectUniqueIds(DRAMATIS_PERSONAE, "dramatis personae");
  });

  it("has a detail write-up for every index row", () => {
    // All 30 index rows matched an entry in reference/rules/05-dramatis-personae.md.
    expect(DRAMATIS_PERSONAE.filter((p) => p.detail).length).toBe(30);
    for (const p of DRAMATIS_PERSONAE) {
      expect(p.detail!.sourceFile, p.name).toMatch(/^05-dramatis-personae\.md:\d+-\d+$/);
      expect(p.detail!.profiles.length, `${p.name} has no profile`).toBeGreaterThan(0);
    }
  });

  it("captures Johann the Knife's fixed profile and named skills", () => {
    const d = findPersona("johann_the_knife")!.detail!;
    expect(d.profiles).toEqual([{ name: "Johann", stats: { M: 4, WS: 3, BS: 6, S: 4, T: 3, W: 2, I: 6, A: 1, Ld: 7 } }]);
    expect(d.hireLine).toMatch(/^70 gold crowns to hire; \+30 gold crowns upkeep cost\./);
    expect(d.skills).toBe("Johann has the following skills: Dodge, Scale Sheer Surfaces, Quick Shot, Eagle Eyes and Knife Fighter.");
    expect(d.specialRules.map((r) => r.name)).toEqual(["Knife Fighter Extraordinaire"]);
  });

  it("models a conditional hire fee and a paired character", () => {
    const bertha = findPersona("bertha_bestraufrung_high_matriarch_of_the_sisterhood")!.detail!;
    expect(bertha.hireLine).toBe("");
    expect(bertha.hireFee).toMatch(/^None\. Bertha will come to the aid of any Sisters of Sigmar warband/);
    expect(bertha.profiles[0].stats.Ld).toBe(10);

    const pair = findPersona("ulli_and_marquand")!.detail!;
    expect(pair.profiles.map((p) => p.name)).toEqual(["Marquand", "Ulli"]);
    expect(pair.otherSections?.map((s) => s.name)).toEqual(["Marquand Volker", "Ulli Leitpold"]);
  });

  it("keeps non-integer characteristics verbatim alongside the parsed integers", () => {
    const belandysh = findPersona("belandysh_condemned_champion_of_chen")!.detail!.profiles[0];
    expect(belandysh.rawStats).toEqual(["4", "D6", "0", "D6", "D6", "3", "D6", "D3", "10"]);
    expect(belandysh.stats.WS).toBe(0);
  });
});

describe("detail write-ups", () => {
  const all = [...HIRED_SWORDS, ...DRAMATIS_PERSONAE].map((x) => ({ name: x.name, detail: x.detail! }));

  it("has integer characteristics between 0 and 10 on every profile", () => {
    for (const { name, detail } of all) {
      for (const p of detail.profiles) {
        for (const [k, v] of Object.entries(p.stats)) {
          expect(Number.isInteger(v), `${name} / ${p.name} ${k}=${v}`).toBe(true);
          expect(v, `${name} / ${p.name} ${k}`).toBeGreaterThanOrEqual(0);
          expect(v, `${name} / ${p.name} ${k}`).toBeLessThanOrEqual(10);
        }
      }
    }
  });

  it("strips the scraper's review markers and nothing else", () => {
    for (const { name, detail } of all) {
      const json = JSON.stringify(detail);
      expect(json, name).not.toMatch(/❓|✏️/);
      expect(detail.sourceLine, name).toMatch(/^Source: /);
      for (const r of detail.specialRules) expect(r.name, `${name}: ${r.name}`).not.toMatch(/[:.]$/);
    }
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
