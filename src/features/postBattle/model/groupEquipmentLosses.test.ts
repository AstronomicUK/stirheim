import { describe, expect, it } from 'vitest'
import { makeHero, makeHenchmanGroup, makeWarband } from '../../../rules/resolve/__tests__/fixtures'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import type { ItemRow } from '../../../domain'
import { deriveReport, type ReportContext } from './derive'
import { emptyDraft, setGroupInjuryRoll } from './state'
function context(size=3, quantity=3):ReportContext {
 const heroes=['a','b','c'].map(id=>makeHero({id,xp:20,levelUps:8}))
 return {roster:makeWarband({heroes,henchmenGroups:[makeHenchmanGroup({id:'g',size})]}),template:findWarbandTemplate('mercenaries_reikland'),items:[{id:'swords',holder_type:'group',holder_id:'g',item_rules_id:'sword',quantity,custom_name:null}] as ItemRow[],matchId:'match',myRating:100,opponentRating:100}
}
function draft(dead=1){const d=emptyDraft();d.result='lost';d.groupsOut.g=dead;d.groupInjuries.g=Array(dead).fill(1);d.exploration.rolls=[1,2,3];return d}
describe('Henchman casualty equipment and replacement recruits',()=>{
 it('loses one full per-model kit, including multiple copies, and logs surviving quantities',()=>{
  const r=deriveReport(draft(),context(3,6));expect(r.equipmentLosses.patches).toEqual([{id:'swords',quantity:4}]);expect(r.report?.notes).toContain('2 Sword lost, 4 retained')
 })
 it('removes all equipment when the final model dies without making a stash reward',()=>{
  const r=deriveReport(draft(3),context(3,6));expect(r.report?.applied.item_patches).toContainEqual({id:'swords',quantity:0});expect(r.report?.applied.stash_items).toEqual([])
 })
 it('asks for an explicit allocation of uneven stacks and rejects excessive losses',()=>{
  const ctx=context(3,4),d=draft();const r=deriveReport(d,ctx);expect(r.problems.injuries.join()).toContain('record how many');const key=r.equipmentLosses.rows[0].key
  d.groupEquipmentLosses={[key]:2};expect(deriveReport(d,ctx).report?.applied.item_patches).toContainEqual({id:'swords',quantity:2})
  d.groupEquipmentLosses[key]=5;expect(deriveReport(d,ctx).report).toBeNull()
  expect(setGroupInjuryRoll(d,'g',0,6).groupEquipmentLosses).toEqual({})
 })
 it('matches a free prisoner to the surviving group’s kit rather than dividing the old stack by its new size',()=>{
  const d=draft();d.exploration.rolls=[3,3,3];d.exploration.gold=2;d.exploration.recruitChoice='g';const r=deriveReport(d,context())
  expect(r.problems.exploration).toEqual([]);expect(r.recruits.goldCost).toBe(10);expect(r.report?.applied.groups.find(g=>g.id==='g')?.patch.size).toBe(3);expect(r.report?.applied.item_patches).toContainEqual({id:'swords',quantity:3})
 })
 it('does not remove survivor kit when nobody died',()=>{
  const d=draft();d.groupInjuries.g=[6];expect(deriveReport(d,context()).equipmentLosses.patches).toEqual([])
 })
 it('does not assume used consumables belonged to survivors or casualties',()=>{
  const ctx=context();ctx.items=[{...ctx.items[0],item_rules_id:'black_lotus'}];ctx.itemsUsed={g:['black_lotus']}
  const r=deriveReport(draft(),ctx);expect(r.equipmentLosses.rows[0]).toMatchObject({manual:true,available:2,lost:null});expect(r.report).toBeNull()
 })
})

