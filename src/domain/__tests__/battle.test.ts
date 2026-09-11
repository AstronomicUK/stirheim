import { describe, expect, it } from "vitest";
import { combatPhaseKey, correctSerpentStaff, activateSerpentStaff, consumeSerpentStaff, serpentStaffUse, battleTotals, emptyBattleLiveState, parseBattleLiveState, routThreshold, tallyFor, withTally, withRollAttempt, type RollAttempt } from "../battle";

describe("battle live state", () => {
  it("retains failed and restarted dice through storage without applying casualties or consuming casts", () => {
    const first: RollAttempt = { id: 'attempt-1', at: '2026-09-09T17:00:00Z', turn: 1, label: 'Captain attacks Henchman', kind: 'attack', status: 'incomplete', rolls: ['Rolled 1 (entered by hand) to hit. Missed.'] };
    let state = withRollAttempt(emptyBattleLiveState(), first);
    state = withRollAttempt(state, { ...first, status: 'restarted' });
    state = withRollAttempt(state, { ...first, id: 'attempt-2', kind: 'spell', status: 'complete', rolls: ['Casting: 1 + 1 (rolled by the app). Failed.'] });
    const restored = parseBattleLiveState(JSON.parse(JSON.stringify(state)));
    expect(restored.rollAttempts).toHaveLength(2);
    expect(restored.rollAttempts[0]).toEqual({ ...first, status: 'restarted' });
    expect(restored.rollAttempts[1].rolls[0]).toContain('rolled by the app');
    expect(battleTotals(restored)).toEqual({ enemiesOutOfAction: 0, ownOutOfAction: 0 });
    expect(restored.casts).toEqual([]);
    expect(restored.tallies).toEqual([]);
  });

  it("parses an empty or malformed value to an empty sheet", () => {
    expect(parseBattleLiveState(null)).toEqual(emptyBattleLiveState());
    expect(parseBattleLiveState({ turn: "three" })).toEqual(emptyBattleLiveState());
    expect(parseBattleLiveState({ turn: 3, tallies: [{ id: "h1", kind: "hero", enemiesOutOfAction: 2 }] })).toMatchObject({
      turn: 3,
      tallies: [{ id: "h1", kind: "hero", enemiesOutOfAction: 2, outOfAction: 0, woundsLost: 0, note: "" }],
    });
  });

  it("withTally replaces, inserts and drops zeroed tallies; totals add up", () => {
    let state = emptyBattleLiveState();
    state = withTally(state, { id: "h1", kind: "hero", enemiesOutOfAction: 1, outOfAction: 0, woundsLost: 0, note: "" });
    state = withTally(state, { id: "g1", kind: "group", enemiesOutOfAction: 0, outOfAction: 2, woundsLost: 0, note: "" });
    expect(state.tallies).toHaveLength(2);
    expect(battleTotals(state)).toEqual({ enemiesOutOfAction: 1, ownOutOfAction: 2 });
    state = withTally(state, { id: "h1", kind: "hero", enemiesOutOfAction: 0, outOfAction: 0, woundsLost: 0, note: "" });
    expect(tallyFor(state, "h1")).toBeUndefined();
    expect(state.editedAt).toBeTypeOf("string");
  });

  it("rout threshold is a quarter of the starting models, rounded up", () => {
    expect(routThreshold(9)).toBe(3);
    expect(routThreshold(8)).toBe(2);
    expect(routThreshold(3)).toBe(1);
    expect(routThreshold(12)).toBe(3);
  });
});

it("persists staff forfeiture and consumption independently for each warrior and combat phase", () => {
  const initial = emptyBattleLiveState();
  expect(parseBattleLiveState({ turn: 2 }).serpentStaffUses).toEqual([]);
  const active = activateSerpentStaff(initial, "priest", "2:warband-a");
  expect(serpentStaffUse(active, "priest", "2:warband-a")?.used).toBe(false);
  const spent = consumeSerpentStaff(active, "priest", "2:warband-a");
  const restored = parseBattleLiveState(JSON.parse(JSON.stringify(spent)));
  expect(serpentStaffUse(restored, "priest", "2:warband-a")?.used).toBe(true);
  expect(activateSerpentStaff(restored, "priest", "2:warband-a")).toBe(restored);
  expect(serpentStaffUse(restored, "priest", "2:warband-b")).toBeUndefined();
  expect(serpentStaffUse(restored, "other-priest", "2:warband-a")).toBeUndefined();
  expect(initial.serpentStaffUses).toEqual([]);
});

it("distinguishes player combat phases and records deliberate staff corrections", () => {
  const turns = { round: 2, active_index: 0, turn_order: ['a', 'b'] };
  expect(combatPhaseKey(1, turns)).toBe('2:a');
  expect(combatPhaseKey(1, { ...turns, active_index: 1 })).toBe('2:b');
  expect(combatPhaseKey(3, null)).toBe('legacy:3');
  const active = activateSerpentStaff(emptyBattleLiveState(), 'priest', '2:a', 'Priest');
  expect(active.rollAttempts[0].label).toContain('awakens');
  expect(correctSerpentStaff(active, 'priest', '2:a', 'Priest', ' ')).toBe(active);
  const corrected = correctSerpentStaff(consumeSerpentStaff(active, 'priest', '2:a'), 'priest', '2:a', 'Priest', 'Wrong warrior selected');
  expect(corrected.serpentStaffUses).toEqual([]);
  expect(corrected.rollAttempts[1].rolls[0]).toContain('after its attack was marked used');
  expect(corrected.rollAttempts[1].rolls[0]).toContain('Wrong warrior selected');
});

it('keeps a recorded Stupidity failure through opponents’ turns and clears its effect on the next own turn', async () => {
  const { warbandTurnKey, failedStupidityThisTurn, recordStupidityResult } = await import('../battle');
  const order = ['first', 'mine', 'last'];
  const key = (round: number, active_index: number) => warbandTurnKey('mine', round, { round, active_index, turn_order: order });
  const initial = emptyBattleLiveState();
  const failed = recordStupidityResult(initial, 'wizard', key(1, 1), 'Wizard', true);
  const saved = parseBattleLiveState(JSON.parse(JSON.stringify(failed)));
  expect(failedStupidityThisTurn(saved, 'wizard', key(1, 1))).toBe(true);
  expect(failedStupidityThisTurn(saved, 'wizard', key(1, 2))).toBe(true);
  expect(failedStupidityThisTurn(saved, 'wizard', key(2, 0))).toBe(true);
  expect(failedStupidityThisTurn(saved, 'wizard', key(2, 1))).toBe(false);
  expect(failedStupidityThisTurn(saved, 'other', key(1, 1))).toBe(false);
  expect(recordStupidityResult(saved, 'wizard', key(1, 1), 'Wizard', true)).toBe(saved);
  const corrected = recordStupidityResult(saved, 'wizard', key(1, 1), 'Wizard', false);
  expect(failedStupidityThisTurn(corrected, 'wizard', key(1, 1))).toBe(false);
  expect(corrected.rollAttempts).toHaveLength(2);
  expect(corrected.rollAttempts[0].rolls[0]).toContain('Recorded by the player');
  expect(corrected.rollAttempts[1].rolls[0]).toContain('No new dice roll is implied');
  expect(initial.stupidityResults).toEqual([]);
  expect(parseBattleLiveState({ turn: 1 }).stupidityResults).toEqual([]);
  expect(warbandTurnKey('mine', 3)).toBe('legacy:3');
});
