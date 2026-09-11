import { useState } from 'react'
import type { DreamerCertification as Certification } from '../../rules/types/roster'
import type { WarbandDetail } from '../../api/warbands'
import { useRosterEvent } from '../../api/rosterEvents'
import { useLatestReport } from '../../api/trading'
import { certifyDreamer, certificationAttemptBlock, latestDreamerCertification, DREAMWALKERS } from '../../rules/resolve/dreamerCertification'
import { Button, DieField, Notice } from '../../ui'

export function CertificationRoll({afterMatch,onConfirm,pending=false}:{afterMatch:string|null;onConfirm:(result:Certification)=>void;pending?:boolean}) {
  const [die,setDie]=useState<number|null>(null)
  const [history,setHistory]=useState<string[]>([])
  const valid=die!==null&&Number.isInteger(die)&&die>=1&&die<=6
  return <Notice title="Certify a Dreamer">
    <p>The Priest of Morr rolls a D6. On 4+, a genuine Dreamer may be hired at the normal cost. On 1–3, the Priest leads and another attempt must wait until after the next battle.</p>
    <DieField label="Dreamer certification D6" sides={6} value={die} rollable onChange={(n,source)=>{setDie(n);if(n!==null&&Number.isInteger(n)&&n>=1&&n<=6)setHistory(old=>[...old,`${source==='app'?'App rolled':'Player entered'} ${n}`])}} />
    <Button pending={pending} disabled={!valid} onClick={()=>onConfirm({die:die!,history,afterMatch,recordedAt:new Date().toISOString()})}>Confirm certification</Button>
  </Notice>
}
export function DreamerCertificationCard({detail,canEdit}:{detail:WarbandDetail;canEdit:boolean}) {
  const latest=useLatestReport(detail.warband.id)
  const save=useRosterEvent(detail)
  if(!canEdit||detail.warband.archived||detail.roster.warbandTemplateId!==DREAMWALKERS)return null
  if(detail.roster.heroes.some(h=>h.unitTemplateId==='dreamwalkers_dreamer'&&['active','captured','dead'].includes(h.status)))return null
  if(latest.isPending)return <p>Checking Dreamer certification…</p>
  if(latest.error)return <Notice tone="error">Could not check the latest battle for certification.</Notice>
  const previous=latestDreamerCertification(detail.roster)
  const block=certificationAttemptBlock(detail.roster,latest.data?.match_id ?? null)
  return <>
    {block?<Notice title={previous?.die && previous.die>=4?'Dreamer certified':'Dreamer certification'}>{block}</Notice>:<CertificationRoll key={previous?.recordedAt ?? 'first'} afterMatch={latest.data?.match_id ?? null} pending={save.isPending} onConfirm={result=>{const next=certifyDreamer(detail.roster,result);save.mutate({next:next.value,reason:next.events[0].message})}}/>}
    {save.error?<Notice tone="error">{save.error.message}</Notice>:null}
  </>
}
