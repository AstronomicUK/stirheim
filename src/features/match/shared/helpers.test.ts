import { describe, expect, it } from 'vitest'
import type { MatchParticipantView, MatchSummary } from '../../../api/matches'
import {
  allAccepted,
  formatMatchTime,
  groupMatches,
  matchActions,
  matchGroupKey,
  matchWhen,
  pendingLabel,
  SCENARIO_AT_THE_TABLE,
  scenarioLink,
  scenarioTitle,
  versusLabel,
} from './helpers'

const GM = 'gm-user'
const ANA = 'ana-user'
const TOM = 'tom-user'

function participant(partial: Partial<MatchParticipantView>): MatchParticipantView {
  return {
    warband_id: 'wb',
    warband_name: 'Warband',
    type_name: 'Mercenaries',
    owner_id: ANA,
    owner_display_name: 'Ana',
    rating: 100,
    accepted_at: '2026-09-04T10:00:00.000Z',
    mine: false,
    ...partial,
  }
}

const WATCH = participant({ warband_id: 'watch', warband_name: 'Reikland Watch', owner_id: TOM, owner_display_name: 'Tom' })
const ESHIN = participant({ warband_id: 'eshin', warband_name: 'Claws of Eshin', type_name: 'Skaven' })

let n = 0
function match(partial: Partial<MatchSummary>): MatchSummary {
  n += 1
  return {
    id: `m${n}`,
    campaign_id: 'c1',
    state: 'scheduled',
    created_via: 'challenge',
    combat_mode: 'app',
    created_by: ANA,
    created_by_display_name: 'Ana',
    scenario_rules_id: null,
    custom_scenario_id: null,
    custom_scenario_name: null,
    scheduled_for: null,
    started_at: null,
    completed_at: null,
    notes: '',
    created_at: `2026-09-0${(n % 9) + 1}T09:00:00.000Z`,
    updated_at: '2026-09-04T09:00:00.000Z',
    participants: [WATCH, ESHIN],
    reported_warband_ids: [],
    ...partial,
  }
}

describe('grouping', () => {
  it('maps every state onto a dashboard bucket', () => {
    expect(matchGroupKey('in_progress')).toBe('now_playing')
    expect(matchGroupKey('awaiting_reports')).toBe('awaiting_reports')
    expect(matchGroupKey('scheduled')).toBe('scheduled')
    expect(matchGroupKey('completed')).toBe('finished')
    expect(matchGroupKey('cancelled')).toBe('finished')
  })

  it('puts dated scheduled games soonest first and undated ones after, newest booking first', () => {
    const late = match({ scheduled_for: '2026-09-20T19:00:00.000Z', created_at: '2026-09-01T00:00:00.000Z' })
    const soon = match({ scheduled_for: '2026-09-06T19:00:00.000Z', created_at: '2026-09-01T00:00:00.000Z' })
    const undatedOld = match({ created_at: '2026-08-01T00:00:00.000Z' })
    const undatedNew = match({ created_at: '2026-09-03T00:00:00.000Z' })
    const groups = groupMatches([undatedOld, late, undatedNew, soon])
    expect(groups.scheduled.map((m) => m.id)).toEqual([soon.id, late.id, undatedNew.id, undatedOld.id])
    expect(groups.now_playing).toEqual([])
  })

  it('orders finished and live games most recent first', () => {
    const a = match({ state: 'completed', completed_at: '2026-09-01T12:00:00.000Z' })
    const b = match({ state: 'cancelled', completed_at: '2026-09-03T12:00:00.000Z' })
    const live1 = match({ state: 'in_progress', started_at: '2026-09-04T10:00:00.000Z' })
    const live2 = match({ state: 'in_progress', started_at: '2026-09-04T11:00:00.000Z' })
    const groups = groupMatches([a, live1, b, live2])
    expect(groups.finished.map((m) => m.id)).toEqual([b.id, a.id])
    expect(groups.now_playing.map((m) => m.id)).toEqual([live2.id, live1.id])
  })

  it('picks the time that matters for the state', () => {
    expect(matchWhen(match({ state: 'scheduled', scheduled_for: 'S' }))).toBe('S')
    expect(matchWhen(match({ state: 'scheduled' }))).toBeNull()
    expect(matchWhen(match({ state: 'in_progress', scheduled_for: 'S', started_at: 'B' }))).toBe('B')
    expect(matchWhen(match({ state: 'awaiting_reports', scheduled_for: 'S' }))).toBe('S')
    expect(matchWhen(match({ state: 'completed', started_at: 'B', completed_at: 'E' }))).toBe('E')
    expect(matchWhen(match({ state: 'cancelled', scheduled_for: 'S' }))).toBe('S')
  })
})

