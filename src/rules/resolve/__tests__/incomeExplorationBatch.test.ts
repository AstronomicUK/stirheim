import {describe,it,expect} from 'vitest';
import {incomeSize,sellWyrdstone,wyrdstoneQuote} from '../income';
import {explorationDiceAllowed} from '../exploration';
import {makeWarband,makeHero,makeHenchmanGroup} from './fixtures';
const chef=()=>makeWarband({warbandTemplateId:'halflings',heroes:[makeHero({unitTemplateId:'halflings_cook'})],henchmenGroups:[makeHenchmanGroup({size:12})],wyrdstone:4});
describe('income and exploration batch #102 #103 #157',()=>{
 it('Foragers uses the printed 15-model / four-shard example and clamps the smallest band',()=>{
  const band=makeWarband({warbandTemplateId:'hochland_bandits',heroes:[makeHero()],henchmenGroups:[makeHenchmanGroup({size:14})],wyrdstone:4});
  expect(incomeSize(band).bandShift).toBe(-1);expect(wyrdstoneQuote(band,4)).toBe(65);
  expect(sellWyrdstone(band,4).value.gold-band.gold).toBe(65);
  expect(wyrdstoneQuote({...band,henchmenGroups:[]},1)).toBe(45);
 });
 it('owning a Cook alone never grants a bonus; all six faces have the correct result',()=>{
  const band=chef();expect(incomeSize(band).bandShift).toBe(0);
  for(let roll=1;roll<=6;roll++){
   const opts={masterChefRoll:roll};expect(incomeSize(band,opts).bandShift).toBe(roll>=5?-1:0);
   const result=sellWyrdstone(band,4,opts);expect(result.value.gold-band.gold).toBe(roll>=5?65:60);
   expect(result.events[0].message).toContain(`Master Chef rolled ${roll}`);
   expect(result.events[0].message).toContain(roll>=5?'succeeded':'failed');
  }
  for(const roll of [undefined,0,7,1.5,NaN])expect(()=>sellWyrdstone(band,4,{masterChefRoll:roll})).toThrow('Master Chef');
 });
 it('Cook must be active, never changes a size override, and bonuses keep their normal order',()=>{
  const band=chef();expect(incomeSize({...band,heroes:[{...band.heroes[0],status:'dead'}]},{masterChefRoll:6}).bandShift).toBe(0);
  expect(wyrdstoneQuote(band,4,{masterChefRoll:6,sizeOverride:13})).toBe(60);
  expect(wyrdstoneQuote(band,4,{masterChefRoll:6,bonusRate:.2,scenarioMultiplier:3})).toBe(234);
 });
 it('Pathfinder requires the learned skill on a surviving eligible Hero and adds at most one die',()=>{
  const h=makeHero({id:'p',skillIds:['horned_hunters_skills_pathfinder']});
  const band=makeWarband({warbandTemplateId:'horned_hunters',heroes:[{...h,skillIds:[]}]});
  const opts={won:false,heroesOutOfAction:[]};expect(explorationDiceAllowed(band,opts).count).toBe(1);
  band.heroes=[h];expect(explorationDiceAllowed(band,opts).count).toBe(2);expect(explorationDiceAllowed(band,opts).reason).toContain('Pathfinder');
  expect(explorationDiceAllowed(band,{...opts,heroesOutOfAction:['p']}).count).toBe(0);
  band.heroes=[h,{...h,id:'duplicate'}];expect(explorationDiceAllowed(band,opts).count).toBe(3);
  band.heroes=[{...h,status:'captured'}];expect(explorationDiceAllowed(band,opts).count).toBe(0);
  band.heroes=[h];expect(explorationDiceAllowed(band,{...opts,won:true,extraDice:5}).count).toBe(8);expect(explorationDiceAllowed(band,{...opts,won:true,extraDice:5}).keep).toBe(6);
 });
});
