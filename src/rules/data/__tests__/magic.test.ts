import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MAGIC_RULES, SPELL_LORES, WIZARD_ALLOCATIONS, findLore, findSpell } from "../campaign/magic";

const SOURCE = resolve(process.cwd(), "reference/rules/03-campaigns-magic-optional-rules.md");

// Spells the source marks "*Difficulty: Auto*" (cast automatically, no 2D6 roll) and so carry null:
//   Funerary Rites / Death Holds No Fear
//   Lady's Prayers / Lady's Favors
//   Magic of the Horned Rat / Children of the Horned Rat
//   Necromancy (The Restless Dead) / Spell of Awakening
//   Necromancy / Spell of Awakening
//   Tchar Rituals / Tchar's Blessing
const AUTO_SPELLS: Array<[string, string]> = [
  ["funerary_rites", "death_holds_no_fear"],
  ["ladys_prayers", "ladys_favors"],
  ["magic_of_the_horned_rat", "children_of_the_horned_rat"],
  ["necromancy_the_restless_dead", "spell_of_awakening"],
  ["necromancy", "spell_of_awakening"],
  ["tchar_rituals", "tchars_blessing"],
];

describe("magic rules", () => {
  it("has the three general rules verbatim", () => {
    expect(MAGIC_RULES.map((r) => r.name)).toEqual(["Casting spells", "Damage", "Allocated spells"]);
    expect(MAGIC_RULES[0].text).toContain("must roll equal to or greater than the spell's Difficulty score on 2D6");
    expect(MAGIC_RULES[1].text).toContain("Spells do not cause critical hits.");
    expect(MAGIC_RULES[2].text).toContain("Roll a D6 and consult the appropriate chart.");
  });
});

describe("spell lores", () => {
  it("has one lore per '## Magic — ' heading in the source, each with a unique id", () => {
    const headings = readFileSync(SOURCE, "utf8")
      .split("\n")
      .filter((l) => l.startsWith("## Magic — "));
    // The task brief said 29, but the source has 30 lore headings (Necromancy and
    // Necromancy (The Restless Dead) are separate lores); the source is the ground truth.
    expect(headings.length).toBe(30);
    expect(SPELL_LORES.length).toBe(headings.length);
    expect(new Set(SPELL_LORES.map((l) => l.id)).size).toBe(SPELL_LORES.length);
    expect(SPELL_LORES.map((l) => l.name)).toEqual(headings.map((h) => h.slice("## Magic — ".length).trim()));
  });

  it("every lore has a source URL, intro, D6 die and a source ref into the reference file", () => {
    for (const l of SPELL_LORES) {
      expect(l.sourceUrl, l.id).toMatch(/^https:\/\/mordheimer\.net\/docs\/magic\//);
      expect(l.intro.length, l.id).toBeGreaterThan(0);
      expect(l.die, l.id).toBe("D6");
      expect(l.source.file, l.id).toMatch(/^03-campaigns-magic-optional-rules\.md:\d+-\d+$/);
      expect(new Set(l.spells.map((s) => s.id)).size, `${l.id}: duplicate spell ids`).toBe(l.spells.length);
      for (const s of l.spells) expect(s.text.length, `${l.id}/${s.id}: empty text`).toBeGreaterThan(0);
    }
  });

  it("every lore has six spells covering rolls 1-6, except the two the source structures differently", () => {
    for (const l of SPELL_LORES) {
      const rolls = l.spells.map((s) => s.roll);
      if (l.id === "rituals_of_hashut") {
        // Source table runs 0-6: row 0 is the Sacrificial Ritual (only castable at an Engine of Chaos), so 7 spells.
        expect(l.spells.length).toBe(7);
        expect(rolls.map((r) => r.min)).toEqual([0, 1, 2, 3, 4, 5, 6]);
        expect(l.spells[0].name).toBe("Sacrificial Ritual");
      } else if (l.id === "necromancy_the_restless_dead") {
        // Source row 6 is "Death Visage/Living Horror": two spells (Necromancers only / Liche only) sharing roll 6.
        expect(l.spells.length).toBe(7);
        expect(rolls.map((r) => r.min)).toEqual([1, 2, 3, 4, 5, 6, 6]);
        expect(l.spells.slice(5).map((s) => s.name)).toEqual(["Deathly Visage (Necromancers only)", "Living Horror (Liche only)"]);
      } else {
        expect(l.spells.length, l.id).toBe(6);
        expect(rolls.map((r) => r.min), l.id).toEqual([1, 2, 3, 4, 5, 6]);
      }
      for (const r of rolls) expect(r.max, l.id).toBe(r.min);
    }
  });

  it("every spell has a difficulty of 5-12, or null only for the six 'Auto' spells", () => {
    const autoSet = new Set(AUTO_SPELLS.map(([l, s]) => `${l}/${s}`));
    const nulls: string[] = [];
    for (const l of SPELL_LORES) {
      for (const s of l.spells) {
        if (s.difficulty === null) nulls.push(`${l.id}/${s.id}`);
        else {
          expect(s.difficulty, `${l.id}/${s.id}`).toBeGreaterThanOrEqual(5);
          expect(s.difficulty, `${l.id}/${s.id}`).toBeLessThanOrEqual(12);
        }
      }
    }
    expect(new Set(nulls)).toEqual(autoSet);
  });

  it("spot-checks Amazon Rituals and Prayers of Sigmar", () => {
    const amazon = findLore("amazon_rituals")!;
    expect(amazon.name).toBe("Amazon Rituals");
    expect(amazon.spells[0].name).toBe("Singing Wind");
    expect(amazon.spells[0].roll).toEqual({ min: 1, max: 1 });
    expect(amazon.spells[0].difficulty).toBe(8);
    expect(amazon.usedBy).toEqual(["Amazons (Lustria) Serpent Priestess", "Amazons (Mordheim) Priestess"]);
    expect(findSpell("amazon_rituals", "singing_wind")?.name).toBe("Singing Wind");

    const sigmar = findLore("prayers_of_sigmar")!;
    expect(sigmar.name).toBe("Prayers of Sigmar");
    expect(sigmar.spells.length).toBe(6);
    expect(findLore("no_such_lore")).toBeUndefined();
    expect(findSpell("amazon_rituals", "no_such_spell")).toBeUndefined();
  });

  it("keeps editorial notes out of spell text", () => {
    const mortuary = findLore("mortuary_cult_scrolls")!;
    expect(mortuary.notes).toContain("**MUMMY:**");
    for (const s of mortuary.spells) expect(s.text).not.toContain("**MUMMY:**");
    const ulric = findLore("prayers_of_ulric")!;
    expect(ulric.notes).toContain("**MAXIMUM CHARACTERISTICS**");
  });
});

describe("wizard allocations", () => {
  it("covers every row of the Wizard -> Type of Magic table and resolves each to a lore", () => {
    expect(WIZARD_ALLOCATIONS.length).toBe(39);
    const loreNames = new Set(SPELL_LORES.map((l) => l.name));
    for (const a of WIZARD_ALLOCATIONS) {
      if (loreNames.has(a.loreName)) {
        expect(a.loreId, a.wizard).not.toBeNull();
        expect(findLore(a.loreId!)?.name).toBe(a.loreName);
        expect(findLore(a.loreId!)?.usedBy).toContain(a.wizard);
      } else {
        expect(a.loreId, a.wizard).toBeNull();
      }
    }
    // Every lore is used by at least one wizard in the table.
    for (const l of SPELL_LORES) expect(l.usedBy.length, l.id).toBeGreaterThan(0);
  });
});
