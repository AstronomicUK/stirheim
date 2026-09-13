import type {ReportContext,InjuriesDerived} from './derive'
import type {ReportDraft} from './state'
import {lookupHeroInjury} from '../../../rules/data/campaign/injuries'
export interface MedicalAid {id:string;name:string;kind:'reroll'|'die'|'adjust'}
export function medicalAidOptions(ctx:ReportContext,draft:ReportDraft,injuries:InjuriesDerived,targetId:string):MedicalAid[]{
 const flow=draft.heroInjuries[targetId]
 if(!flow||!flow.rolls.length||flow.extraToughUsed||flow.rolls.at(-1)!.medicine||flow.rolls.at(-1)!.medicalAid)return []
 const options:MedicalAid[]=[]
 for(const h of ctx.roster.heroes){
  if(h.status!=='active'||injuries.heroes.some(r=>r.hero.id===h.id&&['dead','captured','retired'].includes(r.resolution.outcome??'')))continue
  if(draft.medicalAidUsed?.[h.id])continue
  if(h.unitTemplateId==='grave_robbers_junior_medic'&&!draft.heroesOut.includes(h.id)){
   options.push({id:h.id,name:`${h.name}: Sawbones`,kind:'reroll'})
   if(h.equipment.some(i=>i.quantity>0&&(i.itemId==='surgeons_journal'||/surgeon.?s journal/i.test(i.customName??''))))options.push({id:h.id,name:`${h.name}: Surgeon's Journal (instead of Sawbones)`,kind:'adjust'})
  }
  if(h.skillIds.includes('masters_of_horror_skills_surgeon'))options.push({id:h.id,name:`${h.name}: Surgeon`,kind:'die'})
 }
 if(injuries.complete&&ctx.roster.warbandTemplateId==='dwarf_slayer_cult'&&!draft.medicalAidUsed?.damnable_luck&&lookupHeroInjury(flow.rolls.at(-1)!.d66).code==='dead')options.push({id:'damnable_luck',name:'Damnable Luck — one Slayer casualty this battle',kind:'reroll'})
 return options
}
export function applyMedicalAid(draft:ReportDraft,heroId:string,aid:MedicalAid,value:number,face:'tens'|'units'='units'):ReportDraft{
 const flow=draft.heroInjuries[heroId],index=(flow?.rolls.length??0)-1,old=flow?.rolls[index]
 if(!old||flow.extraToughUsed||old.medicine||old.medicalAid||draft.medicalAidUsed?.[aid.id])return draft
 let d66=value
 if(aid.kind!=='reroll'){
  const originalFace=face==='tens'?Math.floor(old.d66/10):old.d66%10
  const nextFace=aid.kind==='adjust'?originalFace+value:value
  if(!Number.isInteger(nextFace)||nextFace<1||nextFace>6||(aid.kind==='adjust'&&Math.abs(value)!==1))return draft
  d66=face==='tens'?nextFace*10+old.d66%10:Math.floor(old.d66/10)*10+nextFace
 }
 try{lookupHeroInjury(d66)}catch{return draft}
 const reason=`${aid.name}: ${aid.kind==='reroll'?'rerolled D66':aid.kind==='die'?`rerolled ${face} die to ${value}`:`adjusted ${face} die by ${value>0?'+':''}${value}`}; D66 ${old.d66} → ${d66}. Replacement stands.`
 return {...draft,medicalAidUsed:{...draft.medicalAidUsed,[aid.id]:heroId},heroInjuries:{...draft.heroInjuries,[heroId]:{...flow,countRoll:index===0?null:flow.countRoll,countRolls:Object.fromEntries(Object.entries(flow.countRolls??{}).filter(([key])=>Number(key)<index)),rolls:[...flow.rolls.slice(0,index),{d66,subRoll:null,source:aid.kind==='reroll'?undefined:old.source,medicalAid:aid.name}],previousAttempts:[...(flow.previousAttempts??[]),{rolls:flow.rolls,countRoll:flow.countRoll,countRolls:flow.countRolls,reason}]}}}
}

/** The Journal and Surgeon say one friendly model, so henchmen use their single injury D6. */
export function groupMedicalAidOptions(ctx:ReportContext,draft:ReportDraft,injuries:InjuriesDerived,groupId:string,index:number):MedicalAid[]{
 if(draft.groupInjuries[groupId]?.[index]==null||draft.groupInjuryRerolls?.[`${groupId}:${index}`])return []
 const target=`group:${groupId}:${index}`
 return medicalAidOptions(ctx,{...draft,heroInjuries:{...draft.heroInjuries,[target]:{rolls:[{d66:41,subRoll:null}],countRoll:null}}},injuries,target).filter(a=>a.kind==='adjust'||a.kind==='die')
}
export function applyGroupMedicalAid(draft:ReportDraft,groupId:string,index:number,aid:MedicalAid,value:number):ReportDraft{
 const key=`${groupId}:${index}`,old=draft.groupInjuries[groupId]?.[index]
 if(old==null||draft.groupInjuryRerolls?.[key]||draft.medicalAidUsed?.[aid.id]||aid.kind==='reroll')return draft
 const result=aid.kind==='adjust'?old+value:value
 if(!Number.isInteger(result)||result<1||result>6||aid.kind==='adjust'&&Math.abs(value)!==1)return draft
 const rolls=[...draft.groupInjuries[groupId]];rolls[index]=result
 return {...draft,groupInjuries:{...draft.groupInjuries,[groupId]:rolls},groupEquipmentLosses:{},brokenWeaponTotals:{},medicalAidUsed:{...draft.medicalAidUsed,[aid.id]:key},groupInjuryRerolls:{...draft.groupInjuryRerolls,[key]:{original:old,result,label:aid.name}}}
}
