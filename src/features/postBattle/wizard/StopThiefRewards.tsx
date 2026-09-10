import {useState} from 'react'
import {useQuery} from '@tanstack/react-query'
import {supabase} from '../../../api/supabase'
import {findItem} from '../../../rules/data/items'
import {Button,DieField,Notice,NumberField,SelectField,TextField} from '../../../ui'
import {ScenarioTransferPicker} from './ScenarioTransferPicker'
import type {StopThiefDraft} from '../model/stopThiefRewards'
export function StopThiefRewards({state,won,ownId,warbands,change}:{state:StopThiefDraft;won:boolean;ownId:string;warbands:{id:string;name:string}[];change:(s:StopThiefDraft)=>void}) {
 const [selected,setSelected]=useState(''),[price,setPrice]=useState<number|null>(null),[reason,setReason]=useState('')
 const defender=warbands.find(w=>w.id===state.defenderId),defending=defender?.id===ownId
 const attackers=warbands.filter(w=>w.id!==state.defenderId),ids=attackers.map(w=>w.id).sort()
 const inventory=useQuery({queryKey:['stop-thief-sale-items',ids],enabled:!!defender&&defending&&won&&ids.length>0,queryFn:async()=>{const {data,error}=await supabase.from('items').select('*').in('warband_id',ids).gt('quantity',0);if(error)throw new Error(error.message);return data}})
 const available=(inventory.data??[]).filter(i=>!(state.sales??[]).some(t=>t.from_warband_id===i.warband_id)&&!state.returnedAllies?.includes(i.warband_id)),item=available.find(i=>i.id===selected)
 const itemName=(id:string|null,custom:string|null)=>custom??findItem(id??'')?.name??id??'Equipment'
 return <div className="flex flex-col gap-3">
  <SelectField label="Defending warband at setup" value={state.defenderId??''} onChange={e=>change({defenderId:e.target.value})}><option value="">Choose…</option>{warbands.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</SelectField>
  <p className="text-sm">The highest-rated warband defends. Each attacker’s most expensive portable equipment is stolen, with magic items taking priority; exclude animals and oversized equipment. Record the choices made before play. Temporary use by the Thief does not itself change permanent ownership.</p>
  <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={state.setupConfirmed??false} onChange={e=>change({...state,setupConfirmed:e.target.checked})}/>These are the defender and stolen-item choices agreed at setup.</label>
  {defender&&!defending?<>
   <SelectField label="Was your stolen item returned?" value={state.recovered===undefined?'':String(state.recovered)} onChange={e=>change({...state,recovered:e.target.value===''?undefined:e.target.value==='true',recoveredTransfers:[],recoveryNote:''})}><option value="">Choose…</option><option value="true">Yes — recovered or returned by an ally</option><option value="false">No</option></SelectField>
   {state.recovered?<><TextField label="Recovered item and what happened to it" value={state.recoveryNote??''} onChange={e=>change({...state,recoveryNote:e.target.value})} hint="If it stayed on your roster during the battle, name it here; no replacement is needed. If it is currently on the defender’s roster, select the original copy below."/><ScenarioTransferPicker warbands={[defender]} value={state.recoveredTransfers??[]} change={recoveredTransfers=>change({...state,recoveredTransfers})}/></>:null}
   {won?<div className="flex flex-wrap gap-3">{[0,1].map(i=><DieField key={i} label={`Recovered valuables die ${i+1}`} sides={6} rollable value={state.dice?.[i]??null} onChange={v=>{const dice=[...(state.dice??[null,null])];dice[i]=v;change({...state,dice})}}/>)}</div>:null}
   {!state.recovered?<Notice>The defending winner records the sale of your actual stolen item. This report does not create a replacement or remove another copy.</Notice>:null}
  </>:null}
  {defending&&won?<>
   <p className="text-sm">For each attacker, sell its original stolen copy or record that it was returned to an ally. Sale proceeds are half the recorded full value, rounded down. For an unpriced magic item, record the table’s agreed valuation and reason.</p>
   {attackers.map(w=><label key={w.id} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={state.returnedAllies?.includes(w.id)??false} onChange={e=>change({...state,reviewed:false,returnedAllies:e.target.checked?[...(state.returnedAllies??[]),w.id]:(state.returnedAllies??[]).filter(id=>id!==w.id),sales:(state.sales??[]).filter(t=>t.from_warband_id!==w.id)})}/>Returned {w.name}’s item under an alliance agreement</label>)}
   {(state.sales??[]).map((t,i)=><div key={t.item_id} className="flex items-center justify-between gap-3 text-sm"><span>{warbands.find(w=>w.id===t.from_warband_id)?.name}: {itemName(t.expected.item_rules_id as string|null,t.expected.custom_name as string|null)} — {Math.floor((t.sale_value??0)/2)} gc<span className="block">{t.reason}</span></span><Button variant="secondary" onClick={()=>change({...state,reviewed:false,sales:state.sales?.filter((_,n)=>n!==i)})}>Remove</Button></div>)}
   {inventory.isError?<Notice tone="error">{inventory.error.message}</Notice>:null}
   <SelectField label="Original stolen equipment to sell" value={selected} onChange={e=>{setSelected(e.target.value);setPrice(null);setReason('')}}><option value="">{inventory.isPending?'Loading equipment…':'Choose…'}</option>{available.map(i=><option key={i.id} value={i.id}>{warbands.find(w=>w.id===i.warband_id)?.name}: {itemName(i.item_rules_id,i.custom_name)}</option>)}</SelectField>
   {item?<><NumberField label="Full value of one stolen copy (gc)" allowEmpty value={price} onChange={setPrice}/><TextField label="Setup selection and valuation reason" value={reason} onChange={e=>setReason(e.target.value)}/><Button variant="secondary" disabled={price==null||!Number.isSafeInteger(price)||price<0||!reason.trim()} onClick={()=>{if(price==null)return;change({...state,reviewed:false,sales:[...(state.sales??[]),{item_id:item.id,from_warband_id:item.warband_id,quantity:1,expected:{...item},reason:reason.trim(),sale_value:price}]});setSelected('');setPrice(null);setReason('')}}>Record stolen-item sale</Button></>:null}
   <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={state.reviewed??false} onChange={e=>change({...state,reviewed:e.target.checked})}/>I have reviewed the original stolen copy and sale or allied return for every attacker.</label>
  </>:null}
  <p className="text-sm">The Halfling Thief’s services last for this battle. Use normal recruitment if retaining him; this report does not grant a permanent free hire.</p>
 </div>
}
