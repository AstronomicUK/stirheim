import { describe, expect, it } from 'vitest'
import { IMPOSSIBLE } from '../../../rules/engine/dice'
import type { AttackInput } from '../../../rules/engine/resolveAttack'
import { applyRoll, declineRoll, passes, startPhase, type AttackPlan, type RollState } from './rollThrough'

function input(extra: Partial<AttackInput> = {}): AttackInput {
  return {
    hitThreshold: 4,
    woundThreshold: 4,
    armourThreshold: 6,
    injuryRollModifier: 0,
    concussion: false,
    trueGrit: false,
    hardToKill: false,
    critTriggerFaces: [6],
    critTable: 'standard',
    critTableRollModifier: 0,
    parryEligible: false,
    parrySuccessProbGivenAttempt: 0,
    ...extra,
  }
}

function plan(name: string, extra: Partial<AttackInput> = {}, parry = { beatsOrMatches: false, reroll: false }): AttackPlan {
  return { weaponName: name, input: input(extra), parry }
}

function rolls(state: RollState, ...dice: number[]): RollState {
  return dice.reduce((s, d) => applyRoll(s, d), state)
}

describe('passes', () => {
  it('a natural 1 always fails and a natural 6 always succeeds', () => {
    expect(passes(1, 1)).toBe(false)
    expect(passes(2, 1)).toBe(true)
    expect(passes(6, 7)).toBe(true)
    expect(passes(5, 7)).toBe(false)
    expect(passes(6, IMPOSSIBLE)).toBe(false)
    expect(passes(4, 4)).toBe(true)
    expect(passes(3, 4)).toBe(false)
  })
})

describe('one attack, start to finish', () => {
  it('miss ends the attack; with one attack the phase is done', () => {
    const s = rolls(startPhase([plan('Sword')], 1, 0), 3)
    expect(s.outcomes).toEqual(['miss'])
    expect(s.done).toBe(true)
    expect(s.pending).toBeNull()
    expect(s.log.at(-1)?.text).toMatch(/Missed/)
  })

  it('hit, wound, failed save, injury 5 = out of action', () => {
    let s = startPhase([plan('Sword')], 1, 0)
    expect(s.pending).toMatchObject({ kind: 'hit', who: 'attacker', detail: 'Needs 4+' })
    s = applyRoll(s, 4)
    expect(s.pending).toMatchObject({ kind: 'wound', detail: 'Needs 4+' })
    s = applyRoll(s, 5)
    expect(s.pending).toMatchObject({ kind: 'save', who: 'defender', detail: 'Needs 6+' })
    s = applyRoll(s, 2)
    expect(s.pending).toMatchObject({ kind: 'injury', detail: '1-2 knocked down, 3-4 stunned, 5-6 out of action' })
    s = applyRoll(s, 5)
    expect(s.outcomes).toEqual(['outOfAction'])
    expect(s.worst).toBe('outOfAction')
    expect(s.done).toBe(true)
  })

  it('a successful armour save ends the attack as saved; no save means straight to injury', () => {
    expect(rolls(startPhase([plan('Sword')], 1, 0), 4, 4, 6).outcomes).toEqual(['saved'])
    const s = rolls(startPhase([plan('Sword', { armourThreshold: IMPOSSIBLE })], 1, 0), 4, 4)
    expect(s.pending?.kind).toBe('injury')
  })

  it('injury modifiers and the concussion band change the result', () => {
    expect(rolls(startPhase([plan('Club', { armourThreshold: IMPOSSIBLE, concussion: true })], 1, 0), 4, 4, 2).outcomes).toEqual(['stunned'])
    expect(rolls(startPhase([plan('Sword', { armourThreshold: IMPOSSIBLE, injuryRollModifier: 1 })], 1, 0), 4, 4, 4).outcomes).toEqual(['outOfAction'])
    expect(rolls(startPhase([plan('Sword', { armourThreshold: IMPOSSIBLE, hardToKill: true })], 1, 0), 4, 4, 5).outcomes).toEqual(['stunned'])
  })

  it('a helmet turns a stun into knocked down on 4+', () => {
    const s = rolls(startPhase([plan('Sword', { armourThreshold: IMPOSSIBLE, stunAvoidanceThreshold: 4 })], 1, 0), 4, 4, 3)
    expect(s.pending).toMatchObject({ kind: 'stunSave', who: 'defender' })
    expect(applyRoll(s, 4).outcomes).toEqual(['knockedDown'])
    expect(applyRoll(s, 2).outcomes).toEqual(['stunned'])
  })

  it('No Pain makes every stun a knock down without a roll', () => {
    expect(rolls(startPhase([plan('Sword', { armourThreshold: IMPOSSIBLE, stunnedBecomesKnockedDown: true })], 1, 0), 4, 4, 3).outcomes).toEqual(['knockedDown'])
  })
})

