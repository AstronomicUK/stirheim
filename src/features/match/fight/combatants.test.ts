import { computeOdds, combatContextFor } from './odds'
import { defaultCampaignHouseRules } from '../../../rules/types/roster'
import { describe, expect, it } from 'vitest'
import { emptyBattleLiveState } from '../../../domain'
import { findWarbandTemplate, WARBAND_TEMPLATES } from '../../../rules/data/warbandTemplates'
import type { RosterHenchmanGroup, RosterHero, RosterHiredSword, RosterItem, RosterWarband } from '../../../rules/types/roster'
import { setGroupOut, toggleHeroOut } from '../battle/sheet'
import { canBeOffHand, combatantLabel, combatantsOf, defaultOffHand, defaultPrimary, isTwoHanded, loadoutOf, loadoutFor, offHandCandidates, traitsFromRules } from './combatants'

const stats = { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }

function item(itemId: string, quantity = 1, extra: Partial<RosterItem> = {}): RosterItem {
  return { itemId, quantity, ...extra }
}

function hero(id: string, extra: Partial<RosterHero> = {}): RosterHero {
  return {
    id,
    name: id,
    unitTemplateId: 'mercenaries_reikland_captain',
    stats,
    xp: 0,
    levelUps: 0,
    skillTableIds: [],
    skillIds: [],
    spellIds: [],
    injuries: [],
    flags: {},
    equipment: [item('sword'), item('dagger')],
    status: 'active',
    ...extra,
  }
}

function group(id: string, extra: Partial<RosterHenchmanGroup> = {}): RosterHenchmanGroup {
  return { id, name: id, unitTemplateId: 'mercenaries_reikland_warriors', size: 3, stats, xp: 0, levelUps: 0, statIncreases: {}, equipment: [item('dagger', 3), item('shield', 3)], ...extra }
}

function hiredSword(id: string, extra: Partial<RosterHiredSword> = {}): RosterHiredSword {
  return { id, hiredSwordId: 'troll_slayer', name: id, stats, xp: 0, levelUps: 0, skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [item('dwarf_axe', 2)], status: 'active', ...extra }
}

function warband(extra: Partial<RosterWarband> = {}): RosterWarband {
  return { id: 'w1', name: 'Reikland Watch', warbandTemplateId: 'mercenaries_reikland', gold: 0, wyrdstone: 0, veteranPool: null, heroes: [], henchmenGroups: [], hiredSwords: [], stash: [], ...extra }
}

