import {useState} from 'react'
import type {ItemRow} from '../../../domain'
import {SelectField} from '../../../ui'
import type {HeroInjuryResolution} from '../model/injuries'
import {canUseMedicineChest} from '../model/medicineChest'
import {setMedicineChestReroll,type ReportDraft} from '../model/state'
import {D66Entry} from './bits'
export function MedicineChest({heroId,draft,items,resolution,update}:{heroId:string;draft:ReportDraft;items:readonly ItemRow[];resolution:HeroInjuryResolution;update:(fn:(d:ReportDraft)=>ReportDraft)=>void}){
 const [itemId,setItemId]=useState('')
 const flow=draft.heroInjuries[heroId]
 const index=resolution.steps.length-1,step=resolution.steps[index],roll=flow?.rolls[index]
 const used=new Map<string,number>()
 for(const f of Object.values(draft.heroInjuries))for(const r of f.rolls)if(r.medicine)used.set(r.medicine.itemId,(used.get(r.medicine.itemId)??0)+1)
 const available=items.filter(i=>i.item_rules_id==='scenario_medicine_chest'&&i.quantity>(used.get(i.id)??0))
 if(!step||!roll||(flow.extraToughUsed&&index===0)||roll.medicine||step.rerolled||step.rewrittenBy||!canUseMedicineChest(roll.d66)||!available.length)return null
 const selected=available.some(i=>i.id===itemId)?itemId:''
 return <div className="flex flex-col gap-2 rounded border border-border p-3">
  <SelectField label="Medicine Chest reroll" value={selected} onChange={e=>setItemId(e.target.value)}><option value="">Keep this result</option>{available.map(i=><option key={i.id} value={i.id}>Use a chest ({i.quantity-(used.get(i.id)??0)} available)</option>)}</SelectField>
  {selected?<><p className="text-xs text-ink-dim">Replace the original D66 {roll.d66}. Filing consumes one chest. This replacement cannot be rerolled with another chest. Later dependent rolls will be cleared.</p><D66Entry key={`${selected}:${index}`} onCommit={d66=>{update(d=>setMedicineChestReroll(d,heroId,index,selected,d66));setItemId('')}}/></>:null}
 </div>
}
