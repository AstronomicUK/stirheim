import { describe, expect, it } from 'vitest'
import { SCENARIO_AT_THE_TABLE } from '../shared/helpers'
import { customScenariosFor, fromDateTimeLocal, NO_SCENARIO, pickTitle, samePick, toDateTimeLocal, validateNewMatch, type NewMatchForm } from './helpers'

describe('datetime-local conversion', () => {
  it('round-trips through local time', () => {
    const local = '2026-09-04T19:30'
    const iso = fromDateTimeLocal(local)
    expect(iso).toBe(new Date(2026, 8, 4, 19, 30).toISOString())
    expect(toDateTimeLocal(iso)).toBe(local)
  })

  it('keeps seconds when the browser supplies them, and zero-pads', () => {
    expect(fromDateTimeLocal('2026-01-02T03:04:05')).toBe(new Date(2026, 0, 2, 3, 4, 5).toISOString())
    expect(toDateTimeLocal(new Date(2026, 0, 2, 3, 4).toISOString())).toBe('2026-01-02T03:04')
  })

  it('returns null / empty for blanks and malformed values', () => {
    expect(fromDateTimeLocal('')).toBeNull()
    expect(fromDateTimeLocal('   ')).toBeNull()
    expect(fromDateTimeLocal('tomorrow')).toBeNull()
    expect(fromDateTimeLocal('2026-13-01T10:00')).toBeNull()
    expect(fromDateTimeLocal('2026-02-30T10:00')).toBeNull()
    expect(fromDateTimeLocal('2026-02-10T25:00')).toBeNull()
    expect(toDateTimeLocal(null)).toBe('')
    expect(toDateTimeLocal('junk')).toBe('')
  })
})

describe('scenario picks', () => {
  const custom = [{ id: 'cs1', name: 'The Bell Tower' }]

  it('titles each kind of pick', () => {
    expect(pickTitle(NO_SCENARIO)).toBe(SCENARIO_AT_THE_TABLE)
    expect(pickTitle({ kind: 'builtin', id: 'occupy' })).toBe('Occupy')
    expect(pickTitle({ kind: 'builtin', id: 'made_up' })).toBe('made up')
    expect(pickTitle({ kind: 'custom', id: 'cs1' }, custom)).toBe('The Bell Tower')
    expect(pickTitle({ kind: 'custom', id: 'missing' }, custom)).toBe('Custom scenario')
  })

  it('compares picks', () => {
    expect(samePick(NO_SCENARIO, { kind: 'none' })).toBe(true)
    expect(samePick({ kind: 'builtin', id: 'a' }, { kind: 'builtin', id: 'a' })).toBe(true)
    expect(samePick({ kind: 'builtin', id: 'a' }, { kind: 'builtin', id: 'b' })).toBe(false)
    expect(samePick({ kind: 'builtin', id: 'a' }, { kind: 'custom', id: 'a' })).toBe(false)
  })

  it('keeps only shared scenarios and the ones written for this campaign', () => {
    const rows = [
      { id: '1', campaign_id: null },
      { id: '2', campaign_id: 'c1' },
      { id: '3', campaign_id: 'other' },
    ]
    expect(customScenariosFor(rows, 'c1').map((r) => r.id)).toEqual(['1', '2'])
  })
})

describe('validateNewMatch', () => {
  const base: NewMatchForm = { campaignId: 'c1', warbandIds: ['a', 'b'], scenario: NO_SCENARIO, scheduledLocal: '', notes: '  Friday at the club  ' }

  it('builds the API input for a GM booking', () => {
    const result = validateNewMatch({ ...base, scenario: { kind: 'builtin', id: 'skirmish' } }, { mode: 'gm', myWarbandIds: [] })
    expect(result).toEqual({
      ok: true,
      input: { campaignId: 'c1', warbandIds: ['a', 'b'], scenarioRulesId: 'skirmish', customScenarioId: null, scheduledFor: null, notes: 'Friday at the club' },
    })
  })

  it('passes a custom scenario and the converted date', () => {
    const result = validateNewMatch({ ...base, scenario: { kind: 'custom', id: 'cs1' }, scheduledLocal: '2026-09-05T19:00' }, { mode: 'gm', myWarbandIds: [] })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.input.customScenarioId).toBe('cs1')
      expect(result.input.scenarioRulesId).toBeNull()
      expect(result.input.scheduledFor).toBe(new Date(2026, 8, 5, 19, 0).toISOString())
    }
  })

  it('needs at least two distinct warbands', () => {
    expect(validateNewMatch({ ...base, warbandIds: ['a'] }, { mode: 'gm', myWarbandIds: [] })).toEqual({ ok: false, error: 'Pick at least two warbands.' })
    expect(validateNewMatch({ ...base, warbandIds: ['a', 'a'] }, { mode: 'gm', myWarbandIds: [] })).toEqual({ ok: false, error: 'Pick at least two warbands.' })
  })

  it('makes a challenge include exactly one of the challenger\'s warbands', () => {
    expect(validateNewMatch({ ...base, warbandIds: ['a', 'b'] }, { mode: 'challenge', myWarbandIds: [] })).toEqual({
      ok: false,
      error: 'A challenge includes exactly one of your own warbands.',
    })
    expect(validateNewMatch({ ...base, warbandIds: ['a', 'b', 'c'] }, { mode: 'challenge', myWarbandIds: ['a', 'b'] })).toEqual({
      ok: false,
      error: 'A challenge includes exactly one of your own warbands.',
    })
    expect(validateNewMatch({ ...base, warbandIds: ['a'] }, { mode: 'challenge', myWarbandIds: ['a'] })).toEqual({ ok: false, error: 'Pick at least one opponent.' })
    const ok = validateNewMatch({ ...base, warbandIds: ['a', 'b'] }, { mode: 'challenge', myWarbandIds: ['a'] })
    expect(ok.ok).toBe(true)
  })

  it('refuses a date it cannot read instead of silently dropping it', () => {
    expect(validateNewMatch({ ...base, scheduledLocal: 'soon' }, { mode: 'gm', myWarbandIds: [] })).toEqual({ ok: false, error: 'That date and time could not be read.' })
  })
})
