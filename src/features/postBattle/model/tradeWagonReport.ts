import type {ReportApplied,HenchmanGroupRow} from '../../../domain'
import type {ReportContext} from './derive'
import type {ReportDraft} from './state'
import {tradeWagonAbandonment,tradeWagonCaptureSnapshot} from './tradeWagon'
export interface WagonReportFacts {wagonId?:string;driverPresent?:boolean;captorId?:string;everyMerchantModelOut?:boolean}
export function reportWagons(ctx:ReportContext) {
  if(ctx.roster.warbandTemplateId!=='merchant_caravans')return []
  return [...(ctx.rawGroups??[]).filter(g=>g.unit_type_rules_id==='merchant_trade_wagon'&&g.size>0).map(g=>({id:g.id,name:g.name})),
    ...ctx.items.filter(i=>i.item_rules_id==='trade_wagon'&&i.quantity>0).map(i=>({id:i.id,name:i.custom_name||'Trade Wagon'}))]
}
export function reportTradeWagon(draft:ReportDraft,ctx:ReportContext) {
  const wagons=reportWagons(ctx),choice=draft.tradeWagon??{}
  const facts={merchantId:ctx.roster.id,wagonPresent:wagons.length>0,routed:draft.routed,routCause:draft.routCause,
    driverPresent:choice.driverPresent,captorId:choice.captorId,everyMerchantModelOut:choice.everyMerchantModelOut,
    // Unfiled opponents can be explicitly confirmed as winner; recorded non-winners cannot.
    winningWarbandIds:(ctx.opponents??[]).filter(o=>!ctx.opponentResults?.[o.id]||ctx.opponentResults[o.id]==='won').map(o=>o.id)}
  const result=tradeWagonAbandonment(facts)
  let snapshot:ReturnType<typeof tradeWagonCaptureSnapshot>|undefined
  if(result.abandoned&&!result.problems.length){
    try{snapshot=tradeWagonCaptureSnapshot({matchId:ctx.matchId,facts,wagonId:choice.wagonId??(wagons.length===1?wagons[0].id:''),items:ctx.items,groups:ctx.rawGroups??[],wyrdstone:ctx.roster.wyrdstone})}
    catch(e){result.problems.push(e instanceof Error?e.message:'Review the captured wagon.')}
  }
  const captor=ctx.opponents?.find(o=>o.id===choice.captorId)?.name??'the winning warband'
  const notes=snapshot?[`Trade Wagon abandoned after a failed Rout test with no driver: ${captor} captures the wagon, two draft horses, ${snapshot.cargo.items.reduce((n,i)=>n+i.quantity,0)} stored equipment copies and ${snapshot.cargo.wyrdstone} wyrdstone shards. Gold is retained. Cargo is held pending an agreed outcome.${snapshot.rare_search_blocked?' The captor cannot search for rare items before its next battle.':' Every Merchant model was out of action, so the captor may search for rare items.'}`]:[]
  return {snapshot,problems:result.problems,notes}
}
/** Remove only unchanged group patches; never erase an injury or other real change. */
export function applyTradeWagonToReport(capture:ReturnType<typeof reportTradeWagon>,applied:ReportApplied,groups:readonly HenchmanGroupRow[]) {
  const s=capture.snapshot
  if(!s)return
  const ids=new Set(s.cargo.items.map(i=>i.id))
  if(s.wagon.kind==='item')ids.add(s.wagon.expected.id)
  else {
    const original=groups.find(g=>g.id===s.wagon.expected.id)
    applied.groups=applied.groups.filter(g=>{
      if(g.id!==s.wagon.expected.id)return true
      if(original&&Object.entries(g.patch).every(([key,value])=>JSON.stringify(value)===JSON.stringify(original[key as keyof HenchmanGroupRow])))return false
      capture.problems.push('The captured wagon also has an injury or advancement change. Reconcile that change before filing its capture.')
      return true
    })
  }
  if(applied.item_patches.some(i=>ids.has(i.id))||applied.remove_item_ids.some(id=>ids.has(id))||applied.awarded_items?.some(i=>i.source_item_id&&ids.has(i.source_item_id)))
    capture.problems.push('Captured wagon cargo is also being used or lost elsewhere in this report. Reconcile those equipment choices before filing.')
  applied.trade_wagon_capture=s
}
