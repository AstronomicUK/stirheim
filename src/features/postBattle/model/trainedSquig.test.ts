import {it,expect} from 'vitest'
import {makeHero,makeHenchmanGroup,makeWarband} from '../../../rules/resolve/__tests__/fixtures'
import {recruitHenchmen} from '../../../rules/resolve/recruitment'
import {findWarbandTemplate} from '../../../rules/data/warbandTemplates'
import {resolveGroupInjuries} from './injuries'
import {groupXpLine} from './xp'
import {planGroup,emptyDraft,setDice} from '../../advances/model'
it('recruits one trained Squig, grants XP and rerolls Lads Got Talent without training an entire group',()=>{
 const template=findWarbandTemplate('night_goblins_web')!,herder=makeHero({unitTemplateId:'night_goblins_web_squig_herder',skillIds:['night_goblins_web_skills_trainin']})
 const roster=makeWarband({warbandTemplateId:template.id,gold:200,heroes:[herder],henchmenGroups:[]})
 expect(()=>recruitHenchmen(roster,template,'night_goblins_web_cave_squigs','Squigs',2,'g')).toThrow('one new individual')
 const next=recruitHenchmen(roster,template,'night_goblins_web_cave_squigs','Guard Squig',1,'g').value.warband,g=next.henchmenGroups[0]
 expect(g.campaignState?.trainedSquig).toBe(true)
 expect(()=>recruitHenchmen(next,template,g.unitTemplateId,g.name,1,'new',{intoGroupId:g.id})).toThrow('one individual')
 expect(resolveGroupInjuries(g,1,[2]).dead).toBe(0)
 expect(resolveGroupInjuries(g,1,[1]).dead).toBe(1)
 const xp=groupXpLine(g,g,{won:false,leaderId:null,underdogBonus:0,enemiesOut:{},extras:{}})
 expect(xp?.amount).toBe(1)
 expect(planGroup(setDice(emptyDraft('new'),5,5),g,{roster:next,template}).need).toBe('reroll')
 const ordinary=makeHenchmanGroup({unitTemplateId:g.unitTemplateId})
 expect(groupXpLine(ordinary,ordinary,{won:false,leaderId:null,underdogBonus:0,enemiesOut:{},extras:{}})).toBeNull()
})
