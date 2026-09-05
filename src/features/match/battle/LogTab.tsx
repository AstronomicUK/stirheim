// The shared combat log: every attack result logged from a calculator at this table, newest
// first, with who logged it and a revert for mistakes. A reverted entry stays, struck through,
// with the note, so the record is honest.

import { useState } from 'react'
import type { MatchParticipantView } from '../../../api/matches'
import { useRevertBattleEvent } from '../../../api/matches'
import type { BattleEventRow } from '../../../domain'
import { Button, Notice, Sheet, TextArea } from '../../../ui'
import { Card, Section, Tag } from '../../roster/view/bits'

export interface LogTabProps {
  matchId: string
  events: BattleEventRow[]
  participants: MatchParticipantView[]
  /** Participants and the GM may revert; the battle must still be in progress. */
  canRevert: boolean
}

export function LogTab({ matchId, events, participants, canRevert }: LogTabProps) {
  const [reverting, setReverting] = useState<BattleEventRow | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const revert = useRevertBattleEvent(matchId)
  const byWarband = new Map(participants.map((p) => [p.warband_id, p]))
  const ordered = [...events].sort((a, b) => b.at.localeCompare(a.at))

  async function confirm() {
    if (!reverting) return
    setError(null)
    try {
      await revert.mutateAsync({ eventId: reverting.id, note: note.trim() })
      setReverting(null)
      setNote('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not revert the entry.')
    }
  }

  return (
    <>
      <Section title="Combat log" aside={events.length > 0 ? `${events.filter((e) => e.reverted_at === null).length} live` : undefined}>
        <p className="text-sm text-ink-dim">
          Results logged from the attack calculator on any phone at the table. Each one adds to the attacker&apos;s kills and the target&apos;s casualties on both
          sheets. Made a mistake? Revert it; the entry stays here, struck through.
        </p>
        {ordered.length === 0 ? (
          <Card className="px-4 py-3">
            <p className="text-sm text-ink-dim">Nothing logged yet. Finish a fight in the Attack tab and tap &quot;Log to both sheets&quot;.</p>
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {ordered.map((e) => {
                const by = e.actor_warband_id ? (byWarband.get(e.actor_warband_id)?.owner_display_name ?? 'a player') : 'the GM'
                const reverted = e.reverted_at !== null
                return (
                  <li key={e.id} className={`flex flex-col gap-1 px-4 py-2.5 ${reverted ? 'opacity-70' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <span className={`text-sm ${reverted ? 'line-through text-ink-dim' : 'text-ink'}`}>{e.summary}</span>
                      {reverted ? <Tag tone="warn">Reverted</Tag> : null}
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs text-ink-dim">
                      <span>
                        Logged by {by} · {new Date(e.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        {reverted && e.revert_note ? ` · reverted: ${e.revert_note}` : reverted ? ' · reverted' : ''}
                      </span>
                      {!reverted && canRevert ? (
                        <button type="button" onClick={() => setReverting(e)} className="min-h-9 text-brass underline-offset-4 hover:underline">
                          Revert
                        </button>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
      </Section>
      <Sheet
        open={reverting !== null}
        onClose={() => setReverting(null)}
        title="Revert this entry?"
        description={reverting?.summary}
        footer={
          <div className="flex flex-col gap-2">
            {error ? <Notice tone="error">{error}</Notice> : null}
            <Button variant="danger" block pending={revert.isPending} onClick={() => void confirm()}>
              Revert it
            </Button>
            <Button variant="ghost" block onClick={() => setReverting(null)}>
              Keep it
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3 py-2">
          <p className="text-sm text-ink-dim">The kill and the casualty it recorded come off both sheets. The entry stays in the log, marked reverted.</p>
          <TextArea label="Why (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="e.g. wrong target picked" />
        </div>
      </Sheet>
    </>
  )
}
