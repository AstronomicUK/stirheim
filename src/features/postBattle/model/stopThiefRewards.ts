import type { ReportApplied } from '../../../domain/report'
export type StolenEquipment = NonNullable<ReportApplied['scenario_item_transfers']>[number]
export interface StopThiefDraft {
  defenderId?: string
  setupConfirmed?: boolean
  recovered?: boolean
  recoveryNote?: string
  dice?: (number|null)[]
  /** Only copies still held by another warband need moving; unchanged original ownership is recorded separately. */
  recoveredTransfers?: StolenEquipment[]
  sales?: StolenEquipment[]
  returnedAllies?: string[]
  reviewed?: boolean
}
/** Fanatic Magazine 7. Actual original equipment only; temporary Thief services are not a free permanent hire. */
export function stopThiefRewards(state:StopThiefDraft,won:boolean,ownId:string,warbands:{id:string;name:string}[]) {
  const out={gold:0,notes:[] as string[],problems:[] as string[],transfers:[] as StolenEquipment[],retrievedLeaderXp:false}
  const defender=warbands.find(w=>w.id===state.defenderId)
  if(!defender)out.problems.push('Choose the defending warband from the battle participants.')
  if(!state.setupConfirmed)out.problems.push('Confirm the defending warband and stolen equipment agreed at setup: highest-rated defender; each attacker’s most expensive portable item, with magic items taking priority.')
  if(!defender)return out
  const defending=defender.id===ownId
  out.notes.push(`Stop Thief defender: ${defender.name}. Setup selection confirmed: ${state.setupConfirmed?'yes':'pending'}. The temporary Halfling Thief is not automatically recruited permanently; retain him through normal recruitment.`)
  if(!defending) {
    if(state.recovered===undefined)out.problems.push('Record whether your stolen item was returned.')
    if(won&&!state.recovered)out.problems.push('A winning attacker recovers their stolen item; review the recovery record.')
    if(state.recovered) {
      if(!state.recoveryNote?.trim())out.problems.push('Name the recovered item and record whether it remained on your roster or is being transferred back.')
      out.retrievedLeaderXp=true
      out.notes.push(`Stolen item recovered: ${state.recoveryNote?.trim()||'details pending'}. Attacking leader earns +1 XP, subject to survival.`)
      if((state.recoveredTransfers??[]).length>1)out.problems.push('Only one original stolen copy is returned to each attacker.')
      for(const t of state.recoveredTransfers??[]) {
        if(t.from_warband_id!==defender.id||t.quantity!==1||t.sale_value!==undefined||!t.reason.trim())out.problems.push('Review the original stolen copy being returned by the defender.')
        else out.transfers.push(t)
      }
    } else out.notes.push('Stolen item not returned; the defending winner must record its sale. No replacement item is created by this report.')
    if(won) {
      const dice=state.dice??[]
      if(dice.length!==2||dice.some(d=>d==null||!Number.isInteger(d)||d<1||d>6))out.problems.push('Record the actual 2D6 valuables roll for the attacking victory.')
      else {out.gold=dice.reduce<number>((sum,d)=>sum+d!,0);out.notes.push(`Recovered valuables: 2D6 (${dice.join(', ')}) = ${out.gold} gc.`)}
    }
    return out
  }
  if(!won){out.notes.push('Defender lost: no hocking proceeds. Victorious attackers record recovery of their original equipment.');return out}
  if(!state.reviewed)out.problems.push('Review the stolen item from every attacker, recording either its sale or return to an ally.')
  const attackers=warbands.filter(w=>w.id!==ownId),seen=new Set<string>(),allies=state.returnedAllies??[]
  if(new Set(allies).size!==allies.length||allies.some(id=>!attackers.some(w=>w.id===id)))out.problems.push('Choose each allied attacker receiving its own item back once.')
  for(const t of state.sales??[]) {
    const attacker=attackers.find(w=>w.id===t.from_warband_id)
    if(!attacker||seen.has(t.from_warband_id)||allies.includes(t.from_warband_id)||t.quantity!==1||t.sale_value==null||!Number.isSafeInteger(t.sale_value)||t.sale_value<0||!t.reason.trim())out.problems.push('Review one actual stolen copy per attacker, its agreed full value and selection reason; an item cannot be both sold and returned.')
    else {const gold=Math.floor(t.sale_value/2);out.gold+=gold;out.transfers.push(t);out.notes.push(`${attacker.name}: stolen equipment sold for ${gold} gc (half its recorded ${t.sale_value} gc value). ${t.reason.trim()}`)}
    seen.add(t.from_warband_id)
  }
  for(const attacker of attackers)if(allies.includes(attacker.id))out.notes.push(`${attacker.name}: original stolen item returned by agreement between allies; no sale proceeds. The attacker records recovery.`);else if(!seen.has(attacker.id))out.problems.push(`Record the stolen item sale or allied return for ${attacker.name}.`)
  return out
}
