import type { Json } from '../../api/database.types'
import type { CampaignActivity } from '../../api/campaigns'
import { findItem } from '../../rules/data/items'
import type { FieldChange } from './activity'

type Row=Record<string,Json|undefined>
const row=(v:Json|undefined|null):Row=>v && typeof v==='object' && !Array.isArray(v)?v:{}
const list=(v:Json|undefined):Row[]=>Array.isArray(v)?v.map(x=>row(x)):[]
const strings=(v:Json|undefined):string[]=>Array.isArray(v)?v.filter((x):x is string=>typeof x==='string'):[]
const text=(v:Json|undefined,fallback='')=>typeof v==='string'?v:fallback
const number=(v:Json|undefined)=>typeof v==='number'?v:null
const dice=(v:Json|undefined)=>Array.isArray(v)?v.filter(x=>typeof x==='number').join(', '):''

/** Render report facts, not the implementation patches used to apply them. */
export function reportActivityChanges(entry:CampaignActivity):FieldChange[]{
 const before=row(entry.before),after=row(entry.after),record=entry.action==='delete'?before:after
 const changed=(key:string)=>entry.action!=='update'||JSON.stringify(before[key])!==JSON.stringify(after[key])
 const out:FieldChange[]=[]
 const add=(label:string,sentence:string,details?:string)=>out.push({label,before:'',after:'',...(details?{details}:{}),sentence:entry.action==='delete'?`Removed record: ${sentence}`:sentence})
 if(entry.action==='update'){
  for(const [key,label] of [['xp_log','experience award'],['ooa','out-of-action entry'],['injuries','injury entry']] as const){
   if(!changed(key))continue
   const remaining=list(after[key]).map(item=>`${text(item.subjectType)}:${text(item.subjectId)||text(item.subjectName)}`)
   list(before[key]).forEach((item,i)=>{
    const identity=`${text(item.subjectType)}:${text(item.subjectId)||text(item.subjectName)}`
    const index=remaining.indexOf(identity)
    if(index>=0)remaining.splice(index,1)
    else add(`Removed ${key} ${i}`,`Removed ${text(item.subjectName,'a warrior')}’s previously recorded ${label} from this report.`)
   })
  }
  for(const [key,label] of [['notes','report notes'],['adjustments','player adjustments'],['veteran_pool_roll','veteran recruit experience pool']] as const){
   if(changed(key)&&before[key]!=null&&JSON.stringify(before[key])!==JSON.stringify(key==='adjustments'?[]:'')&&(after[key]==null||after[key]===''||(key==='adjustments'&&!list(after[key]).length)))add(`Removed ${key}`,`Cleared the previously recorded ${label}.`)
  }
  if(changed('exploration')&&before.exploration&&!after.exploration)add('Removed exploration','Removed the previously recorded exploration result from this report.')
 }
 if(changed('result')&&record.result)add('Battle result',`Battle result: ${text(record.result)}.`)
 if(changed('routed')&&typeof record.routed==='boolean')add('Rout',record.routed?'The warband routed.':'The warband did not rout.')
 if(changed('status')&&record.status)add('Report status',`Report status: ${text(record.status).replace(/_/g,' ')}.`)
 if(changed('xp_log'))list(record.xp_log).forEach((xp,i)=>{
  const name=text(xp.subjectName,'Warrior'), amount=number(xp.amount),from=number(xp.xpBefore),to=number(xp.xpAfter)
  const reasons=strings(xp.reasons).join('; '),advances=number(xp.advancesEarned)
  add(`Experience ${i}`,`${name}: ${amount===null?'experience recorded':`${amount>=0?'+':''}${amount} XP`}${from!==null&&to!==null?` (${from} → ${to})`:''}.${reasons?` ${reasons}.`:''}${advances?` ${advances} ${advances===1?'advance':'advances'} earned.`:''}`)
 })
 if(changed('ooa'))list(record.ooa).forEach((casualty,i)=>add(`Out of action ${i}`,`${text(casualty.subjectName,'Warrior')}: ${number(casualty.count)??1} taken out of action${strings(casualty.by).length?` by ${strings(casualty.by).join(', ')}`:''}.`))
 if(changed('injuries'))list(record.injuries).forEach((injury,i)=>{
  const name=text(injury.subjectName,'Warrior'),rolls=dice(injury.rolls)
  const result=text(injury.injuryName)|| (number(injury.dead)!==null?`${number(injury.dead)} ${number(injury.dead)===1?'model':'models'} died`:text(injury.outcome,'injury recorded'))
  const pits=text(injury.injuryCode)==='sold_to_the_pits'||/sold to the pits/i.test(result)
  add(`Injury ${i}`,`${name}: ${result}.${rolls?` Injury dice: ${rolls}.`:''}${pits?' A pit fight must be resolved.':''}`,text(injury.effect))
 })
 if(changed('exploration')&&record.exploration){
  const e=row(record.exploration),rolls=dice(e.rolls),location=text(e.locationName)
  add('Exploration',`Exploration${location?`: ${location}`:''}.${rolls?` Dice: ${rolls}.`:''}${number(e.total)!==null?` Total: ${e.total}.`:''}${number(e.shards)!==null?` Wyrdstone: ${e.shards}.`:''}${number(e.goldFound)!==null?` Gold found: ${e.goldFound} gc.`:''}`)
  strings(e.notes).forEach((note,i)=>add(`Exploration note ${i}`,note))
  list(e.itemsFound).forEach((item,i)=>add(`Exploration item ${i}`,`Found ${number(item.quantity)??1} × ${text(item.custom_name)||findItem(text(item.item_rules_id))?.name||'item'}.`))
 }
 if(changed('veteran_pool_roll')&&number(record.veteran_pool_roll)!==null)add('Veteran recruits',`Veteran recruit experience pool: ${record.veteran_pool_roll}.`)
 if(changed('adjustments'))list(record.adjustments).forEach((a,i)=>add(`Adjustment ${i}`,`${text(a.label,'Player adjustment')}: used ${text(a.used,'a recorded result')} instead of ${text(a.suggested,'the suggested result')}.${text(a.reason)?` Reason: ${a.reason}`:''}`))
 if(changed('notes')&&text(record.notes).trim())add('Report notes',text(record.notes))
 if(changed('applied')){
  const old=row(row(before.applied).warband),wb=row(row(record.applied).warband)
  for(const [key,label,unit] of [['gold_delta','Treasury','gc'],['wyrdstone_delta','Wyrdstone','shards']] as const){
   const value=number(wb[key]);if(value!==null&&(value!==0||(entry.action==='update'&&number(old[key])!==null&&old[key]!==0))&&(entry.action!=='update'||old[key]!==wb[key]))add(`Applied ${label}`,`${label}: ${value>0?'+':''}${value} ${unit} in this report.`)
  }
 }
 return out
}
