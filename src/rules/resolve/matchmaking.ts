/** Round-robin proposals only: callers supply real history and persist agreed games separately. */
export interface MatchmakingWarband {
  id: string
  ownerId: string
  active: boolean
}

export interface MatchmakingHistory {
  warbandIds: readonly string[]
  date: string | null
}

export type Pair = readonly [string, string]
export interface MatchmakingRound {
  pairs: Pair[]
  bye: string | null
}
export type RoundResult = { ok: true; round: MatchmakingRound } | { ok: false; error: string }
export interface MatchmakingInput {
  warbands: readonly MatchmakingWarband[]
  attendingPlayerIds: readonly string[]
  history: readonly MatchmakingHistory[]
  byeCounts?: Readonly<Record<string, number>>
  refDate: string
  /** Injected so identical inputs (including the random stream) reproduce a proposal. */
  random: () => number
}

const key = (a: string, b: string) => JSON.stringify([a, b].sort())
const NEVER_MET = 100000
const DAY = 86400000

export function getPairStats(history: readonly MatchmakingHistory[]) {
  const stats = new Map<string, { count: number; lastMet: number | null }>()
  for (const match of history) {
    const ids = [...new Set(match.warbandIds)]
    const timestamp = match.date === null ? NaN : Date.parse(match.date)
    const date = Number.isFinite(timestamp) ? timestamp : null
    // A multiplayer battle contributes one meeting to every pair, not one per report.
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const k = key(ids[i], ids[j])
        const prior = stats.get(k)
        stats.set(k, {
          count: (prior?.count ?? 0) + 1,
          lastMet: date === null ? prior?.lastMet ?? null : Math.max(date, prior?.lastMet ?? -Infinity),
        })
      }
    }
  }
  return stats
}

/** Stream exhaustive matchings instead of retaining all of them in memory. */
function* enumerateMatchings(pool: readonly MatchmakingWarband[]): Generator<Pair[]> {
  if (pool.length === 0) { yield []; return }
  const [first, ...rest] = pool
  for (let i = 0; i < rest.length; i++) {
    if (first.ownerId === rest[i].ownerId) continue
    const remaining = rest.filter((_, index) => index !== i)
    for (const suffix of enumerateMatchings(remaining)) yield [[first.id, rest[i].id], ...suffix]
  }
}

export function computeRound(input: MatchmakingInput): RoundResult {
  const pool = [...new Map(input.warbands
    .filter((w) => w.active && input.attendingPlayerIds.includes(w.ownerId))
    .map((w) => [w.id, w])).values()]
  if (new Set(pool.map((w) => w.ownerId)).size < 2) {
    return { ok: false, error: 'Select at least two players with active enrolled warbands.' }
  }
  // Beyond 14 warbands the search jumps above two million unrestricted perfect matchings.
  // Keep a whole-campaign selection from freezing the browser; small pools remain exhaustive.
  if (pool.length > 14) return { ok: false, error: 'Select at most 14 active warbands at a time.' }
  const ref = Date.parse(input.refDate)
  if (!Number.isFinite(ref)) return { ok: false, error: 'Choose a valid date.' }
  const stats = getPairStats(input.history)
  const games = new Map(pool.map((w) => [w.id, input.history.filter((m) => m.warbandIds.includes(w.id)).length]))
  const byes: (MatchmakingWarband | null)[] = pool.length % 2 === 0 ? [null] : pool
    .map((w) => ({ w, tie: input.random() }))
    .sort((a, b) => (input.byeCounts?.[a.w.id] ?? 0) - (input.byeCounts?.[b.w.id] ?? 0)
      || games.get(b.w.id)! - games.get(a.w.id)! || a.tie - b.tie)
    .map(({ w }) => w)

  for (const bye of byes) {
    const remaining = pool.filter((w) => w.id !== bye?.id)
    const owners = new Map<string, number>()
    for (const w of remaining) owners.set(w.ownerId, (owners.get(w.ownerId) ?? 0) + 1)
    if ([...owners.values()].some((count) => count > remaining.length / 2)) continue
    let best: Pair[] | null = null
    let bestCount = Infinity
    let bestRecency = -Infinity
    let tied = 0
    for (const pairs of enumerateMatchings(remaining)) {
      let count = 0
      let recency = 0
      for (const [a, b] of pairs) {
        const stat = stats.get(key(a, b))
        count += stat?.count ?? 0
        // Future scheduled encounters count as repeats, but never look like long-ago meetings.
        recency += !stat ? NEVER_MET : stat.lastMet === null ? 0 : Math.max(0, (ref - stat.lastMet) / DAY)
      }
      if (count < bestCount || (count === bestCount && recency > bestRecency)) {
        best = pairs; bestCount = count; bestRecency = recency; tied = 1
      } else if (count === bestCount && recency === bestRecency) {
        tied++
        if (input.random() < 1 / tied) best = pairs
      }
    }
    if (best) return { ok: true, round: { pairs: best, bye: bye?.id ?? null } }
  }
  return { ok: false, error: 'These warbands cannot form a full round without pairing the same owner. Select another attendee or a different group of players.' }
}

/** Exactly X matchups, with a clearly marked partial final round if X is not a round multiple. */
export function generateMatchups(input: MatchmakingInput, count: number):
  { ok: true; rounds: MatchmakingRound[] } | { ok: false; error: string } {
  if (!Number.isInteger(count) || count < 1 || count > 50) return { ok: false, error: 'Choose between 1 and 50 matchups.' }
  const history = [...input.history]
  const byeCounts = { ...input.byeCounts }
  const rounds: MatchmakingRound[] = []
  let left = count
  while (left > 0) {
    const result = computeRound({ ...input, history, byeCounts })
    if (!result.ok) return result
    const round = { ...result.round, pairs: result.round.pairs.slice(0, left) }
    rounds.push(round)
    for (const pair of round.pairs) history.push({ warbandIds: pair, date: input.refDate })
    if (round.bye) byeCounts[round.bye] = (byeCounts[round.bye] ?? 0) + 1
    left -= round.pairs.length
  }
  return { ok: true, rounds }
}
