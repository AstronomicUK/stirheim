import { describe, expect, it } from 'vitest'
import { findWeapon } from '../../../rules/data/weapons'
import { IMPOSSIBLE } from '../../../rules/engine/dice'
import type { RosterItem } from '../../../rules/types/roster'
import { defaultCampaignHouseRules } from '../../../rules/types/roster'
import { kindTraits, kitWithSelectedWeapons, loadoutOf, type Combatant } from './combatants'
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

it('failed Fear when charged requires sixes, with exemptions and no shooting penalty (#70)', () => {
  const scary = { ...skaven, traitIds: ['causes_fear'] }
  const fight = setup(captain, scary, 'sword', 'dagger')
  const context = { ...fight.context, failedFearWhenCharged: true }
  expect(computeOdds({ ...fight, context }).weapons[0].input.hitThreshold).toBe(6)
  expect(computeOdds({ ...fight, context }).weapons[0].pHit).toBeCloseTo(1 / 6)
  for (const trait of ['causes_fear', 'immune_to_fear', 'immune_to_psychology', 'frenzy']) {
    expect(computeOdds({ ...fight, context, attacker: { ...captain, traitIds: [trait] } }).weapons[0].input.hitThreshold).toBe(4)
  }
  expect(computeOdds({ ...fight, context: { ...context, frenzyEnded: true }, attacker: { ...captain, traitIds: ['frenzy'] } }).weapons[0].input.hitThreshold).toBe(6)
  expect(computeOdds({ ...fight, context, defender: skaven }).weapons[0].input.hitThreshold).toBe(4)
  expect(computeOdds({ ...fight, context: { ...context, charging: true } }).weapons[0].input.hitThreshold).toBe(4)
  expect(computeOdds({ ...fight, context, attacker: { ...captain, traitIds: ['invincible_swordsman'] } }).weapons[0].input.hitThreshold).toBe(2) // Explicit always-2+ source rule.
  const shot = setup(marksman, scary, 'bow', null)
  expect(computeOdds({ ...shot, context }).weapons[0].input.hitThreshold).toBe(4)
  expect(relevantToggles(captain, 'melee', fight.primary, fight.defenderKit, null, scary).some(t => t.field === 'failedFearWhenCharged')).toBe(true)
  expect(relevantToggles(captain, 'melee', fight.primary, fight.defenderKit, null, skaven).some(t => t.field === 'failedFearWhenCharged')).toBe(false)
})


it('resolves charge versus Strike First by Initiative, and when-charged weapons only when charged (#156)', () => {
  const spearman = combatant('Spearman', [{ itemId: 'spear', quantity: 1 }], { stats: { ...base, I: 2 } })
  const charge = setup(captain, spearman, 'sword', null)
  expect(computeOdds({ ...charge, context: { ...charge.context, charging: true } }).strikeOrder).toContain('Captain strikes first: Initiative 3')
  const faster = { ...spearman, stats: { ...spearman.stats, I: 5 } }
  expect(computeOdds({ ...charge, defender: faster, context: { ...charge.context, charging: true } }).strikeOrder).toContain('Spearman strikes first: Initiative 5')
  const corbin = combatant('Guard', [{ itemId: 'bec_de_corbin', quantity: 1 }], { stats: { ...base, I: 2 } })
  const counter = setup(corbin, captain, 'bec_de_corbin', null)
  expect(computeOdds({ ...counter, context: { ...counter.context, firstTurnOfCombat: true } }).strikeOrder).toContain('Captain strikes first: Initiative 3')
})


it('only held defender weapons grant parry and strike-order effects (#156)', () => {
  const d = combatant('Guard', [{ itemId: 'spear', quantity: 1 }, { itemId: 'sword', quantity: 1 }, { itemId: 'double_handed_weapon', quantity: 1 }, { itemId: 'shield', quantity: 1 }], { stats: { ...base, I: 2 } })
  const fight = setup(captain, d, 'sword', null)
  const held = (id: string) => kitWithSelectedWeapons(fight.defenderKit, fight.defenderKit.melee.find(w => w.id === id)!, null)
  const swordKit = held('sword')
  const sword = computeOdds({ ...fight, defenderKit: swordKit })
  expect(sword.parryAttempts).toBe(1)
  expect(sword.strikeOrder).toContain('Captain strikes first: Initiative 3')
  expect(swordKit.armour.shield).toBe(true)
  const spear = computeOdds({ ...fight, defenderKit: held('spear'), context: { ...fight.context, firstTurnOfCombat: true } })
  expect(spear.parryAttempts).toBe(0)
  expect(spear.strikeOrder).toContain('Guard strikes first in the first turn (Spear)')
  const heavyKit = held('double_handed_sword')
  expect(heavyKit.armour.shield).toBe(false)
  expect(kitWithSelectedWeapons(fight.defenderKit, heavyKit.melee[0], null, 'ranged').armour.shield).toBe(true)
  expect(computeOdds({ ...fight, defenderKit: heavyKit }).strikeOrder).toContain('always strikes last')
  expect(fight.defenderKit.melee).toHaveLength(3)
  expect(fight.defenderKit.armour.shield).toBe(true) // Selecting hands never edits the carried kit.
})


