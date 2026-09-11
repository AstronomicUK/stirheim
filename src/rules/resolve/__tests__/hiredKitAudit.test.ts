import {hiredSwordStartingSkills} from '../hiredSwordRules'
import { describe, expect, it } from 'vitest'
import { findHiredSword } from '../../data/campaign/hiredSwords'
import { findItem, SHOP_ITEMS } from '../../data/items'
import { resolveEquipmentName } from '../../data/items/aliases'
import { HIRED_EQUIPMENT_CHOICES } from '../hiredEquipmentChoices'
import { hiredSwordEquipment, hiredSwordStartingEquipment } from '../recruitment'

const kit = (id: string) => hiredSwordEquipment(findHiredSword(id)!.detail)

describe('hired equipment source regressions (#61 / #74)', () => {
  it('resolves material weapons and printed equipment equivalents', () => {
    expect(resolveEquipmentName('Gromril Hammer')?.id).toBe('gromril_hammer')
    expect(resolveEquipmentName('Ninja Robe (counts as Hardened Leathers)')?.id).toBe('toughened_leathers')
    expect(kit('dwarf_treasure_hunter')).toContainEqual(expect.objectContaining({itemId: 'double_handed_weapon'}))
  })
  it('includes a second equipment sentence and keeps rope and hook together', () => {
    expect(kit('halfling_thief')).toContainEqual(expect.objectContaining({itemId: 'rope_and_hook', quantity: 1}))
    expect(kit('knight_of_the_white_wolf')).toContainEqual(expect.objectContaining({itemId: 'heavy_armour'}))
  })
  it('retains both weapons in a brace and preserves parenthetical special rules', () => {
    expect(kit('highwayman')).toContainEqual(expect.objectContaining({itemId: 'pistol', quantity: 2}))
    const names = kit('ninja_gnoblar').map(item => item.customName)
    expect(names).toContain('Bo (gives an additional attack, may parry and requires both hands)')
    expect(names).not.toContain('requires both hands)')
  })
  it('does not create equipment from a prohibition or opening narrative', () => {
    expect(kit('bone_goliath')).toEqual([])
    expect(kit('chaos_fury')).toEqual([])
    expect(kit('the_headless_horseman').some(item => item.customName?.startsWith('Head or no head'))).toBe(false)
    expect(kit('gaoler').some(item => item.customName === 'no armour')).toBe(false)
  })
  for (const [id, choices] of Object.entries(HIRED_EQUIPMENT_CHOICES)) {
    it(`stores every printed ${id} choice as usable equipment`, () => {
      for (const choice of choices) {
        const equipment = hiredSwordStartingEquipment(id, findHiredSword(id)!.detail, undefined, choice.id)
        expect(equipment).toEqual(choice.equipment)
        for (const item of equipment) if (item.itemId) expect(findItem(item.itemId), item.itemId).toBeDefined()
      }
      expect(() => hiredSwordStartingEquipment(id, findHiredSword(id)!.detail, undefined, 'invalid')).toThrow('Choose one')
    })
  }
  it('keeps the Ogre’s armour with either weapon choice', () => {
    expect(HIRED_EQUIPMENT_CHOICES.ogre_bodyguard).toHaveLength(7)
    for (const choice of HIRED_EQUIPMENT_CHOICES.ogre_bodyguard) expect(choice.equipment).toContainEqual({itemId: 'light_armour', quantity: 1})
  })
})

it('resolves the remaining explicit ordinary Persona kit without turning wardrobe prose into items',()=>{
 const actual=(id:string)=>hiredSwordStartingEquipment(id,findHiredSword(id)!.detail)
 expect(actual('bertha_bestraufrung_high_matriarch_of_the_sisterhood')).toEqual([{itemId:'sigmarite_warhammer',quantity:2},{itemId:'gromril_armour',quantity:1},{itemId:'blessed_water',quantity:1},{itemId:'holy_unholy_relic',quantity:1}])
 expect(actual('countess_marianna_chevaux_vampire_assassin').map(i=>i.itemId)).toEqual(['rapier','dagger','throwing_knives_stars','crossbow_pistol'])
 expect(actual('dijin_katal_the_renegade_assassin')[0]).toMatchObject({itemId:'sword',quantity:2,notes:'Both swords are coated with Dark Venom.'})
 expect(actual('the_dark_jester_in_mordheim').map(i=>i.itemId)).toEqual(['club_mace_or_hammer','morning_star'])
 expect(actual('the_headless_horseman')).toContainEqual({itemId:'duelling_pistol',quantity:2})
 expect(resolveEquipmentName('Cavalry Spear')?.id).toBe('spear')
 for(const id of ['bertha_bestraufrung_high_matriarch_of_the_sisterhood','countess_marianna_chevaux_vampire_assassin','dijin_katal_the_renegade_assassin','the_dark_jester_in_mordheim'])for(const item of actual(id))if(item.itemId)expect(findItem(item.itemId),item.itemId).toBeDefined()
})


