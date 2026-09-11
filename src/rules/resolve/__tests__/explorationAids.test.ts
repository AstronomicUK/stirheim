import { makeHiredSword } from './fixtures';
import { describe, expect, it } from "vitest";
import type { RosterHero, RosterItem, RosterWarband } from "../../types/roster";
import { aidUsesLeft, explorationAids, leadershipTest, mordheimMapResult, validateAidUse } from "../explorationAids";

const stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 8 };
const hero = (id: string, equipment: RosterItem[], unit = "mercenaries_reikland_champions"): RosterHero => ({
  id, name: id, unitTemplateId: unit, stats, xp: 0, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, equipment, status: "active",
});
const warband = (heroes: RosterHero[], templateId = "mercenaries_reikland", stash: RosterItem[] = []): RosterWarband => ({
  id: "w", name: "W", warbandTemplateId: templateId, gold: 0, wyrdstone: 0, veteranPool: null, heroes, henchmenGroups: [], hiredSwords: [], stash,
});
const base = { houseRules: { rabbitsFootBattleOnly: true }, heroesOutOfAction: [] as string[], preBattle: {} as Record<string, string> };

describe("exploration aids", () => {
  it("reads the map's grade from its purchase note", () => {
    expect(mordheimMapResult(3).grade).toBe("Vague");
    expect(mordheimMapResult(5).grade).toBe("Accurate");
    const w = warband([hero("a", [{ itemId: "mordheim_map", quantity: 1, notes: mordheimMapResult(5).note }])]);
    const aids = explorationAids(w, base);
    expect(aids).toHaveLength(1);
    expect(aids[0]).toMatchObject({ kind: "reroll", uses: 3, label: "Mordheim Map (Accurate)" });
    const fake = warband([hero("a", [{ itemId: "mordheim_map", quantity: 1, notes: mordheimMapResult(1).note }])]);
    expect(explorationAids(fake, base)).toEqual([]);
  });

  it("a Master map needs its owner standing; a Pendulum needs a Leadership test", () => {
    const w = warband([hero("a", [{ itemId: "mordheim_map", quantity: 1, notes: mordheimMapResult(6).note }, { itemId: "wyrdstone_pendulum", quantity: 1 }])]);
    expect(explorationAids(w, base).map((a) => a.key)).toEqual(["map:a", "pendulum:a"]);
    expect(explorationAids(w, { ...base, heroesOutOfAction: ["a"] })).toEqual([]);
    const pendulum = explorationAids(w, base)[1];
    expect(pendulum.requiresTest).toEqual({ stat: "Ld", value: 8 });
    expect(leadershipTest([4, 4], 8)).toBe(true);
    expect(leadershipTest([5, 4], 8)).toBe(false);
    expect(() => validateAidUse(pendulum, { aidKey: pendulum.key, label: pendulum.label, dieIndex: 0, from: 1, to: 6 })).toThrow(/Ld test/);
    expect(() => validateAidUse(pendulum, { aidKey: pendulum.key, label: pendulum.label, dieIndex: 0, from: 1, to: 6, test: { rolls: [3, 3], passed: true } })).not.toThrow();
  });

  it("the Rabbit's Foot obeys the house rule and the Tarot needs a pre-battle pass", () => {
    const w = warband([hero("a", [{ itemId: "rabbits_foot", quantity: 1 }, { itemId: "tarot_cards", quantity: 1 }])]);
    expect(explorationAids(w, base)).toEqual([]);
    expect(explorationAids(w, { ...base, houseRules: { rabbitsFootBattleOnly: false } }).map((a) => a.key)).toEqual(["rabbit:a"]);
    const tarot = explorationAids(w, { ...base, preBattle: { "tarot:a": "passed" } });
    expect(tarot[0]).toMatchObject({ kind: "modify", uses: 1 });
    expect(() => validateAidUse(tarot[0], { aidKey: tarot[0].key, label: "Tarot Cards", dieIndex: 0, from: 3, to: 5 })).toThrow(/exactly one/);
    expect(aidUsesLeft(tarot[0], [{ aidKey: tarot[0].key, label: "Tarot Cards", dieIndex: 0, from: 3, to: 4 }])).toBe(0);
  });

  it("the Augur rolls two dice and keeps one", () => {
    const w = warband([hero("aug", [], "sisters_of_sigmar_augur")], "sisters_of_sigmar");
    expect(explorationAids(w, base)[0]).toMatchObject({ kind: "rollTwoKeepOne", key: "keepone:aug" });
    expect(explorationAids(w, { ...base, heroesOutOfAction: ["aug"] })).toEqual([]);
  });
});

