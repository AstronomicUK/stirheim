// Casting, at the table. Pick the wizard, pick the spell, switch on whatever he is spending, and
// walk the dice: 2D6 against the Difficulty, a re-roll if he has one to spend, then the enemy's
// chance to dispel. Every roll is shown as dice rather than described, and the result of each step
// is confirmed before the next is asked for.

import { useMemo, useRef, useState } from 'react'
import type { BattleLiveState } from '../../../domain'
import { castsThisTurn, rerollsSpent, withCast } from '../../../domain'
import {
  applyCastRoll,
  availableRerolls,
  CAST_OUTCOME_LABEL,
  declineCastStep,
  describeCast,
  spendReroll,
  startCast,
  type CasterProfile,
  type CastState,
} from '../../../rules/resolve/casting'
import { castersOf } from './casters'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterWarband } from '../../../rules/types/roster'
import type { Spell } from '../../../rules/types/magic'
import { Button, DicePicker, HoverCard, Icon, Notice, RollResult } from '../../../ui'
import { Card, Section, Tag } from '../../roster/view/bits'

export interface CastTabProps {
  roster: RosterWarband
  template: WarbandTemplate | undefined
  sheet: BattleLiveState
  readOnly: boolean
  edit?: (fn: (state: BattleLiveState) => BattleLiveState) => void
}

