import { describe, expect, it } from 'vitest'
import { findWarbandTemplate } from '../../data/warbandTemplates'
import { addDraftHero, addDraftGroup, newWarbandDraft, draftToRosterWarband, draftToCreatePayload, draftCosts, validateDraft } from '../builder'
import { recruitHero, recruitHenchmen } from '../recruitment'
import { advancementGiftOptions, MARAUDER_MUTANT, TWISTKIN, recruitGiftProblem, recruitPurchaseOptions } from '../recruitPurchases'
import { availableSkills } from '../advances'
import { emptyDraft, planHero, setDice, setSkill } from '../../../features/advances/model'

const fresh = (id: string) => { const template=findWarbandTemplate(id)!; const draft=newWarbandDraft(template,'Gift QA'); return {template,draft,roster:{...draftToRosterWarband(draft,template),gold:1000}} }
describe('recruitment gifts from creation to saved roster',()=>{
 it('requires the Mutant gift and prices repeated copies, preserving the same profile in both payloads',()=>{
  const {template,draft,roster}=fresh('cult_of_the_possessed');const id='cult_of_the_possessed_mutants'
  let d=addDraftHero(draft,template,id,'mutant')
  expect(validateDraft(d,template).some(p=>p.code==='builder.recruitGifts')).toBe(true)
  expect(()=>recruitHero(roster,template,id,'Mutant','m')).toThrow(/mandatory/)
  d={...d,heroes:d.heroes.map(h=>h.id==='mutant'?{...h,recruitGiftIds:['cloven_hoofs','cloven_hoofs']}:h)}
  const next=draftToRosterWarband(d,template).heroes.find(h=>h.id==='mutant')!
  const payload=draftToCreatePayload(d,template).heroes.find(h=>h.name==='Mutants')!
  expect(next.stats.M).toBe(6);expect(payload.stats.M).toBe(6)
  expect(next.equipment).toContainEqual({itemId:'cloven_hoofs',quantity:2})
  const recruited=recruitHero(roster,template,id,'Mutant','m',{recruitGiftIds:['cloven_hoofs','cloven_hoofs']}).value
  expect(roster.gold-recruited.gold).toBe(25+120)
  expect(recruited.heroes.at(-1)!.stats.M).toBe(6)
  expect(draftCosts(d,template).equipment).toBe(120)
 })
 it('applies Bloated Foulness and Mark of Nurgle once at recruitment',()=>{
  const {template,roster}=fresh('carnival_of_chaos')
  const next=recruitHero(roster,template,'carnival_of_chaos_tainted_ones','Tainted','tainted',{recruitGiftIds:['bloated_foulness','mark_of_nurgle']}).value
  expect(next.heroes.at(-1)!.stats).toMatchObject({M:3,T:4,W:3})
  expect(next.gold).toBe(1000-25-40-70)
 })
 it('requires one mutation for each separately recruited Moulder Rat Ogre',()=>{
  const {template,draft,roster}=fresh('skaven_of_clan_moulder')
  expect(()=>recruitHenchmen(roster,template,'rat_ogres','Ogre',1,'o')).toThrow(/mandatory/)
  expect(()=>recruitHenchmen(roster,template,'rat_ogres','Ogres',2,'o',{recruitGiftIds:['cloven_hoofs']})).toThrow(/individually/)
  const next=recruitHenchmen(roster,template,'rat_ogres','Ogre',1,'o',{recruitGiftIds:['cloven_hoofs']}).value.warband
  expect(next.henchmenGroups[0].stats.M).toBe(7);expect(next.gold).toBe(760)
  let d=addDraftGroup(draft,template,'rat_ogres','o',1);d={...d,groups:d.groups.map(g=>({...g,recruitGiftIds:['cloven_hoofs']}))}
  expect(draftToCreatePayload(d,template).henchman_groups[0].stats.M).toBe(7)
 })
 it('limits Court Heroes to one gift and does not offer the Marauder skill at recruitment',()=>{
  expect(recruitGiftProblem('court_of_the_profane_pleasures','court_of_pleasures_danseuse',['extra_arm','tentacle'])).toMatch(/1 mutation/)
  expect(recruitPurchaseOptions('marauders_of_chaos','marauders_chieftain')).toEqual([])
 })
 it('buys the Twistkin mutation in the same advance and keeps Marauder Mutant repeatable',()=>{
  const {template,roster}=fresh('skaven_of_clan_moulder')
  const unit=template.heroTemplates.find(u=>u.id==='stormvermin')!
  const h={...roster.heroes[0],id:'s',unitTemplateId:unit.id,stats:unit.stats,skillTableIds:unit.skillTableIds,xp:10,levelUps:2}
  let d=setSkill(setDice(emptyDraft('new'),5,5),TWISTKIN)
  const ctx={template,roster:{...roster,heroes:[h]}}
  expect(planHero(d,{kind:'hero',hero:h},ctx).result).toBeNull()
  d={...d,giftId:'cloven_hoofs'};const result=planHero(d,{kind:'hero',hero:h},ctx).result!
  expect(result.next.gold).toBe(980);expect(result.next.heroes[0].stats.M).toBe(unit.stats.M+1)
  expect(result.resolution.text).toContain('20 gc')
  const marauder={...h,unitTemplateId:'marauders_chieftain',skillIds:[MARAUDER_MUTANT],flags:{chaosMark:'crow'},skillTableIds:['warband-unique' as const]}
  expect(availableSkills(marauder,'marauders_of_chaos').flatMap(t=>t.skills).some(s=>s.id===MARAUDER_MUTANT)).toBe(true)
  expect(advancementGiftOptions(MARAUDER_MUTANT,marauder).some(o=>o.item.id==='bloated_foulness')).toBe(true)
  expect(advancementGiftOptions(MARAUDER_MUTANT,marauder).some(o=>o.item.id==='mark_of_nurgle')).toBe(false)
 })
})
