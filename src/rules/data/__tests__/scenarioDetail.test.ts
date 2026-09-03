import { describe, expect, it } from "vitest";
import { CORE_RULEBOOK_SCENARIO_IDS, SCENARIOS } from "../campaign/scenarios";
import { SCENARIO_DETAILS, scenarioDetail } from "../campaign/scenarioDetails";

const detailIds = Object.keys(SCENARIO_DETAILS);

describe("scenario details", () => {
  it("has one detail per scraped page (103 pages in 06-scenarios.md)", () => {
    expect(detailIds.length).toBe(103);
  });

  it("covers every core rulebook scenario with an Experience section from the rulebook group", () => {
    for (const id of CORE_RULEBOOK_SCENARIO_IDS) {
      const d = scenarioDetail(id);
      expect(d, `no detail for ${id}`).toBeDefined();
      expect(d!.group).toBe("mordheim-rulebook");
      expect(d!.sections.map((s) => s.name)).toContain("Experience");
      expect(d!.experience).not.toBeNull();
      expect(d!.number).toBeGreaterThanOrEqual(1);
      expect(d!.number).toBeLessThanOrEqual(9);
    }
  });

  it("has a detail for every summary row, and only two pages without a summary row", () => {
    const summaryIds = new Set(SCENARIOS.map((s) => s.id));
    const missing = SCENARIOS.filter((s) => !(s.id in SCENARIO_DETAILS)).map((s) => s.id);
    // Every one of the 101 index rows matched a scraped page (none missing).
    expect(missing).toEqual([]);
    expect(missing.length).toBe(0);
    // Pages that exist on the site but have no row in the index table.
    const extra = detailIds.filter((id) => !summaryIds.has(id));
    expect(extra.sort()).toEqual(["defend_the_tomb", "dem_s_my_gubbinz"]);
  });

  it("gives every detail non-empty rules Markdown, a url, a source range and at least one section", () => {
    for (const id of detailIds) {
      const d = SCENARIO_DETAILS[id];
      expect(d.rulesMarkdown.length, `${id}: empty rulesMarkdown`).toBeGreaterThan(0);
      expect(d.url).toMatch(/^https:\/\/mordheimer\.net\/docs\/campaigns\/scenarios\/[a-z-]+\/[a-z0-9-]+$/);
      expect(d.url.split("/").slice(-2)[0]).toBe(d.group);
      expect(d.sourceFile).toMatch(/^06-scenarios\.md:\d+-\d+$/);
      expect(d.sections.length, `${id}: no sections`).toBeGreaterThan(0);
      for (const s of d.sections) {
        expect(s.name.length).toBeGreaterThan(0);
        expect(s.text.length, `${id}: empty section ${s.name}`).toBeGreaterThan(0);
      }
      const exp = d.sections.find((s) => s.name === "Experience");
      expect(d.experience).toBe(exp ? exp.text : null);
    }
  });

  it("has at least 3 sections on every page except the three short Archive Pestilen / Town Cryer write-ups", () => {
    // These pages really are that short on the site: Encampment Raid (one "Additional Equipment"
    // section), Romero's Pride ("Special Rules", "Terrain") and The Restless Dead (one "Rules" section).
    const SHORT = ["encampment_raid", "romero_s_pride", "the_restless_dead"];
    const short = detailIds.filter((id) => SCENARIO_DETAILS[id].sections.length < 3);
    expect(short.sort()).toEqual(SHORT);
  });

  it("strips the scraper markers and nothing else", () => {
    for (const id of detailIds) {
      const d = SCENARIO_DETAILS[id];
      expect(d.rulesMarkdown).not.toMatch(/❓|✏️/);
      expect(d.intro).not.toMatch(/❓|✏️/);
    }
  });

  it("keeps the Skirmish page verbatim", () => {
    const d = scenarioDetail("skirmish")!;
    expect(d.number).toBe(2);
    expect(d.url).toBe("https://mordheimer.net/docs/campaigns/scenarios/mordheim-rulebook/skirmish");
    expect(d.intro.length).toBeGreaterThan(0);
    expect(d.intro.startsWith("_In the vastness of the Mordheim ruins")).toBe(true);
    expect(d.sections.map((s) => s.name)).toEqual([
      "Terrain",
      "Warbands",
      "Starting the Game",
      "Ending the Game",
      "Experience",
    ]);
    expect(d.experience).toContain("**+1 Survives.** If a Hero or a Henchman group survives the battle they gain +1 Experience.");
    expect(d.experience).toContain("+1 Winning Leader");
    expect(d.experience).toContain("+1 Per Enemy _Out of Action_");
    expect(d.rulesMarkdown).toContain("### experience");
  });

  it("disambiguates the pages that share a title", () => {
    expect(scenarioDetail("ambush")!.group).toBe("town-cryer");
    expect(scenarioDetail("ambush_archive_pestilen")!.number).toBe(89);
    expect(scenarioDetail("ambush_archive_pestilen_michael_reuvers")!.number).toBe(90);
    expect(scenarioDetail("breakthrough")!.group).toBe("mordheim-rulebook");
    expect(scenarioDetail("breakthrough_archive_pestilen")!.group).toBe("archive-pestilen");
    expect(scenarioDetail("haunted_treasure")!.group).toBe("town-cryer");
    expect(scenarioDetail("haunted_treasure_archive_pestilen")!.group).toBe("archive-pestilen");
    expect(scenarioDetail("the_caravan")!.group).toBe("town-cryer");
    expect(scenarioDetail("the_caravan_archive_pestilen")!.group).toBe("archive-pestilen");
    expect(scenarioDetail("mordheim_s_burning")!.group).toBe("other");
    expect(scenarioDetail("no_such_scenario")).toBeUndefined();
  });
});
