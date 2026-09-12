import { expect, it } from 'vitest'
import { emptyBattleLiveState, parseBattleLiveState } from '../../../domain/battle'
import { correctItemRoll, itemRollsBy, setItemRoll, setItemUsed } from './sheet'
const key = 'itemRoll:hero:crimson_shade'
it('preserves original roll, correction history and stock through reload and repeated corrections', () => {
  const initial = setItemRoll(setItemUsed(emptyBattleLiveState(), 'hero', 'crimson_shade', true), 'hero', 'crimson_shade', 2, false)
  const fixed = correctItemRoll(initial, 'hero', 3, 'Agreed table correction', 'Captain', initial.preBattle[key])
  const saved = parseBattleLiveState(JSON.parse(JSON.stringify(fixed)))
  expect(itemRollsBy(saved, 'hero')).toEqual({ crimson_shade: 3 })
  expect(saved.preBattle['itemRollOriginal:hero:crimson_shade']).toBe('2 · rolled by the app')
  expect(saved.itemsUsed).toEqual(initial.itemsUsed)
  expect(saved.rollAttempts.at(-1)?.rolls[0]).toContain('from 2 to 3: Agreed table correction')
  expect(setItemRoll(saved, 'hero', 'crimson_shade', 1, false)).toBe(saved)
  const next = correctItemRoll(saved, 'hero', 1, 'Second correction', 'Captain', saved.preBattle[key])
  expect(next.preBattle['itemRollOriginal:hero:crimson_shade']).toBe('2 · rolled by the app')
  expect(next.rollAttempts).toHaveLength(2)
  expect(next.rollAttempts.at(-1)?.rolls[0]).toContain('Earlier attacks are unchanged')
  expect(itemRollsBy(setItemUsed(setItemUsed(next, 'hero', 'crimson_shade', false), 'hero', 'crimson_shade', true), 'hero').crimson_shade).toBe(1)
})
it('rejects missing rolls, blank reasons, invalid D3 values, unchanged values and stale submissions', () => {
  const initial = setItemRoll(emptyBattleLiveState(), 'hero', 'crimson_shade', 2, true)
  for (const n of [0, 4, 1.5, NaN, 2]) expect(correctItemRoll(initial, 'hero', n, 'Reason', 'Captain', initial.preBattle[key])).toBe(initial)
  expect(correctItemRoll(initial, 'hero', 3, ' ', 'Captain', initial.preBattle[key])).toBe(initial)
  expect(correctItemRoll(initial, 'hero', 3, 'Reason', 'Captain', 'stale')).toBe(initial)
  const empty = emptyBattleLiveState()
  expect(correctItemRoll(empty, 'hero', 3, 'Reason', 'Captain', '')).toBe(empty)
})
