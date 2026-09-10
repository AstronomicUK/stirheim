import {expect,it} from 'vitest'
import {findWarbandTemplate} from '../../../rules/data/warbandTemplates'
import type {RosterHero,RosterWarband} from '../../../rules/types/roster'
import {rockRewards,type RockConscript} from './rockRewards'
import {rockConscripts} from './rockConscripts'
const stats={M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:8}
const hero: RosterHero={id:'m',name:'Matriarch',unitTemplateId:'sisters_of_sigmar_matriarch',stats,xp:20,levelUps:0,skillIds:[],spellIds:[],skillTableIds:[],injuries:[],equipment:[],flags:{},status:'active'}
const roster: RosterWarband={id:'w',name:'Sisters',warbandTemplateId:'sisters_of_sigmar',heroes:[hero],hiredSwords:[],henchmenGroups:[],stash:[],gold:0,wyrdstone:0,veteranPool:null}
it('awards the Sisters’ tithe and Matriarch bonus, with no usable tome',()=>{
 expect(rockRewards({matriarchId:'m'},true,roster)).toMatchObject({gold:100,items:[],problems:[],xpAwards:[{id:'m',amount:2}]})
 expect(rockRewards({matriarchId:'m'},false,roster)).toMatchObject({gold:0,items:[],xpAwards:[]})
})
it('gives other winning warbands one distinct two-spell tome',()=>{
 expect(rockRewards({},true,{...roster,warbandTemplateId:'cult_of_the_possessed'}).items).toEqual([{item_rules_id:'scenario_rock_tome',custom_name:null,quantity:1}])
})
it('allocates destroyed-tome XP and adds named Witch Hunter casualty bonuses',()=>{
 const witch={...roster,warbandTemplateId:'witch_hunters',heroes:[{...hero,unitTemplateId:'witch_hunters_captain'}]}
 const state={destructionDie:4,xp:{m:4},witchKills:[{recipientId:'m',enemy:'Augur guarding the gate',kind:'augur' as const}]}
 const r=rockRewards(state,true,witch)
 expect(r).toMatchObject({gold:50,items:[],problems:[]})
 expect(r.xpAwards.map(a=>a.amount)).toEqual([2,4])
 expect(rockRewards({...state,xp:{m:3}},true,witch).problems).toHaveLength(1)
 expect(rockRewards({...state,witchKills:[...state.witchKills,...state.witchKills]},true,witch).problems).toHaveLength(1)
 expect(rockRewards(state,false,witch)).toMatchObject({gold:0,items:[],xpAwards:[{id:'m',amount:2}]})
 const morr={...witch,warbandTemplateId:'mercenaries_reikland',heroes:[{...witch.heroes[0],unitTemplateId:'priest_of_morr'}]}
 expect(rockRewards({destructionDie:4,xp:{m:4}},true,morr)).toMatchObject({gold:0,items:[],problems:[],xpAwards:[{amount:4}]})
})
const row=(over:Partial<RockConscript>={}):RockConscript=>({id:crypto.randomUUID(),patrol:'East patrol',dice:[2,3],leadership:8,kit:'hammers',survived:true,retain:true,eligiblePatrol:true,...over})
it('retains successful surviving Sisters with exactly their declared free kit',()=>{
 const r=rockConscripts([row(),row({kit:'whip'})],roster,findWarbandTemplate('sisters_of_sigmar'))
 expect(r.problems).toEqual([])
 expect(r.newGroups).toHaveLength(2)
 expect(r.awardedItems.map(i=>[i.item_rules_id,i.quantity])).toEqual([['sigmarite_warhammer',2],['sigmarite_warhammer',1],['steel_whip',1]])
 expect(r.newGroups.every(g=>g.xp===0&&g.size===1)).toBe(true)
})
it('rejects excess patrol conscripts, failed tests, casualties, ineligible patrols and over-cap recruits',()=>{
 const t=findWarbandTemplate('sisters_of_sigmar')!
 expect(rockConscripts([row(),row(),row()],roster,t).problems.join(' ')).toContain('at most two')
 for(const change of [{dice:[6,6]},{survived:false},{eligiblePatrol:false}])expect(rockConscripts([row(change)],roster,t).problems.length).toBeGreaterThan(0)
 const full={...roster,henchmenGroups:[{id:'g',name:'Sisters',unitTemplateId:'sisters_of_sigmar_sigmarite_sister',size:14,stats,xp:0,levelUps:0,statIncreases:{},equipment:[]}]}
 expect(rockConscripts([row()],full,t).problems.length).toBeGreaterThan(0)
})
