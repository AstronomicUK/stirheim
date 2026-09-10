import type {Weapon} from '../../types'
export const HIRED_SPECIAL_WEAPONS: Weapon[] = [
 {id:'icefang_axe',name:'Axe of the Icefang',type:'melee',strength:'user',strengthBonus:2,critCategory:'bladed',concussion:false,parry:true,injuryRollModifier:1,special:['twoHanded','strikesLast'],rangedProfile:null},
 {id:'gwen_rolling_pin',name:'Gwen’s Rolling Pin',type:'melee',strength:'user',strengthBonus:1,critCategory:'bludgeoning',concussion:true,special:[],rangedProfile:null},
 {id:'ienh_khain',name:'Ienh-Khain',type:'melee',strength:'user',strengthBonus:1,critCategory:'bladed',concussion:false,parry:true,isSword:true,critTriggerThreshold:5,special:[],rangedProfile:null},
 {id:'ninja_gnoblar_bo',name:'Ninja Gnoblar’s Bo',type:'melee',strength:'user',critCategory:'bludgeoning',concussion:false,parry:true,bonusAttacks:1,special:['twoHanded'],rangedProfile:null},
]
