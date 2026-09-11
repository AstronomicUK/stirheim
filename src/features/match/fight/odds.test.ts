import { describe, expect, it } from 'vitest'
import { findWeapon } from '../../../rules/data/weapons'
import { IMPOSSIBLE } from '../../../rules/engine/dice'
import type { RosterItem } from '../../../rules/types/roster'
import { defaultCampaignHouseRules } from '../../../rules/types/roster'
import { kindTraits, loadoutOf, type Combatant } from './combatants'
import { applyPreBattle, combatContextFor, computeOdds, computeOddsSensitivity, percent, relevantToggles, STATS_1_TO_10, thresholdText, toDefender, type FightSetup } from './odds'

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


it('scenario hunting bolts improve crossbow injury rolls without affecting bows or melee', () => {
  const model = combatant('Cargo shooter', [{ itemId: 'crossbow', quantity: 1 }, { itemId: 'bow', quantity: 1 }, { itemId: 'sword', quantity: 1 }])
  const result = applyPreBattle(model, loadoutOf(model.equipment), [{ label: 'Hunting Bolts', appliesTo: 'crossbows', injuryRollBonus: 1 }])
  expect(result.kit.ranged.find(w => w.id === 'crossbow')?.special).toContain('injuryBonus:1')
  expect(result.kit.ranged.find(w => w.id === 'bow')?.special).not.toContain('injuryBonus:1')
  expect(result.kit.melee.find(w => w.id === 'sword')?.special).not.toContain('injuryBonus:1')
})


it('keeps Albion protective saves against high Strength and armour-ignoring attacks',()=>{
 for(const [itemId,threshold] of [['dark_emissary_spiral',5],['truthsayer_triskele',4]] as const){
  const attacker=combatant('Strong attacker',[{itemId:'sword',quantity:1}],{stats:{...base,S:10}})
  for(const equipment of [[{itemId,quantity:1}],[{itemId:null,customName:itemId==='dark_emissary_spiral'?'The Spiral':'The Triskele',quantity:1}]]){
   const fight=setup(attacker,combatant('Protected',equipment),'sword',null)
   fight.primary={...fight.primary,ignoresArmourSave:true}
   expect(computeOdds(fight).weapons[0].input.wardSaveThreshold).toBe(threshold)
  }
 }
})


it('applies Aenur’s fixed hit roll and Ienh-Khain’s strength and critical threshold',()=>{
 const aenur=combatant('Aenur',[{itemId:'ienh_khain',quantity:1}],{stats:{...base,WS:8,S:4,A:3},traitIds:['invincible_swordsman'],skillIds:['mighty_blow']})
 const enemy=combatant('Enemy',[],{stats:{...base,WS:10,T:5},traitIds:[]})
 const fight=setup(aenur,enemy,'ienh_khain',null)
 fight.defenderKit.toBeHit.melee=-2
 const odds=computeOdds(fight)
 expect(odds.weapons[0].input.hitThreshold).toBe(2)
 expect(odds.weapons[0].input.woundThreshold).toBe(3)
 expect(odds.weapons[0].input.critTriggerFaces).toEqual([5,6])
 expect(toDefender(fight.attacker,fight.attackerKit).parryWeaponCount).toBe(1)
})
it('adds the Bo’s attack after Frenzy and blocks an off-hand weapon',()=>{
 const ninja=combatant('Ninja',[{itemId:'ninja_gnoblar_bo',quantity:1}],{stats:{...base,A:2},traitIds:['frenzy']})
 const fight=setup(ninja,skaven,'ninja_gnoblar_bo',null)
 expect(computeOdds(fight).attacks).toBe(5)
 expect(fight.primary.special).toContain('twoHanded')
 expect(toDefender(fight.attacker,fight.attackerKit).parryWeaponCount).toBe(1)
})
it('applies the Thief’s cloak to missile attacks only, including legacy equipment',()=>{
 const hidden=combatant('Thief',[{itemId:null,customName:"Thief's cloak",quantity:1}])
 const bare=combatant('Bare',[])
 expect(computeOdds(setup(marksman,hidden,'bow',null)).weapons[0].input.hitThreshold).toBe(Number(computeOdds(setup(marksman,bare,'bow',null)).weapons[0].input.hitThreshold)+1)
 expect(computeOdds(setup(captain,hidden,'sword',null)).weapons[0].input.hitThreshold).toBe(computeOdds(setup(captain,bare,'sword',null)).weapons[0].input.hitThreshold)
})


