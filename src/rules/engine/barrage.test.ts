import { expect, it } from 'vitest';
import { resolveSingleAttack, type AttackInput } from './resolveAttack';
import { resolveTurn } from './turnAggregate';
import { IMPOSSIBLE } from './dice';
const input: AttackInput = { hitThreshold: 4, woundThreshold: 4, armourThreshold: IMPOSSIBLE, injuryRollModifier: 0, concussion: false, trueGrit: false, hardToKill: false, critTriggerFaces: [], critTable: 'standard', critTableRollModifier: 0, parryEligible: false, parrySuccessProbGivenAttempt: 0, barrageOnFailedWound: true };
it('sums the infinite 6+ tail exactly, without manufacturing extra wounds', () => {
  const atSix = resolveTurn([resolveSingleAttack({ ...input, hitThreshold: 6 })]);
  expect(atSix.anyWoundProbability).toBeCloseTo(1 / 11, 12); // (1/12) / (1 - 1/12)
  expect(atSix.outOfActionProbability).toBeCloseTo(1 / 33, 12);
  const result = resolveTurn([resolveSingleAttack(input)]);
  const five = 1 / 6 + (1 / 6) * (1 / 11);
  const four = 1 / 4 + (1 / 4) * five;
  expect(result.anyWoundProbability).toBeCloseTo(four, 12);
  expect(Object.values(result.distribution).reduce((a, b) => a + b)).toBeCloseTo(1, 12);
  expect(resolveTurn([resolveSingleAttack(input)], 0, 2).outOfActionProbability).toBe(0);
});
it('a saved wound ends Barrage, and a miss grants no bonus', () => {
  const saved = resolveTurn([resolveSingleAttack({ ...input, hitThreshold: 6, armourThreshold: 4 })]);
  expect(saved.anyWoundProbability).toBeCloseTo(1 / 22, 12);
});
it('preserves remaining parries and an independent bonus after highest-hit partitioning', () => {
  const a = resolveSingleAttack({ ...input, hitThreshold: 6, parryEligible: true, parrySuccessProbGivenAttempt: 0.5 });
  expect(resolveTurn([a], 1).anyWoundProbability).toBeCloseTo((1 / 24) * (1 + 1 / 11), 12);
  expect(resolveTurn([a], 2).anyWoundProbability).toBeCloseTo(1 / 24 + (1 / 24) * ((1 / 24) * (1 + 1 / 11)), 12);
});
it('recomputes bonus parry probability from the harder hit faces', () => {
  const a = resolveSingleAttack({ ...input, parryEligible: true, parrySuccessProbGivenAttempt: 1 / 6, parrySuccessByFace: [0, 0, 0, 0, 2 / 6, 1 / 6, 0] });
  expect(a.barrageNext?.parrySuccessProbGivenAttempt).toBeCloseTo(1 / 12);
  expect(a.barrageNext?.barrageNext?.parrySuccessProbGivenAttempt).toBe(0);
});
