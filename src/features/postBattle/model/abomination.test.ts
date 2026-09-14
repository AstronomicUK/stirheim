import {describe,it,expect} from 'vitest'
import {makeWarband,makeHenchmanGroup} from '../../../rules/resolve/__tests__/fixtures'
import {deriveReport,rosterAfterReport} from './derive'
import {emptyDraft} from './state'
import {participantsOf} from './participants'
import {findWarbandTemplate} from '../../../rules/data/warbandTemplates'
const group=makeHenchmanGroup({id:'11111111-1111-4111-8111-111111111111',unitTemplateId:'necrarchs_abomination',size:1})
const roster=makeWarband({warbandTemplateId:'necrarchs_the_soul_stealers',heroes:[],hiredSwords:[],henchmenGroups:[group]})
const opponent='22222222-2222-4222-8222-222222222222'
const ctx={roster,template:findWarbandTemplate(roster.warbandTemplateId),items:[],matchId:'m',myRating:100,opponentRating:100,opponents:[{id:opponent,name:'Rivals'}]}
const draft={...emptyDraft(),result:'lost' as const,veteranPool:[3,3] as [number,number],groupsOut:{[group.id]:1},abominationRecipients:{[`${group.id}:0`]:{warbandId:opponent,modelName:'Victor'}}}
describe('Abomination Powered aftermath',()=>{
 it('retains the model and equipment, saves reward and debt, then excludes it next battle',()=>{
  const result=deriveReport(draft,ctx)
  expect(result.report,JSON.stringify(result.problems)).not.toBeNull()
  expect(result.report!.notes).toContain('Victor (Rivals) receives 1 wyrdstone shard')
  expect(result.report!.applied.abomination_rewards).toEqual([{group_id:group.id,model_index:0,recipient_id:opponent,model_name:'Victor'}])
  const next=rosterAfterReport(roster,result.report!.applied)
  expect(next.henchmenGroups[0].size).toBe(1)
  expect(next.henchmenGroups[0].equipment).toEqual(group.equipment)
  expect(next.henchmenGroups[0].campaignState?.reanimationOwed).toBe(1)
  expect(participantsOf(next,ctx.template).groups).toHaveLength(0)
 })
 it('requires an opposing recipient rather than silently dropping or inventing the shard',()=>{
  const result=deriveReport({...draft,abominationRecipients:{}},ctx)
  expect(result.report).toBeNull()
  expect(result.problems.injuries.join(' ')).toContain('receives its shard')
  expect(deriveReport({...draft,abominationRecipients:{[`${group.id}:0`]:{warbandId:roster.id,modelName:'Wrong side'}}},ctx).report).toBeNull()
 })
 it('only disables casualties in a multi-model group',()=>{
  const result=deriveReport(draft,{...ctx,roster:{...roster,henchmenGroups:[{...group,size:2}]}})
  const next=rosterAfterReport({...roster,henchmenGroups:[{...group,size:2}]},result.report!.applied)
  expect(participantsOf(next,ctx.template).groups[0].size).toBe(1)
 })
})
