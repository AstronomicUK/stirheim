import type {ReportApplied} from '../../../domain'
import type {WarbandTemplate} from '../../../rules/types'
import type {RosterWarband} from '../../../rules/types/roster'
import {recruitmentBlock} from '../../../rules/resolve/recruitment'
import {unitStartingStats,startingLevelUps} from '../../../rules/resolve/builder'
import type {RockConscript} from './rockRewards'
export function rockConscripts(rows:RockConscript[],roster:RosterWarband,template?:WarbandTemplate) {
 const out={newGroups:[] as NonNullable<ReportApplied['new_groups']>,awardedItems:[] as NonNullable<ReportApplied['awarded_items']>,notes:[] as string[],problems:[] as string[]}
 if(roster.warbandTemplateId!=='sisters_of_sigmar'){if(rows.length)out.problems.push('Only Sisters of Sigmar may retain conscripted Sisters.');return out}
 const unit=template?.henchmanTemplates.find(u=>u.id==='sisters_of_sigmar_sigmarite_sister')
 let current=roster
 const patrols=new Map<string,number>(),ids=new Set<string>()
 for(const [i,row] of rows.entries()) {
  const label=`Conscript ${i+1}`,patrol=row.patrol.trim()
  if(!patrol||row.dice.length!==2||row.dice.some(d=>d==null||!Number.isInteger(d)||d<1||d>6)||row.leadership==null||!Number.isInteger(row.leadership)||row.leadership<1||row.leadership>10){out.problems.push(`${label}: name the patrol and enter the Matriarch’s Leadership and both test dice.`);continue}
  if(!row.eligiblePatrol)out.problems.push(`${label}: confirm the patrol was not led by a Matriarch.`)
  const total=row.dice.reduce<number>((n,d)=>n+d!,0),passed=total<=row.leadership
  if(passed){const key=patrol.toLowerCase();patrols.set(key,(patrols.get(key)??0)+1);if(patrols.get(key)!>2)out.problems.push(`${patrol}: at most two Sisters can be conscripted from each patrol, and no patrol led by a Matriarch is eligible.`)}
  if(!['hammers','whip'].includes(row.kit)){out.problems.push(`${label}: record the Sister’s declared weapons.`);continue}
  out.notes.push(`${label}, patrol ${patrol}: Leadership ${row.leadership}, 2D6 ${row.dice.join(' + ')} = ${total}, ${passed?'passed':'failed'}; ${row.survived?'survived':'did not survive'}; ${row.retain?'retained':'not retained'}; ${row.kit==='hammers'?'two Sigmarite warhammers':'Sigmarite warhammer and steel whip'}. Patrol confirmed not led by a Matriarch.`)
  if(!row.retain)continue
  if(!passed||!row.survived){out.problems.push(`${label}: only a successfully conscripted surviving Sister can join permanently.`);continue}
  if(!unit||!template){out.problems.push('Load the Sisters’ recruitment template.');continue}
  const block=recruitmentBlock(current,template,unit,1)
  if(block){out.problems.push(block);continue}
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.id)||ids.has(row.id)||current.henchmenGroups.some(g=>g.id===row.id)){out.problems.push('Confirm distinct new conscript groups.');continue}
  ids.add(row.id)
  const group={id:row.id,name:`Conscripted Sister ${i+1}`,unit_type_rules_id:unit.id,size:1,stats:unitStartingStats(unit),xp:unit.startingExperience,level_ups:startingLevelUps(unit,'henchman')}
  out.newGroups.push(group)
  current={...current,henchmenGroups:[...current.henchmenGroups,{id:group.id,name:group.name,unitTemplateId:unit.id,size:1,stats:group.stats,xp:group.xp,levelUps:group.level_ups,statIncreases:{},equipment:[]}]}
  out.awardedItems.push({holder_type:'group',holder_id:group.id,item_rules_id:'sigmarite_warhammer',custom_name:null,quantity:row.kit==='hammers'?2:1,notes:'Retained conscript’s declared weapons.'})
  if(row.kit==='whip')out.awardedItems.push({holder_type:'group',holder_id:group.id,item_rules_id:'steel_whip',custom_name:null,quantity:1,notes:'Retained conscript’s declared weapons.'})
 }
 return out
}
