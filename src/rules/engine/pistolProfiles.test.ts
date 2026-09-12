import { expect, it } from 'vitest'
import { defaultCombatContext, type Character } from '../types'
import { findWeapon } from '../data/weapons'
import { characterToDefenderProfile } from '../domain/opponentScenario'
import { corePistolCombatProfile } from './pistolProfiles'
import { computeAttackCount, effectiveOffensiveStats, buildAttackInput, weaponAttackCounts } from './buildAttackInput'
const hero: Character={id:'hero',name:'Captain',warband:'Test',role:'hero',stats:{M:4,WS:4,BS:2,S:7,T:3,W:1,I:3,A:3,Ld:7},equippedWeapons:[],armour:{type:'none',shield:false,buckler:false},helmet:false,skills:['mighty_blow','pistolier'],traits:['frenzy'],wardSaveThreshold:null,notes:''}
const ctx=defaultCombatContext()
it.each([['pistol',4],['duelling_pistol',4],['warplock_pistol',5]] as const)('uses fixed strength and one WS-based, parryable attack for %s', (id,strength)=>{
 const weapon=corePistolCombatProfile(findWeapon(id)!)!
 const defender=characterToDefenderProfile({...hero,stats:{...hero.stats,WS:3,S:3,T:3},traits:[],skills:[]},[])
 defender.parryWeaponCount=1
 expect(computeAttackCount(hero,weapon,false,ctx)).toBe(1)
 expect(computeAttackCount(hero,weapon,true,ctx)).toBe(1)
 expect(effectiveOffensiveStats(hero,weapon,ctx).strength).toBe(strength)
 const input=buildAttackInput({attacker:hero,weapon,defender,context:ctx})
 expect(input.hitThreshold).toBe(id==='duelling_pistol'?2:3)
 expect(input.parryEligible).toBe(true)
})
it('does not double the pistol bonus for Frenzy or increase brace attacks with A or Pistolier',()=>{
 const pistol=corePistolCombatProfile(findWeapon('pistol')!)!
 const sword=findWeapon('sword')!
 expect(weaponAttackCounts(hero,[sword,pistol],ctx).map(e=>e.count)).toEqual([6,1])
 expect(weaponAttackCounts(hero,[pistol,pistol],ctx).map(e=>e.count)).toEqual([1,1])
})
it('keeps the crossbow pistol opening shot BS-based with the extra -2, not a WS pistol profile',()=>{
 const weapon=corePistolCombatProfile(findWeapon('crossbow_pistol')!)!
 expect(weapon.type).toBe('ranged')
 const defender=characterToDefenderProfile({...hero,traits:[],skills:[]},[])
 const input=buildAttackInput({attacker:hero,weapon,defender,context:ctx})
 expect(input.hitThreshold).toBe(7)
 expect(input.parryEligible).toBe(false)
 expect(computeAttackCount(hero,weapon,true,ctx)).toBe(1)
 expect(corePistolCombatProfile(findWeapon('bow')!)).toBeNull()
})
