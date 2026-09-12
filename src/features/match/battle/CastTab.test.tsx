import { expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import { CastTab } from './CastTab'
import { emptyBattleLiveState, castsThisTurn, parseBattleLiveState } from '../../../domain'
const fixture = vi.hoisted(() => ({ spell: { id: 'automatic', name: 'Test spell', difficulty: null, text: '' }, caster: { heroId: 'wizard', name: 'Wizard', spells: [] as unknown[], rerolls: [], modifiers: [], reminders: [], blocks: [], lore: { name: 'Test lore' }, secondSpell: false } }))
vi.mock('react', async original => ({ ...await original<typeof import('react')>(), useMemo: (fn: () => unknown) => fn(), useRef: (current: unknown) => ({ current }), useState: (value: unknown) => [value, vi.fn()] }))
vi.mock('./casters', () => ({ castersOf: () => [{ ...fixture.caster, spells: [{ spell: fixture.spell, difficulty: null }] }] }))
vi.mock('../fight/useEnemyRosters', () => ({ useEnemyRosters: () => ({ warbands: [] }) }))
vi.mock('../../../rules/resolve/casting', async original => ({ ...await original<typeof import('../../../rules/resolve/casting')>(), profileForSpell: () => fixture.caster, startCast: () => ({ profile: fixture.caster, spell: fixture.spell, done: true, outcome: 'automatic', log: [{ text: 'Automatically cast.' }], used: [], difficulty: null }) }))
vi.mock('../../../api/battleTurns',()=>({useBattleTurns:()=>({data:null})}))
vi.mock('../../../api/battleDispels',()=>({useBattleDispels:()=>({data:[]})}))
vi.mock('@tanstack/react-query',()=>({useQueryClient:()=>({invalidateQueries:vi.fn()})}))
type Node = ReactElement<Record<string, any>>
function nodes(value: any): Node[] { if (Array.isArray(value)) return value.flatMap(nodes); if (!value || typeof value !== 'object' || !value.props) return []; return [value, ...nodes(value.props.children)] }
it('records the displayed shared round instead of the stale stored sheet turn, including after reload', () => {
  let stored = emptyBattleLiveState()
  const callbacks: ((s: typeof stored) => typeof stored)[] = []
  const tree = CastTab({ matchId: 'test', roster: { heroes: [], hiredSwords: [], henchmenGroups: [], name: 'Test' } as any, template: undefined, others: [], sheet: { ...stored, turn: 2 }, readOnly: false, edit: fn => callbacks.push(fn) })
  const button = nodes(tree).find(n => n.props.onClick && nodes(n).some(child => child.props.children === 'Cast'))
  expect(button).toBeDefined()
  button!.props.onClick()
  callbacks.forEach(fn => { stored = fn(stored) })
  const restored = parseBattleLiveState(JSON.parse(JSON.stringify(stored)))
  expect(restored.casts[0].turn).toBe(2)
  expect(restored.rollAttempts[0].turn).toBe(2)
  expect(castsThisTurn(restored, 'wizard', 2)).toHaveLength(1)
  expect(castsThisTurn(restored, 'wizard', 3)).toHaveLength(0)
})

it('blocks casting after a stored Stupidity failure without recording a spell attempt', async () => {
  const { recordStupidityResult } = await import('../../../domain')
  const stored = recordStupidityResult(emptyBattleLiveState(), 'wizard', 'legacy:1', 'Wizard', true)
  const edit = vi.fn()
  const roster = { id: 'w', warbandTemplateId: 'mercenaries_reikland', name: 'Test', heroes: [{ id: 'wizard', name: 'Wizard', unitTemplateId: 'mercenaries_reikland_captain', stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }, status: 'active', flags: { stupidity: true }, injuries: [], skillIds: [], spellIds: ['fires_of_uzhul'], skillTableIds: [], equipment: [] }], hiredSwords: [], henchmenGroups: [], stash: [] } as any
  const tree = CastTab({ matchId: 'test', roster, template: undefined, others: [], sheet: stored, readOnly: false, edit })
  const button = nodes(tree).find(n => n.props.onClick && nodes(n).some(child => child.props.children === 'Cast'))
  expect(button!.props.disabled).toBe(true)
  button!.props.onClick()
  expect(edit).not.toHaveBeenCalled()
  expect(stored.casts).toEqual([])
})

it('blocks a burning caster, and restores casting when extinguished or the ignition is reverted', () => {
  const edit = vi.fn()
  const roster = { id: 'w', heroes: [], hiredSwords: [], henchmenGroups: [], name: 'Test' } as any
  const event = { id: 'fire', reverted_at: null, payload: { targetOnFire: true, target_warband_id: 'w', target_id: 'wizard', target_size: 1, out_of_action: false } } as any
  const sheet = emptyBattleLiveState()
  const castButton = (state = sheet, events = [event]) => nodes(CastTab({ matchId: 'test', roster, template: undefined, others: [], sheet: state, events, readOnly: false, edit })).find(n => n.props.onClick && nodes(n).some(child => child.props.children === 'Cast'))!
  const blocked = castButton()
  expect(blocked.props.disabled).toBe(true)
  blocked.props.onClick()
  expect(edit).not.toHaveBeenCalled()
  const extinguished = { ...sheet, fireRecoveryTests: [{ id: 'test', warriorId: 'wizard', actorId: 'helper', actorName: 'Helper', turnKey: 'legacy:1', eventIds: ['fire'], die: 4, confirmed: true }] }
  expect(castButton(extinguished).props.disabled).toBeFalsy()
  expect(castButton(sheet, [{ ...event, reverted_at: 'now' }]).props.disabled).toBeFalsy()
})
