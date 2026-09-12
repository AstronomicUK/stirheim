import { withRollAttempt, type BattleLiveState } from '../../../domain/battle'
import { applyBattleEvents, type BattleEventRow } from '../../../domain/battleEvent'
import type { ItemRow } from '../../../domain'
import type { RosterWarband } from '../../../rules/types/roster'
import { setWoundsLost, woundsLost, isHeroOut } from './sheet'

export function herbsRemaining(sheet: BattleLiveState, item: ItemRow): number {
  return Math.max(0, item.quantity - sheet.healingHerbUses.filter(use => use.itemRowId === item.id && use.singleUse && !use.correction).length)
}

/** The caller confirms table-only timing and engagement. Inventory is settled by the report. */
export function applyHealingHerbs(sheet: BattleLiveState, roster: RosterWarband, events: readonly BattleEventRow[], item: ItemRow, options: { id: string; singleUse: boolean; recoveryConfirmed: boolean; outsideCombatConfirmed: boolean }): BattleLiveState {
  if (sheet.healingHerbUses.some(use => use.id === options.id)) return sheet
  const hero = roster.heroes.find(h => h.id === item.holder_id && h.status === 'active')
  if (!hero || item.warband_id !== roster.id || item.holder_type !== 'hero' || item.item_rules_id !== 'healing_herbs' || herbsRemaining(sheet, item) < 1) throw new Error('An active Hero must carry an available dose of Healing Herbs.')
  if (!options.recoveryConfirmed || !options.outsideCombatConfirmed) throw new Error('Confirm the start of recovery and that the Hero is outside hand-to-hand combat.')
  const shown = applyBattleEvents(sheet, events, roster.id)
  if (isHeroOut(shown, hero.id)) throw new Error('Healing Herbs cannot bring an out-of-action Hero back into battle.')
  const restored = Math.min(hero.stats.W, woundsLost(shown, hero.id))
  if (restored < 1) throw new Error('This Hero has no lost Wounds to restore.')
  const at = new Date().toISOString()
  const use = { id: options.id, warriorId: hero.id, itemRowId: item.id, at, singleUse: options.singleUse, woundsRestored: restored, manualWounds: woundsLost(sheet, hero.id), healedEventIds: events.filter(e => !e.reverted_at && e.kind === 'attack' && e.payload.target_warband_id === roster.id && e.payload.target_id === hero.id && e.payload.wounds_lost > 0).map(e => e.id) }
  const next = setWoundsLost(sheet, hero.id, 'hero', 0, hero.stats.W)
  return withRollAttempt({ ...next, healingHerbUses: [...next.healingHerbUses, use] }, {
    id: use.id, at, turn: sheet.turn, kind: 'attack', status: 'complete', label: `${hero.name}: used Healing Herbs`,
    rolls: [`Restored ${restored} lost Wound${restored === 1 ? '' : 's'}. Player confirmed the start of recovery, outside hand-to-hand combat.`, options.singleUse ? 'Single-use house rule: one dose spent; inventory is settled in the post-battle report.' : 'Reusable Healing Herbs: no dose consumed.'],
  })
}

export function correctHealingHerbs(sheet: BattleLiveState, useId: string, reason: string): BattleLiveState {
  const use = sheet.healingHerbUses.find(entry => entry.id === useId)
  if (!use || use.correction || !reason.trim()) return sheet
  const later = sheet.healingHerbUses.slice(sheet.healingHerbUses.indexOf(use) + 1).some(entry => entry.warriorId === use.warriorId && !entry.correction)
  if (later) throw new Error('Correct this Hero’s later Healing Herbs uses first.')
  if (woundsLost(sheet, use.warriorId) > 0 && use.manualWounds > 0) throw new Error('Manual wounds have changed since healing. Record those separately before restoring the earlier wounds.')
  const next = setWoundsLost(sheet, use.warriorId, 'hero', woundsLost(sheet, use.warriorId) + use.manualWounds, Number.MAX_SAFE_INTEGER)
  return withRollAttempt({ ...next, healingHerbUses: next.healingHerbUses.map(entry => entry.id === useId ? { ...entry, correction: reason.trim() } : entry) }, {
    id: `correct:${useId}`, at: new Date().toISOString(), turn: sheet.turn, kind: 'attack', status: 'complete', label: 'Healing Herbs use corrected',
    rolls: [`Undid the healing and any dose consumption: ${reason.trim()}. Earlier attack records are preserved; later wounds are unchanged.`],
  })
}