describe('warband exploration specialists (#104, #106)', () => {
  it('gives a standing Mountain Guide a choice of two results, not a reroll', () => {
    const guide = hero('guide', [], 'maneaters_mountain_guide'); const roster = warband([guide], 'maneaters');
    expect(explorationAids(roster, base)).toEqual([expect.objectContaining({kind:'rollTwoKeepOne',uses:1,holderId:'guide'})]);
    expect(explorationAids(roster, {...base,heroesOutOfAction:['guide']})).toEqual([]);
    guide.flags.missNextGames = 1;
    expect(explorationAids(roster, base)).toEqual([]);
  });
  it('offers one Trailblazers reroll per remaining Poacher, never per group', () => {
    const roster = warband([], 'hochland_bandits');
    roster.henchmenGroups = [{id:'poachers',name:'Poachers',unitTemplateId:'hochland_bandits_poacher',size:2,stats,xp:0,levelUps:0,statIncreases:{},equipment:[]}];
    expect(explorationAids(roster, base)[0]).toMatchObject({kind:'reroll',uses:2});
    roster.henchmenGroups[0].size = 1;
    expect(explorationAids(roster, base)[0].uses).toBe(1);
    roster.henchmenGroups[0].size = 0;
    expect(explorationAids(roster, base)).toEqual([]);
  });
});

it('does not reroll the same die using another aid, but permits a Guide choice before a reroll', () => {
  const aid = {key:'poacher',label:'Trailblazers',kind:'reroll' as const,uses:2,holderId:null,holderName:'Poachers',note:''};
  const use = {aidKey:'poacher',label:'Trailblazers',dieIndex:0,from:2,to:4};
  expect(() => validateAidUse(aid,use,[{...use,aidKey:'rabbit:hero',kind:'reroll'}])).toThrow(/already been rerolled/);
  expect(() => validateAidUse(aid,use,[{...use,aidKey:'keepone:guide',kind:'rollTwoKeepOne'}])).not.toThrow();
  expect(() => validateAidUse(aid,{...use,dieIndex:1},[{...use,kind:'reroll'}])).not.toThrow();
});

 it('grants the Elf Ranger modifier, including a surviving OOA ranger, but not a dead ranger (#66)', () => {
   const roster = warband([]);
   roster.hiredSwords = [makeHiredSword({id:'ranger',hiredSwordId:'elf_ranger'})];
   const aid = explorationAids(roster,{...base,heroesOutOfAction:['ranger']})[0];
   expect(aid).toMatchObject({key:'seeker:ranger',kind:'modify',uses:1});
   expect(() => validateAidUse(aid,{aidKey:aid.key,label:aid.label,dieIndex:0,from:3,to:5})).toThrow(/exactly one/);
   roster.hiredSwords[0].status = 'dead';
   expect(explorationAids(roster,base)).toEqual([]);
 });


