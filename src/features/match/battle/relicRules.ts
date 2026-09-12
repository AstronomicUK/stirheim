import type { BattleLiveState } from '../../../domain/battle'
import type { RosterWarband } from '../../../rules/types/roster'
import type { LdOption } from './routCheckRules'

/** Core equipment, 02-weapons-armour-equipment.md:1719–1721. */
export function canUseRoutRelic(roster: RosterWarband, sheet: BattleLiveState, chosen?: LdOption) {
  if (!chosen?.leader || !chosen.standing) return false
  const bearer = roster.heroes.find(h => h.id === chosen.id)
  if (!bearer?.equipment.some(e => e.itemId === 'holy_unholy_relic' && e.quantity > 0)) return false
  return !sheet.leadershipTests.some(t => t.warriorId === chosen.id)
    && !sheet.stupidityResults.some(t => t.warriorId === chosen.id)
    // Historic rout notes lack a bearer id. Do not silently offer another first-test benefit.
    && !/Rout check (passed|failed)/i.test(sheet.notes)
}

export function recordLeadershipTest(sheet: BattleLiveState, warriorId: string, kind: 'rout' | 'table', relic = false): BattleLiveState {
  return { ...sheet, leadershipTests: [...sheet.leadershipTests, { warriorId, kind, relic, at: new Date().toISOString() }] }
}

export function passRoutWithRelic(roster: RosterWarband, sheet: BattleLiveState, chosen: LdOption, confirmedFirstTest: boolean): BattleLiveState {
  if (!confirmedFirstTest || !canUseRoutRelic(roster, sheet, chosen)) return sheet
  const next = recordLeadershipTest(sheet, chosen.id, 'rout', true)
  const line = `Rout check passed automatically: ${chosen.label} used a Holy (Unholy) Relic. Player confirmed this was the bearer's first Leadership test of the battle; no dice rolled.`
  return { ...next, notes: [sheet.notes.trimEnd(), line].filter(Boolean).join('\n') }
}
