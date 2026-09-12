import { blackpowderMisfire } from "../../../rules/resolve/blackpowderMisfire"
// Walking real dice through one phase of attacks: to hit, parry, to wound, critical, saves,
// injury. The engine's AttackInput already holds every threshold and flag, so this only has to
// apply the rulebook's order of play and remember what has been used up (the one critical per
// phase, the defender's parry, the target's Wounds). Pure: every step returns a new state.

import { critResultForRoll, type CritResult } from '../../../rules/engine/crit'
import { IMPOSSIBLE, type Threshold } from '../../../rules/engine/dice'
import { resolveInjuryBand } from '../../../rules/engine/injury'
import type { AttackInput } from '../../../rules/engine/resolveAttack'
import { thresholdText } from './odds'

export type RollKind = 'ignition' | 'fishHookFall' | 'chainKnockdown' | 'misfire' | 'pigeonLaunch' | 'firePermission' | 'hit' | 'hitReroll' | 'luckyCharm' | 'parry' | 'parryReroll' | 'dodge' | 'wound' | 'woundReroll' | 'woundSecond' | 'critTable' | 'multiWound' | 'save' | 'stepAside' | 'afterSave' | 'ward' | 'injuryIgnore' | 'injury' | 'stunSave'

export interface PendingRoll {
  kind: RollKind
  who: 'attacker' | 'defender'
  /** "To hit", "Armour save" … */
  label: string
  /** "Needs 4+", "Must beat the 4 rolled to hit" … */
  detail: string
  /** The defender may decline this roll (a parry attempt). */
  optional?: boolean
}

export interface AttackPlan {
  /** Added during resolution, so it has no pre-collected hit die. */
  additionalAttack?: boolean
  weaponName: string
  input: AttackInput
  /** Parry mechanics not carried by AttackInput. A fixed threshold (Starblade 4+) replaces the beat-the-hit-roll test. */
  parry: { beatsOrMatches: boolean; reroll: boolean; fixedThreshold?: number }
  /** Lucky Charm: the target may discard the first hit of the battle on this roll (offered once). */
  luckyCharm?: number
  /** The attacker carries Nurgle's Rot and the target is living: a natural 6 to wound in close combat passes it on. */
  rot?: boolean
}

export type Outcome = 'misfireExplosion' | 'misfire' | 'backfire' | 'cannotFire' | 'entangled' | 'miss' | 'parried' | 'charmed' | 'dodged' | 'noWound' | 'saved' | 'ignored' | 'wounded' | 'knockedDown' | 'stunned' | 'outOfAction'

const OUTCOME_RANK: Record<Outcome, number> = { misfire: 0, misfireExplosion: 0, backfire: 0, cannotFire: 0, entangled: 1, miss: 0, parried: 0, charmed: 0, dodged: 0, noWound: 0, saved: 0, ignored: 1, wounded: 1, knockedDown: 2, stunned: 3, outOfAction: 4 }

export const OUTCOME_LABEL: Record<Outcome, string> = {
  misfire: 'Misfired — the target was not hit',
  misfireExplosion: 'Weapon destroyed — resolve its Strength 4 self-hit',
  backfire: 'Exploded at the firer — resolve the blast at the table',
  cannotFire: 'Unable to fire',
  entangled: 'Entangled',
  miss: 'Missed',
  parried: 'Parried',
  charmed: 'Discarded by the Lucky Charm',
  dodged: 'Dodged',
  noWound: 'Failed to wound',
  saved: 'Saved',
  ignored: 'Injury ignored',
  wounded: 'Wounded',
  knockedDown: 'Knocked down',
  stunned: 'Stunned',
  outOfAction: 'Out of action',
}

export interface LogLine {
  text: string
  tone: 'neutral' | 'good' | 'bad'
}

interface SaveStep {
  kind: 'save' | 'stepAside' | 'afterSave' | 'ward'
  /** Which wound of this hit the step protects (0-based); -1 = one armour save gating every wound. */
  wound: number
}

/** Scratch state for the attack being rolled. */
interface Current {
  ignitionTested?: boolean
  chainTested?: boolean
  chainOriginalOutcome?: Outcome
  firstWoundRoll?: number
  dodgeResolved?: boolean
  hitRoll: number | null
  rerolled: boolean
  /** Set once the wound roll succeeded (or was automatic). */
  crit: CritResult | null
  wounds: number
  savedWounds: Set<number>
  saveQueue: SaveStep[]
  injuryRollsNeeded: number
  injuryResults: ('knockedDown' | 'stunned' | 'outOfAction')[]
  /** Undead Construct: the pending injury roll is ignored if its 4+ comes up. */
  awaitingIgnoreFor: number
  /** Ball and Chain: wounds already locked in (1 normal, or a crit's woundsCaused) while a D3 roll decides if it goes higher. */
  pendingWoundBase: number
}

export interface RollState {
  volatileBackfires?: number
  targetOnFire?: boolean
  smokeHit?: boolean
  hitBatch?: { phase: 'collect' | 'parry' | 'resolve'; hits: { roll: number | null; outcome?: Outcome }[]; parryIndices: number[] }
  plans: AttackPlan[]
  index: number
  defenderW: number
  woundsLost: number
  parriesLeft: number
  critUsed: boolean
  /** The Lucky Charm has been rolled for (or the phase started without one). */
  charmUsed: boolean
  /** Nurgle's Rot passed on this phase (a 6 to wound by a carrier). */
  rotPassed: boolean
  pending: PendingRoll | null
  cur: Current
  log: LogLine[]
  outcomes: Outcome[]
  worst: Outcome | null
  done: boolean
}

