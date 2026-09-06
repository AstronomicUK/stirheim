// The defender's end of a handed-over roll. A question put by the other player arrives here — "the
// Captain wounded Skritch: armour save, needs 5+" — and the dice you throw go straight back to
// their calculator. Nothing is resolved on this side; only the faces travel.

import { useState } from 'react'
import { useAnswerBattlePrompt, type BattlePrompt, type PromptAnswer } from '../../../api/matches'
import { waitingFor } from './sheet'
import { Button, DicePicker, Icon, Notice, Sheet } from '../../../ui'

export interface PromptSheetProps {
  matchId: string
  /** Every prompt on this match; the sheet picks the ones aimed at these warbands. */
  prompts: BattlePrompt[]
  myWarbandIds: string[]
}

export function PromptSheet({ matchId, prompts, myWarbandIds }: PromptSheetProps) {
  const [dismissed, setDismissed] = useState<string[]>([])
  // The one being answered is held even once it stops waiting, so "sent" is seen rather than the
  // sheet simply vanishing the moment the answer lands.
  const [holding, setHolding] = useState<string | null>(null)
  const waiting = waitingFor(prompts, myWarbandIds).filter((p) => !dismissed.includes(p.id))
  const held = holding && !dismissed.includes(holding) ? prompts.find((p) => p.id === holding) : undefined
  const prompt = held ?? waiting[0]
  if (!prompt) return null
  return (
    <OnePrompt
      // Keyed on the prompt, so a new question always arrives with an empty set of answers.
      key={prompt.id}
      matchId={matchId}
      prompt={prompt}
      queued={waiting.filter((p) => p.id !== prompt.id).length}
      onAnswering={() => setHolding(prompt.id)}
      onClose={() => {
        setDismissed((d) => [...d, prompt.id])
        setHolding(null)
      }}
    />
  )
}

function OnePrompt({ matchId, prompt, queued, onAnswering, onClose }: { matchId: string; prompt: BattlePrompt; queued: number; onAnswering: () => void; onClose: () => void }) {
  const answer = useAnswerBattlePrompt(matchId)
  const [answers, setGiven] = useState<PromptAnswer[]>([])
  const [error, setError] = useState<string | null>(null)

  const done = answers.length === prompt.asks.length

  function record(next: PromptAnswer) {
    const all = [...answers, next]
    setGiven(all)
    if (all.length === prompt.asks.length) {
      onAnswering()
      void send(all)
    }
  }

  async function send(all: PromptAnswer[]) {
    setError(null)
    try {
      await answer.mutateAsync({ promptId: prompt.id, answers: all })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That answer could not be sent.')
      setGiven([])
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={`${prompt.attacker_name} is attacking ${prompt.target_name}`}
      description={`Turn ${prompt.turn}. They have stopped for you to roll. What you throw goes straight back to their calculator.`}
      footer={
        <Button variant="ghost" block onClick={onClose}>
          {done ? 'Close' : 'Not now — they will roll it'}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-1">
        {error ? <Notice tone="error">{error}</Notice> : null}

        <ol className="flex flex-col gap-2">
          {prompt.asks.map((ask, i) => {
            const gave = answers[i]
            const current = i === answers.length && !done
            return (
              <li
                key={`${ask.kind}-${i}`}
                className={`flex flex-col gap-2 rounded-md border px-3 py-3 ${current ? 'border-accent/60 bg-accent/5' : gave ? 'border-border bg-surface-low' : 'border-border/60 opacity-60'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{ask.label}</p>
                    <p className="text-xs leading-relaxed text-ink-dim">{ask.detail}</p>
                  </div>
                  {gave ? (
                    <span className="shrink-0 text-sm tabular-nums text-ink">{'roll' in gave ? gave.roll : 'declined'}</span>
                  ) : null}
                </div>
                {current ? (
                  <>
                    <DicePicker count={1} label={ask.label} resetKey={`${prompt.id}-${i}`} onComplete={(values) => record({ roll: values[0] })} />
                    {ask.optional ? (
                      <div>
                        <Button variant="ghost" onClick={() => record({ declined: true })}>
                          Don&apos;t
                        </Button>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </li>
            )
          })}
        </ol>

        {done ? (
          <p role="status" className="flex items-center gap-2 text-sm text-ink">
            <Icon name="battle" size={16} className="text-brass" />
            Sent back to {prompt.attacker_name}.
          </p>
        ) : null}

        {queued > 0 ? <p className="text-xs text-ink-dim">{queued} more waiting after this one.</p> : null}
      </div>
    </Sheet>
  )
}
