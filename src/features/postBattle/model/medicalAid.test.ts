import {expect,it} from 'vitest'
import {makeHero,makeWarband} from '../../../rules/resolve/__tests__/fixtures'
import {findWarbandTemplate} from '../../../rules/data/warbandTemplates'
import {deriveReport,type ReportContext} from './derive'
import {addHeroInjuryRoll,emptyDraft} from './state'
import {applyMedicalAid,medicalAidOptions,groupMedicalAidOptions,applyGroupMedicalAid} from './medicalAid'
const patient=makeHero({id:'patient'}),medic=makeHero({id:'medic',unitTemplateId:'grave_robbers_junior_medic',equipment:[{itemId:'surgeons_journal',quantity:1}]})
const ctx:ReportContext={roster:makeWarband({heroes:[patient,medic]}),template:findWarbandTemplate('mercenaries_reikland'),items:[],matchId:'m',myRating:100,opponentRating:100}
it('shares one use between Journal and Sawbones, and records the actual changed die',()=>{
 const draft=addHeroInjuryRoll(emptyDraft(),patient.id,22,'app')
 const options=medicalAidOptions(ctx,draft,deriveReport(draft,ctx).injuries,patient.id)
 expect(options.map(o=>o.kind)).toEqual(['reroll','adjust'])
 const changed=applyMedicalAid(draft,patient.id,options[1],-1,'tens')
 expect(changed.heroInjuries.patient.rolls[0].d66).toBe(12)
 expect(changed.heroInjuries.patient.previousAttempts?.[0].reason).toContain('adjusted tens die by -1; D66 22 → 12')
 expect(applyMedicalAid(changed,patient.id,options[0],41)).toBe(changed)
 const other=addHeroInjuryRoll(changed,'other',11)
 expect(medicalAidOptions(ctx,other,deriveReport(other,ctx).injuries,'other')).toEqual([])
})
it('does not allow the injured medic to use Sawbones or the Journal',()=>{
 const draft=addHeroInjuryRoll(emptyDraft(),patient.id,22);draft.heroesOut=['medic']
 expect(medicalAidOptions(ctx,draft,deriveReport(draft,ctx).injuries,patient.id)).toEqual([])
})
it('rejects adjustments beyond a die face and invalid replacement dice without spending aid',()=>{
 const draft=addHeroInjuryRoll(emptyDraft(),patient.id,11),aid={id:'medic',name:'Journal',kind:'adjust' as const}
 expect(applyMedicalAid(draft,patient.id,aid,-1,'tens')).toBe(draft)
 expect(applyMedicalAid(draft,patient.id,{...aid,kind:'die'},7)).toBe(draft)
 expect(applyMedicalAid(draft,patient.id,{...aid,kind:'reroll'},70)).toBe(draft)
})
it('offers Damnable Luck only after every casualty is resolved',()=>{
 const local={...ctx,roster:{...ctx.roster,warbandTemplateId:'dwarf_slayer_cult'}}
 const draft=addHeroInjuryRoll(emptyDraft(),patient.id,11);draft.heroesOut=[patient.id,medic.id]
 expect(medicalAidOptions(local,draft,deriveReport(draft,local).injuries,patient.id).some(o=>o.id==='damnable_luck')).toBe(false)
 const done=addHeroInjuryRoll(draft,medic.id,41)
 expect(medicalAidOptions(local,done,deriveReport(done,local).injuries,patient.id).some(o=>o.id==='damnable_luck')).toBe(true)
})

it('shares the Journal allowance across henchmen and Heroes',()=>{
 const draft=addHeroInjuryRoll(emptyDraft(),patient.id,22);draft.groupsOut.group=1;draft.groupInjuries.group=[2]
 const aid=groupMedicalAidOptions(ctx,draft,deriveReport(draft,ctx).injuries,'group',0)
 expect(aid.map(a=>a.kind)).toEqual(['adjust'])
 const next=applyGroupMedicalAid(draft,'group',0,aid[0],1)
 expect(next.groupInjuries.group).toEqual([3])
 expect(next.groupInjuryRerolls?.['group:0']).toMatchObject({original:2,result:3})
 expect(medicalAidOptions(ctx,next,deriveReport(next,ctx).injuries,patient.id)).toEqual([])
 expect(applyGroupMedicalAid(next,'group',0,aid[0],1)).toBe(next)
})