it('Merchant Pike gains Initiative only in the opening round (#156)', () => {
  const pikeman = combatant('Pikeman', [{ itemId: 'pike_merchant_caravans', quantity: 1 }])
  const fight = setup(pikeman, captain, 'pike_merchant_caravans', null)
  expect(computeOdds({ ...fight, context: { ...fight.context, charging: true } }).strikeOrder).toContain('charging')
  const againstPike = setup(captain, pikeman, 'sword', null)
  expect(computeOdds({ ...againstPike, context: { ...againstPike.context, charging: true } }).strikeOrder).toContain('Pikeman strikes first: Initiative 4')
  expect(computeOdds(againstPike).strikeOrder).toContain('Equal Initiative (3 each)')
  expect(relevantToggles(captain, 'melee', againstPike.primary, againstPike.defenderKit).some(t => t.field === 'firstTurnOfCombat')).toBe(true)
})

it('Tilean Pike explicitly beats a faster charging Spear, but later rounds use Initiative (#156)', () => {
  const pikeman = combatant('Pikeman', [{ itemId: 'pike_tileans', quantity: 1 }], { stats: { ...base, I: 1, A: 4 }, traitIds: ['frenzy'] })
  const spearman = combatant('Spearman', [{ itemId: 'spear', quantity: 1 }], { stats: { ...base, I: 6 } })
  const fight = setup(spearman, pikeman, 'spear', null)
  expect(computeOdds({ ...fight, context: { ...fight.context, charging: true } }).strikeOrder).toContain('Pikeman strikes first: the Tilean Pike takes priority')
  expect(computeOdds(fight).strikeOrder).toContain('Spearman strikes first: Initiative 6')
  const ordinaryCharge = setup(captain, pikeman, 'sword', null)
  expect(computeOdds({ ...ordinaryCharge, context: { ...ordinaryCharge.context, charging: true } }).strikeOrder).toContain('Captain strikes first: Initiative 3')
  expect(computeOdds(setup(pikeman, spearman, 'pike_tileans', null)).attacks).toBe(1)
})

it('Serpent Staff power replaces normal attacks with exactly one WS4/S4 attack (#150)', () => {
  const priest = combatant('Priest', [{ itemId: 'serpent_staff', quantity: 1 }, { itemId: 'dagger', quantity: 1 }, { itemId: 'shield', quantity: 1 }], { stats: { ...base, WS: 7, S: 6, A: 4 }, traitIds: ['frenzy', 'pit_fighter'], skillIds: ['mighty_blow', 'combat_master'] })
  const fight = setup(priest, skaven, 'serpent_staff', 'dagger')
  const powered = computeOdds({ ...fight, context: { ...fight.context, serpentStaffPower: true, insideBuildings: true, fightingMultiple: true } })
  expect(powered.attacks).toBe(1)
  expect(powered.chain.attacks).toBe(1)
  expect(powered.weapons[0].ws).toBe(4)
  expect(powered.weapons[0].strength).toBe(4)
  expect(powered.weapons[1].attacks).toBe(0)
  expect(powered.strikeOrder).toContain('Serpent Staff attacks first')
  const held = kitWithSelectedWeapons(fight.attackerKit, fight.primary, null)
  expect(held.armour.shield).toBe(false)
  expect(held.melee[0].parry).toBe(true) // Ordinary two-handed staff still parries.
})

it('staff activation forfeits defender parries even if different equipment is selected (#150)', () => {
  const fight = setup(captain, skaven, 'sword', null, { defenderStaffPower: true });
  expect(computeOdds(fight).parryAttempts).toBe(0);
  expect(computeOdds(fight).weapons[0].input.parryEligible).toBe(false);
  expect(computeOdds(fight).strikeOrder).toContain("Skritch's Serpent Staff attacks first");
});

