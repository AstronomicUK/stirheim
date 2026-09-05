import { useState } from 'react'
import { lookupHeroInjury } from '../../../rules/data/campaign/injuries'
import { HENCHMAN_INJURY } from '../../../rules/data/campaign/injuries'
import { rollDie } from '../../../rules/resolve/dice'
import { Button, DieField, Markdown, Stepper, TextField } from '../../../ui'
import { Card, Section, Tag } from '../../roster/view/bits'
import {
  addHeroInjuryRoll,
  resetHeroInjury,
  setGroupInjuryDice,
  setGroupInjuryRoll,
  setHeroInjuryCount,
  setInjurySkip,
  setHeroInjurySubRoll,
  setSwordInjury,
  type HeroInjuryResolution,
  type InjuryOutcome,
} from '../model'
import { D66Entry, Intro, type StepProps } from './bits'
import { warriorTypeLabel } from './names'
import { StepBody } from './WizardShell'

const OUTCOME_TAG: Record<InjuryOutcome, { label: string; tone: 'neutral' | 'warn' | 'danger' | 'brass' }> = {
  recovered: { label: 'Recovered', tone: 'brass' },
  injured: { label: 'Injured', tone: 'warn' },
  dead: { label: 'Dead', tone: 'danger' },
  captured: { label: 'Captured', tone: 'danger' },
  retired: { label: 'Retired', tone: 'danger' },
}