describe('rerolls, parry and dodge', () => {
  it('a missed to-hit may be rerolled once', () => {
    let s = applyRoll(startPhase([plan('Sword', { rerollToHit: true })], 1, 0), 2)
    expect(s.pending?.kind).toBe('hitReroll')
    s = applyRoll(s, 2)
    expect(s.outcomes).toEqual(['miss'])
  })

  it('the defender may parry the first hit of the phase, once', () => {
    const plans = [plan('Sword', { parryEligible: true }), plan('Dagger', { parryEligible: true })]
    let s = applyRoll(startPhase(plans, 1, 1), 4)
    expect(s.pending).toMatchObject({ kind: 'parry', who: 'defender', optional: true, detail: 'Must beat the 4 rolled to hit' })
    const parried = applyRoll(s, 5)
    expect(parried.outcomes).toEqual(['parried'])
    // Second attack: the parry is spent.
    expect(applyRoll(parried, 4).pending?.kind).toBe('wound')
    // Failing the parry lets the hit through; declining does too.
    expect(applyRoll(s, 4).pending?.kind).toBe('wound')
    expect(declineRoll(s).pending?.kind).toBe('wound')
    expect(declineRoll(s).parriesLeft).toBe(0)
  })

  it('a buckler and sword reroll a failed parry; Master of Blades parries on a match', () => {
    let s = applyRoll(startPhase([plan('Sword', { parryEligible: true }, { beatsOrMatches: false, reroll: true })], 1, 1), 4)
    s = applyRoll(s, 3)
    expect(s.pending?.kind).toBe('parryReroll')
    expect(applyRoll(s, 5).outcomes).toEqual(['parried'])
    const master = applyRoll(startPhase([plan('Sword', { parryEligible: true }, { beatsOrMatches: true, reroll: false })], 1, 1), 4)
    expect(applyRoll(master, 4).outcomes).toEqual(['parried'])
  })

  it('a 6 to hit cannot be parried in the ordinary way', () => {
    const s = applyRoll(startPhase([plan('Sword', { parryEligible: true })], 1, 1), 6)
    expect(s.pending?.detail).toMatch(/impossible/)
    expect(applyRoll(s, 6).pending?.kind).toBe('wound')
  })

  it('Dodge is rolled after a shot hits, before wounding', () => {
    const s = applyRoll(startPhase([plan('Bow', { dodgeThreshold: 5 })], 1, 0), 4)
    expect(s.pending).toMatchObject({ kind: 'dodge', who: 'defender' })
    expect(applyRoll(s, 5).outcomes).toEqual(['dodged'])
    expect(applyRoll(s, 3).pending?.kind).toBe('wound')
  })

  it('poison: a 6 to hit wounds automatically but still rolls for a critical', () => {
    let s = applyRoll(startPhase([plan('Blade', { autoWoundOnNaturalSixToHit: true })], 1, 0), 6)
    expect(s.pending?.detail).toMatch(/Automatic wound/)
    s = applyRoll(s, 1)
    expect(s.pending?.kind).toBe('save')
  })
})

