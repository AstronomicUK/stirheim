import {describe,it,expect} from 'vitest';
import {availableVictuals,incomeSize,sellWyrdstone,wyrdstoneQuote} from '../income';
import {resaleQuote,sellItem} from '../trading';
import {recruitHenchmen,veteranPoolCost} from '../recruitment';
import {makeWarband,makeHero,makeHenchmanGroup,makeHiredSword} from './fixtures';
import {findItem} from '../../data/items';
import {findWarbandTemplate} from '../../data/warbandTemplates';
import {veteranQuote} from '../../../features/recruitment/helpers';
import {sellListing} from '../../../features/trading/helpers';
const supplies=(quantity:number)=>({itemId:'victuals',quantity});
describe('Victuals income',()=>{
 it('uses exact inventory across holders, leaves unavailable supplies and composes with Foragers',()=>{
  const w=makeWarband({warbandTemplateId:'hochland_bandits',stash:[supplies(1)],heroes:[makeHero({equipment:[supplies(2)]}),makeHero({id:'dead',status:'dead',equipment:[supplies(8)]})],henchmenGroups:[makeHenchmanGroup({size:10,equipment:[supplies(3)]})],hiredSwords:[makeHiredSword({equipment:[supplies(9)]})]});
  expect(availableVictuals(w)).toBe(6);
  expect(incomeSize(w,{victuals:2}).bandShift).toBe(-3);
  const result=sellWyrdstone(w,3,{victuals:4});
  expect(result.value.gold-w.gold).toBe(wyrdstoneQuote(w,3,{sizeOverride:3}));
  expect(result.value.stash).toEqual([]);expect(result.value.heroes[0].equipment).toEqual([]);
  expect(result.value.henchmenGroups[0].equipment).toEqual([supplies(2)]);
  expect(result.value.heroes[1].equipment).toEqual([supplies(8)]);
  expect(w.stash).toEqual([supplies(1)]);expect(result.events[0].message).toContain('Consumed 4 Victuals');
 });
 it('preserves supplies with no use, clamps the smallest band and stacks with scenario/map income',()=>{
  const w=makeWarband({stash:[supplies(4)]});
  expect(sellWyrdstone(w,2).value.stash).toEqual(w.stash);
  expect(wyrdstoneQuote(w,2,{victuals:4})).toBe(wyrdstoneQuote(w,2,{victuals:1}));
  const base=wyrdstoneQuote(w,2,{victuals:1});
  expect(sellWyrdstone(w,2,{victuals:1,bonusRate:0.2,scenarioMultiplier:3}).value.gold-w.gold).toBe((base+Math.floor(base*.2))*3);
  for(const victuals of [-1,0.5,5])expect(()=>sellWyrdstone(w,2,{victuals})).toThrow();
  expect(()=>sellWyrdstone(w,0,{victuals:1})).toThrow();
 });
});
describe('Bandit resale',()=>{
 const w=makeWarband({warbandTemplateId:'hochland_bandits',stash:[{itemId:'blessed_water',quantity:2}]});
 it('includes half the random component per copy and records dice',()=>{
  expect(findItem('blessed_water')!.price).toMatchObject({base:10,dice:'3D6'});
  const r=sellItem(w,{kind:'stash'},'blessed_water',2,10,{rolls:[[1,3,5],[6,6,6]]});
  expect(r.value.gold-w.gold).toBe(23);expect(r.value.stash).toEqual([]);
  expect(r.events[0].message).toContain('price dice 1 + 3 + 5 / 6 + 6 + 6');
  expect(resaleQuote({...w,warbandTemplateId:'pirates'},'blessed_water',2,10)).toBe(10);
 });
 it('requires valid separate dice and refuses missing inventory',()=>{
  for(const rolls of [undefined,[[6]],[[0],[6]],[[7],[6]],[[1.5],[6]],[[1,2],[6]]])expect(()=>sellItem(w,{kind:'stash'},'blessed_water',2,10,{rolls})).toThrow();
  expect(()=>sellItem(w,{kind:'stash'},'blessed_water',3,10,{rolls:[[1],[2],[3]]})).toThrow();
 });
 it('retains ordinary sales, and map weapons use the displayed full base',()=>{
  const base=makeWarband({stash:[{itemId:'sword',quantity:1},{itemId:'blessed_water',quantity:1}]});
  expect(sellItem(base,{kind:'stash'},'sword',1,10).value.gold-base.gold).toBe(5);
  const lines=sellListing(base,{resaleAtFull:true});expect(lines.slice(0,2).map(l=>l.each)).toEqual([10,5]);
  expect(sellItem(base,{kind:'stash'},'sword',1,10,{fullBase:true}).value.gold-base.gold).toBe(lines[0].each);
 });
});
describe('Sons of Hashut Uncommon',()=>{
 const template=findWarbandTemplate('the_sons_of_hashut')!;
 const dwarf='sons_of_hashut_chaos_dwarf_warriors';
 it('uses six pool XP for a four-XP dwarf, but charges eight extra gold',()=>{
  const group=makeHenchmanGroup({unitTemplateId:dwarf,size:1,xp:4});
  const w=makeWarband({warbandTemplateId:template.id,heroes:[],henchmenGroups:[group],gold:500,veteranPool:12});
  const result=recruitHenchmen(w,template,dwarf,'Dwarfs',2,'new',{intoGroupId:group.id});
  expect(result.value.poolRemaining).toBe(0);
  expect(result.value.warband.gold).toBe(500-template.henchmanTemplates.find(u=>u.id===dwarf)!.cost!*2-16);
  expect(result.value.warband.henchmenGroups[0].size).toBe(3);
  expect(veteranQuote(group,2,12,template.id)).toEqual({xp:12,gold:16,needsPool:false,exceedsPool:false});
  expect(()=>recruitHenchmen({...w,veteranPool:11},template,dwarf,'Dwarfs',2,'new',{intoGroupId:group.id})).toThrow();
 });
 it('rounds per recruit, covers blunderbussers and excludes Hobgoblins and other warbands',()=>{
  expect(veteranPoolCost(template.id,dwarf,3,2)).toBe(10);
  expect(veteranPoolCost(template.id,'sons_of_hashut_blunderbuss_chaos_dwarfs',3,1)).toBe(5);
  expect(veteranPoolCost(template.id,'sons_of_hashut_hobgoblins',3,2)).toBe(6);
  expect(veteranPoolCost('mercenaries_reikland',dwarf,3,2)).toBe(6);
  expect(veteranPoolCost(template.id,dwarf,0,2)).toBe(0);
 });
});
