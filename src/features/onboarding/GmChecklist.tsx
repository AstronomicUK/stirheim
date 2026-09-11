import { Link } from 'react-router'
import { useSession } from '../../app/session'
import { useGmChecklist, type ChecklistState } from '../../api/gmChecklist'
import { Button, Notice } from '../../ui'
import { Card, Section } from '../campaign/bits'
import { gmChecklistSteps } from './checklist'

export interface GmChecklistProps { campaignId: string; memberCount: number; matchCount: number }

export function GmChecklist({campaignId,memberCount,matchCount}:GmChecklistProps) {
  const userId=useSession(s=>s.user?.id)
  const {query,save}=useGmChecklist(campaignId,userId)
  if(query.isPending)return <p className="text-sm text-ink-dim">Loading your GM checklist…</p>
  if(query.error)return <Notice tone="error" title="Could not load your checklist">{query.error.message}<Button variant="ghost" onClick={()=>void query.refetch()}>Try again</Button></Notice>
  const state=query.data!
  const steps=gmChecklistSteps({campaignId,memberCount,matchCount})
  const doneCount=steps.filter(s=>s.done || state.completed_steps.includes(s.id)).length
  const update=(next:ChecklistState)=>save.mutate(next)
  const error=save.error ? <Notice tone="error" title="Checklist not saved">{save.error.message} Your previous saved state is unchanged. Please try again.</Notice>:null
  if(state.status!=='open')return <div className="flex flex-col gap-2">{error}<div className="flex items-center justify-between gap-3 text-sm text-ink-dim"><span>{state.status==='complete'?'GM checklist complete.':'GM checklist hidden.'}</span><Button variant="ghost" disabled={save.isPending} onClick={()=>update({...state,status:'open'})}>{state.status==='complete'?'Review checklist':'Show checklist'}</Button></div></div>
  return <Section title="GM checklist" aside={<Button variant="ghost" disabled={save.isPending} onClick={()=>update({...state,status:'hidden'})}>Dismiss</Button>}>
    {error}
    <Card className="flex flex-col gap-3 px-4 py-3">
      <p className="text-xs text-ink-dim">{doneCount} of {steps.length} steps done. Tick off the steps you have reviewed; importing history is optional.</p>
      <ol className="flex flex-col divide-y divide-border">{steps.map(step=>{
        const done=!!step.done || (save.isPending ? save.variables.completed_steps : state.completed_steps).includes(step.id)
        return <li key={step.id} className="flex items-start gap-3 py-2">
          <label className="flex min-h-11 min-w-11 items-center justify-center"><input type="checkbox" checked={done} disabled={save.isPending || !!step.done} aria-label={`Mark done: ${step.label}`} className="h-5 w-5 accent-brass" onChange={e=>update({...state,completed_steps:e.target.checked?[...state.completed_steps,step.id]:state.completed_steps.filter(id=>id!==step.id)})}/></label>
          <div className="min-w-0 flex-1 py-2 text-sm"><span className={done?'text-ink-dim':'text-ink'}>{step.label}</span>{step.to ? <Link to={step.to} className="ml-2 text-brass underline">Open</Link>:null}</div>
        </li>
      })}</ol>
      <Button variant="secondary" disabled={save.isPending} onClick={()=>update({status:'complete',completed_steps:steps.map(s=>s.id)})}>Finish checklist</Button>
      <p className="text-xs text-ink-dim">Saved to your account for this campaign. You can reopen it later.</p>
    </Card>
  </Section>
}
