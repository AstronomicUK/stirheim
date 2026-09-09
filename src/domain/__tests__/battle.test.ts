import { describe, expect, it } from "vitest";
import { battleTotals, emptyBattleLiveState, parseBattleLiveState, routThreshold, tallyFor, withTally, withRollAttempt, type RollAttempt } from "../battle";

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
