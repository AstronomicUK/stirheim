import { describe,it,expect } from 'vitest'
import { findWarbandTemplate } from '../../data/warbandTemplates'
import { newWarbandDraft,draftToRosterWarband,draftToCreatePayload,addDraftHero,validateDraft } from '../builder'
import { certificationAttemptBlock,certifyDreamer,dreamerRecruitmentBlock } from '../dreamerCertification'
import type { DreamerCertification } from '../../types/roster'
const template=findWarbandTemplate('dreamwalkers_cult_of_morr')!
const draft=()=>newWarbandDraft(template,'Dreamers')
const result=(die:number,afterMatch:string|null=null):DreamerCertification=>({die,afterMatch,recordedAt:afterMatch?'2026-09-12T12:00:00Z':'2026-09-11T12:00:00Z',history:['App rolled 2',`Player entered ${die}`]})
describe('Dreamer certification',()=>{
 it('requires initial certification and rejects an uncertified Dreamer in a saved draft',()=>{
   expect(validateDraft(draft(),template).some(p=>p.code==='dreamer.certification')).toBe(true)
   const failed={...addDraftHero(draft(),template,'dreamwalkers_dreamer','dreamer'),dreamerCertification:result(2)}
   expect(validateDraft(failed,template).some(p=>p.code==='dreamer.uncertified')).toBe(true)
   expect(validateDraft({...failed,dreamerCertification:result(4)},template).some(p=>p.code.startsWith('dreamer.'))).toBe(false)
 })
 it('carries failure atomically in the creation payload and blocks immediate or same-game retries',()=>{
   const d={...draft(),dreamerCertification:result(2)}
   expect(draftToCreatePayload(d,template).heroes[0].flags?.dreamerCertification).toEqual(result(2))
   const w=draftToRosterWarband(d,template)
   expect(dreamerRecruitmentBlock(w)).toContain('4+')
   expect(()=>certifyDreamer(w,result(5))).toThrow(/next battle/)
   const failed=certifyDreamer(w,result(1,'battle-1')).value
   expect(certificationAttemptBlock(failed,'battle-1')).toContain('next battle')
   const passed=certifyDreamer(failed,{...result(6,'battle-2'),recordedAt:'2026-09-13T12:00:00Z'}).value
   expect(dreamerRecruitmentBlock(passed)).toBeUndefined()
   expect(certificationAttemptBlock(passed,'battle-3')).toContain('already certified')
 })
 it('does not invalidate an existing Dreamer or allow another after death',()=>{
   const w=draftToRosterWarband(addDraftHero(draft(),template,'dreamwalkers_dreamer','dreamer'),template)
   expect(certificationAttemptBlock(w,null)).toContain('already found')
   expect(dreamerRecruitmentBlock({...w,heroes:w.heroes.map(h=>h.id==='dreamer'?{...h,status:'dead'}:h)})).toContain('never hire another')
 })
})
