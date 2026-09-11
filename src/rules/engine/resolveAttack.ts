// Single-attack resolution. This is the shared building block reused by the full-phase chain
// (turnAggregate.ts). An attack is resolved into "wound events": with what probability it inflicts
// 0, 1 or 2 wounds, and with which Injury-roll modifiers those wounds would be rolled. Whether a
// wound actually produces an Injury roll depends on how many Wounds the target has left, which is
// only known inside the phase aggregation — so that step lives in turnAggregate.ts.

import { mixRangedAttacks } from "./mixRangedAttacks";
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
  smokeOnHit?: boolean;
  /** Fish-hook Shot: maximum successful raw D6 on the attacker’s Strength test. */
  fishHookFallThreshold?: number;
  /** Chain Shot: a hit causing no unsaved wounds can knock down on 4+. */
  chainShotKnockdown?: boolean;
  /** Mandatory single-shot misfire: the 6 result hits at the enhanced profile. */
  misfireEnhanced?: AttackInput;
  /** Pigeon launch table: 5–6 on target, 2–4 harmless, 1 explodes at the firer. */
  temperamentalPigeon?: boolean;
  /** Per-shot permission roll, before rolling to hit (Blessing of the Lady). */
  firePermissionThreshold?: number;
  /** Bolas hits entangle rather than inflicting wounds. */
  entangleInsteadOfWound?: boolean;
  barrageOnFailedWound?: boolean;
  /** Already-established hits, such as a successfully cast damage spell. */
  automaticHits?: boolean;
  automaticHitReason?: "zeroWeaponSkill" | "blunderbussLine" | "pigeonBlast" | "blackpowderExplosion" | "grapeShot" | "mortarBlast";
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
  /** Peg Leg: an unmodified save after every failed save, both phases, once per wound; taken even when no other save was allowed. */
  afterSaveThreshold?: Threshold;
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
  /** Veskit ignores both non-OOA injury results; wounds are still lost. */
  ignoreKnockedDownAndStunned?: boolean;
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
  /** Roll two wound dice and use the higher for success AND critical triggers. */
  woundHighestOfTwo?: boolean;
  /** Poison / Wight Blades: a natural 6 on the to-hit roll wounds automatically; the to-wound roll is still made to check for a critical. */
  autoWoundOnNaturalSixToHit?: boolean;
  /** Defender has a Parry item, the attack is melee and parryable, and the attacker's Strength isn't double-or-more the defender's. */
  parryEligible: boolean;
  /** Given a Parry attempt is actually spent on this attack (turnAggregate.ts decides that), probability it succeeds and the attack is discarded entirely. */
  parrySuccessProbGivenAttempt: number;
  /** Conditional parry probability for each actual hit face (indices 0–6). */
  parrySuccessByFace?: number[];
  /** House rule: Parry is an opposed WS roll rather than a flat threshold. Set only when the rule is on and a fixed parry threshold (Starblade) isn't already in play. Needs attackerWS/defenderWS to actually resolve the real dice in rollThrough.ts — the probability side already folds the comparison into parrySuccessProbGivenAttempt above. */
  opposedParryWS?: boolean;
  attackerWS?: number;
  defenderWS?: number;
  /** The target is already knocked down (hand-to-hand only): this attack hits automatically, no to-hit roll. */
  autoHitKnockedDown?: boolean;
  /** The target is already stunned (hand-to-hand only): this attack takes it out of action automatically, no rolls at all. */
  autoOutOfActionStunned?: boolean;
  /** Each successful hit causes D3 Wounds instead of 1 (Ball and Chain). A crit that also causes several wounds doesn't stack with this — the rulebook says to use whichever is higher. */
  multipleWoundsD3OnHit?: boolean;
}

/**
 * One way a landed wound can turn out: `wounds` get through the saves (0 = fully saved), and if
 * any Injury rolls result they use `injury`. Probabilities within a set of events sum to 1.
 */
export interface WoundEvent {
  extraAttack?: boolean;
  probability: number;
  wounds: 0 | 1 | 2 | 3;
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
    ignoreKnockedDownAndStunned: input.ignoreKnockedDownAndStunned,
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
  /** How many wounds this hit inflicts if it gets through (crit results can double it; Ball and Chain triples the range). */
  wounds: 1 | 2 | 3;
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
  const pAfter = input.afterSaveThreshold !== undefined ? probabilityAtLeast(input.afterSaveThreshold) : 0;
  const pWard = input.wardSaveThreshold !== undefined ? probabilityAtLeast(input.wardSaveThreshold) : 0;
  const perWoundThroughExtras = (1 - pStepAside) * (1 - pAfter) * (1 - pWard);
  const injury = injuryModsOf(input, opts.injuryBonus, opts.ignoresHelmetSave);

