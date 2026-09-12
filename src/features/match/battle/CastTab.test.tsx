import { expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'
import { CastTab } from './CastTab'
import { emptyBattleLiveState, castsThisTurn, parseBattleLiveState } from '../../../domain'
const fixture = vi.hoisted(() => ({ spell: { id: 'automatic', name: 'Test spell', difficulty: null, text: '' } as { id: string; name: string; difficulty: number | null; text: string; target?: string; targetNote?: string }, caster: { heroId: 'wizard', name: 'Wizard', spells: [] as unknown[], rerolls: [], modifiers: [], reminders: [], blocks: [], lore: { name: 'Test lore' }, secondSpell: false }, enemies: { warbands: [] as unknown[] } }))
vi.mock('react', async original => ({ ...await original<typeof import('react')>(), useMemo: (fn: () => unknown) => fn(), useRef: (current: unknown) => ({ current }), useState: (value: unknown) => [value, vi.fn()] }))
vi.mock('./casters', () => ({ castersOf: () => [{ ...fixture.caster, spells: [{ spell: fixture.spell, difficulty: null }] }] }))
vi.mock('../fight/useEnemyRosters', () => ({ useEnemyRosters: () => fixture.enemies }))
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

// #32/#76: the Target box follows the chosen spell's target kind. State hooks are mocked to their
// initial values here, so these check what is OFFERED (headings, hint, whether Cast waits for a
// pick), not the picked-target rendering — that path is exercised live.
const heroRow = (id: string, name: string) => ({ id, name, unitTemplateId: 'mercenaries_reikland_captain', stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }, status: 'active', flags: {}, injuries: [], skillIds: [], spellIds: [], skillTableIds: [], equipment: [] })
const friendlyRoster = { id: 'w', warbandTemplateId: 'mercenaries_reikland', name: 'Ours', heroes: [heroRow('wizard', 'Wizard'), heroRow('ally', 'Ally')], hiredSwords: [], henchmenGroups: [], stash: [] } as any
const enemyRoster = { id: 'e', warbandTemplateId: 'mercenaries_reikland', name: 'Foes', heroes: [heroRow('foe', 'Foe')], hiredSwords: [], henchmenGroups: [], stash: [] } as any
function targetBox(target: string | undefined, note?: string) {
  fixture.spell.target = target
  fixture.spell.targetNote = note
  fixture.enemies.warbands = [{ participant: { warband_id: 'e', warband_name: 'Foes' }, roster: enemyRoster, template: undefined, items: [] }]
  const tree = CastTab({ matchId: 'test', roster: friendlyRoster, template: undefined, others: [{ warband_id: 'e', warband_name: 'Foes' } as any], sheet: emptyBattleLiveState(), readOnly: false, edit: vi.fn() })
  const all = nodes(tree)
  const box = all.find(n => n.props.title === 'Target')!
  const inBox = nodes(box)
  const cast = all.find(n => n.props.onClick && nodes(n).some(child => child.props.children === 'Cast'))!
  const text = inBox.flatMap(n => (typeof n.props.children === 'string' ? [n.props.children] : Array.isArray(n.props.children) ? n.props.children.filter((c: unknown) => typeof c === 'string') : [])).join(' ')
  return { tone: box.props.tone, groups: inBox.filter(n => n.type === 'optgroup').map(n => n.props.label), options: inBox.filter(n => n.type === 'option').map(n => nodes(n).length ? n.props.children : n.props.children).flat().filter((c: unknown) => typeof c === 'string'), castDisabled: Boolean(cast.props.disabled), text: text.replace(/\s+/g, ' '), hasSelect: inBox.some(n => n.type === 'optgroup' || n.type === 'option') }
}

it('an enemy spell offers only the enemy warband, in red, and waits for a pick', () => {
  const box = targetBox('enemy', 'Must be the closest enemy model.')
  expect(box.tone).toBe('accent')
  expect(box.groups).toEqual(['Enemy — Foes'])
  expect(box.castDisabled).toBe(true)
  expect(box.text).toContain('Must be the closest enemy model.')
})

it('an either spell offers both sides under headings, enemy first, and waits for a pick', () => {
  const box = targetBox('either')
  expect(box.groups).toEqual(['Enemy — Foes', 'Friendly — Ours'])
  expect(box.castDisabled).toBe(true)
})

it('a friendly spell offers only our own models, including the caster', () => {
  const box = targetBox('friendly')
  expect(box.tone).toBe('brass')
  expect(box.groups).toEqual(['Friendly — Ours'])
  expect(box.options.join(' ')).toContain('Wizard')
  expect(box.castDisabled).toBe(true)
})

it('a self spell names the caster and needs no pick', () => {
  const box = targetBox('self')
  expect(box.hasSelect).toBe(false)
  expect(box.text).toContain('Cast on Wizard himself')
  expect(box.castDisabled).toBe(false)
})

it('a spell with no model to choose hides the picker and can be cast straight away', () => {
  const box = targetBox('none')
  expect(box.hasSelect).toBe(false)
  expect(box.text).toContain('No model to choose')
  expect(box.castDisabled).toBe(false)
})

it('a supplement spell with no target kind keeps the old optional friendly list', () => {
  const box = targetBox(undefined)
  expect(box.hasSelect).toBe(true)
  expect(box.groups).toEqual([])
  expect(box.options.join(' ')).toContain('Off the sheet')
  expect(box.castDisabled).toBe(false)
})

it('an area spell that lands on enemies lets the player tick which enemy models are within it; other no-target spells do not', () => {
  const spell = fixture.spell as typeof fixture.spell & { affects?: string }
  const before = { difficulty: spell.difficulty, affects: spell.affects }
  try {
    spell.difficulty = 9
    spell.affects = 'enemies'
    const area = targetBox('none')
    const boxes = nodes(CastTab({ matchId: 'test', roster: friendlyRoster, template: undefined, others: [{ warband_id: 'e', warband_name: 'Foes' } as any], sheet: emptyBattleLiveState(), readOnly: false, edit: vi.fn() }))
    const checkboxes = boxes.filter(n => n.type === 'input' && n.props.type === 'checkbox')
    expect(area.text).toContain('No model to choose')
    expect(checkboxes).toHaveLength(1)
    expect(boxes.some(n => n.props['aria-label'] === 'Enemy models affected')).toBe(true)
    expect(area.castDisabled).toBe(false) // ticking is optional
    spell.affects = undefined
    const plain = nodes(CastTab({ matchId: 'test', roster: friendlyRoster, template: undefined, others: [{ warband_id: 'e', warband_name: 'Foes' } as any], sheet: emptyBattleLiveState(), readOnly: false, edit: vi.fn() }))
    expect(plain.filter(n => n.type === 'input' && n.props.type === 'checkbox')).toHaveLength(0)
  } finally {
    spell.difficulty = before.difficulty
    spell.affects = before.affects
  }
})