it('both blunderbusses automatically deliver one S3 hit per model in the line (#154)', () => {
  for (const id of ['blunderbuss', 'chaos_dwarf_blunderbuss']) {
    const gunner = combatant('Gunner', [{ itemId: id, quantity: 1 }], { stats: { ...base, BS: 0, A: 4 }, skillIds: ['quick_shot'] })
    const fight = setup(gunner, skaven, id, null)
    const odds = computeOdds({ ...fight, context: { ...fight.context, cover: true, longRange: true, movedThisTurn: true } })
    expect(odds.attacks).toBe(1)
    expect(odds.weapons[0].strength).toBe(3)
    expect(odds.weapons[0].pHit).toBe(1)
    expect(odds.weapons[0].pWound).toBeCloseTo(1 / 2)
    expect(odds.weapons[0].input.automaticHitReason).toBe('blunderbussLine')
    expect(odds.notes.join(' ')).toContain('including friends')
    expect(relevantToggles(gunner, 'ranged', fight.primary).some(t => ['cover', 'longRange', 'movedThisTurn'].includes(t.field))).toBe(false)
  }
})

it('includes the off-hand Whipcrack attack in the displayed weapon counts and combined odds', () => {
  const wielder = combatant('Whip wielder', [{ itemId: 'sword', quantity: 1 }, { itemId: 'steel_whip', quantity: 1 }])
  const target = combatant('Target', [])
  const fight = setup(wielder, target, 'sword', 'steel_whip')
  fight.context = { ...fight.context, charging: true }
  const odds = computeOdds(fight)
  expect(odds.weapons.map(w => [w.weapon.id, w.attacks])).toEqual([['sword', 1], ['steel_whip', 2]])
  expect(odds.attacks).toBe(3)
  expect(odds.chain.attacks).toBe(3)
  expect(odds.chain.anyHit).toBeCloseTo(1 - Math.pow(0.5, 3), 10)
  expect(computeOdds({ ...fight, context: { ...fight.context, charging: false } }).attacks).toBe(2)
})

it('separates a charged defender’s single Whipcrack attack from their normal strike order', () => {
  const d = combatant('Whip defender', [{ itemId: 'sword', quantity: 1 }, { itemId: 'steel_whip', quantity: 1 }], { stats: { ...base, I: 5 } })
  const fight = setup(captain, d, 'sword', null)
  fight.context = { ...fight.context, charging: true }
  const fast = computeOdds(fight).strikeOrder
  expect(fast).toContain('Normal attacks: Captain strikes first: charging.')
  expect(fast).toContain("Whip defender's bonus attack goes before Captain's charge (Initiative 5 against 3)")
  expect(fast).toContain('against the charger only')
  expect(fast).toContain('one bonus in total')
  expect(computeOdds({ ...fight, defender: { ...d, stats: { ...base, I: 2 } } }).strikeOrder).toContain("Captain's charge goes before the bonus attack")
  expect(computeOdds({ ...fight, defender: { ...d, stats: { ...base, I: 3 } } }).strikeOrder).toContain('equal Initiative (3): roll off')
  expect(computeOdds({ ...fight, defenderKit: kitWithSelectedWeapons(fight.defenderKit, findWeapon('sword')!, null) }).strikeOrder).not.toContain('Whipcrack')
  expect(computeOdds({ ...fight, context: { ...fight.context, charging: false } }).strikeOrder).not.toContain('Whipcrack')
});

it('gives Whirling Blades exactly two early bonus attacks, keeping normal attacks separate', () => {
  const d = combatant('Doomseeker', [{ itemId: 'whirling_blades', quantity: 1 }], { stats: { ...base, I: 5 } })
  const fight = setup(captain, d, 'sword', null)
  fight.context = { ...fight.context, charging: true }
  const advice = computeOdds(fight).strikeOrder
  expect(advice).toContain('Normal attacks: Captain strikes first: charging.')
  expect(advice).toContain('Whirlwind of Death')
  expect(advice).toContain("Doomseeker's two bonus attacks go before Captain's charge")
  expect(advice).not.toContain('gains one Strike First attack')
})

