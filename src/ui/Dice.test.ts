import { describe, expect, it } from 'vitest'
import { cubeFaces, SETTLE_MS, TUMBLE_MS } from './diceCube'

describe('cubeFaces (dice v3 tumble)', () => {
  it('lands on the value and keeps every opposite pair of a real D6 summing to seven', () => {
    for (let value = 1; value <= 6; value++) {
      const [front, back, right, left, top, bottom] = cubeFaces(value)
      expect(front).toBe(value)
      expect(front + back).toBe(7)
      expect(right + left).toBe(7)
      expect(top + bottom).toBe(7)
      expect(new Set(cubeFaces(value)).size).toBe(6)
    }
  })
  it('shows the result on every face of a die that is not a D6', () => {
    expect(cubeFaces(2, 3)).toEqual([2, 2, 2, 2, 2, 2])
    expect(cubeFaces(30, 66)).toEqual([30, 30, 30, 30, 30, 30])
  })
  it('holds the result long enough to read before the caller moves on', () => {
    expect(TUMBLE_MS).toBe(1120)
    expect(SETTLE_MS).toBeGreaterThanOrEqual(600)
  })
})