describe('critical hits', () => {
  it('a 6 to wound is a critical when 6 was not needed; only one per phase', () => {
    const plans = [plan('Sword'), plan('Dagger')]
    let s = rolls(startPhase(plans, 1, 0), 4, 6)
    expect(s.pending).toMatchObject({ kind: 'critTable', who: 'attacker' })
    // Standard table 5: Master strike, no armour save, two wounds, +2 injury: two injury rolls, highest applies.
    s = applyRoll(s, 5)
    expect(s.log.some((l) => /Master strike/.test(l.text))).toBe(true)
    expect(s.pending).toMatchObject({ kind: 'injury', label: 'Injury roll 1 of 2' })
    s = applyRoll(s, 1)
    expect(s.pending).toMatchObject({ kind: 'injury', label: 'Injury roll 2 of 2' })
    s = applyRoll(s, 1)
    // 1 + 2 = 3: stunned on both dice.
    expect(s.outcomes).toEqual(['stunned'])
    expect(s.critUsed).toBe(true)
    // The dagger's 6 to wound is now an ordinary wound.
    s = rolls(s, 4, 6)
    expect(s.pending?.kind).toBe('save')
  })

  it('needing a 6 to wound rules out criticals', () => {
    const s = rolls(startPhase([plan('Sword', { woundThreshold: 6 })], 1, 0), 4, 6)
    expect(s.pending?.kind).toBe('save')
  })

  it('Bladestorm takes a save per wound; Thrust knocks down even when saved; Bludgeoned is out of action on a failed save', () => {
    const blade = rolls(startPhase([plan('Sword', { critTable: 'bladed' })], 1, 0), 4, 6, 3)
    expect(blade.pending).toMatchObject({ kind: 'save', label: 'Armour save (wound 1)' })
    const oneSaved = applyRoll(blade, 6)
    expect(oneSaved.pending).toMatchObject({ kind: 'save', label: 'Armour save (wound 2)' })
    expect(applyRoll(oneSaved, 6).outcomes).toEqual(['saved'])

    const thrust = rolls(startPhase([plan('Spear', { critTable: 'thrusting' })], 1, 0), 4, 6, 3, 6)
    expect(thrust.outcomes).toEqual(['knockedDown'])

    const bludgeon = rolls(startPhase([plan('Mace', { critTable: 'bludgeoning' })], 1, 0), 4, 6, 6, 2)
    expect(bludgeon.outcomes).toEqual(['outOfAction'])
  })
})

describe('targets with several Wounds and several attacks', () => {
  it('a W2 target takes the first wound without an injury roll and rolls on the second', () => {
    const plans = [plan('Sword', { armourThreshold: IMPOSSIBLE }), plan('Dagger', { armourThreshold: IMPOSSIBLE })]
    let s = rolls(startPhase(plans, 2, 0), 4, 4)
    expect(s.outcomes).toEqual(['wounded'])
    expect(s.woundsLost).toBe(1)
    expect(s.pending).toMatchObject({ kind: 'hit', label: 'Dagger: to hit' })
    s = rolls(s, 4, 4)
    expect(s.pending?.kind).toBe('injury')
    s = applyRoll(s, 6)
    expect(s.outcomes).toEqual(['wounded', 'outOfAction'])
    expect(s.done).toBe(true)
  })

  it('an out of action result ends the phase early; otherwise every attack is rolled and the worst counts', () => {
    const plans = [plan('Sword', { armourThreshold: IMPOSSIBLE }), plan('Sword', { armourThreshold: IMPOSSIBLE }), plan('Dagger', { armourThreshold: IMPOSSIBLE })]
    const early = rolls(startPhase(plans, 1, 0), 4, 4, 6)
    expect(early.done).toBe(true)
    expect(early.outcomes).toEqual(['outOfAction'])
    expect(early.pending?.label).toBeUndefined()

    let s = startPhase(plans, 1, 0)
    expect(s.pending?.label).toBe('Sword 1: to hit')
    s = rolls(s, 4, 4, 1) // knocked down
    expect(s.pending?.label).toBe('Sword 2: to hit')
    s = rolls(s, 4, 4, 3) // stunned
    s = rolls(s, 1) // dagger misses
    expect(s.done).toBe(true)
    expect(s.outcomes).toEqual(['knockedDown', 'stunned', 'miss'])
    expect(s.worst).toBe('stunned')
  })

  it('Undead Construct may ignore each injury roll on a 4+', () => {
    let s = rolls(startPhase([plan('Sword', { armourThreshold: IMPOSSIBLE, injuryIgnoreThreshold: 4 })], 1, 0), 4, 4)
    expect(s.pending).toMatchObject({ kind: 'injuryIgnore', who: 'defender' })
    expect(applyRoll(s, 4).outcomes).toEqual(['ignored'])
    s = applyRoll(s, 2)
    expect(s.pending?.kind).toBe('injury')
    expect(applyRoll(s, 6).outcomes).toEqual(['outOfAction'])
  })
})
