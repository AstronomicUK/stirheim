// Single-attack resolution. This is the shared building block reused by the full-phase chain
// (turnAggregate.ts). An attack is resolved into "wound events": with what probability it inflicts
// 0, 1 or 2 wounds, and with which Injury-roll modifiers those wounds would be rolled. Whether a
// wound actually produces an Injury roll depends on how many Wounds the target has left, which is
// only known inside the phase aggregation — so that step lives in turnAggregate.ts.

import { probabilityAtLeast, type Threshold, IMPOSSIBLE } from "./dice";
import { injuryDistributionForWounds, type InjuryBand, type InjuryModifiers } from "./injury";
import { critDistribution, type CritTableKey, type CritResult } from "./crit";

export interface Severity4Distribution {
  none: number;
  knockedDown: number;
  stunned: number;
  outOfAction: number;
}

const ZERO_DIST: Severity4Distribution = { none: 1, knockedDown: 0, stunned: 0, outOfAction: 0 };

function scale(dist: Severity4Distribution, factor: number): Severity4Distribution {
  return {
    none: dist.none * factor,
    knockedDown: dist.knockedDown * factor,
    stunned: dist.stunned * factor,
    outOfAction: dist.outOfAction * factor,
  };
}

function add(a: Severity4Distribution, b: Severity4Distribution): Severity4Distribution {
  return {
    none: a.none + b.none,
    knockedDown: a.knockedDown + b.knockedDown,
    stunned: a.stunned + b.stunned,
    outOfAction: a.outOfAction + b.outOfAction,
  };
}

export interface AttackInput {
  /** Minimum D6 to hit, with all modifiers (opposed WS or flat BS + cover/range/moving/large-target stack) already folded in. */
  hitThreshold: Threshold;
  /** Minimum D6 to wound (attacker/weapon Strength vs defender Toughness), with skill modifiers already folded in. */
  woundThreshold: Threshold;
  /** Defender's armour save threshold against this attack (Strength erosion house rule and the weapon's own save modifier already applied; IMPOSSIBLE when no save is possible, including modified saves that would need 7+). */
  armourThreshold: Threshold;
  /** Ranged only: Dodge — a separate negation roll taken as soon as a hit is scored, before to-wound. */
  dodgeThreshold?: Threshold;
  /** Melee only: Step Aside — an extra 5+ save attempted after the armour save, once per wound. */
  stepAsideThreshold?: Threshold;
  /** Ward save — attempted after the armour save AND Step Aside, once per wound, even when a crit ignores the armour save entirely. Never eroded by Strength. */
  wardSaveThreshold?: Threshold;
  /** Sum of non-crit Injury roll modifiers (Strike to Injure, etc.). */
  injuryRollModifier: number;
  /** Attacking weapon has Concussion AND the defender doesn't ignore it (Hard Head) — resolved by the caller. */
  concussion: boolean;
  trueGrit: boolean;
  /** Band for the defender's injuryChartRemap skill (True Grit's by default). */
  injuryRemap?: InjuryBand;
  /** Defender has the Hard to Kill racial trait (Dwarfs). */
  hardToKill: boolean;
  /** Helmet (4+) / Thick Skull (3+, 2+ with helmet) save that turns a Stunned result into Knocked Down. */
  stunAvoidanceThreshold?: number;
  /** No Pain: every Stunned result becomes Knocked Down. */
  stunnedBecomesKnockedDown?: boolean;
  /** Undead Construct: each Injury roll is ignored on this D6 or better (wound still lost). */
  injuryIgnoreThreshold?: number;
  /** Natural D6 faces on the wound roll that can trigger a critical hit. Default [6]; empty for weapons that can never crit (Blowpipe). */
  critTriggerFaces: number[];
  critTable: CritTableKey;
  /** Web of Steel etc — modifies the D6 roll used to pick a result on the crit table. */
  critTableRollModifier: number;
  /** Expert Swordsman / Hatred — reroll a failed to-hit roll once. */
  rerollToHit?: boolean;
  /** Reroll a failed to-wound roll once (no seeded skill grants this, but the effect type is supported). */
  rerollToWound?: boolean;
  /** Poison / Wight Blades: a natural 6 on the to-hit roll wounds automatically; the to-wound roll is still made to check for a critical. */
  autoWoundOnNaturalSixToHit?: boolean;
  /** Defender has a Parry item, the attack is melee and parryable, and the attacker's Strength isn't double-or-more the defender's. */
  parryEligible: boolean;
  /** Given a Parry attempt is actually spent on this attack (turnAggregate.ts decides that), probability it succeeds and the attack is discarded entirely. */
  parrySuccessProbGivenAttempt: number;
}

