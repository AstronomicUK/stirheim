import {HenchmanThronePanel} from './HenchmanThronePanel'
import {useState} from 'react'
import type {WarbandDetail} from '../../../api/warbands'
import {useProposeCaptiveOutcome,type CaptiveCase} from '../../../api/captives'
import {buildForcedCaptiveProposal} from '../../../api/forcedCaptives'
import {ForcedCaptiveForm} from './ForcedCaptiveForm'

export function ForcedCaptivePanel({item,owner,captor,submitLabel}:{item:CaptiveCase;owner:WarbandDetail;captor:WarbandDetail;submitLabel:string}){
 const propose=useProposeCaptiveOutcome()
 const [error,setError]=useState('')
 if(captor.roster.warbandTemplateId==='the_cursed_cavalcade')return <HenchmanThronePanel item={item} owner={owner} captor={captor} submitLabel={submitLabel}/>
 return <ForcedCaptiveForm key={item.id} name={item.hero_name} allowSell={captor.roster.warbandTemplateId!=='pit_fighters'} allowWretch={captor.roster.warbandTemplateId==='court_of_the_profane_pleasures'} ownerGold={owner.warband.gold} pending={propose.isPending} submitLabel={submitLabel} error={error||propose.error?.message} onSubmit={choice=>{
  setError('')
  try{
   const outcome=choice.kind==='wretch'?{kind:'wretch' as const}:choice.kind==='sell'?{kind:'sell' as const,d6:choice.d6!,originalD6:choice.originalD6}:choice.kind==='ransom'?{kind:'ransom' as const,gold:choice.gold!}:{kind:'release' as const}
   const preview=buildForcedCaptiveProposal({item,owner,captor,choice:outcome,newGroupId:choice.groupId})
   propose.mutate({caseId:item.id,owner,captor,choice:preview.choice,nextOwner:preview.nextOwner,nextCaptor:preview.nextCaptor,message:preview.message})
  }catch(e){setError(e instanceof Error?e.message:'Review the captive’s outcome.')}
 }}/>
}
