/// <reference types="node" />
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  EXPLORATION_LOCATIONS,
  INCOME_NOTES,
  MAGICAL_ARTEFACTS,
  MAGICAL_ARTEFACTS_RULE,
  MULTIPLES_RULE,
  findLocation,
} from "../campaign/exploration";
import type { MultipleKind } from "../../types/exploration";

const KINDS: MultipleKind[] = ["doubles", "triples", "fourOfAKind", "fiveOfAKind", "sixOfAKind"];
const KIND_BY_COUNT: Record<number, MultipleKind> = { 2: "doubles", 3: "triples", 4: "fourOfAKind", 5: "fiveOfAKind", 6: "sixOfAKind" };

/** Parse the "### exploration chart" name tables from the reference Markdown. */
function chartNamesFromSource(): { kind: MultipleKind; value: number; name: string }[] {
  const md = readFileSync(join(process.cwd(), "reference/rules/03-campaigns-magic-optional-rules.md"), "utf8");
  const start = md.indexOf("### exploration chart");
  const end = md.indexOf("### doubles", start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const rows: { kind: MultipleKind; value: number; name: string }[] = [];
  for (const line of md.slice(start, end).split("\n")) {
    const m = line.match(/^\| ([\d ]+) \| (.+) \|$/);
    if (!m) continue;
    const dice = m[1].trim().split(/\s+/).map(Number);
    rows.push({ kind: KIND_BY_COUNT[dice.length], value: dice[0], name: m[2].trim() });
  }
  return rows;
}

describe("exploration locations", () => {
  it("has exactly 30 locations, six per kind with values 1-6 and unique ids, in chart order", () => {
    expect(EXPLORATION_LOCATIONS).toHaveLength(30);
    const ids = new Set(EXPLORATION_LOCATIONS.map((l) => l.id));
    expect(ids.size).toBe(30);
    KINDS.forEach((kind, k) => {
      const ofKind = EXPLORATION_LOCATIONS.filter((l) => l.kind === kind);
      expect(ofKind.map((l) => l.value), kind).toEqual([1, 2, 3, 4, 5, 6]);
      // Ordered doubles 1-6, triples 1-6, ...
      expect(EXPLORATION_LOCATIONS.slice(k * 6, k * 6 + 6).every((l) => l.kind === kind), `${kind} block`).toBe(true);
    });
  });

  it("matches the exploration chart name tables in the source Markdown", () => {
    const rows = chartNamesFromSource();
    expect(rows).toHaveLength(30);
    for (const row of rows) {
      expect(findLocation(row.kind, row.value)?.name, `${row.kind} ${row.value}`).toBe(row.name);
    }
  });

  it("gives every location non-empty flavour, rules and a source line range", () => {
    for (const l of EXPLORATION_LOCATIONS) {
      expect(l.flavour.trim().length, `${l.id} flavour`).toBeGreaterThan(0);
      expect(l.rules.trim().length, `${l.id} rules`).toBeGreaterThan(0);
      expect(l.source.file, `${l.id} source`).toMatch(/^reference\/rules\/03-campaigns-magic-optional-rules\.md:\d+-\d+$/);
      for (const oc of l.subRoll?.outcomes ?? []) {
        expect(oc.band.min, `${l.id} band`).toBeLessThanOrEqual(oc.band.max);
        expect(oc.band.min).toBeGreaterThanOrEqual(1);
        expect(oc.band.max).toBeLessThanOrEqual(6);
      }
    }
  });

  it("structures Corpse (doubles 3) as a D6 sub-roll with five outcomes", () => {
    const corpse = findLocation("doubles", 3)!;
    expect(corpse.name).toBe("Corpse");
    expect(corpse.subRoll?.die).toBe("D6");
    expect(corpse.subRoll?.outcomes).toHaveLength(5);
    const five = corpse.subRoll!.outcomes.find((o) => o.band.min <= 5 && 5 <= o.band.max)!;
    expect(five.text).toContain("Sword");
    expect(corpse.subRoll!.outcomes[0]).toMatchObject({ band: { min: 1, max: 2 }, rewards: [{ kind: "gold", amount: "D6" }] });
  });

  it("structures Well (doubles 1) as a Toughness test", () => {
    const well = findLocation("doubles", 1)!;
    expect(well.name).toBe("Well");
    expect(well.test?.stat).toBe("T");
    expect(well.subRoll).toBeUndefined();
  });

  it("finds the six-of-a-kind and five-of-a-kind sixes by name", () => {
    expect(findLocation("sixOfAKind", 6)?.name).toBe("Noble's Villa");
    expect(findLocation("fiveOfAKind", 6)?.name).toBe("Entrance to the Catacombs");
    expect(findLocation("doubles", 7)).toBeUndefined();
  });
});

describe("magical artefacts and income notes", () => {
  it("has six artefacts covering D6 1-6 and a rule header", () => {
    expect(MAGICAL_ARTEFACTS.map((a) => a.band)).toEqual([1, 2, 3, 4, 5, 6].map((n) => ({ min: n, max: n })));
    expect(MAGICAL_ARTEFACTS[0].name).toBe("The Boots and Rope of Pieter");
    expect(MAGICAL_ARTEFACTS[5].name).toBe("All-Seeing Eye of Numas");
    expect(MAGICAL_ARTEFACTS_RULE).toContain("Roll a D6");
    for (const a of MAGICAL_ARTEFACTS) expect(a.text.trim().length, a.name).toBeGreaterThan(0);
  });

  it("keeps the multiples rule and the two faction income notes", () => {
    expect(MULTIPLES_RULE).toContain("Choose the most numerous multiples");
    expect(INCOME_NOTES.map((n) => n.name)).toEqual(["Sisters of Sigmar and Income", "Skaven and Undead"]);
    expect(INCOME_NOTES[1].text).toContain("warp tokens");
  });
});