/**
 * One way a landed wound can turn out: `wounds` get through the saves (0 = fully saved), and if
 * any Injury rolls result they use `injury`. Probabilities within a set of events sum to 1.
 */
export interface WoundEvent {
  probability: number;
  wounds: 0 | 1 | 2;
  injury: InjuryModifiers;
  /** Bludgeoned: any wound through is an automatic OOA, however many Wounds the target has left. */
  autoOOA: boolean;
  /** Thrust: the target is knocked down even if the wound was saved. */
  minSeverityKnockedDown: boolean;
}

/**
 * Probability (joint with a hit) that the wound roll landed on a face in `triggerFaces` that
 * counts as a crit trigger. A face exactly equal to the wound threshold does not count — "if the
 * attacker normally needs 6s to wound his target, he cannot cause a critical hit" (01:705).
 */
function triggerEligibleFraction(woundThreshold: Threshold, triggerFaces: number[]): number {
  if (woundThreshold === IMPOSSIBLE) return 0;
  let count = 0;
  for (const face of triggerFaces) {
    if (face > woundThreshold) count += 1;
  }
  return count / 6;
}

function injuryModsOf(input: AttackInput, extraInjuryBonus: number, ignoreHelmet: boolean): InjuryModifiers {
  return {
    injuryRollModifier: input.injuryRollModifier + extraInjuryBonus,
    concussion: input.concussion,
    trueGrit: input.trueGrit,
    remap: input.injuryRemap,
    hardToKill: input.hardToKill,
    stunAvoidanceThreshold: ignoreHelmet ? undefined : input.stunAvoidanceThreshold,
    stunnedBecomesKnockedDown: input.stunnedBecomesKnockedDown,
    injuryIgnoreThreshold: input.injuryIgnoreThreshold,
  };
}

/** Binomial(n, q) probabilities for k = 0..n. */
function binomial(n: number, q: number): number[] {
  const out: number[] = [];
  for (let k = 0; k <= n; k++) {
    let coeff = 1;
    for (let i = 0; i < k; i++) coeff = (coeff * (n - i)) / (i + 1);
    out.push(coeff * Math.pow(q, k) * Math.pow(1 - q, n - k));
  }
  return out;
}

interface WoundResolutionOptions {
  /** How many wounds this hit inflicts if it gets through (crit results can double it). */
  wounds: 1 | 2;
  /** No armour save at all against these wounds (crit "ignores armour saves", or a weapon like the Starsword). */
  ignoresArmourSave: boolean;
  /** Each wound takes its own armour save (Bladestorm) instead of one save gating them all. */
  separateSaves: boolean;
  /** Extra Injury-roll bonus from a crit result. */
  injuryBonus: number;
  /** Crit result disables the helmet / Thick Skull save (Clubbed). */
  ignoresHelmetSave: boolean;
  autoOOA: boolean;
  minSeverityKnockedDown: boolean;
}

/**
 * Turns "this attack has hit and wounded" into wound events. Armour save first (shared across the
 * wounds unless `separateSaves`), then each wound that gets through independently faces Step Aside
 * and the Ward save (both are "each time he suffers a wound" / "one Ward save against each wound").
 */
