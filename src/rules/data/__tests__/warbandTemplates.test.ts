import { describe, expect, it } from "vitest";
import { WARBAND_TEMPLATES, findWarbandTemplate, heroCapacity, rosterLimitUpperBound } from "../warbandTemplates";
import { TRAITS } from "../traits";
import { SKILLS } from "../skills";

describe("warband templates", () => {
  it("have unique warband and unit ids, resolvable equipment lists and known trait/skill ids", () => {
    const warbandIds = new Set<string>();
    const unitIds = new Set<string>();
    const traitIds = new Set(TRAITS.map((t) => t.id));
    const skillIds = new Set(SKILLS.map((s) => s.id));
    for (const w of WARBAND_TEMPLATES) {
      expect(warbandIds.has(w.id), `duplicate warband id ${w.id}`).toBe(false);
      warbandIds.add(w.id);
      for (const t of w.raceTraits) expect(traitIds.has(t), `${w.id}: unknown trait ${t}`).toBe(true);
      for (const s of w.warbandSkillIds) expect(skillIds.has(s), `${w.id}: unknown skill ${s}`).toBe(true);
      const lists = new Set(w.equipmentLists.map((l) => l.id));
      for (const u of [...w.heroTemplates, ...w.henchmanTemplates]) {
        expect(unitIds.has(u.id), `duplicate unit id ${u.id}`).toBe(false);
        unitIds.add(u.id);
        if (u.equipmentListId !== "none") expect(lists.has(u.equipmentListId), `${u.id}: missing equipment list`).toBe(true);
        for (const t of u.traitIds ?? []) expect(traitIds.has(t), `${u.id}: unknown trait ${t}`).toBe(true);
      }
    }
  });

  it("includes The Restless Dead (Variant) with its Liche-led roster", () => {
    const w = findWarbandTemplate("the_restless_dead_variant")!;
    expect(w.name).toBe("The Restless Dead (Variant)");
    expect(w.heroTemplates.map((h) => h.name)).toEqual(["Liche", "Necromancer", "Grave Guards"]);
    expect(w.henchmanTemplates.map((h) => h.name)).toEqual(["Zombies", "Skeletons", "Wights", "Bone Goliath"]);
    const guard = w.heroTemplates.find((h) => h.name === "Grave Guards")!;
    expect(guard.traitIds).toContain("wight_blades_5plus");
    expect(guard.traitIds).toContain("no_pain");
    const goliath = w.henchmanTemplates.find((h) => h.name === "Bone Goliath")!;
    expect(goliath.stats).toEqual({ M: 5, WS: 3, BS: 0, S: 5, T: 5, W: 3, I: 2, A: 3, Ld: 6 });
    expect(goliath.traitIds).toContain("undead_construct");
  });

  it("every template carries a Choice of Warriors composition with verbatim text", () => {
    for (const w of WARBAND_TEMPLATES) {
      expect(w.composition, `${w.id}: missing composition`).toBeDefined();
      expect(w.composition!.text.trim().length, `${w.id}: empty composition text`).toBeGreaterThan(0);
      expect(w.composition!.minModels, `${w.id}: minModels`).toBe(3);
    }
  });

  it("parses the well-known roster limits", () => {
    const comp = (id: string) => findWarbandTemplate(id)!.composition!;
    expect(comp("cult_of_the_possessed")).toMatchObject({ minModels: 3, maxModels: 15, startingGold: 500 });
    expect(comp("skaven_of_clan_eshin").maxModels).toBe(20);
    expect(comp("witch_hunters").maxModels).toBe(12);
    expect(comp("beastmen_raiders").maxModels).toBe(15);
    expect(comp("merchant_caravans").startingGold).toBe(600);
    expect(comp("snotlings").maxModels).toBe(30);
  });

  it("states a maximum warband size for every template", () => {
    // Every published Choice of Warriors paragraph names a maximum (no ids currently have null maxModels).
    const noMax = WARBAND_TEMPLATES.filter((w) => w.composition!.maxModels === null).map((w) => w.id);
    expect(noMax).toEqual([]);
    expect(noMax.length).toBe(0);
  });

  it("derives hero capacity from hero rosterLimit upper bounds", () => {
    expect(rosterLimitUpperBound("1")).toBe(1);
    expect(rosterLimitUpperBound("0-2")).toBe(2);
    expect(rosterLimitUpperBound("0-2 (shares its recruitment slot with the Cleric)")).toBe(2);
    expect(rosterLimitUpperBound("1+")).toBeNull();
    expect(rosterLimitUpperBound("any")).toBeNull();
    // Mercenaries (Reikland): 1 Captain + 0-2 Champions + 0-2 Youngbloods.
    expect(heroCapacity(findWarbandTemplate("mercenaries_reikland")!)).toBe(5);
  });
});
