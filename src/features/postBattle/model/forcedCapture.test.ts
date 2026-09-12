import {expect,it} from 'vitest'
import {battleEventRowSchema, attackSummary} from '../../../domain/battleEvent'
import {makeHero,makeWarband,makeHiredSword} from '../../../rules/resolve/__tests__/fixtures'
import {deriveInjuries} from './derive'
import {participantsOf} from './participants'
import {emptyDraft,setInjurySkip} from './state'
const id='11111111-1111-4111-8111-111111111111',enemy='22222222-2222-4222-8222-222222222222'
const hero=makeHero(),roster=makeWarband({id,heroes:[hero],henchmenGroups:[],hiredSwords:[]})
const event=battleEventRowSchema.parse({id,match_id:id,actor_id:enemy,actor_warband_id:enemy,at:'2026-09-12T12:00:00Z',kind:'attack',summary:'Capture',reverted_at:null,reverted_by:null,revert_note:null,payload:{attacker_warband_id:enemy,attacker_id:'captor',attacker_kind:'hero',attacker_name:'Master Moulder',target_warband_id:id,target_id:hero.id,target_kind:'hero',target_name:hero.name,out_of_action:true,capture_reason:'subjugator'}})
const draft={...emptyDraft(),heroesOut:[hero.id]}
const run=(events=[event],d=draft)=>deriveInjuries(d,participantsOf(roster,undefined),id,roster,null,null,events)
it('carries the saved capture event into the report without asking for or inventing dice',()=>{
 const result=run().heroes[0].resolution
 expect(result.hero.status).toBe('captured')
 expect(result.line).toMatchObject({rolls:[],outcome:'captured',injuryCode:'captured'})
 expect(result.line?.effect).toContain('Master Moulder')
 expect(result.pending.kind).toBe('done')
 expect(attackSummary(event.payload)).toContain('no Serious Injury roll')
})
it('reverting the event or a different target never forces a capture',()=>{
 expect(run([{...event,reverted_at:event.at}]).heroes[0].resolution.pending.kind).not.toBe('done')
 expect(run([{...event,payload:{...event.payload,target_warband_id:enemy}}]).heroes[0].resolution.pending.kind).not.toBe('done')
})
it('preserves a reasoned player override of the forced injury',()=>{
 const result=run([event],setInjurySkip(draft,hero.id,'GM confirmed the wielder no longer carried the Thingcatcher')).heroes[0].resolution
 expect(result.hero.status).toBe('active')
 expect(result.line?.effect).toContain('GM confirmed')
})

it('the forced result also replaces an ordinary hired sword survival die',()=>{
 const hired=makeHiredSword({id:'hired',hiredSwordId:'pit_fighter'})
 const band={...roster,heroes:[],hiredSwords:[hired]}
 const injury=deriveInjuries({...emptyDraft(),heroesOut:[hired.id]},participantsOf(band,undefined),id,band,null,null,[{...event,payload:{...event.payload,target_id:hired.id}}]).hiredSwords[0].resolution
 expect(injury.sword.status).toBe('captured')
 expect(injury.line).toMatchObject({subjectType:'hiredSword',rolls:[],outcome:'captured'})
})

 it('ignores a capture from another match even when the same warrior fought',()=>{
 expect(run([{...event,match_id:enemy}]).heroes[0].resolution.pending.kind).not.toBe('done')
 })

it('a captured companion bypasses its injury die and appears in the capture summary',()=>{
 const handler=makeHero({equipment:[{itemId:'wardogs',quantity:1}]}),band=makeWarband({id,heroes:[handler]})
 const animalId=`animal:${handler.id}:wardogs:1`
 const saved={...event,payload:{...event.payload,target_id:animalId}}
 const d={...emptyDraft(),animalsOut:[animalId],animalInjuries:{[animalId]:1}}
 const result=deriveInjuries(d,participantsOf(band,undefined),id,band,null,null,[saved])
 expect(result.animals[0]).toMatchObject({roll:null,dead:false,capture:{event:{id}}})
 expect(result.summary).toMatchObject({captured:1,pending:0,henchmenDead:0})
 const reverted=deriveInjuries(d,participantsOf(band,undefined),id,band,null,null,[{...saved,reverted_at:event.at}])
 expect(reverted.animals[0]).toMatchObject({roll:1,dead:true})
})

it('a Man-catcher capture keeps its own rule name and does not fabricate an injury die',()=>{
 const saved={...event,payload:{...event.payload,capture_reason:'man_catcher' as const,attacker_name:'Gaoler'}}
 const result=run([saved]).heroes[0].resolution
 expect(result.hero.status).toBe('captured')
 expect(result.line).toMatchObject({rolls:[],injuryName:'Captured — Man-catcher',outcome:'captured'})
 expect(result.line?.effect).toContain('Gaoler')
 expect(attackSummary(saved.payload)).toContain('with Man-catcher')
 expect(attackSummary(saved.payload)).not.toContain('Subjugator')
})

it('ordinary Man-catchers never bypass a companion’s animal injury rule',()=>{
 const handler=makeHero({equipment:[{itemId:'wardogs',quantity:1}]}),band=makeWarband({id,heroes:[handler]})
 const animalId=`animal:${handler.id}:wardogs:1`
 const saved={...event,payload:{...event.payload,target_id:animalId,capture_reason:'man_catcher' as const}}
 const result=deriveInjuries({...emptyDraft(),animalsOut:[animalId],animalInjuries:{[animalId]:1}},participantsOf(band,undefined),id,band,null,null,[saved])
 expect(result.animals[0]).toMatchObject({roll:1,dead:true})
 expect(result.animals[0].capture).toBeUndefined()
})