function freshCurrent(): Current {
  return { hitRoll: null, rerolled: false, crit: null, wounds: 0, savedWounds: new Set(), saveQueue: [], injuryRollsNeeded: 0, injuryResults: [], awaitingIgnoreFor: 0, pendingWoundBase: 0 }
}

/** Does a D6 face pass a modified threshold, with the natural 1 fails / natural 6 succeeds convention? */
export function passes(roll: number, threshold: Threshold): boolean {
  if (threshold === IMPOSSIBLE) return false
  if (roll <= 1) return false
  if (roll >= 6) return true
  return roll >= threshold
}

/** Saves have no natural-six rescue: a 7+ save is no save, a 1 always fails. */
function passesSave(roll: number, threshold: Threshold): boolean {
  if (threshold === IMPOSSIBLE) return false
  return roll >= 2 && roll >= threshold
}

export function startPhase(plans: AttackPlan[], defenderW: number, maxParries: number, woundsAlreadyLost = 0, charmAvailable = false): RollState {
  const state: RollState = {
    plans,
    index: 0,
    defenderW: Math.max(1, defenderW),
    woundsLost: Math.max(0, Math.min(Math.max(1, defenderW), Math.trunc(woundsAlreadyLost))),
    parriesLeft: maxParries,
    critUsed: false,
    charmUsed: !charmAvailable,
    rotPassed: false,
    pending: null,
    cur: freshCurrent(),
    log: [],
    outcomes: [],
    worst: null,
    done: plans.length === 0,
    hitBatch: plans.length > 1 && maxParries > 0 && plans.some(p => p.input.parryEligible) && !plans.some(p => p.input.automaticHits || p.input.autoHitKnockedDown || p.input.autoOutOfActionStunned)
      ? { phase: 'collect', hits: [], parryIndices: [] } : undefined,
  }
  return state.done ? state : beginAttack(state)
}

const ORDINALS = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth']

/** "First", "Second"... "Eighth", then "9th", "10th" for anything past that (no character realistically has this many attacks). */
function ordinal(n: number): string {
  return ORDINALS[n - 1] ?? `${n}th`
}

/** A single attack needs no numbering; more than one is labelled by its place in the sequence, not by weapon, so a Sword-then-Dagger phase still reads "First attack" / "Second attack". */
function attackName(state: RollState): string {
  const plan = state.plans[state.index]
  if (state.plans.length === 1) return plan.weaponName
  return `${ordinal(state.index + 1)} attack (${plan.weaponName})`
}

function beginAttack(state: RollState, permissionGranted = false): RollState {
  const plan = state.plans[state.index]
  const fresh: RollState = { ...state, cur: freshCurrent() }
  if (state.hitBatch?.phase === 'resolve' && !plan.additionalAttack) {
    const hit = state.hitBatch.hits[state.index]
    if (hit.outcome) return finishAttack(fresh, hit.outcome)
    return afterHit({ ...fresh, cur: { ...fresh.cur, hitRoll: hit.roll } })
  }
  if (plan.input.firePermissionThreshold !== undefined && !permissionGranted) return { ...fresh, pending: { kind: 'firePermission', who: 'attacker', label: 'Overcome the Lady’s blessing', detail: `Needs ${plan.input.firePermissionThreshold}+ to fire this shot; a failed test ends this shot before to-hit.` } }
  // A stunned target: taken out of action by the first hit in hand-to-hand combat, no rolls at all (01:947-959).
  if (plan.input.autoOutOfActionStunned) {
    return finishAttack(log(fresh, `${attackName(state)}: the target is stunned — automatically out of action.`, 'good'), 'outOfAction')
  }
  // A knocked-down target: hits automatically and may not parry, but still rolls to wound and save as normal.
  if (plan.input.autoHitKnockedDown) {
    return askWound(log(fresh, `${attackName(state)}: automatic hit — the target is knocked down.`, 'good'))
  }
  if (plan.input.automaticHits) {
    const hit = log(fresh, `${attackName(state)}: ${plan.input.automaticHitReason === 'mortarBlast' ? 'automatic Mortar blast hit' : plan.input.automaticHitReason === 'grapeShot' ? 'automatic Grape Shot hit — no armour save modifier' : plan.input.automaticHitReason === 'zeroWeaponSkill' ? 'automatic hit — the target has Weapon Skill 0' : plan.input.automaticHitReason === 'blackpowderExplosion' ? 'automatic Strength 4 self-hit from the exploding weapon; no critical hits' : plan.input.automaticHitReason === 'pigeonBlast' ? 'automatic Strength 4 hit — this model is in the Pigeon Bomb blast' : plan.input.automaticHitReason === 'blunderbussLine' ? 'automatic hit — this model is in the blunderbuss line' : 'automatic spell hit'}.`, 'good')
    if (plan.input.automaticHitReason && plan.input.dodgeThreshold !== undefined && plan.input.dodgeThreshold !== IMPOSSIBLE) return afterHit(hit)
    return plan.input.automaticHitReason ? offerCharmOrContinue(hit) : askWound(hit)
  }
  const t = plan.input.hitThreshold
  return {
    ...fresh,
    pending: {
      kind: plan.input.temperamentalPigeon ? 'pigeonLaunch' : 'hit',
      who: 'attacker',
      label: plan.input.temperamentalPigeon ? 'Pigeon launch D6' : `${attackName(state)}: to hit`,
      detail: plan.input.temperamentalPigeon ? '5–6: on target; 2–4: harmless; 1: explodes at the firer. Ballistic Skill and shooting modifiers do not apply.' : t === IMPOSSIBLE ? 'Cannot hit' : `Needs ${thresholdText(t)}`,
    },
  }
}