describe('loadoutOf', () => {
  it('maps a sword, a dagger and light armour', () => {
    const kit = loadoutOf([item('sword'), item('dagger'), item('light_armour')])
    expect(kit.melee.map((w) => w.id)).toEqual(['sword', 'dagger'])
    expect(kit.ranged).toEqual([])
    expect(kit.armour).toEqual({ type: 'light', shield: false, buckler: false })
    expect(kit.helmet).toBe(false)
    expect(kit.ignored).toEqual([])
  })

  it('reads shields, bucklers, helmets and the best armour worn', () => {
    const kit = loadoutOf([item('light_armour'), item('heavy_armour'), item('shield'), item('buckler'), item('helmet')])
    expect(kit.armour).toEqual({ type: 'heavy', shield: true, buckler: true })
    expect(kit.helmet).toBe(true)
  })

  it('treats gromril, chaos and lamellar armour as a 4+ save and toughened leathers as light', () => {
    expect(loadoutOf([item('chaos_armour')]).armour.type).toBe('gromril')
    expect(loadoutOf([item('lamellar_armour')]).armour.type).toBe('gromril')
    expect(loadoutOf([item('toughened_leathers')]).armour.type).toBe('light')
    expect(loadoutOf([item('ithilmar_armour')]).armour.type).toBe('heavy')
  })

  it('kite shields and pavises are their own rules, not plain shields', () => {
    const kite = loadoutOf([item('kite_shield')])
    expect(kite.armour.shield).toBe(false)
    expect(kite.armour.kiteShield).toBe(true)
    expect(kite.assumptions[0]).toMatch(/mounted 6\+ is not modelled/)
    const pavise = loadoutOf([item('pavise')])
    expect(pavise.armour.pavise).toBe(true)
    expect(pavise.armour.shield).toBe(false)
  })

  it('resolves the new per-weapon gromril and ithilmar items straight to their engine variants', () => {
    expect(loadoutOf([item('gromril_axe')]).melee[0]).toMatchObject({ id: 'gromril_axe', saveModifier: 2 })
    expect(loadoutOf([item('ithilmar_sword')]).melee[0]).toMatchObject({ id: 'ithilmar_sword', parry: true })
  })

  it('enchanted skins are a 6+ ward save', () => {
    expect(loadoutOf([item('enchanted_skins')]).wardSaveThreshold).toBe(6)
  })

  it('two of the same hand weapon are two weapons; a bought pair is one entry; ranged weapons once', () => {
    expect(loadoutOf([item('sword', 2)]).melee.map((w) => w.id)).toEqual(['sword', 'sword'])
    expect(loadoutOf([item('sword', 5)]).melee).toHaveLength(2)
    expect(loadoutOf([item('fighting_claws', 1)]).melee).toHaveLength(1)
    expect(loadoutOf([item('bow', 2)]).ranged.map((w) => w.id)).toEqual(['bow'])
  })

  it('resolves a gromril weapon from its note, defaulting to a sword', () => {
    expect(loadoutOf([item('gromril_weapon', 1, { notes: 'Gromril axe' })]).melee[0].id).toBe('gromril_axe')
    const kit = loadoutOf([item('gromril_weapon')])
    expect(kit.melee[0].id).toBe('gromril_sword')
    expect(kit.assumptions[0]).toMatch(/assumed/)
  })

  it('lists custom items and unmodelled weapons, and leaves misc gear out quietly', () => {
    const kit = loadoutOf([{ itemId: null, customName: 'Katana', quantity: 1 }, item('rope_and_hook'), item('lucky_charm')])
    expect(kit.ignored).toEqual(['Katana'])
  })
})

describe('weapon hands', () => {
  const kit = loadoutOf([item('sword'), item('dagger'), item('double_handed_weapon'), item('spear'), item('morning_star')])
  const byId = (id: string) => kit.melee.find((w) => w.id === id)!

  it('knows which weapons need both hands', () => {
    expect(isTwoHanded(byId('double_handed_sword'))).toBe(true)
    expect(isTwoHanded(byId('sword'))).toBe(false)
    expect(canBeOffHand(byId('morning_star'))).toBe(false)
    expect(canBeOffHand(byId('spear'))).toBe(false)
    expect(canBeOffHand(byId('dagger'))).toBe(true)
  })

  it('offers off-hand weapons for a hand weapon only', () => {
    expect(offHandCandidates(kit.melee, byId('sword')).map((w) => w.id)).toEqual(['dagger'])
    expect(offHandCandidates(kit.melee, byId('double_handed_sword'))).toEqual([])
    expect(offHandCandidates(kit.melee, byId('spear'))).toEqual([])
  })

  it('a second copy of the primary can be the off-hand', () => {
    const two = loadoutOf([item('sword', 2)])
    expect(offHandCandidates(two.melee, two.melee[0])).toHaveLength(1)
  })

  it('picks the heaviest hitter as the default primary and a dagger for the other hand', () => {
    expect(defaultPrimary(kit.melee).id).toBe('double_handed_sword')
    const plain = loadoutOf([item('dagger'), item('sword')])
    expect(defaultPrimary(plain.melee).id).toBe('sword')
    expect(defaultOffHand(plain.melee, defaultPrimary(plain.melee))?.id).toBe('dagger')
    expect(defaultPrimary([]).id).toBe('unarmed')
  })
})

