import { expect, it } from 'vitest'
import { findWarbandTemplate } from '../../data/warbandTemplates'
import { appointLeader } from '../succession'
import { canCreateNecrarchThrall, createNecrarchThrall } from '../necrarchSuccession'
import { canRecruit } from '../recruitment'
import type { RosterHero, RosterWarband } from '../../types/roster'
const template=findWarbandTemplate('necrarchs_the_soul_stealers')!
const stats={M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7}
const hero=(id:string,unitTemplateId:string,status:RosterHero['status']='active'):RosterHero=>({id,name:id,unitTemplateId,status,stats,xp:9,levelUps:3,skillIds:['dodge'],skillTableIds:['academic','speed'],spellIds:[],injuries:[],flags:{},equipment:[{itemId:'dagger',quantity:1}]})
const roster:RosterWarband={id:'w',name:'Necrarchs',warbandTemplateId:template.id,gold:1000,wyrdstone:0,veteranPool:null,heroes:[hero('old','necrarchs_necrarch_vampire','dead'),hero('thrall','necrarchs_thrall'),hero('acolyte','necrarchs_acolytes')],henchmenGroups:[],hiredSwords:[],stash:[]}
it('creates a Thrall only after succession, keeping the same Acolyte identity and earned profile',()=>{
 expect(canCreateNecrarchThrall(roster)).toBe(false)
 const succeeded=appointLeader(roster,template,'thrall').value
 expect(canCreateNecrarchThrall(succeeded)).toBe(true)
 const next=createNecrarchThrall(succeeded,'acolyte').value
 expect(next.heroes.find(h=>h.id==='acolyte')).toMatchObject({...roster.heroes[2],unitTemplateId:'necrarchs_thrall'})
 expect(next.heroes).toHaveLength(3)
 expect(canCreateNecrarchThrall(next)).toBe(false)
 expect(()=>createNecrarchThrall(next,'acolyte')).toThrow()
 expect(canRecruit(succeeded,template,'necrarchs_necrarch_vampire').ok).toBe(false)
 expect(canRecruit(succeeded,template,'necrarchs_thrall').ok).toBe(false)
})
it('rejects direct Acolyte succession and does not revive a warband with both Vampires dead',()=>{
 expect(()=>appointLeader(roster,template,'acolyte')).toThrow()
 const gone={...roster,heroes:roster.heroes.map(h=>h.id==='thrall'?{...h,status:'dead' as const}:h)}
 expect(canCreateNecrarchThrall(gone)).toBe(false)
 expect(()=>createNecrarchThrall(gone,'acolyte')).toThrow()
})
