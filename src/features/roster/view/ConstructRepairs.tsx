import {useState} from 'react'
import {useQueryClient} from '@tanstack/react-query'
import {supabase} from '../../../api/supabase'
import type {Json} from '../../../api/database.types'
import type {WarbandDetail} from '../../../api/warbands'
import {Button,Notice} from '../../../ui'
import {Section,Card} from './bits'

export function ConstructRepairs({detail,userId}:{detail:WarbandDetail;userId?:string}) {
 const qc=useQueryClient(),[pending,setPending]=useState<string|null>(null),[error,setError]=useState(''),[abandon,setAbandon]=useState<string|null>(null)
 const groups=detail.roster.henchmenGroups.filter(g=>g.campaignState?.constructRepairs?.length||g.campaignState?.constructRepairReceipt)
 if(!groups.length)return null
 const allowed=detail.warband.owner_id===userId
 async function act(id:string,action:'repair'|'abandon'|'undo') {
  const group=groups.find(g=>g.id===id)!
  setPending(id);setError('')
  try {
   const {error}=await supabase.rpc('resolve_construct_repair',{p_group_id:id,p_action:action,p_request_id:action==='undo'?group.campaignState!.constructRepairReceipt!.requestId:crypto.randomUUID(),p_expected_state:group.campaignState as unknown as Json})
   if(error)throw Error(error.message)
   setAbandon(null)
   await Promise.all([['warbands'],['campaigns'],['trading']].map(queryKey=>qc.invalidateQueries({queryKey})))
  }catch(e){setError(e instanceof Error?e.message:'Could not update repairs')}finally{setPending(null)}
 }
 return <Section title="Flesh Construct repairs">
  {error&&<Notice tone="error">{error}</Notice>}
  {groups.map(group=>{const repairs=group.campaignState?.constructRepairs??[],receipt=group.campaignState?.constructRepairReceipt;return <Card key={group.id} className="flex flex-col gap-3 p-4">
   <h3 className="font-semibold">{group.name}</h3>
   {repairs.length ? <>
    <p className="text-sm">Retained on the roster, unable to fight until repaired. {repairs.length>1?`${repairs.length} models need repairs. `:''}Repair cost: {repairs[0].cost} gc (D6 {repairs[0].repairRoll} × 5).</p>
    <Button pending={pending===group.id} disabled={!allowed||!!pending||detail.roster.gold<repairs[0].cost} onClick={()=>void act(group.id,'repair')}>Pay {repairs[0].cost} gc to repair</Button>
    {detail.roster.gold<repairs[0].cost&&<p className="text-xs text-ink-dim">Not enough gold yet. The damaged model stays on your roster.</p>}
    {abandon===group.id?<Notice tone="warn"><p>Abandon this damaged Construct and remove it from the roster?</p><div className="mt-2 flex gap-3"><Button disabled={!!pending} onClick={()=>void act(group.id,'abandon')}>Confirm abandonment</Button><button disabled={!!pending} onClick={()=>setAbandon(null)}>Keep it</button></div></Notice>:<button disabled={!allowed||!!pending} className="text-left text-sm underline" onClick={()=>setAbandon(group.id)}>Abandon damaged model</button>}
   </>:<p className="text-sm">{receipt?.action==='abandon'?'Damaged Construct abandoned.':'Repairs paid; the Construct can fight again.'}</p>}
   {receipt&&<button disabled={!allowed||!!pending} className="text-left text-sm underline" onClick={()=>void act(group.id,'undo')}>Undo last {receipt.action==='repair'?'repair payment':'abandonment'}{receipt.paid?` · refund ${receipt.paid} gc`:''}</button>}
  </Card>})}
 </Section>
}
