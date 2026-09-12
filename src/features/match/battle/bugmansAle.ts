import { withRollAttempt, type BattleLiveState } from '../../../domain/battle'
import type { ItemRow } from '../../../domain'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterWarband } from '../../../rules/types/roster'
import { setItemUsed } from './sheet'

/**
 * Bugman's Ale, core rulebook (02:1510): "A warband that drinks a barrel of Bugman's before a battle
 * will be immune to fear for the whole of the battle. Elves may not drink Bugman's ale … There is only
 * enough ale to supply the warband for one battle."
 *
 * The barrel is a warband-level consumable, not a warrior's kit: it usually sits in the stash, and one
 * barrel covers every non-Elf member. So it is declared once for the whole warband here, recorded in
 * `sheet.warbandConsumables`, and the fight code grants `immune_to_fear` to every eligible warrior from
 * that record (combatants.ts). The report deducts exactly one barrel through the ordinary `itemsUsed`
 * path, keyed by the row's holder (a hero id, or "stash").
 */
export const BUGMANS_ALE = 'bugmans_ale'
export const STASH_HOLDER_KEY = 'stash'

export interface WarbandConsumable {
  id: string
  itemRulesId: string
  /** The items row the barrel came from; null when the row is already gone. */
  itemRowId: string | null
  /** The items row's holder_id, or "stash" — the same key setItemUsed records for the report. */
  holderKey: string
  at: string
  correction?: string
}

/** Until the domain schema carries the field everywhere, read it defensively. */
export function warbandConsumables(sheet: BattleLiveState): WarbandConsumable[] {
  return (sheet as BattleLiveState & { warbandConsumables?: WarbandConsumable[] }).warbandConsumables ?? []
}

/** Every barrel this warband could drink: in the stash, or carried by an active member. */
export function aleBarrels(items: readonly ItemRow[], roster: RosterWarband): ItemRow[] {
  const members = new Set([...roster.heroes, ...roster.hiredSwords].filter(w => w.status === 'active').map(w => w.id))
  return items.filter(row => row.warband_id === roster.id && row.item_rules_id === BUGMANS_ALE && row.quantity > 0
    && (row.holder_type === 'stash' || (row.holder_type === 'hero' && row.holder_id !== null && members.has(row.holder_id))))
}

export function holderKeyOf(row: ItemRow): string {
  return row.holder_type === 'stash' || row.holder_id === null ? STASH_HOLDER_KEY : row.holder_id
}

/** The uncorrected barrel drunk this battle, if any. */
export function aleDrunk(sheet: BattleLiveState): WarbandConsumable | undefined {
  return warbandConsumables(sheet).find(c => c.itemRulesId === BUGMANS_ALE && !c.correction)
}

/** "Elves may not drink Bugman's ale": a warband whose template race is elven cannot drink at all. */
export function isElvenWarband(template: WarbandTemplate | undefined): boolean {
  return /\belf\b|\belves\b|\belven\b/i.test(template?.race ?? '')
}

export function describeBarrel(row: ItemRow, roster: RosterWarband): string {
  if (row.holder_type === 'stash' || row.holder_id === null) return `in the stash${row.quantity > 1 ? ` (${row.quantity} barrels)` : ''}`
  const holder = [...roster.heroes, ...roster.hiredSwords].find(w => w.id === row.holder_id)
  return `carried by ${holder?.name ?? 'a warrior'}${row.quantity > 1 ? ` (${row.quantity} barrels)` : ''}`
}

/**
 * The warband drinks one barrel before the battle. The caller confirms the timing at the table.
 * Refused (with a reason the control shows) when a barrel is already drunk this battle, when the
 * warband is elven, or when no barrel is available.
 */
export function drinkBugmansAle(sheet: BattleLiveState, roster: RosterWarband, template: WarbandTemplate | undefined, items: readonly ItemRow[], options: { id: string; barrelRowId?: string; confirmedBeforeBattle: boolean }): BattleLiveState {
  if (warbandConsumables(sheet).some(c => c.id === options.id)) return sheet
  if (!options.confirmedBeforeBattle) throw new Error('Confirm the barrel was drunk before the battle began.')
  if (isElvenWarband(template)) throw new Error('Elves may not drink Bugman’s Ale; they are far too delicate to cope with its effects.')
  if (aleDrunk(sheet)) throw new Error('The warband has already drunk a barrel this battle. One barrel supplies one battle.')
  const barrels = aleBarrels(items, roster)
  const row = (options.barrelRowId ? barrels.find(b => b.id === options.barrelRowId) : undefined) ?? barrels[0]
  if (!row) throw new Error('No barrel of Bugman’s Ale is in the stash or carried by an active member.')
  const at = new Date().toISOString()
  const holderKey = holderKeyOf(row)
  const entry: WarbandConsumable = { id: options.id, itemRulesId: BUGMANS_ALE, itemRowId: row.id, holderKey, at }
  const next = setItemUsed(sheet, holderKey, BUGMANS_ALE, true) as BattleLiveState & { warbandConsumables?: WarbandConsumable[] }
  return withRollAttempt({ ...next, warbandConsumables: [...warbandConsumables(next), entry] } as BattleLiveState, {
    id: options.id, at, turn: sheet.turn, kind: 'attack', status: 'complete',
    label: `${roster.name}: drank a barrel of Bugman’s Ale`,
    rolls: [`The whole warband is immune to fear for this battle (Elves excepted). Player confirmed the barrel was drunk before the battle. One barrel (${describeBarrel(row, roster)}) will be deducted in the post-battle report.`],
  })
}

/** Explained correction (Tom's override rule): the immunity goes, the barrel is not deducted, the reason is logged. */
export function correctBugmansAle(sheet: BattleLiveState, id: string, reason: string): BattleLiveState {
  const entry = warbandConsumables(sheet).find(c => c.id === id && !c.correction)
  const why = reason.trim()
  if (!entry || !why) return sheet
  const stillUsed = warbandConsumables(sheet).some(c => c !== entry && !c.correction && c.itemRulesId === entry.itemRulesId && c.holderKey === entry.holderKey)
  const unmarked = stillUsed ? sheet : setItemUsed(sheet, entry.holderKey, entry.itemRulesId, false)
  return withRollAttempt({ ...unmarked, warbandConsumables: warbandConsumables(unmarked).map(c => c === entry || c.id === id ? { ...c, correction: why } : c) } as BattleLiveState, {
    id: `correct:${id}`, at: new Date().toISOString(), turn: sheet.turn, kind: 'attack', status: 'complete',
    label: 'Bugman’s Ale corrected',
    rolls: [`The warband did not drink the barrel after all: ${why}. Fear immunity withdrawn; no barrel will be deducted. Earlier records are preserved.`],
  })
}
