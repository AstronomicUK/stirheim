import { describe, expect, it } from 'vitest'
import { resolveCaptive } from '../captives'
import type { RosterWarband, RosterHero } from '../../types/roster'
const hero: RosterHero={id:'captive',name:'Captive',unitTemplateId:'mercenaries_reikland_mercenary_captain',stats:{M:4,WS:4,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:8},xp:20,levelUps:0,skillTableIds:[],skillIds:[],spellIds:[],injuries:[],flags:{captured:true},status:'captured',equipment:[{itemId:'sword',quantity:1}]}
const roster=(id:string):RosterWarband=>({id,name:id,warbandTemplateId:'mercenaries_reikland',gold:100,wyrdstone:0,veteranPool:null,heroes:[{...hero,id}],henchmenGroups:[],hiredSwords:[],stash:[]})
describe('captured hero outcomes',()=>{
 it('moves the ransom once and returns equipment with the warrior',()=>{const a=roster('a'),b=roster('b');const r=resolveCaptive(a,b,'a',{kind:'ransom',gold:30});expect(r.owner.gold).toBe(70);expect(r.captor.gold).toBe(130);expect(r.owner.heroes[0].status).toBe('active');expect(r.owner.heroes[0].equipment).toEqual(hero.equipment);expect(()=>resolveCaptive(r.owner,r.captor,'a',{kind:'ransom',gold:30})).toThrow();expect(a.heroes[0].status).toBe('captured')})
 it('exchanges both prisoners with their kit',()=>{const r=resolveCaptive(roster('a'),roster('b'),'a',{kind:'exchange',otherHeroId:'b'});expect([r.owner,r.captor].every(w=>w.heroes[0].status==='active'&&w.heroes[0].equipment.length===1)).toBe(true)})
 it('sells for the rolled amount and transfers equipment',()=>{const r=resolveCaptive(roster('a'),roster('b'),'a',{kind:'sell',d6:4});expect(r.captor.gold).toBe(120);expect(r.captor.stash).toEqual(hero.equipment);expect(r.owner.heroes[0].equipment).toEqual([]);expect(r.owner.heroes[0].status).toBe('retired')})
 it('rejects invalid dice, unaffordable ransom, same-warband and wrong-faction outcomes',()=>{expect(()=>resolveCaptive(roster('a'),roster('b'),'a',{kind:'sell',d6:7})).toThrow();expect(()=>resolveCaptive(roster('a'),roster('b'),'a',{kind:'ransom',gold:101})).toThrow();expect(()=>resolveCaptive(roster('a'),roster('a'),'a',{kind:'sell',d6:1})).toThrow();expect(()=>resolveCaptive(roster('a'),roster('b'),'a',{kind:'zombie',groupId:'z'})).toThrow()})
})
it('resolves Hashut work and Throne outcomes without allowing ransom',()=>{
 const owner=roster('a'),hashut={...roster('h'),warbandTemplateId:'the_sons_of_hashut'}
 expect(()=>resolveCaptive(owner,hashut,'a',{kind:'ransom',gold:0})).toThrow()
 const escape=resolveCaptive(owner,hashut,'a',{kind:'slaveWork',d6:1,xp:3})
 expect(escape.owner.heroes[0]).toMatchObject({status:'active',xp:23,equipment:hero.equipment})
 expect(escape.captor.wyrdstone).toBe(1)
 const death=resolveCaptive(owner,hashut,'a',{kind:'slaveWork',d6:2,xp:0})
 expect(death.owner.heroes[0].status).toBe('dead');expect(death.captor.stash).toEqual(hero.equipment)
 const court={...roster('c'),warbandTemplateId:'the_cursed_cavalcade',heroes:[{...hero,id:'leader',status:'active' as const}]}
 const throne=resolveCaptive(owner,court,'a',{kind:'throne',d6:6,leaderId:'leader',groupId:'thrall'})
 expect(throne.captor.heroes[0].xp).toBe(21);expect(throne.owner.heroes[0].status).toBe('dead')
})
