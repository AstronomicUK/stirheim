import {SHRINE_BLESSING,weaponChoiceKey} from '../../../rules/resolve/shrineBlessing'
// Phase 16: the loadout mapping reads the item rules overlay (traits, saves, consumables, upgrades).

import { describe, expect, it } from 'vitest'
import type { RosterItem } from '../../../rules/types/roster'
import { loadoutOf, upgradeBaseFromNote } from './combatants'
import { applyPreBattle, isTwoHandedUse, toDefender } from './odds'
import type { Combatant } from './combatants'

const item = (itemId: string, extra: Partial<RosterItem> = {}): RosterItem => ({ itemId, quantity: 1, ...extra })
const stats = { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }
const combatant = (equipment: RosterItem[]): Combatant => ({ id: 'c', kind: 'hero', name: 'C', typeName: 'Captain', warbandId: 'w', warbandName: 'W', stats, equipment, skillIds: [], traitIds: [], out: false, woundsLost: 0 })

describe('loadout from the item rules', () => {
  it('kit grants traits, skills and saves', () => {
    const kit = loadoutOf([item('bear_claw_necklace'), item('venom_ring'), item('lookout_gnoblar'), item('amulet_of_the_moon'), item('peg_leg'), item('lucky_charm')])
    expect(kit.traitIds).toEqual(['frenzy', 'immune_to_poison'])
    expect(kit.skillIds).toEqual(['dodge'])
    expect(kit.missileWardSaveThreshold).toBe(5)
    expect(kit.toBeHit.missile).toBe(-1)
    expect(kit.afterSaveThreshold).toBe(6)
    expect(kit.firstHitDiscard).toBe(4)
  })

  it('fog-enhancing shards need a censer and affect missile defence only, once', () => {
    for (const equipment of [[item('censer')], [item('fog_enhancing_warpstone_shards')], [item('censer'), item('fog_enhancing_warpstone_shards', { quantity: 0 })]]) {
      expect(loadoutOf(equipment).toBeHit).toEqual({ melee: 0, missile: 0 })
    }
    const kit = loadoutOf([item('censer'), item('fog_enhancing_warpstone_shards', { quantity: 2 })])
    expect(toDefender(combatant([]), kit).toBeHit).toEqual({ melee: 0, missile: -1 })
    expect(kit.assumptions.join(' ')).toContain('in the censer')
  })

  it('a Wolfcloak and a Sea Dragon Cloak reach the defender profile', () => {
    const kit = loadoutOf([item('wolfcloak'), item('sea_dragon_cloak'), item('light_armour')])
    const d = toDefender(combatant([]), kit)
    expect(d.saveBonus).toEqual({ melee: 0, missile: 1, savesFromNothing: true })
    expect(d.ownSave).toEqual({ melee: 5, missile: 4 })
    expect(d.armour.type).toBe('light')
  })

  it('Toughened Leathers drop the shield from the save', () => {
    const kit = loadoutOf([item('toughened_leathers'), item('shield')])
    expect(kit.armour.type).toBe('light')
    expect(kit.armour.shield).toBe(false)
    expect(kit.assumptions.some((a) => /cannot be combined with a shield/.test(a))).toBe(true)
  })

  it('a Cooking Pot Helmet is a stun save, not a helmet; a Mechanical Suit is Chaos armour', () => {
    const pot = loadoutOf([item('cooking_pot_helmet')])
    expect(pot.helmet).toBe(false)
    expect(pot.stunSave).toEqual({ threshold: 5, unmodifiable: true })
    expect(loadoutOf([item('mechanical_suit')]).armour.type).toBe('gromril')
  })

  it('a Swivel Gun offers its three shot types', () => {
    const kit = loadoutOf([item('swivel_gun')])
    expect(kit.ranged.map((w) => w.id)).toEqual(['swivel_gun_ball_shot', 'swivel_gun_chain_shot', 'swivel_gun_grape_shot'])
  })

  it('a Hook Hand counts as a dagger; a Sword-Gnoblar fights too', () => {
    const kit = loadoutOf([item('hook_hand'), item('sword_gnoblar')])
    expect(kit.melee.map((w) => w.id)).toEqual(['dagger', 'sword_gnoblar_attack'])
  })

  it('a Dark Elf Blade upgrades the sword or dagger named on it', () => {
    const noted = loadoutOf([item('dark_elf_blade', { notes: 'base: dagger' })])
    expect(noted.melee[0]).toMatchObject({ name: 'Dark Elf Dagger', concussion: true, critTableRollModifier: 1, saveModifier: -1 })
    const guessed = loadoutOf([item('dark_elf_blade')])
    expect(guessed.melee[0].name).toBe('Dark Elf Sword')
    expect(guessed.melee[0].parry).toBe(true)
    expect(guessed.assumptions.some((a) => /Sword assumed/.test(a))).toBe(true)
    expect(upgradeBaseFromNote('Darksteel on the axe', 'anyMelee')).toBe('axe')
    expect(upgradeBaseFromNote(undefined, ['sword', 'dagger'])).toBeNull()
  })

  it('consumables are listed for the fight tab and coat the weapons when marked', () => {
    const kit = loadoutOf([item('sword'), item('bow'), item('dark_venom'), item('hunting_arrows'), item('mandrake_root')])
    expect(kit.consumables.map((c) => c.itemId)).toEqual(['dark_venom', 'hunting_arrows', 'mandrake_root'])
    const dosed = applyPreBattle(combatant([]), kit, kit.consumables.map((c) => c.effect))
    expect(dosed.combatant.stats.T).toBe(4)
    expect(dosed.combatant.traitIds).toContain('no_pain')
    expect(dosed.kit.melee[0].strengthBonus).toBe(1)
    expect(dosed.kit.ranged[0].strength).toBe(4)
    expect(dosed.kit.ranged[0].special).toContain('injuryBonus:1')
  })

  it("Crimson Shade's +1 Strength reaches the warrior himself, so every weapon he swings (#140, 02:1981)", () => {
    const kit = loadoutOf([item('sword'), item('bow'), item('crimson_shade')])
    const dosed = applyPreBattle(combatant([]), kit, kit.consumables.map((c) => c.effect))
    expect(dosed.combatant.stats.S).toBe(4)
    expect(dosed.combatant.stats.T).toBe(3)
    // The bow's own Strength is the weapon's, not the shooter's — unchanged.
    expect(dosed.kit.ranged[0].strength).toBe(3)
  })

  it('drugs do nothing for the Undead or the Possessed, though the dose is still spent (02:1981, 02:2009, 02:2017)', () => {
    const kit = loadoutOf([item('sword'), item('mandrake_root'), item('crimson_shade'), item('mad_cap_mushrooms')])
    for (const group of ['undead', 'possessed']) {
      const dosed = applyPreBattle({ ...combatant([]), traitIds: [group] }, kit, kit.consumables.map((c) => c.effect))
      expect(dosed.combatant.stats).toEqual(stats)
      expect(dosed.combatant.traitIds).toEqual([group])
    }
    const human = applyPreBattle(combatant([]), kit, kit.consumables.map((c) => c.effect))
    expect(human.combatant.stats.T).toBe(4)
    expect(human.combatant.stats.S).toBe(4)
    expect(human.combatant.traitIds).toEqual(expect.arrayContaining(['frenzy', 'no_pain']))
  })

  it('poison never coats a blackpowder weapon (02:1966), but does coat everything else', () => {
    const kit = loadoutOf([item('sword'), item('bow'), item('pistol'), item('dark_venom'), item('black_lotus')])
    const dosed = applyPreBattle(combatant([]), kit, kit.consumables.map((c) => c.effect))
    const sword = dosed.kit.melee.find((w) => w.id === 'sword')!
    const bow = dosed.kit.ranged.find((w) => w.id === 'bow')!
    const pistol = dosed.kit.ranged.find((w) => w.id === 'pistol')!
    expect(sword.strengthBonus).toBe(1)
    expect(sword.autoWoundOnNaturalSixToHit).toBe(true)
    expect(bow.strength).toBe(4)
    expect(bow.poisoned).toBe(true)
    expect(pistol.strength).toBe(kit.ranged.find((w) => w.id === 'pistol')!.strength)
    expect(pistol.poisoned).toBeUndefined()
    expect(pistol.special).not.toContain('preBattleEffect')
  })

  it('two-handed use means no off-hand weapon, shield or buckler', () => {
    expect(isTwoHandedUse(loadoutOf([item('ogre_club')]), null)).toBe(true)
    expect(isTwoHandedUse(loadoutOf([item('ogre_club'), item('shield')]), null)).toBe(false)
  })
})