it('does not let a high-Initiative Strike Last charger jump ahead of Whipcrack', () => {
  const a = combatant('Heavy charger', [{ itemId: 'double_handed_weapon', quantity: 1 }], { stats: { ...base, I: 8 } })
  const d = combatant('Whip defender', [{ itemId: 'steel_whip', quantity: 1 }])
  const fight = setup(a, d, 'double_handed_sword', null)
  fight.context = { ...fight.context, charging: true }
  expect(computeOdds(fight).strikeOrder).toContain('before the charger’s Strike Last attacks')
  expect(computeOdds({ ...fight, attacker: { ...a, skillIds: ['strongman'] } }).strikeOrder).toContain("Heavy charger's charge goes before the bonus attack")
})

it('offers the Lustria Sunstaff’s melee profile without applying its shooting-only Sunbolt bonuses', () => {
  const amazon = combatant('Amazon', [{ itemId: 'sunstaff_lustria', quantity: 1 }], { stats: { ...base, S: 5, A: 2 } })
  const target = combatant('Armoured target', [{ itemId: 'light_armour', quantity: 1 }])
  const kit = loadoutOf(amazon.equipment)
  expect(kit.melee.map(w => w.id)).toEqual(['sunstaff_lustria_melee'])
  expect(kit.ranged.map(w => w.id)).toEqual(['sunstaff_lustria'])
  const melee = computeOdds(setup(amazon, target, 'sunstaff_lustria_melee', null))
  const shooting = computeOdds(setup(amazon, target, 'sunstaff_lustria', null))
  expect(melee.attacks).toBe(2)
  expect(melee.weapons[0].input.woundThreshold).toBe(2)
  expect(melee.weapons[0].input.armourThreshold).toBe(6)
  expect(shooting.attacks).toBe(1)
  expect(shooting.weapons[0].input.woundThreshold).toBe(3)
  expect(shooting.weapons[0].input.armourThreshold).toBe(IMPOSSIBLE)
  expect(loadoutOf([{ itemId: 'sunstaff', quantity: 1 }]).melee).toEqual([])
  expect(loadoutOf([{ itemId: 'sunstaff_lustria', quantity: 2 }]).melee).toHaveLength(2)
});

it('uses the Tufenk’s printed dry-target Strength without hiding its separate fire rule', () => {
  const firer = combatant('Firer', [{ itemId: 'tufenk', quantity: 1 }])
  const target = combatant('Dry target', [])
  const fight = setup(firer, target, 'tufenk', null)
  expect(relevantToggles(firer, 'ranged', fight.primary).some(t => t.field === 'dryTarget')).toBe(true)
  const normal = computeOdds(fight)
  const dry = computeOdds({ ...fight, context: { ...fight.context, dryTarget: true } })
  expect(normal.weapons[0].input.woundThreshold).toBe(5)
  expect(dry.weapons[0].input.woundThreshold).toBe(4)
  expect(normal.notes.some(n => n.includes('4+ sets the target on fire'))).toBe(true)
  expect(dry.notes.some(n => n.includes('2+ sets the target on fire'))).toBe(true)
  expect(dry.notes.some(n => n.includes('not included in these odds'))).toBe(true)
  const bow = setup(marksman, target, 'bow', null)
  expect(relevantToggles(marksman, 'ranged', bow.primary).some(t => t.field === 'dryTarget')).toBe(false)
  expect(computeOdds({ ...bow, context: { ...bow.context, dryTarget: true } }).weapons[0].input.woundThreshold).toBe(computeOdds(bow).weapons[0].input.woundThreshold)
})


it('Bolas can hit but never wound or take the target out of action', () => {
  const thrower = combatant('Thrower', [{ itemId: 'bolas', quantity: 1 }])
  const odds = computeOdds(setup(thrower, skaven, 'bolas', null))
  expect(odds.weapons[0].pHit).toBeGreaterThan(0)
  expect(odds.weapons[0].pWound).toBe(0)
  expect(odds.chain.anyWound).toBe(0)
  expect(odds.chain.outOfAction).toBe(0)
  expect(odds.notes.join(' ')).toContain('entangles instead of wounding')
})


