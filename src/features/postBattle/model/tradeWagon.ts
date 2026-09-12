import type { ItemRow } from '../../../domain'

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
