import { describe, expect, it } from "vitest";
import { probabilityAtLeast, IMPOSSIBLE } from "../dice";
import { meleeToHitThreshold, rangedToHitBaseThreshold } from "../toHit";
import { toWoundThreshold } from "../toWound";
import { armourSaveThreshold } from "../armourSave";
import { injuryDistribution } from "../injury";
import { critDistribution } from "../crit";
import { resolveSingleAttack, type AttackInput } from "../resolveAttack";
import { resolveTurn } from "../turnAggregate";
import type { SingleAttackBreakdown } from "../resolveAttack";
import { buildAttackInput, computeAttackCount, computeMaxParries, parrySuccessProbability, totalAttackCount } from "../buildAttackInput";
import { resolveCharacterTurn } from "../combat";
import { injuryDistributionForWounds } from "../injury";
import { parryRerollFromItems } from "../../domain/opponentScenario";
import { findWeapon } from "../../data/weapons";
import type { Armour, Character, CombatContext, DefenderProfile, Weapon } from "../../types";
import { defaultHouseRules } from "../../types";

function W(id: string): Weapon {
  const weapon = findWeapon(id);
  if (!weapon) throw new Error(`test: no weapon ${id}`);
  return weapon;
}

describe("dice — natural 1 fails / natural 6 succeeds convention", () => {
  it("threshold 4 gives 3/6", () => {
    expect(probabilityAtLeast(4)).toBeCloseTo(3 / 6, 10);
  });
  it("threshold <=1 gives 5/6 (natural 1 still always fails)", () => {
    expect(probabilityAtLeast(1)).toBeCloseTo(5 / 6, 10);
    expect(probabilityAtLeast(0)).toBeCloseTo(5 / 6, 10);
    expect(probabilityAtLeast(-3)).toBeCloseTo(5 / 6, 10);
  });
  it("IMPOSSIBLE is always 0", () => {
    expect(probabilityAtLeast(IMPOSSIBLE)).toBe(0);
  });
});

describe("hand-checkable table lookups (brief §9)", () => {
  it("WS4 vs WS4 needs a 4+", () => {
    expect(meleeToHitThreshold(4, 4)).toBe(4);
  });
  it("S3 vs T3 needs a 4+", () => {
    expect(toWoundThreshold(3, 3)).toBe(4);
  });
  it("BS4 needs a 3+ at close range", () => {
    expect(rangedToHitBaseThreshold(4)).toBe(3);
  });
  it("S1 vs T5 cannot wound at all", () => {
    expect(toWoundThreshold(1, 5)).toBe(IMPOSSIBLE);
  });
  it("light armour is a 6+ save, heavy 5+, gromril 4+", () => {
    expect(armourSaveThreshold({ type: "light", shield: false, buckler: false }, 3)).toBe(6);
    expect(armourSaveThreshold({ type: "heavy", shield: false, buckler: false }, 3)).toBe(5);
    expect(armourSaveThreshold({ type: "gromril", shield: false, buckler: false }, 3)).toBe(4);
  });
  it("shield alone (no armour) is a 6+ save", () => {
    expect(armourSaveThreshold({ type: "none", shield: true, buckler: false }, 3)).toBe(6);
  });
  it("shield improves worn armour by 1", () => {
    expect(armourSaveThreshold({ type: "light", shield: true, buckler: false }, 3)).toBe(5);
  });
  it("no armour, no shield = no save", () => {
    expect(armourSaveThreshold({ type: "none", shield: false, buckler: false }, 3)).toBe(IMPOSSIBLE);
  });
  it("Strength-vs-armour house rule is off by default (armour unaffected by attacker Strength)", () => {
    expect(armourSaveThreshold({ type: "heavy", shield: false, buckler: false }, 9)).toBe(5);
  });
});

describe("injury chart (brief §4.4)", () => {
  it("standard chart splits 1-2/3-4/5-6 evenly with no modifier", () => {
    const dist = injuryDistribution({ injuryRollModifier: 0, concussion: false, trueGrit: false, hardToKill: false });
    expect(dist.knockedDown).toBeCloseTo(1 / 3, 10);
    expect(dist.stunned).toBeCloseTo(1 / 3, 10);
    expect(dist.outOfAction).toBeCloseTo(1 / 3, 10);
  });
  it("Hammer/Concussion remaps to 1 KD / 2-4 Stunned / 5-6 OOA", () => {
    const dist = injuryDistribution({ injuryRollModifier: 0, concussion: true, trueGrit: false, hardToKill: false });
    expect(dist.knockedDown).toBeCloseTo(1 / 6, 10);
    expect(dist.stunned).toBeCloseTo(3 / 6, 10);
    expect(dist.outOfAction).toBeCloseTo(2 / 6, 10);
  });
  it("+2 injury modifier shifts the whole distribution up", () => {
    // roll+2: 3,4,5,6,7,8 against standard [2,4] bands -> KD 0, Stunned rolls 1-2 (->3,4), OOA rolls 3-6 (->5,6,7,8)
    const dist = injuryDistribution({ injuryRollModifier: 2, concussion: false, trueGrit: false, hardToKill: false });
    expect(dist.knockedDown).toBeCloseTo(0, 10);
    expect(dist.stunned).toBeCloseTo(2 / 6, 10);
    expect(dist.outOfAction).toBeCloseTo(4 / 6, 10);
  });
});

describe("critical hit tables (brief §4.5/§4.6) sum to 1", () => {
  it.each(["standard", "missile", "bludgeoning", "bladed", "unarmed", "thrusting"] as const)("%s table", (table) => {
    const total = critDistribution(table, 0).reduce((sum, { probability }) => sum + probability, 0);
    expect(total).toBeCloseTo(1, 10);
  });
});

