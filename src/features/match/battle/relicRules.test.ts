import { expect, it } from 'vitest'
import { battleLiveStateSchema, emptyBattleLiveState } from '../../../domain/battle'
import type { RosterWarband } from '../../../rules/types/roster'
import { canUseRoutRelic, passRoutWithRelic, recordLeadershipTest, passStupidityWithRelic, canUseRelic, passTableWithRelic, correctTableLeadershipTest, correctLeadershipDeclaration, correctableDeclarations, describeDeclaration } from './relicRules'
const chosen = { id: 'leader', label: 'Captain (Ld 8)', ld: 8, leader: true, standing: true, mayLead: true }
const roster: RosterWarband = { id: 'w', name: 'Watch', warbandTemplateId: 'mercenaries_reikland', gold: 0, wyrdstone: 0, veteranPool: null, stash: [], hiredSwords: [], henchmenGroups: [], heroes: [{ id: 'leader', name: 'Captain', unitTemplateId: 'mercenaries_reikland_captain', stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 }, xp: 20, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, status: 'active', equipment: [{ itemId: 'holy_unholy_relic', quantity: 2 }] }] }
it('requires first-test confirmation and records an automatic pass without consuming the relic', () => {
 const state = emptyBattleLiveState()
 expect(passRoutWithRelic(roster, state, chosen, false)).toBe(state)
 const passed = passRoutWithRelic(roster, state, chosen, true)
 expect(passed.leadershipTests).toHaveLength(1)
 expect(passed.notes).toContain('no dice rolled')
 expect(roster.heroes[0].equipment[0].quantity).toBe(2)
 expect(passRoutWithRelic(roster, passed, chosen, true)).toBe(passed)
 expect(canUseRoutRelic(roster, battleLiveStateSchema.parse(JSON.parse(JSON.stringify(passed))), chosen)).toBe(false)
})
it('prior tabletop or rolled Leadership tests block the benefit, even with multiple relics', () => {
 for (const kind of ['table','rout'] as const) expect(canUseRoutRelic(roster, recordLeadershipTest(emptyBattleLiveState(), chosen.id, kind), chosen)).toBe(false)
})
it('requires a standing leader carrying a real copy', () => {
 expect(canUseRoutRelic(roster, emptyBattleLiveState(), { ...chosen, leader: false })).toBe(false)
 expect(canUseRoutRelic(roster, emptyBattleLiveState(), { ...chosen, standing: false })).toBe(false)
 expect(canUseRoutRelic({ ...roster, heroes: [{ ...roster.heroes[0], equipment: [] }] }, emptyBattleLiveState(), chosen)).toBe(false)
})
it('loads older battle state safely and respects historic rout notes', () => {
 expect(battleLiveStateSchema.parse({}).leadershipTests).toEqual([])
 expect(canUseRoutRelic(roster, { ...emptyBattleLiveState(), notes: 'Rout check passed at the table' }, chosen)).toBe(false)
})

it('a Stupidity auto-pass consumes the same first-test benefit as Rout', () => {
 const state = emptyBattleLiveState()
 const passed = passStupidityWithRelic(roster, state, chosen.id, 'Captain', 'w:1', true)
 expect(passed.stupidityResults).toEqual([{ warriorId: chosen.id, turnKey: 'w:1', failed: false }])
 expect(passed.rollAttempts[0].rolls.join(' ')).toContain('no dice rolled')
 expect(canUseRoutRelic(roster, passed, chosen)).toBe(false)
 expect(passStupidityWithRelic(roster, passed, chosen.id, 'Captain', 'w:2', true)).toBe(passed)
 const restored = battleLiveStateSchema.parse(JSON.parse(JSON.stringify(passed)))
 expect(canUseRelic(roster, restored, chosen.id)).toBe(false)
})
it('a Rout auto-pass prevents a later Stupidity auto-pass', () => {
 const passed = passRoutWithRelic(roster, emptyBattleLiveState(), chosen, true)
 expect(passStupidityWithRelic(roster, passed, chosen.id, 'Captain', 'w:2', true)).toBe(passed)
})


it.each(['Fear', 'All Alone'])('a tabletop %s auto-pass spends the shared first-test benefit', test => {
 const initial = emptyBattleLiveState()
 expect(passTableWithRelic(roster, initial, chosen.id, 'Captain', test, false)).toBe(initial)
 const passed = passTableWithRelic(roster, initial, chosen.id, 'Captain', test, true)
 expect(passed.rollAttempts[0].label).toContain(test)
 expect(passed.rollAttempts[0].rolls[0]).toContain('no dice rolled')
 expect(canUseRoutRelic(roster, battleLiveStateSchema.parse(JSON.parse(JSON.stringify(passed))), chosen)).toBe(false)
 expect(passStupidityWithRelic(roster, passed, chosen.id, 'Captain', 'w:1', true)).toBe(passed)
})


it('an explained tabletop correction restores only that declaration, preserving other first-test history', () => {
 const passed = passTableWithRelic(roster, emptyBattleLiveState(), chosen.id, 'Captain', 'Fear', true)
 const id = passed.leadershipTests[0].id!
 expect(correctTableLeadershipTest(passed, id, '')).toBe(passed)
 const corrected = battleLiveStateSchema.parse(JSON.parse(JSON.stringify(correctTableLeadershipTest(passed, id, 'Wrong warrior selected'))))
 expect(canUseRelic(roster, corrected, chosen.id)).toBe(true)
 expect(corrected.rollAttempts.at(-1)?.rolls[0]).toContain('Wrong warrior selected')
 expect(canUseRelic(roster, recordLeadershipTest(corrected, chosen.id, 'rout'), chosen.id)).toBe(false)
})

