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
  it("offers heroes by Leadership first, using Experience only to break ties", () => {
    const w = warband(REIKLAND.id, [hero("cap", "mercenaries_reikland_captain", { status: "dead" }), hero("a", "mercenaries_reikland_champions", { xp: 5, stats: { ...stats, Ld: 8 }, skillTableIds: ["combat"] }), hero("b", "mercenaries_reikland_youngbloods", { xp: 9 })]);
    expect(needsLeader(w, REIKLAND)).toBe(true);
    const view = successionOptions(w, REIKLAND)!;
    expect(view.leaderUnitName).toBe("Mercenary Captain");
    expect(view.candidates.map((c) => c.hero.id)).toEqual(["a", "b"]);
    const next = appointLeader(w, REIKLAND, "a").value;
    expect(next.heroes.find((h) => h.id === "a")?.unitTemplateId).toBe("mercenaries_reikland_captain");
    expect(next.heroes.find(h => h.id === "a")?.skillTableIds).toEqual(["combat"]);
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

it('identifies a genuine Leadership/Experience tie without silently deciding by roster order', () => {
  const template = findWarbandTemplate('mercenaries_reikland')!;
  const w = warband(template.id, [hero('a', 'mercenaries_reikland_champions', { xp: 8 }), hero('b', 'mercenaries_reikland_champions', { xp: 8 }), hero('c', 'mercenaries_reikland_youngbloods', { xp: 4 })]);
  expect(successionOptions(w, template)?.tiedIds).toEqual(['a', 'b']);
  expect(successionOptions({ ...w, heroes: w.heroes.map(h => h.id === 'b' ? { ...h, xp: 9 } : h) }, template)?.tiedIds).toEqual([]);
});

it('keeps a temporary Gnoblar leader a Gnoblar and hands leadership to a replacement Ogre Hunter', async () => {
  const { recruitHero, canRecruit } = await import('../recruitment');
  const { currentLeader, validateRoster } = await import('../roster');
  const { warriorFlagsSchema } = await import('../../../domain/json');
  const { findLeaderId } = await import('../../../features/postBattle/model/participants');
  const template = findWarbandTemplate('ogre_hunting_party')!;
  const gnoblar = hero('g', 'ogre_hunting_party_sabre_baiter', { xp: 8, skillTableIds: ['combat'], skillIds: ['dodge'], flags: { oldBattleWound: true } });
  const original = { ...warband(template.id, [hero('dead', 'ogre_hunting_party_ogre_hunter', { status: 'dead' }), gnoblar]), gold: 1000 };
  const result = appointLeader(original, template, 'g');
  const promoted = result.value.heroes.find(h => h.id === 'g')!;
  expect(promoted).toEqual({ ...gnoblar, flags: { ...gnoblar.flags, temporaryLeader: true } });
  expect(result.events[0].message).toContain('temporary leader');
  expect(warriorFlagsSchema.parse(promoted.flags).temporaryLeader).toBe(true);
  expect(needsLeader(result.value, template)).toBe(false);
  expect(currentLeader(result.value.heroes, template)?.id).toBe('g');
  expect(findLeaderId(result.value.heroes.filter(h => h.status === 'active'), template)).toBe('g');
  expect(validateRoster(result.value, template).problems.some(p => p.code === 'roster.noLeader')).toBe(false);
  expect(validateRoster(result.value, template, { atCreation: true }).problems.some(p => p.code === 'roster.noLeader')).toBe(true);
  expect(canRecruit(result.value, template, 'ogre_hunting_party_ogre_hunter').ok).toBe(true);
  const replaced = recruitHero(result.value, template, 'ogre_hunting_party_ogre_hunter', 'New Hunter', 'new').value;
  expect(currentLeader(replaced.heroes, template)?.id).toBe('new');
  expect(replaced.heroes.find(h => h.id === 'g')?.flags).toEqual({ oldBattleWound: true, temporaryLeader: false });
  expect(replaced.heroes.find(h => h.id === 'g')?.unitTemplateId).toBe(gnoblar.unitTemplateId);
  // Losing the new leader requires a fresh succession decision, not an old flag silently reviving.
  expect(needsLeader({ ...replaced, heroes: replaced.heroes.map(h => h.id === 'new' ? { ...h, status: 'dead' } : h) }, template)).toBe(true);
  expect(original.heroes[1].flags.temporaryLeader).toBeUndefined();
});

it('includes promoted Gnoblar Fighters and Flingers in temporary succession', () => {
  const template = findWarbandTemplate('ogre_hunting_party')!;
  const w = warband(template.id, [hero('t', 'ogre_hunting_party_trappers'), hero('f', 'ogre_hunting_party_flingers', { stats: { ...stats, Ld: 8 } }), hero('g', 'ogre_hunting_party_gnoblar_fighters', { xp: 9 })]);
  expect(successionOptions(w, template)?.candidates.map(c => c.hero.id)).toEqual(['f', 'g', 't']);
});

it('grants a Merchant successor the Merchant skill list without importing other leader skill lists', async () => {
  const { availableSkills } = await import('../advances');
  const template = findWarbandTemplate('merchant_caravans')!;
  const apprentice = hero('a', 'merchant_apprentice', { skillTableIds: ['combat', 'shooting'], skillIds: ['dodge'] });
  const w = warband(template.id, [apprentice]);
  expect(availableSkills(apprentice, template.id).some(t => t.tableId === 'merchant_caravans_skills')).toBe(false);
  const successor = appointLeader(w, template, 'a').value.heroes[0];
  expect(successor.skillTableIds).toEqual(['combat', 'shooting', 'merchant_caravans_skills']);
  expect(successor.skillIds).toEqual(['dodge']);
  expect(availableSkills(successor, template.id).find(t => t.tableId === 'merchant_caravans_skills')?.skills.map(s => s.id)).toContain('merchant_caravans_skills_bribery');
  expect(appointLeader({ ...w, heroes: [{ ...apprentice, skillTableIds: successor.skillTableIds }] }, template, 'a').value.heroes[0].skillTableIds).toEqual(successor.skillTableIds);
});
