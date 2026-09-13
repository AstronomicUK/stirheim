import type {ReportApplied} from '../../../domain'
import {findItem} from '../../../rules/data/items'
import {GROUP_HANDLERS} from '../../../rules/resolve/handlers'
import type {ReportContext,InjuriesDerived} from './derive'
import type {ReportDraft} from './state'
const CLAIMED=new Set(['lookout_gnoblar','luck_gnoblar','sword_gnoblar'])
export function handlerAftermath(ctx:ReportContext,draft:ReportDraft,injuries:InjuriesDerived,applied:ReportApplied,enabled=true){
 const notes:string[]=[],problems:string[]=[],rows:{id:string;name:string;quantity:number;rolls:(number|null)[]}[]=[]
 if(!enabled)return {notes,problems,rows}
 for(const group of ctx.roster.henchmenGroups){
  const rule=group.campaignState?.trainedSquig ? {unitId:'night_goblins_web_squig_herder',name:'Squig Herder',leavesOnDeath:true} : GROUP_HANDLERS[group.unitTemplateId]
  if(!rule?.leavesOnDeath||group.size<=0)continue
  if(!injuries.heroes.some(h=>h.hero.unitTemplateId===rule.unitId&&h.resolution.hero.status==='dead'))continue
  const patch=applied.groups.find(g=>g.id===group.id)
  if(patch)patch.patch.size=0;else applied.groups.push({id:group.id,patch:{size:0}})
  applied.pending_advances=applied.pending_advances.filter(a=>a.subject_id!==group.id)
  for(const item of ctx.items.filter(i=>i.holder_type==='group'&&i.holder_id===group.id))if(!applied.remove_item_ids.includes(item.id))applied.remove_item_ids.push(item.id)
  notes.push(`${group.name}: the ${rule.name} died; all remaining beasts escaped and left the warband.`)
 }
 if(ctx.roster.warbandTemplateId==='maneaters')for(const item of ctx.items){
  if(!CLAIMED.has(item.item_rules_id??'')||!draft.heroesOut.includes(item.holder_id??'')||item.holder_type!=='hero'||applied.remove_item_ids.includes(item.id))continue
  const prior=applied.item_patches.find(p=>p.id===item.id)
  const quantity=prior?.quantity??item.quantity
  if(quantity<=0)continue
  const name=findItem(item.item_rules_id!)?.name??'Claimed Gnoblar'
  const rolls=draft.claimedGnoblarDice?.[item.id]??[]
  rows.push({id:item.id,name,quantity,rolls})
  if(Array.from({length:quantity},(_,i)=>rolls[i]).some(d=>!Number.isInteger(d)||Number(d)<1||Number(d)>6)){problems.push(`${name}: roll D6 for each Claimed Gnoblar because its Ogre went out of action.`);continue}
  const lost=rolls.slice(0,quantity).filter(d=>d!<=2).length
  if(prior)prior.quantity=quantity-lost;else applied.item_patches.push({id:item.id,quantity:quantity-lost})
  notes.push(`${name}: owner went out of action; D6 ${rolls.slice(0,quantity).join(', ')}. ${lost} lost; ${quantity-lost} retained.`)
 }
 return {notes,problems,rows}
}
