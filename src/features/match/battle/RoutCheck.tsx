import { canUseRoutSilk, resolveRoutDice, chooseSilkReroll, resolveSilkReroll, correctPendingRout } from './routSilk'
import { canUseRoutRelic, passRoutWithRelic, recordLeadershipTest } from './relicRules'
import {BriberyControl} from './BriberyControl'
// The rout check, offered (never forced: the app does not track turns) once a quarter of the
// starting models are out of action. Roll it here against a chosen Leadership, mark it as taken
// at the table, or declare the rout. A failed roll routs the warband and asks whether the battle
// is over.

import { useState } from 'react'
import type { BattleLiveState } from '../../../domain/battle'
import { rollDie } from '../../../rules/resolve/dice'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterWarband } from '../../../rules/types/roster'
import { Button, DieField, Notice, SelectField, Sheet, TextField } from '../../../ui'
import type { SheetTotals } from './sheet'
import { leadershipOptions, routSkillReminders, suggestedLeadership } from './routCheckRules'
import { setNotes, setRouted } from './sheet'

export interface RoutCheckProps {
  matchId: string
  phaseKey?: string
  paidExclusions: number
  bribesReady: boolean
  roster: RosterWarband
  template: WarbandTemplate | undefined
  sheet: BattleLiveState
  totals: SheetTotals
  edit: (fn: (state: BattleLiveState) => BattleLiveState) => void
  /** Opens the "Battle over?" confirmation. */
  onBattleOver: (() => void) | undefined
  /** Map campaigns: Leadership the map adds to the leader. */
  conditions?: ReadonlyMap<string, string>
  leaderLd?: { bonus: number; sources: string[] }
}

function stamp(state: BattleLiveState, line: string): BattleLiveState {
  const notes = state.notes.trim() ? `${state.notes.trimEnd()}\n${line}` : line
  return setNotes(state, notes)
}