export function CastTab({ roster, template, sheet, readOnly, edit }: CastTabProps) {
  const casters = useMemo(() => castersOf(roster, template), [roster, template])
  const [casterId, setCasterId] = useState<string | null>(casters[0]?.heroId ?? null)
  const caster = casters.find((c) => c.heroId === casterId) ?? casters[0]
  const [state, setState] = useState<CastState | null>(null)
  const [spent, setSpent] = useState<Record<string, number>>({})
  // The attempt is written to the sheet exactly once, whatever order the renders come in.
  const recorded = useRef<string | null>(null)
  const stateRef = useRef<CastState | null>(null)

  if (casters.length === 0) {
    return (
      <Section title="Cast">
        <Card className="px-4 py-4">
          <p className="text-sm text-ink-dim">Nobody in {roster.name} casts spells or recites prayers.</p>
        </Card>
      </Section>
    )
  }
  if (!caster) return null

  const already = castsThisTurn(sheet, caster.heroId, sheet.turn)
  const spentIds = rerollsSpent(sheet, caster.heroId, sheet.turn)
  const usedUp = [...new Set([...spentIds.game.filter((id) => caster.rerolls.find((r) => r.id === id)?.limit === 'perGame'), ...spentIds.turn])]

  function begin(spell: Spell) {
    const started = startCast(caster!, spell, {
      modifiers: Object.entries(spent).map(([id, amount]) => ({ id, amount })),
      alreadyUsed: usedUp,
    })
    recorded.current = null
    stateRef.current = started
    setState(started)
    // A spell that needs no roll is finished the moment it starts.
    if (started.done) record(started)
  }

  function record(finished: CastState) {
    const token = `${finished.profile.heroId}:${finished.spell.id}:${finished.log.length}`
    if (readOnly || !edit || recorded.current === token) return
    recorded.current = token
    edit((s) =>
      withCast(s, {
        heroId: finished.profile.heroId,
        heroName: finished.profile.name,
        spellId: finished.spell.id,
        spellName: finished.spell.name,
        turn: s.turn,
        outcome: finished.outcome ?? 'failed',
        total: finished.dice ? finished.dice[0] + finished.dice[1] + finished.bonus : null,
        difficulty: finished.difficulty,
        used: finished.used.filter((id) => !usedUp.includes(id)),
      }),
    )
  }

  function advance(step: (s: CastState) => CastState) {
    const current = stateRef.current
    if (!current) return
    const next = step(current)
    stateRef.current = next
    setState(next)
    if (next.done && !current.done) record(next)
  }

  return (
    <Section title={caster.kind === 'prayer' ? 'Prayers' : 'Cast a spell'} aside={caster.lore.name}>
      <div className="flex flex-col gap-4">
        {casters.length > 1 ? (
          <div role="radiogroup" aria-label="Which caster" className="flex flex-wrap gap-1.5">
            {casters.map((c) => (
              <button
                key={c.heroId}
                type="button"
                role="radio"
                aria-checked={c.heroId === caster.heroId}
                onClick={() => {
                  setCasterId(c.heroId)
                  stateRef.current = null
                  setState(null)
                  setSpent({})
                }}
                className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${c.heroId === caster.heroId ? 'border-brass bg-surface-high text-ink' : 'border-border text-ink-dim hover:text-ink'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        ) : null}

        {caster.blocks.length > 0 ? (
          <Notice tone="error" title={`${caster.name} may not cast`}>
            {caster.blocks.join(' ')}
          </Notice>
        ) : null}
        {already.length > 0 ? (
          <Notice tone="warn" title={`Already cast this turn`}>
            {already.map((c) => `${c.spellName} — ${CAST_OUTCOME_LABEL[c.outcome].toLowerCase()}`).join('. ')}.
            {caster.secondSpell ? ' Magical Aptitude allows a second attempt after a Toughness test.' : ' A wizard may cast one spell per turn.'}
          </Notice>
        ) : null}

        {state === null ? (
          <>
            {caster.modifiers.length > 0 ? <ModifierBar caster={caster} spent={spent} setSpent={setSpent} /> : null}
            <div className="flex flex-col gap-2">
              {caster.spells.map(({ spell, difficulty }) => (
                <Card key={spell.id} className="flex flex-col gap-2 px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <HoverCard title={spell.name} label={<span className="text-sm font-semibold text-ink">{spell.name}</span>}>
                        {spell.text}
                      </HoverCard>
                      <p className="text-xs text-ink-dim">{difficulty === null ? 'Cast automatically' : `Difficulty ${difficulty}+`}</p>
                    </div>
                    <Button variant="secondary" disabled={caster.blocks.length > 0} onClick={() => begin(spell)}>
                      {caster.kind === 'prayer' ? 'Recite' : 'Cast'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            <ul className="flex flex-col gap-1 text-xs leading-relaxed text-ink-dim">
              {caster.reminders.map((line) => (
                <li key={line} className="flex gap-1.5">
                  <span aria-hidden>·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <CastRun
            state={state}
            advance={advance}
            onAgain={() => {
              stateRef.current = null
              setState(null)
            }}
            usedUp={usedUp}
          />
        )}
      </div>
    </Section>
  )
}

function ModifierBar({ caster, spent, setSpent }: { caster: CasterProfile; spent: Record<string, number>; setSpent: (next: Record<string, number>) => void }) {
  const optional = caster.modifiers.filter((m) => m.optional)
  const always = caster.modifiers.filter((m) => !m.optional)
  return (
    <Card className="flex flex-col gap-3 px-3 py-3">
      {always.length > 0 ? (
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-ink-dim">
          <span>Always applies:</span>
          {always.map((m) => (
            <Tag key={m.id} tone="brass">{`${m.name} +${m.amount}`}</Tag>
          ))}
        </p>
      ) : null}
      {optional.map((m) => {
        const on = spent[m.id] !== undefined
        return (
          <div key={m.id} className="flex flex-col gap-1.5">
            <label className="flex items-start gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={on}
                onChange={(e) => {
                  const next = { ...spent }
                  if (e.target.checked) next[m.id] = m.amount || 1
                  else delete next[m.id]
                  setSpent(next)
                }}
                className="mt-1 size-4 accent-[var(--color-brass)]"
              />
              <span className="min-w-0">
                <span className="font-medium">
                  {m.name} {m.amount > 0 ? `+${m.amount}` : ''}
                </span>
                {m.note ? <span className="block text-xs leading-relaxed text-ink-dim">{m.note}</span> : null}
              </span>
            </label>
            {on && m.amount === 0 ? (
              <div className="pl-6">
                <label className="text-[10px] uppercase tracking-wide text-ink-dim" htmlFor={`amt-${m.id}`}>
                  How much
                </label>
                <input
                  id={`amt-${m.id}`}
                  type="number"
                  min={1}
                  max={12}
                  value={spent[m.id] || 1}
                  onChange={(e) => setSpent({ ...spent, [m.id]: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })}
                  className="ml-2 min-h-9 w-16 rounded-md border border-border bg-surface-low px-2 text-center text-sm tabular-nums text-ink focus:border-brass focus:outline-none"
                />
              </div>
            ) : null}
          </div>
        )
      })}
    </Card>
  )
}

function CastRun({ state, advance, onAgain, usedUp }: { state: CastState; advance: (step: (s: CastState) => CastState) => void; onAgain: () => void; usedUp: string[] }) {
  const step = state.pending
  const last = state.log.at(-1)
  const dice = state.dice
  const target = state.difficulty
  const score = dice ? dice[0] + dice[1] + state.bonus : null

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-3 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{state.spell.name}</p>
            <p className="text-xs text-ink-dim">
              {state.difficulty === null ? 'No roll needed' : `Difficulty ${state.difficulty}+`}
              {state.bonus !== 0 ? ` · ${state.bonus > 0 ? '+' : ''}${state.bonus} from ${state.applied.map((m) => m.name).join(', ')}` : ''}
            </p>
          </div>
          <Tag tone="brass">{state.profile.name}</Tag>
        </div>

        {dice && score !== null && target !== null ? (
          <RollResult
            dice={dice}
            headline={`${score} against ${target}+`}
            detail={last?.text}
            tone={score >= target ? 'good' : 'bad'}
          />
        ) : null}

        {step ? (
          <div className="flex flex-col gap-2 rounded-md border border-brass/50 bg-surface-low px-3 py-3">
            <div>
              <p className="text-sm font-medium text-ink">{step.label}</p>
              <p className="text-xs leading-relaxed text-ink-dim">{step.detail}</p>
            </div>

            {step.kind === 'chooseReroll' ? (
              <div className="flex flex-wrap gap-2">
                {availableRerolls(state).map((r) => (
                  <Button key={r.id} variant="secondary" onClick={() => advance((s) => spendReroll(s, r.id))}>
                    {r.name}
                  </Button>
                ))}
                <Button variant="ghost" onClick={() => advance(declineCastStep)}>
                  No re-roll
                </Button>
              </div>
            ) : step.kind === 'rerollOneDie' ? (
              <OneDieReroll state={state} advance={advance} />
            ) : (
              <>
                <DicePicker
                  key={`${state.log.length}-${step.kind}`}
                  count={step.dice}
                  label={step.label}
                  resetKey={`${state.log.length}-${step.kind}`}
                  onComplete={(values) => advance((s) => applyCastRoll(s, values))}
                />
                {step.optional ? (
                  <div>
                    <Button variant="ghost" onClick={() => advance(declineCastStep)}>
                      {step.kind === 'dispel' ? 'No dispel' : step.kind === 'toughness' ? 'Stop here' : 'Skip'}
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {state.log.length > 0 ? (
          <ol className="flex flex-col gap-1 text-xs leading-relaxed text-ink-dim" aria-label="Casting log">
            {state.log.map((line, i) => (
              <li key={i} className={line.tone === 'good' ? 'text-ink' : ''}>
                {line.text}
              </li>
            ))}
          </ol>
        ) : null}

        {state.done ? (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <p role="status" className="flex items-center gap-2 text-sm text-ink">
              <Icon name="cast" size={18} className={state.outcome === 'failed' || state.outcome === 'dispelled' ? 'text-accent' : 'text-ok'} />
              <span className="font-medium">{state.outcome ? CAST_OUTCOME_LABEL[state.outcome] : 'Done'}.</span>
              <span className="text-ink-dim">{describeCast(state)}</span>
            </p>
            {usedUp.length > 0 || state.used.length > 0 ? <p className="text-xs text-ink-dim">Spent so far: {[...new Set([...usedUp, ...state.used])].join(', ') || 'nothing'}.</p> : null}
            <Button variant="ghost" block onClick={onAgain}>
              Back to the spells
            </Button>
          </div>
        ) : (
          <Button variant="ghost" block onClick={onAgain}>
            Abandon this cast
          </Button>
        )}
      </Card>
    </div>
  )
}

/** Mind Focus: choose which of the two dice to throw again, then throw it. */
function OneDieReroll({ state, advance }: { state: CastState; advance: (step: (s: CastState) => CastState) => void }) {
  const [which, setWhich] = useState<1 | 2 | null>(null)
  const dice = state.dice ?? [0, 0]
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {([1, 2] as const).map((n) => (
          <Button key={n} variant={which === n ? 'primary' : 'secondary'} onClick={() => setWhich(n)}>
            Re-roll the {n === 1 ? 'first' : 'second'} ({dice[n - 1]})
          </Button>
        ))}
      </div>
      {which ? (
        <DicePicker count={1} label={`New face for die ${which}`} resetKey={which} onComplete={(values) => advance((s) => applyCastRoll(s, [which, values[0]]))} />
      ) : null}
    </div>
  )
}
