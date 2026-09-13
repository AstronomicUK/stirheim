import {expect,it} from 'vitest'
import {findWarbandTemplate} from '../data/warbandTemplates'
import {recruitHenchmen} from './recruitment'
import {resolveCaptive} from './captives'
import type {RosterWarband} from '../types/roster'
import {cavalcadeCaptureEligible,cavalcadeCaptureLimit,cavalcadeThroneReward,resolveCavalcadeCapture,type CavalcadeCaptureFacts} from './cavalcadeCapture'
const facts:CavalcadeCaptureFacts={cavalcade:true,attackerIsHero:true,targetIsEnemyHumanHenchman:true,outOfAction:true,weaponId:'misericordia',capturedThralls:4,capturedThisBattle:1}
const stats={M:4,WS:4,BS:3,S:3,T:3,W:1,I:4,A:1,Ld:8}
const roster:RosterWarband={id:'court',name:'Cavalcade',warbandTemplateId:'the_cursed_cavalcade',gold:30,wyrdstone:2,veteranPool:null,heroes:[{id:'leader',name:'Aristocrat',unitTemplateId:'cursed_cavalcade_aristocrat',stats,xp:23,levelUps:8,status:'active',skillTableIds:[],skillIds:[],spellIds:[],injuries:[],flags:{},equipment:[]}],henchmenGroups:[],hiredSwords:[],stash:[]}
it('requires the actual Misericordia casualty, an ordinary Hero and an enemy human henchman',()=>{
 expect(cavalcadeCaptureEligible(facts)).toBe(true)
 for(const patch of [{cavalcade:false},{attackerIsHero:false},{targetIsEnemyHumanHenchman:false},{outOfAction:false},{weaponId:'dagger'},{weaponId:undefined}])expect(cavalcadeCaptureEligible({...facts,...patch})).toBe(false)
 expect(cavalcadeCaptureEligible({...facts,weaponId:'gromril_misericordia'})).toBe(true)
})
it('enforces both independent caps including Heroes already captured in the battle',()=>{
 expect(cavalcadeCaptureEligible({...facts,capturedThralls:5})).toBe(false)
 expect(cavalcadeCaptureEligible({...facts,capturedThisBattle:2})).toBe(false)
 expect(cavalcadeCaptureLimit(4,1)).toBeNull()
 expect(()=>cavalcadeCaptureLimit(-1,0)).toThrow(/saved/)
})
it('captures on 5 or 6 and retains the app result on success and failure',()=>{
 expect(resolveCavalcadeCapture(facts,5,2)).toMatchObject({captured:true,roll:5,originalRoll:2})
 expect(resolveCavalcadeCapture(facts,4,6).text).toContain('app rolled 6; player changed it to 4')
 expect(resolveCavalcadeCapture(facts,4,6).captured).toBe(false)
 expect(resolveCavalcadeCapture(facts,6).text).toContain('tabletop D6 6')
 expect(()=>resolveCavalcadeCapture(facts,7)).toThrow(/D6/)
 expect(()=>resolveCavalcadeCapture(facts,5,0)).toThrow(/D6/)
 expect(()=>resolveCavalcadeCapture({...facts,capturedThisBattle:2},6)).toThrow(/two models/)
})
it('Throne 1–2 awards nothing and leaves the input roster untouched',()=>{
 for(const d6 of [1,2])expect(cavalcadeThroneReward(roster,{name:'Victim'},{d6,groupId:'thrall',heroId:''}).captor).toBe(roster)
 expect(roster.gold).toBe(30)
})
it('Throne 3–5 creates one printed Captured Thrall, without an XP or gold award',()=>{
 for(const d6 of [3,4,5]){
  const result=cavalcadeThroneReward(roster,{name:'Victim'},{d6,groupId:'thrall',heroId:''}).captor
  expect(result.henchmenGroups).toHaveLength(1)
  expect(result.henchmenGroups[0]).toMatchObject({id:'thrall',name:'Victim',unitTemplateId:'cursed_cavalcade_captured_thrall',size:1,xp:0,stats:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:5}})
  expect(result.heroes[0].xp).toBe(23);expect(result.gold).toBe(30)
 }
 expect(roster.henchmenGroups).toHaveLength(0)
})
it('Throne 6 gives exactly one XP to the explicitly selected surviving ordinary Hero',()=>{
 const result=cavalcadeThroneReward(roster,{name:'Victim'},{d6:6,groupId:'unused',heroId:'leader'})
 expect(result.captor.heroes[0].xp).toBe(24)
 expect(result.captor.henchmenGroups).toHaveLength(0)
 expect(()=>cavalcadeThroneReward(roster,{name:'Victim'},{d6:6,groupId:'unused',heroId:'unknown'})).toThrow(/Randomly select/)
 expect(()=>cavalcadeThroneReward({...roster,warbandTemplateId:'mercenaries_reikland'},{name:'Victim'},{d6:1,groupId:'unused',heroId:''})).toThrow(/Only the Cursed/)
})

it('the rules reward retains both roster caps and cannot be bought through an ordinary free hire',()=>{
 const template=findWarbandTemplate(roster.warbandTemplateId)!
 expect(()=>recruitHenchmen(roster,template,'cursed_cavalcade_captured_thrall','Bought',1,'b',{costOverride:0})).toThrow(/cannot be hired for gold/)
 const first=cavalcadeThroneReward(roster,{name:'Thrall'},{d6:3,groupId:'t',heroId:''}).captor
 const fullThralls={...first,henchmenGroups:[{...first.henchmenGroups[0],size:5}]}
 expect(()=>cavalcadeThroneReward(fullThralls,{name:'Extra'},{d6:3,groupId:'extra',heroId:''})).toThrow(/limit is 0-5/)
 const fullWarband={...first,henchmenGroups:[{...first.henchmenGroups[0],unitTemplateId:'cursed_cavalcade_thrall',size:template.composition!.maxModels!}]}
 expect(()=>cavalcadeThroneReward(fullWarband,{name:'Extra'},{d6:3,groupId:'extra',heroId:''})).toThrow(/at most/)
})
it('a Hero transformation removes the captive, confiscates kit once and retains edited dice',()=>{
 const captive={...roster.heroes[0],id:'victim',status:'captured' as const,flags:{captured:true},equipment:[{itemId:'sword',quantity:1}]}
 const owner={...roster,id:'victims',warbandTemplateId:'mercenaries_reikland',heroes:[captive]}
 const result=resolveCaptive(owner,roster,'victim',{kind:'throne',d6:4,originalD6:1,groupId:'new',leaderId:''})
 expect(result.owner.heroes[0]).toMatchObject({status:'dead',equipment:[]})
 expect(result.captor.stash).toEqual(captive.equipment)
 expect(result.captor.henchmenGroups).toHaveLength(1)
 expect(result.message).toContain('app rolled 1; player changed this to 4')
 expect(()=>resolveCaptive(result.owner,result.captor,'victim',{kind:'throne',d6:4,groupId:'again',leaderId:''})).toThrow()
})