it('Beastlash Fear affects an animal that failed when charged, without giving universal Fear', () => {
  const beastmaster = combatant('Beastmaster', [{ itemId: 'beastlash', quantity: 1 }])
  const dog = combatant('Dog', [{ itemId: 'dagger', quantity: 1 }], { kind: 'animal', isAnimal: true })
  const fight = setup(dog, beastmaster, 'dagger', null)
  const failed = { ...fight, context: { ...fight.context, failedFearWhenCharged: true } }
  expect(relevantToggles(dog, 'melee', fight.primary, fight.defenderKit, null, beastmaster).some(t => t.field === 'failedFearWhenCharged')).toBe(true)
  expect(computeOdds(failed).weapons[0].input.hitThreshold).toBe(6)
  expect(toDefender(beastmaster, fight.defenderKit).activeTraitIds).not.toContain('causes_fear')
  const human = { ...dog, kind: 'hero' as const, isAnimal: false }
  expect(computeOdds({ ...failed, attacker: human }).weapons[0].input.hitThreshold).toBe(4)
  expect(relevantToggles(human, 'melee', fight.primary, fight.defenderKit, null, beastmaster).some(t => t.field === 'failedFearWhenCharged')).toBe(false)
  expect(computeOdds({ ...failed, attacker: { ...dog, traitIds: ['immune_to_fear'] } }).weapons[0].input.hitThreshold).toBe(4)
  expect(computeOdds({ ...failed, attacker: { ...dog, isAnimal: false } }).weapons[0].input.hitThreshold).toBe(4) // Gnoblar companion
  const noWhip = loadoutOf([{ itemId: 'dagger', quantity: 1 }])
  expect(computeOdds({ ...failed, defenderKit: noWhip }).weapons[0].input.hitThreshold).toBe(4)
})


it('a carried Torch is a club at minus one to hit and frightens identified animals', () => {
  const torchbearer = combatant('Torchbearer', [{ itemId: 'torch', quantity: 1 }])
  const fight = setup(torchbearer, skaven, 'torch', null)
  const odds = computeOdds(fight)
  expect(odds.weapons[0].input.hitThreshold).toBe(5)
  expect(odds.weapons[0].input.concussion).toBe(true)
  expect(odds.weapons[0].strength).toBe(base.S)
  expect(toDefender(torchbearer, fight.attackerKit).causesFearInAnimals).toBe(true)
  expect(odds.notes.join(' ')).toContain('cannot be regenerated')
  expect(findWeapon('gromril_torch')).toBeUndefined()
  expect(findWeapon('ithilmar_torch')).toBeUndefined()
})

describe('Blessing shooting odds', () => {
  it('includes permission in hit, wound and OOA probabilities and sensitivity tables', () => {
    const plain = setup(marksman, skaven, 'bow', null)
    const blessed = { ...plain, ladyBlessing: true }
    const before = computeOdds(plain)
    const after = computeOdds(blessed)
    expect(after.weapons[0].pHit).toBeCloseTo(before.weapons[0].pHit / 2)
    expect(after.weapons[0].pWound).toBeCloseTo(before.weapons[0].pWound / 2)
    expect(after.chain.outOfAction).toBeCloseTo(before.chain.outOfAction / 2)
    const normalTable = computeOddsSensitivity(plain)
    const blessedTable = computeOddsSensitivity(blessed)
    expect(blessedTable.woundRows[0].values[2]).toBeCloseTo(normalTable.woundRows[0].values[2] / 2)
    expect(blessedTable.ooaGrid[3][2]).toBeCloseTo(normalTable.ooaGrid[3][2] / 2)
  })
})

describe('Pigeon Bomb fixed launch table', () => {
  it('ignores Ballistic Skill, shooting modifiers and ordinary hit rerolls', () => {
    const bomber = combatant('Bomber', [{ itemId: 'hersten_wenkler_pigeon_bombs', quantity: 1 }], { stats: { ...base, BS: 6 }, traitIds: ['blessed_sight'] })
    const initial = setup(bomber, skaven, 'hersten_wenkler_pigeon_bombs', null)
    const accurate = computeOdds(initial)
    const poor = computeOdds({ ...initial, attacker: { ...bomber, stats: { ...base, BS: 1 } }, context: { ...initial.context, cover: true, longRange: true, largeTarget: true } })
    for (const odds of [accurate, poor]) {
      expect(odds.weapons[0].input.hitThreshold).toBe(5)
      expect(odds.weapons[0].input.rerollToHit).toBe(false)
      expect(odds.weapons[0].pHit).toBeCloseTo(1 / 3)
      expect(odds.notes.join(' ')).toContain('selected target only')
    }
    expect(accurate.chain.outOfAction).toBeCloseTo(poor.chain.outOfAction)
  })
})