function woundEvents(input: AttackInput, opts: WoundResolutionOptions): WoundEvent[] {
  const pSaveArmour = opts.ignoresArmourSave ? 0 : probabilityAtLeast(input.armourThreshold);
  const pStepAside = input.stepAsideThreshold !== undefined ? probabilityAtLeast(input.stepAsideThreshold) : 0;
  const pWard = input.wardSaveThreshold !== undefined ? probabilityAtLeast(input.wardSaveThreshold) : 0;
  const perWoundThroughExtras = (1 - pStepAside) * (1 - pWard);
  const injury = injuryModsOf(input, opts.injuryBonus, opts.ignoresHelmetSave);

  const counts = new Array<number>(opts.wounds + 1).fill(0);
  if (opts.separateSaves) {
    binomial(opts.wounds, (1 - pSaveArmour) * perWoundThroughExtras).forEach((p, k) => (counts[k] += p));
  } else {
    counts[0] += pSaveArmour;
    binomial(opts.wounds, perWoundThroughExtras).forEach((p, k) => (counts[k] += (1 - pSaveArmour) * p));
  }

  return counts
    .map((probability, k) => ({ probability, wounds: k as 0 | 1 | 2, injury, autoOOA: opts.autoOOA, minSeverityKnockedDown: opts.minSeverityKnockedDown }))
    .filter((e) => e.probability > 0);
}

function normalWoundEvents(input: AttackInput): WoundEvent[] {
  return woundEvents(input, { wounds: 1, ignoresArmourSave: false, separateSaves: false, injuryBonus: 0, ignoresHelmetSave: false, autoOOA: false, minSeverityKnockedDown: false });
}

function critResultEvents(input: AttackInput, result: CritResult): WoundEvent[] {
  return woundEvents(input, {
    wounds: result.woundsCaused,
    ignoresArmourSave: result.ignoresArmourSave,
    separateSaves: (result.separateSaves ?? 1) > 1,
    injuryBonus: result.injuryRollBonus,
    ignoresHelmetSave: Boolean(result.ignoresHelmetSave),
    autoOOA: Boolean(result.autoOOAOnFailedSave),
    minSeverityKnockedDown: Boolean(result.minSeverityKnockedDown),
  });
}

function critWoundEvents(input: AttackInput): WoundEvent[] {
  const events: WoundEvent[] = [];
  for (const { result, probability } of critDistribution(input.critTable, input.critTableRollModifier)) {
    for (const e of critResultEvents(input, result)) events.push({ ...e, probability: e.probability * probability });
  }
  return events;
}

/**
 * Severity of one wound event against a target that has already taken `woundsTaken` wounds this
 * phase out of `maxWounds`. Injury is rolled for the wound that takes the model to zero Wounds and
 * for every wound after that (01:770); several Injury rolls in one event take the highest.
 */
export function eventSeverity(event: WoundEvent, woundsTaken: number, maxWounds: number): Severity4Distribution {
  const total = woundsTaken + event.wounds;
  const rolls = event.wounds === 0 ? 0 : Math.max(0, total - Math.max(woundsTaken, maxWounds - 1));
  let dist: Severity4Distribution;
  if (rolls === 0) dist = ZERO_DIST;
  else if (event.autoOOA) dist = { none: 0, knockedDown: 0, stunned: 0, outOfAction: 1 };
  else {
    const injured = injuryDistributionForWounds(event.injury, rolls);
    dist = { none: injured.none ?? 0, knockedDown: injured.knockedDown, stunned: injured.stunned, outOfAction: injured.outOfAction };
  }
  if (event.minSeverityKnockedDown && dist.none > 0) dist = { ...dist, knockedDown: dist.knockedDown + dist.none, none: 0 };
  return dist;
}

/** Collapses a set of wound events into a severity distribution for a fresh target with `maxWounds` Wounds. */
export function eventsSeverity(events: WoundEvent[], maxWounds = 1, woundsTaken = 0): Severity4Distribution {
  let total: Severity4Distribution = { none: 0, knockedDown: 0, stunned: 0, outOfAction: 0 };
  for (const e of events) total = add(total, scale(eventSeverity(e, woundsTaken, maxWounds), e.probability));
  return total;
}

