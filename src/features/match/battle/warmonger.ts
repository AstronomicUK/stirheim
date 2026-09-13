import type { BattleLiveState } from '../../../domain/battle'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import type { RosterWarband } from '../../../rules/types/roster'
export const WARMONGER = 'battle_monks_of_cathay_skills_warmonger'
export function withWarmonger(roster: RosterWarband, sheet?: BattleLiveState): RosterWarband {
 const roll=sheet?.warmonger
 if(!roll?.count || roster.henchmenGroups.some(g=>g.id===roll.groupId))return roster
 const unit=findWarbandTemplate('battle_monks_of_cathay')?.henchmanTemplates.find(u=>u.id==='battle_monks_raging_peasants')
 if(!unit)return roster
 return {...roster,henchmenGroups:[...roster.henchmenGroups,{id:roll.groupId,name:'Warmonger Peasants',unitTemplateId:unit.id,size:roll.count,stats:unit.stats,xp:0,levelUps:0,statIncreases:{},equipment:[]}]}
}
