import { describe, expect, it } from 'vitest'
import { findWarbandTemplate } from '../../data/warbandTemplates'
import { replaceLustrianHero, lustrianVacancies } from '../lustrianPromotion'
import { canRecruit, dismissWarrior } from '../recruitment'
import { eventAdvances } from '../eventAdvances'
import { warriorFlagsSchema } from '../../../domain/json'
import type { RosterWarband } from '../../types/roster'
const stats={M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7}
const template=findWarbandTemplate('lustrian_reavers')!
const role=template.heroTemplates[0]
const lostId='aaaaaaaa-0000-4000-8000-000000000001',newId='aaaaaaaa-0000-4000-8000-000000000002'
const roster:RosterWarband={id:'w',name:'Reavers',warbandTemplateId:template.id,gold:1000,wyrdstone:0,veteranPool:null,stash:[],hiredSwords:[],heroes:[{id:lostId,name:'Lost Hero',unitTemplateId:role.id,status:'dead',stats:{...stats,WS:6},xp:30,levelUps:9,skillIds:['dodge'],skillTableIds:['combat'],spellIds:[],flags:{},injuries:[],equipment:[{itemId:'sword',quantity:1}]}],henchmenGroups:[{id:'g',name:'Prospects',unitTemplateId:'lustrian_reavers_prospects',size:2,stats,xp:0,levelUps:0,statIncreases:{},equipment:[{itemId:'dagger',quantity:2}]}]}
const tables=[...new Set(template.heroTemplates.flatMap(h=>h.skillTableIds))].slice(0,2)
describe('Lustrian replacement Heroes',()=>{
 it('inherits the role and kit but retains the Prospect profile, and consumes the vacancy exactly once',()=>{
  const next=replaceLustrianHero(roster,lostId,'g','New Hero',tables,newId).value
  const hero=next.heroes.find(h=>h.id===newId)!
  expect(hero.stats).toEqual(stats);expect(hero.xp).toBe(0);expect(hero.levelUps).toBe(0)
  expect(hero.unitTemplateId).toBe(role.id);expect(hero.skillTableIds).toEqual(tables);expect(hero.skillIds).toEqual([])
  expect(hero.equipment).toEqual([{itemId:'sword',quantity:1}]);expect(next.heroes[0].equipment).toEqual([])
  expect(next.stash).toEqual([{itemId:'dagger',quantity:1}]);expect(next.henchmenGroups[0].size).toBe(1)
  expect(lustrianVacancies(next)).toEqual([])
  expect(()=>replaceLustrianHero(next,lostId,'g','Again',tables,'another')).toThrow()
  expect(warriorFlagsSchema.parse(hero.flags).lustrianReplacementOf).toBe(lostId)
  expect(eventAdvances(roster,next)).toEqual([{warband_id:'w',subject_type:'hero',subject_id:newId,threshold_xp:1}])
  expect(eventAdvances(next,next)).toEqual([])
  const deadAgain={...next,heroes:next.heroes.map(h=>h.id===newId?{...h,status:'dead' as const}:h)}
  expect(lustrianVacancies(deadAgain).map(h=>h.id)).toEqual([newId])
 })
 it('blocks re-purchasing a historical role and retains dismissed equipment for a Prospect',()=>{
  expect(canRecruit(roster,template,role.id).ok).toBe(false)
  const active={...roster,heroes:roster.heroes.map(h=>({...h,status:'active' as const}))}
  const dismissed=dismissWarrior(active,lostId).value
  expect(dismissed.stash).toEqual([]);expect(dismissed.heroes[0].equipment).toEqual(roster.heroes[0].equipment)
  expect(lustrianVacancies(dismissed)).toHaveLength(1)
 })
 it('does not replace captured Heroes, spent vacancies, non-Prospects or another warband',()=>{
  expect(lustrianVacancies({...roster,heroes:roster.heroes.map(h=>({...h,status:'captured' as const}))})).toEqual([])
  expect(()=>replaceLustrianHero({...roster,warbandTemplateId:'mercenaries_reikland'},lostId,'g','No',tables,newId)).toThrow()
  expect(()=>replaceLustrianHero({...roster,henchmenGroups:roster.henchmenGroups.map(g=>({...g,unitTemplateId:'other'}))},lostId,'g','No',tables,newId)).toThrow()
 })
})
