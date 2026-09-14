import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../api/supabase'
import type { Json } from '../../../api/database.types'
import type { WarbandDetail } from '../../../api/warbands'
import { Button, Notice } from '../../../ui'
export function AbominationReanimation({detail,canEdit}:{detail:WarbandDetail;canEdit:boolean}) {
 const query=useQueryClient(),[pending,setPending]=useState(false),[error,setError]=useState('')
 const groups=detail.roster.henchmenGroups.filter(g=>g.unitTemplateId==='necrarchs_abomination'&&(g.campaignState?.reanimationOwed||g.campaignState?.reanimationReceipt))
 async function act(id:string,undo=false) {
  const group=groups.find(g=>g.id===id)!
  setPending(true);setError('')
  try {
   const result=await supabase.rpc('reanimate_abomination',{p_group_id:id,p_request_id:undo?group.campaignState!.reanimationReceipt!.requestId:crypto.randomUUID(),p_undo:undo,p_expected_state:group.campaignState as unknown as Json})
   if(result.error)throw Error(result.error.message)
   await Promise.all([['warbands'],['campaigns'],['trading']].map(queryKey=>query.invalidateQueries({queryKey})))
  } catch(e){setError(e instanceof Error?e.message:'Could not reanimate the Abomination.')} finally {setPending(false)}
 }
 return <>{groups.map(g=><Notice key={g.id} title={`${g.name} — reanimation`} tone={g.campaignState?.reanimationOwed?'warn':'info'}><div className="flex flex-col gap-3">
  {g.campaignState?.reanimationOwed?<><p>{g.campaignState.reanimationOwed} awaiting reanimation. Each needs one wyrdstone shard before it can fight again.</p><Button disabled={!canEdit||pending||detail.roster.wyrdstone<1} pending={pending} onClick={()=>void act(g.id)}>Reanimate one · 1 shard</Button>{detail.roster.wyrdstone<1?<p className="text-sm">No spare wyrdstone yet. The model stays on your roster.</p>:null}</>:<p>Reanimated and ready to fight.</p>}
  {canEdit&&g.campaignState?.reanimationReceipt?<Button variant="secondary" disabled={pending} onClick={()=>void act(g.id,true)}>Undo last reanimation · refund 1 shard</Button>:null}
 </div></Notice>)}{error?<Notice tone="error">{error}</Notice>:null}</>
}
