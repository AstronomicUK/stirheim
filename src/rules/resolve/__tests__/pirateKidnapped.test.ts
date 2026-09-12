import {expect,it} from 'vitest'
import {resolvePirateKidnapped,type KidnappedChoice,type KidnappedVictim} from '../pirateKidnapped'
const stats={M:4,WS:4,BS:4,S:3,T:3,W:2,I:4,A:2,Ld:8}
const victim:KidnappedVictim={name:'Captain',kind:'hero',human:true,finalResult:'captured',injuryRoll:61,outOfAction:true,stats,skillIds:['dodge']}
const choice:KidnappedChoice={winner:'draw',captainLeadership:8,pirateRoll:{dice:[3,3]},victimRoll:{dice:[3,3]},crew:{size:0,stats:{...stats,WS:3,W:1,A:1,Ld:7},skillIds:[]}}
it('ties become Swabbies retaining skills/stats but no spells or original equipment',()=>{
 const r=resolvePirateKidnapped(victim,choice)
 expect(r).toMatchObject({outcome:'swabbie',stats,skillIds:['dodge'],spellIds:[],equipment:'captorStash'})
 expect(r.log.join(' ')).toContain('tied')
})
it('the winner bonus changes the contest and Crew replaces the old profile without a fee',()=>{
 const r=resolvePirateKidnapped(victim,{...choice,winner:'pirates'})
 expect(r).toMatchObject({outcome:'crew',pirateTotal:15,victimTotal:14,stats:choice.crew.stats,skillIds:[],equipment:'exchangeForCrewKit'})
 expect(resolvePirateKidnapped(victim,{...choice,winner:'victim'}).outcome).toBe('swabbie')
})
it('requires a Pirate win and successful body recovery for a lost henchman',()=>{
 const h={...victim,kind:'henchman' as const,finalResult:'dead' as const,injuryRoll:2}
 expect(()=>resolvePirateKidnapped(h,choice)).toThrow(/won/)
 expect(resolvePirateKidnapped(h,{...choice,winner:'pirates',recoveredBody:3}).outcome).toBe('notRecovered')
 expect(resolvePirateKidnapped(h,{...choice,winner:'pirates',recoveredBody:4}).outcome).toBe('crew')
 expect(()=>resolvePirateKidnapped({...h,injuryRoll:3},{...choice,winner:'pirates',recoveredBody:4})).toThrow(/survival/)
})
it('never recruits nonhumans, hired characters or a hero who did not roll Captured',()=>{
 expect(()=>resolvePirateKidnapped({...victim,human:false},choice)).toThrow(/human/)
 for(const kind of ['hiredSword','dramatisPersona'] as const)expect(()=>resolvePirateKidnapped({...victim,kind},choice)).toThrow(/cannot be recruited/)
 expect(()=>resolvePirateKidnapped({...victim,injuryRoll:15,finalResult:'dead'},choice)).toThrow(/Captured/)
})
it('rejects full Crew groups and preserves original app dice in the explanation',()=>{
 expect(()=>resolvePirateKidnapped(victim,{...choice,winner:'pirates',crew:{...choice.crew,groupId:'full',size:5}})).toThrow(/four/)
 const r=resolvePirateKidnapped(victim,{...choice,pirateRoll:{dice:[6,6],original:[1,2]}})
 expect(r.log.join(' ')).toContain('app rolled 1 + 2; player changed this to 6 + 6')
})
