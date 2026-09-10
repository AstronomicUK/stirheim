import type { Item } from '../../types/items'

/** Unique carried equipment; never an ordinary trading-post purchase. */
export const HIRED_SPECIAL_ITEMS: Item[] = [
 {id:'dark_emissary_spiral',name:'The Spiral',category:'misc',price:{base:null,text:'Dark Emissary equipment'},availability:{kind:'special',text:'Dark Emissary'},description:'Grants a 5+ save which cannot be reduced by anything.',specialRules:[],scenarioRewardOnly:true,source:{publication:'Town Cryer 15, Albion',file:'05-dramatis-personae.md:579-581'}},
 {id:'truthsayer_triskele',name:'The Triskele',category:'misc',price:{base:null,text:'Truthsayer equipment'},availability:{kind:'special',text:'Truthsayer'},description:'Grants a 4+ save which cannot be reduced by anything.',specialRules:[],scenarioRewardOnly:true,source:{publication:'Town Cryer 15, Albion',file:'05-dramatis-personae.md:821-823'}},
 {id:'dark_emissary_staff',name:'Staff of Darkness',category:'misc',price:{base:null,text:'Dark Emissary equipment'},availability:{kind:'special',text:'Dark Emissary'},description:'Adds +1 to casting rolls.',specialRules:[],scenarioRewardOnly:true,source:{publication:'Town Cryer 15, Albion',file:'05-dramatis-personae.md:579-579'}},
]

/** Exact legacy custom names only; do not interpret arbitrary custom kit as magic. */
export function legacyHiredItemId(name: string | undefined): string | undefined {
 return HIRED_SPECIAL_ITEMS.find(item=>item.name.toLowerCase()===name?.trim().toLowerCase())?.id
}
