/** Archive Pestilen Rawhide: declared cargo changes ownership; loaned wagons and mounts do not. */
export interface RevealedRawhideCargo {
  warband_id: string
  wagon: number | null
  gold: number
  wyrdstone: number
  sale_value: number
  rounding: 'up' | 'down'
  valuation_note: string
}
export type RawhideOutcome = 'escaped' | 'captured' | 'empty'
export function rawhideSettlement(cargo: RevealedRawhideCargo, outcome: RawhideOutcome) {
  if (![cargo.gold, cargo.wyrdstone, cargo.sale_value].every(n => Number.isSafeInteger(n) && n >= 0)) throw new Error('Review the declared cargo amounts.')
  if ((cargo.wagon === null) !== (outcome === 'empty')) throw new Error('The outcome does not match the pre-battle cargo declaration.')
  if (cargo.wagon !== null && (!Number.isInteger(cargo.wagon) || cargo.wagon < 1 || cargo.wagon > 4)) throw new Error('Choose one of the four declared wagons.')
  if (cargo.wagon === null && (cargo.gold || cargo.wyrdstone || cargo.sale_value)) throw new Error('Empty wagons cannot contain resources.')
  if (cargo.wagon !== null && (cargo.sale_value < cargo.gold || (!cargo.wyrdstone && cargo.sale_value !== cargo.gold) || !cargo.valuation_note.trim())) throw new Error('Review the agreed full cargo valuation.')
  const proceeds = outcome === 'escaped' ? Math[cargo.rounding === 'up' ? 'ceil' : 'floor'](cargo.sale_value * 13 / 10) : 0
  const merchant = {gold: proceeds - cargo.gold, shards: -cargo.wyrdstone}
  const captor = {gold: outcome === 'captured' ? cargo.gold : 0, shards: outcome === 'captured' ? cargo.wyrdstone : 0}
  const description = outcome === 'empty' ? 'All four wagons were declared empty. No cargo reward.'
    : outcome === 'captured' ? `Wagon ${cargo.wagon} captured: transfer the declared ${cargo.gold} gc and ${cargo.wyrdstone} shards from the merchant to the capturing warband.`
    : `Wagon ${cargo.wagon} escaped: sell the declared ${cargo.gold} gc and ${cargo.wyrdstone} shards for ${proceeds} gc (130% of the agreed ${cargo.sale_value} gc value, rounded ${cargo.rounding}). Merchant treasury change: ${merchant.gold >= 0 ? '+' : ''}${merchant.gold} gc, ${merchant.shards} shards.`
  return {merchant, captor, proceeds, notes: [description, cargo.valuation_note, 'Loaned wagons, horses, warhorses and spears are returned; no permanent equipment is added.'].filter(Boolean)}
}
