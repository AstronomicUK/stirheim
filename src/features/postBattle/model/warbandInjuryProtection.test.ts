import {describe,it,expect} from 'vitest'
import {makeHero} from '../../../rules/resolve/__tests__/fixtures'
import {resolveHeroInjuryFlow} from './injuries'
import {emptyDraft,addHeroInjuryRoll} from './state'
import {applyExtraToughReroll,injuryRerollName} from './extraTough'
describe('warband injury protection',()=>{
 it.each(['amazons_lustria_skills_elixir_of_life','nipponese_expedition_skills_blessed_by_the_kami'])('uses %s once, retains original roll and accepts a worse result',skill=>{
  const hero=makeHero({skillIds:[skill]}),d=addHeroInjuryRoll(emptyDraft(),hero.id,41,'app')
  const next=applyExtraToughReroll(d,hero,11,'tabletop')
  expect(resolveHeroInjuryFlow(hero,next.heroInjuries[hero.id]).outcome).toBe('dead')
  expect(next.heroInjuries[hero.id].previousAttempts?.[0].reason).toContain(injuryRerollName(hero))
  expect(applyExtraToughReroll(next,hero,41,'app')).toBe(next)
 })
 it('restricts the Onogal reroll to the marked leader, not the Seer',()=>{
  expect(injuryRerollName(makeHero({unitTemplateId:'marauders_chieftain',flags:{chaosMark:'crow'}}))).toBe('Mark of Onogal')
  expect(injuryRerollName(makeHero({unitTemplateId:'marauders_seer',flags:{chaosMark:'crow'}}))).toBeNull()
 })
 it('spends Conqueror Survivor once, replacing first death with Multiple Injuries',()=>{
  const hero=makeHero({unitTemplateId:'lustrian_reavers_conqueror'})
  const pending=resolveHeroInjuryFlow(hero,{rolls:[{d66:11,subRoll:null}],countRoll:null})
  expect(pending.pending.kind).toBe('count')
  const saved=resolveHeroInjuryFlow(hero,{rolls:[{d66:11,subRoll:null},{d66:41,subRoll:null}],countRoll:1})
  expect(saved.outcome).not.toBe('dead');expect(saved.hero.flags.conquerorSurvivorUsed).toBe(true)
  expect(saved.line?.effect).toContain('once-only protection')
  expect(resolveHeroInjuryFlow(saved.hero,{rolls:[{d66:11,subRoll:null}],countRoll:null}).outcome).toBe('dead')
 })
 it('uses unmodified Leadership for Will to Survive and persists D3 absence only on success',()=>{
  const hero=makeHero({skillIds:['druchii_skills_will_to_survive']})
  expect(resolveHeroInjuryFlow(hero,{rolls:[{d66:11,subRoll:null}],countRoll:null}).pending.kind).toBe('survival')
  const success=resolveHeroInjuryFlow(hero,{rolls:[{d66:11,subRoll:null,survivalDice:[3,4],survivalAbsence:3}],countRoll:null})
  expect(success.hero.status).toBe('active');expect(success.hero.flags.missNextGames).toBe(3)
  expect(success.line?.effect).toContain('3 + 4')
  expect(resolveHeroInjuryFlow(hero,{rolls:[{d66:11,subRoll:null,survivalDice:[4,4]}],countRoll:null}).outcome).toBe('dead')
 })
})
it('applies both Snotling Hero injuries while exempting the Goblin leader',()=>{
 const hero=makeHero({unitTemplateId:'bigsnotz'})
 expect(resolveHeroInjuryFlow(hero,{rolls:[{d66:41,subRoll:null}],countRoll:null}).pending.kind).toBe('d66')
 const r=resolveHeroInjuryFlow(hero,{rolls:[{d66:41,subRoll:null},{d66:11,subRoll:null}],countRoll:null})
 expect(r.outcome).toBe('dead');expect(r.line?.rolls).toEqual([41,11])
 expect(resolveHeroInjuryFlow({...hero,unitTemplateId:'bullied_goblin'},{rolls:[{d66:41,subRoll:null}],countRoll:null}).pending.kind).toBe('done')
})
it('keeps a second Snotling Multiple Injuries count separate from the first',()=>{
 const hero=makeHero({unitTemplateId:'bigsnotz'})
 const rolls=[{d66:16,subRoll:null},{d66:41,subRoll:null},{d66:16,subRoll:null}]
 expect(resolveHeroInjuryFlow(hero,{rolls,countRoll:1}).pending).toMatchObject({kind:'count',rollIndex:2})
 const r=resolveHeroInjuryFlow(hero,{rolls:[...rolls,{d66:11,subRoll:null},{d66:41,subRoll:null},{d66:42,subRoll:null}],countRoll:1,countRolls:{2:2}})
 expect(r.outcome).toBe('recovered');expect(r.steps[3].rerolled).toBe(true)
 expect(r.line?.rolls).toEqual([16,1,41,16,2,11,41,42])
})
it('protects Bear Tamers from the three printed injury results only when a guardian is supplied',()=>{
 const h=makeHero({unitTemplateId:'kislevites_bear_tamer'})
 for(const d66 of [36,61,65]) {
  const r=resolveHeroInjuryFlow(h,{rolls:[{d66,subRoll:null}],countRoll:null},undefined,undefined,undefined,true,'Fiercely Loyal: protected by the bear')
  expect(r.outcome).toBe('recovered');expect(r.line?.effect).toContain('Fiercely Loyal')
 }
})
it('can use a named protection on a later Multiple Injuries result without erasing earlier injuries',()=>{
 const h=makeHero({skillIds:['nipponese_expedition_skills_blessed_by_the_kami']})
 let d=addHeroInjuryRoll(emptyDraft(),h.id,16);d.heroInjuries[h.id].countRoll=2
 d=addHeroInjuryRoll(d,h.id,33);d=addHeroInjuryRoll(d,h.id,22)
 const next=applyExtraToughReroll(d,h,41,'app')
 expect(next.heroInjuries[h.id].rolls.map(r=>r.d66)).toEqual([16,33,41])
 expect(next.heroInjuries[h.id].countRoll).toBe(2)
 expect(resolveHeroInjuryFlow(h,next.heroInjuries[h.id]).pending.kind).toBe('done')
 expect(resolveHeroInjuryFlow(h,next.heroInjuries[h.id]).hero.stats.I).toBe(h.stats.I-1)
})
