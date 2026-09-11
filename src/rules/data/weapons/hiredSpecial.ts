import type {Weapon} from '../../types'
export const HIRED_SPECIAL_WEAPONS: Weapon[] = [
 {id:'veskit_eshin_claws',name:'Veskit’s Eshin Fighting Claws',type:'melee',strength:5,critCategory:'bladed',concussion:false,parry:true,saveModifier:3,special:['twoHanded','veskitTwoParries'],rangedProfile:null},
 {id:'veskit_warplock_pistols',name:'Veskit’s built-in Warplock Pistols',type:'ranged',strength:5,critCategory:'missile',concussion:false,saveModifier:3,special:[],rangedProfile:{shortRange:4,maxRange:8,shotsPerTurn:1}},
 {id:'icefang_axe',name:'Axe of the Icefang',type:'melee',strength:'user',strengthBonus:2,critCategory:'bladed',concussion:false,parry:true,injuryRollModifier:1,special:['twoHanded','strikesLast'],rangedProfile:null},
 {id:'gwen_rolling_pin',name:'Gwen’s Rolling Pin',type:'melee',strength:'user',strengthBonus:1,critCategory:'bludgeoning',concussion:true,special:[],rangedProfile:null},
 {id:'ienh_khain',name:'Ienh-Khain',type:'melee',strength:'user',strengthBonus:1,critCategory:'bladed',concussion:false,parry:true,isSword:true,critTriggerThreshold:5,special:[],rangedProfile:null},
 {id:'ninja_gnoblar_bo',name:'Ninja Gnoblar’s Bo',type:'melee',strength:'user',critCategory:'bludgeoning',concussion:false,parry:true,bonusAttacks:1,special:['twoHanded'],rangedProfile:null},
]
