import {expect,it} from 'vitest'
import {makeHero,makeWarband} from '../../../rules/resolve/__tests__/fixtures'
import {findWarbandTemplate} from '../../../rules/data/warbandTemplates'
import type {ItemRow} from '../../../domain'
import {deriveReport,type ReportContext} from './derive'
import {emptyDraft} from './state'

it('removes the captured companion from its own stack and persists the event without killing it',()=>{
 const heroes=['a','b','c'].map(id=>makeHero({id,xp:20,levelUps:8}))
 heroes[0].equipment=[{itemId:'wardogs',quantity:1,notes:'Old dog'},{itemId:'wardogs',quantity:2,notes:'New dogs'}]
 const roster=makeWarband({heroes,henchmenGroups:[]}),animalId='animal:a:wardogs:2'
 const ctx:ReportContext={roster,template:findWarbandTemplate('mercenaries_reikland'),matchId:'match',myRating:100,opponentRating:100,items:[
  {id:'old',holder_type:'hero',holder_id:'a',item_rules_id:'wardogs',quantity:1,notes:'Old dog',custom_name:null},
  {id:'new',holder_type:'hero',holder_id:'a',item_rules_id:'wardogs',quantity:2,notes:'New dogs',custom_name:null},
 ] as ItemRow[],battleEvents:[{id:'event',match_id:'match',at:'2026-09-12T12:00:00Z',reverted_at:null,payload:{out_of_action:true,target_kind:'hero',target_id:animalId,target_warband_id:roster.id,capture_reason:'subjugator',attacker_warband_id:'enemy',attacker_name:'Captor'}}] as ReportContext['battleEvents']}
 const draft=emptyDraft();draft.result='lost';draft.animalsOut=[animalId];draft.exploration.rolls=[1,2,3]
 const result=deriveReport(draft,ctx)
 expect(result.report).not.toBeNull()
 expect(result.report!.applied.captured_companions).toEqual([{sourceItemId:'new',holderId:'a',itemId:'wardogs',animalId,eventId:'event',captorWarbandId:'enemy',reason:'subjugator'}])
 expect(result.report!.applied.item_patches).toContainEqual({id:'new',quantity:1})
 expect(result.report!.applied.item_patches.some(p=>p.id==='old')).toBe(false)
 expect(result.report!.notes).toContain('no injury die rolled')
 expect(result.injuries.summary.captured).toBe(1)
 expect(result.injuries.summary.henchmenDead).toBe(0)
})
