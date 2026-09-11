import {expect,it} from 'vitest'
import {groupXpLine,type XpContext} from './xp'
import {recordSurvivalXpRoll,survivalXpTestResult,survivalXpTestHistory} from './survivalXp'
import {deriveReport,type ReportContext} from './derive'
import {emptyDraft} from './state'
import type {RosterHenchmanGroup} from '../../../rules/types/roster'
const group:RosterHenchmanGroup={id:'construct',name:'Construct',unitTemplateId:'masters_of_horror_flesh_construct',size:1,stats:{M:4,WS:3,BS:0,S:4,T:4,W:2,I:2,A:2,Ld:4},xp:1,levelUps:0,statIncreases:{},equipment:[]}
const xp:XpContext={won:false,leaderId:null,underdogBonus:0,enemiesOut:{},extras:{}}
it('requires the printed Leadership test before survival XP and preserves other awards',()=>{
 expect(groupXpLine(group,group,xp)).toBeNull()
 const failed=recordSurvivalXpRoll(undefined,[6,6],'app')
 expect(groupXpLine(group,group,{...xp,survivalXpTests:{construct:failed}})).toMatchObject({amount:0,xpAfter:1,advancesEarned:0})
 const pass=recordSurvivalXpRoll(failed,[1,2],'manual')
 const line=groupXpLine(group,group,{...xp,survivalXpTests:{construct:pass}})!
 expect(line).toMatchObject({amount:1,xpAfter:2,advancesEarned:1})
 expect(line.reasons.join(' ')).toContain('6 + 6 (rolled by the app)')
 expect(line.reasons.join(' ')).toContain('1 + 2 (entered or changed by the player)')
 expect(groupXpLine(group,group,{...xp,underdogBonus:1,extras:{construct:[{amount:2,reason:'agreed objective'}]},survivalXpTests:{construct:failed}})?.amount).toBe(3)
 expect(groupXpLine(group,{...group,size:0},{...xp,survivalXpTests:{construct:pass}})).toBeNull()
})
it('checks all 36 Leadership combinations and retains actual manual changes',()=>{
 let passed=0
 for(let a=1;a<=6;a++)for(let b=1;b<=6;b++)if(survivalXpTestResult({dice:[a,b],source:'app'},4))passed++
 expect(passed).toBe(6)
 expect(survivalXpTestResult({dice:[7,1],source:'manual'},4)).toBeNull()
 const first=recordSurvivalXpRoll(undefined,[6,6],'app')
 const edited=recordSurvivalXpRoll(first,[1,6],'manual')
 const final=recordSurvivalXpRoll(edited,[1,2],'manual')
 expect(survivalXpTestHistory(final,4)).toHaveLength(3)
 expect(first.dice).toEqual([6,6])
})
it('blocks the experience step until the test is complete and leaves other units unchanged',()=>{
 const context:ReportContext={roster:{id:'w',name:'Horror',warbandTemplateId:'masters_of_horror',gold:0,wyrdstone:0,veteranPool:null,heroes:[],hiredSwords:[],henchmenGroups:[group],stash:[]},template:undefined,items:[],matchId:'m',myRating:100,opponentRating:100}
 const draft={...emptyDraft(),result:'lost' as const}
 expect(deriveReport(draft,context).problems.experience.join(' ')).toContain('complete the Leadership test')
 const rolled={...draft,survivalXpTests:{construct:recordSurvivalXpRoll(undefined,[6,6],'app')}}
 const result=deriveReport(rolled,context)
 expect(result.problems.experience).toEqual([])
 expect(result.xp.lines[0].reasons.join(' ')).toContain('failed')
 const ordinary={...group,unitTemplateId:'mercenaries_reikland_warriors'}
 expect(groupXpLine(ordinary,ordinary,xp)?.amount).toBe(1)
})
