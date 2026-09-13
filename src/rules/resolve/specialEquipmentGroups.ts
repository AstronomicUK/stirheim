import type { RosterWarband, RosterHenchmanGroup } from '../types/roster'

/** Split uneven specialist kit without duplicating ordinary equipment or changing XP. */
export function splitSpecialEquipmentGroups(roster: RosterWarband, id: () => string = () => crypto.randomUUID()): RosterWarband {
 const groups: RosterHenchmanGroup[]=[]
 for (const original of roster.henchmenGroups) {
  const special = original.equipment.some(item=>item.itemId==='swivel_gun'&&item.quantity>0) ? 'swivel_gun' : original.unitTemplateId==='bretonnian_battle_pilgrims' ? 'holy_unholy_relic' : null
  const qty=special?original.equipment.filter(item=>item.itemId===special).reduce((n,item)=>n+item.quantity,0):0
  if (!special || original.size<2 || qty===0 || (special==='holy_unholy_relic'&&qty>=original.size)) {groups.push(original);continue}
  let remaining={...original,equipment:original.equipment.map(item=>({...item}))}
  for(let n=0;n<Math.min(qty,original.size-1);n++) {
   let specialNeeded=1
   const taken=remaining.equipment.map(item=>{
    const take=item.itemId===special?Math.min(item.quantity,specialNeeded):Math.floor(item.quantity/remaining.size)
    if(item.itemId===special)specialNeeded-=take
    return take
   })
   const equipment=remaining.equipment.flatMap((item,index)=>taken[index]>0?[{...item,quantity:taken[index]}]:[])
   groups.push({...original,id:id(),name:`${original.name} · ${special==='swivel_gun'?'Gunner':'Relic bearer'} ${n+1}`,size:1,equipment})
   remaining={...remaining,size:remaining.size-1,equipment:remaining.equipment.map((item,index)=>({...item,quantity:item.quantity-taken[index]})).filter(item=>item.quantity>0)}
  }
  groups.push(remaining)
 }
 return {...roster,henchmenGroups:groups}
}
