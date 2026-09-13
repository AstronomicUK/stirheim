import {expect,it} from 'vitest'
import {makeHero,makeWarband} from '../../rules/resolve/__tests__/fixtures'
import {findWarbandTemplate} from '../../rules/data/warbandTemplates'
import {emptyDraft,setDice,setSubRoll,setSkillInstead,setSkill,planHero} from './model'
it.each([['restless_dead_liche','the_restless_dead'],['restless_dead_variant_liche','the_restless_dead_variant']])('%s may replace a Wound advance with a skill or spell', (unitTemplateId,warbandTemplateId)=>{
 const hero=makeHero({unitTemplateId,skillTableIds:['academic'],spellIds:['spell_of_awakening']})
 const ctx={roster:makeWarband({warbandTemplateId,heroes:[hero]}),template:findWarbandTemplate(warbandTemplateId)}
 const draft=setSubRoll(setDice(emptyDraft('id'),4,5),1),subject={kind:'hero' as const,hero}
 const wound=planHero(draft,subject,ctx)
 expect(wound.licheWoundChoice).toBe(true)
 expect(wound.result?.next.heroes[0].stats.W).toBe(2)
 const alternative=planHero(setSkillInstead(draft,true),subject,ctx)
 expect(alternative.need).toBe('skill');expect(alternative.allowSpell).toBe(true)
 const skill=planHero(setSkill(setSkillInstead(draft,true),'sorcery'),subject,ctx)
 expect(skill.result?.next.heroes[0].skillIds).toContain('sorcery')
 expect(skill.result?.next.heroes[0].stats.W).toBe(1)
 const spell=planHero({...setSkillInstead(draft,true),mode:'spell',spellId:'spell_of_awakening'},subject,ctx)
 expect(spell.result?.next.heroes[0].flags.spellDifficultyReductions?.spell_of_awakening).toBe(1)
})