describe('traitsFromRules', () => {
  it('maps rule headings to modelled traits', () => {
    expect(traitsFromRules([{ name: 'Frenzy', text: '' }, { name: 'Hatred', text: '' }, { name: 'Large', text: '' }, { name: 'Leader', text: '' }])).toEqual(['frenzy', 'hatred', 'large_target'])
    expect(traitsFromRules([{ name: 'Hate Chaos', text: '' }])).toEqual(['hatred'])
  })

  it('maps the psychology headings (#70)', () => {
    expect(traitsFromRules([{ name: 'Fear', text: 'Trolls cause fear.' }])).toEqual(['causes_fear'])
    expect(traitsFromRules([{ name: 'Cause Fear', text: 'Vampires cause fear.' }])).toEqual(['causes_fear'])
    expect(traitsFromRules([{ name: 'Fearsome', text: 'A Trained Bear causes fear.' }])).toEqual(['causes_fear'])
    expect(traitsFromRules([{ name: 'Immune to Psychology', text: 'Zombies are not affected by psychology.' }])).toEqual(['immune_to_psychology'])
    // Not covered (see the code comment): both real "immune to fear" instances turned out to be
    // optional hero skills, not automatic unit/warband traits, and are deliberately left unmatched.
    expect(traitsFromRules([{ name: 'Beastmen Skill: Fearless', text: 'Immune to fear and All Alone tests.' }])).toEqual([])
    expect(traitsFromRules([{ name: 'Warband Skill: Noblesse Obliges', text: 'The Warrior is immune to fear and can stomp opponents...' }])).toEqual([])
  })

  it('only tags Stupidity when the text actually describes the psychology rule, not the two unrelated rules that reuse the heading', () => {
    expect(traitsFromRules([{ name: 'Stupidity', text: 'A Troll is subject to the rules for stupidity.' }])).toEqual(['stupidity'])
    expect(traitsFromRules([{ name: 'Stupidity', text: 'A Rat Ogre is subject to Stupidity unless a Skaven Hero is within 6".' }])).toEqual(['stupidity'])
    // Cold One Beasthounds: a Leadership note mislabelled "Stupidity" in the source, no psychology content at all.
    expect(traitsFromRules([{ name: 'Stupidity', text: 'Cold One Beasthounds may use the basic Leadership of the Beastmaster if they are within 6" of him.' }])).toEqual([])
    // Orc/Goblin Mobs: "Mass Stupidity" is an advancement-reroll rule, not the psychology trait.
    expect(traitsFromRules([{ name: 'Mass Stupidity', text: "A Mob can never gain 'That Lad's Got Talent'. If TLGT is rolled, re-roll until a different advancement is gained." }])).toEqual([])
  })

  it('reaches real unit templates across the catalogue (#70)', () => {
    // Counts against the audit's own tally (60/36/17/2): causes_fear lands exactly on it once
    // warband-level rules are included (see combatantsOf's own comment on why that merge was tried
    // and reverted) — this test only exercises the per-unit half, so it checks the true, verified
    // count for that half, not the audit's number, which mixed unit- and warband-level sources.
    const units = WARBAND_TEMPLATES.flatMap((w) => [...w.heroTemplates, ...w.henchmanTemplates])
    const count = (id: string) => units.filter((u) => traitsFromRules(u.specialRules ?? []).includes(id)).length
    expect(count('causes_fear')).toBe(49)
    expect(count('immune_to_psychology')).toBe(29)
    expect(count('stupidity')).toBe(8)
    expect(count('immune_to_fear')).toBe(0)
  })
})

