// Full-phase aggregation: the one-crit-per-phase rule (01:707), the defender's Parry attempts
// (01:844) and the defender's Wounds (01:768) all share the same shape — a resource whose state has
// to be carried from attack to attack, in resolution order. All three are tracked in one exact DP:
//
//   state = (parriesUsed, critConsumed, woundsTaken, worstSeverity)
//
// - A model may cause at most one critical hit per phase: the FIRST attack whose wound roll lands
//   on a crit-trigger face becomes the crit; every other such attack just wounds normally.
// - A defender gets at most `maxParries` Parry ATTEMPTS per phase (usually 1), against the highest
//   hit(s). The public wrapper partitions those hit faces before running the wound chain below.
// - A target with W Wounds only starts rolling for Injury once it has taken W wounds this phase
//   (the wound that takes it to zero, and every wound after that — one roll each, highest applies).
//   A two-wound critical counts double. Wounds already taken in earlier turns aren't tracked: the
//   phase is simulated against a fresh target.
//
// Attacks are resolved in the order given — the primary weapon's attacks first, then the off-hand
// weapon's bonus attack. Callers control this by the order of `attacks` passed in.

import type { SingleAttackBreakdown, Severity4Distribution, WoundEvent } from "./resolveAttack";
import { eventSeverity } from "./resolveAttack";

export type Severity = 0 | 1 | 2 | 3; // NONE, KNOCKED_DOWN, STUNNED, OUT_OF_ACTION

const OUTCOME_KEYS = ["none", "knockedDown", "stunned", "outOfAction"] as const;

function severityOf(outcome: (typeof OUTCOME_KEYS)[number]): Severity {
  return OUTCOME_KEYS.indexOf(outcome) as Severity;
}

export interface TurnResult {
  /** Final probability distribution over the worst thing that happened to the target this phase. */
  distribution: Severity4Distribution;
  /** Headline: chance the target is taken Out of Action this phase. */
  outOfActionProbability: number;
  /** Chance at least one attack this phase hits (before Parry — a parried blow was still a hit). */
  anyHitProbability: number;
  /** Chance at least one wound got through the saves this phase (the target lost at least one Wound). */
  anyWoundProbability: number;
  /** Chance a critical hit was scored this phase (a trigger-face wound roll that wasn't parried — at most one per phase). */
  criticalHitProbability: number;
  /** Chance the target ends the phase Out of Action, given a critical hit was scored. 0 when a crit is impossible. */
  outOfActionGivenCriticalHit: number;
  /** Probability at least one Ricochet result occurred (informational only — the secondary hit itself is not simulated). */
  ricochetProbability: number;
  /** Attacks resolved this phase. */
  attacks: number;
}

/** DP state: probability mass at [parriesUsed][critConsumed][woundsTaken][worst]. woundsTaken is capped at maxWounds (beyond that every wound rolls). */
type DPState = number[][][][];

function emptyState(maxParries: number, maxWounds: number): DPState {
  return Array.from({ length: maxParries + 1 }, () => Array.from({ length: 2 }, () => Array.from({ length: maxWounds + 1 }, () => [0, 0, 0, 0])));
}

