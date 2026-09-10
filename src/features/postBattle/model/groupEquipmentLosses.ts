import type { ReportApplied } from '../../../domain'
import { findItem } from '../../../rules/data/items'
import type { ReportContext, InjuriesDerived } from './derive'
import type { ReportDraft } from './state'

/** Rulebook, Death of a Warrior: dead henchmen lose their own equipment, never survivors' kit. */
export function groupEquipmentLosses(ctx: ReportContext, draft: ReportDraft, injuries: InjuriesDerived, applied: ReportApplied, enabled=true) {
  const out={patches:[] as ReportApplied['item_patches'], problems:[] as string[], notes:[] as string[], rows:[] as {key:string;name:string;groupName:string;dead:number;available:number;lost:number|null;manual:boolean}[]}
  if(!enabled)return out
  for(const casualty of injuries.groups) {
    if(!casualty.resolution.complete)continue
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
      if(lost===null||!Number.isInteger(lost)||lost<0||lost>available) {out.problems.push(`${casualty.group.name}: record how many ${name} were lost with the dead models (0–${available}).`);continue}
      out.patches.push({id:item.id,quantity:available-lost})
      out.notes.push(`${casualty.group.name}: ${dead} dead; ${lost} ${name} lost, ${available-lost} retained${manual?' (recorded allocation of mixed or used equipment)':''}.`)
    }
  }
  return out
}
