import type {BattleEventRow} from '../../../domain'
import type {EngineRescueRecord} from '../../../api/engineRescue'
export interface EngineKeyPrompt {engineId:string;type:'gaolerOut'|'keeperOut';gaolerId?:string;keeperId?:string;sourceEventId:string;byId:string|null;title:string;note:string}
/** Suggest a table confirmation; never assign an unspecified henchman automatically. */
export function engineKeyPrompts(events:readonly BattleEventRow[],records:readonly EngineRescueRecord[],engines:readonly {id:string;warband_id:string}[],gaolers:readonly {id:string;warbandId:string;name:string}[]):EngineKeyPrompt[]{
 const prompts:EngineKeyPrompt[]=[]
 for(const event of events.filter(e=>!e.reverted_at&&e.payload.out_of_action)){
  const p=event.payload,gaoler=gaolers.find(g=>g.id===p.target_id)
  const byId=p.attacker_kind==='hero'?p.attacker_id:null
  if(gaoler){
   const engine=engines.find(e=>e.warband_id===gaoler.warbandId)
   if(engine&&!records.some(r=>r.state.holderWarbandId===gaoler.warbandId&&r.state.keys.some(k=>k.gaolerId===gaoler.id))&&!prompts.some(x=>x.gaolerId===gaoler.id))prompts.push({engineId:engine.id,type:'gaolerOut',gaolerId:gaoler.id,sourceEventId:event.id,byId,title:`${gaoler.name}: prison keys to record`,note:`Combat log: ${p.attacker_name} took ${gaoler.name} out of action. Confirm which model now carries the keys.`})
  }
  for(const r of records){
   if(r.history.some(h=>!h.revertedAt&&h.action?.type==='keeperOut'&&h.action.sourceEventId===event.id))continue
   for(const key of r.state.keys){
    const keeper=key.keeper;if(!keeper)continue
    const [id,member]=keeper.id.split(':')
    // manual_casualty_index numbers table casualty markers, not physical roster
    // members. Only target_model_index can identify the particular key carrier.
    if(id!==p.target_id||(member!==undefined&&p.target_model_index!==undefined&&Number(member)!==p.target_model_index))continue
    const acquired=r.history.filter(h=>!h.revertedAt&&h.action&&'by' in h.action&&h.action.by?.id===keeper.id).at(-1)
    const source=events.find(e=>e.id===acquired?.action?.sourceEventId)
    if(source&&Date.parse(event.at)<Date.parse(source.at))continue
    if(prompts.some(x=>x.keeperId===keeper.id))continue
    prompts.push({engineId:r.engine_id,type:'keeperOut',keeperId:keeper.id,sourceEventId:event.id,byId,title:`${keeper.name}: check the prison keys`,note:`Combat log: ${p.attacker_name} took ${p.target_name} out of action. ${member!==undefined&&p.target_model_index===undefined?'Confirm that this was the particular model carrying the keys. ':''}Record who has the keys now.`})
   }
  }
 }
 return prompts
}
