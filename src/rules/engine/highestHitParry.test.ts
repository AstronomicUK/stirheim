import { describe, expect, it } from 'vitest'
import { IMPOSSIBLE } from './dice'
import { resolveSingleAttack, type AttackInput } from './resolveAttack'
import { resolveTurn } from './turnAggregate'

const base: AttackInput = { hitThreshold: 4, woundThreshold: 2, armourThreshold: IMPOSSIBLE, injuryRollModifier: 0, concussion: false, trueGrit: false, hardToKill: false, critTriggerFaces: [], critTable: 'standard', critTableRollModifier: 0, parryEligible: true, parrySuccessProbGivenAttempt: 0 }

describe('highest-hit parry probabilities', () => {
  for (const count of [1, 2]) it(`matches independent D6 enumeration with ${count} parries and mixed weapons`, () => {
    const chances = Array.from({ length: 7 }, (_, face) => (6 - face + (count === 2 ? 1 : 0)) / 6)
    const inputs = [base, { ...base, hitThreshold: 3, autoWoundOnNaturalSixToHit: true }, { ...base, hitThreshold: 5 }].map(i => ({ ...i, parrySuccessByFace: chances }))
    let noWound = 0, noOOA = 0
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) {
      const faces = [a, b, c]
      const hits = faces.map((face, i) => ({ face, i })).filter(h => h.face >= inputs[h.i].hitThreshold!).sort((x, y) => y.face - x.face || x.i - y.i)
      const selected = hits.slice(0, count).map(h => h.i)
      let none = 1, alive = 1
      for (const { face, i } of hits) {
        const q = inputs[i].autoWoundOnNaturalSixToHit && face === 6 ? 1 : 5 / 6
        const retained = selected.includes(i) ? 1 - chances[face] : 1
        none *= 1 - q * retained
        alive *= 1 - q * retained / 3
      }
      noWound += none / 216
      noOOA += alive / 216
    }
    const result = resolveTurn(inputs.map(resolveSingleAttack), count)
    expect(result.anyWoundProbability).toBeCloseTo(1 - noWound, 10)
    expect(result.outOfActionProbability).toBeCloseTo(1 - noOOA, 10)
    expect(Object.values(result.distribution).reduce((a, b) => a + b)).toBeCloseTo(1, 10)
  })

  it('an unsaved wound removes a knocked-down target regardless of its remaining Wounds', () => {
    const attack = resolveSingleAttack({ ...base, autoHitKnockedDown: true, parryEligible: false })
    expect(resolveTurn([attack], 0, 3).outOfActionProbability).toBeCloseTo(5 / 6, 10)
  })
})
