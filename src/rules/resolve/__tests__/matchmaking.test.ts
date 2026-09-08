import { describe, expect, it } from 'vitest'
import { computeRound, generateMatchups, getPairStats, type MatchmakingHistory, type MatchmakingInput, type MatchmakingWarband } from '../matchmaking'

const band = (id: string, ownerId = id, active = true): MatchmakingWarband => ({ id, ownerId, active })
const meeting = (a: string, b: string, date = '2026-09-01'): MatchmakingHistory => ({ warbandIds: [a, b], date })
const input = (over: Partial<MatchmakingInput> = {}): MatchmakingInput => ({
  warbands: ['a', 'b', 'c', 'd'].map((id) => band(id)), attendingPlayerIds: ['a', 'b', 'c', 'd'],
  history: [], refDate: '2026-09-08', random: () => 0.99, ...over,
})
const pairs = (over: Partial<MatchmakingInput> = {}) => {
  const result = computeRound(input(over))
  if (!result.ok) throw new Error(result.error)
  return result.round.pairs.map((pair) => [...pair].sort().join('')).sort()
}

describe('computeRound', () => {
  it('avoids repeat opponents across a whole matching', () => {
    expect(pairs({ history: [meeting('a', 'b'), meeting('c', 'd')] })).toEqual(['ac', 'bd'])
  })
  it('minimises the total count before considering recency', () => {
    expect(pairs({ history: [meeting('a', 'b', '1900-01-01'), meeting('c', 'd', '1900-01-01'), meeting('a', 'c'), meeting('a', 'd'), meeting('b', 'c')] })).toEqual(['ac', 'bd'])
  })
  it('breaks count ties by longest combined time since meeting', () => {
    expect(pairs({ history: [meeting('a', 'b', '2026-01-01'), meeting('c', 'd', '2026-01-01'), meeting('a', 'c'), meeting('b', 'd'), meeting('a', 'd'), meeting('b', 'c')] })).toEqual(['ab', 'cd'])
  })
  it('gives never-met pairs the reference recency bonus', () => {
    expect(pairs({ history: [meeting('a', 'b'), meeting('a', 'b'), meeting('a', 'c'), meeting('b', 'd'), meeting('a', 'd'), meeting('b', 'c')] })).toEqual(['ab', 'cd'])
  })
  it('does not treat future scheduled games as long-ago encounters', () => {
    expect(pairs({ history: [meeting('a', 'b', '2099-01-01'), meeting('c', 'd', '2099-01-01'), meeting('a', 'c'), meeting('b', 'd'), meeting('a', 'd'), meeting('b', 'c')] })).toEqual(['ac', 'bd'])
  })
  it('expands arbitrary rosters and excludes same-owner, inactive and absent warbands', () => {
    const data = input({ warbands: [band('a1', 'a'), band('a2', 'a'), band('a3', 'a'), band('b1', 'b'), band('c1', 'c'), band('c2', 'c'), band('a4', 'a', false), band('d1', 'd')], attendingPlayerIds: ['a', 'b', 'c'] })
    const result = computeRound(data)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.round.pairs.flat().sort()).toEqual(['a1', 'a2', 'a3', 'b1', 'c1', 'c2'])
    for (const [a, b] of result.round.pairs) expect(data.warbands.find((w) => w.id === a)?.ownerId).not.toBe(data.warbands.find((w) => w.id === b)?.ownerId)
  })
  it('assigns an odd-pool bye by fewest byes, then most games', () => {
    const result = computeRound(input({ warbands: [band('a'), band('b'), band('c')], byeCounts: { a: 1 }, history: [meeting('a', 'c')] }))
    expect(result).toMatchObject({ ok: true, round: { bye: 'c', pairs: [['a', 'b']] } })
  })
  it('randomly breaks equal bye candidates with a reproducible stream', () => {
    let i = 0
    const result = computeRound(input({ warbands: [band('a'), band('b'), band('c')], random: () => [0.8, 0.1, 0.9][i++ % 3] }))
    expect(result).toMatchObject({ ok: true, round: { bye: 'b' } })
  })
  it('tries the next bye if the preferred one leaves an impossible owner split', () => {
    const result = computeRound(input({ warbands: [band('a1', 'a'), band('a2', 'a'), band('b', 'b')], byeCounts: { a1: 1, a2: 1 } }))
    expect(result).toMatchObject({ ok: true, round: { bye: 'a1', pairs: [['a2', 'b']] } })
  })
  it('reports impossible pools, one owner, empty attendance and invalid dates', () => {
    expect(computeRound(input({ warbands: [band('a1', 'a'), band('a2', 'a'), band('a3', 'a'), band('b')] })).ok).toBe(false)
    expect(computeRound(input({ attendingPlayerIds: ['a'] })).ok).toBe(false)
    expect(computeRound(input({ attendingPlayerIds: [] })).ok).toBe(false)
    expect(computeRound(input({ refDate: 'invalid' })).ok).toBe(false)
  })
  it('rejects oversized exhaustive searches', () => {
    const warbands = Array.from({ length: 17 }, (_, i) => band(String(i)))
    expect(computeRound(input({ warbands, attendingPlayerIds: warbands.map((w) => w.ownerId) })).ok).toBe(false)
  })
  it('does not mutate inputs and never duplicates a warband within a round', () => {
    const data = input({ warbands: [band('a'), band('a'), band('b'), band('c'), band('d')] })
    const before = JSON.stringify(data)
    const result = computeRound(data)
    expect(JSON.stringify(data)).toBe(before)
    expect(result.ok && new Set(result.round.pairs.flat()).size).toBe(4)
  })
})

describe('match history and batches', () => {
  it('counts a multiplayer game once for each distinct pair and retains the latest date', () => {
    const stats = getPairStats([{ warbandIds: ['a', 'b', 'c', 'a'], date: '2026-09-02' }, meeting('b', 'a', '2026-01-01')])
    expect(stats.size).toBe(3)
    expect(stats.get(JSON.stringify(['a', 'b']))).toEqual({ count: 2, lastMet: Date.parse('2026-09-02') })
  })
  it('still counts undated games without awarding a never-met bonus', () => {
    expect(getPairStats([{ warbandIds: ['a', 'b'], date: null }]).get(JSON.stringify(['a', 'b']))).toEqual({ count: 1, lastMet: null })
  })
  it('produces a full four-player round robin before repeating', () => {
    const result = generateMatchups(input(), 6)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.rounds).toHaveLength(3)
    expect(new Set(result.rounds.flatMap((r) => r.pairs.map((p) => [...p].sort().join('')))).size).toBe(6)
  })
  it('rotates byes across a batch and returns exactly the requested number', () => {
    const result = generateMatchups(input({ warbands: [band('a'), band('b'), band('c')] }), 3)
    expect(result.ok && new Set(result.rounds.map((r) => r.bye)).size).toBe(3)
    const partial = generateMatchups(input(), 3)
    expect(partial.ok && partial.rounds.map((r) => r.pairs.length)).toEqual([2, 1])
  })
  it.each([0, -1, 1.5, NaN, 51])('rejects an invalid batch size %s', (count) => {
    expect(generateMatchups(input(), count).ok).toBe(false)
  })
})
