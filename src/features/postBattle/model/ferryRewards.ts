/** Protect Hornsby's Ferry, 06-scenarios.md:1682–1735. */
export interface FerryRewardDraft {
  side?: 'attacker' | 'defender' | 'defenders-ally'
  roughedUp?: boolean
  patrol?: boolean
  paymentDice?: (number | null)[]
  bonusDice?: (number | null)[]
  feeDice?: (number | null)[]
  shared?: boolean
  ownShare?: number | null
  allocation?: string
}
export function ferryRewards(state: FerryRewardDraft, won: boolean) {
  const result = { gold: 0, notes: [] as string[], problems: [] as string[] }
  if (!state.side || !['attacker', 'defender', 'defenders-ally'].includes(state.side) || state.roughedUp === undefined) { result.problems.push('Record your side and whether the Hornsbys were roughed up.'); return result }
  const dice = (values: (number | null)[] | undefined, count: number, label: string) => {
    if (values?.length !== count || values.some(d => d === null || !Number.isInteger(d) || d < 1 || d > 6)) { result.problems.push(`${label}: enter ${count}D6.`); return 0 }
    const total = values.reduce<number>((n, d) => n + d!, 0)
    result.notes.push(`${label}: ${count}D6 ${values.join(', ')} = ${total} gc.`)
    return total
  }
  result.notes.push(`Hornsby's Ferry: ${state.side}; ${won ? 'won' : 'did not win'}. ${state.side === 'attacker' ? 'Own warriors roughed up the Hornsbys' : 'Hornsbys roughed up'}: ${state.roughedUp ? 'yes' : 'no'}.`)
  if (state.side === 'attacker') {
    if (won) result.gold += dice(state.paymentDice, 3, 'Attacker contract')
    if (state.roughedUp) result.gold += dice(state.bonusDice, 2, 'Roughing-up bonus')
    return result
  }
  if (!won || state.roughedUp) { result.notes.push('No defensive payment.'); return result }
  if (state.patrol === undefined) result.problems.push('Record whether the patrol ended the battle at the turn limit.')
  let pool = dice(state.paymentDice, 5, 'Defensive payment')
  if (state.patrol) pool -= dice(state.feeDice, 2, 'Patrol fees deducted')
  if (state.shared === undefined) result.problems.push('Record whether this payment is shared with an allied warband.')
  if (state.side === 'defenders-ally' && state.shared !== true) result.problems.push('An allied warband receives only its agreed share of the defensive payment.')
  if (state.shared) {
    const share = state.ownShare
    if (share == null || !Number.isInteger(share) || share < Math.min(0, pool) || share > Math.max(0, pool) || !state.allocation?.trim()) result.problems.push(`Record your agreed share of the ${pool} gc payment and how the remainder is allocated.`)
    else { result.gold = share; result.notes.push(`Shared payment ${pool} gc: this warband records ${share} gc. Agreed allocation: ${state.allocation.trim()}`) }
  } else result.gold = pool
  return result
}