it('uses Icefang’s strength, parry, injury bonus and Drenok’s Strongman',()=>{
 const d=combatant('Drenok',[{itemId:'icefang_axe',quantity:1},{itemId:'sabertooth_tiger_hide',quantity:1}],{stats:{...base,S:4,I:4},skillIds:['strongman']})
 const fight=setup(d,skaven,'icefang_axe',null)
 const odds=computeOdds(fight)
 expect(odds.weapons[0].input.injuryRollModifier).toBe(1)
 expect(odds.weapons[0].input.woundThreshold).toBe(2)
 expect(toDefender(d,fight.attackerKit).parryWeaponCount).toBe(1)
 expect(odds.strikeOrder).toContain('Drenok strikes first: Initiative 4')
 expect(computeOdds(setup(captain,d,'sword',null)).strikeOrder).toContain('Drenok strikes first: Initiative 4')
 expect(computeOdds(setup({...d,skillIds:[]},skaven,'icefang_axe',null)).strikeOrder).toContain('always strikes last')
 const bonus=setup({...d,skillIds:['strongman','strike_to_injure']},skaven,'icefang_axe',null)
 expect(computeOdds(bonus).weapons[0].input.injuryRollModifier).toBe(2)
})
it('uses Tiger Hide as ordinary phase-specific armour and the Eye as a ward',()=>{
 const hide=combatant('Drenok',[{itemId:'sabertooth_tiger_hide',quantity:1}])
 expect(computeOdds(setup(captain,hide,'sword',null)).weapons[0].input.armourThreshold).toBe(6)
 expect(computeOdds(setup(marksman,hide,'bow',null)).weapons[0].input.armourThreshold).toBe(5)
 const eye=combatant('Abdul',[{itemId:null,customName:'Eye Pendant',quantity:1}])
 expect(computeOdds(setup(captain,eye,'sword',null)).weapons[0].input.wardSaveThreshold).toBe(4)
})
it('adds Rolling Pin strength to Mighty Blow while retaining cudgel concussion',()=>{
 const gwen=combatant('Gwen',[{itemId:'gwen_rolling_pin',quantity:1}],{stats:{...base,S:4},skillIds:['mighty_blow']})
 const target=combatant('Tough',[],{stats:{...base,T:5}})
 const input=computeOdds(setup(gwen,target,'gwen_rolling_pin',null)).weapons[0].input
 expect(input.woundThreshold).toBe(3)
 expect(input.concussion).toBe(true)
})

it('does not let Strongman cancel an unrelated one-handed strike-last weapon',()=>{
 const fighter=combatant('Fighter',[{itemId:'broadsword',quantity:1}],{skillIds:['strongman'],stats:{...base,I:10}})
 expect(computeOdds(setup(fighter,skaven,'broadsword',null)).strikeOrder).toContain('always strikes last')
})

it('uses Veskit’s printed attacks, fixed claw Strength, two parries and metallic armour',()=>{
 const veskit=combatant('Veskit',[{itemId:'veskit_eshin_claws',quantity:1},{itemId:'veskit_warplock_pistols',quantity:1}],{stats:{...base,S:4,A:4},traitIds:['veskit_no_pain','veskit_metallic_body']})
 const attack=computeOdds(setup(veskit,skaven,'veskit_eshin_claws',null))
 expect(attack.attacks).toBe(4)
 expect(attack.weapons[0].input.woundThreshold).toBe(2)
 const defense=computeOdds(setup(captain,veskit,'sword',null))
 expect(defense.parryAttempts).toBe(2)
 expect(defense.weapons[0].input.armourThreshold).toBe(3)
 expect(defense.weapons[0].input.ignoreKnockedDownAndStunned).toBe(true)
 expect(setup(veskit,skaven,'veskit_warplock_pistols',null).primary.special).not.toContain('prepareShotReloadEveryOtherTurnUnlessBrace')
})

it('applies legacy Hillman cloak saves and does not turn a lantern rig into a weapon',()=>{
 const hillman=combatant('Hillman',[{itemId:null,customName:'Heavy fur cloak',quantity:1}])
 expect(computeOdds(setup(captain,hillman,'sword',null)).weapons[0].input.armourThreshold).toBe(6)
 expect(computeOdds(setup(marksman,hillman,'bow',null)).weapons[0].input.armourThreshold).toBe(5)
 const without=loadoutOf([{itemId:'sword',quantity:1}])
 const withRig=loadoutOf([{itemId:'sword',quantity:1},{itemId:null,customName:'lantern rig (see below)',quantity:1}])
 expect(withRig.melee).toEqual(without.melee)
 expect(withRig.ranged).toEqual(without.ranged)
})