  const counts = new Array<number>(opts.wounds + 1).fill(0);
  if (opts.separateSaves) {
    binomial(opts.wounds, (1 - pSaveArmour) * perWoundThroughExtras).forEach((p, k) => (counts[k] += p));
  } else {
    counts[0] += pSaveArmour;
    binomial(opts.wounds, perWoundThroughExtras).forEach((p, k) => (counts[k] += (1 - pSaveArmour) * p));
  }

  return counts
    .map((probability, k) => ({ probability, wounds: k as 0 | 1 | 2 | 3, injury, autoOOA: opts.autoOOA, minSeverityKnockedDown: opts.minSeverityKnockedDown }))
    .filter((e) => e.probability > 0);
}

/**
 * Ball and Chain: the D3 wound roll is a mixture over its three equally-likely faces. When a crit
 * also caused several wounds (`baseWounds` > 1), the rulebook takes whichever is higher rather than
 * stacking them, so each face resolves to `max(baseWounds, face)` wounds, not `face` wounds outright.
 */
function multiWoundMixture(input: AttackInput, baseWounds: number, opts: Omit<WoundResolutionOptions, "wounds">): WoundEvent[] {
  const events: WoundEvent[] = [];
  for (let face = 1; face <= 3; face++) {
    const wounds = Math.max(baseWounds, face) as 1 | 2 | 3;
    for (const e of woundEvents(input, { ...opts, wounds })) events.push({ ...e, probability: e.probability / 3 });
  }
  return events;
}

function normalWoundEvents(input: AttackInput): WoundEvent[] {
  const opts = { ignoresArmourSave: false, separateSaves: false, injuryBonus: 0, ignoresHelmetSave: false, autoOOA: Boolean(input.autoHitKnockedDown), minSeverityKnockedDown: false };
  if (input.multipleWoundsD3OnHit) return multiWoundMixture(input, 1, opts);
  return woundEvents(input, { wounds: 1, ...opts });
}

function critResultEvents(input: AttackInput, result: CritResult): WoundEvent[] {
  const opts = {
    ignoresArmourSave: result.ignoresArmourSave,
    separateSaves: (result.separateSaves ?? 1) > 1,
    injuryBonus: result.injuryRollBonus,
    ignoresHelmetSave: Boolean(result.ignoresHelmetSave),
    autoOOA: Boolean(result.autoOOAOnFailedSave || input.autoHitKnockedDown),
    minSeverityKnockedDown: Boolean(result.minSeverityKnockedDown),
  };
  if (input.multipleWoundsD3OnHit) return multiWoundMixture(input, result.woundsCaused, opts);
  return woundEvents(input, { wounds: result.woundsCaused, ...opts });
}