export function InjuriesStep({ draft, derived, ctx, update }: StepProps) {
  const { heroes, hiredSwords, groups, summary } = derived.injuries
  const nothing = heroes.length === 0 && hiredSwords.length === 0 && groups.length === 0
  return (
    <StepBody title="Serious injuries">
      <Intro>
        Roll for every warrior taken out of action, with both players watching. Heroes roll a D66; hired swords and henchmen a D6 each. If a skill, an item or a
        house rule means no roll is needed, say so and it is logged on the report.
      </Intro>
      {nothing ? (
        <Card className="px-4 py-3">
          <p className="text-sm text-ink">No casualties. Everyone walks back to camp.</p>
        </Card>
      ) : null}
      {heroes.length > 0 ? (
        <Section title="Heroes (D66)">
          {heroes.map(({ hero, resolution }) => (
            <HeroInjuryCard
              key={hero.id}
              name={hero.name}
              type={warriorTypeLabel(ctx, hero)}
              resolution={resolution}
              skip={draft.injurySkips[hero.id]}
              onSkip={(reason) => update((d) => setInjurySkip(d, hero.id, reason))}
              onD66={(d66) => update((d) => addHeroInjuryRoll(d, hero.id, d66))}
              onSubRoll={(index, v) => update((d) => (v === null ? d : setHeroInjurySubRoll(d, hero.id, index, v)))}
              onCount={(v) => update((d) => (v === null ? d : setHeroInjuryCount(d, hero.id, v)))}
              onReset={() => update((d) => resetHeroInjury(d, hero.id))}
            />
          ))}
        </Section>
      ) : null}
      {hiredSwords.length > 0 ? (
        <Section title="Hired swords (D6)">
          {hiredSwords.map(({ sword, resolution }) => (
            <Card key={sword.id} className="flex flex-col gap-3 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-ink">{sword.name}</p>
                  <p className="text-xs text-ink-dim">{warriorTypeLabel(ctx, sword)} · 1-2 lost, 3-6 survives</p>
                </div>
                {resolution.outcome ? <Tag tone={OUTCOME_TAG[resolution.outcome].tone}>{OUTCOME_TAG[resolution.outcome].label}</Tag> : null}
              </div>
              {draft.injurySkips[sword.id] === undefined ? (
                <DieField label="D6" sides={6} value={draft.swordInjuries[sword.id] ?? null} onChange={(v) => update((d) => setSwordInjury(d, sword.id, v))} rollable />
              ) : null}
              <SkipRow skip={draft.injurySkips[sword.id]} onSkip={(reason) => update((d) => setInjurySkip(d, sword.id, reason))} />
              {resolution.line ? <p className="text-xs text-ink-dim">{resolution.line.effect}.</p> : null}
            </Card>
          ))}
        </Section>
      ) : null}
      {groups.length > 0 ? (
        <Section title="Henchmen (D6 each)">
          {groups.map(({ group, outOfAction, dice, resolution }) => {
            const rolls = draft.groupInjuries[group.id] ?? []
            const diceOverride = draft.groupInjuryDice[group.id]
            return (
              <Card key={group.id} className="flex flex-col gap-3 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-ink">{group.name}</p>
                    <p className="text-xs text-ink-dim">
                      {outOfAction} of {group.size} out of action · dead on {HENCHMAN_INJURY.deadOn.join('-')}
                    </p>
                  </div>
                  {resolution.complete ? (
                    <Tag tone={resolution.dead > 0 ? 'danger' : 'brass'}>{resolution.dead === 0 ? 'All recover' : `${resolution.dead} dead`}</Tag>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-ink-dim">Dice to roll {diceOverride ? '(changed)' : `· suggested ${outOfAction}`}</span>
                    {diceOverride ? (
                      <button type="button" onClick={() => update((d) => setGroupInjuryDice(d, group.id, null))} className="self-start text-xs text-brass underline-offset-4 hover:underline">
                        Back to {outOfAction}
                      </button>
                    ) : null}
                  </div>
                  <Stepper value={dice} min={0} max={20} onChange={(n) => update((d) => setGroupInjuryDice(d, group.id, n === outOfAction ? null : { count: n, reason: d.groupInjuryDice[group.id]?.reason ?? '' }))} label={`${group.name} injury dice`} />
                </div>
                {diceOverride && diceOverride.count !== outOfAction ? (
                  <TextField
                    label="Why a different number"
                    value={diceOverride.reason}
                    autoComplete="off"
                    placeholder="e.g. one was only knocked down when the game ended"
                    onChange={(e) => update((d) => setGroupInjuryDice(d, group.id, { count: diceOverride.count, reason: e.target.value }))}
                    error={diceOverride.reason.trim() ? undefined : 'Say why; it goes on the report'}
                  />
                ) : null}
                <div className="flex flex-wrap items-end gap-2">
                  {Array.from({ length: dice }, (_, i) => (
                    <DieField key={i} label={`Model ${i + 1}`} sides={6} value={rolls[i] ?? null} onChange={(v) => update((d) => setGroupInjuryRoll(d, group.id, i, v))} />
                  ))}
                  {dice > 0 ? (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        update((d) => {
                          let next = d
                          for (let i = 0; i < dice; i++) if ((d.groupInjuries[group.id]?.[i] ?? null) === null) next = setGroupInjuryRoll(next, group.id, i, rollDie(6))
                          return next
                        })
                      }
                    >
                      Roll the rest
                    </Button>
                  ) : null}
                </div>
                {resolution.complete ? (
                  <p className="text-xs text-ink-dim">
                    {group.size} → {resolution.group.size} {resolution.group.size === 1 ? 'model' : 'models'}
                    {resolution.group.size === 0 ? ' · the group is wiped out and stays on the roster for history' : ''}
                  </p>
                ) : null}
              </Card>
            )
          })}
        </Section>
      ) : null}
      {!nothing ? (
        <Card className="px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-ink-dim">Running summary</p>
          <p className="mt-1 text-sm text-ink">
            {[
              summary.dead > 0 ? `${summary.dead} dead` : null,
              summary.captured > 0 ? `${summary.captured} captured` : null,
              summary.retired > 0 ? `${summary.retired} retired` : null,
              summary.injured > 0 ? `${summary.injured} injured` : null,
              summary.recovered > 0 ? `${summary.recovered} recovered` : null,
              summary.henchmenDead > 0 ? `${summary.henchmenDead} ${summary.henchmenDead === 1 ? 'henchman' : 'henchmen'} lost` : null,
              summary.pending > 0 ? `${summary.pending} still to roll` : null,
            ]
              .filter(Boolean)
              .join(' · ') || 'Nothing rolled yet'}
          </p>
        </Card>
      ) : null}
    </StepBody>
  )
}

/** "No roll needed" with a reason; shown under every warrior's dice. */
function SkipRow({ skip, onSkip }: { skip: string | undefined; onSkip: (reason: string | null) => void }) {
  const on = skip !== undefined
  return (
    <div className="flex flex-col gap-2">
      <label className="flex min-h-9 items-center gap-3 text-sm text-ink">
        <input type="checkbox" className="h-5 w-5 shrink-0 accent-brass" checked={on} onChange={(e) => onSkip(e.target.checked ? '' : null)} />
        <span>
          No injury roll needed <span className="text-ink-dim">(counts as recovered, logged on the report)</span>
        </span>
      </label>
      {on ? <TextField label="Why" value={skip} autoComplete="off" placeholder="e.g. Lucky Charm saved him, house rule" onChange={(e) => onSkip(e.target.value)} error={skip.trim() ? undefined : 'Say why'} /> : null}
    </div>
  )
}

interface HeroInjuryCardProps {
  name: string
  type: string
  resolution: HeroInjuryResolution
  skip: string | undefined
  onSkip: (reason: string | null) => void
  onD66: (d66: number) => void
  onSubRoll: (rollIndex: number, value: number | null) => void
  onCount: (value: number | null) => void
  onReset: () => void
}

function HeroInjuryCard({ name, type, resolution, skip, onSkip, onD66, onSubRoll, onCount, onReset }: HeroInjuryCardProps) {
  const [showText, setShowText] = useState(false)
  const { steps, pending, outcome } = resolution
  const lastApplied = [...steps].reverse().find((s) => !s.rerolled)
  const chartText = lastApplied ? lookupHeroInjury(lastApplied.d66).text : null
  return (
    <Card className="flex flex-col gap-3 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink">{name}</p>
          <p className="text-xs text-ink-dim">{type}</p>
        </div>
        {outcome ? <Tag tone={OUTCOME_TAG[outcome].tone}>{OUTCOME_TAG[outcome].label}</Tag> : <Tag tone="warn">Rolling</Tag>}
      </div>

      {steps.length > 0 ? (
        <ol className="flex flex-col gap-1.5 border-l border-border pl-3 text-sm">
          {steps.map((s, i) => (
            <li key={i} className={s.rerolled ? 'text-ink-dim line-through' : 'text-ink'}>
              <span className="font-mono tabular-nums">{s.d66}</span>
              {s.subRoll !== null ? <span className="font-mono tabular-nums text-ink-dim"> / {s.subRoll}</span> : null} · {s.name}
              {s.rerolled ? <span className="text-xs"> (re-rolled)</span> : null}
              {s.effect ? <p className="text-xs text-ink-dim">{s.effect}</p> : null}
            </li>
          ))}
        </ol>
      ) : null}

      {pending.kind === 'd66' && skip === undefined ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-dim">{pending.prompt}.</p>
          <D66Entry onCommit={onD66} />
        </div>
      ) : null}
      {steps.length === 0 ? <SkipRow skip={skip} onSkip={onSkip} /> : null}
      {pending.kind === 'subRoll' ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-dim">{pending.prompt}.</p>
          <DieField label={pending.die} sides={pending.die === 'D3' ? 3 : 6} value={null} onChange={(v) => onSubRoll(pending.rollIndex, v)} rollable />
        </div>
      ) : null}
      {pending.kind === 'count' ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-dim">{pending.prompt}.</p>
          <DieField label="D6" sides={6} value={null} onChange={onCount} rollable />
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        {chartText ? (
          <button type="button" onClick={() => setShowText((v) => !v)} className="min-h-11 text-xs text-ink-dim underline-offset-4 hover:text-ink hover:underline">
            {showText ? 'Hide chart text' : 'Chart text'}
          </button>
        ) : (
          <span />
        )}
        {steps.length > 0 ? (
          <button type="button" onClick={onReset} className="min-h-11 text-xs text-ink-dim underline-offset-4 hover:text-accent-strong hover:underline">
            Start this hero again
          </button>
        ) : null}
      </div>
      {showText && chartText ? <Markdown source={chartText} className="text-sm" /> : null}
    </Card>
  )
}
