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

describe('spell damage', () => {
  it('starts at the wound roll, never makes a critical, and retains armour saves', () => {
    let state = startPhase([plan('Fireball', { automaticHits: true, critTriggerFaces: [] })], 3, 0)
    expect(state.pending?.kind).toBe('wound')
    state = applyRoll(state, 6)
    expect(state.pending?.kind).toBe('save')
    state = applyRoll(state, 1)
    expect(state.pending).toBeNull()
    expect(state.woundsLost).toBe(1)
    expect(state.worst).toBe('wounded')
  })
})

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

describe('attack labels: numbered by place in the sequence, not by weapon', () => {
  it('a single attack needs no numbering', () => {
    const s = startPhase([plan('Sword')], 1, 0)
    expect(s.pending?.label).toBe('Sword: to hit')
  })

  it('several attacks are "First attack (Weapon)", "Second attack (Weapon)"... even across different weapons', () => {
    const plans = [plan('Sword'), plan('Sword'), plan('Dagger')]
    let s = startPhase(plans, 1, 0)
    expect(s.pending?.label).toBe('First attack (Sword): to hit')
    s = rolls(s, 1) // miss, on to the next
    expect(s.pending?.label).toBe('Second attack (Sword): to hit')
    s = rolls(s, 1)
    expect(s.pending?.label).toBe('Third attack (Dagger): to hit')
  })
})

