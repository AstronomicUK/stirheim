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
  const ctx=context();ctx.items=[{...ctx.items[0],item_rules_id:'healing_herbs'}];ctx.itemsUsed={g:['healing_herbs']}
  const r=deriveReport(draft(),ctx);expect(r.equipmentLosses.rows[0]).toMatchObject({manual:true,available:2,lost:null});expect(r.report).toBeNull()
 })
})
