import { describe, expect, it } from "vitest";
import { emptyBattleLiveState } from "../battle";
import { activeBolasEntanglements, resolveBolasRecovery, applyBattleEvents, attackRollsLine, attackSummary, eventContribution, type AttackEventPayload, type BattleEventRow } from "../battleEvent";

const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "aaaaaaaa-0000-4000-8000-000000000002";

function attack(over: Partial<AttackEventPayload> = {}, reverted = false): BattleEventRow {
  const payload: AttackEventPayload = {
    attacker_warband_id: A,
    attacker_id: "captain",
    attacker_kind: "hero",
    attacker_name: "Captain",
    nurgles_rot: false,
    target_warband_id: B,
    target_id: "skritch",
    target_kind: "hero",
    target_name: "Skritch",
    target_size: 1,
    wounds_lost: 1,
    out_of_action: true,
    kill: true,
    outcome: "Out of action",
    turn: 2,
    rolls: [],
    ...over,
  };
  return {
    id: crypto.randomUUID(),
    match_id: "eeeeeeee-0000-4000-8000-000000000001",
    actor_id: "11111111-1111-4111-8111-111111111111",
    actor_warband_id: A,
    at: "2026-09-05T10:00:00.000Z",
    kind: "attack",
    payload,
    summary: attackSummary(payload),
    reverted_at: reverted ? "2026-09-05T10:05:00.000Z" : null,
    reverted_by: null,
    revert_note: null,
  };
}

describe("applyBattleEvents", () => {
  it("credits the attacker's warband with the kill and the target's warband with the casualty", () => {
    const e = attack();
    const mine = applyBattleEvents(emptyBattleLiveState(), [e], A);
    expect(mine.tallies).toEqual([{ id: "captain", kind: "hero", enemiesOutOfAction: 1, outOfAction: 0, woundsLost: 0, note: "" }]);
    const theirs = applyBattleEvents(emptyBattleLiveState(), [e], B);
    expect(theirs.tallies).toEqual([{ id: "skritch", kind: "hero", enemiesOutOfAction: 0, outOfAction: 1, woundsLost: 1, note: "" }]);
  });

  it("henchman attackers earn no kill; group targets count models out, capped at the group size", () => {
    const e1 = attack({ attacker_kind: "group", attacker_id: "verminkin", target_kind: "group", target_id: "watch", target_size: 2 });
    const e2 = attack({ attacker_kind: "group", attacker_id: "verminkin", target_kind: "group", target_id: "watch", target_size: 2 });
    const e3 = attack({ attacker_kind: "group", attacker_id: "verminkin", target_kind: "group", target_id: "watch", target_size: 2 });
    expect(applyBattleEvents(emptyBattleLiveState(), [e1], A).tallies).toEqual([]);
    const theirs = applyBattleEvents(emptyBattleLiveState(), [e1, e2, e3], B);
    expect(theirs.tallies[0]).toMatchObject({ id: "watch", kind: "group", outOfAction: 2, woundsLost: 3 });
  });

  it("wounds without an out-of-action only add to Wounds lost; reverted events are ignored; the stored sheet is untouched", () => {
    const sheet = emptyBattleLiveState();
    const wound = attack({ out_of_action: false, kill: false, outcome: "Knocked down", wounds_lost: 1 });
    const theirs = applyBattleEvents(sheet, [wound, attack({}, true)], B);
    expect(theirs.tallies[0]).toMatchObject({ outOfAction: 0, woundsLost: 1 });
    expect(sheet.tallies).toEqual([]);
    expect(applyBattleEvents(sheet, [attack({}, true)], B)).toBe(sheet);
  });

  it("stacks on top of the player's own tallies", () => {
    const sheet = { ...emptyBattleLiveState(), tallies: [{ id: "captain", kind: "hero" as const, enemiesOutOfAction: 1, outOfAction: 0, woundsLost: 0, note: "" }] };
    expect(applyBattleEvents(sheet, [attack()], A).tallies[0].enemiesOutOfAction).toBe(2);
    expect(eventContribution([attack(), attack({}, true)], A, "captain")).toEqual({ kills: 1, woundsLost: 0, outOfAction: 0 });
    expect(eventContribution([attack()], B, "skritch")).toEqual({ kills: 0, woundsLost: 1, outOfAction: 1 });
  });

  it("writes a plain summary line", () => {
    expect(attackSummary(attack().payload)).toBe("Turn 2: Captain took Skritch out of action.");
    expect(attackSummary(attack({ out_of_action: false, kill: false, outcome: "Stunned" }).payload)).toBe("Turn 2: Captain wounded Skritch (stunned).");
    expect(attackSummary(attack({ out_of_action: false, kill: false, wounds_lost: 0, outcome: "Missed" }).payload)).toBe("Turn 2: Captain missed Skritch.");
  });

  it("condenses every roll of the walk-through onto one line", () => {
    expect(attackRollsLine(attack().payload)).toBe("");
    const rolls = ["Sword: rolled 5 to hit. Hit.", "To wound: rolled 4. Wounded.", "Armour save: rolled 2. Failed.", "Injury: rolled 45. Out of action."];
    expect(attackRollsLine(attack({ rolls }).payload)).toBe(rolls.join(" "));
  });
});