it('gives the Tactician usable plate without adding a purchasable or lamellar substitute', () => {
 const actual=hiredSwordStartingEquipment('imperial_tactician',findHiredSword('imperial_tactician')!.detail)
 expect(actual).toContainEqual({itemId:'imperial_tactician_plate_armour',quantity:1})
 expect(actual).toHaveLength(4)
 expect(SHOP_ITEMS.some(i=>i.id==='imperial_tactician_plate_armour')).toBe(false)
 expect(resolveEquipmentName('plate armour (4+ save, -1M)')?.armourSave).toBe(4)
})


it('recruits Albion protective items as usable unique equipment, outside the shop',()=>{
 const dark=hiredSwordStartingEquipment('dark_emissary',findHiredSword('dark_emissary')!.detail)
 expect(dark.map(i=>i.itemId)).toEqual(['dark_emissary_staff','dark_emissary_spiral'])
 expect(hiredSwordStartingEquipment('truthsayer',findHiredSword('truthsayer')!.detail)).toContainEqual({itemId:'truthsayer_triskele',quantity:1})
 for(const id of ['dark_emissary_staff','dark_emissary_spiral','truthsayer_triskele'])expect(SHOP_ITEMS.some(i=>i.id===id)).toBe(false)
})


it('supplies operational Aenur, Ninja and cloak equipment',()=>{
 expect(hiredSwordStartingEquipment('aenur_the_sword_of_twilight',findHiredSword('aenur_the_sword_of_twilight')!.detail).map(i=>i.itemId)).toContain('ienh_khain')
 expect(hiredSwordStartingEquipment('ninja_gnoblar',findHiredSword('ninja_gnoblar')!.detail).map(i=>i.itemId)).toEqual(['toughened_leathers','ninja_gnoblar_shurikens','ninja_gnoblar_bo'])
 expect(kit('thief').map(i=>i.itemId)).toContain('thief_cloak')
 expect(kit('kislev_ranger').map(i=>i.itemId)).toContain('kislev_ranger_cloak')
})

it('recruits Drenok and Abdul with catalogue kit and keeps Gwen’s unknown knives explicit',()=>{
 const kitFor=(id:string)=>hiredSwordStartingEquipment(id,findHiredSword(id)!.detail)
 expect(kitFor('drenok_johansen_wielder_of_the_great_axe').map(i=>i.itemId)).toEqual(['icefang_axe','sabertooth_tiger_hide'])
 expect(kitFor('abdul_alhazred_the_mad_sorcerer').map(i=>i.itemId)).toEqual(['nomad_robes','dagger','abdul_eye_pendant'])
 expect(kitFor('busty_gwen')).toContainEqual({itemId:'gwen_rolling_pin',quantity:1})
 expect(kitFor('busty_gwen')).toContainEqual({itemId:null,customName:'Knives',quantity:1})
})

it('keeps Veskit’s claw assembly and built-in pistols as unique equipment',()=>{
 const kit=hiredSwordStartingEquipment('veskit_high_executioner_of_clan_eshin',findHiredSword('veskit_high_executioner_of_clan_eshin')!.detail)
 expect(kit.map(i=>i.itemId)).toEqual(['veskit_eshin_claws','veskit_warplock_pistols'])
})

it('maps the hands-free lantern rig and the Hillman man-form cloak',()=>{
 expect(hiredSwordStartingEquipment('dwarf_treasure_hunter',findHiredSword('dwarf_treasure_hunter')!.detail)).toContainEqual({itemId:'lantern_rig',quantity:1})
 expect(hiredSwordStartingEquipment('cursed_hillman',findHiredSword('cursed_hillman')!.detail).map(i=>i.itemId)).toEqual(['axe','dagger','longbow','hillman_fur_cloak'])
 expect(SHOP_ITEMS.some(i=>['lantern_rig','hillman_fur_cloak'].includes(i.id))).toBe(false)
})

it('gives Maximilian his named holy weapon and Strongman at recruitment',()=>{
 const detail=findHiredSword('maximilian_the_mad')!.detail
 expect(hiredSwordStartingSkills('maximilian_the_mad')).toContain('strongman')
 expect(hiredSwordStartingEquipment('maximilian_the_mad',detail)).toEqual([{itemId:'maximilian_holy_weapon',quantity:1}])
})

it('keeps named priest and shaman weapons distinct from cast magic',()=>{
 const priest=hiredSwordStartingEquipment('warrior_priest_of_sigmar',findHiredSword('warrior_priest_of_sigmar')!.detail)
 expect(priest.map(i=>i.itemId)).toEqual(['priest_hammer_of_sigmar','light_armour','shield'])
 for(const weapon of ['sword','axe']) expect(hiredSwordStartingEquipment('norse_shaman',findHiredSword('norse_shaman')!.detail,undefined,weapon).map(i=>i.itemId)).toEqual(['norse_rune_staff',weapon])
})