it('applies Maximilian’s holy bonus without changing critical faces or granting parry',()=>{
 const max=combatant('Max',[{itemId:null,customName:'double handed Holy Weapon',quantity:1}],{traitIds:['frenzy'],skillIds:['strongman']})
 const target=combatant('Brethren',[],{stats:{...base,T:5},traitIds:kindTraits('carnival_of_chaos','brethren',[])})
 const holy=computeOdds(setup(max,target,'maximilian_holy_weapon',null))
 expect(holy.weapons[0].input.woundThreshold).toBe(3)
 expect(holy.weapons[0].input.critTriggerFaces).toEqual([6])
 expect(holy.attacks).toBe(2)
 expect(holy.strikeOrder).not.toContain('always strikes last')
 expect(loadoutOf(max.equipment).melee[0].parry).toBeFalsy()
 const mundane=computeOdds(setup(max,{...target,traitIds:kindTraits('mercenaries_reikland','champion',[])},'maximilian_holy_weapon',null))
 expect(mundane.weapons[0].input.woundThreshold).toBe(4)
 expect(kindTraits('beastmen_raiders','gor',[])).toContain('maximilian_holy_target')
 expect(kindTraits('marauders_of_chaos','marauder',[])).not.toContain('maximilian_holy_target')
})

it('can end Frenzy after being knocked down without changing the printed Attacks',()=>{
 const max=combatant('Max',[{itemId:'maximilian_holy_weapon',quantity:1}],{stats:{...base,A:2},traitIds:['frenzy'],skillIds:['strongman']})
 const fight=setup(max,skaven,'maximilian_holy_weapon',null)
 expect(computeOdds(fight).attacks).toBe(4)
 expect(computeOdds({...fight,context:{...fight.context,frenzyEnded:true}}).attacks).toBe(2)
 expect(relevantToggles(max,'melee',fight.primary).map(t=>t.field)).toContain('frenzyEnded')
 expect(relevantToggles(captain,'melee',fight.primary).map(t=>t.field)).not.toContain('frenzyEnded')
 expect(max.stats.A).toBe(2)
})


it('shows extended Eagle Eyes range and hides only the ignored weapon penalties', () => {
  const archer = combatant('Archer', [], { skillIds: ['eagle_eyes'] })
  const bow = loadoutOf([{ itemId: 'bow', quantity: 1 }]).ranged[0]
  expect(relevantToggles(archer, 'ranged', bow).find(t => t.field === 'longRange')?.hint).toContain('More than 15 inches away (maximum 30 inches')
  const knives = findWeapon('throwing_knife')!
  expect(relevantToggles(archer, 'ranged', knives).map(t => t.field)).toEqual(['cover', 'largeTarget'])
  const pins = findWeapon('belaying_pins')!
  expect(relevantToggles(archer, 'ranged', pins).map(t => t.field)).toEqual(['movedThisTurn', 'cover', 'largeTarget'])
})


it('failed Stupidity suppresses both weapon hands and shooting without affecting a different warrior', () => {
  const warrior = { ...captain, traitIds: ['stupidity'] }
  const melee = setup(warrior, skaven, 'sword', 'dagger')
  const context = { ...melee.context, failedStupidity: true }
  const result = computeOdds({ ...melee, context })
  expect(result.attacks).toBe(0)
  expect(result.weapons.every(w => w.attacks === 0)).toBe(true)
  expect(computeOdds({ ...melee, context: { ...context, failedStupidity: false } }).attacks).toBe(2)
  expect(computeOdds({ ...melee, attacker: captain, context }).attacks).toBe(2)
  const ranged = setup({ ...marksman, traitIds: ['stupidity'] }, skaven, 'bow', null)
  expect(computeOdds({ ...ranged, context }).attacks).toBe(0)
  expect(relevantToggles(warrior, 'melee', melee.primary).some(t => t.field === 'failedStupidity')).toBe(true)
  expect(relevantToggles(captain, 'melee', melee.primary).some(t => t.field === 'failedStupidity')).toBe(false)
})
