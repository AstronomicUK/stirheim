import { CaptiveExchangePanel } from './CaptiveExchangePanel'
import { CompanionCaptivePanel } from './CompanionCaptivePanel'
import { ForcedCaptivePanel } from './ForcedCaptivePanel'
import { useState } from 'react'
import { useCampaign, type CampaignDetail } from '../../../api/campaigns'
import { useWarband, type WarbandDetail } from '../../../api/warbands'
import { useResolveCaptive, useCaptiveCases, useAssignCaptiveCaptor, useProposeCaptiveOutcome, useRespondCaptiveProposal, useReverseCaptiveResolution, type CaptiveCase } from '../../../api/captives'
import { resolveCaptive, captiveOutcomes, type CaptiveChoice } from '../../../rules/resolve/captives'
import { Button, SelectField, DieField, Notice, TextField } from '../../../ui'
import { Section, Card } from './bits'
import { PirateKidnappedCard } from './PirateKidnappedCard'

type Preview = ReturnType<typeof resolveCaptive>

/**
 * Captured warriors on this warband's page: every case it is party to (as the warband that lost the
 * warrior, or the one holding him), plus the direct two-roster form for captures that predate cases.
 */
export function CaptiveCard({detail,campaignId,userId}:{detail:WarbandDetail;campaignId?:string;userId?:string}) {
 const campaign=useCampaign(campaignId)
 const cases=useCaptiveCases(detail.warband.id)
 const gm=campaign.data?.campaign.gm_id===userId
 const mine=detail.warband.owner_id===userId
 const active=(cases.data??[]).filter(c=>c.state!=='withdrawn')
 const held=[...detail.roster.heroes,...detail.roster.hiredSwords].filter(h=>h.status==='captured')
 const legacy=held.filter(h=>!active.some(c=>c.hero_id===h.id&&c.victim_warband_id===detail.warband.id&&c.state!=='resolved'))
 if(!active.length&&!legacy.length)return null
 return <Section title="Captured warriors">
  {active.map(c=><CaseCard key={c.id} item={c} detail={detail} campaign={campaign.data} canAct={gm||mine} gm={gm} userId={userId}/>)}
  {legacy.length?<LegacyCaptiveForm detail={detail} held={legacy} campaign={campaign.data} campaignId={campaignId} userId={userId} gm={gm}/>:null}
  {cases.error?<Notice tone="error" title="Could not load captive cases">{cases.error.message}</Notice>:null}
 </Section>
}

