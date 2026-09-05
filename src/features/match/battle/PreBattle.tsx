// "Before the battle": the rolls a warband's list or kit calls for before the first turn: Tarot
// Cards (Leadership test, remembered for the exploration step), the Blessing of the Lady, the
// Dreamer's Guiding Dream, a Runesmith's inscriptions. Each is offered, rolled or typed, and the
// outcome is written to the sheet so the wizard and the log can see it. Nothing is forced.

import { useState } from 'react'
import type { BattleLiveState } from '../../../domain/battle'
import { rollDie } from '../../../rules/resolve/dice'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterWarband } from '../../../rules/types/roster'
import { prompts, type Prompt } from './preBattlePrompts'
import { Button, DieField } from '../../../ui'
import { setNotes } from './sheet'

export interface PreBattleProps {
  roster: RosterWarband
  template: WarbandTemplate | undefined
  sheet: BattleLiveState
  edit: (fn: (state: BattleLiveState) => BattleLiveState) => void
}

function stamp(state: BattleLiveState, key: string, outcome: string, line: string): BattleLiveState {
  const notes = state.notes.trim() ? `${state.notes.trimEnd()}\n${line}` : line
  return { ...setNotes(state, notes), preBattle: { ...state.preBattle, [key]: outcome } }
}

export function PreBattle({ roster, template, sheet, edit }: PreBattleProps) {
  const list = prompts(roster, template)
  if (list.length === 0) return null
  const pending = list.filter((p) => !sheet.preBattle[p.key])
  const done = list.filter((p) => sheet.preBattle[p.key])
  return (
    <section className="flex flex-col gap-2 rounded-md border border-border bg-surface-low px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-headline text-xl leading-tight text-ink">Before the battle</p>
        <span className="text-xs text-ink-dim">{pending.length === 0 ? 'All recorded' : `${pending.length} to roll`}</span>
      </div>
      {pending.map((p) => (
        <PromptRow key={p.key} prompt={p} onRecord={(outcome, line) => edit((s) => stamp(s, p.key, outcome, line))} />
      ))}
      {done.length > 0 ? (
        <ul className="flex flex-col gap-0.5 text-xs text-ink-dim">
          {done.map((p) => (
            <li key={p.key}>
              {p.title}: <span className="text-ink">{sheet.preBattle[p.key]}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function PromptRow({ prompt, onRecord }: { prompt: Prompt; onRecord: (outcome: string, line: string) => void }) {
  const [dice, setDice] = useState<(number | null)[]>(prompt.test === 'D6' ? [null] : [null, null])
  const complete = dice.every((d) => d !== null)
  const total = complete ? dice.reduce((n, d) => n + (d ?? 0), 0) : null

  function outcomeFor(values: number[]): string {
    const sum = values.reduce((n, d) => n + d, 0)
    if (prompt.test === 'D6' && prompt.outcomes) return prompt.outcomes[String(sum)] ?? `rolled ${sum}`
    if (prompt.test === '2D6' && prompt.outcomes) return prompt.outcomes[String(sum)] ?? `rolled ${sum}`
    if (prompt.target !== null) {
      if (prompt.key.startsWith('tarot:')) {
        if (sum <= prompt.target) return 'passed'
        return sum - prompt.target >= 3 ? 'disaster' : 'failed'
      }
      return sum <= prompt.target ? 'passed' : 'failed'
    }
    return `rolled ${sum}`
  }

  function record(values: number[]) {
    const outcome = outcomeFor(values)
    onRecord(outcome, `${prompt.title}: rolled ${values.join('+')}${prompt.target !== null ? ` against ${prompt.test} ${prompt.target}` : ''}: ${outcome}`)
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-2">
      <p className="text-sm font-semibold text-ink">{prompt.title}</p>
      <p className="text-xs leading-relaxed text-ink-dim">{prompt.text}</p>
      <div className="flex flex-wrap items-end gap-2">
        {dice.map((d, i) => (
          <DieField key={i} label={dice.length === 1 ? 'D6' : `Die ${i + 1}`} sides={6} value={d} onChange={(v) => setDice(dice.map((x, j) => (j === i ? v : x)))} />
        ))}
        {total !== null && prompt.target !== null ? (
          <span className="pb-2 text-sm text-ink-dim">
            {total} against {prompt.test} {prompt.target}
          </span>
        ) : null}
        <Button variant="secondary" onClick={() => record(dice.map(() => rollDie(6)))}>
          Roll for me
        </Button>
        <Button disabled={!complete} onClick={() => complete && record(dice as number[])}>
          Record
        </Button>
        <Button variant="ghost" onClick={() => onRecord('skipped', `${prompt.title}: not rolled`)}>
          Skip
        </Button>
      </div>
    </div>
  )
}