export interface SingleAttackBreakdown {
  pHit: number;
  /** Joint hit & wound probability, after Dodge (ranged) is applied. */
  pWound: number;
  /** Joint probability this attack hits, wounds, and the wound roll is NOT crit-trigger-eligible. */
  pWoundNormal: number;
  /** Joint probability this attack hits, wounds, and the wound roll IS crit-trigger-eligible (may or may not end up being the phase's actual crit — that's resolved in turnAggregate.ts). */
  pWoundTriggerEligible: number;
  /** Wound events conditional on this wound resolving as a normal (non-crit) wound. */
  normalEvents: WoundEvent[];
  /** Wound events conditional on this wound resolving AS the phase's one critical hit. */
  critEvents: WoundEvent[];
  /** Outcome distribution conditional on a normal wound, against a single-Wound target — kept for hand-checkable tests and the Injury-alone display. */
  normalOutcome: Severity4Distribution;
  /** Outcome distribution conditional on this being the phase's crit, against a single-Wound target. */
  critOutcome: Severity4Distribution;
  /** Given this attack IS the one that consumes the phase's crit, probability the crit table roll landed on a Ricochet result (informational only, only ever nonzero for the missile table). */
  pRicochetGivenCritConsumedHere: number;
  /** Whether a Parry attempt against this attack is even possible. */
  parryEligible: boolean;
  /** Given a Parry attempt IS spent on this attack, probability it succeeds and the whole attack is discarded. */
  parrySuccessProbGivenAttempt: number;
}

/** Pure function: resolves everything about a single attack except which attack (if any) consumes the phase's one crit and how many Wounds the target has left — that's the aggregation step in turnAggregate.ts. */
export function resolveSingleAttack(input: AttackInput): SingleAttackBreakdown {
  const pHitBase = probabilityAtLeast(input.hitThreshold);
  const pWoundIfHitBase = probabilityAtLeast(input.woundThreshold);
  // Reroll a failure once (Expert Swordsman / Hatred): P(success on either roll) = 1 - P(fail)^2.
  const pHit = input.rerollToHit ? 1 - (1 - pHitBase) * (1 - pHitBase) : pHitBase;
  // Note: rerollToWound (no seeded skill grants this) boosts the overall wound chance but does not
  // adjust the crit-trigger face distribution below — an acceptable simplification while unused.
  const pWoundIfHit = input.rerollToWound ? 1 - (1 - pWoundIfHitBase) * (1 - pWoundIfHitBase) : pWoundIfHitBase;
  const pDodge = input.dodgeThreshold !== undefined ? probabilityAtLeast(input.dodgeThreshold) : 0;

  // Poison / Wight Blades: a natural 6 to hit wounds automatically. A 6 always hits, so P(final
  // to-hit die is a 6) is 1/6, plus (with a reroll) the chance the first die missed and the second
  // came up 6. Those hits skip the to-wound test (but still roll it for the crit check).
  let pWound: number;
  if (input.autoWoundOnNaturalSixToHit && input.hitThreshold !== IMPOSSIBLE) {
    const pSixToHit = input.rerollToHit ? 1 / 6 + (1 - pHitBase) * (1 / 6) : 1 / 6;
    const pHitOther = Math.max(0, pHit - pSixToHit);
    pWound = (1 - pDodge) * (pSixToHit + pHitOther * pWoundIfHit);
  } else {
    pWound = pHit * (1 - pDodge) * pWoundIfHit;
  }

  const triggerFraction = triggerEligibleFraction(input.woundThreshold, input.critTriggerFaces);
  // triggerFraction already implies wounding (a trigger face always exceeds the threshold), so it's a fraction of pHit*(1-pDodge) directly, not of pWound.
  const pWoundTriggerEligible = pHit * (1 - pDodge) * triggerFraction;
  const pWoundNormal = Math.max(0, pWound - pWoundTriggerEligible);

  const critResults = critDistribution(input.critTable, input.critTableRollModifier);
  const pRicochetGivenCritConsumedHere = critResults
    .filter(({ result }) => result.ricochet)
    .reduce((sum, { probability }) => sum + probability, 0);

  const normalEvents = normalWoundEvents(input);
  const critEvents = critWoundEvents(input);

  return {
    pHit,
    pWound,
    pWoundNormal,
    pWoundTriggerEligible,
    normalEvents,
    critEvents,
    normalOutcome: eventsSeverity(normalEvents, 1),
    critOutcome: eventsSeverity(critEvents, 1),
    pRicochetGivenCritConsumedHere,
    parryEligible: input.parryEligible,
    parrySuccessProbGivenAttempt: input.parrySuccessProbGivenAttempt,
  };
}

export { ZERO_DIST, add as addSeverity4, scale as scaleSeverity4 };
