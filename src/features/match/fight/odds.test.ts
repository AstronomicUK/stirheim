import { describe, expect, it } from 'vitest'
import { IMPOSSIBLE } from '../../../rules/engine/dice'
import type { RosterItem } from '../../../rules/types/roster'
import { defaultCampaignHouseRules } from '../../../rules/types/roster'
import { loadoutOf, type Combatant } from './combatants'
import { combatContextFor, computeOdds, computeOddsSensitivity, percent, relevantToggles, STATS_1_TO_10, thresholdText, toDefender, type FightSetup } from './odds'

const base = { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }

function combatant(name: string, equipment: RosterItem[], extra: Partial<Combatant> = {}): Combatant {
  return { id: name, kind: 'hero', name, typeName: name, warbandId: 'w', warbandName: 'W', stats: base, equipment, skillIds: [], traitIds: [], out: false, woundsLost: 0, ...extra }
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

describe('kite shield and pavise', () => {
  it('a kite shield is a 5+ alone and +2 on armour; a pavise is a shield only to the front, and cover against arrows', () => {
    const kite = combatant('Knight', [{ itemId: 'kite_shield', quantity: 1 }])
    expect(computeOdds(setup(captain, kite, 'sword', null)).weapons[0].input.armourThreshold).toBe(5)
    const armoured = combatant('Knight', [{ itemId: 'kite_shield', quantity: 1 }, { itemId: 'heavy_armour', quantity: 1 }])
    expect(computeOdds(setup(captain, armoured, 'sword', null)).weapons[0].input.armourThreshold).toBe(3)

    const pavise = combatant('Crossbowman', [{ itemId: 'pavise', quantity: 1 }])
    const houseRules = defaultCampaignHouseRules()
    expect(computeOdds(setup(captain, pavise, 'sword', null)).weapons[0].input.armourThreshold).toBe(6)
    expect(computeOdds(setup(captain, pavise, 'sword', null, { context: combatContextFor(houseRules, { paviseFront: false }) })).weapons[0].input.armourThreshold).toBe(IMPOSSIBLE)
    const shot = computeOdds(setup(marksman, pavise, 'bow', null))
    expect(shot.weapons[0].input.armourThreshold).toBe(IMPOSSIBLE)
    expect(shot.weapons[0].input.hitThreshold).toBe(5)
  })
})

describe('carry-over between fights', () => {
  const ogre = combatant('Ogre', [], { stats: { ...base, T: 4, W: 3 } })

  it('wounds already lost lift the odds; at the last Wound the target is as good as W1', () => {
    const fresh = computeOdds(setup(captain, ogre, 'sword', 'dagger'))
    const nearlyDone = computeOdds(setup(captain, ogre, 'sword', 'dagger', { woundsAlreadyLost: 2 }))
    expect(nearlyDone.woundsAlreadyLost).toBe(2)
    expect(nearlyDone.chain.outOfAction).toBeGreaterThan(fresh.chain.outOfAction)
    const single = computeOdds(setup(captain, combatant('Brute', [], { stats: { ...base, T: 4, W: 1 } }), 'sword', 'dagger'))
    expect(nearlyDone.chain.outOfAction).toBeCloseTo(single.chain.outOfAction, 10)
    expect(nearlyDone.notes.some((n) => /1 of 3 Wounds left/.test(n))).toBe(true)
  })

  it("a used parry removes the defender's attempt from the numbers", () => {
    const withParry = computeOdds(setup(captain, skaven, 'sword', 'dagger'))
    const spent = computeOdds(setup(captain, skaven, 'sword', 'dagger', { parryUsed: true }))
    expect(withParry.parryAttempts).toBe(1)
    expect(spent.parryAttempts).toBe(0)
    expect(spent.chain.anyWound).toBeGreaterThan(withParry.chain.anyWound)
  })

  it('an attack limit keeps only the first attacks, primary weapon first', () => {
    const all = computeOdds(setup(captain, skaven, 'sword', 'dagger'))
    const one = computeOdds(setup(captain, skaven, 'sword', 'dagger', { attackLimit: 1 }))
    expect(all.fullAttacks).toBe(2)
    expect(one.attacks).toBe(1)
    expect(one.weapons.map((w) => w.attacks)).toEqual([1, 0])
    expect(one.chain.attacks).toBe(1)
    expect(one.chain.anyHit).toBeCloseTo(0.5, 10)
  })

  it('says who strikes first: Initiative, the charge, and the weapons that override them', () => {
    const spearman = combatant('Spearman', [{ itemId: 'spear', quantity: 1 }])
    const base = setup(spearman, skaven, 'spear', null)
    expect(computeOdds(base).strikeOrder).toMatch(/Equal Initiative \(3 each\)/)
    expect(computeOdds({ ...base, context: { ...base.context, charging: true } }).strikeOrder).toMatch(/Spearman strikes first: charging/)
    // A spear strikes first in the first turn of a combat even when it is the one being charged.
    expect(computeOdds({ ...base, context: { ...base.context, firstTurnOfCombat: true } }).strikeOrder).toMatch(/Spearman strikes first in the first turn \(Spear\)/)
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

describe('computeOddsSensitivity', () => {
  it('the highlighted column of each melee row matches computeOdds for the real opponent', () => {
    const fixture = setup(captain, skaven, 'sword', 'dagger')
    const odds = computeOdds(fixture)
    const sensitivity = computeOddsSensitivity(fixture)
    expect(sensitivity.referenceWS).toBe(skaven.stats.WS)
    expect(sensitivity.referenceT).toBe(skaven.stats.T)
    const wsIndex = STATS_1_TO_10.indexOf(skaven.stats.WS)
    const tIndex = STATS_1_TO_10.indexOf(skaven.stats.T)
    expect(sensitivity.hitRows![0].values[wsIndex]).toBeCloseTo(odds.chain.anyHit, 10)
    expect(sensitivity.ooaGrid[wsIndex][tIndex]).toBeCloseTo(odds.chain.outOfAction, 10)
  })

  it('a higher opponent Weapon Skill only ever lowers the chance to hit, in melee', () => {
    const sensitivity = computeOddsSensitivity(setup(captain, skaven, 'sword', 'dagger'))
    const values = sensitivity.hitRows![0].values
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeLessThanOrEqual(values[i - 1] + 1e-9)
  })

  it('a higher opponent Toughness only ever lowers the chance to wound', () => {
    const sensitivity = computeOddsSensitivity(setup(captain, skaven, 'sword', 'dagger'))
    const values = sensitivity.woundRows[0].values
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeLessThanOrEqual(values[i - 1] + 1e-9)
  })

  it('ranged attacks have no hit-vs-Weapon-Skill row (Ballistic Skill does not care about it)', () => {
    const sensitivity = computeOddsSensitivity(setup(marksman, skaven, 'bow', null))
    expect(sensitivity.hitRows).toBeNull()
    expect(sensitivity.woundRows).toHaveLength(2)
    expect(sensitivity.ooaGrid).toHaveLength(10)
    expect(sensitivity.ooaGrid[0]).toHaveLength(10)
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
    const pavise = loadoutOf([{ itemId: 'pavise', quantity: 1 }])
    expect(relevantToggles(brawler, 'melee', kit.melee[0], pavise).map((t) => t.field)).toContain('paviseFront')
  })
})
