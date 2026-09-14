import { beforeEach, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import { TestSheet } from './StupidityTests'
import { emptyBattleLiveState, parseBattleLiveState, type BattleLiveState } from '../../../domain'
import type { Combatant } from '../fight/combatants'
import type { RosterWarband } from '../../../rules/types/roster'
const hooks = vi.hoisted(() => ({ values: [] as unknown[], index: 0 }))
vi.mock('react', async original => ({ ...await original<typeof import('react')>(), useState: (initial: unknown) => {
  const index = hooks.index++
  if (!(index in hooks.values)) hooks.values[index] = typeof initial === 'function' ? initial() : initial
  return [hooks.values[index], (value: unknown) => { hooks.values[index] = value }]
} }))
type Node = ReactElement<Record<string, any>>
function nodes(value: any): Node[] { if (Array.isArray(value)) return value.flatMap(nodes); if (!value || typeof value !== 'object' || !value.props) return []; return [value, ...nodes(value.props.children), ...nodes(value.props.footer)] }
const warrior = { id: 'hero', name: 'Warrior', stats: { Ld: 7 }, equipment: [{ itemId: 'sashimono', quantity: 1 }] } as Combatant
const roster = { id: 'w', heroes: [], hiredSwords: [], henchmenGroups: [] } as unknown as RosterWarband
let state: BattleLiveState
function render(subject = warrior, testRoster = roster) { hooks.index = 0; return nodes(TestSheet({ roster:testRoster, sheet: state, warrior: subject, correction: false, turn: 1, turnKey: 'w:1', edit: fn => { state = fn(state) }, close: vi.fn() })) }
function button(label: string) { const found = render().find(n => n.props.children === label && n.props.onClick); expect(found).toBeDefined(); return found! }
function field(label: string) { return render().find(n => n.props.label === label)! }
beforeEach(() => { hooks.values = []; hooks.index = 0; state = emptyBattleLiveState(); vi.restoreAllMocks() })
it('resumes the first app roll and a pending second roll, then records both with edits in one entry', () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.99)
  button('Roll 2D6').props.onClick()
  expect(state.rollAttempts[0].stupidity?.originalDice).toEqual([6, 6])
  state = parseBattleLiveState(JSON.parse(JSON.stringify(state))); hooks.values = []
  expect(button('Roll 2D6').props.disabled).toBe(true)
  button('Use Sashimono reroll').props.onClick()
  state = parseBattleLiveState(JSON.parse(JSON.stringify(state))); hooks.values = []
  expect(render().some(n => n.props.children === 'Use Sashimono reroll')).toBe(false)
  expect(button('Roll 2D6').props.disabled).toBe(false)
  vi.spyOn(Math, 'random').mockReturnValue(0)
  button('Roll 2D6').props.onClick()
  field('Second D6').props.onChange(2)
  expect(button('Record test').props.disabled).toBe(false)
  button('Record test').props.onClick()
  expect(state.stupidityResults[0].failed).toBe(false)
  expect(state.rollAttempts).toHaveLength(1)
  expect(state.rollAttempts[0].status).toBe('complete')
  expect(state.rollAttempts[0].rolls.join(' ')).toContain('app rolled 6 + 6')
  expect(state.rollAttempts[0].rolls.join(' ')).toContain('App rolled 1 + 1; player changed the dice to 1 + 2')
})
it('does not offer the item reroll without a physical Sashimono', () => {
  field('First D6').props.onChange(6); field('Second D6').props.onChange(6)
  expect(state.leadershipTests).toHaveLength(1)
  expect(state.leadershipTests[0].warriorId).toBe('hero')
  expect(render({ ...warrior, equipment: [] }).some(n => n.props.children === 'Use Sashimono reroll')).toBe(false)
})
it('retains the failed second roll and requires movement outside combat', () => {
  field('First D6').props.onChange(1); field('Second D6').props.onChange(1)
  button('Use Sashimono reroll').props.onClick()
  field('First D6').props.onChange(6); field('Second D6').props.onChange(6)
  expect(button('Record test').props.disabled).toBe(true)
  field('In hand-to-hand combat?').props.onChange({ target: { value: 'no' } })
  field('Stupidity movement D6').props.onChange(4)
  button('Record test').props.onClick()
  expect(state.stupidityResults[0].failed).toBe(true)
  expect(state.rollAttempts[0].rolls.join(' ')).toContain('second result stands')
  expect(state.rollAttempts[0].rolls.join(' ')).toContain('Stand inactive')
})

it('offers the Standard only for a failed test after range confirmation and preserves its source', () => {
  const subject = {...warrior,equipment:[]} as Combatant
  const shadow = {...roster,warbandTemplateId:'shadow_warriors',heroes:[{...subject,status:'active'},{id:'standard',name:'Bearer',status:'active',equipment:[{itemId:'standard_of_nagarythe',quantity:1}]}]} as unknown as RosterWarband
  const draw=()=>render(subject,shadow)
  const action=(label:string)=>draw().find(n=>n.props.children===label&&n.props.onClick)
  const input=(label:string)=>draw().find(n=>n.props.label===label)!
  input('First D6').props.onChange(6);input('Second D6').props.onChange(6)
  expect(action('Use Standard of Nagarythe (within 12 inches of Bearer) reroll')).toBeUndefined()
  draw().find(n=>n.props.type==='checkbox'&&n.props.checked===false)!.props.onChange({target:{checked:true}})
  action('Use Standard of Nagarythe (within 12 inches of Bearer) reroll')!.props.onClick()
  expect(state.rollAttempts[0].stupidity?.rerolledFrom?.reason).toContain('Standard of Nagarythe')
  expect(action('Use Standard of Nagarythe (within 12 inches of Bearer) reroll')).toBeUndefined()
})
