import type {BattleLiveState} from '../../../domain/battle'
import type {RosterWarband} from '../../../rules/types/roster'
export type LeadershipKind='fear'|'allAlone'|'stupidity'|'rout'|'other'
export interface LeadershipBenefit {key:string;label:string;kind:'rerollFailed'|'rerollAny'|'immune';range?:number;bearer:string;itemId:string}
export function nagarytheCaptured(roster:RosterWarband,sheet:BattleLiveState|undefined):boolean {
 if(roster.warbandTemplateId!=='shadow_warriors'||!sheet)return false
 if(sheet.preBattle['nagarythe:captured']==='yes')return true
 const bearers=[...roster.heroes,...roster.henchmenGroups.filter(g=>g.size>0)]
 return bearers.some(w=>w.equipment.some(i=>i.itemId==='standard_of_nagarythe'&&i.quantity>0) && (sheet.tallies.find(t=>t.id===w.id)?.outOfAction??0)>=('size' in w?w.size:1))
}
/** Range is always a table input; never infer distance from inventory ownership. */
export function leadershipItemBenefits(roster:RosterWarband,sheet:BattleLiveState,warriorId:string,kind:LeadershipKind):LeadershipBenefit[] {
 const target=[...roster.heroes,...roster.hiredSwords,...roster.henchmenGroups].find(w=>w.id===warriorId)
 if(!target)return []
 const own=!roster.hiredSwords.some(w=>w.id===warriorId),benefits:LeadershipBenefit[]=[]
 const holders=[...roster.heroes.filter(h=>h.status==='active'),...roster.hiredSwords.filter(h=>h.status==='active'),...roster.henchmenGroups.filter(g=>g.size>0)]
 for(const holder of holders) {
  if((sheet.tallies.find(t=>t.id===holder.id)?.outOfAction??0)>=('size' in holder?holder.size:1))continue
  for(const item of holder.equipment.filter(i=>i.quantity>0)) {
   const itemId=item.itemId??'',key=`${holder.id}:${itemId}`
   if(itemId==='sashimono'&&holder.id===warriorId&&kind!=='rout')benefits.push({key,label:'Sashimono',kind:'rerollAny',bearer:holder.name,itemId})
   if(['banner','clan_pestilens_banner'].includes(itemId)&&kind==='allAlone')benefits.push({key,label:itemId==='banner'?'Banner':'Clan Pestilens Banner',kind:'rerollFailed',range:12,bearer:holder.name,itemId})
   if(itemId==='jolly_roger'&&kind==='allAlone'&&own&&roster.warbandTemplateId==='pirates'&&'unitTemplateId' in target&&target.unitTemplateId!=='pirates_swabbie')benefits.push({key,label:'Jolly Roger',kind:'immune',range:12,bearer:holder.name,itemId})
   if(itemId==='standard_of_nagarythe'&&own&&roster.warbandTemplateId==='shadow_warriors'&&!nagarytheCaptured(roster,sheet))benefits.push({key,label:'Standard of Nagarythe',kind:'rerollFailed',range:12,bearer:holder.name,itemId})
  }
 }
 return benefits.filter((b,i)=>benefits.findIndex(other=>other.key===b.key)===i)
}
