import {expect,it} from 'vitest'
import {applyBattleEvents,battleEventRowSchema,emptyBattleLiveState} from '../../../domain'
import {groupOut,setDisplayedGroupOut,setGroupOut} from './sheet'
const id='11111111-1111-4111-8111-111111111111',enemy='22222222-2222-4222-8222-222222222222'
const event=battleEventRowSchema.parse({id,match_id:id,actor_id:enemy,actor_warband_id:enemy,at:'2026-09-12T12:00:00Z',kind:'attack',summary:'Out of action',reverted_at:null,reverted_by:null,revert_note:null,payload:{attacker_warband_id:enemy,attacker_id:'attacker',attacker_kind:'hero',attacker_name:'Attacker',target_warband_id:id,target_id:'group',target_kind:'group',target_name:'Warriors',target_size:4,out_of_action:true}})
it('adds and removes a manual casualty without copying a logged casualty into the raw tally',()=>{
 let raw=emptyBattleLiveState()
 expect(groupOut(applyBattleEvents(raw,[event],id),'group')).toBe(1)
 raw=setDisplayedGroupOut(raw,'group',2,4,1)
 expect(groupOut(raw,'group')).toBe(1)
 expect(groupOut(applyBattleEvents(raw,[event],id),'group')).toBe(2)
 raw=setDisplayedGroupOut(raw,'group',1,4,1)
 expect(groupOut(raw,'group')).toBe(0)
 expect(groupOut(applyBattleEvents(raw,[event],id),'group')).toBe(1)
})
it('cannot remove a shared-log casualty through a manual tally or exceed the group size',()=>{
 const raw=setGroupOut(emptyBattleLiveState(),'group',1,4)
 expect(groupOut(setDisplayedGroupOut(raw,'group',0,4,1),'group')).toBe(0)
 expect(groupOut(setDisplayedGroupOut(raw,'group',10,4,1),'group')).toBe(3)
})

it('capture metadata does not add another casualty, kill, wound or condition',async()=>{
 const {eventContribution}=await import('../../../domain/battleEvent')
 const {conditionsFor}=await import('./sheet')
 const raw=setGroupOut(emptyBattleLiveState(),'group',1,4)
 const marker={...event,payload:{...event.payload,metadata_only:true,manual_casualty_index:0,capture_reason:'subjugator' as const}}
 expect(applyBattleEvents(raw,[marker],id)).toBe(raw)
 expect(eventContribution([marker],id,'group')).toEqual({kills:0,woundsLost:0,outOfAction:0})
 const stun={...event,payload:{...event.payload,out_of_action:false,outcome:'Stunned'}}
 expect(conditionsFor([stun,marker],id,0).get('group')).toBe('Stunned')
})

it('numbers manual capture slots after ordinary logged casualties, including uncaptured manual slots',async()=>{
 const {captureEvents}=await import('../../postBattle/model/captureEvents')
 const marker=(n:number)=>({...event,id:`marker-${n}`,payload:{...event.payload,metadata_only:true,manual_casualty_index:n,capture_reason:'subjugator' as const}})
 const result=captureEvents([marker(2),event,marker(1)],id,id,'group')
 expect(result.map(r=>[r.event.id,r.modelIndex])).toEqual([['marker-1',2],['marker-2',3]])
 expect(captureEvents([{...marker(1),reverted_at:event.at},event],id,id,'group')).toEqual([])
})
