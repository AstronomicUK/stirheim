import { describe, expect, it } from 'vitest'
import { groupXpLine, warriorXpLine, type XpContext } from './xp'
import { recordKillDie, specialKillAwards, specialKillProblems, specialKillsFromEvents, type SpecialKillXp } from './specialKillXp'
import type { RosterHero, RosterHenchmanGroup, RosterWarband } from '../../../rules/types/roster'
import { battleEventRowSchema, emptyBattleLiveState } from '../../../domain'
const stats={M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7}
const hero:RosterHero={id:'h',name:'Renamed Hero',unitTemplateId:'mercenaries_reikland_captain',stats,xp:0,levelUps:0,skillIds:[],skillTableIds:[],spellIds:[],injuries:[],flags:{},equipment:[],status:'active'}
const group:RosterHenchmanGroup={id:'g',name:'Renamed group',unitTemplateId:'mercenaries_reikland_warriors',stats,size:2,xp:0,levelUps:0,statIncreases:{},equipment:[]}
const ctx:XpContext={won:false,leaderId:null,underdogBonus:0,enemiesOut:{},extras:{}}
const special:SpecialKillXp={runts:2,snotlings:3,rolls:[{value:4,source:'app'},{value:5,source:'app'}]}
describe('special enemy experience (#112)',()=>{
 it('replaces full kill XP, combines halves before rounding and preserves ordinary kills',()=>{
  const line=warriorXpLine('hero',hero,hero,true,{...ctx,enemiesOut:{h:7},specialKillXp:{h:special}})!
  expect(line.amount).toBe(5) // survival 1, ordinary kills 2, Runts 1, Snotlings floor(3/2)=1
  expect(line.reasons.join(' ')).toContain('failed')
  expect(line.reasons.join(' ')).toContain('half XP each')
 })
 it.each([1,2,3,4,5,6])('gives a Runt award only on 5+ (roll %s)',value=>{
  expect(specialKillAwards({runts:1,snotlings:0,rolls:[{value,source:'manual'}]})[0].amount).toBe(value>=5?1:0)
 })
 it('allows the printed henchman Runt exception without granting ordinary or half kill XP',()=>{
  const line=groupXpLine(group,group,{...ctx,enemiesOut:{g:9},specialKillXp:{g:special}})!
  expect(line.amount).toBe(2) // survival + one successful Runt test
  expect(line.reasons.join(' ')).not.toContain('half XP')
 })
 it('does not award dead warriors, wiped groups or no-XP creatures',()=>{
  const c={...ctx,specialKillXp:{h:special,g:special}}
  expect(warriorXpLine('hero',hero,hero,false,c)).toBeNull()
  expect(groupXpLine(group,{...group,size:0},c)).toBeNull()
  expect(groupXpLine({...group,unitTemplateId:'night_goblins_web_snotlings'},group,c)).toBeNull()
 })
 it('retains the original app die when the player changes it',()=>{
  const original=recordKillDie(undefined,2,'app'), changed=recordKillDie(original,6,'manual')
  const awards=specialKillAwards({runts:1,snotlings:0,rolls:[changed]})
  expect(awards[0].amount).toBe(1)
  expect(awards[0].reason).toContain('earlier 2 (rolled by the app), replaced')
  expect(awards[0].reason).toContain('6 (entered or changed by the player)')
  expect(specialKillProblems({runts:1,snotlings:0,rolls:[]},1)).toHaveLength(1)
  expect(specialKillProblems(special,4).join(' ')).toContain('exceed')
 })
 it('uses fixed special awards even if a scenario changes ordinary kill XP',()=>{
  const line=warriorXpLine('hero',hero,hero,true,{...ctx,enemiesOut:{h:7},specialKillXp:{h:special},scenarioAwards:{survival:1,leader:1,kill:2}})!
  expect(line.amount).toBe(7)
 })
 it('rounds each hero separately, without discarding halves one casualty at a time',()=>{
  for(const [n,xp] of [[1,0],[2,1],[3,1],[4,2]]) expect(specialKillAwards({runts:0,snotlings:n,rolls:[]})[0].amount).toBe(xp)
 })
 it('recognises actual enemy unit IDs and excludes friendly, undone and non-OOA events',()=>{
  const own='00000000-0000-4000-8000-000000000010', enemy='00000000-0000-4000-8000-000000000020'
  const roster:RosterWarband={id:enemy,name:'Enemy',warbandTemplateId:'snotlings',gold:0,wyrdstone:0,veteranPool:null,heroes:[],henchmenGroups:[{...group,id:'r',unitTemplateId:'runts'}],hiredSwords:[],stash:[]}
  const event=battleEventRowSchema.parse({id:'00000000-0000-4000-8000-000000000001',match_id:'00000000-0000-4000-8000-000000000002',actor_id:'00000000-0000-4000-8000-000000000003',actor_warband_id:own,summary:'Attack',reverted_at:null,reverted_by:null,revert_note:null,at:'2026-09-11T00:00:00Z',kind:'attack',payload:{attacker_id:'h',attacker_name:'Renamed',attacker_kind:'hero',attacker_warband_id:own,target_id:'r',target_name:'Anything',target_kind:'group',target_warband_id:enemy,target_size:3,phase:'melee',out_of_action:true,kill:true,wounds_lost:1,turn:1}})
  expect(specialKillsFromEvents([event],own,[roster]).h.runts).toBe(1)
  const sheets=[{warband_id:enemy,live_state:{...emptyBattleLiveState(),takenOutBy:{r:[{warbandId:own,modelId:'h',name:'Renamed Hero',turn:1}]}}}]
  expect(specialKillsFromEvents([],own,[roster],sheets).h.runts).toBe(1)
  expect(specialKillsFromEvents([event],own,[roster],sheets).h.runts).toBe(1)
  expect(specialKillsFromEvents([{...event,payload:{...event.payload,target_unit_template_id:'runts'}}],own,[]).h.runts).toBe(1)
  expect(specialKillsFromEvents([{...event,payload:{...event.payload,out_of_action:false}}],own,[roster])).toEqual({})
  expect(specialKillsFromEvents([{...event,payload:{...event.payload,target_warband_id:own,target_unit_template_id:'runts'}}],own,[roster])).toEqual({})
  expect(specialKillsFromEvents([{...event,reverted_at:'2026-09-11T01:00:00Z'}],own,[roster])).toEqual({})
  expect(specialKillsFromEvents([event],enemy,[roster])).toEqual({})
 })
})