describe('native exploration skills (#66)', () => {
  it.each(['dwarf_treasure_hunters_dwarf_skills_resource_hunter', 'dwarf_rangers_dwarf_skills_resource_hunter', 'black_dwarfs_skills_resource_hunter', 'wood_elves_of_athel_loren_special_skills_seeker'])('offers a single adjustment for %s', skill => {
    const bearer = {...hero('bearer', []), skillIds: [skill]};
    const aids = explorationAids(warband([bearer]), base);
    expect(aids).toHaveLength(1);
    expect(aids[0]).toMatchObject({kind:'modify',uses:1,holderId:'bearer'});
    const use = {aidKey:aids[0].key,label:aids[0].label,dieIndex:0,from:3,to:4};
    expect(() => validateAidUse(aids[0], use)).not.toThrow();
    expect(() => validateAidUse(aids[0], {...use,to:5})).toThrow(/exactly one/);
    expect(() => validateAidUse(aids[0], use, [use])).toThrow(/already been used/);
    expect(explorationAids(warband([{...bearer,status:'dead'}]), base)).toEqual([]);
  });
  it('requires the Strigany Seer to survive the battle and identifies the correct warband', () => {
    const seer = hero('seer', [], 'seer');
    expect(explorationAids(warband([seer], 'survivors_of_strigos'), base)).toEqual([expect.objectContaining({key:'seeker:seer',kind:'modify'})]);
    expect(explorationAids(warband([seer], 'survivors_of_strigos'), {...base,heroesOutOfAction:['seer']})).toEqual([]);
    expect(explorationAids(warband([seer]), base)).toEqual([]);
  });
  it('does not mistake a legacy Seeker adjustment for a reroll', () => {
    const aid = {key:'map:hero',label:'Map',kind:'reroll' as const,uses:1,holderId:'hero',holderName:'Hero',note:''};
    expect(() => validateAidUse(aid, {aidKey:aid.key,label:aid.label,dieIndex:0,from:4,to:2}, [{aidKey:'seeker:hero',label:'Seeker',dieIndex:0,from:3,to:4}])).not.toThrow();
  });
});


describe('hired exploration specialists and Wyrdstone Hunter', () => {
  it('applies the Kislev OOA restriction without inventing one for the Tomb Robber', () => {
    const roster = warband([]);
    roster.hiredSwords = [makeHiredSword({id:'kislev',hiredSwordId:'kislev_ranger'}), makeHiredSword({id:'tomb',hiredSwordId:'tomb_robber'})];
    expect(explorationAids(roster, base).map(a=>a.key)).toEqual(['seeker:kislev','explorer:tomb']);
    expect(explorationAids(roster, {...base,heroesOutOfAction:['kislev','tomb']}).map(a=>a.key)).toEqual(['explorer:tomb']);
    roster.hiredSwords[1].status = 'left';
    expect(explorationAids(roster, {...base,heroesOutOfAction:['kislev']})).toEqual([]);
  });
  it('offers Wyrdstone Hunter to a searching Hero and the Prospector, enforcing the second-result rule', () => {
    const roster = warband([{...hero('hunter', []),skillIds:['wyrdstone_hunter']}]);
    roster.hiredSwords = [makeHiredSword({id:'prospector',hiredSwordId:'old_prospector',skillIds:['wyrdstone_hunter']})];
    const aids = explorationAids(roster, base);
    expect(aids).toHaveLength(2);
    expect(aids.every(a=>a.kind==='reroll' && a.uses===1)).toBe(true);
    expect(explorationAids(roster, {...base,heroesOutOfAction:['hunter','prospector']})).toEqual([]);
    const previous = {aidKey:aids[0].key,label:aids[0].label,kind:'reroll' as const,dieIndex:0,from:3,to:2};
    expect(() => validateAidUse(aids[1], {...previous,aidKey:aids[1].key,from:2,to:5}, [previous])).toThrow(/already been rerolled/);
  });
});


it('honours Resource Hunter learned by a Dwarf Pathfinder', () => {
  const roster = warband([]);
  roster.hiredSwords = [makeHiredSword({hiredSwordId:'dwarf_pathfinder',skillIds:['dwarf_rangers_dwarf_skills_resource_hunter']})];
  expect(explorationAids(roster, base)).toEqual([expect.objectContaining({label:'Resource Hunter',kind:'modify',uses:1})]);
});
