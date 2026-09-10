import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../api/supabase'
import type { ReportApplied } from '../../../domain/report'
import { findItem } from '../../../rules/data/items'
import { Button, NumberField, Notice, SelectField, TextField } from '../../../ui'
import { useState } from 'react'
export type ScenarioItemTransfer=NonNullable<ReportApplied['scenario_item_transfers']>[number]
export function ScenarioTransferPicker({warbands,value,change,weaponsOnly=false}:{warbands:{id:string;name:string}[];value:ScenarioItemTransfer[];change:(v:ScenarioItemTransfer[])=>void;weaponsOnly?:boolean}) {
 const [itemId,setItemId]=useState(''),[quantity,setQuantity]=useState<number|null>(1),[reason,setReason]=useState('')
 const ids=warbands.map(w=>w.id).sort()
 const items=useQuery({queryKey:['scenario-transfer-items',ids],enabled:ids.length>0,queryFn:async()=>{const {data,error}=await supabase.from('items').select('*').in('warband_id',ids).gt('quantity',0);if(error)throw new Error(error.message);return data}})
 const available=(items.data??[]).filter(i=>!value.some(t=>t.item_id===i.id)&&(!weaponsOnly||!i.item_rules_id||(['melee','missile','blackpowder'].includes(findItem(i.item_rules_id)?.category??'')&&i.item_rules_id!=='dagger')))
 const item=available.find(i=>i.id===itemId)
 const name=(id:string|null,custom:string|null)=>custom??(id?findItem(id)?.name??id:'Equipment')
 const valid=item&&quantity!=null&&Number.isInteger(quantity)&&quantity>=1&&quantity<=item.quantity&&!!reason.trim()
 return <div className="flex flex-col gap-3">
 <p className="text-sm">Choose the existing equipment copies actually recovered from another warband. Filing moves those copies into your stash. If the source record has changed, review it again before filing.</p>
 {value.map((t,i)=><div key={t.item_id} className="flex items-center justify-between gap-3 text-sm"><span>{t.quantity} × {name(t.expected.item_rules_id as string|null,t.expected.custom_name as string|null)} — {warbands.find(w=>w.id===t.from_warband_id)?.name}<span className="block text-xs">{t.reason}</span></span><Button variant="secondary" onClick={()=>change(value.filter((_,n)=>n!==i))}>Remove</Button></div>)}
 {items.isError?<Notice tone="error">{items.error.message}</Notice>:null}
 <SelectField label="Existing equipment to transfer" value={itemId} onChange={e=>{setItemId(e.target.value);setQuantity(1)}}><option value="">{items.isPending?'Loading equipment…':'Choose equipment…'}</option>{available.map(i=><option key={i.id} value={i.id}>{warbands.find(w=>w.id===i.warband_id)?.name}: {name(i.item_rules_id,i.custom_name)} ({i.quantity} available)</option>)}</SelectField>
 {item?<><NumberField label="Copies recovered" allowEmpty value={quantity} onChange={setQuantity}/><TextField label="How this equipment was recovered" value={reason} onChange={e=>setReason(e.target.value)}/><Button variant="secondary" disabled={!valid} onClick={()=>{if(!valid)return;change([...value,{item_id:item.id,from_warband_id:item.warband_id,quantity:quantity!,expected:{...item},reason:reason.trim()}]);setItemId('');setQuantity(1);setReason('')}}>Add recovered equipment</Button></>:null}
 </div>
}
