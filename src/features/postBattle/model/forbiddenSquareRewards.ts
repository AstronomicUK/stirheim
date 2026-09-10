import type { ReportApplied } from '../../../domain/report'
export interface ForbiddenSquareDraft {
 role?:'infiltrator'|'cultist'
 placed?:number|null
 scored?:number|null
 weaponPolicy?:'return'|'keep'
 weaponReason?:string
 transfers?:NonNullable<ReportApplied['scenario_item_transfers']>
}
export function forbiddenSquareRewards(state:ForbiddenSquareDraft,participantIds:string[],ownId:string) {
 const out={shards:0,notes:[] as string[],problems:[] as string[],transfers:[] as NonNullable<ReportApplied['scenario_item_transfers']>}
 const valid=(n:number|null|undefined,max=Number.MAX_SAFE_INTEGER):n is number=>n!=null&&Number.isSafeInteger(n)&&n>=0&&n<=max
 if(!state.role)out.problems.push('Choose cultist or infiltrator for the Archive Forbidden Square.')
 if(!valid(state.placed))out.problems.push('Record the actual number of wyrdstone counters placed at setup.')
 if(!valid(state.scored,state.placed??0))out.problems.push('Record your scored counters within the actual starting total.')
 if(state.role==='infiltrator'&&valid(state.scored,state.placed??0))out.shards=state.scored
 if(state.role&&valid(state.scored))out.notes.push(`Archive Forbidden Square: ${state.role}, ${state.scored} of ${state.placed} counters ${state.role==='cultist'?'sacrificed at the totem; these vanished and add no carried shards':'carried out through the gate as shards'}.`)
 if(!['return','keep'].includes(state.weaponPolicy??'')||!state.weaponReason?.trim())out.problems.push('Record the agreed post-battle treatment of weapon counters. The source describes picking up weapons but does not explicitly settle permanent ownership afterwards.')
 else out.notes.push(`Weapon counters: ${state.weaponPolicy==='return'?'return to original owners':'retain actually recovered weapons'}. Agreement: ${state.weaponReason.trim()}`)
 if(state.weaponPolicy==='keep'){
  const seen=new Set<string>()
  for(const transfer of state.transfers??[]){
   if(seen.has(transfer.item_id)||!participantIds.includes(transfer.from_warband_id)||transfer.from_warband_id===ownId||!Number.isInteger(transfer.quantity)||transfer.quantity<1||!transfer.reason.trim())out.problems.push('Review the recovered weapon transfer selection.')
   else out.transfers.push(transfer)
   seen.add(transfer.item_id)
  }
 }
 return out
}