describe("resolveSingleAttack — hand-verified case: WS4 vs WS4, S4 vs T4, no armour, standard crits", () => {
  const input: AttackInput = {
    hitThreshold: 4,
    woundThreshold: 4,
    armourThreshold: IMPOSSIBLE,
    injuryRollModifier: 0,
    concussion: false,
    trueGrit: false,
    hardToKill: false,
    critTriggerFaces: [6],
    critTable: "standard",
    critTableRollModifier: 0,
    parryEligible: false,
    parrySuccessProbGivenAttempt: 0,
  };

  it("matches hand-derived joint probabilities", () => {
    const result = resolveSingleAttack(input);
    expect(result.pHit).toBeCloseTo(1 / 2, 10);
    expect(result.pWound).toBeCloseTo(1 / 4, 10);
    expect(result.pWoundTriggerEligible).toBeCloseTo(1 / 12, 10);
    expect(result.pWoundNormal).toBeCloseTo(1 / 6, 10);
  });

  it("matches hand-derived normal/crit outcome distributions", () => {
    const result = resolveSingleAttack(input);
    expect(result.normalOutcome.knockedDown).toBeCloseTo(1 / 3, 10);
    expect(result.normalOutcome.stunned).toBeCloseTo(1 / 3, 10);
    expect(result.normalOutcome.outOfAction).toBeCloseTo(1 / 3, 10);

    // Every standard crit result doubles the wound -> two Injury rolls, highest applies (01:770):
    // vital part / exposed spot: KD 1/9, Stunned 3/9, OOA 5/9; master strike (+2): KD 0, Stunned 1/9, OOA 8/9.
    expect(result.critOutcome.knockedDown).toBeCloseTo(2 / 27, 10);
    expect(result.critOutcome.stunned).toBeCloseTo(7 / 27, 10);
    expect(result.critOutcome.outOfAction).toBeCloseTo(2 / 3, 10);
  });

  it("A=1 full-turn OOA probability matches hand calculation (1/9)", () => {
    // normal wound 1/6 * OOA 1/3 = 1/18; crit 1/12 * OOA 2/3 = 1/18.
    const attack = resolveSingleAttack(input);
    const turn = resolveTurn([attack]);
    expect(turn.outOfActionProbability).toBeCloseTo(1 / 9, 10);
    const sum = turn.distribution.none + turn.distribution.knockedDown + turn.distribution.stunned + turn.distribution.outOfAction;
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe("turnAggregate — one-crit-per-phase consumption, synthetic A=2 case", () => {
  // Deliberately synthetic (not run through resolveSingleAttack) to isolate the DP logic:
  // each attack has a 30% chance of a "normal" wound (always -> OOA, via autoOOA), a 20% chance of
  // a trigger-eligible wound, and 50% chance of nothing. A trigger-eligible wound that becomes THE
  // crit resolves to guaranteed Stunned (an Injury remap whose Stunned band covers every face); if
  // the crit was already consumed by an earlier attack, it instead resolves like a normal wound
  // (guaranteed OOA). This makes the two code paths in turnAggregate produce different,
  // hand-checkable results.
  const baseInjury = { injuryRollModifier: 0, concussion: false, trueGrit: false, hardToKill: false };
  const alwaysStunned = { ...baseInjury, trueGrit: true, remap: [0, 6] as [number, number] };
  const attack: SingleAttackBreakdown = {
    pHit: 1,
    pWound: 0.5,
    pWoundNormal: 0.3,
    pWoundTriggerEligible: 0.2,
    normalEvents: [{ probability: 1, wounds: 1, injury: baseInjury, autoOOA: true, minSeverityKnockedDown: false }],
    critEvents: [{ probability: 1, wounds: 1, injury: alwaysStunned, autoOOA: false, minSeverityKnockedDown: false }],
    normalOutcome: { none: 0, knockedDown: 0, stunned: 0, outOfAction: 1 },
    critOutcome: { none: 0, knockedDown: 0, stunned: 1, outOfAction: 0 },
    pRicochetGivenCritConsumedHere: 0,
    parryEligible: false,
    parrySuccessProbGivenAttempt: 0,
  };

  it("A=1 baseline", () => {
    const turn = resolveTurn([attack]);
    // 0.3 always -> OOA, 0.2 becomes the crit -> Stunned, 0.5 -> none
    expect(turn.distribution.none).toBeCloseTo(0.5, 10);
    expect(turn.distribution.stunned).toBeCloseTo(0.2, 10);
    expect(turn.distribution.outOfAction).toBeCloseTo(0.3, 10);
  });

  it("A=2 identical attacks: only the FIRST trigger-eligible wound gets the crit (hand-derived: none=0.25, stunned=0.20, OOA=0.55)", () => {
    const turn = resolveTurn([attack, attack]);
    expect(turn.distribution.none).toBeCloseTo(0.25, 10);
    expect(turn.distribution.knockedDown).toBeCloseTo(0, 10);
    expect(turn.distribution.stunned).toBeCloseTo(0.2, 10);
    expect(turn.distribution.outOfAction).toBeCloseTo(0.55, 10);
    const sum = turn.distribution.none + turn.distribution.knockedDown + turn.distribution.stunned + turn.distribution.outOfAction;
    expect(sum).toBeCloseTo(1, 10);
  });

  it("A=2 with different weapons (heterogeneous attacks) still conserves probability mass and only consumes one crit", () => {
    const secondWeaponAttack: SingleAttackBreakdown = {
      ...attack,
      pWoundNormal: 0.1,
      pWoundTriggerEligible: 0.4,
      pWound: 0.5,
    };
    const turn = resolveTurn([attack, secondWeaponAttack]);
    const sum = turn.distribution.none + turn.distribution.knockedDown + turn.distribution.stunned + turn.distribution.outOfAction;
    expect(sum).toBeCloseTo(1, 10);
    // Sanity: taking the crit away entirely (both resolve as if already consumed) would strictly
    // increase OOA vs the real (crit-aware) result, since here critOutcome is less lethal than
    // normalOutcome — so the real OOA probability must be strictly less than if every
    // trigger-eligible wound were (incorrectly) resolved as a guaranteed-OOA normal wound.
    const naiveAllNormalOOA = 1 - (1 - attack.pWoundNormal - attack.pWoundTriggerEligible) * (1 - secondWeaponAttack.pWoundNormal - secondWeaponAttack.pWoundTriggerEligible);
    expect(turn.distribution.outOfAction).toBeLessThan(naiveAllNormalOOA);
  });
});

function testContext(overrides: Partial<CombatContext> = {}): CombatContext {
  return {
    charging: false,
    fightingMultiple: false,
    movedThisTurn: false,
    cover: false,
    longRange: false,
    largeTarget: false,
    critMode: "standard",
    vsHatedEnemy: false,
    firstTurnOfCombat: false,
    insideBuildings: false,
    ...overrides,
  };
}

function testCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: "test",
    name: "Test",
    warband: "Test",
    role: "hero",
    stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
    equippedWeapons: [],
    armour: { type: "none", shield: false, buckler: false },
    helmet: false,
    skills: [],
    traits: [],
    wardSaveThreshold: null,
    notes: "",
    ...overrides,
  };
}

function testWeapon(overrides: Partial<Weapon> = {}): Weapon {
  return {
    id: "test_weapon",
    name: "Test Weapon",
    type: "melee",
    strength: "user",
    critCategory: "bladed",
    concussion: false,
    special: [],
    rangedProfile: null,
    ...overrides,
  };
}

function testDefender(overrides: Partial<DefenderProfile> = {}): DefenderProfile {
  return {
    WS: 4,
    T: 3,
    S: 3,
    W: 1,
    armour: { type: "none", shield: false, buckler: false },
    helmet: false,
    activeSkillIds: [],
    activeTraitIds: [],
    parryWeaponCount: 0,
    parryReroll: false,
    wardSaveThreshold: null,
    ...overrides,
  };
}

describe("Frenzy (mordheimer.net): doubles Attacks in melee, off-hand +1 not doubled", () => {
  it("doubles the primary weapon's Attacks-derived count", () => {
    const frenzied = testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 2, Ld: 7 }, traits: ["frenzy"] });
    const normal = testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 2, Ld: 7 } });
    const weapon = testWeapon();
    expect(computeAttackCount(frenzied, weapon, true, testContext())).toBe(4);
    expect(computeAttackCount(normal, weapon, true, testContext())).toBe(2);
  });

  it("does not double the off-hand weapon's flat +1", () => {
    const frenzied = testCharacter({ traits: ["frenzy"] });
    const weapon = testWeapon();
    expect(computeAttackCount(frenzied, weapon, false, testContext())).toBe(1);
  });

  it("does not apply to ranged weapons (frenzy is a hand-to-hand rule)", () => {
    const frenzied = testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 2, Ld: 7 }, traits: ["frenzy"] });
    const bow = testWeapon({ type: "ranged", strength: 3, rangedProfile: { shortRange: 16, maxRange: 24, shotsPerTurn: 1 } });
    expect(computeAttackCount(frenzied, bow, true, testContext())).toBe(1);
  });
});

