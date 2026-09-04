// Serious injuries for the report: replays the dice the player entered through the Phase 2
// resolvers and says what is still needed (a D66, a sub-roll, the Multiple Injuries count).
//
// Rules applied here (core rulebook, "Serious Injuries"):
// - Heroes roll D66 (applyHeroInjury). Arm Wound, Madness, Smashed Leg, Deep Wound and Bitter
//   Enmity ask for a follow-up die; Multiple Injuries asks for a D6 and then that many further
//   rolls, "re-roll any 'Dead', 'Captured' and further 'Multiple Injuries' results" — such rolls
//   are kept in the record, marked re-rolled, and do not count towards the total.
// - Hired swords: "roll for his injuries as you would roll for a Henchman after a battle (i.e,
//   1-2 = Lost; 3-6 = Survives)" (Hired Swords, "injuries"). applyHiredSwordInjury.
// - Henchmen: one D6 per model out of action, "removed permanently from the roster sheet on a D6
//   roll of 1-2". applyHenchmanInjury shrinks the group; a group whose last model dies stays on
//   the roster at size 0 for history (the server patch sets size, it never deletes).

import type { HenchmanInjuryLine, HeroInjuryLine } from '../../../domain'
import { lookupHeroInjury } from '../../../rules/data/campaign/injuries'
import { applyHenchmanInjury, applyHeroInjury, applyHiredSwordInjury, MULTIPLE_INJURIES_REROLL_CODES } from '../../../rules/resolve/injuries'
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword } from '../../../rules/types/roster'
import { isDie, type HeroInjuryFlow } from './state'

export type InjuryOutcome = HeroInjuryLine['outcome']

export type HeroInjuryPending =
  | { kind: 'd66'; prompt: string }
  | { kind: 'subRoll'; die: 'D6' | 'D3'; prompt: string; rollIndex: number }
  | { kind: 'count'; prompt: string }
  | { kind: 'done' }

export interface HeroInjuryStep {
  d66: number
  subRoll: number | null
  code: string
  name: string
  /** The applied effect text, or null while the roll still waits for its sub-roll. */
  effect: string | null
  /** Rolled during Multiple Injuries but excluded by the re-roll rule. */
  rerolled: boolean
}

export interface HeroInjuryResolution {
  /** The hero with every applied injury on them (unchanged while nothing has been applied). */
  hero: RosterHero
  steps: HeroInjuryStep[]
  pending: HeroInjuryPending
  /** Set once the flow is complete. */
  outcome: InjuryOutcome | null
  line: HeroInjuryLine | null
}

function classify(before: RosterHero, after: RosterHero): InjuryOutcome {
  if (after.status === 'dead') return 'dead'
  if (after.status === 'captured') return 'captured'
  if (after.status === 'retired') return 'retired'
  const sameStats = (Object.keys(before.stats) as (keyof typeof before.stats)[]).every((k) => before.stats[k] === after.stats[k])
  const sameFlags = JSON.stringify(before.flags) === JSON.stringify(after.flags)
  const sameKit = before.equipment.length === after.equipment.length
  return sameStats && sameFlags && sameKit ? 'recovered' : 'injured'
}

function lineFor(hero: RosterHero, steps: HeroInjuryStep[], outcome: InjuryOutcome, flow: HeroInjuryFlow): HeroInjuryLine {
  const applied = steps.filter((s) => !s.rerolled)
  const rolls: number[] = []
  steps.forEach((s, i) => {
    rolls.push(s.d66)
    if (s.subRoll !== null) rolls.push(s.subRoll)
    if (i === 0 && flow.countRoll !== null) rolls.push(flow.countRoll)
  })
  const multiple = applied.length > 1
  return {
    subjectType: 'hero',
    subjectId: hero.id,
    subjectName: hero.name,
    rolls,
    injuryCode: multiple ? 'multiple_injuries' : (applied[0]?.code ?? null),
    injuryName: multiple ? `Multiple Injuries: ${applied.slice(1).map((s) => s.name).join(', ')}` : (applied[0]?.name ?? 'Full Recovery'),
    effect: applied.map((s) => s.effect ?? '').filter((e) => e !== '').join('; '),
    outcome,
  }
}

