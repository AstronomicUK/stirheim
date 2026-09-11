import {findItem} from '../../../rules/data/items'
import {SHRINE_BLESSING,shrineBlessed} from '../../../rules/resolve/shrineBlessing'
import type {ReportApplied,ItemRow} from '../../../domain'
import type {RosterWarband} from '../../../rules/types/roster'
import type {ExplorationDraft} from './state'

export function applyShrineBlessing(draft:ExplorationDraft,locationId:string|undefined,roster:RosterWarband,items:readonly ItemRow[],applied:ReportApplied) {
 const options=items.flatMap(original=>{
  const item=findItem(original.item_rules_id??'')
  if((!item&&!original.custom_name)||(item&&!item.weaponId&&!['melee','missile','blackpowder'].includes(item.category))||applied.remove_item_ids.includes(original.id))return []
  const patch=applied.item_patches.find(p=>p.id===original.id),row={...original,...patch}
  if(row.quantity<1||shrineBlessed(row.notes))return []
  const hero=row.holder_type==='hero'? [...roster.heroes,...roster.hiredSwords].find(h=>h.id===row.holder_id):undefined
  const group=row.holder_type==='group'?roster.henchmenGroups.find(g=>g.id===row.holder_id):undefined
  if(hero&&(applied.heroes.find(h=>h.id===hero.id)?.patch.status??hero.status)!=='active')return []
  if(group&&(applied.groups.find(g=>g.id===group.id)?.patch.size??group.size)<1)return []
  const name=item?.name??original.custom_name!
  return [{original,row,name,label:`${name}${item?'':' (custom item)'} — ${hero?.name??group?.name??'Stash'}${row.quantity>1?` (one of ${row.quantity})`:''}`}]
 })
 const result={options,problems:[] as string[],notes:[] as string[]}
 if(locationId!=='shrine'||!['witch_hunters','sisters_of_sigmar'].includes(roster.warbandTemplateId))return result
 if(!['strip','save'].includes(draft.shrineChoice??'')){result.problems.push('Shrine: choose to strip it or save its holy relics.');return result}
 if(draft.shrineChoice==='strip'){result.notes.push('Shrine: stripped for 3D6 gc.');return result}
 const selected=options.find(o=>o.original.id===draft.shrineWeaponId)
 if(!selected){result.problems.push('Shrine: choose one remaining weapon to bless.');return result}
 const {original,row,name}=selected,notes=[row.notes,SHRINE_BLESSING].filter(Boolean).join('\n')
 const patch=applied.item_patches.find(p=>p.id===row.id)
 if(row.quantity===1) {if(patch)patch.notes=notes;else applied.item_patches.push({id:row.id,notes})}
 else {
  if(patch)patch.quantity=row.quantity-1;else applied.item_patches.push({id:row.id,quantity:row.quantity-1})
  applied.awarded_items=[...(applied.awarded_items??[]),{holder_type:row.holder_type,holder_id:row.holder_id,item_rules_id:row.item_rules_id,custom_name:row.custom_name,quantity:1,notes}]
 }
 const {created_at: _created,updated_at: _updated,...expected}=original
 applied.shrine_equipment={item_id:original.id,expected}
 result.notes.push(`Shrine: saved the holy relics for 3D6 gc from patrons; blessed one ${name} (${row.holder_type==='stash'?'Stash':selected.label.split(' — ')[1]}). ${SHRINE_BLESSING}`)
 return result
}
