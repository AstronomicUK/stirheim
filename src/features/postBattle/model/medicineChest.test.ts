import {describe,expect,it} from 'vitest'
import type {RosterHero} from '../../../rules/types/roster'
import type {ItemRow} from '../../../domain'
import {resolveHeroInjuryFlow} from './injuries'
import {addHeroInjuryRoll,emptyDraft,setMedicineChestReroll} from './state'
import {canUseMedicineChest,medicineChestUses} from './medicineChest'
const hero:RosterHero={id:'hero',name:'Patient',unitTemplateId:'mercenaries_reikland_champions',stats:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7},xp:0,levelUps:0,skillTableIds:[],skillIds:[],spellIds:[],injuries:[],flags:{},equipment:[{itemId:'sword',quantity:1}],status:'active'}
const item:ItemRow={id:'11111111-3333-4444-8555-666666666666',warband_id:'band',holder_type:'stash',holder_id:null,item_rules_id:'scenario_medicine_chest',custom_name:null,quantity:1,notes:'',created_at:'',updated_at:''}
describe('Medicine Chest injury reroll',()=>{
 it('replays only the replacement injury and logs both rolls without losing equipment',()=>{
  let d=addHeroInjuryRoll(emptyDraft(),'hero',11);d=setMedicineChestReroll(d,'hero',0,item.id,41)
  const result=resolveHeroInjuryFlow(hero,d.heroInjuries.hero)
  expect(result.outcome).toBe('recovered');expect(result.hero.equipment).toEqual(hero.equipment)
  expect(result.line?.rolls).toEqual([11,41]);expect(result.line?.effect).toContain('original D66 11 → replacement D66 41')
  expect(medicineChestUses(d,[item],{hero:result.steps}).uses).toEqual([{item_id:item.id,quantity:1,expected_quantity:1}])
 })
 it('does not reroll a replacement and clears downstream Multiple Injuries dice',()=>{
  let d=addHeroInjuryRoll(emptyDraft(),'hero',16);d.heroInjuries.hero.countRoll=2;d=addHeroInjuryRoll(d,'hero',22);d=addHeroInjuryRoll(d,'hero',26)
  d=setMedicineChestReroll(d,'hero',0,item.id,41)
  expect(d.heroInjuries.hero.rolls).toHaveLength(1);expect(d.heroInjuries.hero.countRoll).toBeNull()
  expect(setMedicineChestReroll(d,'hero',0,item.id,66)).toBe(d)
  expect(resolveHeroInjuryFlow(hero,d.heroInjuries.hero).outcome).toBe('recovered')
 })
 it('requires a new sub-roll for the replacement and keeps the original follow-up in history',()=>{
  let d=addHeroInjuryRoll(emptyDraft(),'hero',23);d.heroInjuries.hero.rolls[0].subRoll=1;d=setMedicineChestReroll(d,'hero',0,item.id,24)
  expect(resolveHeroInjuryFlow(hero,d.heroInjuries.hero).pending.kind).toBe('subRoll')
  d.heroInjuries.hero.rolls[0].subRoll=6
  expect(resolveHeroInjuryFlow(hero,d.heroInjuries.hero).line?.rolls).toEqual([23,1,24,6])
 })
 it('excludes capture, pit fights, robbery and unrelated reward events',()=>{
  for(const n of [36,41,56,61,62,65,66])expect(canUseMedicineChest(n),String(n)).toBe(false)
  expect(canUseMedicineChest(22)).toBe(true)
 })
 it('rejects missing stock and use by two warriors from a single chest',()=>{
  let d=setMedicineChestReroll(addHeroInjuryRoll(emptyDraft(),'hero',22),'hero',0,item.id,41)
  d=setMedicineChestReroll(addHeroInjuryRoll(d,'second',26),'second',0,item.id,41)
  const steps={hero:resolveHeroInjuryFlow(hero,d.heroInjuries.hero).steps,second:resolveHeroInjuryFlow({...hero,id:'second'},d.heroInjuries.second).steps}
  expect(medicineChestUses(d,[item],steps).problems[0]).toContain('not enough')
  expect(medicineChestUses(d,[],steps).problems[0]).toContain('no longer')
 })
})
