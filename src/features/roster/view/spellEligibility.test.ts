import {expect,it} from 'vitest'
import {editorSpellLores} from './spellEligibility'
import type {HeroDraft} from './diff'
import {findWarbandTemplate} from '../../../rules/data/warbandTemplates'
import {findLore} from '../../../rules/data/campaign/magic'
const hero=(unit:string,over:Partial<HeroDraft>={}):Parameters<typeof editorSpellLores>[0]=>({flags:{},spells:[],is_hired_sword:false,hired_sword_rules_id:null,unit_type_rules_id:unit,...over})
it('native spell-less core casters receive only their own lore, and an unrelated saved spell cannot replace it',()=>{
  const cases=[['the_undead','undead_necromancer','necromancy'],['skaven_of_clan_eshin','skaven_eshin_sorcerer','magic_of_the_horned_rat'],['sisters_of_sigmar','sisters_of_sigmar_matriarch','prayers_of_sigmar'],['protectorate_of_sigmar','warrior_priest','prayers_of_sigmar']]
  for(const [band,unit,lore] of cases){
    const template=findWarbandTemplate(band)!
    expect(template,band).toBeDefined()
    expect(editorSpellLores(hero(unit),template)).toEqual([lore])
    expect(editorSpellLores(hero(unit,{spells:[findLore('lesser_magic')!.spells[0].id]}),template)).toEqual([lore])
  }
})
it('respects the saved elemental lore even if an earlier spell is from a book',()=>{
  const template=findWarbandTemplate('sorcerous_society')!
  const mage=hero('magus',{flags:{magicLoreId:'elemental_lore_of_fire'},spells:[findLore('lesser_magic')!.spells[0].id]})
  expect(editorSpellLores(mage,template)).toEqual(['elemental_lore_of_fire'])
  expect(editorSpellLores({...mage,flags:{...mage.flags,readTomeOfMagic:true}},template)).toEqual(['elemental_lore_of_fire','lesser_magic'])
  expect(editorSpellLores(hero('magus'),template)).toEqual(expect.arrayContaining(['elemental_lore_of_fire','elemental_lore_of_water','elemental_lore_of_air','elemental_lore_of_earth','lesser_magic']))
})
it('respects a Seer’s Mark, including the explicitly non-casting Arkhar choice',()=>{
  const template=findWarbandTemplate('marauders_of_chaos')!
  expect(editorSpellLores(hero('marauders_seer',{flags:{chaosMark:'eagle'}}),template)).toEqual(['tchar_rituals'])
  expect(editorSpellLores(hero('marauders_seer',{flags:{chaosMark:'arkhar'},spells:[findLore('chaos_rituals')!.spells[0].id]}),template)).toEqual([])
})
it('does not open every lore for an ordinary warrior or a non-casting Chronicler',()=>{
  expect(editorSpellLores(hero('mercenaries_reikland_captain'),findWarbandTemplate('mercenaries_reikland'))).toEqual([])
  expect(editorSpellLores(hero('cursed_cavalcade_twisted_scholar',{flags:{chronicler:true}}),findWarbandTemplate('the_cursed_cavalcade'))).toEqual([])
})
it('resolves spell-less hired swords and named casters, including multi-lore access',()=>{
  const hire=(id:string)=>hero('',{is_hired_sword:true,hired_sword_rules_id:id})
  expect(editorSpellLores(hire('warlock'))).toEqual(['lesser_magic'])
  expect(editorSpellLores(hire('elf_mage'))).toEqual(['spells_of_the_djedhi'])
  expect(editorSpellLores(hire('dark_mage'))).toEqual(['dark_mage_magic','lesser_magic'])
  expect(editorSpellLores(hire('abdul_alhazred_the_mad_sorcerer'))).toEqual(['arabian_elemental_magic','necromancy'])
  expect(editorSpellLores(hire('crow_master_the'))).toEqual(['necromancy','crow_master_magic'])
})
it('retains known-lore access for legacy imported casters and recorded grimoire access',()=>{
  expect(editorSpellLores(hero('legacy',{spells:[findLore('lesser_magic')!.spells[0].id]}))).toEqual(['lesser_magic'])
  expect(editorSpellLores(hero('legacy',{flags:{readBookOfTheDead:true}}))).toEqual(['necromancy'])
  expect(editorSpellLores(hero('legacy',{flags:{readLiberBubonicus:true}}))).toEqual(['magic_of_the_horned_rat'])
})