function log(state: RollState, text: string, tone: LogLine['tone'] = 'neutral'): RollState {
  return { ...state, log: [...state.log, { text, tone }] }
}

function finishAttack(state: RollState, outcome: Outcome): RollState {
  if ((outcome === 'noWound' || outcome === 'saved') && state.plans[state.index]?.input.chainShotKnockdown && !state.cur.chainTested) return { ...state, cur: { ...state.cur, chainOriginalOutcome: outcome }, pending: { kind: 'chainKnockdown', who: 'attacker', label: 'Chain Shot knock-down', detail: 'Hit but no unsaved wound: 4+ knocks the target down, even if normally immune.' } }

  if (state.hitBatch?.phase === 'collect') return collectHit(state, outcome)
  if (state.hitBatch?.phase === 'parry') return nextBatchParry({ ...state, hitBatch: { ...state.hitBatch, hits: state.hitBatch.hits.map((h, i) => i === state.index ? { ...h, outcome } : h) } })
  const outcomes = [...state.outcomes, outcome]
  const worst = state.worst === null || OUTCOME_RANK[outcome] > OUTCOME_RANK[state.worst] ? outcome : state.worst
  let next: RollState = { ...state, outcomes, worst, pending: null }
  if (outcome === 'outOfAction') {
    next = log(next, `${OUTCOME_LABEL[outcome]}! The target is out of action; any remaining attacks are not needed.`, 'good')
    return { ...next, done: true, index: state.plans.length }
  }
  const barrage = outcome === 'noWound' && state.plans[state.index].input.barrageOnFailedWound
  if (state.cur.crit?.extraAttack || barrage) {
    const plans = [...state.plans]
    const original = state.plans[state.index]
    plans.splice(state.index + 1, 0, { ...original, additionalAttack: true,
      input: barrage ? { ...original.input, hitThreshold: original.input.hitThreshold === IMPOSSIBLE ? IMPOSSIBLE : Math.min(6, original.input.hitThreshold + 1) } : original.input })
    const hitBatch = state.hitBatch ? { ...state.hitBatch, hits: [...state.hitBatch.hits] } : undefined
    hitBatch?.hits.splice(state.index + 1, 0, { roll: null })
    next = log({ ...next, plans, hitBatch }, barrage ? 'Barrage: hit but failed to wound. Make another attack at −1 to hit, capped at needing 6.' : 'Body Blow: resolve one additional attack. This warrior has already used its critical hit.', 'good')
  }
  if (state.index + 1 >= next.plans.length) return { ...next, done: true }
  return beginAttack({ ...next, index: state.index + 1 })
}

/** Roll every hit before choosing the highest for parry; damage still resolves in attack order. */
function collectHit(state: RollState, outcome?: Outcome): RollState {
  const batch = state.hitBatch!
  const hits = [...batch.hits, { roll: state.cur.hitRoll, outcome }]
  if (hits.length < state.plans.length) return beginAttack({ ...state, index: state.index + 1, hitBatch: { ...batch, hits } })
  const ranked = hits.map((h, index) => ({ ...h, index })).filter(h => !h.outcome && h.roll !== null).sort((a, b) => b.roll! - a.roll! || a.index - b.index)
  const chosen = ranked.slice(0, state.parriesLeft).map(h => h.index)
  return nextBatchParry({ ...state, index: 0, hitBatch: { phase: 'parry', hits, parryIndices: chosen } })
}

function nextBatchParry(state: RollState): RollState {
  const batch = state.hitBatch!
  const [index, ...remaining] = batch.parryIndices
  if (index === undefined) return beginAttack({ ...state, index: 0, hitBatch: { ...batch, phase: 'resolve' } })
  return offerParry({ ...state, index, cur: { ...freshCurrent(), hitRoll: batch.hits[index].roll }, hitBatch: { ...batch, parryIndices: remaining } })
}

function afterCollectedHit(state: RollState): RollState {
  return state.hitBatch?.phase === 'collect' ? collectHit(state) : offerParry(state)
}

/** The defender declines an optional roll (a parry attempt, or the Lucky Charm): the hit stands. */
export function declineRoll(state: RollState): RollState {
  if (!state.pending?.optional) return state
  if (state.pending.kind === 'luckyCharm') return afterCollectedHit(log({ ...state, charmUsed: false }, 'The Lucky Charm is kept for later.'))
  return afterHit(log(state, 'No parry attempted.'))
}

