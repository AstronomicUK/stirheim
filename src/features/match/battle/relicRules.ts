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
    && !sheet.leadershipTests.some(t => t.warriorId === warriorId && !t.correction)
    && !sheet.stupidityResults.some(t => t.warriorId === warriorId)
}

export function recordLeadershipTest(sheet: BattleLiveState, warriorId: string, kind: 'rout' | 'table' | 'stupidity', relic = false): BattleLiveState {
  return { ...sheet, leadershipTests: [...sheet.leadershipTests, { id: crypto.randomUUID(), warriorId, kind, relic, at: new Date().toISOString() }] }
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

/** Fear, All Alone and other Leadership tests whose table circumstances remain player-confirmed. */
export function passTableWithRelic(roster: RosterWarband, sheet: BattleLiveState, warriorId: string, name: string, test: string, confirmedFirstTest: boolean): BattleLiveState {
  if (!confirmedFirstTest || !test.trim() || !canUseRelic(roster, sheet, warriorId)) return sheet
  return withRollAttempt(recordLeadershipTest(sheet, warriorId, 'table', true), {
    id: crypto.randomUUID(), at: new Date().toISOString(), turn: sheet.turn, kind: 'attack', status: 'complete',
    label: `${name}: ${test.trim()} passed with Holy (Unholy) Relic`,
    rolls: ['Player confirmed this was the first Leadership test of the battle. Automatically passed; no dice rolled. Apply the result at the table. The relic remains in inventory; its first-test benefit is spent.'],
  })
}


/** Correct only a tabletop declaration here; actual Rout/Stupidity outcomes have their own state. */
export function correctTableLeadershipTest(sheet: BattleLiveState, id: string, reason: string): BattleLiveState {
  const test = sheet.leadershipTests.find(entry => entry.id === id && entry.kind === 'table' && !entry.correction)
  if (!test || !reason.trim()) return sheet
  return withRollAttempt({ ...sheet, leadershipTests: sheet.leadershipTests.map(entry => entry === test ? { ...entry, correction: reason.trim() } : entry) }, {
    id: `correct-leadership:${id}`, at: new Date().toISOString(), turn: sheet.turn, kind: 'attack', status: 'complete',
    label: 'Tabletop Leadership test corrected', rolls: [`The earlier declaration no longer spends the first-test benefit: ${reason.trim()}. Other Leadership tests remain recorded; correct any tabletop consequences separately.`],
  })
}