describe('rerolls, parry and dodge', () => {
  it('a missed to-hit may be rerolled once', () => {
    let s = applyRoll(startPhase([plan('Sword', { rerollToHit: true })], 1, 0), 2)
    expect(s.pending?.kind).toBe('hitReroll')
    s = applyRoll(s, 2)
    expect(s.outcomes).toEqual(['miss'])
  })

  it('collects every hit and parries the highest before damage', () => {
    const plans = [plan('Sword', { parryEligible: true }), plan('Dagger', { parryEligible: true })]
    let s = applyRoll(startPhase(plans, 1, 1), 4)
    expect(s.pending?.kind).toBe('hit')
    s = applyRoll(s, 5)
    expect(s.pending).toMatchObject({ kind: 'parry', who: 'defender', optional: true, detail: 'Must beat the 5 rolled to hit' })
    const parried = applyRoll(s, 6)
    expect(parried.pending?.kind).toBe('wound')
    const finished = applyRoll(parried, 1)
    expect(finished.outcomes).toEqual(['noWound', 'parried'])
    expect(finished.done).toBe(true)
    expect(declineRoll(s).parriesLeft).toBe(0)
  })

  it('a later six prevents an ordinary parry against an earlier four', () => {
    const plans = [plan('Sword', { parryEligible: true }), plan('Dagger', { parryEligible: true })]
    const s = rolls(startPhase(plans, 1, 1), 4, 6)
    expect(s.pending?.kind).toBe('wound')
    expect(s.parriesLeft).toBe(0)
    expect(s.log.some(l => l.text.includes('cannot be parried'))).toBe(true)
  })

  it('a buckler and sword reroll a failed parry; Master of Blades parries on a match', () => {
    let s = applyRoll(startPhase([plan('Sword', { parryEligible: true }, { beatsOrMatches: false, reroll: true })], 1, 1), 4)
    s = applyRoll(s, 3)
    expect(s.pending?.kind).toBe('parryReroll')
    expect(applyRoll(s, 5).outcomes).toEqual(['parried'])
    const master = applyRoll(startPhase([plan('Sword', { parryEligible: true }, { beatsOrMatches: true, reroll: false })], 1, 1), 4)
    expect(applyRoll(master, 4).outcomes).toEqual(['parried'])
  })

  it('Master of Blades resolves both highest-hit parries before any wounds', () => {
    const p = plan('Sword', { parryEligible: true }, { beatsOrMatches: true, reroll: false })
    let s = rolls(startPhase([p, p], 1, 2), 4, 6)
    expect(s.pending?.kind).toBe('parry')
    expect(s.cur.hitRoll).toBe(6)
    s = applyRoll(s, 6)
    expect(s.pending?.kind).toBe('parry')
    expect(s.cur.hitRoll).toBe(4)
    s = applyRoll(s, 4)
    expect(s.outcomes).toEqual(['parried', 'parried'])
    expect(s.done).toBe(true)
  })

  it('a 6 to hit cannot be parried in the ordinary way', () => {
    const s = applyRoll(startPhase([plan('Sword', { parryEligible: true })], 1, 1), 6)
    expect(s.pending?.kind).toBe('wound')
    expect(s.parriesLeft).toBe(0)
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
    expect(s.pending).toMatchObject({ kind: 'hit', label: 'Second attack (Dagger): to hit' })
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
    expect(s.pending?.label).toBe('First attack (Sword): to hit')
    s = rolls(s, 4, 4, 1) // knocked down
    expect(s.pending?.label).toBe('Second attack (Sword): to hit')
    s = rolls(s, 4, 4, 3) // stunned
    s = rolls(s, 1) // dagger misses
    expect(s.done).toBe(true)
    expect(s.outcomes).toEqual(['knockedDown', 'stunned', 'miss'])
    expect(s.worst).toBe('stunned')
  })

  it('wounds already lost carry in: a W2 target down to one Wound rolls injury on the first wound through', () => {
    const s = rolls(startPhase([plan('Sword', { armourThreshold: IMPOSSIBLE })], 2, 0, 1), 4, 4)
    expect(s.pending?.kind).toBe('injury')
    const fresh = rolls(startPhase([plan('Sword', { armourThreshold: IMPOSSIBLE })], 2, 0, 0), 4, 4)
    expect(fresh.outcomes).toEqual(['wounded'])
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

describe('attacking a stunned or knocked-down target (01:947-959)', () => {
  it('a stunned target is taken out of action immediately, no rolls at all', () => {
    const s = startPhase([plan('Sword', { autoOutOfActionStunned: true })], 1, 0)
    expect(s.done).toBe(true)
    expect(s.pending).toBeNull()
    expect(s.outcomes).toEqual(['outOfAction'])
    expect(s.worst).toBe('outOfAction')
    expect(s.log.some((l) => /stunned/i.test(l.text))).toBe(true)
  })

  it('a stunned target ends the phase before any later attacks in the same sequence', () => {
    const plans = [plan('Sword 1', { autoOutOfActionStunned: true }), plan('Sword 2')]
    const s = startPhase(plans, 1, 0)
    expect(s.done).toBe(true)
    expect(s.outcomes).toEqual(['outOfAction'])
  })

  it('a knocked-down target hits automatically, but still wounds and saves normally', () => {
    let s = startPhase([plan('Sword', { autoHitKnockedDown: true, parryEligible: true })], 1, 0, 0, false)
    // No 'hit' step: straight to the wound roll, and no parry is offered either.
    expect(s.pending).toMatchObject({ kind: 'wound' })
    expect(s.log.at(-1)?.text).toMatch(/automatic hit/i)
    s = applyRoll(s, 4) // wound roll: needs 4+
    expect(s.pending).toMatchObject({ kind: 'save' })
    s = applyRoll(s, 1)
    expect(s.pending).toBeNull()
    expect(s.outcomes).toEqual(['outOfAction'])
  })

  it('a knocked-down target that fails to wound just stands: the auto-hit only replaced the to-hit roll', () => {
    const s = applyRoll(startPhase([plan('Sword', { autoHitKnockedDown: true })], 1, 0), 1)
    expect(s.outcomes).toEqual(['noWound'])
    expect(s.done).toBe(true)
  })
})

describe('opposed Weapon Skill parry house rule (#79)', () => {
  // Attacker WS 3, defender WS 5, a hit rolled at 4 (a winning face for the default hitThreshold
  // 4): attacker's total is 3+4=7, so the defender needs 5+p > 7, i.e. p in {3,4,5,6}.
  const opposedPlan = (parry: { beatsOrMatches: boolean; reroll: boolean } = { beatsOrMatches: false, reroll: false }) =>
    plan('Sword', { parryEligible: true, opposedParryWS: true, attackerWS: 3, defenderWS: 5 }, parry)

  it("compares WS + roll on each side instead of the raw hit roll", () => {
    let s = applyRoll(startPhase([opposedPlan()], 1, 1), 4)
    expect(s.pending).toMatchObject({ kind: 'parry', detail: 'Opposed WS: 5 + the parry roll must beat 3 + 4 = 7' })
    expect(applyRoll(s, 3).outcomes).toEqual(['parried']) // 5+3=8 > 7
    expect(applyRoll(s, 2).outcomes).not.toEqual(['parried']) // 5+2=7, not > 7
  })

  it("Master of Blades allows a tie (>=) instead of requiring a strict beat", () => {
    const s = applyRoll(startPhase([opposedPlan({ beatsOrMatches: true, reroll: false })], 1, 1), 4)
    expect(applyRoll(s, 2).outcomes).toEqual(['parried']) // 5+2=7 == 7, matches
  })

  it("a reroll on a failed opposed attempt behaves the same as the flat rule's reroll", () => {
    let s = applyRoll(startPhase([opposedPlan({ beatsOrMatches: false, reroll: true })], 1, 1), 4)
    s = applyRoll(s, 2) // fails (5+2=7, not > 7)
    expect(s.pending?.kind).toBe('parryReroll')
    expect(applyRoll(s, 3).outcomes).toEqual(['parried']) // 5+3=8 > 7 on the reroll
  })

  it("a fixed parry threshold (Starblade) is unaffected by the opposed flag even if both are set", () => {
    const fixedPlan: AttackPlan = { weaponName: 'Starblade', input: input({ parryEligible: true, opposedParryWS: true, attackerWS: 3, defenderWS: 5 }), parry: { beatsOrMatches: false, reroll: false, fixedThreshold: 4 } }
    const s = applyRoll(startPhase([fixedPlan], 1, 1), 4)
    expect(s.pending).toMatchObject({ detail: 'Parries on 4+ whatever was rolled to hit' })
    expect(applyRoll(s, 1).outcomes).not.toEqual(['parried']) // below the fixed 4+, regardless of WS totals
    expect(applyRoll(s, 4).outcomes).toEqual(['parried'])
  })

  it("without the house rule flag, the same WS values are ignored and the flat rule applies", () => {
    const s = applyRoll(startPhase([plan('Sword', { parryEligible: true, attackerWS: 3, defenderWS: 5 })], 1, 1), 4)
    expect(s.pending).toMatchObject({ detail: 'Must beat the 4 rolled to hit' })
    expect(applyRoll(s, 4).outcomes).not.toEqual(['parried']) // beat, not strictly beat 4 -> fails the flat rule
    expect(applyRoll(s, 5).outcomes).toEqual(['parried'])
  })
})

describe('Ball and Chain — D3 wounds per hit instead of 1 (#69)', () => {
  it('a normal (non-crit) wound asks a D3 for how many wounds it causes, then resolves saves/injury for that many', () => {
    let s = startPhase([plan('Ball and Chain', { armourThreshold: IMPOSSIBLE, multipleWoundsD3OnHit: true })], 1, 0)
    s = applyRoll(s, 4) // to hit
    expect(s.pending?.kind).toBe('wound')
    s = applyRoll(s, 5) // wounded, not a crit trigger face
    expect(s.pending).toMatchObject({ kind: 'multiWound', who: 'attacker' })
    s = applyRoll(s, 3) // D3: 3 wounds
    expect(s.pending).toMatchObject({ kind: 'injury', label: 'Injury roll 1 of 3' })
  })

  it("a critical hit's own wound count and the D3 don't stack: the higher of the two applies", () => {
    let s = startPhase([plan('Ball and Chain', { armourThreshold: IMPOSSIBLE, multipleWoundsD3OnHit: true, critTable: 'missile', critTableRollModifier: 100 })], 1, 0)
    s = applyRoll(s, 4) // to hit
    s = applyRoll(s, 6) // wounded, and a crit trigger face
    expect(s.pending?.kind).toBe('critTable')
    s = applyRoll(s, 1) // the +100 modifier clamps to the table's top band regardless of the face rolled: Master Shot (2 wounds)
    expect(s.pending).toMatchObject({ kind: 'multiWound', detail: expect.stringContaining('2') })
    s = applyRoll(s, 1) // D3 rolls 1: max(2, 1) = 2, not 1
    expect(s.pending).toMatchObject({ kind: 'injury', label: 'Injury roll 1 of 2' })
    expect(s.log.some((l) => /the critical's 2 wounds is higher/i.test(l.text))).toBe(true)
  })

  it('without the flag, a wound is still a plain single wound straight into saves', () => {
    const s = rolls(startPhase([plan('Sword', { armourThreshold: IMPOSSIBLE })], 1, 0), 4, 5)
    expect(s.pending?.kind).toBe('injury')
    expect(s.pending?.label).toBe('Injury roll')
  })
})

describe('the persisted log says app-rolled vs entered by hand (#1)', () => {
  it('tags a roll as entered by hand or rolled by the app, matching what the roll screen showed', () => {
    const appRolled = applyRoll(startPhase([plan('Sword')], 1, 0), 4, false)
    expect(appRolled.log.at(-1)?.text).toMatch(/rolled 4 \(rolled by the app\) to hit/)

    const byHand = applyRoll(startPhase([plan('Sword')], 1, 0), 4, true)
    expect(byHand.log.at(-1)?.text).toMatch(/rolled 4 \(entered by hand\) to hit/)
  })

  it('omitting manual leaves the log untagged, same as before this existed', () => {
    const s = applyRoll(startPhase([plan('Sword')], 1, 0), 4)
    expect(s.log.at(-1)?.text).toBe('Sword: rolled 4 to hit. Hit.')
  })

  it('every roll in a full attack carries its own tag, including the new D3 wound roll', () => {
    let s = startPhase([plan('Ball and Chain', { armourThreshold: IMPOSSIBLE, multipleWoundsD3OnHit: true })], 1, 0)
    s = applyRoll(s, 4, true) // hit, by hand
    s = applyRoll(s, 5, false) // wound, by the app
    s = applyRoll(s, 3, true) // D3, by hand
    const texts = s.log.map((l) => l.text)
    expect(texts.some((t) => t.includes('to hit') && t.includes('(entered by hand)'))).toBe(true)
    expect(texts.some((t) => t.startsWith('To wound') && t.includes('(rolled by the app)'))).toBe(true)
    expect(texts.some((t) => t.includes('D3') && t.includes('(entered by hand)'))).toBe(true)
  })
})


describe('Veskit’s No Pain',()=>{
 for(const die of [1,3,5])it(`resolves injury ${die} without suppressing out of action`,()=>{
  let state=startPhase([plan('Hit',{automaticHits:true,woundThreshold:2,armourThreshold:IMPOSSIBLE,critTriggerFaces:[],ignoreKnockedDownAndStunned:true})],1,0)
  state=applyRoll(state,4)
  expect(state.pending?.kind).toBe('injury')
  state=applyRoll(state,die)
  expect(state.done).toBe(true)
  expect(state.outcomes[0]).toBe(die===5?'outOfAction':'ignored')
  expect(state.woundsLost).toBe(1)
 })
})

it('does not describe a wound with an ignored injury as an earlier missed attack',()=>{
 const hit=plan('Sword',{armourThreshold:IMPOSSIBLE,critTriggerFaces:[],ignoreKnockedDownAndStunned:true})
 let state=startPhase([hit,hit],1,0)
 for(const die of [1,4,4,1])state=applyRoll(state,die)
 expect(state.done).toBe(true)
 expect(state.worst).toBe('ignored')
 expect(state.woundsLost).toBe(1)
})