export function applyRoll(initial: RollState, roll: number, manual?: boolean): RollState {
  let state = initial
  const pending = state.pending
  if (!pending || state.done) return state
  const plan = state.plans[state.index]
  const input = plan.input
  /** Matches RollResult's own wording (Dice.tsx), so the persisted log line agrees with what was shown on screen at the time. */
  let rollTag = manual === undefined ? '' : manual ? ' (entered by hand)' : ' (rolled by the app)'
  switch (pending.kind) {
    case 'ignition': {
      const ignited = roll >= (input.ignitionThreshold ?? 7)
      return askWound(log({ ...state, targetOnFire: state.targetOnFire || ignited, cur: { ...state.cur, ignitionTested: true } }, `Ignition: rolled ${roll}${rollTag}; needs ${input.ignitionThreshold}+. ${ignited ? 'Target set on fire. If it survives, test to extinguish on 4+ in Recovery; failure causes a Strength 4 hit and allows only movement. An ally in base contact can help on 4+.' : 'Target does not catch fire from this hit.'}`, ignited ? 'good' : 'neutral'))
    }
    case 'fishHookFall': {
      const passed = roll < 6 && roll <= (input.fishHookFallThreshold ?? 0)
      const knocked = passed && !input.ignoreKnockedDownAndStunned
      return finishAttack(log(state, `Fish-hook Strength test: rolled ${roll}${rollTag}. ${knocked ? 'Target knocked down; no wound inflicted. If the target is a mount, resolve its rider’s fall using Whoa Boy! 3–4 at the table.' : passed ? 'Target ignores knock-down; no wound inflicted.' : 'Failed; no fall or wound.'}`,knocked?'good':'neutral'),knocked?'knockedDown':'noWound')
    }
    case 'chainKnockdown': {
      const knocked = roll >= 4;
      return finishAttack(log({ ...state, cur: { ...state.cur, chainTested: true } }, `Chain Shot: rolled ${roll}${rollTag}. ${knocked ? 'Knocked down, even if normally immune.' : 'Remains standing.'}`, knocked ? 'good' : 'neutral'), knocked ? 'knockedDown' : state.cur.chainOriginalOutcome ?? 'noWound');
    }

    case 'firePermission': {
      const allowed = passesSave(roll, input.firePermissionThreshold ?? 4)
      const next = log(state, `Blessing of the Lady: rolled ${roll}${rollTag}. ${allowed ? 'May fire this shot.' : 'Cannot fire this shot.'}`, allowed ? 'good' : 'bad')
      return allowed ? beginAttack(next, true) : finishAttack(next, 'cannotFire')
    }

    case 'misfire': {
      const result = blackpowderMisfire(roll)
      const next = log(state, `Misfire: rolled ${roll}${rollTag}. ${result.name}: ${result.detail}`, result.fires ? 'good' : 'bad')
      if (!result.fires) return finishAttack(next, result.weaponDestroyed ? 'misfireExplosion' : 'misfire')
      const enhanced = input.misfireEnhanced!
      const changed = { ...next, plans: next.plans.map((p, index) => index === next.index ? { ...p, input: { ...enhanced, firePermissionThreshold: undefined, misfireEnhanced: undefined } } : p), cur: { ...next.cur, hitRoll: 1 } }
      if (enhanced.dodgeThreshold !== undefined && enhanced.dodgeThreshold !== IMPOSSIBLE) return afterHit(changed)
      return offerCharmOrContinue(changed)
    }
    case 'pigeonLaunch':
    case 'hit':
    case 'hitReroll': {
      if (roll === 1 && input.misfireEnhanced) return { ...log(state, `${attackName(state)}: rolled 1${rollTag} to hit. Roll on the mandatory Blackpowder Misfire table.`, 'bad'), pending: { kind: 'misfire', who: 'attacker', label: 'Blackpowder misfire D6', detail: '1: destroyed and S4 self-hit; 2: jammed; 3: extra reload turn; 4–5: no shot; 6: hit at +1 Strength.' } }
      if (input.temperamentalPigeon && roll < 5) {
        const detail = roll === 1 ? 'The bomb explodes in the firer’s hands. At the table, resolve one Strength 4 hit on the firer and everyone within 1½ inches. This target result does not apply those wounds.' : 'The bomb explodes harmlessly in the air before reaching the target.'
        return finishAttack(log(state, `Pigeon launch: rolled ${roll}${rollTag}. ${detail}`, roll === 1 ? 'bad' : 'neutral'), roll === 1 ? 'backfire' : 'miss')
      }
      if (passes(roll, input.hitThreshold)) {
        const s = log({ ...state, cur: { ...state.cur, hitRoll: roll } }, input.temperamentalPigeon ? `Pigeon launch: rolled ${roll}${rollTag}. Lands on target. Resolve this target’s Strength 4 hit here and every other model within 1½ inches at the table.` : `${attackName(state)}: rolled ${roll}${rollTag} to hit. Hit.`, 'good')
        // Dodge explicitly precedes equipment, including the first-hit Lucky Charm (03:557).
        if (input.dodgeThreshold !== undefined && input.dodgeThreshold !== IMPOSSIBLE) return afterHit(s)
        return offerCharmOrContinue(s)
      }
      if (roll === 1 && input.entangleInsteadOfWound) state = log(state, 'Bolas backfire: resolve a separate Strength 3 hit on the wielder at the table. This target result does not apply that self-hit.', 'bad')
      if (pending.kind === 'hit' && input.rerollToHit) {
        return {
          ...log(state, `${attackName(state)}: rolled ${roll}${rollTag} to hit. Missed, but the miss may be rerolled.`),
          cur: { ...state.cur, rerolled: true },
          pending: { kind: 'hitReroll', who: 'attacker', label: `${attackName(state)}: reroll to hit`, detail: `Needs ${thresholdText(input.hitThreshold)}` },
        }
      }
      if (roll === 1 && input.volatileBackfire) return finishAttack(log({ ...state, volatileBackfires: (state.volatileBackfires ?? 0) + 1 }, `Cathayan Candles: rolled 1${rollTag} to hit. They explode in the thrower’s hand; the intended target is not hit. Log this result, then resolve the separate Strength 6 hit on the thrower.`, 'bad'), 'backfire')
      return finishAttack(log(state, `${attackName(state)}: rolled ${roll}${rollTag} to hit. Missed.`, 'bad'), 'miss')
    }
    case 'luckyCharm': {
      if (passesSave(roll, plan.luckyCharm ?? IMPOSSIBLE)) return finishAttack(log(state, `Lucky Charm: rolled ${roll}${rollTag}. The hit is discarded.`, 'bad'), 'charmed')
      return afterCollectedHit(log(state, `Lucky Charm: rolled ${roll}${rollTag}. No luck.`, 'good'))
    }
    case 'parry':
    case 'parryReroll': {
      const hitRoll = state.cur.hitRoll ?? 6
      const success =
        plan.parry.fixedThreshold !== undefined
          ? passesSave(roll, plan.parry.fixedThreshold)
          : input.opposedParryWS && input.attackerWS !== undefined && input.defenderWS !== undefined
            ? plan.parry.beatsOrMatches
              ? input.defenderWS + roll >= input.attackerWS + hitRoll
              : input.defenderWS + roll > input.attackerWS + hitRoll
            : plan.parry.beatsOrMatches
              ? roll >= hitRoll
              : roll > hitRoll
      if (success) return finishAttack(log(state, `Parry: rolled ${roll}${rollTag} against the ${hitRoll} to hit. Parried!`, 'bad'), 'parried')
      if (pending.kind === 'parry' && plan.parry.reroll) {
        return {
          ...log(state, `Parry: rolled ${roll}${rollTag} against the ${hitRoll} to hit. Failed; the parry may be rerolled.`),
          pending: { kind: 'parryReroll', who: 'defender', label: 'Parry reroll', detail: parryDetail(plan, hitRoll) },
        }
      }
      return afterHit(log(state, `Parry: rolled ${roll}${rollTag} against the ${hitRoll} to hit. Failed.`, 'good'))
    }
    case 'dodge': {
      if (passesSave(roll, input.dodgeThreshold ?? IMPOSSIBLE)) return finishAttack(log(state, `Dodge: rolled ${roll}${rollTag}. Dodged!`, 'bad'), 'dodged')
      return offerCharmOrContinue(log({ ...state, cur: { ...state.cur, dodgeResolved: true } }, `Dodge: rolled ${roll}${rollTag}. Failed.`, 'good'))
    }
    case 'wound':
    case 'woundReroll':
    case 'woundSecond': {
      if (pending.kind === 'wound' && input.woundHighestOfTwo) {
        return { ...log(state, `To wound: first die ${roll}${rollTag}; roll the second die and keep the higher.`), cur: { ...state.cur, firstWoundRoll: roll }, pending: { kind: 'woundSecond', who: 'attacker', label: 'To wound (second die)', detail: 'Roll even if the first die succeeded; the higher die decides wounds and critical hits.' } }
      }
      if (pending.kind === 'woundSecond') {
        state = log(state, `To wound: second die ${roll}${rollTag}.`)
        roll = Math.max(state.cur.firstWoundRoll ?? roll, roll)
        rollTag = ' (higher of the two dice)'
      }
      const auto = Boolean(input.autoWoundOnNaturalSixToHit) && state.cur.hitRoll === 6
      const wounded = auto || passes(roll, input.woundThreshold)
      if (wounded && roll === 6 && plan.rot && !state.rotPassed) state = log({ ...state, rotPassed: true }, "A 6 to wound from a carrier of Nurgle's Rot: the target contracts the Rot.", 'good')
      if (!wounded && pending.kind === 'wound' && input.rerollToWound) {
        return { ...log(state, `To wound: rolled ${roll}${rollTag}. No wound on the first die; roll the second and keep the highest.`), pending: { kind: 'woundReroll', who: 'attacker', label: 'To wound (second die)', detail: `Needs ${thresholdText(input.woundThreshold)}` } }
      }
      if (!wounded) return finishAttack(log(state, `To wound: rolled ${roll}${rollTag}. No wound.`, 'bad'), 'noWound')
      const critEligible = !state.critUsed && input.woundThreshold !== IMPOSSIBLE && roll > input.woundThreshold && input.critTriggerFaces.includes(roll)
      if (critEligible) {
        const s = log({ ...state, critUsed: true }, `To wound: rolled ${roll}${rollTag}. Wounded, and it is a critical hit!`, 'good')
        return { ...s, pending: { kind: 'critTable', who: 'attacker', label: 'Critical hit table', detail: input.critTableRollModifier ? `D6 ${input.critTableRollModifier > 0 ? '+' : ''}${input.critTableRollModifier}` : 'Roll a D6' } }
      }
      const s = log(state, auto ? `To wound: automatic wound from the 6 to hit (rolled ${roll}${rollTag}, no critical).` : `To wound: rolled ${roll}${rollTag}. Wounded.`, 'good')
      if (input.multipleWoundsD3OnHit) {
        return { ...s, cur: { ...s.cur, crit: null, pendingWoundBase: 1 }, pending: { kind: 'multiWound', who: 'attacker', label: `${plan.weaponName}: Wounds caused`, detail: 'Roll a D3 for how many Wounds this hit causes' } }
      }
      return startSaves({ ...s, cur: { ...s.cur, crit: null, wounds: 1 } })
    }
    case 'critTable': {
      const result = critResultForRoll(input.critTable, roll, input.critTableRollModifier)
      const bits: string[] = []
      if (result.woundsCaused > 1) bits.push(`${result.woundsCaused} wounds`)
      if (result.ignoresArmourSave) bits.push('no armour save')
      if (result.injuryRollBonus) bits.push(`+${result.injuryRollBonus} to injury`)
      if (result.autoOOAOnFailedSave) bits.push('out of action if the save fails')
      if (result.minSeverityKnockedDown) bits.push('knocked down even if saved')
      if (result.ignoresHelmetSave) bits.push('no helmet save')
      if (result.extraAttack) bits.push('one additional attack')
      if (result.flavourOnly) bits.push(result.flavourOnly)
      const s = log(state, `Critical: rolled ${roll}${rollTag}. ${result.label}${bits.length ? ` (${bits.join(', ')})` : ''}.`, 'good')
      if (input.multipleWoundsD3OnHit) {
        return { ...s, cur: { ...s.cur, crit: result, pendingWoundBase: result.woundsCaused }, pending: { kind: 'multiWound', who: 'attacker', label: `${plan.weaponName}: Wounds caused`, detail: `Roll a D3; the critical's ${result.woundsCaused} wound${result.woundsCaused > 1 ? 's' : ''} stands if it's higher` } }
      }
      return startSaves({ ...s, cur: { ...s.cur, crit: result, wounds: result.woundsCaused } })
    }
    case 'multiWound': {
      const wounds = Math.max(state.cur.pendingWoundBase, roll)
      const beaten = wounds !== roll
      const s = log(state, `${plan.weaponName}: rolled ${roll}${rollTag} on the D3.${beaten ? ` The critical's ${state.cur.pendingWoundBase} wounds is higher, so that stands.` : ` ${wounds} wound${wounds > 1 ? 's' : ''} caused.`}`, 'good')
      return startSaves({ ...s, cur: { ...s.cur, wounds } })
    }
    case 'save': {
      const step = state.cur.saveQueue[0]
      const saved = passesSave(roll, input.armourThreshold)
      if (saved) {
        if (step.wound === -1) {
          const s = log(state, `Armour save: rolled ${roll}${rollTag}. Saved.`, 'bad')
          if (state.cur.crit?.minSeverityKnockedDown) return finishAttack(log(s, 'Thrust: the target is knocked down all the same.', 'good'), 'knockedDown')
          return finishAttack(s, 'saved')
        }
        const savedWounds = new Set(state.cur.savedWounds).add(step.wound)
        const queue = state.cur.saveQueue.slice(1).filter((q) => q.wound !== step.wound)
        return nextSaveStep(log({ ...state, cur: { ...state.cur, savedWounds, saveQueue: queue } }, `Armour save (wound ${step.wound + 1}): rolled ${roll}${rollTag}. Saved.`, 'bad'))
      }
      const s = log(state, `Armour save: rolled ${roll}${rollTag}. Failed.`, 'good')
      if (state.cur.crit?.autoOOAOnFailedSave) return finishAttack(log(s, 'Bludgeoned: straight out of action.', 'good'), 'outOfAction')
      return nextSaveStep({ ...s, cur: { ...s.cur, saveQueue: s.cur.saveQueue.slice(1) } })
    }
    case 'stepAside':
    case 'afterSave':
    case 'ward': {
      const step = state.cur.saveQueue[0]
      const threshold = pending.kind === 'stepAside' ? input.stepAsideThreshold : pending.kind === 'afterSave' ? input.afterSaveThreshold : input.wardSaveThreshold
      const name = pending.kind === 'stepAside' ? 'Step Aside' : pending.kind === 'afterSave' ? 'Peg Leg' : 'Ward save'
      if (passesSave(roll, threshold ?? IMPOSSIBLE)) {
        const savedWounds = new Set(state.cur.savedWounds).add(step.wound)
        const queue = state.cur.saveQueue.slice(1).filter((q) => q.wound !== step.wound)
        return nextSaveStep(log({ ...state, cur: { ...state.cur, savedWounds, saveQueue: queue } }, `${name}: rolled ${roll}${rollTag}. Saved.`, 'bad'))
      }
      return nextSaveStep(log({ ...state, cur: { ...state.cur, saveQueue: state.cur.saveQueue.slice(1) } }, `${name}: rolled ${roll}${rollTag}. Failed.`, 'good'))
    }
    case 'injuryIgnore': {
      if (passesSave(roll, input.injuryIgnoreThreshold ?? IMPOSSIBLE)) {
        const s = log(state, `Undead Construct: rolled ${roll}${rollTag}. The injury is ignored (the wound is still lost).`, 'bad')
        return injuryRolled(s, null)
      }
      const s = log(state, `Undead Construct: rolled ${roll}${rollTag}. The injury counts.`, 'good')
      return { ...s, pending: injuryPending(s) }
    }
    case 'injury': {
      const bonus = input.injuryRollModifier + (state.cur.crit?.injuryRollBonus ?? 0)
      const modified = roll + bonus
      const [koMax, stunnedMax] = resolveInjuryBand(input.concussion, input.trueGrit, input.hardToKill, input.injuryRemap)
      const result: 'knockedDown' | 'stunned' | 'outOfAction' = modified <= koMax ? 'knockedDown' : modified <= stunnedMax ? 'stunned' : 'outOfAction'
      const s = log(state, `Injury: rolled ${roll}${rollTag}${bonus ? ` (${modified} after +${bonus})` : ''}. ${OUTCOME_LABEL[result]}.`, result === 'outOfAction' ? 'good' : 'neutral')
      if (input.ignoreKnockedDownAndStunned && result !== 'outOfAction') return injuryRolled(log(s, "Veskit’s No Pain: ignores the knocked-down or stunned result; the wound is still lost.", 'bad'), null)
      if (input.ignoreRolledKnockedDown && result === 'knockedDown') return injuryRolled(log(s, "Jump Up: ignores this rolled knocked-down result; the wound is still lost.", 'bad'), null)
      return injuryRolled(s, result)
    }
    case 'stunSave': {
      if (passesSave(roll, input.stunAvoidanceThreshold ?? IMPOSSIBLE)) return finishAttack(log(state, `Helmet: rolled ${roll}${rollTag}. The stun becomes knocked down.`, 'bad'), 'knockedDown')
      return finishAttack(log(state, `Helmet: rolled ${roll}${rollTag}. Still stunned.`, 'good'), 'stunned')
    }
  }
}

function parryDetail(plan: AttackPlan, hitRoll: number): string {
  if (plan.parry.fixedThreshold !== undefined) return `Parries on ${plan.parry.fixedThreshold}+ whatever was rolled to hit`
  const { opposedParryWS, attackerWS, defenderWS } = plan.input
  if (opposedParryWS && attackerWS !== undefined && defenderWS !== undefined) {
    const attackerTotal = attackerWS + hitRoll
    return `Opposed WS: ${defenderWS} + the parry roll must ${plan.parry.beatsOrMatches ? 'match or beat' : 'beat'} ${attackerWS} + ${hitRoll} = ${attackerTotal}`
  }
  return plan.parry.beatsOrMatches ? `Must match or beat the ${hitRoll} rolled to hit` : `Must beat the ${hitRoll} rolled to hit${hitRoll >= 6 ? ' (impossible)' : ''}`
}

/** After a hit lands: parry if the defender still can, otherwise on to dodge / wound. */
function offerParry(state: RollState): RollState {
  const plan = state.plans[state.index]
  const hitRoll = state.cur.hitRoll ?? 6
  if (state.parriesLeft > 0 && (!plan.input.parryEligible || (hitRoll === 6 && !plan.parry.beatsOrMatches && !plan.input.opposedParryWS && plan.parry.fixedThreshold === undefined))) {
    return afterHit(log({ ...state, parriesLeft: Math.max(0, state.parriesLeft - 1) }, 'The highest hit cannot be parried; this parry opportunity is lost.'))
  }
  if (plan.input.parryEligible && state.parriesLeft > 0) {
    return {
      ...state,
      parriesLeft: state.parriesLeft - 1,
      pending: { kind: 'parry', who: 'defender', label: 'Parry', detail: parryDetail(plan, hitRoll), optional: true },
    }
  }
  return afterHit(state)
}

function offerCharmOrContinue(state: RollState): RollState {
  const plan = state.plans[state.index]
  if (!state.charmUsed && plan.luckyCharm !== undefined) {
    return { ...state, charmUsed: true, pending: { kind: 'luckyCharm', who: 'defender', label: 'Lucky Charm', detail: `The first hit that was not dodged: discarded on ${plan.luckyCharm}+`, optional: true } }
  }
  return afterCollectedHit(state)
}

function afterHit(state: RollState): RollState {
  if (state.hitBatch?.phase === 'parry') return nextBatchParry(state)
  const input = state.plans[state.index].input
  if (!state.cur.dodgeResolved && input.dodgeThreshold !== undefined && input.dodgeThreshold !== IMPOSSIBLE) {
    return { ...state, pending: { kind: 'dodge', who: 'defender', label: 'Dodge', detail: `Needs ${thresholdText(input.dodgeThreshold)}` } }
  }
  return askWound(state)
}

function askWound(state: RollState): RollState {
  const input = state.plans[state.index].input
  if (input.ignitionThreshold !== undefined && !state.cur.ignitionTested) return { ...state, pending: { kind: 'ignition', who: 'attacker', label: 'Set target on fire', detail: `Roll ${input.ignitionThreshold}+; the normal wound roll follows whether or not the target catches fire.` } }
  if (input.smokeOnHit) state = log({...state,smokeHit:true}, 'Firepot smoke: at the start of the target’s next own turn, roll under Initiative. Failure prevents charging and shooting until its following own turn. Resolve group members separately.')
  if (input.fishHookFallThreshold !== undefined) return {...state,pending:{kind:'fishHookFall',who:'attacker',label:'Fish-hook Strength test',detail:`Roll ${input.fishHookFallThreshold} or less; 6 always fails. The +1 test modifier against a large target is already included. This replaces all damage.`}}
  if (input.entangleInsteadOfWound) return finishAttack(log(state, 'Bolas entangle the target without a wound: it cannot move and has −2 Weapon Skill in hand-to-hand combat, but may shoot normally. At the table, roll a D6 in Recovery; 4+ frees it. Log this result to record entanglement for an individually identified target; track members of groups separately.', 'good'), 'entangled')
  const auto = Boolean(input.autoWoundOnNaturalSixToHit) && state.cur.hitRoll === 6
  const detail = auto ? 'Automatic wound from the 6 to hit; roll to check for a critical' : input.woundThreshold === IMPOSSIBLE ? 'Cannot wound' : `Needs ${thresholdText(input.woundThreshold)}`
  return { ...state, pending: { kind: 'wound', who: 'attacker', label: 'To wound', detail } }
}

/** A wound (or a critical's wounds) has landed: queue the armour save, Step Aside and Ward save. */
function startSaves(state: RollState): RollState {
  const input = state.plans[state.index].input
  const crit = state.cur.crit
  const armourApplies = input.armourThreshold !== IMPOSSIBLE && !crit?.ignoresArmourSave
  const separate = (crit?.separateSaves ?? 1) > 1
  const queue: SaveStep[] = []
  if (armourApplies && !separate) queue.push({ kind: 'save', wound: -1 })
  for (let i = 0; i < state.cur.wounds; i++) {
    if (armourApplies && separate) queue.push({ kind: 'save', wound: i })
    if (input.stepAsideThreshold !== undefined) queue.push({ kind: 'stepAside', wound: i })
    if (input.afterSaveThreshold !== undefined) queue.push({ kind: 'afterSave', wound: i })
    if (input.wardSaveThreshold !== undefined) queue.push({ kind: 'ward', wound: i })
  }
  return nextSaveStep({ ...state, cur: { ...state.cur, saveQueue: queue } })
}

function nextSaveStep(state: RollState): RollState {
  const input = state.plans[state.index].input
  const step = state.cur.saveQueue[0]
  if (step) {
    const many = state.cur.wounds > 1 && step.wound >= 0 ? ` (wound ${step.wound + 1})` : ''
    if (step.kind === 'save') return { ...state, pending: { kind: 'save', who: 'defender', label: `Armour save${many}`, detail: `Needs ${thresholdText(input.armourThreshold)}` } }
    if (step.kind === 'stepAside') return { ...state, pending: { kind: 'stepAside', who: 'defender', label: `Step Aside${many}`, detail: `Needs ${thresholdText(input.stepAsideThreshold ?? IMPOSSIBLE)}` } }
    if (step.kind === 'afterSave') return { ...state, pending: { kind: 'afterSave', who: 'defender', label: `Peg Leg${many}`, detail: `Needs ${thresholdText(input.afterSaveThreshold ?? IMPOSSIBLE)}, never modified` } }
    return { ...state, pending: { kind: 'ward', who: 'defender', label: `Ward save${many}`, detail: `Needs ${thresholdText(input.wardSaveThreshold ?? IMPOSSIBLE)}` } }
  }
  return woundsThrough(state)
}

/** Every save has been rolled: count what got through, take Wounds off the target and roll injuries. */
function woundsThrough(state: RollState): RollState {
  const through = state.cur.wounds - state.cur.savedWounds.size
  if (through <= 0) {
    if (state.cur.crit?.minSeverityKnockedDown) return finishAttack(log(state, 'Thrust: the target is knocked down all the same.', 'good'), 'knockedDown')
    return finishAttack(state, 'saved')
  }
  if (state.cur.crit?.autoOOAOnFailedSave) return finishAttack(log(state, 'Bludgeoned: straight out of action.', 'good'), 'outOfAction')
  if (state.plans[state.index].input.autoHitKnockedDown) {
    return finishAttack(log({ ...state, woundsLost: state.woundsLost + through }, 'An unsaved wound against a knocked-down target: automatically out of action.', 'good'), 'outOfAction')
  }
  const before = state.woundsLost
  const after = before + through
  // Injury is rolled for the wound that takes the target to zero Wounds and every wound after it.
  const rolls = Math.max(0, after - Math.max(before, state.defenderW - 1))
  let s: RollState = { ...state, woundsLost: after, cur: { ...state.cur, injuryRollsNeeded: rolls, injuryResults: [] } }
  if (rolls === 0) {
    s = log(s, `${through === 1 ? 'One wound' : `${through} wounds`} taken: ${Math.max(0, state.defenderW - after)} of ${state.defenderW} Wounds left, so no injury roll yet.`, 'good')
    return finishAttack(s, 'wounded')
  }
  s = log(s, rolls === 1 ? 'The wound gets through: roll for injury.' : `${rolls} injury rolls: the highest result applies.`, 'good')
  return { ...s, pending: nextInjuryPending(s) }
}

function injuryPending(state: RollState): PendingRoll {
  const input = state.plans[state.index].input
  const bonus = input.injuryRollModifier + (state.cur.crit?.injuryRollBonus ?? 0)
  const [koMax, stunnedMax] = resolveInjuryBand(input.concussion, input.trueGrit, input.hardToKill, input.injuryRemap)
  const n = state.cur.injuryResults.length + 1
  const many = state.cur.injuryRollsNeeded > 1 ? ` ${n} of ${state.cur.injuryRollsNeeded}` : ''
  const band = `${koMax >= 2 ? `1-${koMax}` : '1'} knocked down, ${stunnedMax > koMax + 1 ? `${koMax + 1}-${stunnedMax}` : `${stunnedMax}`} stunned, ${stunnedMax + 1 <= 6 ? `${stunnedMax + 1}${stunnedMax + 1 < 6 ? '-6' : ''}` : 'never'} out of action`
  return { kind: 'injury', who: 'attacker', label: `Injury roll${many}`, detail: bonus ? `D6 +${bonus}: ${band}` : band }
}

function nextInjuryPending(state: RollState): PendingRoll {
  const input = state.plans[state.index].input
  if (input.injuryIgnoreThreshold !== undefined) {
    return { kind: 'injuryIgnore', who: 'defender', label: 'Undead Construct', detail: `Ignores the injury on ${thresholdText(input.injuryIgnoreThreshold)}` }
  }
  return injuryPending(state)
}

/** One injury roll is resolved (null = ignored by Undead Construct). Move to the next, or settle the attack. */
function injuryRolled(state: RollState, result: 'knockedDown' | 'stunned' | 'outOfAction' | null): RollState {
  const input = state.plans[state.index].input
  const results = result ? [...state.cur.injuryResults, result] : state.cur.injuryResults
  const rolled = state.cur.awaitingIgnoreFor + 1
  const s: RollState = { ...state, cur: { ...state.cur, injuryResults: results, awaitingIgnoreFor: rolled } }
  if (rolled < state.cur.injuryRollsNeeded) return { ...s, pending: nextInjuryPending(s) }
  if (results.length === 0) return finishAttack(s, 'ignored')
  let worst: 'knockedDown' | 'stunned' | 'outOfAction' = 'knockedDown'
  for (const r of results) if (OUTCOME_RANK[r] > OUTCOME_RANK[worst]) worst = r
  if (worst === 'stunned') {
    if (input.stunnedBecomesKnockedDown) return finishAttack(log(s, 'No Pain: the stun counts as knocked down.', 'bad'), 'knockedDown')
    if (input.stunAvoidanceThreshold !== undefined && !state.cur.crit?.ignoresHelmetSave) {
      return { ...s, pending: { kind: 'stunSave', who: 'defender', label: 'Helmet', detail: `Needs ${thresholdText(input.stunAvoidanceThreshold)} to be knocked down instead` } }
    }
  }
  return finishAttack(s, worst)
}