function applyAttack(state: DPState, attack: SingleAttackBreakdown, maxParries: number, maxWounds: number): { next: DPState; ricochetDelta: number } {
  const next = emptyState(maxParries, maxWounds);
  let ricochetDelta = 0;

  const addMass = (parriesUsed: number, critConsumed: 0 | 1, woundsTaken: number, severity: Severity, mass: number) => {
    if (mass === 0) return;
    next[parriesUsed][critConsumed][Math.min(woundsTaken, maxWounds)][severity] += mass;
  };

  // A stunned target: this attack takes it out of action outright, whatever state it was already
  // in (Wounds taken, Parries used, worst so far can only go up) — no wound/injury pipeline at all.
  if (attack.guaranteedOutOfAction) {
    for (let parriesUsed = 0; parriesUsed <= maxParries; parriesUsed++) {
      for (const critConsumed of [0, 1] as const) {
        for (let woundsTaken = 0; woundsTaken <= maxWounds; woundsTaken++) {
          const cell = state[parriesUsed][critConsumed][woundsTaken];
          const mass = cell[0] + cell[1] + cell[2] + cell[3];
          addMass(parriesUsed, critConsumed, woundsTaken, 3, mass);
        }
      }
    }
    return { next, ricochetDelta };
  }

  // pWoundNormal/pWoundTriggerEligible are joint probabilities (already scaled by pHit); express
  // them as fractions of pHit so they can be reapplied to whatever "reaches the pipeline" mass
  // actually is once Parry has taken its cut.
  const normalFrac = attack.pHit > 0 ? attack.pWoundNormal / attack.pHit : 0;
  const triggerFrac = attack.pHit > 0 ? attack.pWoundTriggerEligible / attack.pHit : 0;

  const applyEvents = (events: WoundEvent[], mass: number, parriesUsed: number, critConsumed: 0 | 1, woundsTaken: number, worst: Severity) => {
    for (const event of events) {
      const severity = eventSeverity(event, woundsTaken, maxWounds);
      for (const key of OUTCOME_KEYS) {
        const sub = severity[key];
        if (sub === 0) continue;
        const finalSeverity = Math.max(worst, severityOf(key)) as Severity;
        const eventMass = mass * event.probability * sub;
        if (event.extraAttack && attack.extraAttack && finalSeverity !== 3) {
          const bonusState = emptyState(maxParries, maxWounds);
          bonusState[parriesUsed][critConsumed][Math.min(woundsTaken + event.wounds, maxWounds)][finalSeverity] = eventMass;
          const bonus = applyAttack(bonusState, attack.extraAttack, maxParries, maxWounds);
          for (let p = 0; p <= maxParries; p++) for (const c of [0, 1] as const)
            for (let w = 0; w <= maxWounds; w++) for (const severity of [0, 1, 2, 3] as const)
              addMass(p, c, w, severity, bonus.next[p][c][w][severity]);
        } else {
          addMass(parriesUsed, critConsumed, woundsTaken + event.wounds, finalSeverity, eventMass);
        }
      }
    }
  };

  const resolvePipeline = (mass: number, parriesUsed: number, critConsumed: 0 | 1, woundsTaken: number, worst: Severity) => {
    if (mass === 0) return;
    const massNormal = mass * normalFrac;
    const massTrigger = mass * triggerFrac;
    // Remainder (hit but no wound) leaves everything unchanged.
    addMass(parriesUsed, critConsumed, woundsTaken, worst, mass - massNormal - massTrigger);
    if (massNormal > 0) applyEvents(attack.normalEvents, massNormal, parriesUsed, critConsumed, woundsTaken, worst);
    if (massTrigger > 0) {
      if (critConsumed === 0) {
        ricochetDelta += massTrigger * attack.pRicochetGivenCritConsumedHere;
        applyEvents(attack.critEvents, massTrigger, parriesUsed, 1, woundsTaken, worst);
      } else {
        applyEvents(attack.normalEvents, massTrigger, parriesUsed, 1, woundsTaken, worst);
      }
    }
  };

  for (let parriesUsed = 0; parriesUsed <= maxParries; parriesUsed++) {
    for (const critConsumed of [0, 1] as const) {
      for (let woundsTaken = 0; woundsTaken <= maxWounds; woundsTaken++) {
        for (let worst = 0; worst < 4; worst++) {
          const p = state[parriesUsed][critConsumed][woundsTaken][worst];
          if (p === 0) continue;

          // A miss never rolls to hit, so Parry never enters into it — state unchanged.
          addMass(parriesUsed, critConsumed, woundsTaken, worst as Severity, p * (1 - attack.pHit));

          const canAttemptParry = attack.parryEligible && parriesUsed < maxParries;
          if (!canAttemptParry) {
            resolvePipeline(p * attack.pHit, parriesUsed, critConsumed, woundsTaken, worst as Severity);
            continue;
          }

          const pParried = p * attack.pHit * attack.parrySuccessProbGivenAttempt;
          const pAttemptFailed = p * attack.pHit * (1 - attack.parrySuccessProbGivenAttempt);
          // Parried: the attack is discarded outright — like a miss, but the attempt still spends the resource.
          addMass(parriesUsed + 1, critConsumed, woundsTaken, worst as Severity, pParried);
          // Attempt failed: proceeds through the normal pipeline, resource still spent.
          resolvePipeline(pAttemptFailed, parriesUsed + 1, critConsumed, woundsTaken, worst as Severity);
        }
      }
    }
  }

  return { next, ricochetDelta };
}

/**
 * Resolves a full phase of attacks (possibly with different weapons, e.g. dual-wield) into an
 * exact distribution over the worst outcome the target suffers, handling the one-crit-per-phase
 * rule, Parry attempts and the target's Wounds together. `attacks` must already be in resolution
 * order. `maxParries` — see buildAttackInput.ts's computeMaxParries. `defenderWounds` is the
 * target's Wounds characteristic (default 1).
 */
