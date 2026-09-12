import { activeFires, warriorIsBurning, pendingFireHits, recordFireRecovery } from '../burning'
import { nextOwnTurnKey, smokeEventsThisTurn, smokeBlocksWarrior, recordSmokeTest } from '../firepotSmoke'
import { warbandTurnKey, battleLiveStateSchema } from '../battle'
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


it('requires an explained repeat Recovery attempt in the same own turn', () => {
  const event = attack({ entangled: true, target_size: 1, out_of_action: false, wounds_lost: 0, kill: false });
  const failed = resolveBolasRecovery(emptyBattleLiveState(), [event], 'skritch', 'Skritch', 1, undefined, 2, { turnKey: 'own:2', attemptId: 'a' });
  expect(() => resolveBolasRecovery(failed, [event], 'skritch', 'Skritch', 6, undefined, 2, { turnKey: 'own:2', attemptId: 'b' })).toThrow(/another Recovery/);
  expect(resolveBolasRecovery(failed, [event], 'skritch', 'Skritch', 6, undefined, 3, { turnKey: 'own:3', attemptId: 'c' }).bolasRecoveredEventIds).toEqual([event.id]);
  const correction = resolveBolasRecovery(failed, [event], 'skritch', 'Skritch', 6, 1, 2, { turnKey: 'own:2', attemptId: 'b', reason: 'Agreed correction' });
  expect(correction.rollAttempts[1].rolls.join(' ')).toContain('Agreed correction');
})


it('Firepot smoke tests in the next own turn and expires at the following own turn',()=>{
 const turns={round:1,active_index:0,turn_order:[A,B]}
 const due=nextOwnTurnKey(warbandTurnKey(B,1,turns))
 expect(due).toBe(`${B}:1`)
 const event=attack({smokeDueTurnKey:due,wounds_lost:0,out_of_action:false,kill:false})
 expect(attackSummary(event.payload)).toContain('Firepot smoke')
 expect(smokeEventsThisTurn([event],B,warbandTurnKey(B,1,turns))).toEqual([])
 const own=warbandTurnKey(B,1,{...turns,active_index:1})
 expect(smokeEventsThisTurn([event],B,own)).toEqual([event])
 const failed=recordSmokeTest(emptyBattleLiveState(),event,own,3,3,1,'attempt')
 expect(smokeBlocksWarrior(failed,[event],'skritch',own)).toBe(true)
 expect(smokeBlocksWarrior(failed,[event],'skritch',warbandTurnKey(B,2,{...turns,round:2}))).toBe(true)
 expect(smokeBlocksWarrior(failed,[event],'skritch',warbandTurnKey(B,2,{...turns,round:2,active_index:1}))).toBe(false)
 expect(smokeBlocksWarrior(failed,[{...event,reverted_at:'reverted'}],'skritch',own)).toBe(false)
 expect(battleLiveStateSchema.parse(failed).smokeTests[0].failed).toBe(true)
 expect(JSON.stringify(failed.rollAttempts)).toContain('player changed it to 3')
})
it('smoke rolls use strict under-Initiative, retain app dice and require reasons for replacement',()=>{
 const event=attack({smokeDueTurnKey:'legacy:2',out_of_action:false})
 const initial=emptyBattleLiveState()
 const pending=recordSmokeTest(initial,event,'legacy:2',3,2,2,'attempt','',true)
 expect(pending.smokeTests[0].originalDie).toBe(2)
 expect(smokeBlocksWarrior(pending,[event],'skritch','legacy:2')).toBe(false)
 const passed=recordSmokeTest(pending,event,'legacy:2',3,2,2,'attempt')
 expect(passed.smokeTests[0].failed).toBe(false)
 expect(()=>recordSmokeTest(passed,event,'legacy:2',3,1,undefined,'other')).toThrow(/Explain/)
 expect(recordSmokeTest(passed,event,'legacy:2',9,6,undefined,'other','Agreed correction').smokeTests[0].failed).toBe(true)
 expect(()=>recordSmokeTest(initial,{...event,payload:{...event.payload,target_size:3}},'legacy:2',3,1,undefined,'a')).toThrow(/individually/)
 expect(()=>recordSmokeTest(initial,event,'legacy:1',3,1,undefined,'a')).toThrow(/not due/)
})


