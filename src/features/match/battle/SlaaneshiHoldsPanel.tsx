import {useState} from 'react'
import {useSlaaneshiHolds,useSlaaneshiHoldAction,type SlaaneshiHold} from '../../../api/slaaneshiHolds'
import type {LockReleaseReason} from '../../../rules/resolve/slaaneshiLock'
import {Button,Notice,SelectField,Sheet,TextField} from '../../../ui'
const reasons:{value:LockReleaseReason;label:string}[]=[{value:'weaponSwitched',label:'The wielder switched weapons'},{value:'magicEscape',label:'The target escaped using magic'},{value:'meleeEnded',label:'The models are no longer in melee'},{value:'wielderOutOfAction',label:'The wielder was taken out of action'},{value:'targetOutOfAction',label:'This held model was taken out of action'}]
export function SlaaneshiHoldsPanel({matchId,editable,managedWarbands,isGm=false,confirmingEnd=false}:{matchId:string;editable:boolean;managedWarbands:readonly string[];isGm?:boolean;confirmingEnd?:boolean}){
 const holds=useSlaaneshiHolds(matchId),action=useSlaaneshiHoldAction(matchId)
 const [selected,setSelected]=useState<SlaaneshiHold|null>(null),[reason,setReason]=useState<LockReleaseReason>('weaponSwitched'),[note,setNote]=useState('')
 const active=holds.data?.filter(h=>!h.released_at)??[]
 if(!active.length)return null
 const canManage=(hold:SlaaneshiHold)=>editable&&(isGm||managedWarbands.includes(hold.wielder_warband_id)||managedWarbands.includes(hold.target_warband_id))
 const name=(hold:SlaaneshiHold)=>`${hold.target_name}${hold.target_kind==='group'?` · model ${hold.target_model_index+1}`:''}`
 return <section aria-label="Man-Catcher holds" className="rounded-lg border border-brass/50 bg-brass/5 p-4">
  <div className="mb-3 flex items-center justify-between gap-2"><h2 className="font-headline text-lg text-ink">Held by a Man-Catcher</h2><span className="rounded-full border border-brass/40 px-2 py-0.5 text-xs text-ink-dim">{active.length} held</span></div>
  <p className="mb-3 text-xs leading-relaxed text-ink-dim">Held models cannot stand up or move away without magic. The wielder may drag a captive only while fighting no other model.</p>
  <div className="flex flex-col gap-3">{active.map(hold=><div key={hold.id} className="rounded border border-border bg-surface p-3">
   <p className="text-sm font-semibold text-ink">{name(hold)}</p>
   <p className="mt-1 text-xs text-ink-dim">{hold.confirmed_end_at?'Confirmed held at battle end':'Knocked down · unable to recover while held'}</p>
   {canManage(hold)?<div className="mt-3 flex flex-wrap gap-2"><Button variant="secondary" disabled={action.isPending} onClick={()=>{setSelected(hold);setNote('');setReason('weaponSwitched')}}>Record release</Button>{confirmingEnd?<Button variant="primary" disabled={action.isPending||!!hold.confirmed_end_at} onClick={()=>action.mutate({id:hold.id,action:'confirmEnd'})}>{hold.confirmed_end_at?'Confirmed':'Still held at battle end'}</Button>:null}</div>:null}
  </div>)}</div>
  {action.error?<Notice tone="error" title="Could not update the hold">{action.error.message}</Notice>:null}
  {selected?<Sheet open title={`Release ${name(selected)}`} onClose={()=>setSelected(null)} footer={<Button block disabled={action.isPending} onClick={()=>action.mutate({id:selected.id,action:reason,reason:note},{onSuccess:()=>setSelected(null)})}>Record release</Button>}>
   <p className="mb-4 text-sm text-ink-dim">Releasing the hold does not stand the model up. They recover normally in their next Recovery phase.</p>
   <SelectField label="Why did the hold end?" value={reason} onChange={e=>setReason(e.target.value as LockReleaseReason)}>{reasons.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}</SelectField>
   <TextField label="Optional note" value={note} onChange={e=>setNote(e.target.value)} maxLength={500}/>
  </Sheet>:null}
 </section>
}
