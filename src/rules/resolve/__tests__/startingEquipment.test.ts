import { describe,it,expect } from 'vitest'
import { findWarbandTemplate } from '../../data/warbandTemplates'
import { findItem } from '../../data/items'
import { newWarbandDraft,addDraftHero,addDraftGroup,draftToCreatePayload,draftToRosterWarband,addDraftEquipment,equipmentOptionsFor,draftCosts } from '../builder'
import { startingEquipment } from '../startingEquipment'
import { recruitHero,recruitHenchmen } from '../recruitment'
import { armourBlockingCasting } from '../casting'
import { applyHeroInjury } from '../injuries'
import { makeHero } from './fixtures'
import { sellItem,moveItem } from '../trading'

describe('printed starting equipment',()=>{
 it('assigns all Reaver kits with real catalogue IDs and charges for additional copies',()=>{
  const t=findWarbandTemplate('lustrian_reavers')!
  for(const unit of t.heroTemplates) {
   const kit=startingEquipment(t,unit);expect(kit.length).toBeGreaterThan(0)
   for(const item of kit)expect(findItem(item.itemId!),item.itemId!).toBeDefined()
   const draft=addDraftHero(newWarbandDraft(t,'Reavers'),t,unit.id,'r')
   expect(draftToCreatePayload(draft,t).heroes[0].equipment.map(i=>[i.item_rules_id,i.quantity])).toEqual(kit.map(i=>[i.itemId,i.quantity]))
  }
  let d=addDraftHero(newWarbandDraft(t,'Reavers'),t,'lustrian_reavers_saurus_slayer','s')
  const sword=equipmentOptionsFor(t,'lustrian_reavers_saurus_slayer').find(o=>o.item?.id==='sword')!
  expect(draftCosts(d,t).equipment).toBe(0)
  d=addDraftEquipment(d,{kind:'hero',id:'s'},sword)
  expect(draftCosts(d,t).equipment).toBe(sword.cost.amount)
  expect(draftToCreatePayload(d,t).heroes[0].equipment.find(i=>i.item_rules_id==='sword')?.quantity).toBe(3)
 })
 it('grants Outrider mounts once per new model, including reinforcements',()=>{
  const t=findWarbandTemplate('imperial_outriders')!;let d=newWarbandDraft(t,'Mounted');d=addDraftGroup(d,t,'imperial_outriders_hussar','h',2)
  const roster={...draftToRosterWarband(d,t),gold:500}
  expect(roster.heroes[0].equipment).toContainEqual({itemId:'riding_draft_horse',quantity:1})
  expect(roster.henchmenGroups[0].equipment).toContainEqual({itemId:'riding_draft_horse',quantity:2})
  const next=recruitHenchmen(roster,t,'imperial_outriders_hussar','Hussars',1,'n',{intoGroupId:'h'}).value.warband
  expect(next.henchmenGroups[0].equipment).toContainEqual({itemId:'riding_draft_horse',quantity:3})
  expect(next.gold).toBe(440)
 })
 it('keeps the Dame armour through robbery and prevents selling, moving or blocking casting',()=>{
  const t=findWarbandTemplate('order_of_the_mare')!;const unit=t.heroTemplates.find(u=>u.id==='dame_of_the_mare')!
  const h=makeHero({unitTemplateId:unit.id,equipment:startingEquipment(t,unit)})
  expect(armourBlockingCasting(h)).toEqual([])
  expect(applyHeroInjury(h,36).value.hero.equipment).toContainEqual({itemId:'ancient_armour',quantity:1})
  const w={...draftToRosterWarband(newWarbandDraft(t,'Mare'),t),heroes:[h]}
  expect(()=>sellItem(w,{kind:'hero',id:h.id},'ancient_armour',1,0)).toThrow()
  expect(()=>moveItem(w,{kind:'hero',id:h.id},{kind:'stash'},'ancient_armour')).toThrow()
 })
 it('offers the optional paid Ostermark dog without adding it by default',()=>{
  const t=findWarbandTemplate('mercenaries_ostermark')!;const w={...draftToRosterWarband(newWarbandDraft(t,'Dogs'),t),heroes:[],gold:200}
  const id='mercenaries_ostermark_captain'
  expect(equipmentOptionsFor(t,id).find(o=>o.item?.id==='wardogs')?.cost.amount).toBe(25)
  expect(recruitHero(w,t,id,'Captain','c').value.heroes[0].equipment.some(i=>i.itemId==='wardogs')).toBe(false)
  const paid=recruitHero(w,t,id,'Captain','c',{startingWardog:true}).value
  expect(paid.gold).toBe(200-t.heroTemplates[0].cost!-25);expect(paid.heroes[0].equipment).toContainEqual({itemId:'wardogs',quantity:1})
 })
})
