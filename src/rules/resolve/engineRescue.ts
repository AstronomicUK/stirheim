import {RulesError} from './errors'

export interface RescueModel {id:string;warbandId:string;name:string}
export interface RescuePrisoner {id:string;name:string;formerWarbandId:string|null;state:'held'|'freed'|'escaped';large:boolean;profile?:Record<string,number>|null}
export interface EngineRescueState {
 engineId:string
 holderWarbandId:string
 destroyed:boolean
 holderRouted:boolean
 prisoners:RescuePrisoner[]
 keys:{gaolerId:string;keeper:RescueModel|null}[]
}
export type EngineRescueAction =
 |{type:'gaolerOut';gaolerId:string;by:RescueModel|null}
 |{type:'locateKeys';gaolerId:string;by:RescueModel}
 |{type:'keeperOut';keeperId:string;by:RescueModel|null}
 |{type:'free';keeperId:string;baseContactConfirmed:boolean}
 |{type:'destroyed'}
 |{type:'holderRouted'}
 |{type:'escaped';prisonerId:string}

/** Tabletop facts are explicit. This changes battle state only, never a permanent roster. */
export function applyEngineRescue(state:EngineRescueState,action:EngineRescueAction):EngineRescueState {
 switch(action.type){
  case 'gaolerOut':
   if(state.keys.some(k=>k.gaolerId===action.gaolerId))throw new RulesError('rescue.keysRecorded','The keys from this Gaoler are already recorded. Correct the earlier event if needed.')
   return {...state,keys:[...state.keys,{gaolerId:action.gaolerId,keeper:action.by}]}
  case 'locateKeys':
   if(!state.keys.some(k=>k.gaolerId===action.gaolerId&&k.keeper===null))throw new RulesError('rescue.knownKeeper','These keys already have a keeper, or were never recorded.')
   return {...state,keys:state.keys.map(k=>k.gaolerId===action.gaolerId?{...k,keeper:action.by}:k)}
  case 'keeperOut':
   if(!state.keys.some(k=>k.keeper?.id===action.keeperId))throw new RulesError('rescue.noKeys','This model has no recorded prison keys.')
   if(action.by?.id===action.keeperId)throw new RulesError('rescue.sameKeeper','The model taken out of action cannot keep the keys.')
   return {...state,keys:state.keys.map(k=>k.keeper?.id===action.keeperId?{...k,keeper:action.by}:k)}
  case 'free': {
   if(state.holderRouted)throw new RulesError('rescue.routed','The Chaos Dwarfs routed before the prisoners were freed; they remain captured.')
   if(!action.baseContactConfirmed)throw new RulesError('rescue.contact','Confirm that the key holder reached base contact with the Engine.')
   const keeper=state.keys.find(k=>k.keeper?.id===action.keeperId)?.keeper
   if(!keeper)throw new RulesError('rescue.noKeys','Choose a model carrying the prison keys.')
   if(keeper.warbandId===state.holderWarbandId)throw new RulesError('rescue.enemyKeys','These keys are back with the captors; record an opposing key holder before a rescue.')
   if(!state.prisoners.some(p=>p.state==='held'))throw new RulesError('rescue.alreadyFree','No prisoners remain held in this Engine.')
   return {...state,prisoners:state.prisoners.map(p=>p.state==='held'?{...p,state:'freed'}:p)}
  }
  case 'destroyed':
   if(state.destroyed)throw new RulesError('rescue.destroyed','The Engine is already recorded as destroyed.')
   if(state.holderRouted)throw new RulesError('rescue.routed','Correct the battle sequence before recording destruction after the captors routed.')
   return {...state,destroyed:true,prisoners:state.prisoners.map(p=>p.state==='held'?{...p,state:'freed'}:p)}
  case 'holderRouted':return {...state,holderRouted:true}
  case 'escaped': {
   const prisoner=state.prisoners.find(p=>p.id===action.prisonerId)
   if(!prisoner||prisoner.state!=='freed')throw new RulesError('rescue.notFree','Only a freed prisoner can reach the table edge.')
   return {...state,prisoners:state.prisoners.map(p=>p.id===action.prisonerId?{...p,state:'escaped'}:p)}
  }
 }
}
/** A freed model still on the table needs an agreed aftermath, not an invented automatic result. */
export function engineRescueAftermath(state:EngineRescueState){
 return {
  remainCaptured:state.prisoners.filter(p=>p.state==='held').map(p=>p.id),
  rescued:state.prisoners.filter(p=>p.state==='escaped').map(p=>p.id),
  needsRuling:state.prisoners.filter(p=>p.state==='freed').map(p=>p.id),
 }
}
