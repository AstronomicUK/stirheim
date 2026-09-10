import type { Item } from '../../types/items'

/** Unique carried equipment; never an ordinary trading-post purchase. */
export const HIRED_SPECIAL_ITEMS: Item[] = [
 {id:'ninja_gnoblar_shurikens',name:'Ninja Gnoblar’s Shurikens',category:'missile',weaponId:'throwing_knife',price:{base:null,text:'Ninja Gnoblar equipment'},availability:{kind:'special',text:'Ninja Gnoblar'},description:'Throwing stars with Stealthy: throwing while hidden does not reveal the Ninja unless the target passes an Initiative test.',specialRules:[],scenarioRewardOnly:true,source:{publication:'Mordheimer Information Centre',file:'04-hired-swords.md:2568-2574'}},
 {id:'ienh_khain',name:'Ienh-Khain',category:'melee',weaponId:'ienh_khain',price:{base:null,text:'Aenur equipment'},availability:{kind:'special',text:'Aenur'},description:'Allows parrying, adds +1 Strength and causes critical hits on natural wound rolls of 5–6.',specialRules:[],scenarioRewardOnly:true,source:{publication:'Mordheim Rulebook',file:'05-dramatis-personae.md:184-194'}},
 {id:'ninja_gnoblar_bo',name:'Ninja Gnoblar’s Bo',category:'melee',weaponId:'ninja_gnoblar_bo',price:{base:null,text:'Ninja Gnoblar equipment'},availability:{kind:'special',text:'Ninja Gnoblar'},description:'Adds one attack, may parry and requires both hands.',specialRules:[],scenarioRewardOnly:true,source:{publication:'Mordheimer Information Centre',file:'04-hired-swords.md:2568-2574'}},
 {id:'thief_cloak',name:"Thief's Cloak",category:'misc',price:{base:null,text:'Thief equipment'},availability:{kind:'special',text:'Thief'},description:'Enemy missile attacks suffer -1 to hit. The distance required to spot this hidden thief is doubled.',specialRules:[],scenarioRewardOnly:true,source:{publication:'Town Cryer 19, Khemri',file:'04-hired-swords.md:1588-1594'}},
 {id:'kislev_ranger_cloak',name:'Hunter’s Cloak',category:'misc',price:{base:null,text:'Kislev Ranger equipment'},availability:{kind:'special',text:'Kislev Ranger'},description:'Shooting does not reveal the hidden Ranger unless the target passes an Initiative test.',specialRules:[],scenarioRewardOnly:true,source:{publication:'Fanatic Magazine 6',file:'04-hired-swords.md:1224-1232'}},
 {id:'dark_emissary_spiral',name:'The Spiral',category:'misc',price:{base:null,text:'Dark Emissary equipment'},availability:{kind:'special',text:'Dark Emissary'},description:'Grants a 5+ save which cannot be reduced by anything.',specialRules:[],scenarioRewardOnly:true,source:{publication:'Town Cryer 15, Albion',file:'05-dramatis-personae.md:579-581'}},
 {id:'truthsayer_triskele',name:'The Triskele',category:'misc',price:{base:null,text:'Truthsayer equipment'},availability:{kind:'special',text:'Truthsayer'},description:'Grants a 4+ save which cannot be reduced by anything.',specialRules:[],scenarioRewardOnly:true,source:{publication:'Town Cryer 15, Albion',file:'05-dramatis-personae.md:821-823'}},
 {id:'dark_emissary_staff',name:'Staff of Darkness',category:'misc',price:{base:null,text:'Dark Emissary equipment'},availability:{kind:'special',text:'Dark Emissary'},description:'Adds +1 to casting rolls.',specialRules:[],scenarioRewardOnly:true,source:{publication:'Town Cryer 15, Albion',file:'05-dramatis-personae.md:579-579'}},
]

/** Exact legacy custom names only; do not interpret arbitrary custom kit as magic. */
export function legacyHiredItemId(name: string | undefined): string | undefined {
 const aliases:Record<string,string>={"shurikens (throwing stars with stealthy special rule)":"ninja_gnoblar_shurikens","enormous sword known as ienh-khain":"ienh_khain","bo (gives an additional attack, may parry and requires both hands)":"ninja_gnoblar_bo"}
 return aliases[name?.trim().toLowerCase()??''] ?? HIRED_SPECIAL_ITEMS.find(item=>item.name.toLowerCase()===name?.trim().toLowerCase())?.id
}