describe("Parry (mordheimer.net): success probability", () => {
  it("base rule (strict beat, no reroll): hand-derived average for hitThreshold=4 is 1/6", () => {
    // Winning faces {4,5,6}; P(beat) = (6-f)/6 -> 2/6, 1/6, 0 -> average 1/6.
    expect(parrySuccessProbability(4, false, false)).toBeCloseTo(1 / 6, 10);
  });

  it("Master of Blades (beats-or-matches): hand-derived average for hitThreshold=4 is 1/3", () => {
    // P(beat-or-match) = (7-f)/6 -> 3/6, 2/6, 1/6 -> average (3+2+1)/18 = 6/18 = 1/3.
    expect(parrySuccessProbability(4, true, false)).toBeCloseTo(1 / 3, 10);
  });

  it("reroll strictly increases success probability", () => {
    const withoutReroll = parrySuccessProbability(4, false, false);
    const withReroll = parrySuccessProbability(4, false, true);
    expect(withReroll).toBeGreaterThan(withoutReroll);
  });
});

describe("computeMaxParries (mordheimer.net Dwarf Axe / Master of Blades)", () => {
  it("no Parry weapons -> 0 attempts", () => {
    expect(computeMaxParries(testDefender({ parryWeaponCount: 0 }))).toBe(0);
  });
  it("one Parry weapon -> 1 attempt", () => {
    expect(computeMaxParries(testDefender({ parryWeaponCount: 1 }))).toBe(1);
  });
  it("two Parry weapons without Master of Blades -> still capped at 1 attempt", () => {
    expect(computeMaxParries(testDefender({ parryWeaponCount: 2 }))).toBe(1);
  });
  it("two Parry weapons WITH Master of Blades -> 2 attempts", () => {
    expect(computeMaxParries(testDefender({ parryWeaponCount: 2, activeSkillIds: ["master_of_blades"] }))).toBe(2);
  });
});

describe("Parry end-to-end: WS4 vs WS4 (hit on 4+), S3 vs T6 (wound 6, no crit possible), no armour, 1 Parry weapon", () => {
  // Hand-derived (see NOTES.md / session record for the full derivation):
  // pHit = 1/2, pWoundIfHit = 1/6 (S3 vs T6 needs a 6), pWoundNormal = 1/12, pWoundTriggerEligible = 0
  // (threshold==6 means the RAW "needed a 6 to wound" exception disables the crit trigger entirely).
  // parrySuccessProbGivenAttempt = 1/6 (hitThreshold=4, base rule).
  // Expected final distribution: none = 201/216, KD = Stunned = OOA = 5/216 each.
  it("matches the hand-derived distribution", () => {
    const attacker = testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 } });
    const weapon = testWeapon();
    const defender = testDefender({ WS: 4, T: 6, S: 3, parryWeaponCount: 1 });
    const input = buildAttackInput({ attacker, weapon, defender, context: testContext(), customSkills: [] });

    expect(input.hitThreshold).toBe(4);
    expect(input.woundThreshold).toBe(6);
    expect(input.parryEligible).toBe(true);
    expect(input.parrySuccessProbGivenAttempt).toBeCloseTo(1 / 6, 10);

    const attack = resolveSingleAttack(input);
    expect(attack.pWoundTriggerEligible).toBeCloseTo(0, 10);

    const maxParries = computeMaxParries(defender, []);
    expect(maxParries).toBe(1);

    const turn = resolveTurn([attack], maxParries);
    expect(turn.distribution.none).toBeCloseTo(201 / 216, 9);
    expect(turn.distribution.knockedDown).toBeCloseTo(5 / 216, 9);
    expect(turn.distribution.stunned).toBeCloseTo(5 / 216, 9);
    expect(turn.distribution.outOfAction).toBeCloseTo(5 / 216, 9);
    const sum = turn.distribution.none + turn.distribution.knockedDown + turn.distribution.stunned + turn.distribution.outOfAction;
    expect(sum).toBeCloseTo(1, 10);
  });

  it("cannot parry an attack from double-or-more Strength (mordheimer.net)", () => {
    const attacker = testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 6, T: 3, W: 1, I: 3, A: 1, Ld: 7 } });
    const weapon = testWeapon();
    const defender = testDefender({ S: 3, parryWeaponCount: 1 }); // attacker S(6) >= 2 * defender S(3)
    const input = buildAttackInput({ attacker, weapon, defender, context: testContext(), customSkills: [] });
    expect(input.parryEligible).toBe(false);
    expect(input.parrySuccessProbGivenAttempt).toBe(0);
  });

  it("Parry only applies to melee attacks", () => {
    const attacker = testCharacter();
    const bow = testWeapon({ type: "ranged", strength: 3, rangedProfile: { shortRange: 16, maxRange: 24, shotsPerTurn: 1 } });
    const defender = testDefender({ parryWeaponCount: 1 });
    const input = buildAttackInput({ attacker, weapon: bow, defender, context: testContext(), customSkills: [] });
    expect(input.parryEligible).toBe(false);
  });
});

describe("Hard to Kill / Hard Head (Dwarf racial traits, mordheimer.net)", () => {
  it("Hard to Kill remaps the Injury chart to 1-2 KD / 3-5 Stunned / 6 OOA", () => {
    const dist = injuryDistribution({ injuryRollModifier: 0, concussion: false, trueGrit: false, hardToKill: true });
    expect(dist.knockedDown).toBeCloseTo(2 / 6, 10);
    expect(dist.stunned).toBeCloseTo(3 / 6, 10);
    expect(dist.outOfAction).toBeCloseTo(1 / 6, 10);
  });

  it("Hard Head cancels Concussion regardless of the attacking weapon", () => {
    const attacker = testCharacter();
    const hammer = testWeapon({ critCategory: "bludgeoning", concussion: true });
    const defender = testDefender({ activeTraitIds: ["hard_head"] });
    const input = buildAttackInput({ attacker, weapon: hammer, defender, context: testContext(), customSkills: [] });
    expect(input.concussion).toBe(false);
  });

  it("Concussion still applies without Hard Head", () => {
    const attacker = testCharacter();
    const hammer = testWeapon({ critCategory: "bludgeoning", concussion: true });
    const defender = testDefender();
    const input = buildAttackInput({ attacker, weapon: hammer, defender, context: testContext(), customSkills: [] });
    expect(input.concussion).toBe(true);
  });
});

