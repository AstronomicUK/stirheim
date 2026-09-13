import { useState } from 'react'
import { useCancelEngineJourney, useFinishEngineJourney, useReverseEngineJourney, type EngineJourneyStatus } from '../../../api/engineJourneys'
import type { EnginePrisonerRow } from '../../../api/engineCustody'
import { Button, Notice, Sheet, TextField } from '../../../ui'

export function EngineJourneySheet({ status, prisoners, engineName, heroes, canEdit, gm, onReturn, onClose }: {
  status: EngineJourneyStatus; prisoners: EnginePrisonerRow[]; engineName: string; heroes: { id: string; name: string }[]; canEdit: boolean; gm: boolean; onReturn: () => void; onClose: () => void
}) {
  const { journey } = status
  const cancel = useCancelEngineJourney(), finish = useFinishEngineJourney(), reverse = useReverseEngineJourney()
  const [reason, setReason] = useState('')
  const selected = prisoners.filter(p => journey.prisoner_ids.includes(p.id))
  const accepted = selected.filter(p => p.state === 'dispatched').length
  const sent = selected.filter(p => p.state === 'dispatched' || (p.state === 'held' && !p.case_id)).length
  const pending = cancel.isPending || finish.isPending || reverse.isPending
  const error = cancel.error ?? finish.error ?? reverse.error
  return <Sheet open title={engineName} description="Journey to the Dark Lands" onClose={onClose}>
    <div className="flex flex-col gap-5 pt-3">
      <div className="rounded-lg border border-border bg-surface p-4"><p className="text-xs uppercase tracking-wider text-brass">{{pending:'Awaiting agreements',away:status.ready_to_return?'Ready to return':'Away',returned:'Returned',cancelled:'Cancelled'}[journey.state]}</p><p className="mt-2 text-sm">Escorted by <strong>{journey.escort_name}</strong></p>
        <p className="mt-2 text-sm text-ink-dim">{journey.state === 'pending' ? 'The journey begins when the prisoner decisions are settled.' : journey.state === 'away' ? status.ready_to_return ? 'The missed battle is complete. Record the return to receive the reward.' : 'This engine and escort miss the next battle. A completed battle that began after departure is required.' : journey.state === 'returned' ? 'The engine returned and its reward was recorded.' : 'This journey was cancelled.'}</p>
        {status.missed_match_label ? <p className="mt-2 text-xs text-ink-dim">Missed battle: {status.missed_match_label}</p> : null}
      </div>
      <section><h3 className="mb-2 text-sm font-semibold">Captives chosen</h3><ul className="divide-y divide-border border-y border-border">{selected.map(p => <li key={p.id} className="flex justify-between gap-3 py-3 text-sm"><span className="min-w-0 break-words">{p.name}</span><span className="shrink-0 text-xs text-ink-dim">{p.state === 'dispatched' ? 'Sent' : p.state === 'held' ? 'Still held' : p.state === 'freed' ? 'Freed' : 'Reversed'}</span></li>)}</ul></section>
      {journey.state === 'returned' ? <section className="rounded-lg border border-border bg-surface p-4"><h3 className="text-sm font-semibold">Reward recorded</h3>
        <ul className="mt-2 space-y-2 text-sm">{journey.reward.allocations?.map(a => <li key={a.heroId}>{('name' in a && typeof a.name === 'string' ? a.name : heroes.find(h => h.id === a.heroId)?.name) ?? 'A Hero who has since left the roster'} gained +{a.xp} Experience.</li>)}</ul>
        {journey.reward.gold ? <p className="mt-2 text-sm">Added {journey.reward.gold} gc to the treasury.</p> : null}
        {journey.reward.d3?.length ? <p className="mt-3 text-xs text-ink-dim">Experience dice: {journey.reward.appD3 ? `app rolled ${journey.reward.appD3.join(' + ')}${journey.reward.appD3.some((d,i) => d !== journey.reward.d3?.[i]) ? `; player changed the results to ${journey.reward.d3.join(' + ')}` : ''}` : `tabletop results ${journey.reward.d3.join(' + ')}`}.</p> : null}
        {journey.reward.d6 != null ? <p className="mt-2 text-xs text-ink-dim">Gold die: {journey.reward.appD6 != null ? `app rolled ${journey.reward.appD6}${journey.reward.appD6 !== journey.reward.d6 ? `; player changed it to ${journey.reward.d6}` : ''}` : `tabletop result ${journey.reward.d6}`}.</p> : null}
        {journey.advance_ids.length ? <p className="mt-2 text-sm">{journey.advance_ids.length} {journey.advance_ids.length === 1 ? 'advance was' : 'advances were'} earned.</p> : null}
      </section> : null}
      {canEdit && journey.state === 'pending' ? <div className="flex flex-col gap-3">
        {sent > 0 ? <><p className="text-sm text-ink-dim">{sent} {sent === 1 ? 'captive has' : 'captives have'} been agreed. You can depart with this group now; undecided captives remain imprisoned.</p><Button variant="secondary" disabled={pending} pending={finish.isPending} onClick={() => finish.mutate({journeyId:journey.id,reason:'Depart with the captives already agreed; withdraw undecided proposals.'},{onSuccess:onClose})}>Depart with {sent} agreed {sent === 1 ? 'captive' : 'captives'}</Button></> : null}
        {accepted === 0 ? <><TextField label="Reason to cancel the journey" value={reason} maxLength={2000} onChange={e => setReason(e.target.value)}/><Button variant="ghost" disabled={pending || reason.trim().length < 5} pending={cancel.isPending} onClick={() => cancel.mutate({journeyId:journey.id,reason},{onSuccess:onClose})}>Cancel this journey</Button></> : null}
      </div> : null}
      {canEdit && journey.state === 'away' && status.ready_to_return ? <Button onClick={onReturn}>Record return and reward</Button> : null}
      {gm && journey.state === 'away' ? <details className="border-t border-border pt-3"><summary className="cursor-pointer text-sm text-ink-dim">Correct a journey recorded in error</summary><div className="mt-3 flex flex-col gap-3"><p className="text-sm text-ink-dim">This restores the engine and prisoners if their dependent records can still be reversed.</p><TextField label="Reason to reverse the journey" value={reason} maxLength={2000} onChange={e => setReason(e.target.value)}/><Button variant="danger" pending={reverse.isPending} disabled={pending || reason.trim().length < 5} onClick={() => reverse.mutate({journeyId:journey.id,reason},{onSuccess:onClose})}>Reverse journey</Button></div></details> : null}
      {error ? <Notice tone="error">{error.message}</Notice> : null}
    </div>
  </Sheet>
}
