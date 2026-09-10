import {describe,expect,it} from 'vitest'
import type {RosterHero} from '../../../rules/types/roster'
import {BALEWOLF_PROFILE,balewolfCurseRoll,curableFlags,curseEligibility,cureLycanthropeInjuries,lycanthropeReturn,transformationEquipment,cursedGroupAftermath} from './lycanthrope'
const hero:RosterHero={id:'patient',name:'Patient',unitTemplateId:'mercenaries_reikland_champions',stats:{M:3,WS:4,BS:3,S:3,T:3,W:1,I:4,A:1,Ld:8},xp:12,levelUps:1,skillTableIds:[],skillIds:['dodge'],spellIds:[],injuries:[{injuryCode:'leg_wound',name:'Leg Wound',rolled:{d66:22},effect:'-1 M'},{injuryCode:'madness',name:'Madness',rolled:{d66:24,subRoll:2},effect:'Stupidity'}],flags:{stupidity:true,causesFear:true,nurglesRot:true,pitFightOwed:true},equipment:[{itemId:'dagger',quantity:1}],status:'active'}
describe('Balewolf curse aftermath',()=>{
 it('requires actual survival and explicit man-sized/non-mutant eligibility',()=>{
  expect(curseEligibility({survived:false,manSized:undefined,nonMutant:undefined})).toEqual({eligible:false,problem:null})
  expect(curseEligibility({survived:true,manSized:undefined,nonMutant:true}).problem).toContain('Confirm')
  expect(curseEligibility({survived:true,manSized:false,nonMutant:true}).eligible).toBe(false)
  expect(curseEligibility({survived:true,manSized:true,nonMutant:false}).eligible).toBe(false)
  expect(curseEligibility({survived:true,manSized:true,nonMutant:true}).eligible).toBe(true)
 })
 it('applies a reviewed healthy profile without guessing stat increases or removing unrelated traits',()=>{
  const result=cureLycanthropeInjuries(hero,{stats:{...hero.stats,M:4},clearFlags:['stupidity'],confirmed:true,reason:'Original Movement 4 confirmed from the warband record; stupidity came from Madness.'},'battle')
  expect(result.stats.M).toBe(4);expect(result.injuries).toEqual([]);expect(result.flags.stupidity).toBeUndefined()
  expect(result.flags).toMatchObject({lycanthrope:{contractedAfter:'battle'},causesFear:true,nurglesRot:true,pitFightOwed:true})
  expect(result.equipment).toEqual(hero.equipment);expect(result.xp).toBe(12);expect(result.skillIds).toEqual(['dodge'])
  expect(hero.stats.M).toBe(3);expect(hero.injuries).toHaveLength(2)
 })
 it('does not heal the dead or erase unrelated flags without an injury record',()=>{
  const review={stats:hero.stats,clearFlags:[] as const,confirmed:true,reason:'Reviewed'}
  expect(curableFlags(hero)).toEqual(['stupidity'])
  expect(()=>cureLycanthropeInjuries(hero,{...review,clearFlags:['causesFear']},'battle')).toThrow('injury-derived')
  expect(()=>cureLycanthropeInjuries({...hero,status:'dead'},{...review,clearFlags:[]},'battle')).toThrow('surviving')
  expect(()=>cureLycanthropeInjuries(hero,{...review,clearFlags:[],confirmed:false},'battle')).toThrow('Review')
 })
 it('requires a return die only after an actual transformation and leaves on exactly 1',()=>{
  expect(lycanthropeReturn(undefined,null).problem).not.toBeNull()
  expect(lycanthropeReturn(false,null)).toMatchObject({leaves:false,problem:null})
  expect(lycanthropeReturn(true,null).problem).not.toBeNull()
  expect(lycanthropeReturn(true,1)).toMatchObject({leaves:true,problem:null})
  for(const die of [2,3,4,5,6])expect(lycanthropeReturn(true,die)).toMatchObject({leaves:false,problem:null})
  expect(BALEWOLF_PROFILE).toMatchObject({M:5,S:5,T:5,W:3,A:2})
 })
 it('destroys worn equipment and retains only actual recovered weapon copies',()=>{
  const items=[{id:'mail',name:'Armour',quantity:1,kind:'armour' as const},{id:'sword',name:'Sword',quantity:1,kind:'weapon' as const},{id:'bow',name:'Bow',quantity:1,kind:'weapon' as const}]
  const result=transformationEquipment(items,[{itemId:'mail',fate:'destroyed'},{itemId:'sword',fate:'weapon-recovered'},{itemId:'bow',fate:'weapon-lost'}])
  expect(result.problems).toEqual([]);expect(result.losses).toEqual([{itemId:'mail',quantity:1},{itemId:'bow',quantity:1}]);expect(result.notes.join(' ')).toContain('no extra copy')
  expect(transformationEquipment(items,[]).problems).toHaveLength(3)
  expect(transformationEquipment(items,[{itemId:'mail',fate:'weapon-recovered'}]).problems[0]).toContain('not a recoverable weapon')
 })
 it('requires an explicit explanation to retain gear said not to have been worn',()=>{
  const items=[{id:'charm',name:'Charm',quantity:1,kind:'other' as const}]
  expect(transformationEquipment(items,[{itemId:'charm',fate:'not-worn'}]).problems).toHaveLength(1)
  expect(transformationEquipment(items,[{itemId:'charm',fate:'not-worn',reason:'Packed in the travelling bag, not worn.'}]).problems).toEqual([])
 })
})

it('keeps curses on named henchmen without affecting the rest of their XP group',()=>{
 const old=[{id:'one',name:'Otto',contractedAfter:'previous'},{id:'two',name:'Karl',contractedAfter:'previous'}]
 const result=cursedGroupAftermath(old,5,1,{deadIds:['one'],transformations:{two:{transformed:true,die:1}},newCurses:[{id:'three',name:'Hans',contractedAfter:'current'}]})
 expect(result.problems).toEqual([]);expect(result.size).toBe(3);expect(result.feralLosses).toBe(1)
 expect(result.members.map(m=>m.name)).toEqual(['Hans'])
 expect(cursedGroupAftermath(old,2,2,{deadIds:[],transformations:{one:{transformed:false},two:{transformed:false}},newCurses:[]}).problems[0]).toContain('more cursed members')
})

it('contracts the curse on exactly 6 after eligibility, with no roll for ineligible casualties',()=>{
 expect(balewolfCurseRoll(false,null)).toEqual({cursed:false,problem:null})
 expect(balewolfCurseRoll(true,null).problem).not.toBeNull()
 for(const die of [1,2,3,4,5])expect(balewolfCurseRoll(true,die)).toEqual({cursed:false,problem:null})
 expect(balewolfCurseRoll(true,6)).toEqual({cursed:true,problem:null})
})