export function RoutCheck({ phaseKey, matchId, paidExclusions, bribesReady, roster, template, sheet, totals, edit, onBattleOver, leaderLd, conditions }: RoutCheckProps) {
  const [open, setOpen] = useState(false)
  const pendingSilk = sheet.routTests.find(test => test.stage !== 'done')
  const lastRout = sheet.routTests.filter(test => !test.correction).at(-1)
  const [confirmedFirstTest, setConfirmedFirstTest] = useState(false)
  const [outcome, setOutcome] = useState<'passed' | 'failed' | null>(null)
  const options = leadershipOptions(roster, template, sheet, leaderLd, conditions, phaseKey)
  const suggested = suggestedLeadership(options)
  const skillReminders = routSkillReminders(roster, sheet)
  const [chosenId, setChosenId] = useState<string | null>(null)
  const chosen = options.find((o) => o.id === chosenId) ?? suggested
  const [d1, setD1] = useState<number | null>(null)
  const [d2, setD2] = useState<number | null>(null)
  const ready = d1 !== null && d2 !== null && chosen !== undefined
  const total = d1 !== null && d2 !== null ? d1 + d2 : null

  function reset() {
    setConfirmedFirstTest(false)
    setD1(null)
    setD2(null)
    setOutcome(null)
  }

  function resolve(a: number, b: number, source: 'app' | 'table' = 'table') {
    if (!chosen || pendingSilk) return
    const silk = canUseRoutSilk(roster, template, sheet)
    const input = { id: crypto.randomUUID(), warriorId:chosen.id, label:chosen.label, leadership:chosen.ld, dice:[a,b] as [number,number], source }
    const passed = a+b <= chosen.ld
    setD1(a); setD2(b)
    edit(s => resolveRoutDice(s, input, canUseRoutSilk(roster, template, s)))
    if (!passed && silk) { setOpen(false); setOutcome(null) }
    else setOutcome(passed ? 'passed' : 'failed')
  }

  return (
    <>
      {pendingSilk ? <PendingSilkRout key={pendingSilk.id} test={pendingSilk} edit={edit} /> : null}
      <div role="status" className="flex flex-col gap-3 rounded-md border border-warn bg-warn/10 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-headline text-xl leading-tight text-ink">Rout check</p>
            <p className="text-sm text-ink-dim">
              {totals.ownOutOfAction} of {totals.startingModels} models are out of action (Rout threshold: {totals.routAt}). The rules call for a
              Leadership test at the start of each of your turns until the battle ends.
            </p>
            {totals.routCasualties !== totals.ownOutOfAction || totals.routModels !== totals.startingModels ? <p className="text-sm text-ink-dim">Special unit rules give a starting Rout count of {totals.routModels}; those casualties count as {totals.routCasualties}.</p> : null}
          </div>
        </div>
        {lastRout?.rerollDice && lastRout.passed ? <p className="text-sm font-semibold text-success">Last Rout check passed with Cathayan Silk Clothes: {lastRout.rerollDice.join(' + ')} against Leadership {lastRout.leadership}. The warband fights on; the silk reroll is now spent.</p> : null}
        <BriberyControl matchId={matchId} roster={roster} sheet={sheet} paidExclusions={paidExclusions} ready={bribesReady} />
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={Boolean(pendingSilk)}
            onClick={() => {
              reset()
              setOpen(true)
            }}
          >
            Roll the rout check
          </Button>
          <Button variant="secondary" disabled={Boolean(pendingSilk)} onClick={() => edit((s) => stamp(s, 'Rout check passed at the table'))}>
            Passed at the table
          </Button>
          <Button variant="danger" disabled={Boolean(pendingSilk)} onClick={() => edit((s) => setRouted(stamp(s, 'Warband routed at the table'), true, 'table'))}>
            We rout
          </Button>
        </div>
      </div>

      {canUseRoutRelic(roster, sheet, chosen) ? <Notice tone="warn" title="Holy (Unholy) Relic">
        <p>The leader automatically passes their first Leadership test. Confirm they have not already tested elsewhere at the table.</p>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={confirmedFirstTest} onChange={e => setConfirmedFirstTest(e.target.checked)} />This is the leader’s first Leadership test this battle.</label>
        <Button variant="secondary" disabled={!confirmedFirstTest} onClick={() => {
          if (!chosen) return
          edit(s => passRoutWithRelic(roster, s, chosen, confirmedFirstTest))
          setOutcome('passed')
          setOpen(false)
          setConfirmedFirstTest(false)
        }}>Pass automatically with the relic</Button>
        <Button variant="ghost" onClick={() => {
          if (!chosen) return
          edit(s => ({ ...recordLeadershipTest(s, chosen.id, 'table'), notes: [s.notes.trimEnd(), `${chosen.label}: an earlier Leadership test was confirmed at the table; the relic cannot bypass a later test.`].filter(Boolean).join('\n') }))
        }}>An earlier test was already taken</Button>
      </Notice> : null}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Rout check"
        description="2D6 equal to or under the Leadership passes."
        footer={
          outcome === null ? (
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" disabled={!chosen} onClick={() => resolve(rollDie(6), rollDie(6), 'app')}>
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
            <option value="" disabled>Select a fighter</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
                {o.leader ? ' · leader' : ''}
                {o.unavailableReason ? ` · ${o.unavailableReason}` : ''}
                {o.availabilityNote ? ` · ${o.availabilityNote}` : ''}
                {o.mayLead ? '' : ' · may not lead a Rout test'}
              </option>
            ))}
          </SelectField>
          {!suggested ? <p className="text-xs text-ink-dim">No eligible remaining fighter is available for the rules suggestion. You can select a fighter manually to resolve an exception at the table.</p> : null}
          {suggested && chosen && chosen.id !== suggested.id ? (
            <p className="text-xs text-ink-dim">The rules suggest {suggested.label}; using someone else is your call at the table.</p>
          ) : null}
          {canUseRoutSilk(roster, template, sheet) ? <Notice title="Cathayan Silk Clothes">Your leader’s silk clothes allow the first failed Rout test to be rerolled. The app will offer this before marking a rout.</Notice> : null}
          {skillReminders.length > 0 ? (
            <Notice tone="info" title="Before you roll">
              <ul className="flex flex-col gap-1">
                {skillReminders.map((r, i) => (
                  <li key={`${r.warriorId}-${i}`}>
                    <span className="font-semibold text-ink">{r.warriorName}</span> has <span className="font-semibold text-ink">{r.skillName}</span> — {r.note}.
                  </li>
                ))}
              </ul>
            </Notice>
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

function PendingSilkRout({test, edit}: {test: BattleLiveState['routTests'][number]; edit: RoutCheckProps['edit']}) {
  const [dice,setDice] = useState<[number|null,number|null]>([null,null])
  const [correction,setCorrection] = useState('')
  return <Notice tone="warn" title="Rout check — Cathayan Silk Clothes">
    <p>{test.label}: first roll {test.dice.join(' + ')} failed against Leadership {test.leadership}. The warband has not routed while this reroll is pending.</p>
    {test.stage === 'choice' ? <div className="mt-3 flex flex-wrap gap-2">
      <Button onClick={() => edit(s => chooseSilkReroll(s,test.id,true))}>Use the silk reroll</Button>
      <Button variant="secondary" onClick={() => edit(s => chooseSilkReroll(s,test.id,false))}>Decline reroll and rout</Button>
    </div> : <div className="mt-3 flex flex-col gap-3">
      <p>Reroll both dice. This result stands, even if it is worse.</p>
      <div className="grid grid-cols-2 gap-3"><DieField label="Silk reroll first D6" sides={6} value={dice[0]} onChange={v => setDice([v,dice[1]])}/><DieField label="Silk reroll second D6" sides={6} value={dice[1]} onChange={v => setDice([dice[0],v])}/></div>
      <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => edit(s => resolveSilkReroll(s,test.id,[rollDie(6),rollDie(6)],'app'))}>Roll silk reroll</Button>
      <Button disabled={dice.some(d => d === null)} onClick={() => edit(s => resolveSilkReroll(s,test.id,dice as [number,number],'table'))}>Record tabletop reroll</Button></div>
    </div>}
    <details className="mt-3"><summary className="cursor-pointer text-sm">Correct a mistaken test</summary><TextField label="Why this pending Rout test is incorrect" value={correction} onChange={e=>setCorrection(e.target.value)}/><Button variant="ghost" disabled={!correction.trim()} onClick={()=>edit(s=>correctPendingRout(s,test.id,correction))}>Withdraw pending test</Button></details>
  </Notice>
}
