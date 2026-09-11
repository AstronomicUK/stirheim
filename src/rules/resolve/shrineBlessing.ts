import type {Weapon} from '../types'
export const SHRINE_BLESSING = 'Shrine blessing: wounds Undead and Possessed on 2+.'
export function shrineBlessed(notes?:string):boolean {return !!notes?.includes(SHRINE_BLESSING)}
export function blessWeapon(weapon:Weapon):Weapon {return {...weapon,name:`Blessed ${weapon.name}`,choiceId:`${weapon.choiceId??weapon.id}:shrine`,shrineBlessed:true}}
export function weaponChoiceKey(weapon:Weapon):string {return weapon.choiceId??weapon.id}
