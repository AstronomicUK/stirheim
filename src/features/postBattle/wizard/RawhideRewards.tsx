import {SelectField,TextArea} from '../../../ui'
import type {RawhideCargo} from '../../../api/rawhide'
import type {RawhideDraft} from '../model/rawhideReport'
export function RawhideRewards({state,cargo,ownId,change}:{state:RawhideDraft;cargo?:RawhideCargo;ownId:string;change:(s:RawhideDraft)=>void}){
 const merchant=cargo?.declared&&cargo.warband_id===ownId
 return <div className="flex flex-col gap-3">
  <SelectField label="Rawhide cargo settlement" value={state.outcome??''} onChange={e=>change({...state,outcome:e.target.value as RawhideDraft['outcome']})}>
   <option value="">Choose…</option>
   {merchant?<><option value="escaped">Our loaded wagon escaped — sell the declared cargo</option><option value="empty">Our wagons were declared empty — no cargo reward</option></>:<option value="captured">We captured the loaded wagon — transfer its cargo to us</option>}
   {cargo&&!cargo.declared?<option value="manual">Legacy battle — record an agreed manual reconciliation</option>:null}
   <option value="other">Another warband settles the cargo in its report</option>
  </SelectField>
  {state.outcome==='other'||state.outcome==='manual'?<TextArea label="What happened to the cargo?" value={state.note??''} onChange={e=>change({...state,note:e.target.value})}/>:null}
  <p className="text-sm text-ink-dim">Cargo is transferred from the original treasury or sold once. Loaned wagons, mounts and spears are not retained. Use the named +1 awards in Experience for the leader, drivers and warriors who achieved their objectives.</p>
 </div>
}