describe("Hatred (mordheimer.net): reroll to-hit misses on the first turn vs a hated enemy", () => {
  it("grants rerollToHit only when the vsHatedEnemy toggle is active", () => {
    const hater = testCharacter({ traits: ["hatred"] });
    const weapon = testWeapon();
    const defender = testDefender();
    const withoutToggle = buildAttackInput({ attacker: hater, weapon, defender, context: testContext(), customSkills: [] });
    const withToggle = buildAttackInput({ attacker: hater, weapon, defender, context: testContext({ vsHatedEnemy: true }), customSkills: [] });
    expect(withoutToggle.rerollToHit).toBe(false);
    expect(withToggle.rerollToHit).toBe(true);
  });

  it("does nothing without the Hatred trait", () => {
    const attacker = testCharacter();
    const weapon = testWeapon();
    const defender = testDefender();
    const input = buildAttackInput({ attacker, weapon, defender, context: testContext({ vsHatedEnemy: true }), customSkills: [] });
    expect(input.rerollToHit).toBe(false);
  });
});

describe("Ward saves (mordheimer.net): attempted after armour save + Step Aside, never eroded by Strength", () => {
  it("hand-derived: WS4vWS4 hit(4), S3vT6 wound(6, no crit possible), no armour, Ward 5+ -> none=1/3, KD=Stunned=OOA=2/9 each", () => {
    const attacker = testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 } });
    const weapon = testWeapon();
    const defender = testDefender({ WS: 4, T: 6, S: 3, wardSaveThreshold: 5 });
    const input = buildAttackInput({ attacker, weapon, defender, context: testContext(), customSkills: [] });
    expect(input.woundThreshold).toBe(6);

    const attack = resolveSingleAttack(input);
    expect(attack.pWoundTriggerEligible).toBeCloseTo(0, 10);
    expect(attack.normalOutcome.none).toBeCloseTo(1 / 3, 9);
    expect(attack.normalOutcome.knockedDown).toBeCloseTo(2 / 9, 9);
    expect(attack.normalOutcome.stunned).toBeCloseTo(2 / 9, 9);
    expect(attack.normalOutcome.outOfAction).toBeCloseTo(2 / 9, 9);
    const sum = attack.normalOutcome.none + attack.normalOutcome.knockedDown + attack.normalOutcome.stunned + attack.normalOutcome.outOfAction;
    expect(sum).toBeCloseTo(1, 10);
  });

  it("still applies even when a crit ignores the armour save entirely", () => {
    const attacker = testCharacter({ stats: { M: 4, WS: 6, BS: 3, S: 6, T: 3, W: 1, I: 3, A: 1, Ld: 7 } }); // guaranteed hit/wound vs a weak defender
    const weapon = testWeapon();
    const defenderNoWard = testDefender({ WS: 1, T: 1, S: 1 });
    const defenderWithWard = testDefender({ WS: 1, T: 1, S: 1, wardSaveThreshold: 2 }); // Ward 2+ = 5/6 save
    const inputNoWard = buildAttackInput({ attacker, weapon, defender: defenderNoWard, context: testContext(), customSkills: [] });
    const inputWithWard = buildAttackInput({ attacker, weapon, defender: defenderWithWard, context: testContext(), customSkills: [] });

    // "Hits an exposed spot" / "Master strike!" crit results ignore armour saves entirely — Ward should still cut into them.
    expect(inputNoWard.hitThreshold).toBeLessThanOrEqual(3);
    const noWard = resolveSingleAttack(inputNoWard);
    const withWard = resolveSingleAttack(inputWithWard);
    expect(withWard.critOutcome.none).toBeGreaterThan(noWard.critOutcome.none);
    expect(withWard.critOutcome.outOfAction).toBeLessThan(noWard.critOutcome.outOfAction);
  });
});

describe("Buckler vs Shield (mordheimer.net): distinct items", () => {
  it("a Buckler grants Parry eligibility with no armour-save bonus", () => {
    const attacker = testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 } });
    const weapon = testWeapon();
    const bucklerDefender = testDefender({ armour: { type: "none", shield: false, buckler: true }, parryWeaponCount: 1 });
    const input = buildAttackInput({ attacker, weapon, defender: bucklerDefender, context: testContext(), customSkills: [] });
    expect(input.parryEligible).toBe(true);
    expect(input.armourThreshold).toBe(IMPOSSIBLE); // buckler alone grants no save
  });
});

describe("Parry re-roll (01:846, 02:296, 02:308, 02:409)", () => {
  const armourNone = { type: "none" as const, shield: false, buckler: false };
  const bucklerOnly = { type: "none" as const, shield: false, buckler: true };
  it("two swords do NOT re-roll (01:846)", () => {
    expect(parryRerollFromItems([W("sword"), W("sword")], armourNone)).toBe(false);
  });
  it("buckler + sword re-rolls (01:846)", () => {
    expect(parryRerollFromItems([W("sword")], bucklerOnly)).toBe(true);
  });
  it("buckler alone (no Parry weapon) does not re-roll", () => {
    expect(parryRerollFromItems([W("axe")], bucklerOnly)).toBe(false);
  });
  it("Dwarf Axe + sword re-rolls; a lone Dwarf Axe does not (02:296)", () => {
    expect(parryRerollFromItems([W("dwarf_axe"), W("sword")], armourNone)).toBe(true);
    expect(parryRerollFromItems([W("dwarf_axe")], armourNone)).toBe(false);
  });
  it("Fighting Claws and an Iron Fist pair re-roll", () => {
    expect(parryRerollFromItems([W("fighting_claws")], armourNone)).toBe(true);
    expect(parryRerollFromItems([W("iron_fist"), W("iron_fist")], armourNone)).toBe(true);
    expect(parryRerollFromItems([W("iron_fist"), W("sword")], armourNone)).toBe(true);
    expect(parryRerollFromItems([W("iron_fist")], armourNone)).toBe(false);
  });
  it("the DefenderProfile flag drives the success probability", () => {
    const attacker = testCharacter();
    const weapon = testWeapon();
    const plain = buildAttackInput({ attacker, weapon, defender: testDefender({ parryWeaponCount: 2, parryReroll: false }), context: testContext(), customSkills: [] });
    const reroll = buildAttackInput({ attacker, weapon, defender: testDefender({ parryWeaponCount: 2, parryReroll: true }), context: testContext(), customSkills: [] });
    expect(plain.parrySuccessProbGivenAttempt).toBeCloseTo(parrySuccessProbability(4, false, false), 10);
    expect(reroll.parrySuccessProbGivenAttempt).toBeCloseTo(parrySuccessProbability(4, false, true), 10);
  });
  it("whips cannot be parried", () => {
    const input = buildAttackInput({ attacker: testCharacter(), weapon: W("steel_whip"), defender: testDefender({ parryWeaponCount: 1 }), context: testContext(), customSkills: [] });
    expect(input.parryEligible).toBe(false);
  });
});

