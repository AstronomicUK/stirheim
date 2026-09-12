import { withRollAttempt, type BattleLiveState } from '../../../domain/battle'
import type { BattleEventRow } from '../../../domain/battleEvent'
import type { ItemRow } from '../../../domain'
import type { Combatant } from '../fight/combatants'

export function blessedWaterRemaining(sheet: BattleLiveState, item: ItemRow): number {
  return Math.max(0, item.quantity - sheet.blessedWaterUses.filter(use => use.itemRowId === item.id && !use.correction).length)
}

/** Declare before dice are rolled: misses and abandoned throws still spend the vial. */
export function declareBlessedWater(sheet: BattleLiveState, warrior: Combatant, item: ItemRow, id: string): BattleLiveState {
  if (sheet.blessedWaterUses.some(use => use.id === id)) return sheet
  if (!id.trim()) throw new Error('The throw needs a unique record.')
  const holder = warrior.kind === 'henchman' ? 'group' : 'hero'
  if (warrior.out || warrior.kind === 'animal' || item.holder_type !== holder || item.holder_id !== warrior.id || item.warband_id !== warrior.warbandId || item.item_rules_id !== 'blessed_water' || blessedWaterRemaining(sheet, item) < 1) {
    throw new Error('The warrior must carry an available vial of Blessed Water.')
  }
  if (warrior.traitIds.some(trait => trait === 'undead' || trait === 'possessed')) throw new Error('Undead and Possessed models may not use Blessed Water.')
  const use = { id, warriorId: warrior.id, warriorName: warrior.name, itemRowId: item.id, at: new Date().toISOString(), turn: sheet.turn }
  return withRollAttempt({ ...sheet, blessedWaterUses: [...sheet.blessedWaterUses, use] }, {
    id: `vial:${id}`, at: use.at, turn: sheet.turn, kind: 'attack', status: 'complete',
    label: `${warrior.name}: threw Blessed Water`,
    rolls: ['One vial spent, whether the throw hits or misses. Inventory is settled in the post-battle report.'],
  })
}

/** Attach the shared damage record so returning a vial cannot silently leave that damage in play. */
export function linkBlessedWaterAttack(sheet: BattleLiveState, id: string, attackEventId: string): BattleLiveState {
  const use = sheet.blessedWaterUses.find(entry => entry.id === id)
  if (!use || use.correction || !attackEventId.trim()) throw new Error('No active Blessed Water throw to link.')
  if (use.attackEventId && use.attackEventId !== attackEventId) throw new Error('This throw already has a recorded attack.')
  return { ...sheet, blessedWaterUses: sheet.blessedWaterUses.map(entry => entry.id === id ? { ...entry, attackEventId } : entry) }
}

export function correctBlessedWater(sheet: BattleLiveState, id: string, reason: string, events: readonly BattleEventRow[]): BattleLiveState {
  const use = sheet.blessedWaterUses.find(entry => entry.id === id)
  if (!use || use.correction) return sheet
  if (!reason.trim()) throw new Error('Explain why the Blessed Water throw is being corrected.')
  if (events.some(event => !event.reverted_at && event.payload?.blessedWaterUseId === id)) throw new Error('Undo the linked attack in the combat log before restoring its vial.')
  if (use.attackEventId && !events.find(event => event.id === use.attackEventId)?.reverted_at) throw new Error('Undo the linked attack in the combat log before restoring its vial.')
  return withRollAttempt({ ...sheet, blessedWaterUses: sheet.blessedWaterUses.map(entry => entry.id === id ? { ...entry, correction: reason.trim() } : entry) }, {
    id: `correct-vial:${id}`, at: new Date().toISOString(), turn: sheet.turn, kind: 'attack', status: 'complete',
    label: `${use.warriorName}: Blessed Water throw corrected`,
    rolls: [`Vial restored: ${reason.trim()}. Earlier dice records are preserved.`],
  })
}
