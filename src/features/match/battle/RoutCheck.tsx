// The rout check, offered (never forced: the app does not track turns) once a quarter of the
// starting models are out of action. Roll it here against a chosen Leadership, mark it as taken
// at the table, or declare the rout. A failed roll routs the warband and asks whether the battle
// is over.

import { useState } from 'react'
import type { BattleLiveState } from '../../../domain/battle'
import { rollDie } from '../../../rules/resolve/dice'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterWarband } from '../../../rules/types/roster'
import { Button, DieField, Notice, SelectField, Sheet } from '../../../ui'
import type { SheetTotals } from './sheet'
import { leadershipOptions, suggestedLeadership } from './routCheckRules'
import { setNotes, setRouted } from './sheet'

export interface RoutCheckProps {
  roster: RosterWarband
  template: WarbandTemplate | undefined
  sheet: BattleLiveState
  totals: SheetTotals
  edit: (fn: (state: BattleLiveState) => BattleLiveState) => void
  /** Opens the "Battle over?" confirmation. */
  onBattleOver: (() => void) | undefined
}

function stamp(state: BattleLiveState, line: string): BattleLiveState {
  const notes = state.notes.trim() ? `${state.notes.trimEnd()}\n${line}` : line
  return setNotes(state, notes)
}

export function RoutCheck({ roster, template, sheet, totals, edit, onBattleOver }: RoutCheckProps) {
  const [open, setOpen] = useState(false)
  const [outcome, setOutcome] = useState<'passed' | 'failed' | null>(null)
  const options = leadershipOptions(roster, template, sheet)
  const suggested = suggestedLeadership(options)
  const [chosenId, setChosenId] = useState<string | null>(null)
  const chosen = options.find((o) => o.id === chosenId) ?? suggested
  const [d1, setD1] = useState<number | null>(null)
  const [d2, setD2] = useState<number | null>(null)
  const ready = d1 !== null && d2 !== null && chosen !== undefined
  const total = d1 !== null && d2 !== null ? d1 + d2 : null

  function reset() {
    setD1(null)
    setD2(null)
    setOutcome(null)
  }

  function resolve(a: number, b: number) {
    if (!chosen) return
    const sum = a + b
    const passed = sum <= chosen.ld
    setD1(a)
    setD2(b)
    setOutcome(passed ? 'passed' : 'failed')
    edit((s) => {
      const line = `Rout check ${passed ? 'passed' : 'failed'}: rolled ${sum} against ${chosen.label}`
      return passed ? stamp(s, line) : setRouted(stamp(s, line), true)
    })
  }

  return (
    <>
      <div role="status" className="flex flex-col gap-3 rounded-md border border-warn bg-warn/10 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-headline text-xl leading-tight text-ink">Rout check</p>
            <p className="text-sm text-ink-dim">
              {totals.ownOutOfAction} of {totals.startingModels} models are out of action (a quarter is {totals.routAt}). The rules call for a
              Leadership test at the start of each of your turns until the battle ends.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              reset()
              setOpen(true)
            }}
          >
            Roll the rout check
          </Button>
          <Button variant="secondary" onClick={() => edit((s) => stamp(s, 'Rout check passed at the table'))}>
            Passed at the table
          </Button>
          <Button variant="danger" onClick={() => edit((s) => setRouted(stamp(s, 'Warband routed'), true))}>
            We rout
          </Button>
        </div>
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Rout check"
        description="2D6 equal to or under the Leadership passes."
        footer={
          outcome === null ? (
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => resolve(rollDie(6), rollDie(6))}>
                Roll for me
              </Button>
              <Button className="flex-1" disabled={!ready} onClick={() => ready && resolve(d1, d2)}>
                Resolve
              </Button>
            </div>
          ) : outcome === 'passed' ? (
            <Button block onClick={() => setOpen(false)}>
              Fight on
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                block
                onClick={() => {
                  setOpen(false)
                  onBattleOver?.()
                }}
                disabled={!onBattleOver}
              >
                End the battle
              </Button>
              <Button variant="ghost" block onClick={() => setOpen(false)}>
                Not yet, the others are still fighting
              </Button>
            </div>
          )
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <SelectField label="Whose Leadership" value={chosen?.id ?? ''} onChange={(e) => setChosenId(e.target.value)} disabled={outcome !== null}>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
                {o.leader ? ' · leader' : ''}
                {o.standing ? '' : ' · out of action'}
              </option>
            ))}
          </SelectField>
          {suggested && chosen && chosen.id !== suggested.id ? (
            <p className="text-xs text-ink-dim">The rules suggest {suggested.label}; using someone else is your call at the table.</p>
          ) : null}
          <div className="flex flex-wrap items-end gap-3">
            <DieField label="First die" sides={6} value={d1} onChange={setD1} disabled={outcome !== null} />
            <DieField label="Second die" sides={6} value={d2} onChange={setD2} disabled={outcome !== null} />
            {total !== null ? (
              <p className="pb-2 text-sm text-ink-dim">
                Total <span className="font-semibold text-ink">{total}</span>
                {chosen ? ` against Ld ${chosen.ld}` : ''}
              </p>
            ) : null}
          </div>
          {outcome === 'passed' ? (
            <Notice tone="success" title="Passed">
              The warband holds. Test again at the start of your next turn while a quarter or more are down.
            </Notice>
          ) : null}
          {outcome === 'failed' ? (
            <Notice tone="error" title="Failed: the warband routs">
              Marked as routed on your sheet. If the other warbands are still fighting, keep the sheet open and end the battle when the table agrees.
            </Notice>
          ) : null}
        </div>
      </Sheet>
    </>
  )
}
