import { expect, it } from 'vitest'
import { battleLiveStateSchema, emptyBattleLiveState } from '../../../domain/battle'
import type { RosterWarband } from '../../../rules/types/roster'
import { canUseRoutRelic, passRoutWithRelic, recordLeadershipTest, passStupidityWithRelic, canUseRelic } from './relicRules'
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
