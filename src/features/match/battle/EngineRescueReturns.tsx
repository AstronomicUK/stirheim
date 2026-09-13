import {useState} from 'react'
import {Link} from 'react-router'
import {useCaptiveCases} from '../../../api/captives'
import {useEnginePrisoners} from '../../../api/engineCustody'
import {useEngineRescueReturn,useReverseAnonymousRescue,type EngineRescueRecord} from '../../../api/engineRescue'
import {Button,Notice} from '../../../ui'
export function EngineRescueReturns({record,completed,managedWarbands,isGm}:{record:EngineRescueRecord;completed:boolean;managedWarbands:string[];isGm:boolean}){
 const custody=useEnginePrisoners(record.state.holderWarbandId),cases=useCaptiveCases(record.state.holderWarbandId),submit=useEngineRescueReturn(record.match_id),reverse=useReverseAnonymousRescue(record.match_id)
 const [reason,setReason]=useState('')
 const escaped=record.state.prisoners.filter(p=>p.state==='escaped')
 if(!escaped.length)return null
 return <section className="mt-4 space-y-3 border-t border-border pt-4"><h3 className="font-headline text-lg">Return after the battle</h3>
  {!completed?<p className="text-sm text-ink-dim">Finish this battle’s reports before returning escaped prisoners to their former warbands.</p>:escaped.map(p=>{
   const held=custody.data?.find(c=>c.id===p.id),item=cases.data?.find(c=>c.id===held?.case_id)
   const canAct=isGm||managedWarbands.includes(record.state.holderWarbandId)||Boolean(p.formerWarbandId&&managedWarbands.includes(p.formerWarbandId))
   const pending=item?.proposals.some(x=>x.state==='proposed')
   const destination=p.formerWarbandId&&managedWarbands.includes(p.formerWarbandId)?p.formerWarbandId:record.state.holderWarbandId
   return <div key={p.id} className="rounded-md border border-border p-3"><p className="text-sm font-semibold">{p.name}</p>
    {held?.state==='freed'?<p className="mt-1 text-xs text-ink-dim">{held.case_id?'Returned by agreement.':'Departure recorded.'}</p>:pending?<Link className="mt-2 inline-block text-sm text-brass underline" to={`/warbands/${destination}`}>Review the proposed return</Link>:canAct?<Button variant="secondary" disabled={submit.isPending||custody.isPending||cases.isPending||!held} onClick={()=>submit.mutate({rescueId:record.id,prisonerId:p.id,anonymous:!held?.case_id})}>{held?.case_id?'Propose return to former warband':'Confirm escaped prisoner’s departure'}</Button>:<p className="text-xs text-ink-dim">Waiting for the involved players to resolve the return.</p>}
    {held?.state==='freed'&&!held.case_id&&canAct?<details className="mt-2 text-sm"><summary className="cursor-pointer text-ink-dim">Correct this departure</summary><input aria-label="Reason to correct departure" className="my-2 w-full rounded border border-border bg-surface p-2" value={reason} onChange={e=>setReason(e.target.value)}/><Button variant="secondary" disabled={reverse.isPending||reason.trim().length<5} onClick={()=>reverse.mutate({rescueId:record.id,prisonerId:p.id,reason},{onSuccess:()=>setReason('')})}>Restore anonymous prisoner to custody</Button></details>:null}
   </div>
  })}
  <p className="text-xs text-ink-dim">Confiscated equipment stays with the Chaos Dwarfs. Named prisoners return after both players agree.</p>
  {reverse.error||submit.error||custody.error||cases.error?<Notice tone="error" title="Could not update the return">{reverse.error?.message??submit.error?.message??custody.error?.message??cases.error?.message}</Notice>:null}
 </section>
}