const fireOptions = { id: 'fire-test', warbandId: B, warriorId: 'skritch', warriorName: 'Skritch', actorId: 'skritch', actorName: 'Skritch', turnKey: 'own:2', die: 4 }
it('fire recovery clears recorded ignitions but a later fire remains, and reverted fire disappears', () => {
 const e = attack({ targetOnFire: true, out_of_action: false, wounds_lost: 0 })
 expect(warriorIsBurning(emptyBattleLiveState(), [e], B, 'skritch')).toBe(true)
 const out = recordFireRecovery(emptyBattleLiveState(), [e], fireOptions)
 expect(activeFires(out, [e], B)).toEqual([])
 const later = attack({ targetOnFire: true, out_of_action: false })
 expect(activeFires(out, [e, later], B)).toEqual([later])
 expect(activeFires(emptyBattleLiveState(), [{ ...e, reverted_at: 'now' }], B)).toEqual([])
 expect(battleLiveStateSchema.parse(out).fireRecoveryTests[0].confirmed).toBe(true)
})
it('a failed own test owes one hit, unlike failed help; successful help does not erase damage already owed', () => {
 const e = attack({ targetOnFire: true, out_of_action: false })
 const failed = recordFireRecovery(emptyBattleLiveState(), [e], { ...fireOptions, die: 2 })
 expect(pendingFireHits(failed, [e])).toHaveLength(1)
 const helped = recordFireRecovery(failed, [e], { ...fireOptions, id: 'help', actorId: 'helper', actorName: 'Helper', die: 6 })
 expect(activeFires(helped, [e], B)).toEqual([]); expect(pendingFireHits(helped, [e])).toHaveLength(1)
 const damage = attack({ fireRecoveryId: 'fire-test' })
 expect(pendingFireHits(helped, [e, damage])).toEqual([])
 expect(pendingFireHits(helped, [e, { ...damage, reverted_at: 'now' }])).toHaveLength(1)
 expect(pendingFireHits(failed, [{ ...e, reverted_at: 'now' }])).toEqual([])
 const helperFailed = recordFireRecovery(emptyBattleLiveState(), [e], { ...fireOptions, actorId: 'helper', die: 1 })
 expect(pendingFireHits(helperFailed, [e])).toEqual([])
})
it('keeps pending app rolls through confirmation and requires an explanation for repeat tests', () => {
 const e = attack({ targetOnFire: true, out_of_action: false })
 const pending = recordFireRecovery(emptyBattleLiveState(), [e], { ...fireOptions, die: 2, originalDie: 2, pending: true })
 expect(activeFires(pending, [e], B)).toHaveLength(1); expect(pendingFireHits(pending, [e])).toEqual([])
 const confirmed = recordFireRecovery(pending, [e], { ...fireOptions, die: 4 })
 expect(confirmed.rollAttempts.at(-1)?.rolls.join(' ')).toContain('App rolled 2; player changed it to 4')
 expect(() => recordFireRecovery(confirmed, [e], { ...fireOptions, id: 'again' })).toThrow(/corrected/)
 const corrected = recordFireRecovery(confirmed, [e], { ...fireOptions, die: 1, reason: 'Agreed correction' })
 expect(activeFires(corrected, [e], B)).toHaveLength(1)
 expect(pendingFireHits(corrected, [e])).toHaveLength(1)
 expect(() => recordFireRecovery(pending, [e], { ...fireOptions, originalDie: 5 })).toThrow(/original app roll/)
 expect(() => recordFireRecovery(emptyBattleLiveState(), [attack({ targetOnFire: true, out_of_action: false, target_size: 3 })], fireOptions)).toThrow(/individually/)
})

it('tracks every Cathayan backfire independently and respects both reversals', async () => {
 const { pendingVolatileBackfires } = await import('../volatileBackfire')
 const source = attack({ volatileBackfires: 2, out_of_action: false, wounds_lost: 0 })
 const pending = pendingVolatileBackfires([source], A)
 expect(pending).toHaveLength(2)
 expect(pendingVolatileBackfires([source], B)).toEqual([])
 const damage = attack({ volatileBackfireKey: pending[0].key })
 expect(pendingVolatileBackfires([source, damage], A).map(h => h.key)).toEqual([pending[1].key])
 expect(pendingVolatileBackfires([source, { ...damage, reverted_at: 'now' }], A)).toHaveLength(2)
 expect(pendingVolatileBackfires([{ ...source, reverted_at: 'now' }, damage], A)).toEqual([])
})
