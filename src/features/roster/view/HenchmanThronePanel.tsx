import {useState} from 'react'
import type {WarbandDetail} from '../../../api/warbands'
import {useProposeCaptiveOutcome,type CaptiveCase} from '../../../api/captives'
import {buildHenchmanThrone} from '../../../api/cavalcadeCaptives'
import {Button,DicePicker,DieField,Notice,SelectField} from '../../../ui'

export function HenchmanThronePanel({item,owner,captor,submitLabel}:{item:CaptiveCase;owner:WarbandDetail;captor:WarbandDetail;submitLabel:string}){
 const propose=useProposeCaptiveOutcome()
 const [die,setDie]=useState<number|null>(null),[original,setOriginal]=useState<number|null>(null),[heroId,setHeroId]=useState('')
 const [groupId]=useState(()=>crypto.randomUUID())
 let preview:ReturnType<typeof buildHenchmanThrone>|null=null,error=''
 if(die!==null)try{
  preview=buildHenchmanThrone({item,owner,captor,choice:{kind:'throne',d6:die,originalD6:original,groupId,leaderId:heroId}})
 }catch(e){error=e instanceof Error?e.message:'Review the Throne result.'}
 return <div className="flex flex-col gap-3 border-t border-border pt-3">
  <h4 className="font-semibold text-ink">Throne of Worms</h4>
  <p className="text-sm text-ink-dim">The Cavalcade resolves captured warriors at the Throne. This henchman has already left their original group; this records their fate and transfers their saved equipment.</p>
  <DicePicker label="Throne of Worms D6" onComplete={(values,manual)=>{setDie(values[0]);if(!manual)setOriginal(values[0])}}/>
  <DieField label="Throne of Worms D6 result" sides={6} value={die} onChange={setDie}/>
  {original!==null?<p className="text-xs text-ink-dim">App rolled {original}{die!==original?`; changed to ${die??'—'}`:''}. This stays in the record.</p>:null}
  {die===6?<SelectField label="Randomly selected Hero" value={heroId} onChange={e=>setHeroId(e.target.value)} hint="Randomly select a surviving Hero at the table, then record them here."><option value="">Choose the selected Hero</option>{captor.roster.heroes.filter(h=>h.status==='active').map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</SelectField>:null}
  {error?<p className="text-sm text-ink-dim">{error}</p>:null}
  {preview?<Notice tone="warn" title="Outcome to agree">{preview.message}</Notice>:null}
  <Button disabled={!preview} pending={propose.isPending} onClick={()=>{if(preview)propose.mutate({caseId:item.id,owner,captor,...preview})}}>{submitLabel}</Button>
  {propose.error?<Notice tone="error" title="Could not propose this outcome">{propose.error.message}</Notice>:null}
 </div>
}