describe("who took whom out", () => {
  it("a logged kill names the attacker on the target's sheet; a hero keeps one entry, a group one per model", () => {
    const hero = applyBattleEvents(emptyBattleLiveState(), [attack()], B);
    expect(hero.takenOutBy.skritch).toEqual([{ warbandId: A, modelId: "captain", name: "Captain", turn: 2 }]);
    const group = applyBattleEvents(
      emptyBattleLiveState(),
      [attack({ target_id: "verminkin", target_kind: "group", target_name: "Verminkin", target_size: 4 }), attack({ target_id: "verminkin", target_kind: "group", target_name: "Verminkin", target_size: 4, attacker_id: "champ", attacker_name: "Marta", turn: 3 })],
      B,
    );
    expect(group.takenOutBy.verminkin?.map((b) => b.name)).toEqual(["Captain", "Marta"]);
    // The attacker's own sheet records nothing about it; a reverted kill counts for nothing.
    expect(applyBattleEvents(emptyBattleLiveState(), [attack()], A).takenOutBy).toEqual({});
    expect(applyBattleEvents(emptyBattleLiveState(), [attack({}, true)], B).takenOutBy).toEqual({});
  });
});


it('derives entanglement across turns, removes reverted events and restores only current throws on Recovery', () => {
  const first = attack({ entangled: true, wounds_lost: 0, out_of_action: false, kill: false });
  expect(attackSummary(first.payload)).toBe("Turn 2: Captain entangled Skritch with Bolas.");
  const later = attack({ entangled: true, wounds_lost: 0, out_of_action: false, kill: false, turn: 4 });
  const group = attack({ entangled: true, target_kind: 'group', target_size: 3 });
  const reverted = { ...first, id: crypto.randomUUID(), reverted_at: first.at };
  expect(activeBolasEntanglements([first, group, reverted], B)).toEqual([first]);
  expect(activeBolasEntanglements([first], A)).toEqual([]);
  const initial = emptyBattleLiveState();
  const failed = resolveBolasRecovery(initial, [first], 'skritch', 'Skritch', 3);
  expect(activeBolasEntanglements([first], B, failed.bolasRecoveredEventIds)).toHaveLength(1);
  const freed = resolveBolasRecovery(failed, [first], 'skritch', 'Skritch', 4, 2);
  expect(activeBolasEntanglements([first, later], B, freed.bolasRecoveredEventIds)).toEqual([later]);
  expect(freed.rollAttempts[1].rolls[0]).toContain('App rolled 2; player changed it to 4');
  expect(initial.bolasRecoveredEventIds).toEqual([]);
  expect(() => resolveBolasRecovery(initial, [first], 'skritch', 'Skritch', 7)).toThrow(/D6/);
})
