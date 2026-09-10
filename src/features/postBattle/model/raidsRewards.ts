import type {RosterHenchmanGroup} from '../../../rules/types/roster'
import {resolveGroupInjuries} from './injuries'
export interface RaidsDraft {
 role?:'raider'|'townsfolk';setupConfirmed?:boolean;setupReason?:string
 jewellery?:number|null;inhabitants?:number|null;townsmen?:number|null;burned?:number|null;trackingDie?:number|null
 surrenderedWarriors?:string[];surrenderedGroups?:Record<string,number>
 ambushDie?:number|null;ambush?:{selection:number|null;injury:number|null}[]
}
export interface RaidSurvivors {
 warriors:{id:string;name:string;canSurrender:boolean}[]
 groups:{group:RosterHenchmanGroup;canSurrender:number}[]
}
const whole=(n:number|null|undefined,max=Number.MAX_SAFE_INTEGER):n is number=>n!=null&&Number.isSafeInteger(n)&&n>=0&&n<=max
/** Archive Pestilen Raids: actual spoils, post-raid pursuit and surrender, independent of a generic win/loss label. */
export function raidsRewards(state:RaidsDraft,survivors:RaidSurvivors) {
 const out={gold:0,captives:0,notes:[] as string[],problems:[] as string[],surrenderedWarriors:[] as string[],surrenderedGroups:{} as Record<string,number>,ambushGroups:{} as Record<string,{rolls:number[];group:RosterHenchmanGroup;dead:number}>,ambushed:false,targets:0}
 if(!['raider','townsfolk'].includes(state.role??'')){out.problems.push('Choose whether this roster was the raiding warband or the townsfolk.');return out}
 if(state.role==='townsfolk'){out.notes.push('Townsfolk: no raider jewellery or captive rewards.');return out}
 if(!state.setupConfirmed&&!state.setupReason?.trim())out.problems.push('Confirm the warband had fought at least five battles and was not raiding twice in a row, or record the agreed setup exception.')
 if(state.setupReason?.trim())out.notes.push(`Raids setup exception: ${state.setupReason.trim()}`)
 for(const [label,n] of [['Jewellery',state.jewellery],['Captured Inhabitants',state.inhabitants],['Captured Townsmen',state.townsmen],['Burned buildings',state.burned]] as const)if(!whole(n))out.problems.push(`Record the actual non-negative whole number for ${label}.`)
 if(whole(state.jewellery)){out.gold=state.jewellery*5;out.notes.push(`Raids jewellery: ${state.jewellery} × 5 = ${out.gold} gc.`)}
 if(whole(state.inhabitants)&&whole(state.townsmen)){
  out.captives=Math.floor(state.inhabitants/3)+state.townsmen
  out.notes.push(`Captured: ${state.inhabitants} Inhabitants and ${state.townsmen} Townsmen = ${out.captives} Slaves under the Raids conversion. Each resource is available for one extra exploration die in a future battle, not this report.`)
 }
 const seen=new Set<string>()
 for(const id of state.surrenderedWarriors??[]){
  const w=survivors.warriors.find(w=>w.id===id&&w.canSurrender)
  if(!w||seen.has(id))out.problems.push('Review the distinct surviving warriors who surrendered while still on the table.')
  else{out.surrenderedWarriors.push(id);out.notes.push(`${w.name} surrendered: misses the next two battles.`)}seen.add(id)
 }
 for(const [id,count] of Object.entries(state.surrenderedGroups??{})){
  if(!count)continue
  const g=survivors.groups.find(g=>g.group.id===id)
  if(!g||!whole(count,g.canSurrender))out.problems.push('Surrender only henchmen who were still on the table; review the group counts.')
  else{out.surrenderedGroups[id]=count;out.notes.push(`${g.group.name}: ${count} surrendered; those models miss the next two battles.`)}
 }
 if(!whole(state.trackingDie,6)||state.trackingDie<1){out.problems.push('Record the D6 roll for covering the raiders’ tracks.');return out}
 if(!whole(state.inhabitants)||!whole(state.townsmen)||!whole(state.burned))return out
 const total=state.trackingDie-out.captives+state.burned
 out.ambushed=total<=1
 out.notes.push(`Covering tracks: D6 ${state.trackingDie} − ${out.captives} captured resources + ${state.burned} burned buildings = ${total}; ${out.ambushed?'townsfolk ambush':'not traced'}.`)
 if(!out.ambushed)return out
 const pool=survivors.groups.slice().sort((a,b)=>a.group.id.localeCompare(b.group.id)).flatMap(({group})=>Array.from({length:Math.max(0,group.size-(out.surrenderedGroups[group.id]??0))},(_,i)=>({group,number:i+1})))
 if(!pool.length){out.notes.push('No returning henchmen remain for the townsfolk to ambush.');return out}
 if(!whole(state.ambushDie,6)||state.ambushDie<1){out.problems.push('Roll D6 for the number of henchmen ambushed.');return out}
 out.targets=Math.min(state.ambushDie,pool.length)
 out.notes.push(`Ambush: D6 ${state.ambushDie}; ${out.targets} distinct returning henchmen selected at random from ${pool.length}. Surrendered models and those already dead are excluded.`)
 for(let i=0;i<out.targets;i++){
  const row=state.ambush?.[i]
  if(!row||!whole(row.selection,pool.length)||row.selection<1){out.problems.push(`Record random selection ${i+1}, from 1 to ${pool.length} remaining henchmen.`);break}
  const before=pool.length,picked=pool.splice(row.selection-1,1)[0]
  if(!whole(row.injury,6)||row.injury<1){out.problems.push(`Record the injury D6 for ${picked.group.name}, selected model ${picked.number}.`);continue}
  const previous=out.ambushGroups[picked.group.id],current=previous?.group??picked.group
  const result=resolveGroupInjuries(current,1,[row.injury])
  out.ambushGroups[picked.group.id]={group:result.group,dead:(previous?.dead??0)+result.dead,rolls:[...(previous?.rolls??[]),row.injury]}
  out.notes.push(`Ambush selection ${i+1}: ${row.selection} of ${before} → ${picked.group.name}, model ${picked.number}; injury D6 ${row.injury}: ${result.dead?'lost':'survives'}.`)
 }
 return out
}
