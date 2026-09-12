import { withRollAttempt } from '../../../domain/battle'
import type { BattleLiveState } from '../../../domain/battle'
import type { RosterWarband } from '../../../rules/types/roster'
import type { LdOption } from './routCheckRules'

type LeadershipEntry = BattleLiveState['leadershipTests'][number] & {
  /** The warband turn a relic Stupidity pass covered, so a correction can find the result it wrote. */
  turnKey?: string
}

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

export function recordLeadershipTest(sheet: BattleLiveState, warriorId: string, kind: 'rout' | 'table' | 'stupidity', relic = false, turnKey?: string): BattleLiveState {
  const entry: LeadershipEntry = { id: crypto.randomUUID(), warriorId, kind, relic, at: new Date().toISOString(), ...(turnKey ? { turnKey } : {}) }
  return { ...sheet, leadershipTests: [...sheet.leadershipTests, entry] }
}

const ROUT_RELIC_NOTE = 'Rout check passed automatically:'

export function passRoutWithRelic(roster: RosterWarband, sheet: BattleLiveState, chosen: LdOption, confirmedFirstTest: boolean): BattleLiveState {
  if (!confirmedFirstTest || !canUseRoutRelic(roster, sheet, chosen)) return sheet
  const next = recordLeadershipTest(sheet, chosen.id, 'rout', true)
  const line = `${ROUT_RELIC_NOTE} ${chosen.label} used a Holy (Unholy) Relic. Player confirmed this was the bearer's first Leadership test of the battle; no dice rolled.`
  return { ...next, notes: [sheet.notes.trimEnd(), line].filter(Boolean).join('\n') }
}

export function passStupidityWithRelic(roster: RosterWarband, sheet: BattleLiveState, warriorId: string, name: string, turnKey: string, confirmed: boolean): BattleLiveState {
  if (!confirmed || !canUseRelic(roster, sheet, warriorId)) return sheet
  const next = recordLeadershipTest(sheet, warriorId, 'stupidity', true, turnKey)
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

/**
 * A declaration is something the player asserted without dice: a relic automatic pass (Rout, Stupidity
 * or a tabletop test) or "already tested at the table". Rolled Rout and Stupidity tests are not
 * declarations — their outcomes have their own state and correction paths.
 */
export function isLeadershipDeclaration(entry: BattleLiveState['leadershipTests'][number]) {
  return Boolean(entry.id) && (entry.relic || entry.kind === 'table')
}

/** Declarations for one warrior that can still be corrected. */
export function correctableDeclarations(sheet: BattleLiveState, warriorId: string) {
  return sheet.leadershipTests.filter(entry => entry.warriorId === warriorId && isLeadershipDeclaration(entry) && !entry.correction)
}

export function describeDeclaration(entry: BattleLiveState['leadershipTests'][number]) {
  if (!entry.relic) return 'earlier test declaration'
  return `relic automatic pass (${entry.kind === 'rout' ? 'Rout check' : entry.kind === 'stupidity' ? 'Stupidity' : 'tabletop test'})`
}

/**
 * Explained correction of a declaration (Tom's override rule: warn, allow the exception, record why).
 * Restores the first-test benefit by marking the entry corrected; for a relic Rout pass the generated
 * note line is withdrawn so the historic-note guard stops applying; for a relic Stupidity pass the
 * "passed" result it wrote is removed unless a genuine test has since been recorded for that warrior.
 * Every other test, outcome and log line stays exactly as it was.
 */
export function correctLeadershipDeclaration(sheet: BattleLiveState, id: string, reason: string): BattleLiveState {
  const test = sheet.leadershipTests.find(entry => entry.id === id && isLeadershipDeclaration(entry) && !entry.correction) as LeadershipEntry | undefined
  const why = reason.trim()
  if (!test || !why) return sheet
  let next: BattleLiveState = { ...sheet, leadershipTests: sheet.leadershipTests.map(entry => entry === test ? { ...entry, correction: why } : entry) }
  const detail = [`The earlier declaration no longer spends the first-test benefit: ${why}.`]
  if (test.relic && test.kind === 'rout') {
    const lines = next.notes.split('\n')
    const i = lines.findIndex(line => line.startsWith(ROUT_RELIC_NOTE))
    if (i >= 0) {
      // Must not keep the words "Rout check passed": canUseRoutRelic reads them as a historic test.
      lines[i] = `Rout relic declaration withdrawn: ${why}. The automatic pass recorded earlier no longer stands; if the rout check is still due, resolve it again.`
      next = { ...next, notes: lines.join('\n') }
      detail.push('The automatic Rout pass note has been withdrawn; if the rout check is still due, resolve it again.')
    } else {
      detail.push('The automatic Rout pass note was not found as written (edited by hand?), so the notes still count as a historic Rout test; edit them by hand if the relic should be offered for the rout check again.')
    }
  }
  if (test.relic && test.kind === 'stupidity') {
    const genuineLater = sheet.leadershipTests.some(entry => entry.warriorId === test.warriorId && entry.kind === 'stupidity' && !entry.relic && entry.at > test.at)
    const linked = test.turnKey ? next.stupidityResults.find(result => result.warriorId === test.warriorId && result.turnKey === test.turnKey && !result.failed) : undefined
    if (linked && !genuineLater) {
      next = { ...next, stupidityResults: next.stupidityResults.filter(result => result !== linked) }
      detail.push('The automatic Stupidity pass for that turn is removed; if the test is still due, roll it.')
    } else if (linked) {
      detail.push('A genuine Stupidity test has been recorded since, so that turn’s result is kept.')
    } else {
      detail.push('No linked Stupidity result was found for that declaration; any recorded result for that turn stands as it is.')
    }
  }
  return withRollAttempt(next, {
    id: `correct-leadership:${id}`, at: new Date().toISOString(), turn: sheet.turn, kind: 'attack', status: 'complete',
    label: test.relic ? 'Relic automatic pass corrected' : 'Tabletop Leadership test corrected',
    rolls: [`${detail.join(' ')} Other Leadership tests remain recorded; correct any tabletop consequences separately.`],
  })
}

/** Earlier name, kept for callers: the same correction, now covering relic Rout and Stupidity passes too. */
export const correctTableLeadershipTest = correctLeadershipDeclaration