describe('combatantsOf', () => {
  it('lists fighting heroes, hired swords and one model per henchman group', () => {
    const roster = warband({ heroes: [hero('cap'), hero('dead', { status: 'dead' })], hiredSwords: [hiredSword('slayer')], henchmenGroups: [group('Watchmen'), group('gone', { size: 0 })] })
    const list = combatantsOf(roster, findWarbandTemplate('mercenaries_reikland'), roster.name, undefined)
    expect(list.map((c) => [c.kind, c.id])).toEqual([
      ['hero', 'cap'],
      ['hiredSword', 'slayer'],
      ['henchman', 'Watchmen'],
    ])
    const watchmen = list[2]
    expect(watchmen.equipment).toEqual([item('dagger', 1), item('shield', 1)])
    expect(watchmen.groupSize).toBe(3)
    expect(combatantLabel(watchmen)).toBe('Watchmen (one of 3)')
    expect(list[0].typeName).toBe('Mercenary Captain')
  })

  it('carries race traits, unit traits and injury flags; hired swords skip the race traits', () => {
    const dwarfs = findWarbandTemplate('dwarf_treasure_hunters')!
    const roster = warband({
      warbandTemplateId: dwarfs.id,
      heroes: [hero('noble', { unitTemplateId: dwarfs.heroTemplates[0].id, flags: { frenzy: true, hates: 'Elves' }, isLarge: true })],
      hiredSwords: [hiredSword('ogre')],
    })
    const [noble, ogre] = combatantsOf(roster, dwarfs, roster.name, undefined)
    expect(noble.traitIds).toEqual(expect.arrayContaining(['hard_to_kill', 'hard_head', 'frenzy', 'hatred', 'large_target']))
    expect(ogre.traitIds).not.toContain('hard_to_kill')
  })

  it('Stupidity, Hardened and Horrible Scars badge like any other injury/madness flag', () => {
    const roster = warband({ heroes: [hero('cap', { flags: { stupidity: true, immuneToFear: true, causesFear: true } })] })
    const [cap] = combatantsOf(roster, findWarbandTemplate('mercenaries_reikland'), roster.name, undefined)
    expect(cap.traitIds).toEqual(expect.arrayContaining(['stupidity', 'immune_to_fear', 'causes_fear']))
  })

  it('marks who is already out of action from the sheet', () => {
    const roster = warband({ heroes: [hero('cap')], henchmenGroups: [group('Watchmen', { size: 2 })] })
    let sheet = toggleHeroOut(emptyBattleLiveState(), 'cap')
    sheet = setGroupOut(sheet, 'Watchmen', 2, 2)
    const list = combatantsOf(roster, findWarbandTemplate('mercenaries_reikland'), roster.name, sheet)
    expect(list.map((c) => c.out)).toEqual([true, true])
    expect(combatantsOf(roster, undefined, roster.name, setGroupOut(emptyBattleLiveState(), 'Watchmen', 1, 2)).map((c) => c.out)).toEqual([false, false])
  })
})


it('uses the Tactician’s actual 4+ plate save for new and legacy kit, with its unconditional movement reminder', () => {
  for (const equipment of [
    [item('imperial_tactician_plate_armour')],
    [{itemId: null, customName: 'plate armour (4+ save, -1M)', quantity: 1}],
  ]) {
    const kit = loadoutOf(equipment)
    expect(kit.armour.type).toBe('gromril')
    expect(kit.ignored).toEqual([])
    expect(kit.assumptions.join(' ')).toContain('even without a shield')
  }
  expect(loadoutOf([{itemId: null, customName: 'unidentified magical plate', quantity: 1}]).armour.type).toBe('none')
})


describe('Merchant Guardian target links',()=>{
 it('links each bodyguard to its own Merchant rather than another hire',()=>{
  const band=warband({hiredSwords:[hiredSword('merchant',{hiredSwordId:'cathayan_merchant',flags:{hireGroupId:'contract'}}),hiredSword('other',{hiredSwordId:'arabian_merchant',flags:{hireGroupId:'other'}}),hiredSword('guard',{hiredSwordId:'cathayan_merchant',flags:{hireGroupId:'contract',hireCompanion:true,merchantGuardian:true}})]})
  const models=combatantsOf(band,undefined,band.name,undefined)
  expect(models.find(c=>c.id==='guard')?.protectsMerchantId).toBe('merchant')
  expect(models.find(c=>c.id==='merchant')?.protectsMerchantId).toBeUndefined()
 })
 it('does not invent a Merchant link for a legacy bodyguard without a contract',()=>{
  const band=warband({hiredSwords:[hiredSword('other'),hiredSword('guard',{flags:{hireCompanion:true,merchantGuardian:true}})]})
  expect(combatantsOf(band,undefined,band.name,undefined).find(c=>c.id==='guard')?.protectsMerchantId).toBeUndefined()
 })
})