describe("Weapon strengthBonus (mordheimer.net, e.g. double-handed weapons: 'As user +2')", () => {
  it("adds the bonus on top of the wielder's own Strength for wound resolution", () => {
    const attacker = testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 } });
    const plainWeapon = testWeapon({ strength: "user" });
    const bonusWeapon = testWeapon({ strength: "user", strengthBonus: 2 });
    const defender = testDefender({ T: 5 });
    const plainInput = buildAttackInput({ attacker, weapon: plainWeapon, defender, context: testContext(), customSkills: [] });
    const bonusInput = buildAttackInput({ attacker, weapon: bonusWeapon, defender, context: testContext(), customSkills: [] });
    // S3 vs T5 needs a 6; S5 (3+2) vs T5 needs a 4 — confirms the bonus actually reaches the To Wound lookup.
    expect(plainInput.woundThreshold).toBe(6);
    expect(bonusInput.woundThreshold).toBe(4);
  });
});

describe("Weapon saveModifier (mordheimer.net, e.g. a Gromril weapon's own extra -1 armour save)", () => {
  it("shifts the defender's armour save threshold up by the weapon's saveModifier", () => {
    const attacker = testCharacter();
    const plainWeapon = testWeapon();
    const gromrilWeapon = testWeapon({ saveModifier: 1 });
    const defender = testDefender({ armour: { type: "heavy", shield: false, buckler: false } });
    const plainInput = buildAttackInput({ attacker, weapon: plainWeapon, defender, context: testContext(), customSkills: [] });
    const gromrilInput = buildAttackInput({ attacker, weapon: gromrilWeapon, defender, context: testContext(), customSkills: [] });
    // Heavy armour alone is a 5+ save; the weapon's own -1 makes it a 6+.
    expect(plainInput.armourThreshold).toBe(5);
    expect(gromrilInput.armourThreshold).toBe(6);
  });

  it("cannot manufacture a save out of nothing (no armour stays IMPOSSIBLE)", () => {
    const attacker = testCharacter();
    const gromrilWeapon = testWeapon({ saveModifier: 1 });
    const defender = testDefender({ armour: { type: "none", shield: false, buckler: false } });
    const input = buildAttackInput({ attacker, weapon: gromrilWeapon, defender, context: testContext(), customSkills: [] });
    expect(input.armourThreshold).toBe(IMPOSSIBLE);
  });
});

describe("House Rules — Strength armour erosion toggle", () => {
  it("is off by default (armour unaffected by attacker Strength)", () => {
    const attacker = testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 8, T: 3, W: 1, I: 3, A: 1, Ld: 7 } });
    const weapon = testWeapon();
    const defender = testDefender({ armour: { type: "heavy", shield: false, buckler: false } });
    const input = buildAttackInput({ attacker, weapon, defender, context: testContext(), customSkills: [] });
    expect(input.armourThreshold).toBe(5);
  });

  it("erodes the save by strengthSaveErosion(S) when explicitly enabled", () => {
    const attacker = testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 8, T: 3, W: 1, I: 3, A: 1, Ld: 7 } });
    const weapon = testWeapon();
    const defender = testDefender({ armour: { type: "heavy", shield: false, buckler: false } });
    const input = buildAttackInput({
      attacker,
      weapon,
      defender,
      context: testContext(),
      customSkills: [],
      houseRules: { ...defaultHouseRules(), strengthArmourPiercing: true },
    });
    // Heavy armour is a 5+ save; Strength 8 erodes it by 5 (strengthSaveErosion(8) = 5) -> 10: no save is possible (01:734-752).
    expect(input.armourThreshold).toBe(IMPOSSIBLE);
  });

  it("a Strength 4 crossbow vs heavy armour is a 6+ save when the core rule is on (01:752 example)", () => {
    const input = buildAttackInput({
      attacker: testCharacter(),
      weapon: W("crossbow"),
      defender: testDefender({ armour: { type: "heavy", shield: false, buckler: false } }),
      context: testContext(),
      customSkills: [],
      houseRules: { ...defaultHouseRules(), strengthArmourPiercing: true },
    });
    expect(input.armourThreshold).toBe(6);
  });
});

describe("totalAttackCount", () => {
  it("sums attack counts across every equipped weapon in resolution order", () => {
    const attacker = testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 2, Ld: 7 } });
    const primary = testWeapon();
    const offHand = testWeapon({ id: "off_hand" });
    expect(totalAttackCount(attacker, [primary, offHand], testContext(), [])).toBe(3); // 2 (A) + 1 (off-hand flat bonus)
  });

  it("only counts weapons of the phase being simulated — a bow in a melee loadout is ignored, and a sword after a bow is still the melee primary", () => {
    const attacker = testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 2, Ld: 7 } });
    expect(totalAttackCount(attacker, [W("sword"), W("bow")], testContext(), [], "melee")).toBe(2);
    expect(totalAttackCount(attacker, [W("bow"), W("sword")], testContext(), [], "melee")).toBe(2);
    expect(totalAttackCount(attacker, [W("bow"), W("sword")], testContext(), [], "ranged")).toBe(1);
    const melee = resolveCharacterTurn(attacker, [W("sword"), W("bow")], testDefender(), testContext(), [], defaultHouseRules(), "melee");
    const swordOnly = resolveCharacterTurn(attacker, [W("sword")], testDefender(), testContext());
    expect(melee.outOfActionProbability).toBeCloseTo(swordOnly.outOfActionProbability, 12);
  });

  it("Fist is capped at one attack; a paired weapon gives the two-weapon +1 by itself; Whipcrack adds +1 on the charge", () => {
    const attacker = testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 3, Ld: 7 } });
    expect(computeAttackCount(attacker, W("unarmed"), true, testContext())).toBe(1);
    expect(computeAttackCount(testCharacter(), W("weeping_blades"), true, testContext())).toBe(2);
    expect(computeAttackCount(testCharacter(), W("steel_whip"), true, testContext())).toBe(1);
    expect(computeAttackCount(testCharacter(), W("steel_whip"), true, testContext({ charging: true }))).toBe(2);
  });
});

