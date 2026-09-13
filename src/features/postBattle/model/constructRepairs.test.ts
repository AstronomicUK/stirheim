import {describe,it,expect} from 'vitest'
import {makeWarband,makeHenchmanGroup} from '../../../rules/resolve/__tests__/fixtures'
import {applyHenchmanInjury} from '../../../rules/resolve/injuries'
import {resolveGroupInjuries} from './injuries'
import {participantsOf} from './participants'
import {absentGroupModels,afterAbsenceBattle} from '../../../rules/resolve/groupAbsences'
import {deriveReport,rosterAfterReport} from './derive'
import {emptyDraft} from './state'
import {findWarbandTemplate} from '../../../rules/data/warbandTemplates'
const construct=()=>makeHenchmanGroup({id:'construct',unitTemplateId:'masters_of_horror_flesh_construct',size:1,equipment:[]})
describe('Flesh Construct damage retention',()=>{
 it('requires a repair-cost die, retains the model, and records all six possible prices',()=>{
  expect(()=>applyHenchmanInjury(construct(),1)).toThrow('repair cost')
  expect(resolveGroupInjuries(construct(),1,[1]).complete).toBe(false)
  for(let die=1;die<=6;die++){
   const r=resolveGroupInjuries(construct(),1,[2],[die]);expect(r.complete).toBe(true);expect(r.dead).toBe(0);expect(r.group.size).toBe(1);expect(r.line?.repairCosts).toEqual([die*5]);expect(absentGroupModels(r.group)).toBe(1)
   expect(afterAbsenceBattle(r.group.campaignState!).constructRepairs).toEqual(r.group.campaignState!.constructRepairs)
  }
  expect(resolveGroupInjuries(construct(),1,[3]).group.campaignState).toBeUndefined()
 });
 it('puts repair debt into the report patch, excludes the unpaid model next battle, and retains equipment',()=>{
  const roster=makeWarband({warbandTemplateId:'masters_of_horror',heroes:[],hiredSwords:[],henchmenGroups:[construct()]})
  const ctx={roster,template:findWarbandTemplate('masters_of_horror'),items:[],matchId:'m',myRating:100,opponentRating:100}
  const draft={...emptyDraft(),result:'lost' as const,veteranPool:[3,3] as [number,number],survivalXpTests:{construct:{dice:[1,1] as [number,number],source:'app' as const}},groupsOut:{construct:1},groupInjuries:{construct:[1]},constructRepairDice:{construct:[4]}}
  const result=deriveReport(draft,ctx)
  expect(result.injuries.groups[0].resolution.line?.effect).toContain('20 gc')
  expect(result.problems).toEqual(expect.objectContaining({injuries:[]}))
  expect(result.report, JSON.stringify(result.problems)).not.toBeNull()
  expect(result.report!.applied.groups.find(g=>g.id==='construct')?.patch.campaign_state?.constructRepairs?.[0].cost).toBe(20)
  const repairedRoster=rosterAfterReport(roster,result.report!.applied)
  expect(repairedRoster.henchmenGroups[0].size).toBe(1)
  expect(participantsOf(repairedRoster,ctx.template).groups).toHaveLength(0)
  expect(repairedRoster.gold).toBe(roster.gold)
 });
});
