import { describe, expect, it } from "vitest";
import { findWarbandTemplate } from "../../data/warbandTemplates";
import type { RosterHero, RosterWarband } from "../../types/roster";
import { appointLeader, needsLeader, successionOptions } from "../succession";

const stats = { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 };
const hero = (id: string, unit: string, over: Partial<RosterHero> = {}): RosterHero => ({
  id, name: id, unitTemplateId: unit, stats, xp: 0, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [], status: "active", ...over,
});
const warband = (templateId: string, heroes: RosterHero[]): RosterWarband => ({
  id: "w", name: "W", warbandTemplateId: templateId, gold: 0, wyrdstone: 0, veteranPool: null, heroes, henchmenGroups: [], hiredSwords: [], stash: [],
});

describe("leader succession", () => {
  const REIKLAND = findWarbandTemplate("mercenaries_reikland")!;
  it("offers every hero when the list has no rule, most experienced first", () => {
    const w = warband(REIKLAND.id, [hero("cap", "mercenaries_reikland_captain", { status: "dead" }), hero("a", "mercenaries_reikland_champions", { xp: 5 }), hero("b", "mercenaries_reikland_youngbloods", { xp: 9 })]);
    expect(needsLeader(w, REIKLAND)).toBe(true);
    const view = successionOptions(w, REIKLAND)!;
    expect(view.leaderUnitName).toBe("Mercenary Captain");
    expect(view.candidates.map((c) => c.hero.id)).toEqual(["b", "a"]);
    const next = appointLeader(w, REIKLAND, "a").value;
    expect(next.heroes.find((h) => h.id === "a")?.unitTemplateId).toBe("mercenaries_reikland_captain");
    expect(needsLeader(next, REIKLAND)).toBe(false);
    expect(() => appointLeader(next, REIKLAND, "b")).toThrow(/already has/);
  });

  it("follows the list: Necrarchs' Thrall, Protectorate's best Acolyte, Gnoblars by Leadership", () => {
    const NEC = findWarbandTemplate("necrarchs_the_soul_stealers")!;
    const nec = warband(NEC.id, [hero("v", "necrarchs_necrarch_vampire", { status: "dead" }), hero("t", "necrarchs_thrall"), hero("ac", "necrarchs_acolytes", { xp: 20 })]);
    expect(successionOptions(nec, NEC)!.candidates.map((c) => c.hero.id)).toEqual(["t"]);
    const PROT = findWarbandTemplate("protectorate_of_sigmar")!;
    const prot = warband(PROT.id, [hero("p", "warrior_priest", { status: "dead" }), hero("a1", "acolytes", { xp: 3 }), hero("a2", "acolytes", { xp: 7 })]);
    expect(successionOptions(prot, PROT)!.candidates[0].hero.id).toBe("a2");
    const OHP = findWarbandTemplate("ogre_hunting_party")!;
    const ohp = warband(OHP.id, [hero("o", "ogre_hunting_party_ogre_hunter", { status: "dead" }), hero("t1", "ogre_hunting_party_trappers", { stats: { ...stats, Ld: 6 } }), hero("s", "ogre_hunting_party_sabre_baiter", { stats: { ...stats, Ld: 8 } })]);
    expect(successionOptions(ohp, OHP)!.candidates[0].hero.id).toBe("s");
  });

  it("reports when the list leaves nobody to take over", () => {
    const MOULDER = findWarbandTemplate("skaven_of_clan_moulder")!;
    const w = warband(MOULDER.id, [hero("pm", "packmaster", { status: "dead" }), hero("sv", "stormvermin")]);
    const view = successionOptions(w, MOULDER)!;
    expect(view.candidates).toEqual([]);
    expect(view.disbands).toBe(true);
  });

  it("never offers a hero the list bars from leading", () => {
    const WH = findWarbandTemplate("witch_hunters")!;
    const w = warband(WH.id, [hero("c", "witch_hunters_captain", { status: "dead" }), hero("f", "witch_hunters_flagellants"), hero("z", "witch_hunters_witch_hunters")]);
    expect(successionOptions(w, WH)!.candidates.map((c) => c.hero.id)).toEqual(["z"]);
  });
});
