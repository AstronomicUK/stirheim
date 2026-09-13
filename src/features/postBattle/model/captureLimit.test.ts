import {deriveInjuries} from './derive'
import {participantsOf} from './participants'
import {makeWarband} from '../../../rules/resolve/__tests__/fixtures'
import {expect,it} from 'vitest'
import {makeHero} from '../../../rules/resolve/__tests__/fixtures'
import {resolveHeroInjuryFlow} from './injuries'
import {addHeroInjuryRoll,emptyDraft} from './state'
const hero=makeHero(),reason='The Cavalcade already holds five Captured Thralls.'
it('requires another D66 at the capture limit and preserves the original app roll',()=>{
 let draft=addHeroInjuryRoll(emptyDraft(),hero.id,61,'app')
 const first=resolveHeroInjuryFlow(hero,draft.heroInjuries[hero.id],undefined,null,reason)
 expect(first.pending.kind).toBe('d66');expect(first.hero.status).toBe('active');expect(first.line).toBeNull()
 draft=addHeroInjuryRoll(draft,hero.id,41,'app',first.steps.at(-1)?.captureRerollReason)
 // A later roster change must not turn the rejected result back into a capture.
 const result=resolveHeroInjuryFlow(hero,draft.heroInjuries[hero.id])
 expect(result.outcome).toBe('recovered');expect(result.line?.rolls).toEqual([61,41])
 expect(result.line?.effect).toContain(reason)
 expect(result.line?.rollHistory?.join(' ')).toContain('D66 61 (app roll)')
})
it('allows normal Captured results when no special limit applies',()=>{
 expect(resolveHeroInjuryFlow(hero,{rolls:[{d66:61,subRoll:null}],countRoll:null}).outcome).toBe('captured')
})
it('repeated Captured results continue to require a reroll',()=>{
 expect(resolveHeroInjuryFlow(hero,{rolls:[{d66:61,subRoll:null},{d66:61,subRoll:null}],countRoll:null},undefined,null,reason).pending.kind).toBe('d66')
})

it('counts two Hero captures within the same pending report and rerolls the third',()=>{
 const heroes=[hero,makeHero({id:'second'}),makeHero({id:'third'})],roster=makeWarband({heroes})
 let draft={...emptyDraft(),heroesOut:heroes.map(h=>h.id)}
 for(const h of heroes)draft=addHeroInjuryRoll(draft,h.id,61,'app')
 const result=deriveInjuries(draft,participantsOf(roster,undefined),'match',roster,null,null,[],{byWarband:{enemy:{capturedThralls:0,capturedThisBattle:0}},captorByHero:Object.fromEntries(heroes.map(h=>[h.id,'enemy']))})
 expect(result.heroes.map(h=>h.resolution.outcome)).toEqual(['captured','captured',null])
 expect(result.heroes[2].resolution.pending.kind).toBe('d66')
})
