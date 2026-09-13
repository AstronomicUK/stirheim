import type {RosterHenchmanGroup,RosterHero} from '../types/roster'
export const GROUP_HANDLERS:Record<string,{unitId:string;name:string;leavesOnDeath?:boolean}>={
 dark_elves_cold_one_beasthound:{unitId:'dark_elves_beastmaster',name:'Beastmaster',leavesOnDeath:true},
 norse_wolf:{unitId:'norse_wulfen',name:'Wulfen'},
 kislevites_trained_bear:{unitId:'kislevites_bear_tamer',name:'Bear Tamer'},
}
export function absentHandler(group:RosterHenchmanGroup,available:readonly RosterHero[]):string|null {
 const rule=group.campaignState?.trainedSquig ? {unitId:'night_goblins_web_squig_herder',name:'Squig Herder'} : GROUP_HANDLERS[group.unitTemplateId]
 return rule&&!available.some(h=>h.unitTemplateId===rule.unitId)?`${rule.name} is not taking part; these animals stay at camp.`:null
}
