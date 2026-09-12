import { withRollAttempt } from '../../../domain/battle'
import type { BattleLiveState } from '../../../domain/battle'
import type { RosterWarband } from '../../../rules/types/roster'
import type { LdOption } from './routCheckRules'

/** Core equipment, 02-weapons-armour-equipment.md:1719–1721. */
export function canUseRoutRelic(roster: RosterWarband, sheet: BattleLiveState, chosen?: LdOption) {
  if (!chosen?.leader || !chosen.standing) return false
  return canUseRelic(roster, sheet, chosen.id)
    // Historic rout notes lack a bearer id. Do not silently grant another first-test benefit.
    && !/Rout check (passed|failed)/i.test(sheet.notes)
}

export function canUseRelic(roster: RosterWarband, sheet: BattleLiveState, warriorId: string) {
  const bearer = [...roster.heroes, ...roster.hiredSwords, ...roster.henchmenGroups.filter(g => g.size === 1)].find(w => w.id === warriorId)
  return Boolean(bearer?.equipment.some(e => e.itemId === 'holy_unholy_relic' && e.quantity > 0))
    && !sheet.leadershipTests.some(t => t.warriorId === warriorId)
    && !sheet.stupidityResults.some(t => t.warriorId === warriorId)
}

export function recordLeadershipTest(sheet: BattleLiveState, warriorId: string, kind: 'rout' | 'table' | 'stupidity', relic = false): BattleLiveState {
  return { ...sheet, leadershipTests: [...sheet.leadershipTests, { warriorId, kind, relic, at: new Date().toISOString() }] }
}

export function passRoutWithRelic(roster: RosterWarband, sheet: BattleLiveState, chosen: LdOption, confirmedFirstTest: boolean): BattleLiveState {
  if (!confirmedFirstTest || !canUseRoutRelic(roster, sheet, chosen)) return sheet
  const next = recordLeadershipTest(sheet, chosen.id, 'rout', true)
  const line = `Rout check passed automatically: ${chosen.label} used a Holy (Unholy) Relic. Player confirmed this was the bearer's first Leadership test of the battle; no dice rolled.`
  return { ...next, notes: [sheet.notes.trimEnd(), line].filter(Boolean).join('\n') }
}

export function passStupidityWithRelic(roster: RosterWarband, sheet: BattleLiveState, warriorId: string, name: string, turnKey: string, confirmed: boolean): BattleLiveState {
  if (!confirmed || !canUseRelic(roster, sheet, warriorId)) return sheet
  const next = recordLeadershipTest(sheet, warriorId, 'stupidity', true)
  return withRollAttempt({ ...next, stupidityResults: [...sheet.stupidityResults, { warriorId, turnKey, failed: false }] }, {
    id: crypto.randomUUID(), at: new Date().toISOString(), turn: sheet.turn, kind: 'attack', status: 'complete',
    label: `${name}: Stupidity passed with Holy (Unholy) Relic`,
    rolls: ['Player confirmed this was the first Leadership test of the battle. Automatically passed; no dice rolled. The relic remains in inventory, but its first-test benefit is spent.'],
  })
}
