import {expect,it} from 'vitest'
import {makeHero,makeWarband,makeHenchmanGroup as makeGroup} from '../../../rules/resolve/__tests__/fixtures'
import {battleEventRowSchema} from '../../../domain/battleEvent'
import {deriveInjuries} from './derive'
import {participantsOf} from './participants'
import {emptyDraft} from './state'
const id='11111111-1111-4111-8111-111111111111',enemy='22222222-2222-4222-8222-222222222222'
const hero=makeHero(),group=makeGroup({size:3}),roster=makeWarband({id,heroes:[hero],henchmenGroups:[group]})
function source(targetId:string,kind:'hero'|'group'){
 return battleEventRowSchema.parse({id,match_id:id,actor_id:enemy,actor_warband_id:enemy,at:'2026-09-13T08:00:00Z',kind:'attack',summary:'Held',reverted_at:null,reverted_by:null,revert_note:null,payload:{attacker_warband_id:enemy,attacker_id:enemy,attacker_kind:'hero',attacker_name:'Whipmaster',target_warband_id:id,target_id:targetId,target_kind:kind,target_name:'Held warrior',out_of_action:false,kill:false,wounds_lost:1,slaaneshi_lock:{weaponId:'slaaneshi_man_catcher',modelIndex:kind==='group'?1:0}}})
}
function hold(targetId:string,kind:'hero'|'group'){
 return {id,match_id:id,source_event_id:id,wielder_warband_id:enemy,wielder_id:enemy,target_warband_id:id,target_id:targetId,target_kind:kind,target_model_index:kind==='group'?1:0,target_name:'Held warrior',created_at:'2026-09-13T08:00:00Z',released_at:null,release_reason:null,confirmed_end_at:'2026-09-13T08:01:00Z'}
}
it('captures a held Hero even though they were never taken out of action',()=>{
 const result=deriveInjuries(emptyDraft(),participantsOf(roster,undefined),id,roster,null,null,[source(hero.id,'hero')],undefined,[hold(hero.id,'hero')])
 expect(result.heroes[0].resolution.line).toMatchObject({outcome:'captured',rolls:[]})
 expect(result.heroes[0].resolution.line?.effect).toContain('Slaaneshi Man-Catcher')
})
it('removes only the held henchman, with zero injury dice and no invented OOA',()=>{
 const result=deriveInjuries(emptyDraft(),participantsOf(roster,undefined),id,roster,null,null,[source(group.id,'group')],undefined,[hold(group.id,'group')])
 expect(result.groups[0]).toMatchObject({outOfAction:0,dice:0,resolution:{dead:0,complete:true,group:{size:2},line:{rolls:[],captured:[{modelIndex:1,heldModelIndex:2,reason:'slaaneshi_lock'}]}}})
})
it('unconfirmed and released holds do not become captives',()=>{
 for(const held of [{...hold(hero.id,'hero'),confirmed_end_at:null},{...hold(hero.id,'hero'),released_at:'2026-09-13T08:00:30Z'}]){
  expect(deriveInjuries(emptyDraft(),participantsOf(roster,undefined),id,roster,null,null,[source(hero.id,'hero')],undefined,[held]).heroes).toEqual([])
 }
})
