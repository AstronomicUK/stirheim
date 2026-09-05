// Walking real dice through one phase of attacks: to hit, parry, to wound, critical, saves,
// injury. The engine's AttackInput already holds every threshold and flag, so this only has to
// apply the rulebook's order of play and remember what has been used up (the one critical per
// phase, the defender's parry, the target's Wounds). Pure: every step returns a new state.

import { critResultForRoll, type CritResult } from '../../../rules/engine/crit'
import { IMPOSSIBLE, type Threshold } from '../../../rules/engine/dice'
import { resolveInjuryBand } from '../../../rules/engine/injury'
import type { AttackInput } from '../../../rules/engine/resolveAttack'
import { thresholdText } from './odds'

export type RollKind = 'hit' | 'hitReroll' | 'parry' | 'parryReroll' | 'dodge' | 'wound' | 'critTable' | 'save' | 'stepAside' | 'ward' | 'injuryIgnore' | 'injury' | 'stunSave'

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
  weaponName: string
  input: AttackInput
  /** Parry mechanics not carried by AttackInput. */
  parry: { beatsOrMatches: boolean; reroll: boolean }
}

export type Outcome = 'miss' | 'parried' | 'dodged' | 'noWound' | 'saved' | 'ignored' | 'wounded' | 'knockedDown' | 'stunned' | 'outOfAction'

const OUTCOME_RANK: Record<Outcome, number> = { miss: 0, parried: 0, dodged: 0, noWound: 0, saved: 0, ignored: 0, wounded: 1, knockedDown: 2, stunned: 3, outOfAction: 4 }

export const OUTCOME_LABEL: Record<Outcome, string> = {
  miss: 'Missed',
  parried: 'Parried',
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
  kind: 'save' | 'stepAside' | 'ward'
  /** Which wound of this hit the step protects (0-based); -1 = one armour save gating every wound. */
  wound: number
}

/** Scratch state for the attack being rolled. */
interface Current {
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
}

export interface RollState {
  plans: AttackPlan[]
  index: number
  defenderW: number
  woundsLost: number
  parriesLeft: number
  critUsed: boolean
  pending: PendingRoll | null
  cur: Current
  log: LogLine[]
  outcomes: Outcome[]
  worst: Outcome | null
  done: boolean
}

