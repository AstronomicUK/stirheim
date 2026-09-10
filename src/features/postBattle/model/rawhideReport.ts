import type {RawhideCargo} from '../../../api/rawhide'
import {rawhideSettlement,type RawhideOutcome} from './rawhideRewards'
export interface RawhideDraft { outcome?:RawhideOutcome|'other'|'manual'; note?:string }
export function rawhideReport(draft:RawhideDraft,cargo:RawhideCargo|undefined,ownId:string,ended:boolean,reportId?:string){
 const out={gold:0,shards:0,notes:[] as string[],problems:[] as string[],settlement:undefined as {outcome:RawhideOutcome;gold_delta:number;wyrdstone_delta:number}|undefined}
 if(!ended){out.problems.push('End the battle on the Battles screen before revealing and settling Rawhide cargo.');return out}
 if(cargo&&!cargo.declared&&draft.outcome==='manual'){
  if(!draft.note?.trim())out.problems.push('Record the agreed legacy cargo reconciliation and how both treasuries are being corrected.')
  out.notes.push(`Rawhide legacy cargo reconciliation: ${draft.note?.trim()||'details pending'}. No cargo is invented or automatically transferred; any agreed treasury adjustment is recorded separately.`)
  return out
 }
 if(draft.outcome==='manual'&&cargo?.declared){out.problems.push('Use the actual declared cargo for this battle.');return out}
 if(!cargo?.declared||!cargo.revealed||cargo.wagon===undefined||cargo.gold===undefined||cargo.wyrdstone===undefined||cargo.sale_value===undefined||!cargo.rounding){out.problems.push('Load the cargo declared before this Rawhide battle. Do not invent a replacement cargo after battle.');return out}
 if(!draft.outcome||draft.outcome==='manual'){out.problems.push('Record your Rawhide cargo settlement.');return out}
 if(draft.outcome==='other'){
  if(!draft.note?.trim())out.problems.push('Explain which other warband settles the cargo and what happened to it.')
  out.notes.push(`Rawhide cargo settled in another warband’s report: ${draft.note?.trim()||'details pending'}. No cargo reward is added here.`)
  return out
 }
 if(cargo.settled_report_id&&cargo.settled_report_id!==reportId){out.problems.push('This cargo was already settled in another report. Record that report instead of claiming it again.');return out}
 const merchant=cargo.warband_id===ownId
 if((draft.outcome==='captured')===merchant){out.problems.push('The merchant settles escaped or empty cargo; a capturing opponent settles captured cargo.');return out}
 try {
  const result=rawhideSettlement({warband_id:cargo.warband_id,wagon:cargo.wagon,gold:cargo.gold,wyrdstone:cargo.wyrdstone,sale_value:cargo.sale_value,rounding:cargo.rounding,valuation_note:cargo.valuation_note??''},draft.outcome)
  const delta=merchant?result.merchant:result.captor
  out.settlement={outcome:draft.outcome,gold_delta:delta.gold,wyrdstone_delta:delta.shards}
  out.notes.push(...result.notes,'Record +1 saving the wyrdstone / successful ambush for the eligible leader, and +1 getting away / stopping a wagon for the actual warriors, in the Experience step. Do not use the historical 20/5 XP appendix.')
 }catch(error){out.problems.push(error instanceof Error?error.message:String(error))}
 return out
}
