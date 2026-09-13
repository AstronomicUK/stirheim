import {expect,it} from 'vitest'
import {applyEngineRescue,engineRescueAftermath,type EngineRescueState} from '../engineRescue'
const keeper={id:'hero',warbandId:'rescuers',name:'Rescuer'}
const initial:EngineRescueState={engineId:'engine',holderWarbandId:'dwarfs',destroyed:false,holderRouted:false,keys:[],prisoners:[{id:'named',name:'Captive',formerWarbandId:'absent',state:'held',large:false},{id:'anonymous',name:'Straggler',formerWarbandId:null,state:'held',large:false}]}
it('requires keys and confirmed contact, then separates release from reaching the edge',()=>{
 expect(()=>applyEngineRescue(initial,{type:'free',keeperId:'hero',baseContactConfirmed:true})).toThrow(/keys/)
 const keys=applyEngineRescue(initial,{type:'gaolerOut',gaolerId:'gaoler',by:keeper})
 expect(()=>applyEngineRescue(keys,{type:'free',keeperId:'hero',baseContactConfirmed:false})).toThrow(/contact/)
 const free=applyEngineRescue(keys,{type:'free',keeperId:'hero',baseContactConfirmed:true})
 expect(engineRescueAftermath(free)).toEqual({remainCaptured:[],rescued:[],needsRuling:['named','anonymous']})
 const escaped=applyEngineRescue(free,{type:'escaped',prisonerId:'named'})
 expect(engineRescueAftermath(escaped)).toEqual({remainCaptured:[],rescued:['named'],needsRuling:['anonymous']})
 expect(initial.prisoners.every(p=>p.state==='held')).toBe(true)
})
it('moves all carried keys to the new keeper and does not guess an unknown keeper',()=>{
 let state=applyEngineRescue(initial,{type:'gaolerOut',gaolerId:'g1',by:keeper})
 state=applyEngineRescue(state,{type:'gaolerOut',gaolerId:'g2',by:keeper})
 state=applyEngineRescue(state,{type:'keeperOut',keeperId:keeper.id,by:null})
 expect(state.keys.every(k=>k.keeper===null)).toBe(true)
 const located=applyEngineRescue(state,{type:'locateKeys',gaolerId:'g1',by:keeper})
 expect(located.keys.find(k=>k.gaolerId==='g1')?.keeper).toEqual(keeper)
 expect(located.keys.find(k=>k.gaolerId==='g2')?.keeper).toBeNull()
 expect(()=>applyEngineRescue(state,{type:'free',keeperId:keeper.id,baseContactConfirmed:true})).toThrow(/keys/)
})
it('destruction frees captives without keys, while an earlier rout leaves captives imprisoned',()=>{
 expect(applyEngineRescue(initial,{type:'destroyed'}).prisoners.every(p=>p.state==='freed')).toBe(true)
 const routed=applyEngineRescue(initial,{type:'holderRouted'})
 expect(engineRescueAftermath(routed).remainCaptured).toEqual(['named','anonymous'])
 expect(()=>applyEngineRescue(routed,{type:'destroyed'})).toThrow(/routed/)
})
it('cannot manufacture an escape for a prisoner who has not been freed',()=>{
 expect(()=>applyEngineRescue(initial,{type:'escaped',prisonerId:'named'})).toThrow(/freed/)
})