function freshCurrent(): Current {
  return { hitRoll: null, rerolled: false, crit: null, wounds: 0, savedWounds: new Set(), saveQueue: [], injuryRollsNeeded: 0, injuryResults: [], awaitingIgnoreFor: 0 }
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

export function startPhase(plans: AttackPlan[], defenderW: number, maxParries: number, woundsAlreadyLost = 0): RollState {
  const state: RollState = {
    plans,
    index: 0,
    defenderW: Math.max(1, defenderW),
    woundsLost: Math.max(0, Math.min(Math.max(1, defenderW), Math.trunc(woundsAlreadyLost))),
    parriesLeft: maxParries,
    critUsed: false,
    pending: null,
    cur: freshCurrent(),
    log: [],
    outcomes: [],
    worst: null,
    done: plans.length === 0,
  }
  return state.done ? state : beginAttack(state)
}

function attackName(state: RollState): string {
  const plan = state.plans[state.index]
  const same = state.plans.filter((p) => p.weaponName === plan.weaponName)
  if (same.length === 1) return plan.weaponName
  const n = state.plans.slice(0, state.index + 1).filter((p) => p.weaponName === plan.weaponName).length
  return `${plan.weaponName} ${n}`
}

function beginAttack(state: RollState): RollState {
  const plan = state.plans[state.index]
  const t = plan.input.hitThreshold
  return {
    ...state,
    cur: freshCurrent(),
    pending: {
      kind: 'hit',
      who: 'attacker',
      label: `${attackName(state)}: to hit`,
      detail: t === IMPOSSIBLE ? 'Cannot hit' : `Needs ${thresholdText(t)}`,
    },
  }
}

function log(state: RollState, text: string, tone: LogLine['tone'] = 'neutral'): RollState {
  return { ...state, log: [...state.log, { text, tone }] }
}

function finishAttack(state: RollState, outcome: Outcome): RollState {
  const outcomes = [...state.outcomes, outcome]
  const worst = state.worst === null || OUTCOME_RANK[outcome] > OUTCOME_RANK[state.worst] ? outcome : state.worst
  let next: RollState = { ...state, outcomes, worst, pending: null }
  if (outcome === 'outOfAction') {
    next = log(next, `${OUTCOME_LABEL[outcome]}! The target is out of action; any remaining attacks are not needed.`, 'good')
    return { ...next, done: true, index: state.plans.length }
  }
  if (state.index + 1 >= state.plans.length) return { ...next, done: true }
  return beginAttack({ ...next, index: state.index + 1 })
}

/** The defender declines an optional roll (a parry attempt): the hit stands. */
export function declineRoll(state: RollState): RollState {
  if (!state.pending?.optional) return state
  return afterHit(log(state, 'No parry attempted.'))
}

export function applyRoll(state: RollState, roll: number): RollState {
  const pending = state.pending
  if (!pending || state.done) return state
  const plan = state.plans[state.index]
  const input = plan.input
  switch (pending.kind) {
    case 'hit':
    case 'hitReroll': {
      if (passes(roll, input.hitThreshold)) {
        const s = log({ ...state, cur: { ...state.cur, hitRoll: roll } }, `${attackName(state)}: rolled ${roll} to hit. Hit.`, 'good')
        return offerParry(s)
      }
      if (pending.kind === 'hit' && input.rerollToHit) {
        return {
          ...log(state, `${attackName(state)}: rolled ${roll} to hit. Missed, but the miss may be rerolled.`),
          cur: { ...state.cur, rerolled: true },
          pending: { kind: 'hitReroll', who: 'attacker', label: `${attackName(state)}: reroll to hit`, detail: `Needs ${thresholdText(input.hitThreshold)}` },
        }
      }
      return finishAttack(log(state, `${attackName(state)}: rolled ${roll} to hit. Missed.`, 'bad'), 'miss')
    }
    case 'parry':
    case 'parryReroll': {
      const hitRoll = state.cur.hitRoll ?? 6
      const success = plan.parry.beatsOrMatches ? roll >= hitRoll : roll > hitRoll
      if (success) return finishAttack(log(state, `Parry: rolled ${roll} against the ${hitRoll} to hit. Parried!`, 'bad'), 'parried')
      if (pending.kind === 'parry' && plan.parry.reroll) {
        return {
          ...log(state, `Parry: rolled ${roll} against the ${hitRoll} to hit. Failed; the parry may be rerolled.`),
          pending: { kind: 'parryReroll', who: 'defender', label: 'Parry reroll', detail: parryDetail(plan, hitRoll) },
        }
      }
      return afterHit(log(state, `Parry: rolled ${roll} against the ${hitRoll} to hit. Failed.`, 'good'))
    }
    case 'dodge': {
      if (passesSave(roll, input.dodgeThreshold ?? IMPOSSIBLE)) return finishAttack(log(state, `Dodge: rolled ${roll}. Dodged!`, 'bad'), 'dodged')
      return askWound(log(state, `Dodge: rolled ${roll}. Failed.`, 'good'))
    }
    case 'wound': {
      const auto = Boolean(input.autoWoundOnNaturalSixToHit) && state.cur.hitRoll === 6
      const wounded = auto || passes(roll, input.woundThreshold)
      if (!wounded) return finishAttack(log(state, `To wound: rolled ${roll}. No wound.`, 'bad'), 'noWound')
      const critEligible = !state.critUsed && input.woundThreshold !== IMPOSSIBLE && roll > input.woundThreshold && input.critTriggerFaces.includes(roll)
      if (critEligible) {
        const s = log({ ...state, critUsed: true }, `To wound: rolled ${roll}. Wounded, and it is a critical hit!`, 'good')
        return { ...s, pending: { kind: 'critTable', who: 'attacker', label: 'Critical hit table', detail: input.critTableRollModifier ? `D6 ${input.critTableRollModifier > 0 ? '+' : ''}${input.critTableRollModifier}` : 'Roll a D6' } }
      }
      const s = log(state, auto ? `To wound: automatic wound from the 6 to hit (rolled ${roll}, no critical).` : `To wound: rolled ${roll}. Wounded.`, 'good')
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
      if (result.flavourOnly) bits.push(result.flavourOnly)
      const s = log(state, `Critical: rolled ${roll}. ${result.label}${bits.length ? ` (${bits.join(', ')})` : ''}.`, 'good')
      return startSaves({ ...s, cur: { ...s.cur, crit: result, wounds: result.woundsCaused } })
    }
    case 'save': {
      const step = state.cur.saveQueue[0]
      const saved = passesSave(roll, input.armourThreshold)
      if (saved) {
        if (step.wound === -1) {
          const s = log(state, `Armour save: rolled ${roll}. Saved.`, 'bad')
          if (state.cur.crit?.minSeverityKnockedDown) return finishAttack(log(s, 'Thrust: the target is knocked down all the same.', 'good'), 'knockedDown')
          return finishAttack(s, 'saved')
        }
        const savedWounds = new Set(state.cur.savedWounds).add(step.wound)
        const queue = state.cur.saveQueue.slice(1).filter((q) => q.wound !== step.wound)
        return nextSaveStep(log({ ...state, cur: { ...state.cur, savedWounds, saveQueue: queue } }, `Armour save (wound ${step.wound + 1}): rolled ${roll}. Saved.`, 'bad'))
      }
      const s = log(state, `Armour save: rolled ${roll}. Failed.`, 'good')
      if (state.cur.crit?.autoOOAOnFailedSave) return finishAttack(log(s, 'Bludgeoned: straight out of action.', 'good'), 'outOfAction')
      return nextSaveStep({ ...s, cur: { ...s.cur, saveQueue: s.cur.saveQueue.slice(1) } })
    }
    case 'stepAside':
    case 'ward': {
      const step = state.cur.saveQueue[0]
      const threshold = pending.kind === 'stepAside' ? input.stepAsideThreshold : input.wardSaveThreshold
      const name = pending.kind === 'stepAside' ? 'Step Aside' : 'Ward save'
      if (passesSave(roll, threshold ?? IMPOSSIBLE)) {
        const savedWounds = new Set(state.cur.savedWounds).add(step.wound)
        const queue = state.cur.saveQueue.slice(1).filter((q) => q.wound !== step.wound)
        return nextSaveStep(log({ ...state, cur: { ...state.cur, savedWounds, saveQueue: queue } }, `${name}: rolled ${roll}. Saved.`, 'bad'))
      }
      return nextSaveStep(log({ ...state, cur: { ...state.cur, saveQueue: state.cur.saveQueue.slice(1) } }, `${name}: rolled ${roll}. Failed.`, 'good'))
    }
    case 'injuryIgnore': {
      if (passesSave(roll, input.injuryIgnoreThreshold ?? IMPOSSIBLE)) {
        const s = log(state, `Undead Construct: rolled ${roll}. The injury is ignored (the wound is still lost).`, 'bad')
        return injuryRolled(s, null)
      }
      const s = log(state, `Undead Construct: rolled ${roll}. The injury counts.`, 'good')
      return { ...s, pending: injuryPending(s) }
    }
    case 'injury': {
      const bonus = input.injuryRollModifier + (state.cur.crit?.injuryRollBonus ?? 0)
      const modified = roll + bonus
      const [koMax, stunnedMax] = resolveInjuryBand(input.concussion, input.trueGrit, input.hardToKill, input.injuryRemap)
      const result: 'knockedDown' | 'stunned' | 'outOfAction' = modified <= koMax ? 'knockedDown' : modified <= stunnedMax ? 'stunned' : 'outOfAction'
      const s = log(state, `Injury: rolled ${roll}${bonus ? ` (${modified} after +${bonus})` : ''}. ${OUTCOME_LABEL[result]}.`, result === 'outOfAction' ? 'good' : 'neutral')
      return injuryRolled(s, result)
    }
    case 'stunSave': {
      if (passesSave(roll, input.stunAvoidanceThreshold ?? IMPOSSIBLE)) return finishAttack(log(state, `Helmet: rolled ${roll}. The stun becomes knocked down.`, 'bad'), 'knockedDown')
      return finishAttack(log(state, `Helmet: rolled ${roll}. Still stunned.`, 'good'), 'stunned')
    }
  }
}

function parryDetail(plan: AttackPlan, hitRoll: number): string {
  return plan.parry.beatsOrMatches ? `Must match or beat the ${hitRoll} rolled to hit` : `Must beat the ${hitRoll} rolled to hit${hitRoll >= 6 ? ' (impossible)' : ''}`
}

/** After a hit lands: parry if the defender still can, otherwise on to dodge / wound. */
function offerParry(state: RollState): RollState {
  const plan = state.plans[state.index]
  const hitRoll = state.cur.hitRoll ?? 6
  if (plan.input.parryEligible && state.parriesLeft > 0) {
    return {
      ...state,
      parriesLeft: state.parriesLeft - 1,
      pending: { kind: 'parry', who: 'defender', label: 'Parry', detail: parryDetail(plan, hitRoll), optional: true },
    }
  }
  return afterHit(state)
}

function afterHit(state: RollState): RollState {
  const input = state.plans[state.index].input
  if (input.dodgeThreshold !== undefined && input.dodgeThreshold !== IMPOSSIBLE) {
    return { ...state, pending: { kind: 'dodge', who: 'defender', label: 'Dodge', detail: `Needs ${thresholdText(input.dodgeThreshold)}` } }
  }
  return askWound(state)
}

function askWound(state: RollState): RollState {
  const input = state.plans[state.index].input
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
