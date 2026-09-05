import { describe, expect, it } from 'vitest'
import { IMPOSSIBLE } from '../../../rules/engine/dice'
import type { RosterItem } from '../../../rules/types/roster'
import { defaultCampaignHouseRules } from '../../../rules/types/roster'
import { loadoutOf, type Combatant } from './combatants'
import { combatContextFor, computeOdds, percent, relevantToggles, thresholdText, toDefender, type FightSetup } from './odds'

const base = { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }

function combatant(name: string, equipment: RosterItem[], extra: Partial<Combatant> = {}): Combatant {
  return { id: name, kind: 'hero', name, typeName: name, warbandId: 'w', warbandName: 'W', stats: base, equipment, skillIds: [], traitIds: [], out: false, ...extra }
}

const captain = combatant('Captain', [{ itemId: 'sword', quantity: 1 }, { itemId: 'dagger', quantity: 1 }, { itemId: 'light_armour', quantity: 1 }])
const skaven = combatant('Skritch', [{ itemId: 'sword', quantity: 1 }, { itemId: 'dagger', quantity: 1 }], { stats: { ...base, S: 4, BS: 4 } })
const marksman = combatant('Marksman', [{ itemId: 'bow', quantity: 1 }, { itemId: 'dagger', quantity: 1 }], { kind: 'henchman' })

function setup(attacker: Combatant, defender: Combatant, primaryId: string, offHandId: string | null, extra: Partial<FightSetup> = {}): FightSetup {
  const attackerKit = loadoutOf(attacker.equipment)
  const defenderKit = loadoutOf(defender.equipment)
  const all = [...attackerKit.melee, ...attackerKit.ranged]
  const primary = all.find((w) => w.id === primaryId)!
  const offHand = offHandId ? all.find((w) => w.id === offHandId && w !== primary)! : null
  const houseRules = defaultCampaignHouseRules()
  return { attacker, attackerKit, defender, defenderKit, primary, offHand, context: combatContextFor(houseRules), houseRules, ...extra }
}

describe('computeOdds in melee', () => {
  it('sword and dagger: two attacks, 4+ to hit WS4, 4+ to wound T3, no save against the sword, 6+ against the dagger', () => {
    const odds = computeOdds(setup(captain, skaven, 'sword', 'dagger'))
    expect(odds.phase).toBe('melee')
    expect(odds.attacks).toBe(2)
    expect(odds.weapons.map((w) => w.weapon.id)).toEqual(['sword', 'dagger'])
    expect(odds.weapons[0].input.hitThreshold).toBe(4)
    expect(odds.weapons[0].input.woundThreshold).toBe(4)
    expect(odds.weapons[0].input.armourThreshold).toBe(IMPOSSIBLE)
    expect(odds.weapons[1].input.armourThreshold).toBe(6)
    expect(odds.weapons[0].pHit).toBeCloseTo(0.5, 10)
    expect(odds.weapons[0].pWound).toBeCloseTo(0.25, 10)
    expect(odds.chain.attacks).toBe(2)
    expect(odds.chain.anyHit).toBeCloseTo(0.75, 10)
    expect(odds.chain.outOfAction).toBeGreaterThan(0)
    expect(odds.chain.outOfAction).toBeLessThan(odds.chain.anyWound)
  })

  it('the defender with a sword gets one parry attempt', () => {
    expect(computeOdds(setup(captain, skaven, 'sword', 'dagger')).parryAttempts).toBe(1)
    const unarmedTarget = combatant('Rat', [])
    expect(computeOdds(setup(captain, unarmedTarget, 'sword', 'dagger')).parryAttempts).toBe(0)
  })

  it('Strength 4 wounds T3 on 3+ and light armour saves on 6+, unless the erosion house rule is on', () => {
    const off = computeOdds(setup(skaven, captain, 'sword', 'dagger'))
    expect(off.weapons[0].input.woundThreshold).toBe(3)
    expect(off.weapons[0].input.armourThreshold).toBe(6)
    const houseRules = { ...defaultCampaignHouseRules(), strengthArmourPiercing: true }
    const on = computeOdds(setup(skaven, captain, 'sword', 'dagger', { houseRules }))
    expect(on.weapons[0].input.armourThreshold).toBe(IMPOSSIBLE)
  })

  it('a double-handed weapon strikes at S5 and cannot share hands', () => {
    const brute = combatant('Brute', [{ itemId: 'double_handed_weapon', quantity: 1 }, { itemId: 'dagger', quantity: 1 }])
    const odds = computeOdds(setup(brute, captain, 'double_handed_sword', null))
    expect(odds.attacks).toBe(1)
    expect(odds.weapons[0].strength).toBe(5)
    expect(odds.weapons[0].input.woundThreshold).toBe(2)
  })

  it('uses the optional critical tables when the campaign says so', () => {
    expect(computeOdds(setup(captain, skaven, 'sword', 'dagger')).weapons[0].input.critTable).toBe('bladed')
    const houseRules = { ...defaultCampaignHouseRules(), optionalCriticalTables: false }
    const s = setup(captain, skaven, 'sword', 'dagger', { houseRules })
    s.context = combatContextFor(houseRules)
    expect(computeOdds(s).weapons[0].input.critTable).toBe('standard')
  })

  it('explains when a wound is impossible and when the target has several Wounds', () => {
    const weakling = combatant('Weakling', [{ itemId: 'dagger', quantity: 1 }], { stats: { ...base, S: 1 } })
    const tough = combatant('Ogre', [], { stats: { ...base, T: 5, W: 3 } })
    const odds = computeOdds(setup(weakling, tough, 'dagger', null))
    expect(odds.notes.some((n) => /cannot wound Toughness 5/.test(n))).toBe(true)
    expect(odds.notes.some((n) => /3 Wounds/.test(n))).toBe(true)
  })
})

