import { useState } from 'react'
import { useCampaign } from '../../../api/campaigns'
import { useWarband, type WarbandDetail } from '../../../api/warbands'
import { useResolveCaptive } from '../../../api/captives'
import { resolveCaptive, captiveOutcomes, type CaptiveChoice } from '../../../rules/resolve/captives'
import { Button, SelectField, DieField, Notice } from '../../../ui'
import { Section, Card } from './bits'
export function CaptiveCard({detail,campaignId,userId}:{detail:WarbandDetail;campaignId?:string;userId?:string}) {
 const campaign=useCampaign(campaignId)
 const [heroId,setHeroId]=useState(''),[captorId,setCaptorId]=useState('')
 const [chosenKind,setKind]=useState<CaptiveChoice['kind']>('ransom'),[gold,setGold]=useState('0'),[die,setDie]=useState<number|null>(null),[otherId,setOtherId]=useState(''),[leaderId,setLeaderId]=useState(''),[escapeXp,setEscapeXp]=useState<number|null>(null)
 const [groupId]=useState(()=>crypto.randomUUID())
 const captor=useWarband(captorId||undefined),save=useResolveCaptive()
 const held=[...detail.roster.heroes,...detail.roster.hiredSwords].filter(h=>h.status==='captured')
 if(!held.length)return null
 const gm=campaign.data?.campaign.gm_id===userId
 const maySave=gm||(detail.warband.owner_id===userId&&captor.data?.warband.owner_id===userId)
 const outcomes=captiveOutcomes(captor.data?.roster.warbandTemplateId??'')
 const kind=outcomes.some(o=>o.kind===chosenKind)?chosenKind:outcomes[0].kind
 const selected=held.find(h=>h.id===heroId)
 let preview:ReturnType<typeof resolveCaptive>|null=null,error=''
 if(selected&&captor.data){try {
  let choice:CaptiveChoice
  switch(kind){case 'ransom':choice={kind,gold:gold===''?NaN:Number(gold)};break;case 'exchange':choice={kind,otherHeroId:otherId};break;case 'sell':choice={kind,d6:die??0};break;case 'zombie':choice={kind,groupId};break;case 'sacrifice':choice={kind,leaderId};break;case 'wretch':choice={kind,groupId};break;case 'throne':choice={kind,groupId,d6:die??0,leaderId};break;case 'slaveWork':choice={kind,d6:die??0,xp:escapeXp??0};break}
  preview=resolveCaptive(detail.roster,captor.data.roster,selected.id,choice)
 }catch(e){error=e instanceof Error?e.message:'Review the outcome.'}}
 return <Section title="Captured warriors"><Card className="flex flex-col gap-3 p-4">
  <SelectField label="Captured warrior" value={heroId} onChange={e=>setHeroId(e.target.value)}><option value="">Choose a warrior</option>{held.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</SelectField>
  <SelectField label="Warband holding the captive" value={captorId} onChange={e=>{setCaptorId(e.target.value);setKind('ransom');setOtherId('');setLeaderId('')}}><option value="">Choose the captor agreed at the table</option>{campaign.data?.members.filter(m=>m.warband_id!==detail.warband.id).map(m=><option key={m.warband_id} value={m.warband_id}>{m.warband.name}</option>)}</SelectField>
  {!campaignId?<p className="text-sm text-ink-dim">Join a campaign to resolve this with the captor’s roster.</p>:null}
  {captor.data?<>
   <SelectField label="Outcome" value={kind} onChange={e=>setKind(e.target.value as CaptiveChoice['kind'])}>{outcomes.map(o=><option key={o.kind} value={o.kind}>{o.label}</option>)}</SelectField>
   {kind==='ransom'?<label className="text-sm">Agreed ransom (gc)<input className="ml-2 w-24 rounded border border-border p-2" type="number" min="0" value={gold} onChange={e=>setGold(e.target.value)}/></label>:null}
   {['sell','throne','slaveWork'].includes(kind)?<DieField label={kind==='sell'?'Slaver payment D6':kind==='throne'?'Throne of Worms D6':'Slave work D6'} sides={6} value={die} onChange={setDie} rollable/>:null}
   {kind==='exchange'?<SelectField label="Captive returned in exchange" value={otherId} onChange={e=>setOtherId(e.target.value)}><option value="">Choose the other captive</option>{[...captor.data.roster.heroes,...captor.data.roster.hiredSwords].filter(h=>h.status==='captured').map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</SelectField>:null}
   {(kind==='sacrifice'||(kind==='throne'&&die===6))?<SelectField label={kind==='throne'?'Randomly selected hero':'Warband leader'} value={leaderId} onChange={e=>setLeaderId(e.target.value)}><option value="">Choose the leader</option>{captor.data.roster.heroes.filter(h=>h.status==='active').map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</SelectField>:null}
   {kind==='slaveWork'&&die===1?<DieField label="Escape experience D3" sides={3} value={escapeXp} onChange={setEscapeXp} rollable/>:null}
   {error?<p className="text-sm text-ink-dim">{error}</p>:null}
   {preview?<Notice tone="info" title="Outcome to record">{preview.message}</Notice>:null}
   {!maySave?<p className="text-sm text-ink-dim">The campaign GM, or an owner of both warbands, must record this outcome so both rosters update together.</p>:null}
   <Button disabled={!preview||!maySave} pending={save.isPending} onClick={()=>{if(preview&&captor.data)save.mutate({owner:detail,captor:captor.data,nextOwner:preview.owner,nextCaptor:preview.captor,reason:preview.message})}}>Record agreed outcome</Button>
  </>:null}
  {captor.error?<Notice tone="error" title="Could not load captor">{captor.error.message}</Notice>:null}
  {save.error?<Notice tone="error" title="Could not record outcome">{save.error.message}</Notice>:null}
 </Card></Section>
}
