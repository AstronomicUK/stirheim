import { describe, expect, it } from "vitest";
import { findHiredSword } from "../../data/campaign/hiredSwords";
import type { RosterHero } from "../../types/roster";
import { characterSearchers, resolveCharacterSearch } from "../dramatis";
import { hireHiredSword } from "../recruitment";

const stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 };
const hero = (id: string, I: number, status: RosterHero["status"] = "active"): RosterHero => ({
  id, name: id, unitTemplateId: "x", stats: { ...stats, I }, xp: 0, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [], status,
});

describe("searching for a Dramatis Persona", () => {
  it("finds the character on a roll under Initiative, once every searcher has rolled", () => {
    const partial = resolveCharacterSearch([{ heroId: "a", name: "Anna", initiative: 4, roll: 2 }, { heroId: "b", name: "Bo", initiative: 3, roll: null }]);
    expect(partial.complete).toBe(false);
    expect(partial.found).toBe(false);
    const done = resolveCharacterSearch([{ heroId: "a", name: "Anna", initiative: 4, roll: 4 }, { heroId: "b", name: "Bo", initiative: 3, roll: 2 }]);
    expect(done).toMatchObject({ complete: true, found: true, finders: ["Bo"] });
    expect(done.lines[0]).toContain("no luck");
    expect(resolveCharacterSearch([{ heroId: "a", name: "Anna", initiative: 1, roll: 1 }]).found).toBe(false);
  });

  it("refuses an empty party and a bad die", () => {
    expect(() => resolveCharacterSearch([])).toThrow(/at least one/);
    expect(() => resolveCharacterSearch([{ heroId: "a", name: "Anna", initiative: 4, roll: 7 }])).toThrow(/valid D6/);
  });

  it("only standing heroes who have not searched yet may look", () => {
    const heroes = [hero("a", 3), hero("b", 3), hero("c", 3), hero("d", 3, "dead")];
    expect(characterSearchers(heroes, ["b"], ["c"]).map((h) => h.id)).toEqual(["a"]);
  });

  it("a found persona hires like a hired sword", () => {
    const persona = findHiredSword("johann_the_knife")!;
    expect(persona.hireCost.base).toBe(70);
    const warband = { id: "w", name: "W", warbandTemplateId: "mercenaries_reikland", gold: 100, wyrdstone: 0, veteranPool: null, heroes: [hero("a", 3)], henchmenGroups: [], hiredSwords: [], stash: [] };
    const r = hireHiredSword(warband, "johann_the_knife", "j1");
    expect(r.value.gold).toBe(30);
    expect(r.value.hiredSwords[0]).toMatchObject({ hiredSwordId: "johann_the_knife", name: "Johann the knife" });
  });
});