describe('computeOdds shooting', () => {
  it('a bow at BS3 hits on 4+, at S3, and each modifier adds one', () => {
    const still = computeOdds(setup(marksman, captain, 'bow', null))
    expect(still.phase).toBe('ranged')
    expect(still.attacks).toBe(1)
    expect(still.weapons[0].input.hitThreshold).toBe(4)
    expect(still.weapons[0].input.woundThreshold).toBe(4)
    expect(still.parryAttempts).toBe(0)
    const houseRules = defaultCampaignHouseRules()
    const hard = computeOdds(setup(marksman, captain, 'bow', null, { context: combatContextFor(houseRules, { movedThisTurn: true, longRange: true, cover: true }) }))
    expect(hard.weapons[0].input.hitThreshold).toBe(7)
    expect(hard.weapons[0].pHit).toBeCloseTo(1 / 6, 10)
  })
})

describe('toDefender', () => {
  it('counts parry items and the buckler reroll', () => {
    const swordAndBuckler = combatant('Duellist', [{ itemId: 'sword', quantity: 1 }, { itemId: 'buckler', quantity: 1 }])
    const d = toDefender(swordAndBuckler, loadoutOf(swordAndBuckler.equipment))
    expect(d.parryWeaponCount).toBe(2)
    expect(d.parryReroll).toBe(true)
    expect(d.W).toBe(1)
  })
})

describe('display helpers', () => {
  it('thresholdText', () => {
    expect(thresholdText(4)).toBe('4+')
    expect(thresholdText(1)).toBe('2+')
    expect(thresholdText(8)).toBe('6+')
    expect(thresholdText(IMPOSSIBLE)).toBe('none')
    expect(thresholdText(IMPOSSIBLE, 'no save')).toBe('no save')
  })
  it('percent', () => {
    expect(percent(0.5)).toBe('50%')
    expect(percent(0.001)).toBe('<1%')
    expect(percent(0.999)).toBe('>99%')
    expect(percent(0)).toBe('0%')
    expect(percent(1)).toBe('100%')
  })
  it('relevantToggles depend on the phase, the weapon and the attacker', () => {
    const kit = loadoutOf([{ itemId: 'morning_star', quantity: 1 }, { itemId: 'bow', quantity: 1 }])
    const brawler = combatant('Brawler', [], { skillIds: ['combat_master'], traitIds: ['hatred'] })
    const melee = relevantToggles(brawler, 'melee', kit.melee[0]).map((t) => t.field)
    expect(melee).toEqual(['charging', 'firstTurnOfCombat', 'fightingMultiple', 'vsHatedEnemy'])
    const ranged = relevantToggles(brawler, 'ranged', kit.ranged[0]).map((t) => t.field)
    expect(ranged).toEqual(['movedThisTurn', 'longRange', 'cover', 'largeTarget'])
  })
})
