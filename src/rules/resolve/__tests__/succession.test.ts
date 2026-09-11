import { mazzalupoCommands, resolveSuccessorCommand } from '../mazzalupoCommands'
import { loreForHero } from '../../../features/advances/model'
import { inheritedLeadershipRules } from '../../../features/roster/view/lookups'
import { recruitHero, canRecruit } from '../recruitment';
import { currentLeader, validateRoster, unitCount } from '../roster';
import { warriorFlagsSchema } from '../../../domain/json';
import { findLeaderId } from '../../../features/postBattle/model/participants';
import { availableSkills } from '../advances';
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

it('keeps a temporary Gnoblar leader a Gnoblar and hands leadership to a replacement Ogre Hunter', () => {
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

it('grants a Merchant successor the Merchant skill list without importing other leader skill lists', () => {
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

it('Protectorate succession grants only the next-advance prayer choice, not a free prayer',()=>{
 const template=findWarbandTemplate('protectorate_of_sigmar')!
 const acolyte=hero('a','acolytes',{xp:7})
 const next=appointLeader(warband(template.id,[acolyte]),template,'a').value.heroes[0]
 expect(next.unitTemplateId).toBe('warrior_priest')
 expect(next.spellIds).toEqual([])
 expect(next.levelUps).toBe(acolyte.levelUps)
 expect(warriorFlagsSchema.parse(next.flags).protectoratePrayerChoice).toBe(true)
})


it('Black Orc succession prefers real Black Orcs and preserves the fallback Orc’s profile and armour rules',()=>{
 const template=findWarbandTemplate('black_orcs')!
 const boy=hero('boy','black_orcs_orc_boy',{xp:30,stats:{...stats,Ld:9}})
 const black=hero('black','black_orcs_black_orc',{xp:2})
 const w=warband(template.id,[boy,black])
 expect(successionOptions(w,template)?.candidates.map(c=>c.hero.id)).toEqual(['black'])
 expect(()=>appointLeader(w,template,'boy')).toThrow()
 const fallback=warband(template.id,[boy])
 const next=appointLeader(fallback,template,'boy').value
 const boss=next.heroes[0]
 expect(boss.unitTemplateId).toBe('black_orcs_orc_boy')
 expect(boss.stats).toEqual(boy.stats)
 expect(boss.flags.leaderRoleId).toBe('black_orcs_black_orc_boss')
 expect(warriorFlagsSchema.parse(boss.flags).leaderRoleId).toBe('black_orcs_black_orc_boss')
 expect(currentLeader(next.heroes,template)?.id).toBe('boy')
 expect(needsLeader(next,template)).toBe(false)
 expect(canRecruit(next,template,'black_orcs_black_orc_boss').ok).toBe(false)
 expect(inheritedLeadershipRules(template,boss.flags.leaderRoleId).map(r=>r.name)).toEqual(['Leader','Oi Behave!'])
 expect(inheritedLeadershipRules(template,boss.flags.leaderRoleId).some(r=>r.name==='Black Orc')).toBe(false)
 const blackLed=appointLeader(w,template,'black').value
 expect(unitCount(blackLed,template.heroTemplates.find(h=>h.id==='black_orcs_black_orc')!)).toBe(0)
 expect(unitCount(blackLed,template.heroTemplates.find(h=>h.id==='black_orcs_black_orc_boss')!)).toBe(1)
 const proven=hero('proven','black_orcs_youngun',{skillIds:['black_orcs_skills_proven_warrior']})
 expect(successionOptions(warband(template.id,[boy,proven]),template)?.candidates.map(c=>c.hero.id)).toEqual(['proven'])
})


it('keeps the Priest of Morr as priest after a Dreamer dies and bars another Dreamer',()=>{
 const t=findWarbandTemplate('dreamwalkers_cult_of_morr')!
 const w={...warband(t.id,[hero('dreamer','dreamwalkers_dreamer',{status:'dead'}),hero('priest','dreamwalkers_priest_of_morr')]),gold:500}
 expect(currentLeader(w.heroes.map(h=>({...h,status:'active' as const})),t)?.id).toBe('dreamer')
 expect(canRecruit(w,t,'dreamwalkers_dreamer').ok).toBe(false)
 expect(currentLeader(w.heroes,t)?.id).toBe('priest')
 expect(w.heroes[1].unitTemplateId).toBe('dreamwalkers_priest_of_morr')
})


it('lets Strigos survive under a human successor without granting vampire powers',()=>{
 const t=findWarbandTemplate('survivors_of_strigos')!
 const unit=t.heroTemplates.find(u=>u.id!=='strigoi_vampire')!
 const w=warband(t.id,[hero('v','strigoi_vampire',{status:'dead'}),hero('h',unit.id)])
 expect(successionOptions(w,t)?.disbands).toBe(false)
 const next=appointLeader(w,t,'h').value
 expect(next.heroes[1].unitTemplateId).toBe(unit.id)
 expect(next.heroes[1].stats).toEqual(w.heroes[1].stats)
 expect(currentLeader(next.heroes,t)?.id).toBe('h')
 expect(inheritedLeadershipRules(t,next.heroes[1].flags.leaderRoleId).map(r=>r.name)).toEqual(['Leader'])
 expect(canRecruit({...next,gold:500},t,'strigoi_vampire').ok).toBe(false)
})


it('grants a Mazzalupo successor one random Command without making a wizard',()=>{
 const t=findWarbandTemplate('mazzalupo')!
 const w=warband(t.id,[hero('old','mazzalupo_wandering_knight',{status:'dead'}),hero('new','mazzalupo_squire')])
 const appointed=appointLeader(w,t,'new').value
 expect(appointed.heroes[1].flags.successorCommandPending).toBe(true)
 expect(appointed.heroes[1].unitTemplateId).toBe('mazzalupo_squire')
 expect(inheritedLeadershipRules(t,appointed.heroes[1].flags.leaderRoleId).map(r=>r.name)).toEqual(['Leader','Commands'])
 for(let die=1;die<=6;die++) {
   const result=resolveSuccessorCommand(appointed,'new',die,'App rolled 2; Player entered '+die)
   expect(result.value.heroes[1].flags.commandIds).toEqual([mazzalupoCommands()[die-1].id])
   expect(result.value.heroes[1].spellIds).toEqual([])
   expect(loreForHero(result.value.heroes[1],t)).toBeNull()
   expect(result.events[0].message).toContain('App rolled 2; Player entered '+die)
   expect(()=>resolveSuccessorCommand(result.value,'new',die,'')).toThrow(/no pending/)
 }
 expect(()=>resolveSuccessorCommand(appointed,'new',7,'')).toThrow(/D6/)
})
