import {expect,it} from 'vitest'
import {battleEventRowSchema,type AttackEventPayload} from '../../../domain/battleEvent'
import type {EngineRescueRecord} from '../../../api/engineRescue'
import {engineKeyPrompts} from './engineKeyPrompts'
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222'
const engines=[{id:'engine',warband_id:b}],gaolers=[{id:'gaoler',warbandId:b,name:'Gaoler'}]
function event(payload:Partial<AttackEventPayload>={}){return battleEventRowSchema.parse({id:a,match_id:a,actor_id:a,actor_warband_id:a,at:'2026-09-13T09:00:00Z',kind:'attack',summary:'Casualty',reverted_at:null,reverted_by:null,revert_note:null,payload:{attacker_warband_id:a,attacker_id:'warriors',attacker_kind:'group',attacker_name:'Warriors',target_warband_id:b,target_id:'gaoler',target_kind:'hero',target_name:'Gaoler',out_of_action:true,...payload}})}
function record():EngineRescueRecord{return {id:'r',match_id:a,engine_id:'engine',revision:1,history:[],state:{engineId:'engine',holderWarbandId:b,destroyed:false,holderRouted:false,prisoners:[],keys:[{gaolerId:'gaoler',keeper:{id:'warriors:1',name:'Warriors · model 2',warbandId:a}}]}}}
it('prompts a Gaoler casualty without choosing a particular attacking henchman',()=>{
 expect(engineKeyPrompts([event()],[],engines,gaolers)[0]).toMatchObject({type:'gaolerOut',gaolerId:'gaoler',byId:null,sourceEventId:a})
 expect(engineKeyPrompts([{...event(),reverted_at:'2026-09-13T09:01:00Z'}],[],engines,gaolers)).toEqual([])
 expect(engineKeyPrompts([event()],[record()],engines,gaolers)).toEqual([])
})
it('only an exact held-key group casualty prompts transfer when a model index is recorded',()=>{
 const casualty=event({target_id:'warriors',target_kind:'group',target_warband_id:a,target_model_index:0})
 expect(engineKeyPrompts([casualty],[record()],engines,gaolers)).toEqual([])
 const exact={...casualty,payload:{...casualty.payload,target_model_index:1}}
 expect(engineKeyPrompts([exact],[record()],engines,gaolers)[0]).toMatchObject({type:'keeperOut',keeperId:'warriors:1'})
 const r=record();r.history=[{at:exact.at,action:{type:'keeperOut',keeperId:'warriors:1',by:null,sourceEventId:exact.id}}]
 expect(engineKeyPrompts([exact],[r],engines,gaolers)).toEqual([])
})
