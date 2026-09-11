import { useState } from 'react'
import { useTurnAction, type BattleTurns } from '../../../api/battleTurns'
import type { MatchParticipantView } from '../../../api/matches'
import { Button, Notice, Sheet } from '../../../ui'

export function TurnControls({ matchId, state, participants, myId, readOnly, loading, error, onBattleOver, hasBolasRecovery }: {
  matchId: string; state: BattleTurns | null | undefined; participants: MatchParticipantView[]; myId: string;
  readOnly: boolean; loading: boolean; error?: string; onBattleOver?: () => void; hasBolasRecovery?: boolean;
}) {
  const action = useTurnAction(matchId)
  const [order, setOrder] = useState(() => participants.map(p => p.warband_id))
  const [limit, setLimit] = useState('')
  const [dismissed, setDismissed] = useState(-1)
  const active = state?.turn_order[state.active_index]
  const mine = active === myId
  const name = participants.find(p => p.warband_id === active)?.warband_name ?? 'Opponent'
  const run = (kind: 'recover' | 'end' | 'extend') => action.mutate({ action: kind, revision: state?.revision ?? 0 })
  if (loading) return <p className="text-sm text-ink-dim">Loading turn tracker…</p>
  if (error) return <Notice tone="error" title="Turn tracker unavailable">{error}</Notice>
  if (!state && readOnly) return null
  return <section className="flex flex-col gap-3 rounded-md border border-border bg-surface-low p-4" aria-label="Turn tracker">
    {action.error ? <Notice tone="error" title="Could not update turn">{action.error.message}</Notice> : null}
    {!state ? <>
      <h2 className="font-semibold text-ink">Set turn order</h2>
      <p className="text-sm text-ink-dim">Choose the order agreed at the table. Each round gives every warband one turn.</p>
      {order.map((id, index) => <label key={index} className="flex flex-col gap-1 text-sm">Player {index + 1}
        <select className="rounded border border-border bg-surface px-3 py-2 text-ink" value={id} onChange={e => {
          const next = [...order]; const other = next.indexOf(e.target.value); next[index] = e.target.value; next[other] = id; setOrder(next)
        }}>{participants.map(p => <option key={p.warband_id} value={p.warband_id}>{p.warband_name}</option>)}</select>
      </label>)}
      <label className="flex flex-col gap-1 text-sm">Round limit (optional)
        <input type="number" min="1" step="1" value={limit} onChange={e => setLimit(e.target.value)} placeholder="No limit" className="rounded border border-border bg-surface px-3 py-2 text-ink" />
      </label>
      <Button disabled={action.isPending || order.length < 2 || (limit !== '' && (!Number.isInteger(Number(limit)) || Number(limit) < 1))} onClick={() => action.mutate({ action: 'start', revision: 0, order, limit: limit === '' ? undefined : Number(limit) })}>Start turns</Button>
    </> : <>
      <p className="font-semibold text-ink">Round {state.round}{state.round_limit ? ` of ${state.round_limit}` : ''} · {state.finished ? 'Round limit reached' : mine ? 'Your turn' : `${name}’s turn`}</p>
      {state.finished ? <div className="flex flex-wrap gap-2">
        {!readOnly && onBattleOver ? <Button onClick={onBattleOver}>Finish battle</Button> : null}
        {!readOnly && mine ? <Button disabled={action.isPending} onClick={() => run('extend')}>Play one more round</Button> : null}
      </div> : mine && !readOnly ? <Button disabled={action.isPending} onClick={() => run(state.recovered ? 'end' : 'recover')}>{state.recovered ? 'Finish my turn' : 'Recover Units'}</Button> : null}
      <p className="text-xs text-ink-dim">{state.turn_order.map(id => participants.find(p => p.warband_id === id)?.warband_name ?? 'Warband').join(' → ')}</p>
      <Sheet open={mine && !readOnly && !state.finished && !state.recovered && dismissed !== state.revision} title="Your turn!" onClose={() => setDismissed(state.revision)}>
        <div className="flex flex-col gap-4 p-4">
          <p>Recover your units: stunned becomes knocked down; knocked down models stand up. Wounds and out-of-action models stay as they are.</p>
          {hasBolasRecovery ? <Button variant="secondary" onClick={() => setDismissed(state.revision)}>Resolve Bolas Recovery first</Button> : null}
          {action.error ? <Notice tone="error" title="Recovery failed">{action.error.message}</Notice> : null}
          <Button disabled={action.isPending} onClick={() => run('recover')}>Recover Units</Button>
        </div>
      </Sheet>
    </>}
  </section>
}