describe("Two-wound critical hits roll Injury twice, highest applies (01:770)", () => {
  it("injuryDistributionForWounds(2) is the max of two independent rolls", () => {
    const two = injuryDistributionForWounds({ injuryRollModifier: 0, concussion: false, trueGrit: false, hardToKill: false }, 2);
    expect(two.knockedDown).toBeCloseTo(1 / 9, 10);
    expect(two.stunned).toBeCloseTo(3 / 9, 10);
    expect(two.outOfAction).toBeCloseTo(5 / 9, 10);
  });

  it("standard chart, no armour: hand-derived crit OOA = (5/9 + 5/9 + 8/9) / 3", () => {
    const input = buildAttackInput({ attacker: testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 3, A: 1, Ld: 7 } }), weapon: testWeapon(), defender: testDefender(), context: testContext(), customSkills: [] });
    const attack = resolveSingleAttack(input);
    expect(attack.critOutcome.outOfAction).toBeCloseTo((5 / 9 + 5 / 9 + 8 / 9) / 3, 10);
    const sum = attack.critOutcome.none + attack.critOutcome.knockedDown + attack.critOutcome.stunned + attack.critOutcome.outOfAction;
    expect(sum).toBeCloseTo(1, 10);
  });

  it("'Hits a vital part' takes ONE armour save before doubling; 'exposed spot' ignores it", () => {
    // Heavy armour 5+ (save 1/3). Vital part: 1/3 saved -> none; 2/3 -> two injury rolls (OOA 5/9).
    // Exposed spot + Master strike: no save -> two rolls (5/9 and 8/9).
    const input = buildAttackInput({
      attacker: testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 3, A: 1, Ld: 7 } }),
      weapon: testWeapon(),
      defender: testDefender({ armour: { type: "heavy", shield: false, buckler: false } }),
      context: testContext(),
      customSkills: [],
    });
    const attack = resolveSingleAttack(input);
    const expectedNone = (1 / 3) * (1 / 3);
    const expectedOOA = (1 / 3) * ((2 / 3) * (5 / 9)) + (1 / 3) * (5 / 9) + (1 / 3) * (8 / 9);
    expect(attack.critOutcome.none).toBeCloseTo(expectedNone, 10);
    expect(attack.critOutcome.outOfAction).toBeCloseTo(expectedOOA, 10);
  });

  it("Bladestorm takes a separate save per wound (binomial), Thrust knocks down even when saved", () => {
    const heavy = { type: "heavy" as const, shield: false, buckler: false };
    const bladed = buildAttackInput({ attacker: testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 3, A: 1, Ld: 7 } }), weapon: testWeapon({ critCategory: "bladed" }), defender: testDefender({ armour: heavy }), context: testContext({ critMode: "optional" }), customSkills: [] });
    const b = resolveSingleAttack(bladed).critOutcome;
    // Flesh Wound (1/3): no save, 1 wound -> OOA 1/3. Bladestorm (1/3): each wound through on 2/3 -> P(0)=1/9, P(1)=4/9, P(2)=4/9 -> OOA 4/9*1/3 + 4/9*5/9. Sliced (1/3): no save, two rolls +2 -> OOA 8/9.
    const expectedOOA = (1 / 3) * (1 / 3) + (1 / 3) * ((4 / 9) * (1 / 3) + (4 / 9) * (5 / 9)) + (1 / 3) * (8 / 9);
    expect(b.outOfAction).toBeCloseTo(expectedOOA, 10);
    const thrusting = buildAttackInput({ attacker: testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 3, A: 1, Ld: 7 } }), weapon: testWeapon({ critCategory: "thrusting" }), defender: testDefender({ armour: heavy }), context: testContext({ critMode: "optional" }), customSkills: [] });
    const t = resolveSingleAttack(thrusting).critOutcome;
    // Stab (1/3): saved 1/3 -> none. Thrust (1/3): saved 1/3 -> knocked down, never none. Kebab (1/3): no save.
    expect(t.none).toBeCloseTo((1 / 3) * (1 / 3), 10);
  });
});

describe("Helmet (02:1339) and Thick Skull", () => {
  it("a plain helmet converts Stunned to Knocked Down on a 4+", () => {
    const input = buildAttackInput({ attacker: testCharacter(), weapon: testWeapon(), defender: testDefender({ helmet: true }), context: testContext(), customSkills: [] });
    expect(input.stunAvoidanceThreshold).toBe(4);
    const noHelm = buildAttackInput({ attacker: testCharacter(), weapon: testWeapon(), defender: testDefender(), context: testContext(), customSkills: [] });
    expect(resolveSingleAttack(input).normalOutcome.stunned).toBeCloseTo(resolveSingleAttack(noHelm).normalOutcome.stunned / 2, 10);
  });
  it("Thick Skull is 3+, or 2+ with a helmet", () => {
    expect(buildAttackInput({ attacker: testCharacter(), weapon: testWeapon(), defender: testDefender({ activeSkillIds: ["thick_skull"] }), context: testContext(), customSkills: [] }).stunAvoidanceThreshold).toBe(3);
    expect(buildAttackInput({ attacker: testCharacter(), weapon: testWeapon(), defender: testDefender({ activeSkillIds: ["thick_skull"], helmet: true }), context: testContext(), customSkills: [] }).stunAvoidanceThreshold).toBe(2);
  });
});

describe("Weapon armour-save modifiers (02:33, 02:240, 02:1174)", () => {
  const heavy = { type: "heavy" as const, shield: false, buckler: false };
  const light = { type: "light" as const, shield: false, buckler: false };
  const none = { type: "none" as const, shield: false, buckler: false };
  const at = (weaponId: string, armour: Armour) => buildAttackInput({ attacker: testCharacter(), weapon: W(weaponId), defender: testDefender({ armour }), context: testContext(), customSkills: [] }).armourThreshold;
  it("axe Cutting Edge makes heavy armour a 6+", () => {
    expect(at("sword", heavy)).toBe(5);
    expect(at("axe", heavy)).toBe(6);
  });
  it("dagger gives +1 to the save, and a 6+ save against no armour", () => {
    expect(at("dagger", heavy)).toBe(4);
    expect(at("dagger", none)).toBe(6);
    expect(at("unarmed", none)).toBe(6);
  });
  it("pistol -2 removes a light armour save entirely (7+ = no save)", () => {
    expect(at("pistol", light)).toBe(IMPOSSIBLE);
    expect(at("pistol", heavy)).toBe(IMPOSSIBLE);
    expect(at("gromril_sword", light)).toBe(IMPOSSIBLE);
  });
  it("Starsword ignores armour but a Ward save still applies", () => {
    const input = buildAttackInput({ attacker: testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 3, A: 1, Ld: 7 } }), weapon: W("starsword"), defender: testDefender({ armour: { type: "gromril", shield: true, buckler: false }, wardSaveThreshold: 4 }), context: testContext(), customSkills: [] });
    expect(input.armourThreshold).toBe(IMPOSSIBLE);
    expect(input.wardSaveThreshold).toBe(4);
    expect(resolveSingleAttack(input).normalOutcome.none).toBeCloseTo(1 / 2, 10);
  });
});

