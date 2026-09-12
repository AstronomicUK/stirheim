import type { ItemRow, HenchmanGroupRow } from '../../../domain'

export interface TradeWagonFacts {
  merchantId:string
  wagonPresent:boolean
  routed:boolean
  routCause?:'failed-test'|'voluntary'|'table'
  driverPresent?:boolean
  captorId?:string
  winningWarbandIds:readonly string[]
  everyMerchantModelOut?:boolean
}

/** Trade Wagon Abandoned (equipment scrape 02:2395); voluntary withdrawal alone is not a failed test. */
export function tradeWagonAbandonment(facts:TradeWagonFacts) {
  const result={abandoned:false,captorId:null as string|null,rareSearchBlocked:null as boolean|null,problems:[] as string[]}
  if (!facts.wagonPresent||!facts.routed||facts.routCause==='voluntary') return result
  if (!facts.routCause||facts.routCause==='table') {
    result.problems.push('Trade Wagon: confirm whether the warband failed a Rout test or withdrew voluntarily.')
    return result
  }
  if (facts.driverPresent===undefined) {
    result.problems.push('Trade Wagon: confirm whether a model was driving it when the Rout test failed.')
    return result
  }
  if (facts.driverPresent) return result
  result.abandoned=true
  if (!facts.captorId||facts.captorId===facts.merchantId||!facts.winningWarbandIds.includes(facts.captorId)) {
    result.problems.push('Trade Wagon: select the winning warband that captured the abandoned wagon.')
  } else result.captorId=facts.captorId
  if (facts.everyMerchantModelOut===undefined) result.problems.push('Trade Wagon: confirm whether every Merchant Caravan model was out of action; this determines the captor’s rare-item search restriction.')
  else result.rareSearchBlocked=!facts.everyMerchantModelOut
  return result
}

/** Storage includes the stash and treasures, explicitly excluding gold and carried equipment. */
export function tradeWagonCargo(items:readonly ItemRow[],merchantId:string,wyrdstone:number) {
  if (!Number.isSafeInteger(wyrdstone)||wyrdstone<0) throw new Error('Review the Merchant Caravan’s stored wyrdstone.')
  return {
    items:items.filter(item=>item.warband_id===merchantId&&item.holder_type==='stash'&&item.quantity>0).map(item=>({...item})),
    wyrdstone,
  }
}

/** Freeze capture-time cargo before either report adds new finds or trading changes the stash. */
export function tradeWagonCaptureSnapshot(input:{matchId:string;facts:TradeWagonFacts;wagonId:string;items:readonly ItemRow[];groups:readonly HenchmanGroupRow[];wyrdstone:number}) {
  const capture=tradeWagonAbandonment(input.facts)
  if (!capture.abandoned||capture.problems.length||!capture.captorId||capture.rareSearchBlocked===null) throw new Error(capture.problems.join(' ')||'This wagon has not been abandoned after a failed Rout test.')
  const group=input.groups.find(g=>g.id===input.wagonId&&g.warband_id===input.facts.merchantId&&g.unit_type_rules_id==='merchant_trade_wagon'&&g.size===1)
  const item=input.items.find(i=>i.id===input.wagonId&&i.warband_id===input.facts.merchantId&&i.item_rules_id==='trade_wagon'&&i.quantity===1)
  if (!group&&!item) throw new Error('Select the Merchant Caravan’s actual single Trade Wagon; reconcile an ambiguous wagon stack before capture.')
  const cargo=tradeWagonCargo(input.items.filter(i=>i.id!==item?.id),input.facts.merchantId,input.wyrdstone)
  return structuredClone({
    failed_rout:true as const,driver_present:false as const,
    match_id:input.matchId,merchant_id:input.facts.merchantId,captor_id:capture.captorId,
    merchant_all_ooa:input.facts.everyMerchantModelOut!,rare_search_blocked:capture.rareSearchBlocked,
    wagon:group?{kind:'group' as const,expected:group}:{kind:'item' as const,expected:item!},cargo,
  })
}
export type TradeWagonCaptureSnapshot=ReturnType<typeof tradeWagonCaptureSnapshot>