function critWoundEvents(input: AttackInput): WoundEvent[] {
  const events: WoundEvent[] = [];
  for (const { result, probability } of critDistribution(input.critTable, input.critTableRollModifier)) {
    for (const e of critResultEvents(input, result)) events.push({ ...e, extraAttack: result.extraAttack, probability: e.probability * probability });
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
  if (event.autoOOA && event.wounds > 0) dist = { none: 0, knockedDown: 0, stunned: 0, outOfAction: 1 };
  else if (rolls === 0) dist = ZERO_DIST;
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

function nextBarrageInput(input: AttackInput): AttackInput {
  const hitThreshold = input.hitThreshold === IMPOSSIBLE ? IMPOSSIBLE : Math.min(6, input.hitThreshold + 1);
  const hitFaces = [2, 3, 4, 5, 6].filter(face => hitThreshold !== IMPOSSIBLE && face >= hitThreshold);
  const parrySuccessProbGivenAttempt = input.parrySuccessByFace && hitFaces.length
    ? hitFaces.reduce((sum, face) => sum + (input.parrySuccessByFace?.[face] ?? input.parrySuccessProbGivenAttempt), 0) / hitFaces.length
    : input.parrySuccessProbGivenAttempt;
  return { ...input, hitThreshold, parrySuccessProbGivenAttempt };
}

export interface SingleAttackBreakdown {
  /** Mutually exclusive ranged outcomes; preserve their wound/save correlation through the phase. */
  branches?: { probability: number; attack: SingleAttackBreakdown }[];
  barrageNext?: SingleAttackBreakdown;
  barrageAtCap?: boolean;
  /** Unconditioned extra attack; never inherits a highest-hit parry partition. */
  extraAttack?: SingleAttackBreakdown;
  hitFaces?: { face: number; probability: number; wound: number; trigger: number; parry: number }[];
  pHit: number;
  /** Joint hit & wound probability, after Dodge (ranged) is applied. */
  pWound: number;
  /** Joint hit, no wound-roll success, and Chain Shot knock-down probability. */
  pKnockdownWithoutWound?: number;
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
  /** The target is already stunned: this attack takes it out of action outright, independent of Wounds/Parry/injury (01:947-959) — turnAggregate.ts short-circuits its whole pipeline for it. */
  guaranteedOutOfAction?: boolean;
}

const OUT_OF_ACTION_DIST: Severity4Distribution = { none: 0, knockedDown: 0, stunned: 0, outOfAction: 1 };

/** Pure function: resolves everything about a single attack except which attack (if any) consumes the phase's one crit and how many Wounds the target has left — that's the aggregation step in turnAggregate.ts. */
export function resolveSingleAttack(input: AttackInput): SingleAttackBreakdown {
  if (input.firePermissionThreshold !== undefined) {
    const permission = probabilityAtLeast(input.firePermissionThreshold);
    const resolved = resolveSingleAttack({ ...input, firePermissionThreshold: undefined });
    return { ...resolved,
      branches: resolved.branches ? [{ probability: permission, attack: resolved }, { probability: 1 - permission, attack: resolveSingleAttack({ ...input, firePermissionThreshold: undefined, misfireEnhanced: undefined, hitThreshold: IMPOSSIBLE, automaticHits: false, autoHitKnockedDown: false }) }] : undefined,
      pHit: resolved.pHit * permission, pWound: resolved.pWound * permission, pKnockdownWithoutWound: (resolved.pKnockdownWithoutWound ?? 0) * permission,
      pWoundNormal: resolved.pWoundNormal * permission, pWoundTriggerEligible: resolved.pWoundTriggerEligible * permission,
      hitFaces: resolved.hitFaces?.map(face => ({ ...face, probability: face.probability * permission + (face.face === 0 ? 1 - permission : 0) })) };
  }

  if (input.misfireEnhanced) {
    const ordinary = resolveSingleAttack({ ...input, misfireEnhanced: undefined });
    const conditioned = { ...ordinary, pKnockdownWithoutWound: (ordinary.pKnockdownWithoutWound ?? 0) * 6 / 5, pHit: ordinary.pHit * 6 / 5, pWound: ordinary.pWound * 6 / 5, pWoundNormal: ordinary.pWoundNormal * 6 / 5, pWoundTriggerEligible: ordinary.pWoundTriggerEligible * 6 / 5, hitFaces: undefined };
    const enhanced = resolveSingleAttack({ ...input.misfireEnhanced, misfireEnhanced: undefined, firePermissionThreshold: undefined, automaticHits: true, autoWoundOnNaturalSixToHit: false });
    const miss = resolveSingleAttack({ ...input, misfireEnhanced: undefined, hitThreshold: IMPOSSIBLE, automaticHits: false });
    return mixRangedAttacks([{ probability: 5 / 6, attack: conditioned }, { probability: 1 / 36, attack: enhanced }, { probability: 5 / 36, attack: miss }]);
  }

  if (input.entangleInsteadOfWound || input.fishHookFallThreshold !== undefined) input = { ...input, woundThreshold: IMPOSSIBLE, critTriggerFaces: [], autoWoundOnNaturalSixToHit: false, autoOutOfActionStunned: false };
  // A stunned target is taken out of action by the first hit in hand-to-hand combat, full stop —
  // no to-hit, wound, save or injury roll, and independent of how many Wounds it has left, so this
  // bypasses the wound/injury event model entirely rather than trying to express it as one.
  if (input.autoOutOfActionStunned) {
    return {
      pHit: 1,
      pWound: 1,
      pWoundNormal: 0,
      pWoundTriggerEligible: 0,
      normalEvents: [],
      critEvents: [],
      normalOutcome: OUT_OF_ACTION_DIST,
      critOutcome: OUT_OF_ACTION_DIST,
      pRicochetGivenCritConsumedHere: 0,
      parryEligible: false,
      parrySuccessProbGivenAttempt: 0,
      guaranteedOutOfAction: true,
    };
  }
  const pHitBase = input.autoHitKnockedDown || input.automaticHits ? 1 : probabilityAtLeast(input.hitThreshold);
  const singleWound = probabilityAtLeast(input.woundThreshold);
  const pWoundIfHitBase = input.woundHighestOfTwo ? 1 - (1 - singleWound) ** 2 : singleWound;
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
  if (input.autoWoundOnNaturalSixToHit && !input.automaticHits && !input.autoHitKnockedDown && input.hitThreshold !== IMPOSSIBLE) {
    const pSixToHit = input.rerollToHit ? 1 / 6 + (1 - pHitBase) * (1 / 6) : 1 / 6;
    const pHitOther = Math.max(0, pHit - pSixToHit);
    pWound = (1 - pDodge) * (pSixToHit + pHitOther * pWoundIfHit);
  } else {
    pWound = pHit * (1 - pDodge) * pWoundIfHit;
  }

  const triggerFraction = input.woundHighestOfTwo
    ? Array.from({ length: 6 }, (_, i) => i + 1).reduce((p, face) => p + (input.woundThreshold !== IMPOSSIBLE && face > input.woundThreshold && input.critTriggerFaces.includes(face) ? (2 * face - 1) / 36 : 0), 0)
    : triggerEligibleFraction(input.woundThreshold, input.critTriggerFaces);
  // triggerFraction already implies wounding (a trigger face always exceeds the threshold), so it's a fraction of pHit*(1-pDodge) directly, not of pWound.
  const pWoundTriggerEligible = pHit * (1 - pDodge) * triggerFraction;
  const pWoundNormal = Math.max(0, pWound - pWoundTriggerEligible);

  const critResults = critDistribution(input.critTable, input.critTableRollModifier);
  const pRicochetGivenCritConsumedHere = critResults
    .filter(({ result }) => result.ricochet)
    .reduce((sum, { probability }) => sum + probability, 0);

  const chainEvents = (events: WoundEvent[]): WoundEvent[] => !input.chainShotKnockdown ? events : events.flatMap(e => e.wounds === 0 && !e.minSeverityKnockedDown ? [{ ...e, probability: e.probability / 2 }, { ...e, probability: e.probability / 2, minSeverityKnockedDown: true }] : [e]);
  const normalEvents = chainEvents(normalWoundEvents(input));
  const critEvents = chainEvents(critWoundEvents(input));

  return {
    barrageNext: input.barrageOnFailedWound && input.hitThreshold !== IMPOSSIBLE
      ? input.hitThreshold < 6
        ? resolveSingleAttack(nextBarrageInput(input))
        : { ...resolveSingleAttack({ ...input, barrageOnFailedWound: false }), barrageAtCap: true }
      : undefined,
    pHit,
    hitFaces: input.autoHitKnockedDown || input.automaticHits ? undefined : [
      { face: 0, probability: 1 - pHit, wound: 0, trigger: 0, parry: 0 },
      ...Array.from({ length: 6 }, (_, i) => i + 1).filter(face => input.hitThreshold !== IMPOSSIBLE && face > 1 && (face === 6 || face >= input.hitThreshold)).map(face => ({
        face, probability: (1 + (input.rerollToHit ? 1 - pHitBase : 0)) / 6,
        wound: (1 - pDodge) * (input.autoWoundOnNaturalSixToHit && face === 6 ? 1 : pWoundIfHit),
        trigger: (1 - pDodge) * triggerFraction,
        parry: input.parrySuccessByFace?.[face] ?? input.parrySuccessProbGivenAttempt,
      })),
    ],
    pWound,
    pKnockdownWithoutWound: input.fishHookFallThreshold !== undefined ? (input.ignoreKnockedDownAndStunned ? 0 : pHit * (1-pDodge) * Math.max(0,Math.min(5,input.fishHookFallThreshold))/6) : input.chainShotKnockdown ? Math.max(0, pHit * (1 - pDodge) - pWound) / 2 : 0,
    pWoundNormal,
    pWoundTriggerEligible,
    extraAttack: input.critTriggerFaces.length && critEvents.some(e => e.extraAttack)
      ? resolveSingleAttack({ ...input, critTriggerFaces: [] }) : undefined,
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
