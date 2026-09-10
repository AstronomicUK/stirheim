import {describe,it,expect} from 'vitest'
import {raidsRewards,type RaidsDraft,type RaidSurvivors} from './raidsRewards'
const base:RaidsDraft={role:'raider',setupConfirmed:true,jewellery:3,inhabitants:4,townsmen:1,burned:2,trackingDie:4}
const survivors:RaidSurvivors={warriors:[{id:'captain',name:'Captain',canSurrender:true}],groups:[{canSurrender:2,group:{id:'g',name:'Warriors',unitTemplateId:'mercenaries_reikland_warriors',size:3,xp:0,levelUps:0,stats:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7},statIncreases:{},equipment:[]}}]}
describe('Raids outcomes',()=>{
 it('converts actual jewellery and captured townsfolk using the source ratios',()=>{
  const r=raidsRewards(base,survivors);expect(r.problems).toEqual([]);expect(r.gold).toBe(15);expect(r.captives).toBe(2);expect(r.ambushed).toBe(false)
 })
 it('selects distinct returning henchmen and applies their actual injury dice',()=>{
  const r=raidsRewards({...base,burned:0,trackingDie:1,ambushDie:6,ambush:[{selection:3,injury:1},{selection:1,injury:6},{selection:1,injury:2}]},survivors)
  expect(r.problems).toEqual([]);expect(r.targets).toBe(3);expect(r.ambushGroups.g.dead).toBe(2);expect(r.ambushGroups.g.group.size).toBe(1)
 })
 it('excludes surrendered members from the ambush and requires valid distinct surrender choices',()=>{
  const r=raidsRewards({...base,surrenderedWarriors:['captain'],surrenderedGroups:{g:2},burned:0,trackingDie:1,ambushDie:4,ambush:[{selection:1,injury:6}]},survivors)
  expect(r.problems).toEqual([]);expect(r.targets).toBe(1);expect(r.surrenderedGroups).toEqual({g:2})
  expect(raidsRewards({...base,surrenderedWarriors:['captain','captain'],surrenderedGroups:{g:3}},survivors).problems).toHaveLength(2)
 })
 it('discards stale pursuit dice after the tracks roll changes and requires a legal sequential selection',()=>{
  expect(raidsRewards({...base,ambushDie:6,ambush:[{selection:99,injury:1}]},survivors).ambushGroups).toEqual({})
  expect(raidsRewards({...base,burned:0,trackingDie:1,ambushDie:1,ambush:[{selection:4,injury:1}]},survivors).problems.join(' ')).toContain('selection 1')
 })
 it('does not award the townsfolk the raiders’ spoils or infer missing rolls',()=>{
  expect(raidsRewards({...base,role:'townsfolk'},survivors).gold).toBe(0)
  expect(raidsRewards({role:'raider'},survivors).problems.length).toBeGreaterThan(0)
 })
})
