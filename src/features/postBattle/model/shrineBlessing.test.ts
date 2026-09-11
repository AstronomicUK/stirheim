import {describe,expect,it} from 'vitest'
import type {ItemRow,ReportApplied} from '../../../domain'
import {makeWarband} from '../../../rules/resolve/__tests__/fixtures'
import {SHRINE_BLESSING} from '../../../rules/resolve/shrineBlessing'
import {emptyExploration} from './state'
import {applyShrineBlessing} from './shrineBlessing'
const original:ItemRow={id:'weapon',warband_id:'w',holder_type:'stash',holder_id:null,item_rules_id:'sword',custom_name:null,quantity:2,notes:'Original note',created_at:'',updated_at:''}
const applied=():ReportApplied=>({heroes:[],groups:[],pending_advances:[],remove_item_ids:[],item_patches:[],stash_items:[],warband:{gold_delta:0,wyrdstone_delta:0,veteran_pool:null}})
const roster=makeWarband({warbandTemplateId:'witch_hunters'})
describe('Shrine selected weapon',()=>{
 it('requires the choice and an owned surviving weapon',()=>{
  expect(applyShrineBlessing(emptyExploration(),'shrine',roster,[original],applied()).problems).toHaveLength(1)
  expect(applyShrineBlessing({...emptyExploration(),shrineChoice:'save',shrineWeaponId:'missing'},'shrine',roster,[original],applied()).problems).toHaveLength(1)
  expect(applyShrineBlessing({...emptyExploration(),shrineChoice:'strip'},'shrine',roster,[original],applied()).problems).toEqual([])
 })
 it('splits exactly one blessed copy and protects the original stack snapshot',()=>{
  const result=applied();applyShrineBlessing({...emptyExploration(),shrineChoice:'save',shrineWeaponId:original.id},'shrine',roster,[original],result)
  expect(result.item_patches).toEqual([{id:'weapon',quantity:1}]);expect(result.awarded_items).toHaveLength(1)
  expect(result.awarded_items?.[0]).toMatchObject({item_rules_id:'sword',quantity:1,notes:`Original note\n${SHRINE_BLESSING}`})
  expect(result.shrine_equipment?.expected.quantity).toBe(2)
 })
 it('preserves a single item and never blesses removed kit or unrelated warbands',()=>{
  const result=applied();applyShrineBlessing({...emptyExploration(),shrineChoice:'save',shrineWeaponId:'weapon'},'shrine',roster,[{...original,quantity:1}],result)
  expect(result.item_patches[0].notes).toContain(SHRINE_BLESSING);expect(result.awarded_items).toBeUndefined()
  const removed=applied();removed.remove_item_ids=['weapon'];expect(applyShrineBlessing({...emptyExploration(),shrineChoice:'save',shrineWeaponId:'weapon'},'shrine',roster,[original],removed).problems).toHaveLength(1)
  const other=applied();applyShrineBlessing({...emptyExploration(),shrineChoice:'save',shrineWeaponId:'weapon'},'shrine',makeWarband(),[original],other);expect(other.item_patches).toEqual([])
 })
 it('records the blessing for a chosen custom weapon without inventing its profile',()=>{
  const result=applied(),custom={...original,item_rules_id:null,custom_name:'Table-agreed blade',quantity:1}
  const outcome=applyShrineBlessing({...emptyExploration(),shrineChoice:'save',shrineWeaponId:'weapon'},'shrine',roster,[custom],result)
  expect(outcome.problems).toEqual([]);expect(result.item_patches[0].notes).toContain(SHRINE_BLESSING)
  expect(outcome.options[0].label).toContain('custom item')
 })

})
