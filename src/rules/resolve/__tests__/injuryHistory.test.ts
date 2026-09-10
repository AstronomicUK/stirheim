import { expect, it } from 'vitest'
import { injuryRecordKind } from '../injuryHistory'
import { applyHeroInjury } from '../injuries'
import { resolvePitFightWin } from '../pitFight'
import type { RosterHero, RosterWarband } from '../../types/roster'
it('retains repeated pit events as history, resolves the selected hero and preserves lasting injuries', () => {
 const hero: RosterHero = { id:'a', name:'A', unitTemplateId:'mercenaries_reikland_mercenary_captain', stats:{M:4,WS:4,BS:4,S:3,T:3,W:1,I:4,A:1,Ld:8}, xp:0,levelUps:0,skillTableIds:[],skillIds:[],spellIds:[],injuries:[],flags:{},equipment:[],status:'active' }
 const injured = applyHeroInjury(applyHeroInjury(hero,22).value.hero,65).value.hero
 const second = {...injured,id:'b'}
 const roster = {id:'w',name:'Test',warbandTemplateId:'reikland',gold:0,wyrdstone:0,veteranPool:null,heroes:[injured,second],henchmenGroups:[],hiredSwords:[],stash:[]} satisfies RosterWarband
 const next=resolvePitFightWin(roster,'b').value
 expect(next.heroes[0].flags.pitFightOwed).toBe(true)
 const resolved=next.heroes[1]
 expect(resolved.injuries.map(i=>injuryRecordKind(i,resolved.flags))).toEqual(['lasting','history'])
 expect(resolved.injuries[1].effect).toContain('+50 gc')
 expect(next.gold).toBe(50)
 expect(resolved.xp).toBe(2)
 expect(applyHeroInjury(resolved,65).value.hero.flags.pitFightOwed).toBe(true)
 expect(resolved.stats.M).toBe(injured.stats.M)
})
it('queues only newly earned advancement boxes for pit-fight XP',async()=>{
 const {eventAdvances}=await import('../eventAdvances')
 const h={id:'hero',status:'active',xp:3,unitTemplateId:'mercenaries_reikland_captain',flags:{}}
 const before={id:'w',heroes:[h],hiredSwords:[]} as unknown as RosterWarband
 const after={...before,heroes:[{...h,xp:5}]} as unknown as RosterWarband
 expect(eventAdvances(before,after)).toEqual([{warband_id:'w',subject_type:'hero',subject_id:'hero',threshold_xp:4}])
})