describe("Concussion flags (02:220/230/373/469, 02:388-397)", () => {
  it("club, mace and hammer all have Concussion; Horseman's Hammer does not", () => {
    for (const id of ["club", "mace", "club_mace_or_hammer", "hammer", "dark_elf_blade", "ogre_club", "tenderiser", "bec_de_corbin"]) expect(W(id).concussion, id).toBe(true);
    expect(W("horsemans_hammer").concussion).toBe(false);
  });
});

describe("Resilient (03:501) is close combat only and never touches the armour save", () => {
  it("does not reduce a crossbow's Strength; reduces a sword's for wounding but not for the armour save", () => {
    const plainRanged = buildAttackInput({ attacker: testCharacter(), weapon: W("crossbow"), defender: testDefender(), context: testContext(), customSkills: [] });
    const resRanged = buildAttackInput({ attacker: testCharacter(), weapon: W("crossbow"), defender: testDefender({ activeSkillIds: ["resilient"] }), context: testContext(), customSkills: [] });
    expect(resRanged.woundThreshold).toBe(plainRanged.woundThreshold);
    const strong = testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 3, A: 1, Ld: 7 } });
    const res = buildAttackInput({ attacker: strong, weapon: W("sword"), defender: testDefender({ activeSkillIds: ["resilient"], armour: { type: "heavy", shield: false, buckler: false } }), context: testContext(), customSkills: [], houseRules: { ...defaultHouseRules(), strengthArmourPiercing: true } });
    expect(res.woundThreshold).toBe(4); // S3 vs T3
    expect(res.armourThreshold).toBe(6); // S4 still erodes heavy 5+ -> 6+
  });
});

describe("Shooting skills and weapon rules", () => {
  it("Quick Shot covers short bows and elf bows, not crossbow pistols", () => {
    const qs = testCharacter({ skills: ["quick_shot"] });
    expect(computeAttackCount(qs, W("short_bow"), true, testContext())).toBe(2);
    expect(computeAttackCount(qs, W("elf_bow"), true, testContext())).toBe(2);
    expect(computeAttackCount(qs, W("crossbow_pistol"), true, testContext())).toBe(1);
  });
  it("Hunter is not an extra shot", () => {
    expect(computeAttackCount(testCharacter({ skills: ["hunter"] }), W("handgun"), true, testContext())).toBe(1);
  });
  it("Move-or-Fire weapons can't fire after moving unless Nimble; the -1 for moving always applies", () => {
    const moved = testContext({ movedThisTurn: true });
    expect(computeAttackCount(testCharacter(), W("crossbow"), true, moved)).toBe(0);
    expect(computeAttackCount(testCharacter({ skills: ["nimble"] }), W("crossbow"), true, moved)).toBe(1);
    expect(buildAttackInput({ attacker: testCharacter({ skills: ["nimble"] }), weapon: W("crossbow"), defender: testDefender(), context: moved, customSkills: [] }).hitThreshold).toBe(5);
    expect(buildAttackInput({ attacker: testCharacter({ skills: ["nimble"] }), weapon: W("bow"), defender: testDefender(), context: moved, customSkills: [] }).hitThreshold).toBe(5);
  });
  it("repeater crossbow fires twice at -1", () => {
    expect(computeAttackCount(testCharacter(), W("repeater_crossbow"), true, testContext())).toBe(2);
    expect(buildAttackInput({ attacker: testCharacter(), weapon: W("repeater_crossbow"), defender: testDefender(), context: testContext(), customSkills: [] }).hitThreshold).toBe(5);
  });
  it("Blowpipe never crits but its poison auto-wounds on a natural 6 to hit", () => {
    const input = buildAttackInput({ attacker: testCharacter(), weapon: W("blowpipe"), defender: testDefender({ T: 3 }), context: testContext(), customSkills: [] });
    const attack = resolveSingleAttack(input);
    expect(attack.pWoundTriggerEligible).toBe(0);
    // BS3 hits on 4+ (1/2); S1 vs T3 needs a 6 (1/6). Poison: 1/6 auto-wound + 2/6 * 1/6.
    expect(attack.pWound).toBeCloseTo(1 / 6 + (2 / 6) * (1 / 6), 10);
  });
});

describe("Heavy weapons' Strength bonus is first-turn only (02:332, 02:512)", () => {
  it("flail is S+2 on the charge / first turn, S+0 afterwards; Expert Swordsman ignores double-handed weapons", () => {
    const charging = buildAttackInput({ attacker: testCharacter(), weapon: W("flail"), defender: testDefender({ T: 3 }), context: testContext({ charging: true }), customSkills: [] });
    const later = buildAttackInput({ attacker: testCharacter(), weapon: W("flail"), defender: testDefender({ T: 3 }), context: testContext(), customSkills: [] });
    expect(charging.woundThreshold).toBe(2);
    expect(later.woundThreshold).toBe(4);
    const es = testCharacter({ skills: ["expert_swordsman"] });
    expect(buildAttackInput({ attacker: es, weapon: W("sword"), defender: testDefender(), context: testContext({ charging: true }), customSkills: [] }).rerollToHit).toBe(true);
    expect(buildAttackInput({ attacker: es, weapon: W("weeping_blades"), defender: testDefender(), context: testContext({ charging: true }), customSkills: [] }).rerollToHit).toBe(true);
    expect(buildAttackInput({ attacker: es, weapon: W("sword_breaker"), defender: testDefender(), context: testContext({ charging: true }), customSkills: [] }).rerollToHit).toBe(false);
  });
});

describe("Multi-Wound targets (01:768-770): Injury is only rolled once every Wound is gone", () => {
  const strong = () => testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 3, A: 1, Ld: 7 } });

  it("W2, one attack: only a 2-wound critical can take the target down — hand-derived 1/27", () => {
    // Hit 4+ (1/2), wound 3+ (2/3): trigger-eligible 1/12, normal 1/4. A normal wound leaves W1 -> no Injury roll.
    // Crit (all 2 wounds, one roll): vital 1/3 OOA, exposed 1/3, master strike (+2) 2/3 -> mean 4/9. OOA = 1/12 * 4/9.
    const turn = resolveCharacterTurn(strong(), [testWeapon()], testDefender({ W: 2 }), testContext());
    expect(turn.outOfActionProbability).toBeCloseTo(1 / 27, 10);
    expect(turn.anyWoundProbability).toBeCloseTo(1 / 4 + 1 / 12, 10);
    expect(turn.distribution.none).toBeCloseTo(1 - 1 / 12, 10); // only the crit reaches the Injury chart
    const sum = turn.distribution.none + turn.distribution.knockedDown + turn.distribution.stunned + turn.distribution.outOfAction;
    expect(sum).toBeCloseTo(1, 10);
  });

  it("W2, two attacks: the second wound triggers the Injury roll; more Wounds is always safer", () => {
    const two = testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 3, A: 2, Ld: 7 } });
    const w1 = resolveCharacterTurn(two, [testWeapon()], testDefender({ W: 1 }), testContext());
    const w2 = resolveCharacterTurn(two, [testWeapon()], testDefender({ W: 2 }), testContext());
    const w3 = resolveCharacterTurn(two, [testWeapon()], testDefender({ W: 3 }), testContext());
    expect(w2.outOfActionProbability).toBeGreaterThan(1 / 27); // the normal+normal path now reaches the chart
    expect(w2.outOfActionProbability).toBeLessThan(w1.outOfActionProbability);
    expect(w3.outOfActionProbability).toBeLessThan(w2.outOfActionProbability);
    expect(w2.anyWoundProbability).toBeCloseTo(w1.anyWoundProbability, 10); // wounds landing doesn't depend on W
  });

  it("W1 results are unchanged by the Wounds dimension", () => {
    const turn = resolveCharacterTurn(strong(), [testWeapon()], testDefender({ W: 1 }), testContext());
    // normal 1/4 * 1/3 + crit 1/12 * 2/3 = 1/12 + 1/18 = 5/36
    expect(turn.outOfActionProbability).toBeCloseTo(5 / 36, 10);
  });
});

