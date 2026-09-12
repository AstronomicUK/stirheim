import {useState} from 'react'
import type {CaptiveCase} from '../../../api/captives'
import {useAllocateKidnapKit} from '../../../api/pirates'
import {findItem} from '../../../rules/data/items'
import {Button,Notice,NumberField,TextField} from '../../../ui'

type KitRow={id:string;item_rules_id:string|null;custom_name?:string|null;notes?:string|null;quantity:number|null;lost:number}
export function PirateKitAllocation({item,canAllocate}:{item:CaptiveCase;canAllocate:boolean}){
 const snap=item.model_snapshot as {kit_unresolved?:boolean;items?:KitRow[]}|null
 const rows=snap?.items??[]
 const [quantities,setQuantities]=useState<Record<string,number|null>>({})
 const [reason,setReason]=useState('')
 const save=useAllocateKidnapKit()
 if(!snap?.kit_unresolved)return null
 const value=(row:KitRow)=>row.id in quantities?quantities[row.id]:row.quantity
 const ready=reason.trim().length>=5&&rows.every(row=>{const q=value(row);return q!==null&&Number.isInteger(q)&&q>=0&&q<=row.lost})
 return <Notice tone="info" title="Record the fallen model’s equipment">
  <div className="flex flex-col gap-3">
   <p>The group had mixed or used equipment. Record what this model actually carried so supplies used during battle and surviving models’ equipment stay out of the Pirate stash.</p>
   {canAllocate?<>
    {rows.map(row=><NumberField key={row.id} label={`${(row.item_rules_id?findItem(row.item_rules_id)?.name:row.custom_name)??'Equipment'}${row.notes?` (${row.notes})`:''}`} hint={`Up to ${row.lost} copies were lost across this group’s casualties.`} value={value(row)} onChange={q=>setQuantities(old=>({...old,[row.id]:q}))}/>)}
    <TextField label="How was their equipment identified?" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Describe the allocation agreed at the table"/>
    <Button pending={save.isPending} disabled={!ready} onClick={()=>save.mutate({caseId:item.id,reason,items:rows.map(row=>({id:row.id,quantity:value(row)!}))})}>Record this model’s equipment</Button>
   </>:<p>Waiting for their player or the campaign GM to record the equipment.</p>}
   {save.error?<p className="text-sm text-ink">{save.error.message}</p>:null}
  </div>
 </Notice>
}