it('reads Aenur’s fixed-hit rule from his actual entry and recognises legacy sword and Bo names',()=>{
 const band=warband({hiredSwords:[hiredSword('aenur',{hiredSwordId:'aenur_the_sword_of_twilight'})]})
 expect(combatantsOf(band,undefined,band.name,undefined)[0].traitIds).toContain('invincible_swordsman')
 const sword=loadoutOf([{itemId:null,customName:'enormous sword known as Ienh-Khain',quantity:1}])
 expect(sword.melee[0].id).toBe('ienh_khain')
 const bo=loadoutOf([{itemId:null,customName:'Bo (gives an additional attack, may parry and requires both hands)',quantity:1},{itemId:'dagger',quantity:1}])
 expect(offHandCandidates(bo.melee,bo.melee[0])).toEqual([])
})

it('retains the Ninja’s Stealthy reminder with its usable throwing weapon',()=>{
 const kit=loadoutOf([{itemId:'ninja_gnoblar_shurikens',quantity:1}])
 expect(kit.ranged[0].id).toBe('throwing_knife')
 expect(kit.assumptions.some(n=>n.includes('Stealthy'))).toBe(true)
 expect(kit.ignored).toEqual([])
})

it('recognises Veskit’s legacy claw assembly and its built-in pistols without duplicates',()=>{
 const legacy={itemId:null,customName:'Eshin Fighting Claws (the extra attack is included in his profile)',quantity:1}
 for(const equipment of [[legacy],[legacy,{itemId:'veskit_warplock_pistols',quantity:1}]]){
  const kit=loadoutOf(equipment)
  expect(kit.melee[0].id).toBe('veskit_eshin_claws')
  expect(kit.ranged.map(w=>w.id)).toEqual(['veskit_warplock_pistols'])
 }
 const band=warband({hiredSwords:[hiredSword('veskit',{hiredSwordId:'veskit_high_executioner_of_clan_eshin'})]})
 expect(combatantsOf(band,undefined,band.name,undefined)[0].traitIds).toEqual(expect.arrayContaining(['veskit_no_pain','veskit_metallic_body']))
})

it('derives Maximilian’s Religious Fervour without giving it to other hired warriors',()=>{
 const band=warband({hiredSwords:[hiredSword('max',{hiredSwordId:'maximilian_the_mad'}),hiredSword('ordinary',{hiredSwordId:'warlock'})]})
 const fighters=combatantsOf(band,undefined,band.name,undefined)
 expect(fighters[0].traitIds).toContain('frenzy')
 expect(fighters[1].traitIds).not.toContain('frenzy')
})

it('resolves exact legacy staff and hammer names without permanent magic bonuses',()=>{
 for(const name of ['Rune Staff','Hammer of Sigmar']){
  const kit=loadoutOf([{itemId:null,customName:name,quantity:1}])
  expect(kit.melee).toHaveLength(1)
  expect(kit.melee[0]).toMatchObject({strength:'user',concussion:true})
  expect(kit.melee[0].strengthBonus).toBeUndefined()
  expect(kit.melee[0].parry).toBeUndefined()
  expect(kit.melee[0].vsTraits).toBeUndefined()
 }
})

it('recognises old Nicodemus staff and Belandysh armour entries in combat',()=>{
 const staff=loadoutOf([{itemId:null,customName:"enormous Wizard's staff (see Special Rules)",quantity:1}])
 expect(staff.melee[0]).toMatchObject({id:'wizards_staff',concussion:true,parry:true})
 expect(isTwoHanded(staff.melee[0])).toBe(true)
 expect(staff.assumptions.some(note=>note.includes('Sword of Rezhebel'))).toBe(true)
 const armour=loadoutOf([{itemId:null,customName:'Chaos Armour that hardly hold his body together',quantity:1}])
 expect(armour).toEqual(loadoutOf([{itemId:'chaos_armour',quantity:1}]))
})