function CaseCard({item,detail,campaign,canAct,gm,userId}:{item:CaptiveCase;detail:WarbandDetail;campaign?:CampaignDetail;canAct:boolean;gm:boolean;userId?:string}) {
 const victimSide=item.victim_warband_id===detail.warband.id
 const otherId=victimSide?item.captor_warband_id??undefined:item.victim_warband_id
 const other=useWarband(otherId)
 const assign=useAssignCaptiveCaptor(),propose=useProposeCaptiveOutcome(),respond=useRespondCaptiveProposal(),reverse=useReverseCaptiveResolution()
 const [captorId,setCaptorId]=useState(''),[reason,setReason]=useState('')
 const owner=victimSide?detail:other.data,captor=victimSide?other.data:detail
 const bothMine=Boolean(owner&&captor&&owner.warband.owner_id===userId&&captor.warband.owner_id===userId)
 const otherName=(victimSide?item.captor?.name:item.victim?.name)??'the other warband'
 const pending=item.proposals.filter(p=>p.state==='proposed')
 const lastRejected=item.proposals.find(p=>p.state==='rejected')
 const pirates=captor?.roster.warbandTemplateId==='pirates'
 const henchman=item.subject_kind==='henchman'
 const companion=item.subject_kind==='companion'
 const forced=henchman&&item.source==='forced_capture'
 const side:'pirates'|'victim'|null=captor&&captor.warband.owner_id===userId?'pirates':owner&&owner.warband.owner_id===userId?'victim':null
 const error=assign.error??propose.error??respond.error??reverse.error
 return <Card className="flex flex-col gap-3 p-4">
  <div className="flex flex-wrap items-baseline justify-between gap-2">
   <h3 className="font-semibold">{item.hero_name}</h3>
   <span className="text-sm text-ink-dim">{item.state==='unassigned'?'Captor not yet named':item.state==='resolved'?'Outcome recorded':forced?victimSide?`Held by ${otherName}`:`Held by your warband, from ${otherName}`:henchman?victimSide?`Lost henchman; ${otherName} may press-gang him`:`Lost enemy henchman from ${otherName}`:victimSide?`Held by ${otherName}`:`Held by your warband, from ${otherName}`}</span>
  </div>
  {item.state==='unassigned'?(victimSide&&canAct?<>
   <SelectField label="Warband holding the captive" value={captorId} onChange={e=>setCaptorId(e.target.value)}><option value="">Choose the captor agreed at the table</option>{campaign?.members.filter(m=>m.warband_id!==detail.warband.id).map(m=><option key={m.warband_id} value={m.warband_id}>{m.warband.name}</option>)}</SelectField>
   <Button variant="secondary" disabled={!captorId} pending={assign.isPending} onClick={()=>assign.mutate({caseId:item.id,captorWarbandId:captorId})}>Record captor</Button>
  </>:<p className="text-sm text-ink-dim">Waiting for the player of {item.victim?.name??'the other warband'} to name the warband holding {item.hero_name}.</p>):null}
  {item.state==='open'?<>
   {pending.map(p=>{const ours=p.proposed_by_warband_id===detail.warband.id;return <Notice key={p.id} tone="info" title={ours?'Your proposal, awaiting the other player':`Proposed by ${ours?'you':p.proposed_by_warband_id===item.captor_warband_id?item.captor?.name:item.victim?.name}`}>
    <p>{p.message}</p>
    {p.proposer_note?<p className="mt-1 text-xs text-ink-dim">Proposer’s note: {p.proposer_note}</p>:null}
    {canAct?<div className="mt-2 flex flex-wrap items-end gap-2">
     {ours||gm?<Button variant="ghost" pending={respond.isPending} onClick={()=>respond.mutate({proposalId:p.id,action:'withdraw',reason:'Withdrawn by the proposer.'})}>Withdraw</Button>:null}
     {!ours||gm?<>
      <Button pending={respond.isPending} onClick={()=>respond.mutate({proposalId:p.id,action:'accept'})}>Accept and apply to both rosters</Button>
      <TextField label="Reason to reject" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Say what was agreed instead"/>
      <Button variant="danger" disabled={!reason.trim()} pending={respond.isPending} onClick={()=>{respond.mutate({proposalId:p.id,action:'reject',reason});setReason('')}}>Reject</Button>
     </>:null}
    </div>:null}
   </Notice>})}
   {lastRejected&&!pending.length?<p className="text-sm text-ink-dim">Last proposal rejected: {lastRejected.reason}</p>:null}
   {captor&&pirates&&!forced&&!companion&&!pending.length?<PirateKidnappedCard item={item} owner={owner} captor={captor} side={side} gm={gm} otherName={otherName}/>:null}
   {canAct&&owner&&captor&&companion&&!pending.length?<CompanionCaptivePanel item={item} owner={owner} captor={captor} submitLabel={gm||bothMine?'Record agreed outcome':`Propose to the player of ${otherName}`}/>:null}
   {canAct&&owner&&captor&&forced&&!pending.length?<ForcedCaptivePanel item={item} owner={owner} captor={captor} submitLabel={gm||bothMine?'Record agreed outcome':`Propose to the player of ${otherName}`}/>:null}
   {canAct&&owner&&captor&&!henchman&&!companion&&!pending.some(p=>p.proposed_by_warband_id===detail.warband.id)?<OutcomeForm owner={owner} captor={captor} heroId={item.hero_id} pending={propose.isPending}
     submitLabel={gm||bothMine?'Record agreed outcome':`Propose to the player of ${otherName}`}
     onSubmit={(preview,choice)=>propose.mutate({caseId:item.id,choice,owner,captor,nextOwner:preview.owner,nextCaptor:preview.captor,message:preview.message})}/>:null}
   {canAct&&owner&&captor&&!pending.length&&!(henchman&&item.source==='pirates_kidnapped')?<CaptiveExchangePanel item={item} owner={owner} captor={captor} submitLabel={gm||bothMine?'Record agreed exchange':`Propose exchange to ${otherName}`}/>:null}
   {canAct&&!otherId?null:other.error?<Notice tone="error" title="Could not load the other warband">{other.error.message}</Notice>:null}
   {!canAct?<p className="text-sm text-ink-dim">Only the two players (or the campaign GM) can propose or accept an outcome.</p>:null}
  </>:null}
  {item.state==='resolved'?<>
   <Notice tone="info" title="Recorded outcome">{item.resolution_message}</Notice>
   {gm||bothMine?<div className="flex flex-wrap items-end gap-2">
    <p className="w-full text-sm text-ink-dim">If another captive outcome changed either roster afterwards, reverse the newer outcome first.</p>
    <TextField label="Reason to reverse" value={reason} onChange={e=>setReason(e.target.value)} placeholder="What was recorded wrongly"/>
    <Button variant="danger" disabled={reason.trim().length<5} pending={reverse.isPending} onClick={()=>reverse.mutate({caseId:item.id,reason})}>Reverse and restore both rosters</Button>
    {gm?<Button variant="ghost" disabled={reason.trim().length<5} pending={reverse.isPending} onClick={()=>reverse.mutate({caseId:item.id,reason,releaseOnly:true})}>Release without restoring (GM)</Button>:null}
   </div>:<p className="text-sm text-ink-dim">The campaign GM can reverse this if it was recorded wrongly.</p>}
  </>:null}
  {error?<Notice tone="error" title="Could not update the captive case">{error.message}</Notice>:null}
 </Card>
}

