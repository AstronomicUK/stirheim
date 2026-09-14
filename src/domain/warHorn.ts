import { withRollAttempt, type BattleLiveState } from './battle'
import type { ItemRow } from './rows'

export const WAR_HORNS = ['war_horn', 'war_horn_of_nagarythe', 'liturgicus_infecticus'] as const
export function warHornBonus(sheet: BattleLiveState | undefined, phaseKey: string | undefined): number {
  return phaseKey && sheet?.warHornUses.some(use => !use.correction && use.phaseKey === phaseKey) ? 1 : 0
}
export function soundWarHorn(sheet: BattleLiveState, row: ItemRow, input: { id: string; warbandId: string; name: string; copyIndex: number; phaseKey: string; confirmedTiming: boolean }): BattleLiveState {
  if (sheet.warHornUses.some(use => use.id === input.id)) return sheet
  if (!input.confirmedTiming) throw new Error('Confirm this is the beginning of a turn or immediately before a Rout test.')
  if (row.warband_id !== input.warbandId || !WAR_HORNS.some(id => id === row.item_rules_id) || !Number.isInteger(input.copyIndex) || input.copyIndex < 0 || input.copyIndex >= row.quantity) throw new Error('The selected Leadership item is unavailable.')
  const liturgy = row.item_rules_id === 'liturgicus_infecticus'
  if (sheet.warHornUses.some(use => !use.correction && use.itemRowId === row.id && use.copyIndex === input.copyIndex && (!liturgy || use.phaseKey === input.phaseKey))) throw new Error(liturgy ? 'This liturgy is already active this turn.' : 'This horn has already been sounded this battle.')
  if (warHornBonus(sheet,input.phaseKey)) throw new Error('A Leadership item is already active this turn. Resolve any agreed overlapping bonus at the table.')
  const use = { id: input.id, itemRowId: row.id, itemId:row.item_rules_id!, name:input.name, copyIndex:input.copyIndex, phaseKey:input.phaseKey, at:new Date().toISOString() }
  return withRollAttempt({...sheet,warHornUses:[...sheet.warHornUses,use]}, {
    id:use.id,at:use.at,turn:sheet.turn,kind:'attack',status:'complete',label:`${use.name}: +1 Leadership this turn`,
    rolls:[`Player confirmed the timing: beginning of the turn or just before a Rout test. The whole warband gains +1 Leadership until the next turn begins. ${liturgy?'The book remains in inventory.':'This horn is spent for this battle, but remains in inventory.'}`],
  })
}
export function correctWarHorn(sheet: BattleLiveState, id: string, reason: string): BattleLiveState {
  const use=sheet.warHornUses.find(use=>use.id===id&&!use.correction)
  if(!use||!reason.trim())return sheet
  return withRollAttempt({...sheet,warHornUses:sheet.warHornUses.map(use=>use.id===id?{...use,correction:reason.trim()}:use)}, {
    id:`correct:${id}`,at:new Date().toISOString(),turn:sheet.turn,kind:'attack',status:'complete',label:`${use.name} activation corrected`,
    rolls:[`Player correction: ${reason.trim()}. The temporary bonus and use record are withdrawn. Existing test results remain recorded; the item was not consumed.`],
  })
}
