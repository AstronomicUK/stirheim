import {expect,it} from 'vitest'
import {heroInjuryLineSchema} from '../../../domain/report'
import type {RosterHero} from '../../../rules/types/roster'
import {resolveHeroInjuryFlow} from './injuries'
import {addHeroInjuryRoll,emptyDraft,resetHeroInjury,setHeroOut,setInjurySkip} from './state'
import {deriveReport,reportAdjustments} from './derive'
import type {ReportDraft} from './state'
import {findWarbandTemplate} from '../../../rules/data/warbandTemplates'
const hero:RosterHero={id:'hero',name:'Engineer',unitTemplateId:'mercenaries_reikland_champions',stats:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7},xp:0,levelUps:0,skillTableIds:[],skillIds:[],spellIds:[],injuries:[],flags:{},equipment:[],status:'active'}
const ctx={matchId:'match',myRating:100,opponentRating:null,template:findWarbandTemplate('mercenaries_reikland'),items:[],roster:{id:'band',name:'Test',warbandTemplateId:'mercenaries_reikland',gold:100,wyrdstone:0,veteranPool:null,heroes:[hero],hiredSwords:[],henchmenGroups:[],stash:[]}}
const adjustments=(d:ReportDraft)=>{const r=deriveReport(d,ctx);return reportAdjustments(d,r.participants,r.injuries,r.exploration)}
it('retains app result, replacement and reason through draft JSON and report schema',()=>{
 let d=addHeroInjuryRoll(setHeroOut(emptyDraft(),'hero',true),'hero',22,'app')
 expect(resetHeroInjury(d,'hero','  ')).toBe(d)
 d=resetHeroInjury(d,'hero','Agreed at the table')
 d=addHeroInjuryRoll(JSON.parse(JSON.stringify(d)),'hero',65,'tabletop')
 const result=resolveHeroInjuryFlow(hero,d.heroInjuries.hero)
 expect(result.hero.stats.M).toBe(4)
 expect(result.hero.flags.pitFightOwed).toBe(true)
 const line=heroInjuryLineSchema.parse(result.line)
 expect(line.rollHistory).toEqual(['Attempt 1: D66 22 (app roll).','Replaced this attempt. Reason: Agreed at the table','Used: D66 65 (entered from tabletop dice).'])
 expect(adjustments(d)).toContainEqual({label:'Engineer: injury roll replacement 1',suggested:'D66 22 (app roll)',used:'D66 65 (entered from tabletop dice)',reason:'Agreed at the table'})
})
it('records each replacement in order, including a final agreed skip',()=>{
 let d=addHeroInjuryRoll(setHeroOut(emptyDraft(),'hero',true),'hero',22,'tabletop')
 d=addHeroInjuryRoll(resetHeroInjury(d,'hero','Wrong first entry'),'hero',26,'app')
 d=setInjurySkip(resetHeroInjury(d,'hero','Allowed by house rule'),'hero','House rule')
 const changes=adjustments(d)
 expect(changes[0]).toMatchObject({suggested:'D66 22 (entered from tabletop dice)',used:'D66 26 (app roll)'})
 expect(changes[1]).toMatchObject({suggested:'D66 26 (app roll)',used:'no roll (recovered)',reason:'Allowed by house rule'})
})
it('does not call ordinary tabletop entry an override or invent historical provenance',()=>{
 const d=addHeroInjuryRoll(setHeroOut(emptyDraft(),'hero',true),'hero',22,'tabletop')
 expect(adjustments(d)).toEqual([])
 expect(resolveHeroInjuryFlow(hero,{rolls:[{d66:22,subRoll:null}],countRoll:null}).line).not.toHaveProperty('rollHistory')
})
