import { expect, it } from 'vitest';
import { resolveSingleAttack, type AttackInput } from './resolveAttack';
import { resolveTurn } from './turnAggregate';
import { IMPOSSIBLE } from './dice';

const input: AttackInput = {
  hitThreshold: 4, woundThreshold: 4, armourThreshold: IMPOSSIBLE,
  injuryRollModifier: 0, concussion: false, trueGrit: false, hardToKill: false,
  critTriggerFaces: [6], critTable: 'unarmed', critTableRollModifier: -10,
  parryEligible: false, parrySuccessProbGivenAttempt: 0,
};

it('Body Blow adds a normal attack without allowing a second critical', () => {
  // Force every critical-table result to Body Blow. Against two Wounds only a
  // critical plus a successful bonus wound reaches Injury: 1/2 * 1/6 * 1/4.
  const attack = resolveSingleAttack(input);
  const result = resolveTurn([attack], 0, 2);
  expect(result.criticalHitProbability).toBeCloseTo(1 / 12, 12);
  expect(result.outOfActionProbability).toBeCloseTo(1 / 144, 12);
  expect(result.anyWoundProbability).toBeCloseTo(1 / 4, 12);
  expect(Object.values(result.distribution).reduce((a, b) => a + b)).toBeCloseTo(1, 12);
  expect(attack.extraAttack?.pWoundTriggerEligible).toBe(0);
});

it('an armour save on the original wound does not cancel the additional attack', () => {
  // First unsaved wound chance 1/8; saved Body Blow then unsaved bonus adds 1/192.
  const result = resolveTurn([resolveSingleAttack({ ...input, armourThreshold: 4 })], 0, 3);
  expect(result.anyWoundProbability).toBeCloseTo(1 / 8 + 1 / 192, 12);
});

it('highest-hit partition keeps the bonus independent and uses remaining parries', () => {
  const attack = resolveSingleAttack({ ...input, parryEligible: true, parrySuccessProbGivenAttempt: 1 / 2 });
  // One original parry halves the original critical chance. One remaining parry
  // then halves the bonus wound chance, without conditioning its hit to certainty.
  expect(resolveTurn([attack], 1, 2).outOfActionProbability).toBeCloseTo(1 / 288, 12);
  expect(resolveTurn([attack], 2, 2).outOfActionProbability).toBeCloseTo(1 / 576, 12);
});

it('the printed chart grants Body Blow on exactly two of its six faces', () => {
  const result = resolveTurn([resolveSingleAttack({ ...input, critTableRollModifier: 0 })], 0, 2);
  expect(result.outOfActionProbability).toBeCloseTo(1 / 432, 12);
  expect(result.criticalHitProbability).toBeCloseTo(1 / 12, 12);
  expect(Object.values(result.distribution).reduce((a, b) => a + b)).toBeCloseTo(1, 12);
});