describe("Critical hit columns", () => {
  it("W1, one attack: P(crit) is the trigger-eligible wound chance and OOA|crit is the crit outcome", () => {
    const attacker = testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 3, A: 1, Ld: 7 } });
    const turn = resolveCharacterTurn(attacker, [testWeapon()], testDefender(), testContext());
    expect(turn.criticalHitProbability).toBeCloseTo(1 / 12, 10); // hit 1/2 * a 6 to wound 1/6
    expect(turn.outOfActionGivenCriticalHit).toBeCloseTo(2 / 3, 10); // standard chart, two Injury dice
  });
  it("W2, one attack: same crit chance, lower OOA given crit (one Injury roll after the doubled wound)", () => {
    const attacker = testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 3, A: 1, Ld: 7 } });
    const turn = resolveCharacterTurn(attacker, [testWeapon()], testDefender({ W: 2 }), testContext());
    expect(turn.criticalHitProbability).toBeCloseTo(1 / 12, 10);
    expect(turn.outOfActionGivenCriticalHit).toBeCloseTo(4 / 9, 10);
  });
  it("a blowpipe never crits; needing a 6 to wound never crits", () => {
    expect(resolveCharacterTurn(testCharacter(), [W("blowpipe")], testDefender(), testContext()).criticalHitProbability).toBe(0);
    expect(resolveCharacterTurn(testCharacter(), [testWeapon()], testDefender({ T: 6 }), testContext()).criticalHitProbability).toBe(0);
  });
});

describe("Undead traits (The Restless Dead variant)", () => {
  const strong = () => testCharacter({ stats: { M: 4, WS: 4, BS: 3, S: 4, T: 3, W: 1, I: 3, A: 1, Ld: 7 } });

  it("No Pain: every Stunned result becomes Knocked Down", () => {
    const turn = resolveCharacterTurn(strong(), [testWeapon()], testDefender({ activeTraitIds: ["no_pain"] }), testContext());
    expect(turn.distribution.stunned).toBeCloseTo(0, 10);
    const plain = resolveCharacterTurn(strong(), [testWeapon()], testDefender(), testContext());
    expect(turn.distribution.knockedDown).toBeCloseTo(plain.distribution.knockedDown + plain.distribution.stunned, 10);
    expect(turn.outOfActionProbability).toBeCloseTo(plain.outOfActionProbability, 10);
  });

  it("Undead Construct: half of all Injury results are ignored (wound still lost), not against magic weapons", () => {
    const plain = resolveCharacterTurn(strong(), [testWeapon()], testDefender(), testContext());
    const construct = resolveCharacterTurn(strong(), [testWeapon()], testDefender({ activeTraitIds: ["undead_construct"] }), testContext());
    // Single wound events: the injury result is ignored on 4+ (1/2), so every severity halves and the wound still counts.
    expect(construct.outOfActionProbability).toBeLessThan(plain.outOfActionProbability);
    expect(construct.anyWoundProbability).toBeCloseTo(plain.anyWoundProbability, 10);
    expect(1 - construct.distribution.none).toBeLessThan(1 - plain.distribution.none);
    const magic = resolveCharacterTurn(strong(), [testWeapon({ special: ["magical"] })], testDefender({ activeTraitIds: ["undead_construct"] }), testContext());
    expect(magic.outOfActionProbability).toBeCloseTo(plain.outOfActionProbability, 10);
  });

  it("Immune to Poison switches off a poisoned weapon's auto-wound but not a Wight Blade's", () => {
    const poison = buildAttackInput({ attacker: testCharacter(), weapon: W("weeping_blades"), defender: testDefender({ activeTraitIds: ["immune_to_poison"] }), context: testContext(), customSkills: [] });
    expect(poison.autoWoundOnNaturalSixToHit).toBe(false);
    const wight = buildAttackInput({ attacker: testCharacter(), weapon: W("wight_blade"), defender: testDefender({ activeTraitIds: ["immune_to_poison"] }), context: testContext(), customSkills: [] });
    expect(wight.autoWoundOnNaturalSixToHit).toBe(true);
  });

  it("Large Target: +1 to hit when shot at", () => {
    const plain = buildAttackInput({ attacker: testCharacter(), weapon: W("bow"), defender: testDefender(), context: testContext(), customSkills: [] });
    const large = buildAttackInput({ attacker: testCharacter(), weapon: W("bow"), defender: testDefender({ activeTraitIds: ["large_target"] }), context: testContext(), customSkills: [] });
    expect(large.hitThreshold).toBe((plain.hitThreshold as number) - 1);
  });

  it("Variant Wight Blades: crits on 5+ with any non-magical hand weapon, not Gromril", () => {
    const guard = testCharacter({ traits: ["wight_blades_5plus"] });
    expect(buildAttackInput({ attacker: guard, weapon: W("sword"), defender: testDefender(), context: testContext(), customSkills: [] }).critTriggerFaces).toEqual([5, 6]);
    expect(buildAttackInput({ attacker: guard, weapon: W("gromril_sword"), defender: testDefender(), context: testContext(), customSkills: [] }).critTriggerFaces).toEqual([6]);
    expect(buildAttackInput({ attacker: guard, weapon: W("bow"), defender: testDefender(), context: testContext(), customSkills: [] }).critTriggerFaces).toEqual([6]);
    // S3 vs T3 wounds on 4+: faces 5 and 6 both exceed it, so P(crit | hit) = 2/6.
    const attack = resolveSingleAttack(buildAttackInput({ attacker: guard, weapon: W("sword"), defender: testDefender(), context: testContext(), customSkills: [] }));
    expect(attack.pWoundTriggerEligible).toBeCloseTo((1 / 2) * (2 / 6), 10);
  });
});