describe('labels', () => {
  it('joins participants with vs', () => {
    expect(versusLabel([WATCH, ESHIN])).toBe('Reikland Watch vs Claws of Eshin')
    expect(versusLabel([WATCH, ESHIN, participant({ warband_name: 'Grave Robbers' })])).toBe('Reikland Watch vs Claws of Eshin vs Grave Robbers')
    expect(versusLabel([])).toBe('No warbands')
  })

  it('resolves built-in, custom and unset scenarios', () => {
    expect(scenarioTitle(match({ scenario_rules_id: 'wyrdstone_hunt' }))).toBe('Wyrdstone Hunt')
    expect(scenarioTitle(match({ scenario_rules_id: 'not_a_real_one' }))).toBe('not a real one')
    expect(scenarioTitle(match({ custom_scenario_id: 'cs1', custom_scenario_name: 'The Bell Tower' }))).toBe('The Bell Tower')
    expect(scenarioTitle(match({ custom_scenario_id: 'cs1' }))).toBe('Custom scenario')
    expect(scenarioTitle(match({}))).toBe(SCENARIO_AT_THE_TABLE)
  })

  it('links to the scenario page that has the text', () => {
    expect(scenarioLink(match({ scenario_rules_id: 'skirmish' }))).toBe('/scenarios/builtin/skirmish')
    expect(scenarioLink(match({ custom_scenario_id: 'cs1' }))).toBe('/scenarios/custom/cs1')
    expect(scenarioLink(match({}))).toBeNull()
  })

  it('formats times and shrugs at junk', () => {
    expect(formatMatchTime(null)).toBe('')
    expect(formatMatchTime('nope')).toBe('')
    expect(formatMatchTime('2026-09-04T18:30:00.000Z')).toMatch(/Sep/)
  })

  it('counts outstanding replies', () => {
    expect(pendingLabel([WATCH, ESHIN])).toBeNull()
    expect(pendingLabel([WATCH, participant({ accepted_at: null })])).toBe('Awaiting 1 reply')
    expect(pendingLabel([participant({ accepted_at: null }), participant({ accepted_at: null })])).toBe('Awaiting 2 replies')
    expect(allAccepted([WATCH, ESHIN])).toBe(true)
    expect(allAccepted([WATCH, participant({ accepted_at: null })])).toBe(false)
  })
})

describe('matchActions', () => {
  const invited = participant({ warband_id: 'eshin', warband_name: 'Claws of Eshin', accepted_at: null, mine: true })
  const challenger = participant({ warband_id: 'watch', owner_id: TOM, mine: false })

  it('offers Accept / Decline for my unanswered warbands only while scheduled', () => {
    const m = match({ participants: [challenger, invited], created_by: TOM })
    expect(matchActions(m, ANA, GM).respondFor).toEqual(['eshin'])
    expect(matchActions({ ...m, state: 'in_progress' }, ANA, GM).respondFor).toEqual([])
    expect(matchActions(m, TOM, GM).respondFor).toEqual([])
  })

  it('shows Start to participants and the GM, enabled only once everyone has accepted', () => {
    const pending = match({ participants: [challenger, invited], created_by: TOM })
    const asInvited = matchActions(pending, ANA, GM)
    expect(asInvited.showStart).toBe(true)
    expect(asInvited.canStart).toBe(false)
    expect(asInvited.startBlocked).toBe('1 warband has not accepted yet.')

    const accepted = { ...pending, participants: [challenger, { ...invited, accepted_at: 'now' }] }
    expect(matchActions(accepted, ANA, GM).canStart).toBe(true)
    expect(matchActions(accepted, GM, GM).canStart).toBe(true)
    // An onlooker in the campaign gets no Start at all.
    expect(matchActions(accepted, 'someone-else', GM).showStart).toBe(false)
  })

  it('refuses to start with fewer than two warbands', () => {
    const solo = match({ participants: [participant({ owner_id: ANA })] })
    const a = matchActions(solo, ANA, GM)
    expect(a.showStart).toBe(true)
    expect(a.canStart).toBe(false)
    expect(a.startBlocked).toBe('A battle needs at least two warbands.')
  })

  it('lets the GM cancel until completion and the creator only while scheduled', () => {
    const m = match({ created_by: ANA, participants: [challenger, invited] })
    expect(matchActions(m, GM, GM).canCancel).toBe(true)
    expect(matchActions(m, ANA, GM).canCancel).toBe(true)
    expect(matchActions(m, TOM, GM).canCancel).toBe(false)
    expect(matchActions({ ...m, state: 'in_progress' }, ANA, GM).canCancel).toBe(false)
    expect(matchActions({ ...m, state: 'in_progress' }, GM, GM).canCancel).toBe(true)
    expect(matchActions({ ...m, state: 'completed' }, GM, GM).canCancel).toBe(false)
    expect(matchActions({ ...m, state: 'cancelled' }, GM, GM).canCancel).toBe(false)
  })

  it('opens the sheet and ends the battle only while in progress', () => {
    const live = match({ state: 'in_progress', participants: [challenger, { ...invited, accepted_at: 'now' }] })
    const mine = matchActions(live, ANA, GM)
    expect(mine.canOpenSheet).toBe(true)
    expect(mine.canEnd).toBe(true)
    const gm = matchActions(live, GM, GM)
    expect(gm.canOpenSheet).toBe(false)
    expect(gm.canEnd).toBe(true)
    expect(matchActions({ ...live, state: 'awaiting_reports' }, ANA, GM).canEnd).toBe(false)
    expect(matchActions({ ...live, state: 'awaiting_reports' }, ANA, GM).canOpenSheet).toBe(false)
  })

  it('offers nothing to someone outside the match', () => {
    const m = match({ participants: [challenger, invited], created_by: TOM })
    expect(matchActions(m, undefined, GM)).toEqual({
      respondFor: [],
      showStart: false,
      canStart: false,
      startBlocked: null,
      canEnd: false,
      canCancel: false,
      canOpenSheet: false,
    })
  })
})
