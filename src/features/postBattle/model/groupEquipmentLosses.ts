import type { ReportApplied } from '../../../domain'
import { findItem } from '../../../rules/data/items'
import type { ReportContext, InjuriesDerived } from './derive'
import type { ReportDraft } from './state'

/** Rulebook, Death of a Warrior: dead henchmen lose their own equipment, never survivors' kit. */
export function groupEquipmentLosses(ctx: ReportContext, draft: ReportDraft, injuries: InjuriesDerived, applied: ReportApplied, enabled=true) {
  const out={patches:[] as ReportApplied['item_patches'], problems:[] as string[], notes:[] as string[], captureRows:[] as {key:string;name:string;modelName:string;available:number;quantity:number|null;manual:boolean}[], rows:[] as {key:string;name:string;groupName:string;dead:number;available:number;lost:number|null;manual:boolean}[]}
  if(!enabled)return out
  for(const casualty of injuries.groups) {
    if(!casualty.resolution.complete)continue
    if(casualty.resolution.line)casualty.resolution.line.equipmentLost=[]
    const captures=casualty.resolution.line?.captured??[]
    for(const capture of captures)capture.kit=[]
    const dead=casualty.group.size-casualty.resolution.group.size
    if(dead<=0)continue
    for(const item of ctx.items.filter(i=>i.holder_type==='group'&&i.holder_id===casualty.group.id)) {
      if(applied.remove_item_ids.includes(item.id))continue
      const prior=applied.item_patches.find(p=>p.id===item.id)
      if(prior?.holder_type&&prior.holder_type!=='group')continue
      const available=prior?.quantity??item.quantity
      if(available===0)continue
      const name=(item.item_rules_id?findItem(item.item_rules_id)?.name:undefined)??item.custom_name??'Equipment'
      const key=`${item.id}:${casualty.group.size}:${dead}:${available}`
      const allDead=dead===casualty.group.size
      const manual=!allDead&&(item.quantity%casualty.group.size!==0||available!==item.quantity||casualty.group.unitTemplateId==='pirates_swabbie'||ctx.roster.warbandTemplateId==='pit_fighters')
      const lost=allDead?available:manual?draft.groupEquipmentLosses?.[key]??null:item.quantity/casualty.group.size*dead
      out.rows.push({key,name,groupName:casualty.group.name,dead,available,lost,manual})
      if(lost===null||!Number.isInteger(lost)||lost<0||lost>available) {out.problems.push(`${casualty.group.name}: record how many ${name} were lost with the dead or captured models (0–${available}).`);continue}
      casualty.resolution.line?.equipmentLost?.push({sourceItemId:item.id,quantity:lost})
      let allocated=0
      for(const capture of captures){
        const captureKey=`${capture.eventId}:${key}`
        const captureManual=manual||item.quantity%casualty.group.size!==0||available!==item.quantity
        const quantity=captureManual ? draft.capturedEquipment?.[captureKey]??null : item.quantity/casualty.group.size
        out.captureRows.push({key:captureKey,name,modelName:`${casualty.group.name}, captured casualty ${capture.modelIndex}`,available:lost,quantity,manual:captureManual})
        if(quantity===null||!Number.isInteger(quantity)||quantity<0||quantity>lost){out.problems.push(`${casualty.group.name}: record ${name} carried by captured casualty ${capture.modelIndex} (0–${lost}).`);continue}
        allocated+=quantity
        if(quantity>0)capture.kit.push({sourceItemId:item.id,itemId:item.item_rules_id,...(item.custom_name?{customName:item.custom_name}:{}),quantity,...(item.notes?{notes:item.notes}:{})})
      }
      if(captures.length && casualty.resolution.dead===0 && allocated<lost)out.problems.push(`${casualty.group.name}: allocate all ${lost} lost ${name} to the captives; no model died.`)
      if(allocated>lost)out.problems.push(`${casualty.group.name}: captives cannot carry more ${name} than the ${lost} removed from this group.`)
      out.patches.push({id:item.id,quantity:available-lost})
      out.notes.push(`${casualty.group.name}: ${casualty.resolution.dead} dead${captures.length?`, ${captures.length} captured`:""}; ${lost} ${name} lost, ${available-lost} retained${manual?' (recorded allocation of mixed or used equipment)':''}.`)
    }
  }
  return out
}