function resolveIndependentTurn(attacks: SingleAttackBreakdown[], maxParries: number = 0, defenderWounds: number = 1, woundsAlreadyTaken: number = 0, parriesAlreadyUsed = 0): TurnResult {
  const maxWounds = Math.max(1, Math.round(defenderWounds));
  let state = emptyState(maxParries, maxWounds);
  // Lost Wounds carry over between turns: a target already down to its last Wound (or at zero and
  // still standing after a knock down) rolls for injury on the next wound through.
  state[parriesAlreadyUsed][0][Math.min(maxWounds, Math.max(0, Math.round(woundsAlreadyTaken)))][0] = 1;
  let ricochetProbability = 0;

  for (const attack of attacks) {
    const { next, ricochetDelta } = applyAttack(state, attack, maxParries, maxWounds);
    state = next;
    ricochetProbability += ricochetDelta;
  }

  const distribution: Severity4Distribution = { none: 0, knockedDown: 0, stunned: 0, outOfAction: 0 };
  let noWoundsTaken = 0;
  let critMass = 0;
  let critAndOOA = 0;
  for (let parriesUsed = 0; parriesUsed <= maxParries; parriesUsed++) {
    for (const critConsumed of [0, 1] as const) {
      for (let woundsTaken = 0; woundsTaken <= maxWounds; woundsTaken++) {
        const cell = state[parriesUsed][critConsumed][woundsTaken];
        distribution.none += cell[0];
        distribution.knockedDown += cell[1];
        distribution.stunned += cell[2];
        distribution.outOfAction += cell[3];
        if (woundsTaken === 0) noWoundsTaken += cell[0] + cell[1] + cell[2] + cell[3];
        if (critConsumed === 1) {
          critMass += cell[0] + cell[1] + cell[2] + cell[3];
          critAndOOA += cell[3];
        }
      }
    }
  }

  const anyHitProbability = 1 - attacks.reduce((allMiss, attack) => allMiss * (1 - attack.pHit), 1);

  return {
    distribution,
    outOfActionProbability: distribution.outOfAction,
    anyHitProbability,
    anyWoundProbability: 1 - noWoundsTaken,
    criticalHitProbability: critMass,
    outOfActionGivenCriticalHit: critMass > 0 ? critAndOOA / critMass : 0,
    ricochetProbability,
    attacks: attacks.length,
  };
}

/** Partition by the highest hit(s), then run the damage chain in its original weapon order.
 * Each partition leaves independent, truncated hit-face distributions, avoiding 6^attacks enumeration.
 */
export function resolveTurn(attacks: SingleAttackBreakdown[], maxParries = 0, defenderWounds = 1, woundsAlreadyTaken = 0): TurnResult {
  if (maxParries === 0 || !attacks.some(a => a.parryEligible) || attacks.some(a => !a.hitFaces)) {
    return resolveIndependentTurn(attacks, maxParries, defenderWounds, woundsAlreadyTaken);
  }
  const total: TurnResult = { distribution: { none: 0, knockedDown: 0, stunned: 0, outOfAction: 0 }, outOfActionProbability: 0, anyHitProbability: 1 - attacks.reduce((p, a) => p * (1 - a.pHit), 1), anyWoundProbability: 0, criticalHitProbability: 0, outOfActionGivenCriticalHit: 0, ricochetProbability: 0, attacks: attacks.length };
  let jointCritOOA = 0;
  type Face = NonNullable<SingleAttackBreakdown['hitFaces']>[number];
  function accumulate(options: Face[][], selected: Map<number, Face>) {
    let mass = 1;
    const conditioned = attacks.map((a, i) => {
      const faces = selected.has(i) ? [selected.get(i)!] : options[i];
      const weight = faces.reduce((n, f) => n + f.probability, 0);
      mass *= weight;
      const retained = selected.has(i) && a.parryEligible ? 1 - selected.get(i)!.parry : 1;
      const hit = faces.reduce((n, f) => n + (f.face > 0 ? f.probability : 0), 0);
      const wound = faces.reduce((n, f) => n + f.probability * f.wound, 0);
      const trigger = faces.reduce((n, f) => n + f.probability * f.trigger, 0);
      const scale = weight > 0 ? retained / weight : 0;
      return { ...a, hitFaces: undefined, parryEligible: false, pHit: hit * scale, pWound: wound * scale, pWoundNormal: Math.max(0, wound - trigger) * scale, pWoundTriggerEligible: trigger * scale };
    });
    if (mass === 0) return;
    const r = resolveIndependentTurn(conditioned, maxParries, defenderWounds, woundsAlreadyTaken, selected.size);
    for (const k of OUTCOME_KEYS) total.distribution[k] += mass * r.distribution[k];
    total.anyWoundProbability += mass * r.anyWoundProbability;
    total.criticalHitProbability += mass * r.criticalHitProbability;
    jointCritOOA += mass * r.criticalHitProbability * r.outOfActionGivenCriticalHit;
    total.ricochetProbability += mass * r.ricochetProbability;
  }
  function partition(options: Face[][], selected: Map<number, Face>) {
    if (selected.size >= maxParries) { accumulate(options, selected); return; }
    // Fewer hits than available parries: all remaining attacks miss.
    accumulate(options.map((faces, i) => selected.has(i) ? faces : faces.filter(f => f.face === 0)), selected);
    for (let i = 0; i < attacks.length; i++) {
      if (selected.has(i)) continue;
      for (const face of options[i]) {
        if (face.face === 0 || face.probability === 0) continue;
        const next = options.map((faces, j) => selected.has(j) || j === i ? faces : faces.filter(f => f.face < face.face || (f.face === face.face && j > i)));
        partition(next, new Map([...selected, [i, face]]));
      }
    }
  }
  partition(attacks.map(a => a.hitFaces!), new Map());
  total.outOfActionProbability = total.distribution.outOfAction;
  total.outOfActionGivenCriticalHit = total.criticalHitProbability > 0 ? jointCritOOA / total.criticalHitProbability : 0;
  return total;
}
