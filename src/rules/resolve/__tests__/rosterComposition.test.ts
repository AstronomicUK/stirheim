import {describe,it,expect} from 'vitest'
import {makeWarband,makeHero,makeHenchmanGroup} from './fixtures'
import {compositionProblems,NIGHT_MOB} from '../rosterComposition'
import {findWarbandTemplate} from '../../data/warbandTemplates'
import {newWarbandDraft,addDraftGroup,draftToRosterWarband} from '../builder'
import {recruitHenchmen,dismissWarrior,canRecruit} from '../recruitment'
import {fightingGroups,routStartingModels} from '../../../features/match/battle/sheet'
import {warbandModelCount} from '../roster'
import {incomeSize} from '../income'
import {splitSpecialEquipmentGroups} from '../specialEquipmentGroups'

describe('source-defined roster relationships',()=>{
 it.each([['outlaws_of_stirwood_forest',['outlaws_cleric','outlaws_champion','outlaws_petty_thief']],['outlaws_of_stirwood_forest_redux',['cleric','champions','petty_thieves']]] as const)('checks the shared Cleric slots for %s independently of promoted heroes', (id,types)=>{
  const heroes=[types[0],types[1],types[1],types[2],types[2]].map((unit,i)=>makeHero({id:String(i),unitTemplateId:unit}))
  const w=makeWarband({warbandTemplateId:id,heroes});expect(compositionProblems(w).some(p=>p.code==='roster.sharedSlots')).toBe(true)
  expect(compositionProblems({...w,heroes:heroes.slice(0,4)}).some(p=>p.code==='roster.sharedSlots')).toBe(false)
 })
 it('requires unique Scarecrow controllers and sits out their constructs when unavailable',()=>{
  const h=makeHero({unitTemplateId:'restless_dead_liche'}), g=makeHenchmanGroup({id:'s',unitTemplateId:'restless_dead_scarecrows',size:1,campaignState:{constructController:'restless_dead_liche'}})
  const w=makeWarband({heroes:[h],henchmenGroups:[g]})
  expect(fightingGroups(w)).toHaveLength(1)
  expect(fightingGroups({...w,heroes:[{...h,flags:{missNextGames:1}}]})).toHaveLength(0)
  expect(compositionProblems({...w,henchmenGroups:[g,{...g,id:'other'}]}).some(p=>p.message.includes('only one'))).toBe(true)
 })
 it('starts the Night Goblin mob with five for 50gc and charges 10gc per replacement while counting it once',()=>{
  const t=findWarbandTemplate('night_goblins')!;const draft=addDraftGroup(newWarbandDraft(t,'Mob'),t,NIGHT_MOB,'mob',1)
  const w={...draftToRosterWarband(draft,t),gold:200};expect(w.henchmenGroups[0].size).toBe(5)
  expect(warbandModelCount(w)).toBe(w.heroes.length+1)
  expect(routStartingModels(w)).toBe(w.heroes.length+1)
  expect(incomeSize(w).size).toBe(w.heroes.length+1)
  const damaged={...w,henchmenGroups:[{...w.henchmenGroups[0],size:3}]}
  const repaired=recruitHenchmen(damaged,t,NIGHT_MOB,'Mob',2,'x',{intoGroupId:'mob'}).value.warband
  expect(repaired.gold).toBe(180);expect(repaired.henchmenGroups[0].size).toBe(5)
  expect(()=>recruitHenchmen({...w,henchmenGroups:[]},t,NIGHT_MOB,'Mob',1,'m')).toThrow(/five/)
 })
 it('retains shared XP and all item quantities when separating specialist models',()=>{
  const group=makeHenchmanGroup({id:'pilgrims',unitTemplateId:'bretonnian_battle_pilgrims',size:3,xp:7,levelUps:2,equipment:[{itemId:'sword',quantity:3},{itemId:'holy_unholy_relic',quantity:1}]})
  const next=splitSpecialEquipmentGroups(makeWarband({henchmenGroups:[group]}),()=> 'split')
  expect(next.henchmenGroups.map(g=>g.size).sort()).toEqual([1,2])
  expect(next.henchmenGroups.every(g=>g.xp===7&&g.levelUps===2)).toBe(true)
  expect(next.henchmenGroups.flatMap(g=>g.equipment).filter(i=>i.itemId==='sword').reduce((n,i)=>n+i.quantity,0)).toBe(3)
  expect(next.henchmenGroups.find(g=>g.size===1)!.equipment).toContainEqual({itemId:'holy_unholy_relic',quantity:1})
  expect(splitSpecialEquipmentGroups(next).henchmenGroups).toEqual(next.henchmenGroups)
 })
 it('blocks dismissal of a Thrall and repeat purchase of a lost Reaver Hero',()=>{
  expect(()=>dismissWarrior(makeWarband({henchmenGroups:[makeHenchmanGroup({id:'thrall',unitTemplateId:'cursed_cavalcade_captured_thrall'})]}),'thrall')).toThrow(/cannot be dismissed/)
  const t=findWarbandTemplate('lustrian_reavers')!;const w=makeWarband({warbandTemplateId:t.id,heroes:[makeHero({unitTemplateId:'lustrian_reavers_conqueror',status:'dead'})],gold:1000})
  expect(canRecruit(w,t,'lustrian_reavers_conqueror').reason).toContain('Prospect')
 })
})
