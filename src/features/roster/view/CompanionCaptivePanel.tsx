import {useState} from 'react'
import type {WarbandDetail} from '../../../api/warbands'
import {useProposeCaptiveOutcome,type CaptiveCase} from '../../../api/captives'
import {buildCompanionCaptiveProposal,companionReturnHolder} from '../../../api/companionCaptives'
import {SelectField} from '../../../ui'
import {ForcedCaptiveForm} from './ForcedCaptiveForm'

/** Returning a captured companion restores one item, not a new warrior or warband. */
export function CompanionCaptivePanel({item,owner,captor,submitLabel}:{item:CaptiveCase;owner:WarbandDetail;captor:WarbandDetail;submitLabel:string}){
 const propose=useProposeCaptiveOutcome()
 const [error,setError]=useState(''),[holderId,setHolderId]=useState('')
 const destination=companionReturnHolder(owner,item,holderId||null)
 const holder=owner.roster.heroes.find(h=>h.id===destination.holderId)
 return <ForcedCaptiveForm key={item.id} name={item.hero_name} allowSell={captor.roster.warbandTemplateId!=='pit_fighters'} ownerGold={owner.warband.gold} pending={propose.isPending} submitLabel={submitLabel} error={error||propose.error?.message}
  companionReturn={<div className="flex flex-col gap-2">
   {destination.original?<p>{item.hero_name} returns to {holder?.name}, with its recorded notes preserved.</p>:<>
    <p>The original handler is no longer active. Choose where the companion should return.</p>
    <SelectField label="Return companion to" value={holderId} onChange={e=>setHolderId(e.target.value)}>
     <option value="">Warband stash</option>
     {owner.roster.heroes.filter(h=>h.status==='active').map(h=><option key={h.id} value={h.id}>{h.name}</option>)}
    </SelectField>
   </>}
   <p>Any agreed ransom is deducted when the outcome is accepted.</p>
  </div>}
  onSubmit={choice=>{
   setError('')
   try{
    const outcome=choice.kind==='sell'?{kind:'sell' as const,d6:choice.d6!,originalD6:choice.originalD6}:choice.kind==='ransom'?{kind:'ransom' as const,gold:choice.gold!}:{kind:'release' as const}
    const preview=buildCompanionCaptiveProposal({item,owner,captor,choice:{...outcome,holderId:holderId||null}})
    propose.mutate({caseId:item.id,owner,captor,choice:preview.choice,nextOwner:preview.nextOwner,nextCaptor:preview.nextCaptor,message:preview.message})
   }catch(e){setError(e instanceof Error?e.message:'Review the companion’s outcome.')}
  }}/>
}
