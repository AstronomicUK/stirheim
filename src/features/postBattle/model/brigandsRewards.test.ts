import { expect, it } from 'vitest'
import { brigandsRewards } from './brigandsRewards'
import { explorationDiscoveries, availableFreeHires } from '../../../rules/resolve/explorationDiscoveries'
import { hireHiredSword } from '../../../rules/resolve/recruitment'
import { makeWarband } from '../../../rules/resolve/__tests__/fixtures'
it('adds separate henchman, Hero and actual Captured bounties',()=>{
 expect(brigandsRewards({role:'attacker',henchmen:[2,4],heroes:[{name:'Captain',die:3,captured:true,captureDie:5}]},true,true)).toMatchObject({gold:71,problems:[]})
})
it('rejects missing dice, duplicated Heroes and noncampaign capture payments',()=>{
 expect(brigandsRewards({role:'attacker',heroes:[{name:'Captain',die:null,captured:true,captureDie:5},{name:'captain',die:3}]},true,false).problems).toHaveLength(3)
})
it('does not pay losing attackers or grant losing defenders a hire',()=>{
 expect(brigandsRewards({role:'attacker',henchmen:[6]},false,true).gold).toBe(0)
 expect(brigandsRewards({role:'defender',outlaw:'warlock',standing:true},false,true).freeHire).toBeUndefined()
})
it('requires an eligible still-standing outlaw or explicit decline',()=>{
 expect(brigandsRewards({role:'defender',outlaw:'warlock'},true,true).problems).not.toEqual([])
 expect(brigandsRewards({role:'defender',outlaw:'ogre_bodyguard',standing:true},true,true).problems).not.toEqual([])
 expect(brigandsRewards({role:'defender',outlaw:'none'},true,true).problems).toEqual([])
})
it('restricts the free hire to the recorded survivor and consumes it after departure',()=>{
 const discovery=explorationDiscoveries([{id:'report',exploration:{locationId:'returning_a_favour'},applied:{scenario_free_hire:{choices:['warlock']}}}])
 const roster=makeWarband({gold:0,explorationDiscoveries:discovery})
 expect(availableFreeHires(roster,'warlock')).toHaveLength(2)
 expect(()=>hireHiredSword(roster,'ogre_bodyguard','ogre',{returningFavourReportId:'report:brigands'})).toThrow(/not available/)
 const hired=hireHiredSword(roster,'warlock','mage',{returningFavourReportId:'report:brigands'}).value
 expect(hired.gold).toBe(0)
 expect(availableFreeHires({...hired,hiredSwords:hired.hiredSwords.map(h=>({...h,status:'left'}))},'warlock').map(r=>r.id)).toEqual(['report'])
})

import { makeHero, makeHenchmanGroup } from '../../../rules/resolve/__tests__/fixtures'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import { deriveReport } from './derive'
import { emptyDraft } from './state'
it('uses role-specific survival and leader XP and requires the role before advancing',()=>{
 const ctx={roster:makeWarband({heroes:[makeHero({id:'captain',unitTemplateId:'mercenaries_reikland_captain'})],henchmenGroups:[makeHenchmanGroup({id:'crew'})]}),template:findWarbandTemplate('mercenaries_reikland'),items:[],matchId:'test',myRating:100,opponentRating:100,scenarioId:'brigands_in_the_pasturelands'}
 const d=emptyDraft();d.result='won'
 expect(deriveReport(d,ctx).problems.outcome.join()).toContain('Brigands role')
 for(const role of ['attacker','defender'] as const){d.scenarioRewards={brigands:{role,outlaw:'none'}};const r=deriveReport(d,ctx);expect(r.xp.lines.find(l=>l.subjectId==='captain')?.amount).toBe(role==='attacker'?2:4);expect(r.xp.lines.find(l=>l.subjectId==='crew')?.amount).toBe(role==='attacker'?1:2)}
})
