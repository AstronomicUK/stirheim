import {useState} from 'react'
import {useCaptiveCases,useProposeCaptiveOutcome,type CaptiveCase} from '../../../api/captives'
import {buildExchangeProposal} from '../../../api/captiveExchange'
import {companionReturnHolder} from '../../../api/companionCaptives'
import type {WarbandDetail} from '../../../api/warbands'
import {Button,Notice,SelectField} from '../../../ui'

export function CaptiveExchangePanel({item,owner,captor,submitLabel}:{item:CaptiveCase;owner:WarbandDetail;captor:WarbandDetail;submitLabel:string}){
 const cases=useCaptiveCases(owner.warband.id),propose=useProposeCaptiveOutcome()
 const [selected,setSelected]=useState(''),[holderId,setHolderId]=useState(''),[otherHolderId,setOtherHolderId]=useState('')
 const [groupId]=useState(()=>crypto.randomUUID()),[otherGroupId]=useState(()=>crypto.randomUUID())
 const eligible=(cases.data??[]).filter(c=>c.id!==item.id&&c.state==='open'&&c.victim_warband_id===item.captor_warband_id&&c.captor_warband_id===item.victim_warband_id&&!(c.subject_kind==='henchman'&&c.source==='pirates_kidnapped'))
 const partner=eligible.find(c=>c.id===selected)
 let preview:ReturnType<typeof buildExchangeProposal>|null=null,error=''
 if(partner)try{preview=buildExchangeProposal({caseA:item,caseB:partner,owner,captor,groupId,otherGroupId,holderId:holderId||null,otherHolderId:otherHolderId||null})}catch(e){error=e instanceof Error?e.message:'Review the exchange.'}
 if(!eligible.length)return cases.error?<Notice tone="error" title="Could not load exchange options">{cases.error.message}</Notice>:null
 const destination=(c:CaptiveCase,band:WarbandDetail,value:string,change:(v:string)=>void)=>c.subject_kind==='companion'&&!companionReturnHolder(band,c,value).original?<SelectField label={`Return ${c.hero_name} to`} value={value} onChange={e=>change(e.target.value)}><option value="">{band.warband.name} stash</option>{band.roster.heroes.filter(h=>h.status==='active').map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</SelectField>:null
 return <details className="rounded border border-border p-3">
  <summary className="cursor-pointer text-sm font-semibold">Exchange for another captive</summary>
  <div className="mt-3 flex flex-col gap-3">
   <SelectField label="Captive returning to the other warband" value={selected} onChange={e=>{setSelected(e.target.value);setOtherHolderId('')}}><option value="">Choose the agreed exchange</option>{eligible.map(c=><option key={c.id} value={c.id}>{c.hero_name}</option>)}</SelectField>
   {destination(item,owner,holderId,setHolderId)}
   {partner?destination(partner,captor,otherHolderId,setOtherHolderId):null}
   {preview?<Notice title="Both captives return" tone="info">{preview.message} No gold changes hands.</Notice>:null}
   <Button disabled={!preview} pending={propose.isPending} onClick={()=>{if(preview)propose.mutate({caseId:item.id,owner,captor,choice:preview.choice,nextOwner:preview.nextOwner,nextCaptor:preview.nextCaptor,message:preview.message})}}>{submitLabel}</Button>
   {error||propose.error?<Notice tone="error" title="Could not propose this exchange">{error||propose.error?.message}</Notice>:null}
  </div>
 </details>
}
