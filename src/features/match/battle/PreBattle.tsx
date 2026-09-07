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
      {list
        .filter((p) => p.key.startsWith('rot:') && /spread/.test(sheet.preBattle[p.key] ?? '') && !Object.keys(sheet.preBattle).some((k) => k.startsWith('rot_spread:') && sheet.preBattle[k].endsWith(p.key)))
        .map((p) => (
          <SpreadRow key={`${p.key}:spread`} prompt={p} roster={roster} onPick={(victimId, victimName) => edit((s) => stamp(s, `rot_spread:${victimId}`, `caught from ${p.key}`, `Nurgle's Rot spreads: ${victimName} catches it from ${p.hero?.name ?? 'the carrier'}.`))} />
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
  // Leadership tests are 2D6; Toughness tests and table lookups are a single die.
  const [dice, setDice] = useState<(number | null)[]>(prompt.test === 'D6' || prompt.test === 'T' ? [null] : [null, null])
  const complete = dice.every((d) => d !== null)
  const total = complete ? dice.reduce((n, d) => n + (d ?? 0), 0) : null

  function outcomeFor(values: number[]): string {
    const sum = values.reduce((n, d) => n + d, 0)
    // Its own branch, not the target-test path below: there is no characteristic to test against,
    // just a flat "1 fails". The wording ("flares up…") is what benchedByOldWound looks for.
    if (prompt.key.startsWith('oldWound:')) return values[0] === 1 ? 'flares up: cannot fight this battle' : 'fine'
    if (prompt.test === 'D6' && prompt.outcomes) return prompt.outcomes[String(sum)] ?? `rolled ${sum}`
    if (prompt.test === '2D6' && prompt.outcomes) return prompt.outcomes[String(sum)] ?? `rolled ${sum}`
    if (prompt.target !== null) {
      if (prompt.key.startsWith('tarot:')) {
        if (sum <= prompt.target) return 'passed'
        return sum - prompt.target >= 3 ? 'disaster' : 'failed'
      }
      if (prompt.key.startsWith('rot:')) {
        // A 6 spreads the Rot whatever else it does; it also fails the test unless T is 6.
        const passed = sum <= prompt.target
        if (values[0] === 6) return passed ? 'spread' : 'failed and spread'
        return passed ? 'passed' : 'failed'
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
            {prompt.test === 'Ld' ? ' (2D6)' : ' (D6)'}
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

/** After a 6 on the Rot test: which warband member catches it? Rolled off at random by the table, then picked here. */
function SpreadRow({ prompt, roster, onPick }: { prompt: Prompt; roster: RosterWarband; onPick: (victimId: string, victimName: string) => void }) {
  const carrierId = prompt.key.slice('rot:'.length)
  const candidates = [...roster.heroes.filter((h) => h.status === 'active' && h.id !== carrierId && !h.flags.nurglesRot), ...roster.hiredSwords.filter((s) => s.status === 'active' && s.id !== carrierId && !s.flags.nurglesRot)]
  const [victim, setVictim] = useState('')
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-2">
      <p className="text-sm font-semibold text-ink">Nurgle's Rot spreads from {prompt.hero?.name ?? 'the carrier'}</p>
      <p className="text-xs leading-relaxed text-ink-dim">Randomly allocate another member of the warband (roll off at the table) and pick them here; the report marks the Rot on their card.</p>
      <div className="flex flex-wrap items-end gap-2">
        <select className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-ink" value={victim} aria-label="Who catches the Rot" onChange={(e) => setVictim(e.target.value)}>
          <option value="">Choose a warrior</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Button disabled={!victim} onClick={() => onPick(victim, candidates.find((c) => c.id === victim)?.name ?? victim)}>
          Record
        </Button>
      </div>
    </div>
  )
}