/** The resolver-backed outcome picker shared by the case flow and the legacy direct form. */
function OutcomeForm({owner,captor,heroId,submitLabel,pending,onSubmit,disabledReason}:{owner:WarbandDetail;captor:WarbandDetail;heroId:string;submitLabel:string;pending:boolean;onSubmit:(preview:Preview,choice:CaptiveChoice)=>void;disabledReason?:string}) {
 const [chosenKind,setKind]=useState<CaptiveChoice['kind']>('ransom'),[gold,setGold]=useState('0'),[die,setDie]=useState<number|null>(null),[otherId,setOtherId]=useState(''),[leaderId,setLeaderId]=useState(''),[escapeXp,setEscapeXp]=useState<number|null>(null)
 const [groupId]=useState(()=>crypto.randomUUID())
 const outcomes=captiveOutcomes(captor.roster.warbandTemplateId)
 const kind=outcomes.some(o=>o.kind===chosenKind)?chosenKind:outcomes[0].kind
 let preview:Preview|null=null,error='',choice:CaptiveChoice|null=null
 try {
  switch(kind){case 'ransom':choice={kind,gold:gold===''?NaN:Number(gold)};break;case 'exchange':choice={kind,otherHeroId:otherId};break;case 'sell':choice={kind,d6:die??0};break;case 'zombie':choice={kind,groupId};break;case 'sacrifice':choice={kind,leaderId};break;case 'wretch':choice={kind,groupId};break;case 'throne':choice={kind,groupId,d6:die??0,leaderId};break;case 'slaveWork':choice={kind,d6:die??0,xp:escapeXp??0};break}
  preview=resolveCaptive(owner.roster,captor.roster,heroId,choice)
 }catch(e){error=e instanceof Error?e.message:'Review the outcome.'}
 return <div className="flex flex-col gap-3">
  <SelectField label="Outcome" value={kind} onChange={e=>setKind(e.target.value as CaptiveChoice['kind'])}>{outcomes.map(o=><option key={o.kind} value={o.kind}>{o.label}</option>)}</SelectField>
  {kind==='ransom'?<label className="text-sm">Agreed ransom (gc)<input className="ml-2 w-24 rounded border border-border p-2" type="number" min="0" value={gold} onChange={e=>setGold(e.target.value)}/></label>:null}
  {['sell','throne','slaveWork'].includes(kind)?<DieField label={kind==='sell'?'Slaver payment D6':kind==='throne'?'Throne of Worms D6':'Slave work D6'} sides={6} value={die} onChange={setDie} rollable/>:null}
  {kind==='exchange'?<SelectField label="Captive returned in exchange" value={otherId} onChange={e=>setOtherId(e.target.value)}><option value="">Choose the other captive</option>{[...captor.roster.heroes,...captor.roster.hiredSwords].filter(h=>h.status==='captured').map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</SelectField>:null}
  {(kind==='sacrifice'||(kind==='throne'&&die===6))?<SelectField label={kind==='throne'?'Randomly selected hero':'Warband leader'} value={leaderId} onChange={e=>setLeaderId(e.target.value)}><option value="">Choose the leader</option>{captor.roster.heroes.filter(h=>h.status==='active').map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</SelectField>:null}
  {kind==='slaveWork'&&die===1?<DieField label="Escape experience D3" sides={3} value={escapeXp} onChange={setEscapeXp} rollable/>:null}
  {error?<p className="text-sm text-ink-dim">{error}</p>:null}
  {preview?<Notice tone="info" title="Outcome to record">{preview.message}</Notice>:null}
  {disabledReason?<p className="text-sm text-ink-dim">{disabledReason}</p>:null}
  <Button disabled={!preview||!choice||Boolean(disabledReason)} pending={pending} onClick={()=>{if(preview&&choice)onSubmit(preview,choice)}}>{submitLabel}</Button>
 </div>
}

/** Captures recorded before cases existed (or outside a campaign match): the original direct two-roster save. */
function LegacyCaptiveForm({detail,held,campaign,campaignId,userId,gm}:{detail:WarbandDetail;held:{id:string;name:string}[];campaign?:CampaignDetail;campaignId?:string;userId?:string;gm:boolean}) {
 const [heroId,setHeroId]=useState(''),[captorId,setCaptorId]=useState('')
 const captor=useWarband(captorId||undefined),save=useResolveCaptive()
 const maySave=gm||(detail.warband.owner_id===userId&&captor.data?.warband.owner_id===userId)
 const selected=held.find(h=>h.id===heroId)
 return <Card className="flex flex-col gap-3 p-4">
  <SelectField label="Captured warrior" value={heroId} onChange={e=>setHeroId(e.target.value)}><option value="">Choose a warrior</option>{held.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</SelectField>
  <SelectField label="Warband holding the captive" value={captorId} onChange={e=>setCaptorId(e.target.value)}><option value="">Choose the captor agreed at the table</option>{campaign?.members.filter(m=>m.warband_id!==detail.warband.id).map(m=><option key={m.warband_id} value={m.warband_id}>{m.warband.name}</option>)}</SelectField>
  {!campaignId?<p className="text-sm text-ink-dim">Join a campaign to resolve this with the captor’s roster.</p>:null}
  {selected&&captor.data?<OutcomeForm key={`${heroId}:${captorId}`} owner={detail} captor={captor.data} heroId={selected.id} pending={save.isPending} submitLabel="Record agreed outcome"
    disabledReason={maySave?undefined:'The campaign GM, or an owner of both warbands, must record this outcome so both rosters update together.'}
    onSubmit={preview=>{if(captor.data)save.mutate({owner:detail,captor:captor.data,nextOwner:preview.owner,nextCaptor:preview.captor,reason:preview.message})}}/>:null}
  {captor.error?<Notice tone="error" title="Could not load captor">{captor.error.message}</Notice>:null}
  {save.error?<Notice tone="error" title="Could not record outcome">{save.error.message}</Notice>:null}
 </Card>
}
