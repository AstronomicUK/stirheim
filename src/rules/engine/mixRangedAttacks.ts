import type { SingleAttackBreakdown, Severity4Distribution, WoundEvent } from './resolveAttack'

/** Keep distinct projectile outcomes distinct in the damage DP (e.g. an ordinary shot versus a +1S misfire shot). */
export function mixRangedAttacks(branches: { probability: number; attack: SingleAttackBreakdown }[]): SingleAttackBreakdown {
  if (!branches.length || branches.some(b => !Number.isFinite(b.probability) || b.probability < 0 || b.attack.parryEligible) || Math.abs(branches.reduce((n, b) => n + b.probability, 0) - 1) > 1e-9) throw new Error('Ranged branches must have non-negative probabilities totalling one and cannot be parried.')
  const mean = (key: 'pHit' | 'pWound' | 'pWoundNormal' | 'pWoundTriggerEligible') => branches.reduce((n, b) => n + b.probability * b.attack[key], 0)
  const condition = (crit: boolean) => {
    const key = crit ? 'pWoundTriggerEligible' : 'pWound'
    const total = mean(key)
    return branches.map(b => ({ attack: b.attack, weight: total ? b.probability * b.attack[key] / total : 0 }))
  }
  const events = (crit: boolean): WoundEvent[] => condition(crit).flatMap(b => b.attack[crit ? 'critEvents' : 'normalEvents'].map(e => ({ ...e, probability: e.probability * b.weight })))
  const outcome = (crit: boolean): Severity4Distribution => {
    const value: Severity4Distribution = { none: mean(crit ? 'pWoundTriggerEligible' : 'pWound') === 0 ? 1 : 0, knockedDown: 0, stunned: 0, outOfAction: 0 }
    for (const b of condition(crit)) for (const key of Object.keys(value) as (keyof Severity4Distribution)[]) value[key] += b.weight * b.attack[crit ? 'critOutcome' : 'normalOutcome'][key]
    return value
  }
  return {
    branches: branches.map(b => ({ ...b })),
    pHit: mean('pHit'), pWound: mean('pWound'), pWoundNormal: mean('pWoundNormal'), pWoundTriggerEligible: mean('pWoundTriggerEligible'),
    normalEvents: events(false), critEvents: events(true), normalOutcome: outcome(false), critOutcome: outcome(true),
    pRicochetGivenCritConsumedHere: condition(true).reduce((n, b) => n + b.weight * b.attack.pRicochetGivenCritConsumedHere, 0),
    parryEligible: false, parrySuccessProbGivenAttempt: 0,
  }
}
