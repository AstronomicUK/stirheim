import { useEffect, useRef, useState } from 'react'
import type { CampaignDetail } from '../../api/campaigns'
import { fetchMatchmakingHistory } from '../../api/matchmaking'
import { generateMatchups, type MatchmakingRound } from '../../rules/resolve/matchmaking'
import { Button, Notice, TextField } from '../../ui'
import { NewMatchForm } from '../match/NewMatchPage'
import { fromDateLocal, toDateLocal } from '../match/schedule/helpers'
import { Card, Section, TextLink } from './bits'

type DraftRound = MatchmakingRound & { id: string; saved: Record<number, string> }
interface Draft { rounds: DraftRound[]; date: string; roundSize: number }

export function MatchupMaker({ detail }: { detail: CampaignDetail }) {
  const active = detail.members.filter((m) => m.left_at === null && !m.warband.archived)
  const players = [...new Map(detail.members.map((m) => [m.user_id, m.display_name])).entries()]
  const [attending, setAttending] = useState<string[]>([])
  const [count, setCount] = useState('4')
  const [date, setDate] = useState(() => toDateLocal(new Date().toISOString()))
  const [draft, setDraft] = useState<Draft | null>(null)
  const [editing, setEditing] = useState<{ roundId: string; pairIndex: number } | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (editing) {
      editorRef.current?.focus()
      editorRef.current?.scrollIntoView({ block: 'start' })
    }
  }, [editing])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const label = (id: string) => {
    const m = detail.members.find((member) => member.warband_id === id)
    return m ? `${m.warband.name} (${m.display_name})` : 'Former warband'
  }

  async function generate() {
    setError(null)
    const refDate = fromDateLocal(date)
    if (!refDate) { setError('Choose a valid date.'); return }
    const number = Number(count)
    if (!Number.isInteger(number) || number < 1 || number > 50) { setError('Choose between 1 and 50 matchups.'); return }
    setPending(true)
    try {
      // Always refresh before generating: recently saved and scheduled games matter too.
      const history = await fetchMatchmakingHistory(detail.campaign.id)
      const result = generateMatchups({
        ...history, refDate, random: Math.random, attendingPlayerIds: attending,
        warbands: active.map((m) => ({ id: m.warband_id, ownerId: m.warband.owner_id, active: true })),
      }, number)
      if (!result.ok) { setError(result.error); return }
      setDraft({
        rounds: result.rounds.map((round) => ({ ...round, id: crypto.randomUUID(), saved: {} })),
        date, roundSize: Math.floor(active.filter((m) => attending.includes(m.warband.owner_id)).length / 2),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the campaign match history.')
    } finally { setPending(false) }
  }

  const editingRound = draft?.rounds.find((r) => r.id === editing?.roundId)
  const editingPair = editing && editingRound?.pairs[editing.pairIndex]
  if (editing && editingRound && editingPair && draft) {
    return <div ref={editorRef} tabIndex={-1}><Section title="Schedule matchup">
      <NewMatchForm key={`${editing.roundId}-${editing.pairIndex}`} detail={detail} matchup={{
        warbandIds: [...editingPair], date: draft.date, roundId: editingRound.id, byeWarbandId: editingRound.bye,
        onCancel: () => setEditing(null),
        onSaved: (matchId) => {
          setDraft((current) => current && ({ ...current, rounds: current.rounds.map((r) => r.id === editing.roundId
            ? { ...r, saved: { ...r.saved, [editing.pairIndex]: matchId } } : r) }))
          setEditing(null)
        },
      }} />
    </Section></div>
  }

  return <Section title="Matchup maker">
    <Card className="flex flex-col gap-4 px-4 py-4">
      <p className="text-sm leading-relaxed text-ink-dim">Generate the next games with as few repeat opponents as possible. Each attending player enters all their active enrolled warbands. Rounds are groups of pairings, not simultaneous games: a player may use several warbands.</p>
      <fieldset disabled={pending} className="flex flex-col gap-2">
        <legend className="mb-2 text-sm text-ink">Who’s attending?</legend>
        {players.length === 0 ? <p className="text-sm text-ink-dim">Enroll at least two players’ warbands first.</p> : players.map(([id, name]) => {
          const bands = active.filter((m) => m.user_id === id)
          return <label key={id} className="flex min-h-11 items-center gap-3">
            <input type="checkbox" className="h-5 w-5 shrink-0 accent-brass" checked={attending.includes(id)} disabled={bands.length === 0}
              onChange={(e) => setAttending((ids) => e.target.checked ? [...ids, id] : ids.filter((v) => v !== id))} />
            <span className="min-w-0 text-sm text-ink">{name}<span className="block text-ink-dim">{bands.map((m) => m.warband.name).join(', ') || 'No active warbands'}</span></span>
          </label>
        })}
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Number of matchups" type="number" min={1} max={50} step={1} value={count} onChange={(e) => setCount(e.target.value)} disabled={pending} />
        <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={pending} hint="You can change the date when scheduling each game." />
      </div>
      <Button pending={pending} disabled={attending.length < 2} onClick={() => void generate()}>{draft ? 'Generate a new batch' : 'Generate matchups'}</Button>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {draft ? <div className="flex flex-col gap-4" aria-live="polite">
        <p className="text-sm text-ink-dim">Proposals for {draft.date}. Only games you schedule are saved. Generating again replaces these proposals; saved games stay in Battles.</p>
        {draft.rounds.map((round, index) => <div key={round.id} className="flex flex-col gap-2 border-t border-border pt-3">
          <h3 className="text-sm font-medium text-ink">Round {index + 1}{round.pairs.length < draft.roundSize ? ' · partial round' : ''}</h3>
          {round.pairs.length < draft.roundSize ? <p className="text-xs text-ink-dim">Only the remaining requested matchups are shown; other warbands sit out this partial round.</p> : null}
          {round.pairs.map(([a, b], pairIndex) => <div key={`${a}-${b}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
            <p className="min-w-0 text-sm text-ink">{label(a)} <span className="text-ink-dim">vs</span> {label(b)}</p>
            {round.saved[pairIndex] ? <TextLink to={`/matches/${round.saved[pairIndex]}`}>Scheduled — view battle</TextLink>
              : <Button variant="secondary" onClick={() => setEditing({ roundId: round.id, pairIndex })}>Schedule this pairing</Button>}
          </div>)}
          {round.bye ? <p className="text-sm text-ink-dim">Bye: {label(round.bye)}. Recorded once when a game from this round is scheduled.</p> : null}
        </div>)}
      </div> : null}
    </Card>
  </Section>
}
