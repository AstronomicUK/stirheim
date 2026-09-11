import { describe, expect, it } from 'vitest';
import { emptyBattleLiveState, recordStupidityTest, withRollAttempt, type StupidityTestRoll } from '../battle';
const roll = (extra: Partial<StupidityTestRoll> = {}): StupidityTestRoll => ({ dice: [3, 4], leadership: 7, baseLeadership: 7, inCombat: true, ...extra });
describe('recorded Stupidity tests', () => {
  it('resolves all 36 Leadership-7 combinations, including equality as a pass', () => {
    let passes = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
      const state = recordStupidityTest(emptyBattleLiveState(), 'w', 'turn', 'Wizard', roll({ dice: [a, b] }));
      expect(state.stupidityResults[0].failed).toBe(a + b > 7);
      if (!state.stupidityResults[0].failed) passes++;
    }
    expect(passes).toBe(21);
  });
  it('keeps original app dice, edited faces, Leadership reasons and movement results in one completed attempt', () => {
    const initial = withRollAttempt(emptyBattleLiveState(), { id: 'attempt', at: '2026-09-11T13:00:00Z', turn: 1, kind: 'attack', status: 'incomplete', label: 'Pending test', rolls: ['App rolled 2 + 3.'] });
    const state = recordStupidityTest(initial, 'w', 'turn', 'Wizard', roll({ attemptId: 'attempt', dice: [5, 6], originalDice: [2, 3], leadership: 8, leadershipReason: 'Nearby leader', inCombat: false, movementDie: 3, originalMovementDie: 6 }), 2);
    expect(state.rollAttempts).toHaveLength(1);
    expect(state.rollAttempts[0]).toMatchObject({ status: 'complete', turn: 2 });
    expect(state.rollAttempts[0].rolls.join(' ')).toContain('App rolled 2 + 3; player changed the dice to 5 + 6');
    expect(state.rollAttempts[0].rolls.join(' ')).toContain('App rolled movement D6: 6; player changed it to 3');
    expect(state.rollAttempts[0].rolls.join(' ')).toContain('Nearby leader');
    expect(state.rollAttempts[0].rolls.join(' ')).toContain('half speed');
    expect(initial.stupidityResults).toEqual([]);
  });
  it('requires the failed movement roll only outside combat and explains both outcomes', () => {
    expect(() => recordStupidityTest(emptyBattleLiveState(), 'w', 't', 'W', roll({ dice: [6, 6], inCombat: false }))).toThrow(/movement/);
    const failed = recordStupidityTest(emptyBattleLiveState(), 'w', 't', 'W', roll({ dice: [6, 6], inCombat: false, movementDie: 4 }));
    expect(failed.rollAttempts[0].rolls.join(' ')).toContain('Stand inactive');
    expect(failed.rollAttempts[0].rolls.join(' ')).toContain('Player entered movement D6: 4');
    expect(() => recordStupidityTest(emptyBattleLiveState(), 'w', 't', 'W', roll({ dice: [6, 6] }))).not.toThrow();
  });
  it('requires reasons for Leadership overrides and replacing a recorded test', () => {
    expect(() => recordStupidityTest(emptyBattleLiveState(), 'w', 't', 'W', roll({ leadership: 9 }))).toThrow(/Leadership/);
    const first = recordStupidityTest(emptyBattleLiveState(), 'w', 't', 'W', roll());
    expect(() => recordStupidityTest(first, 'w', 't', 'W', roll())).toThrow(/replaced/);
    const next = recordStupidityTest(first, 'w', 't', 'W', roll({ dice: [6, 6], correctionReason: 'Corrected the table result' }));
    expect(next.stupidityResults).toHaveLength(1);
    expect(next.stupidityResults[0].failed).toBe(true);
    expect(next.rollAttempts).toHaveLength(2);
    expect(next.rollAttempts[1].rolls.join(' ')).toContain('Corrected the table result');
    expect(next.rollAttempts[1].rolls.join(' ')).not.toContain('App rolled');
  });
  it('rejects invalid dice and retains an app movement roll made obsolete by a correction', () => {
    for (const dice of [[0, 6], [7, 1], [1.5, 2], [3]]) expect(() => recordStupidityTest(emptyBattleLiveState(), 'w', 't', 'W', roll({ dice }))).toThrow(/D6/);
    const state = recordStupidityTest(emptyBattleLiveState(), 'w', 't', 'W', roll({ originalMovementDie: 5 }));
    expect(state.rollAttempts[0].rolls.join(' ')).toContain('movement roll 5 was not used');
  });
});