it('resolves a declared Pigeon blast as one automatic S4 hit without another launch or blessing test', () => {
  const bomber = combatant('Bomber', [{ itemId: 'hersten_wenkler_pigeon_bombs', quantity: 1 }])
  const initial = setup(bomber, skaven, 'hersten_wenkler_pigeon_bombs', null)
  const odds = computeOdds({ ...initial, ladyBlessing: true, context: { ...initial.context, pigeonBlastHit: true, movedThisTurn: true } })
  expect(odds.attacks).toBe(1)
  expect(odds.weapons[0].input.automaticHitReason).toBe('pigeonBlast')
  expect(odds.weapons[0].input.temperamentalPigeon).toBeFalsy()
  expect(odds.weapons[0].input.firePermissionThreshold).toBeUndefined()
  expect(odds.weapons[0].pHit).toBe(1)
  expect(odds.weapons[0].strength).toBe(4)
  expect(odds.chain.anyHit).toBe(1)
})

it('the Swivel Gun cannot fire after movement even with Nimble and never gains extra shots', () => {
  const gunner = combatant('Gunner', [{ itemId: 'swivel_gun', quantity: 1 }], { skillIds: ['nimble', 'quick_shot'], stats: { ...base, A: 4 } })
  for (const id of ['swivel_gun_ball_shot', 'swivel_gun_chain_shot', 'swivel_gun_grape_shot']) {
    const initial = setup(gunner, skaven, id, null)
    expect(computeOdds(initial).attacks).toBe(1)
    expect(computeOdds({ ...initial, context: { ...initial.context, movedThisTurn: true } }).attacks).toBe(0)
  }
})

it('includes the Swivel misfire six as an extra 1/36 automatic hit at increased Strength', () => {
  const gunner = combatant('Gunner', [{ itemId: 'swivel_gun', quantity: 1 }])
  const tough = { ...skaven, stats: { ...skaven.stats, T: 4 } }
  const initial = setup(gunner, tough, 'swivel_gun_chain_shot', null)
  const odds = computeOdds(initial)
  expect(odds.weapons[0].pHit).toBeCloseTo(0.5 + 1 / 36)
  expect(odds.weapons[0].pWound).toBeCloseTo(0.5 * 0.5 + 1 / 36 * 2 / 3)
  const blessed = computeOdds({ ...initial, ladyBlessing: true })
  expect(blessed.chain.outOfAction).toBeCloseTo(odds.chain.outOfAction / 2)
  expect(blessed.chain.anyHit).toBeCloseTo(odds.chain.anyHit / 2)
})

it('an exploding weapon inflicts one automatic Strength 4 self-hit with no criticals or weapon armour modifier', () => {
  const gunner = combatant('Gunner', [{ itemId: 'swivel_gun', quantity: 1 }, { itemId: 'light_armour', quantity: 1 }])
  const initial = setup(gunner, gunner, 'swivel_gun_ball_shot', null)
  const odds = computeOdds({ ...initial, primary: { id: 'blackpowder_self_hit', name: 'Exploding weapon', type: 'ranged', strength: 4, critCategory: 'missile', concussion: false, special: ['blackpowderSelfHit'], rangedProfile: { shortRange: null, maxRange: null, shotsPerTurn: 1 } } })
  expect(odds.attacks).toBe(1)
  expect(odds.weapons[0].pHit).toBe(1)
  expect(odds.weapons[0].strength).toBe(4)
  expect(odds.weapons[0].input.armourThreshold).toBe(6)
  expect(odds.chain.anyCrit).toBe(0)
  expect(odds.weapons[0].input.misfireEnhanced).toBeUndefined()
})

it('Grape Shot retains an unmodified armour save even for the strengthened misfire hit', () => {
  const gunner = combatant('Gunner', [{ itemId: 'swivel_gun', quantity: 1 }])
  const protectedTarget = combatant('Target', [{ itemId: 'light_armour', quantity: 1 }])
  const initial = setup(gunner, protectedTarget, 'swivel_gun_grape_shot', null)
  const odds = computeOdds({ ...initial, houseRules: { ...initial.houseRules, strengthArmourPiercing: true } })
  expect(odds.weapons[0].input.armourThreshold).toBe(6)
  expect(odds.weapons[0].input.misfireEnhanced?.armourThreshold).toBe(6)
  const ball = setup(gunner, protectedTarget, 'swivel_gun_ball_shot', null)
  expect(computeOdds({ ...ball, houseRules: { ...ball.houseRules, strengthArmourPiercing: true } }).weapons[0].input.armourThreshold).toBe(IMPOSSIBLE)
})
