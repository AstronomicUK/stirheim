import {expect,it} from 'vitest'
import {defaultCombatContext,type Character} from '../types'
import {findWeapon} from '../data/weapons'
import {characterToDefenderProfile} from '../domain/opponentScenario'
import {buildAttackInput} from './buildAttackInput'
it('gives Ancient Armour its unmodified 5+ save only against non-magical attacks',()=>{
 const hero:Character={id:'dame',name:'Dame',warband:'Mare',role:'hero',stats:{M:4,WS:4,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:8},equippedWeapons:[],armour:{type:'none',shield:false,buckler:false},helmet:false,skills:[],traits:['ancient_armour'],wardSaveThreshold:null,notes:''}
 const defender=characterToDefenderProfile(hero,[])
 const sword=findWeapon('sword')!
 const normal=buildAttackInput({attacker:hero,defender,weapon:sword,context:defaultCombatContext()})
 const magical=buildAttackInput({attacker:hero,defender,weapon:{...sword,special:[...sword.special,'magical']},context:defaultCombatContext()})
 expect(normal.wardSaveThreshold).toBe(5)
 expect(magical.wardSaveThreshold).toBeUndefined()
})
