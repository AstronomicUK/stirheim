import { describe, expect, it } from "vitest";
import { battleTotals, emptyBattleLiveState, parseBattleLiveState, routThreshold, tallyFor, withTally } from "../battle";

describe("battle live state", () => {
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
