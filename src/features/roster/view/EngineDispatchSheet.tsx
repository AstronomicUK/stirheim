import { useState } from 'react'
import { useDispatchEngine } from '../../../api/engineJourneys'
import type { EngineInventoryRow } from '../../../api/engines'
import type { EnginePrisonerRow } from '../../../api/engineCustody'
import type { RosterHero } from '../../../rules/types/roster'
import { hashutRewardPlan } from '../../../rules/resolve/engineOfChaos'
import { Button, Notice, SelectField, Sheet } from '../../../ui'

export function EngineDispatchSheet({ engine, prisoners, heroes, onClose }: { engine: EngineInventoryRow; prisoners: EnginePrisonerRow[]; heroes: RosterHero[]; onClose: () => void }) {
  const dispatch = useDispatchEngine()
  const [selected, setSelected] = useState<string[]>([]), [escortId, setEscortId] = useState('')
  const available = prisoners.filter(p => p.engine_id === engine.id && p.state === 'held')
  const chosen = available.filter(p => selected.includes(p.id))
  const eligible = heroes.filter(h => h.status === 'active' && Number(h.flags.missNextGames ?? 0) === 0)
  let reward = '', invalid = ''
  if (chosen.length) {
    try { const plan = hashutRewardPlan(chosen); reward = plan.xpRecipient === 'leader' ? '+1 Experience for the warband leader' : plan.d6GoldCount ? '2D3 Experience to share among Heroes, plus D6 × 5 gc' : 'D3 Experience to share among Heroes' }
    catch (e) { invalid = e instanceof Error ? e.message : 'Review the engine’s capacity.' }
  }
  return <Sheet open title="Send captives to the Dark Lands" description={engine.name} onClose={onClose}
    footer={<Button block disabled={!chosen.length || !eligible.some(h => h.id === escortId) || Boolean(invalid)} pending={dispatch.isPending} onClick={() => dispatch.mutate({ engineId: engine.id, escortHeroId: escortId, prisonerIds: chosen.map(p => p.id), expectedUpdatedAt: engine.updated_at }, { onSuccess: onClose })}>Arrange the journey</Button>}>
    <div className="flex flex-col gap-5 pt-3">
      <Notice tone="warn">Chosen captives are sacrificed to Hashut and permanently removed from their former warbands. Their confiscated equipment stays with this warband. The other players must agree before their captives are sent.</Notice>
      <fieldset className="flex min-w-0 flex-col gap-2"><legend className="mb-2 text-sm font-semibold">Choose captives</legend>
        {available.map(p => <label key={p.id} className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${selected.includes(p.id) ? 'border-brass bg-brass/10' : 'border-border bg-surface'}`}>
          <input className="h-4 w-4 shrink-0 accent-[#8b713e]" type="checkbox" checked={selected.includes(p.id)} disabled={dispatch.isPending} onChange={e => setSelected(ids => e.target.checked ? [...ids,p.id] : ids.filter(id => id !== p.id))}/>
          <span className="min-w-0 flex-1 break-words text-sm font-semibold">{p.name}<span className="mt-1 block text-xs font-normal text-ink-dim">{p.case_id ? 'Their player must agree' : 'Exploration captive'}{p.large ? ' · Large' : ''}</span></span>
        </label>)}
      </fieldset>
      <SelectField label="Hero escort" value={escortId} onChange={e => setEscortId(e.target.value)} disabled={dispatch.isPending}><option value="">Choose a Hero to accompany the engine</option>{eligible.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</SelectField>
      <p className="text-sm text-ink-dim">This engine and its escort will miss the next battle. The reward is recorded when they return after that battle.</p>
      {chosen.length ? <div className="rounded-lg border border-border bg-surface p-4"><p className="text-xs text-ink-dim">Reward on return, if all chosen captives are sent</p><p className="mt-2 font-semibold">{reward}</p><p className="mt-2 text-xs text-ink-dim">{chosen.length} {chosen.length === 1 ? 'captive' : 'captives'}. A Large captive counts once for this reward.</p></div> : null}
      {invalid || dispatch.error ? <Notice tone="error">{invalid || dispatch.error?.message}</Notice> : null}
    </div>
  </Sheet>
}