/** Replay a hero's injury rolls from the roster state at the end of the battle. */
export function resolveHeroInjuryFlow(hero: RosterHero, flow: HeroInjuryFlow, matchId?: string): HeroInjuryResolution {
  const ctx = matchId ? { matchId } : undefined
  const steps: HeroInjuryStep[] = []
  let current = hero
  let multi = false
  let remaining = 0
  let pending: HeroInjuryPending | null = null

  for (let i = 0; i < flow.rolls.length && pending === null; i++) {
    const roll = flow.rolls[i]
    const injury = lookupHeroInjury(roll.d66)
    if (multi && MULTIPLE_INJURIES_REROLL_CODES.includes(injury.code)) {
      steps.push({ d66: roll.d66, subRoll: null, code: injury.code, name: injury.name, effect: null, rerolled: true })
      continue
    }
    const res = applyHeroInjury(current, roll.d66, roll.subRoll ?? undefined, ctx)
    if (res.value.needsSubRoll) {
      steps.push({ d66: roll.d66, subRoll: null, code: injury.code, name: injury.name, effect: null, rerolled: false })
      pending = { kind: 'subRoll', die: res.value.needsSubRoll.die, prompt: res.value.needsSubRoll.prompt, rollIndex: i }
      break
    }
    current = res.value.hero
    const record = current.injuries[current.injuries.length - 1]
    steps.push({ d66: roll.d66, subRoll: roll.subRoll, code: injury.code, name: injury.name, effect: record?.effect ?? '', rerolled: false })
    if (res.value.needsMoreRolls) {
      if (flow.countRoll === null) {
        pending = { kind: 'count', prompt: `${hero.name}: roll a D6 for how many more times to roll on the chart` }
        break
      }
      multi = true
      remaining = flow.countRoll
      continue
    }
    if (multi) {
      remaining -= 1
      if (remaining <= 0) pending = { kind: 'done' }
    } else {
      pending = { kind: 'done' }
    }
  }

  if (pending === null) {
    if (flow.rolls.length === 0) pending = { kind: 'd66', prompt: `${hero.name}: roll a D66 on the Serious Injuries chart` }
    else if (multi && remaining > 0) pending = { kind: 'd66', prompt: `${hero.name}: ${remaining} more ${remaining === 1 ? 'roll' : 'rolls'} (re-roll Dead, Captured and Multiple Injuries)` }
    else pending = { kind: 'done' }
  }

  if (pending.kind !== 'done') return { hero: current, steps, pending, outcome: null, line: null }
  const outcome = classify(hero, current)
  return { hero: current, steps, pending, outcome, line: lineFor(hero, steps, outcome, flow) }
}

export interface HiredSwordInjuryResolution {
  sword: RosterHiredSword
  outcome: InjuryOutcome | null
  line: HeroInjuryLine | null
}

export function resolveHiredSwordInjury(sword: RosterHiredSword, d6: number | null): HiredSwordInjuryResolution {
  if (!isDie(d6, 6)) return { sword, outcome: null, line: null }
  const res = applyHiredSwordInjury(sword, d6)
  const dead = res.value.status === 'dead'
  return {
    sword: res.value,
    outcome: dead ? 'dead' : 'recovered',
    line: {
      subjectType: 'hiredSword',
      subjectId: sword.id,
      subjectName: sword.name,
      rolls: [d6],
      injuryCode: null,
      injuryName: dead ? 'Lost' : 'Survives',
      effect: dead ? 'Dead or gone: removed from the warband' : 'Recovers and fights in the next battle',
      outcome: dead ? 'dead' : 'recovered',
    },
  }
}

export interface GroupInjuryResolution {
  group: RosterHenchmanGroup
  dead: number
  /** Every out-of-action model has its die. */
  complete: boolean
  line: HenchmanInjuryLine | null
}

/** One D6 per model out of action, applied in order; dice not yet entered leave the flow incomplete. */
export function resolveGroupInjuries(group: RosterHenchmanGroup, outOfAction: number, rolls: readonly (number | null)[]): GroupInjuryResolution {
  let current: RosterHenchmanGroup = group
  let dead = 0
  const entered: number[] = []
  for (let i = 0; i < outOfAction; i++) {
    const d6 = rolls[i]
    if (!isDie(d6, 6)) break
    entered.push(d6)
    const res = applyHenchmanInjury(current, d6)
    if (res.value === null) {
      dead += 1
      current = { ...current, size: 0 }
    } else {
      if (res.value.size < current.size) dead += 1
      current = res.value
    }
  }
  const complete = entered.length >= outOfAction
  return {
    group: current,
    dead,
    complete,
    line: complete && outOfAction > 0 ? { subjectType: 'group', subjectId: group.id, subjectName: group.name, rolls: entered, dead } : null,
  }
}
