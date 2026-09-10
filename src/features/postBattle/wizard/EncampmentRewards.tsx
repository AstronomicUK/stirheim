import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../api/supabase'
import { findItem } from '../../../rules/data/items'
import { Button, Notice, SelectField, TextField } from '../../../ui'
import type { EncampmentDraft } from '../model/encampmentRewards'
export function EncampmentRewards({state,won,opponents,change}:{state:EncampmentDraft;won:boolean;opponents:{id:string;name:string}[];change:(s:EncampmentDraft)=>void}) {
  const inventory = useQuery({queryKey:['encampment-stash',state.defenderId],enabled:!!state.defenderId && state.role==='attacker' && !!state.captured && won,queryFn:async()=>{const {data,error}=await supabase.from('items').select('*').eq('warband_id',state.defenderId!).eq('holder_type','stash').gt('quantity',0);if(error)throw new Error(error.message);return data}})
  return <div className="flex flex-col gap-3">
    <SelectField label="Your encampment role" value={state.role??''} onChange={e=>change({role:e.target.value as EncampmentDraft['role']})}><option value="">Choose…</option><option value="attacker">Attacker</option><option value="defender">Defender</option></SelectField>
    <SelectField label="Did the attackers capture the camp?" value={state.captured===undefined?'':String(state.captured)} onChange={e=>change({role:state.role,captured:e.target.value===''?undefined:e.target.value==='true'})}><option value="">Choose…</option><option value="true">Yes</option><option value="false">No</option></SelectField>
    {state.role==='defender'&&state.captured?<Notice>The victorious attacker files the stash transfer. Roll for a new camp on your settlement’s Housing chart. The optional housing system is not automated here.</Notice>:null}
    {state.role==='attacker'&&state.captured&&won?<>
      <SelectField label="Defending warband" value={state.defenderId??''} onChange={e=>change({...state,defenderId:e.target.value,reviewed:false,transfers:[]})}><option value="">Choose…</option>{opponents.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</SelectField>
      <TextField label="Captured camp or settlement" value={state.camp??''} onChange={e=>change({...state,camp:e.target.value})}/>
      <SelectField label="What happens to the camp?" value={state.treatment??''} onChange={e=>change({...state,treatment:e.target.value as EncampmentDraft['treatment'],eligible:false})}><option value="">Choose…</option><option value="destroy">Destroy it</option><option value="occupy">Occupy it</option></SelectField>
      {state.treatment==='occupy'?<label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={state.eligible??false} onChange={e=>change({...state,eligible:e.target.checked})}/>Our warband is allowed to occupy this camp under the settlement rules.</label>:null}
      <p className="text-sm">The complete equipment stash moves to your warband when this report is applied. Equipment carried by warriors is excluded. This records the camp decision; it does not apply the optional housing benefits. Agree separately if your table includes treasury gold or wyrdstone in “stash”, and record any such adjustment with its reason.</p>
      {inventory.isError?<Notice tone="error">{inventory.error.message}</Notice>:null}
      {state.defenderId&&inventory.isPending?<p>Loading the defender’s stash…</p>:null}
      {inventory.data?<><ul className="list-disc pl-5 text-sm">{inventory.data.map(i=><li key={i.id}>{i.quantity} × {i.custom_name??findItem(i.item_rules_id??'')?.name??'Equipment'}</li>)}</ul>{!inventory.data.length?<p className="text-sm">The defender’s equipment stash is empty.</p>:null}<Button variant="secondary" onClick={()=>change({...state,reviewed:true,transfers:inventory.data.map(i=>({item_id:i.id,from_warband_id:i.warband_id,quantity:i.quantity,expected:{...i},reason:'Captured the defender’s encampment and complete equipment stash.'}))})}>{state.reviewed?'Confirm refreshed stash':'Confirm complete stash'}</Button>{state.reviewed?<p className="text-sm">Stash confirmed. Filing checks that the inventory has not changed.</p>:null}</>:null}
    </>:null}
  </div>
}