describe('battle boosts from the map', () => {
  it('raises the leader alone and marks everyone immune to Fear', async () => {
    const { combatantsOf, NO_BOOSTS } = await import('./combatants')
    const { findWarbandTemplate } = await import('../../../rules/data/warbandTemplates')
    const template = findWarbandTemplate('mercenaries_reikland')!
    const stats = { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 }
    const hero = (id: string, unitTemplateId: string) => ({ id, name: id, unitTemplateId, stats, xp: 0, levelUps: 0, skillTableIds: [], skillIds: [], spellIds: [], injuries: [], flags: {}, equipment: [], status: 'active' as const })
    const roster = { id: 'w', name: 'Watch', warbandTemplateId: 'mercenaries_reikland', gold: 0, wyrdstone: 0, veteranPool: null, heroes: [hero('cap', 'mercenaries_reikland_captain'), hero('champ', 'mercenaries_reikland_champions')], henchmenGroups: [], hiredSwords: [], stash: [] }
    const plain = combatantsOf(roster, template, 'Watch', undefined, NO_BOOSTS)
    expect(plain.find((c) => c.id === 'cap')?.stats.Ld).toBe(8)
    const boosted = combatantsOf(roster, template, 'Watch', undefined, { leaderLd: 1, leaderLdSources: ['Statue of Count Gotthard'], fearImmunity: 'The Cemetery' })
    expect(boosted.find((c) => c.id === 'cap')?.stats.Ld).toBe(9)
    expect(boosted.find((c) => c.id === 'champ')?.stats.Ld).toBe(8)
    expect(boosted.every((c) => c.traitIds.includes('immune_to_fear'))).toBe(true)
  })
})


it('keeps ordinary and Shrine-blessed copies distinct without changing skill-compatible weapon IDs',()=>{
 const kit=loadoutOf([item('sword'),item('sword',{notes:SHRINE_BLESSING})])
 expect(kit.melee.map(w=>w.id)).toEqual(['sword','sword'])
 expect(kit.melee.map(weaponChoiceKey)).toEqual(['sword','sword:shrine'])
 expect(kit.melee[0].shrineBlessed).toBeUndefined();expect(kit.melee[1].shrineBlessed).toBe(true)
})
