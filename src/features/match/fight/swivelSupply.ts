import { withRollAttempt, type BattleLiveState, type ItemRow } from '../../../domain'

export const SWIVEL_SUPPLIES: Record<string, string> = {
  swivel_gun_ball_shot: 'Ball Shot',
  swivel_gun_chain_shot: 'Chain Shot',
  swivel_gun_grape_shot: 'Grape Shot',
}

export function usedSwivelSupply(sheet: BattleLiveState, itemId: string) {
  return sheet.warbandConsumables.find(use => use.itemRulesId === itemId && !use.correction)
}

export function swivelSupplyRow(items: readonly ItemRow[], warbandId: string, warriorId: string, itemId: string) {
  if (!SWIVEL_SUPPLIES[itemId]) return undefined
  return items.find(row => row.warband_id === warbandId && row.item_rules_id === itemId && row.quantity > 0 && row.holder_id === warriorId)
    ?? items.find(row => row.warband_id === warbandId && row.item_rules_id === itemId && row.quantity > 0 && row.holder_type === 'stash')
}

/** Called on the first actual firing attempt, never on profile selection or opening the roller. */
export function recordSwivelSupply(sheet: BattleLiveState, items: readonly ItemRow[], warbandId: string, warriorId: string, itemId: string, exception: string, id: string, at: string): BattleLiveState {
  if (!SWIVEL_SUPPLIES[itemId] || usedSwivelSupply(sheet, itemId)) return sheet
  const row = swivelSupplyRow(items, warbandId, warriorId, itemId)
  if (!row && !exception.trim()) throw new Error('Buy this ammunition supply or record why ammunition is available at the table.')
  return withRollAttempt({ ...sheet, warbandConsumables: [...sheet.warbandConsumables, {
    id, itemRulesId: itemId, itemRowId: row?.id ?? null, holderKey: row?.holder_id ?? 'stash', at,
  }] }, {
    id, at, turn: sheet.turn, kind: 'attack', status: 'complete', label: `Swivel Gun: ${SWIVEL_SUPPLIES[itemId]} supply opened`,
    rolls: [row ? 'One purchased supply will be deducted in the post-battle report. Further shots of this type use the same supply for this battle.' : `Player exception: ${exception.trim()}. No inventory supply deducted. This ammunition is available for this battle.`],
  })
}

export function correctSwivelSupply(sheet: BattleLiveState, itemId: string, reason: string): BattleLiveState {
  const use = usedSwivelSupply(sheet, itemId)
  if (!use || !reason.trim()) return sheet
  return withRollAttempt({ ...sheet, warbandConsumables: sheet.warbandConsumables.map(row => row.id === use.id ? { ...row, correction: reason.trim() } : row) }, {
    id: `correct:${use.id}`, at: new Date().toISOString(), turn: sheet.turn, kind: 'attack', status: 'complete', label: `Swivel Gun: ${SWIVEL_SUPPLIES[itemId]} supply corrected`,
    rolls: [`Supply declaration withdrawn: ${reason.trim()}. No supply deducted. Existing attacks remain in the shared log; correct their results separately if needed.`],
  })
}
