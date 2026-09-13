import {describe,it,expect} from 'vitest'
import {makeHero} from '../../../rules/resolve/__tests__/fixtures'
import {resolveHeroInjuryFlow} from './injuries'
import type {HeroInjuryFlow} from './state'
const flow=(d66:number,choice?:'accept'|'sacrifice',die?:number):HeroInjuryFlow=>({rolls:[{d66,subRoll:null,source:'app',eternalChoice:choice,eternalDie:die}],countRoll:null})
describe.each(['restless_dead_liche','restless_dead_variant_liche'])('%s Eternal',type=>{
 const hero=(w=4)=>{const h=makeHero({unitTemplateId:type});return {...h,stats:{...h.stats,W:w}}}
 it('offers an actual choice, spends a permanent Wound only when selected and skips injury follow-ups',()=>{
  expect(resolveHeroInjuryFlow(hero(),flow(24)).pending.kind).toBe('eternal')
  const result=resolveHeroInjuryFlow(hero(),flow(24,'sacrifice'));expect(result.pending.kind).toBe('done');expect(result.hero.stats.W).toBe(3);expect(result.hero.stats.M).toBe(4);expect(result.hero.injuries).toHaveLength(0);expect(result.line?.effect).toContain('4 → 3')
  expect(resolveHeroInjuryFlow(hero(),flow(24,'accept')).pending.kind).toBe('subRoll')
  expect(resolveHeroInjuryFlow(hero(1),flow(24,'sacrifice')).pending.kind).toBe('subRoll')
 })
 it('requires D3 for Killed; survives if Wounds remain and dies at zero',()=>{
  expect(resolveHeroInjuryFlow(hero(),flow(11)).pending).toMatchObject({kind:'eternal',killed:true})
  for(const die of [1,2,3]){const result=resolveHeroInjuryFlow(hero(),flow(11,'sacrifice',die));expect(result.hero.status).toBe('active');expect(result.hero.stats.W).toBe(4-die);expect(result.line?.rolls).toEqual([11,die])}
  expect(resolveHeroInjuryFlow(hero(2),flow(11,'sacrifice',2)).hero).toMatchObject({status:'dead',stats:{W:0}})
  expect(resolveHeroInjuryFlow(hero(),flow(11,'sacrifice',4)).pending.kind).toBe('eternal')
 })
 it('can cancel Multiple Injuries as a whole, while discarded sub-rolls retain mandatory reroll precedence',()=>{
  expect(resolveHeroInjuryFlow(hero(),flow(16,'sacrifice')).pending.kind).toBe('done')
  const f:HeroInjuryFlow={rolls:[{d66:16,subRoll:null,eternalChoice:'accept'},{d66:11,subRoll:null},{d66:31,subRoll:null,eternalChoice:'sacrifice'}],countRoll:1}
  const r=resolveHeroInjuryFlow(hero(),f);expect(r.steps[1].rerolled).toBe(true);expect(r.hero.stats.W).toBe(3)
 })
 it('does not replace a direct scenario death or forced capture outside the Serious Injury chart',()=>{
  expect(resolveHeroInjuryFlow(hero(),flow(11),undefined,undefined,undefined,false).hero.status).toBe('dead')
  expect(resolveHeroInjuryFlow(hero(),flow(61),undefined,undefined,undefined,false).hero.status).toBe('captured')
 })
})