function forcedContext(size=3,quantity=6){
 const ctx=context(size,quantity)
 ctx.battleEvents=[{id:'11111111-1111-4111-8111-111111111111',match_id:ctx.matchId,at:'2026-09-12T12:00:00Z',reverted_at:null,payload:{out_of_action:true,target_kind:'group',target_id:'g',target_warband_id:ctx.roster.id,capture_reason:'subjugator',attacker_warband_id:'22222222-2222-4222-8222-222222222222'}}] as ReportContext['battleEvents']
 return ctx
}
it('a captured henchman needs no survival roll and retains two copies of a per-model weapon',()=>{
 const d=draft();d.groupInjuries.g=[]
 const r=deriveReport(d,forcedContext())
 expect(r.injuries.groups[0].dice).toBe(0)
 expect(r.injuries.groups[0].resolution.dead).toBe(0)
 expect(r.injuries.groups[0].resolution.group.size).toBe(2)
 expect(r.injuries.groups[0].resolution.line).toMatchObject({rolls:[],dead:0,captured:[{modelIndex:1,kit:[{sourceItemId:'swords',itemId:'sword',quantity:2}]}]})
 expect(r.equipmentLosses.patches).toEqual([{id:'swords',quantity:4}])
})
it('an uneven captured kit needs explicit allocation and cannot exceed the group loss',()=>{
 const d=draft();d.groupInjuries.g=[];const ctx=forcedContext(3,4)
 let r=deriveReport(d,ctx);d.groupEquipmentLosses={[r.equipmentLosses.rows[0].key]:2}
 r=deriveReport(d,ctx);expect(r.equipmentLosses.problems.join()).toContain('captured casualty')
 d.capturedEquipment={[r.equipmentLosses.captureRows[0].key]:3}
 expect(deriveReport(d,ctx).equipmentLosses.problems.length).toBeGreaterThan(0)
 d.capturedEquipment[r.equipmentLosses.captureRows[0].key]=1
 expect(deriveReport(d,ctx).equipmentLosses.problems.join()).toContain('allocate all')
 d.capturedEquipment[r.equipmentLosses.captureRows[0].key]=2
 r=deriveReport(d,ctx);expect(r.equipmentLosses.problems).toEqual([])
 expect(r.injuries.groups[0].resolution.line?.captured?.[0].kit[0].quantity).toBe(2)
})
it('keeps an ordinary casualty die separate from a later captured casualty',()=>{
 const ctx=forcedContext();const capture=ctx.battleEvents![0]
 ctx.battleEvents=[capture,{...capture,id:'33333333-3333-4333-8333-333333333333',at:'2026-09-12T11:00:00Z',payload:{...capture.payload,capture_reason:undefined}}]
 const d=draft(2);d.groupInjuries.g=[1]
 const r=deriveReport(d,ctx),res=r.injuries.groups[0].resolution
 expect(r.injuries.groups[0].dice).toBe(1)
 expect(res.line).toMatchObject({rolls:[1],dead:1,captured:[{modelIndex:2}]})
 expect(res.group.size).toBe(1)
 expect(r.equipmentLosses.patches).toEqual([{id:'swords',quantity:2}])
})
it('separates a captured model’s kit from supplies already used in the battle',()=>{
 const ctx=forcedContext(3,3);ctx.items=[{...ctx.items[0],item_rules_id:'black_lotus'}];ctx.itemsUsed={g:['black_lotus']}
 const d=draft();d.groupInjuries.g=[]
 let r=deriveReport(d,ctx);expect(r.equipmentLosses.rows[0].available).toBe(2)
 d.groupEquipmentLosses={[r.equipmentLosses.rows[0].key]:1}
 r=deriveReport(d,ctx);d.capturedEquipment={[r.equipmentLosses.captureRows[0].key]:1}
 r=deriveReport(d,ctx)
 expect(r.equipmentLosses.problems).toEqual([])
 expect(r.equipmentLosses.patches).toEqual([{id:'swords',quantity:1}])
 expect(r.injuries.groups[0].resolution.line?.equipmentLost).toEqual([{sourceItemId:'swords',quantity:1,manual:true}])
 expect(r.injuries.groups[0].resolution.line?.captured?.[0].kit).toMatchObject([{itemId:'black_lotus',quantity:1}])
})
it('records captive losses separately when an exploration recruit replaces the model in the same report',()=>{
 const ctx=forcedContext(3,6),d=draft();d.groupInjuries.g=[]
 d.exploration.rolls=[3,3,3];d.exploration.gold=2;d.exploration.recruitChoice='g'
 const r=deriveReport(d,ctx)
 expect(r.problems.exploration).toEqual([])
 expect(r.injuries.groups[0].resolution.line?.equipmentLost).toEqual([{sourceItemId:'swords',quantity:2}])
 expect(r.report?.applied.groups.find(g=>g.id==='g')?.patch.size).toBe(3)
 expect(r.report?.applied.item_patches).toContainEqual({id:'swords',quantity:6})
})

it('preserves a Man-catcher henchman capture reason and its exact share of equipment',()=>{
 const ctx=forcedContext();ctx.battleEvents![0].payload.capture_reason='man_catcher'
 const d=draft();d.groupInjuries.g=[]
 const r=deriveReport(d,ctx)
 expect(r.injuries.groups[0].resolution.line?.captured?.[0]).toMatchObject({modelIndex:1,reason:'man_catcher',kit:[{sourceItemId:'swords',itemId:'sword',quantity:2}]})
 expect(r.injuries.groups[0].dice).toBe(0)
 expect(r.injuries.groups[0].resolution.dead).toBe(0)
})
