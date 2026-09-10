import {expect,it} from 'vitest'
import {findLore} from '../../data/campaign/magic'
import type {RosterHero,RosterWarband} from '../../types/roster'
import {planRockTome,ROCK_TOME,READ_ROCK_TOME,rockTomeSources} from '../rockTome'
const hero: RosterHero={id:'h',name:'Magister',unitTemplateId:'cult_of_the_possessed_magister',stats:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:8},xp:20,levelUps:0,skillTableIds:[],skillIds:[],spellIds:[],injuries:[],equipment:[],flags:{magicLoreId:'chaos_rituals'},status:'active'}
const roster: RosterWarband={id:'w',name:'Readers',warbandTemplateId:'cult_of_the_possessed',gold:100,wyrdstone:0,veteranPool:null,heroes:[hero],hiredSwords:[],henchmenGroups:[],stash:[{itemId:ROCK_TOME,quantity:1}]}
const lessons=[{loreId:'chaos_rituals',roll:1},{loreId:'lesser_magic',roll:1}]
it('resolves both spells together, preserves the used book and prevents reusing its copy',()=>{
 const result=planRockTome(roster,'h',lessons)
 expect(result.problems).toEqual([])
 expect(result.next!.heroes[0].spellIds).toEqual([findLore('chaos_rituals')!.spells[0].id,findLore('lesser_magic')!.spells[0].id])
 expect(result.next!.stash).toEqual([])
 expect(result.next!.heroes[0].equipment[0]).toMatchObject({itemId:READ_ROCK_TOME,quantity:1})
 expect(result.next!.heroes[0].equipment[0].notes).toContain('Bound to Magister')
 expect(result.next!.gold).toBe(100)
 expect(planRockTome(result.next!,'h',lessons).next).toBeNull()
 expect(roster.heroes[0].spellIds).toEqual([])
})
it('waits for two valid lessons and rejects foreign spell tables or mismatched results',()=>{
 expect(planRockTome(roster,'h',lessons.slice(0,1)).next).toBeNull()
 expect(planRockTome(roster,'h',[lessons[0],{loreId:'necromancy',roll:1}]).next).toBeNull()
 expect(planRockTome(roster,'h',[lessons[0],{...lessons[1],spellId:'not-the-result'}]).next).toBeNull()
 expect(planRockTome(roster,'h',[lessons[0],{...lessons[1],roll:1.5}]).next).toBeNull()
})
it('checks the second lesson against the first and records a chosen duplicate reduction',()=>{
 const repeated=[lessons[0],lessons[0]]
 expect(planRockTome(roster,'h',repeated).problems.join(' ')).toContain('already knows')
 const result=planRockTome(roster,'h',[lessons[0],{...lessons[0],lowerDifficulty:true}])
 const spell=findLore('chaos_rituals')!.spells[0].id
 expect(result.next!.heroes[0].spellIds).toEqual([spell])
 expect(result.next!.heroes[0].flags.spellDifficultyReductions?.[spell]).toBe(1)
 expect(result.notes.join(' ')).toContain('duplicate lowers difficulty')
})
it('takes exactly one unread book wherever held and preserves other equipment',()=>{
 const result=planRockTome({...roster,stash:[{itemId:ROCK_TOME,quantity:2},{itemId:'sword',quantity:1}]},'h',lessons)
 expect(result.next!.stash).toEqual([{itemId:ROCK_TOME,quantity:1},{itemId:'sword',quantity:1}])
 const held=planRockTome({...roster,stash:[],heroes:[{...hero,equipment:[{itemId:'dagger',quantity:1},{itemId:ROCK_TOME,quantity:1}]}]},'h',lessons)
 expect(held.next!.heroes[0].equipment.map(i=>i.itemId)).toEqual(['dagger',READ_ROCK_TOME])
})
it('excludes forbidden warbands and requires a wizard or Arcane Lore',()=>{
 for(const warbandTemplateId of ['sisters_of_sigmar','witch_hunters'])expect(planRockTome({...roster,warbandTemplateId},'h',lessons).next).toBeNull()
 expect(planRockTome({...roster,heroes:[hero,{...hero,id:'morr',unitTemplateId:'priest_of_morr'}]},'h',lessons).next).toBeNull()
 expect(rockTomeSources({...hero,flags:{},unitTemplateId:'mercenaries_reikland_captain'})).toEqual([])
 expect(rockTomeSources({...hero,flags:{},skillIds:['arcane_lore'],unitTemplateId:'mercenaries_reikland_captain'}).map(l=>l.id)).toEqual(['lesser_magic'])
})