it.each([
  ['black_dwarfs', 'black_dwarfs_informers', 'black_dwarfs_chaos_dwarfs'],
  ['the_sons_of_hashut', 'sons_of_hashut_hobgoblins', 'sons_of_hashut_chaos_dwarf_warriors'],
])('respects %s henchmen race exclusions without stripping real Dwarf defences (#162)', (warbandTemplateId, excludedId, dwarfId) => {
  const template = findWarbandTemplate(warbandTemplateId)
  expect(template).toBeDefined()
  const combatants = combatantsOf(warband({ warbandTemplateId, henchmenGroups: [group('excluded', { unitTemplateId: excludedId }), group('dwarf', { unitTemplateId: dwarfId })] }), template, 'QA warband', undefined)
  expect(combatants.find(c => c.id === 'excluded')?.traitIds).not.toContain('hard_to_kill')
  expect(combatants.find(c => c.id === 'excluded')?.traitIds).not.toContain('hard_head')
  expect(combatants.find(c => c.id === 'dwarf')?.traitIds).toContain('hard_to_kill')
  expect(combatants.find(c => c.id === 'dwarf')?.traitIds).toContain('hard_head')
});


it.each([
  ['norse', 'norse_wulfen', 'hero', 4, 2],
  ['skaven', 'skaven_rat_ogre', 'group', 5, 3],
  ['skaven_pestilens', 'skaven_pestilens_rat_ogre', 'group', 5, 3],
] as const)('uses printed natural attacks for %s %s (#163)', (_warbandTemplateId, unitTemplateId, kind, strength, attacks) => {
  const template = WARBAND_TEMPLATES.find(t => [...t.heroTemplates, ...t.henchmanTemplates].some(u => u.id === unitTemplateId))
  expect(template).toBeDefined()
  const unit = [...template!.heroTemplates, ...template!.henchmanTemplates].find(u => u.id === unitTemplateId)!
  expect(unit).toBeDefined()
  const roster = warband({ warbandTemplateId: template!.id, heroes: kind === 'hero' ? [hero('beast', { unitTemplateId, stats: unit.stats!, equipment: [] })] : [], henchmenGroups: kind === 'group' ? [group('beast', { unitTemplateId, stats: unit.stats!, equipment: [], size: 1 })] : [] })
  const attacker = combatantsOf(roster, template, 'QA', undefined)[0]
  const defender = combatantsOf(warband({ heroes: [hero('human', { equipment: [] })] }), undefined, 'Opponent', undefined)[0]
  const attackerKit = loadoutFor(attacker), defenderKit = loadoutFor(defender), primary = defaultPrimary(attackerKit.melee)
  const houseRules = defaultCampaignHouseRules()
  const odds = computeOdds({ attacker, defender, attackerKit, defenderKit, primary, offHand: null, context: combatContextFor(houseRules), houseRules })
  expect(primary.strength).toBe('user')
  expect(attacker.stats.S).toBe(strength)
  expect(primary.strengthBonus ?? 0).toBe(0)
  expect(primary.saveModifier ?? 0).toBe(0)
  expect(odds.attacks).toBe(attacks)
  expect(defaultOffHand(attackerKit.melee, primary)).toBeNull()
  expect(defaultPrimary(defenderKit.melee).id).toBe('unarmed')
});


it('keeps explicitly living Tomb Scorpions and Strigos followers out of Undead rules (#164)', () => {
  for (const [warbandTemplateId, unitTemplateId] of [['tomb_guardians', 'tomb_guardians_tomb_scorpion'], ['survivors_of_strigos', 'ghouls'], ['survivors_of_strigos', 'giant_bats']]) {
    const template = findWarbandTemplate(warbandTemplateId)!
    expect(template).toBeDefined()
    const c = combatantsOf(warband({ warbandTemplateId, henchmenGroups: [group('living', { unitTemplateId })] }), template, 'QA', undefined)[0]
    expect(c.traitIds).not.toContain('undead')
    if (unitTemplateId === 'tomb_guardians_tomb_scorpion') {
      expect(c.traitIds).not.toContain('immune_to_psychology')
      expect(c.traitIds).not.toContain('causes_fear')
    }
  }
  const template = findWarbandTemplate('survivors_of_strigos')!
  const vampire = combatantsOf(warband({ warbandTemplateId: template.id, heroes: [hero('vampire', { unitTemplateId: 'strigoi_vampire' })] }), template, 'QA', undefined)[0]
  expect(vampire.traitIds).toContain('undead')
});