it('an explained correction of a relic Rout pass withdraws the note and offers the relic for the rout check again', () => {
 const before = { ...emptyBattleLiveState(), notes: 'Scenario: Skirmish' }
 const passed = passRoutWithRelic(roster, before, chosen, true)
 expect(canUseRoutRelic(roster, passed, chosen)).toBe(false)
 const id = passed.leadershipTests[0].id!
 expect(correctableDeclarations(passed, chosen.id).map(describeDeclaration)).toEqual(['relic automatic pass (Rout check)'])
 expect(correctLeadershipDeclaration(passed, id, '   ')).toBe(passed)
 const corrected = battleLiveStateSchema.parse(JSON.parse(JSON.stringify(correctLeadershipDeclaration(passed, id, 'Wrong bearer: the Captain had already tested for Fear'))))
 expect(canUseRoutRelic(roster, corrected, chosen)).toBe(true)
 expect(corrected.notes).toContain('Scenario: Skirmish')
 expect(corrected.notes).not.toMatch(/Rout check passed/)
 expect(corrected.notes).toContain('Rout relic declaration withdrawn: Wrong bearer')
 expect(corrected.leadershipTests).toHaveLength(1)
 expect(corrected.leadershipTests[0].correction).toBe('Wrong bearer: the Captain had already tested for Fear')
 expect(corrected.rollAttempts.at(-1)?.label).toBe('Relic automatic pass corrected')
 expect(corrected.rollAttempts.at(-1)?.rolls[0]).toContain('Wrong bearer')
 expect(correctableDeclarations(corrected, chosen.id)).toEqual([])
 // A second correction of the same declaration is a no-op.
 expect(correctLeadershipDeclaration(corrected, id, 'again')).toBe(corrected)
})

it('a hand-edited Rout note keeps the historic guard and says so', () => {
 const passed = passRoutWithRelic(roster, emptyBattleLiveState(), chosen, true)
 const edited = { ...passed, notes: passed.notes.replace('Rout check passed automatically:', 'Rout check passed automatically —') }
 const corrected = correctLeadershipDeclaration(edited, passed.leadershipTests[0].id!, 'Mis-tap')
 expect(corrected.leadershipTests[0].correction).toBe('Mis-tap')
 expect(canUseRelic(roster, corrected, chosen.id)).toBe(true)
 expect(canUseRoutRelic(roster, corrected, chosen)).toBe(false)
 expect(corrected.rollAttempts.at(-1)?.rolls[0]).toContain('not found as written')
})

it('an explained correction of a relic Stupidity pass removes only the result it wrote', () => {
 const other = { warriorId: 'someone-else', turnKey: 'w:1', failed: true }
 const before = { ...emptyBattleLiveState(), stupidityResults: [other] }
 const passed = passStupidityWithRelic(roster, before, chosen.id, 'Captain', 'w:1', true)
 const id = passed.leadershipTests[0].id!
 const corrected = correctLeadershipDeclaration(passed, id, 'Not his first test: he tested for Fear at the table')
 expect(corrected.stupidityResults).toEqual([other])
 expect(canUseRelic(roster, corrected, chosen.id)).toBe(true)
 expect(corrected.rollAttempts.map(a => a.label)).toEqual(['Captain: Stupidity passed with Holy (Unholy) Relic', 'Relic automatic pass corrected'])
 expect(corrected.rollAttempts.at(-1)?.rolls[0]).toContain('removed')
 // The relic pass is then available again for a later genuine first test.
 expect(passStupidityWithRelic(roster, corrected, chosen.id, 'Captain', 'w:2', true).stupidityResults).toHaveLength(2)
})

it('a relic Stupidity correction keeps a genuine test recorded since', () => {
 const passed = passStupidityWithRelic(roster, emptyBattleLiveState(), chosen.id, 'Captain', 'w:1', true)
 const id = passed.leadershipTests[0].id!
 // A real roll later the same turn replaced the result and recorded its own test.
 const rolled = { ...passed, stupidityResults: [{ warriorId: chosen.id, turnKey: 'w:1', failed: true }], leadershipTests: [...passed.leadershipTests, { warriorId: chosen.id, kind: 'stupidity' as const, relic: false, at: new Date(Date.now() + 1000).toISOString() }] }
 const corrected = correctLeadershipDeclaration(rolled, id, 'Declared for the wrong warrior')
 expect(corrected.stupidityResults).toEqual(rolled.stupidityResults)
 expect(corrected.leadershipTests[0].correction).toBe('Declared for the wrong warrior')
 expect(canUseRelic(roster, corrected, chosen.id)).toBe(false) // the genuine test still spends the benefit
})

it('rolled Rout and Stupidity tests are not declarations and cannot be corrected here', () => {
 const rolled = recordLeadershipTest(emptyBattleLiveState(), chosen.id, 'rout')
 expect(correctableDeclarations(rolled, chosen.id)).toEqual([])
 expect(correctLeadershipDeclaration(rolled, rolled.leadershipTests[0].id!, 'oops')).toBe(rolled)
 const legacy = { ...emptyBattleLiveState(), leadershipTests: [{ warriorId: chosen.id, kind: 'stupidity' as const, relic: false, at: new Date().toISOString() }] }
 expect(correctableDeclarations(legacy, chosen.id)).toEqual([])
})

it('the relic Stupidity declaration remembers its turn across a reload', () => {
 const passed = passStupidityWithRelic(roster, emptyBattleLiveState(), chosen.id, 'Captain', 'w:3', true)
 const restored = battleLiveStateSchema.parse(JSON.parse(JSON.stringify(passed)))
 const corrected = correctLeadershipDeclaration(restored, restored.leadershipTests[0].id!, 'Mis-tap')
 expect(corrected.stupidityResults).toEqual([])
 expect(canUseRelic(roster, corrected, chosen.id)).toBe(true)
})
