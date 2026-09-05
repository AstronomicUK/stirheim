// The step content of one advance (roll, choose, review) and its pickers, shared by the bottom
// sheet on the Bestow Advancements screen and by the Advances step of the post-battle wizard.

import { useState, type ReactNode } from 'react'
import { rollDie } from '../../rules/resolve/dice'
import type { StatKey } from '../../rules/types/common'
import type { Spell, SpellLore } from '../../rules/types/magic'
import type { RosterHero } from '../../rules/types/roster'
import type { AvailableSkillTable } from '../../rules/resolve/advances'
import { Button, DieField, Notice, SegmentedControl, TextField } from '../../ui'
import { Card, Tag } from '../roster/view/bits'
import {
  ADVANCE_STEPS,
  reroll,
  setDice,
  setDie,
  setMode,
  setNewHeroName,
  setSkill,
  setSkillInstead,
  setSpell,
  setStat,
  setStep,
  setSubRoll,
  spellForRoll,
  toggleSkillTable,
  type AdvanceDraft,
  type AdvanceStep,
  type AdvanceSubject,
  type GroupPlan,
  type HeroPlan,
  type StatOption,
} from './model'

const STEP_LABELS: Record<AdvanceStep, string> = { roll: 'Roll', choose: 'Choose', review: 'Review' }

export interface AdvanceBodyProps {
  draft: AdvanceDraft
  plan: HeroPlan | GroupPlan
  subject: AdvanceSubject
  step: AdvanceStep
  update: (edit: (d: AdvanceDraft) => AdvanceDraft) => void
  /** Hide the roll / choose / review rail (the wizard shows its own framing). */
  hideRail?: boolean
}

/** The content of the current step. The caller decides the step (effectiveStep) and the footer buttons. */
export function AdvanceBody({ draft, plan, subject, step, update, hideRail = false }: AdvanceBodyProps) {
  return (
    <>
      {hideRail ? null : <StepRail current={step} />}
      {step === 'roll' ? <RollStep draft={draft} plan={plan} update={update} /> : null}
      {step === 'choose' ? (
        <>
          <RollSummary plan={plan} onChange={() => update((d) => setStep(d, 'roll'))} />
          {subject.kind === 'group' ? (
            <GroupChoice draft={draft} plan={plan as GroupPlan} update={update} />
          ) : (
            <HeroChoice draft={draft} plan={plan as HeroPlan} hero={subject.kind === 'hero' ? subject.hero : null} update={update} />
          )}
        </>
      ) : null}
      {step === 'review' && plan.result ? <ReviewStep plan={plan} subjectKind={subject.kind} /> : null}
      {plan.error && step !== 'roll' ? <Notice tone="error">{plan.error}</Notice> : null}
    </>
  )
}

// ---------------------------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------------------------

export function StepRail({ current }: { current: AdvanceStep }) {
  const index = ADVANCE_STEPS.indexOf(current)
  return (
    <ol className="flex items-center gap-2 text-xs" aria-label="Progress">
      {ADVANCE_STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${i <= index ? 'border-brass text-brass' : 'border-border text-ink-dim'}`}>{i + 1}</span>
          <span className={i === index ? 'text-ink' : 'text-ink-dim'} aria-current={i === index ? 'step' : undefined}>
            {STEP_LABELS[s]}
          </span>
          {i < ADVANCE_STEPS.length - 1 ? <span className="h-px w-4 bg-border" aria-hidden /> : null}
        </li>
      ))}
    </ol>
  )
}

interface StepProps<P> {
  draft: AdvanceDraft
  plan: P
  update: (edit: (d: AdvanceDraft) => AdvanceDraft) => void
}

function RollStep({ draft, plan, update }: StepProps<HeroPlan | GroupPlan>) {
  return (
    <>
      <p className="text-sm leading-relaxed text-ink-dim">Roll 2D6 on the advance table, or let the app roll.</p>
      <div className="flex flex-wrap items-end gap-3">
        <DieField label="First D6" sides={6} value={draft.dice[0]} onChange={(v) => update((d) => setDie(d, 0, v))} />
        <DieField label="Second D6" sides={6} value={draft.dice[1]} onChange={(v) => update((d) => setDie(d, 1, v))} />
        <Button variant="secondary" onClick={() => update((d) => setDice(d, rollDie(6), rollDie(6)))}>
          Roll for me
        </Button>
      </div>
      {draft.rerolled.length > 0 ? <p className="text-xs text-ink-dim">Re-rolled so far: {draft.rerolled.join(', ')}.</p> : null}
      {plan.total !== null && plan.roll ? (
        <Card className="flex flex-col gap-1 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-ink-dim">Rolled {plan.total}</p>
          <p className="text-sm leading-relaxed text-ink">{plan.roll.text}</p>
        </Card>
      ) : null}
      {plan.need === 'reroll' && 'rerollReason' in plan ? (
        <Notice tone="warn" title="Roll again">
          <p>{plan.rerollReason}</p>
          <Button variant="secondary" className="mt-3" onClick={() => update(reroll)}>
            Re-roll
          </Button>
        </Notice>
      ) : null}
      {plan.error ? <Notice tone="error">{plan.error}</Notice> : null}
      <MaximaNote plan={plan} />
    </>
  )
}

function RollSummary({ plan, onChange }: { plan: HeroPlan | GroupPlan; onChange: () => void }) {
  if (plan.total === null || !plan.roll) return null
  return (
    <Card className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-ink-dim">Rolled {plan.total}</p>
        <p className="text-sm leading-relaxed text-ink">{plan.roll.text}</p>
      </div>
      <button type="button" onClick={onChange} className="shrink-0 text-xs text-brass underline-offset-4 hover:underline">
        Change
      </button>
    </Card>
  )
}

function MaximaNote({ plan }: { plan: HeroPlan | GroupPlan }) {
  return (
    <p className="text-xs text-ink-dim">
      Racial maximums: {plan.maxima.profile}.{plan.maxima.note ? ` ${plan.maxima.note}` : ''}
    </p>
  )
}

function HeroChoice({ draft, plan, hero, update }: StepProps<HeroPlan> & { hero: RosterHero | null }) {
  if (plan.need === 'subRoll' || (plan.roll?.kind === 'statSubRoll' && plan.subStat === null)) {
    return (
      <Block title="Roll again (D6)">
        <p className="text-sm leading-relaxed text-ink-dim">The result asks for a second die to decide which characteristic goes up.</p>
        <DieField label="D6" sides={6} value={draft.subRoll} onChange={(v) => update((d) => setSubRoll(d, v))} rollable />
        <MaximaNote plan={plan} />
      </Block>
    )
  }

  const skillPicker = (
    <SkillOrSpellPicker
      draft={draft}
      tables={plan.skillTables}
      lore={plan.allowSpell ? plan.lore : null}
      spells={plan.spells}
      knownSpellIds={hero?.spellIds ?? []}
      update={update}
    />
  )

  if (plan.roll?.kind === 'statSubRoll' && plan.subStat !== null) {
    const option = plan.statOptions[0]
    return (
      <Block title={`+1 ${option.name}`}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink">
            Rolled {draft.subRoll}: {option.name}
          </p>
          <button type="button" onClick={() => update((d) => setSubRoll(d, null))} className="text-xs text-brass underline-offset-4 hover:underline">
            Change
          </button>
        </div>
        {option.eligible ? (
          <p className="text-sm text-ink-dim">
            {option.stat} {option.current} → {option.current + 1} (maximum {option.max}).
          </p>
        ) : (
          <>
            <Notice tone="warn">{plan.skillReason}</Notice>
            {skillPicker}
          </>
        )}
        <MaximaNote plan={plan} />
      </Block>
    )
  }

  if (plan.roll?.kind === 'statChoice') {
    return (
      <Block title="Choose a characteristic">
        {plan.fallbackToAny ? (
          <Notice tone="warn">Both offered characteristics are at their racial maximum. The rulebook lets you take any other characteristic that is not, or a skill instead.</Notice>
        ) : null}
        {!draft.skillInstead ? <StatGrid options={plan.statOptions} selected={draft.stat} onSelect={(stat) => update((d) => setStat(d, stat))} /> : null}
        {plan.fallbackToAny ? (
          <SegmentedControl
            label="Take a characteristic or a skill"
            value={draft.skillInstead ? 'skill' : 'stat'}
            options={[
              { value: 'stat', label: 'Another characteristic' },
              { value: 'skill', label: 'A skill instead' },
            ]}
            onChange={(v) => update((d) => setSkillInstead(d, v === 'skill'))}
          />
        ) : null}
        {draft.skillInstead ? skillPicker : null}
        <MaximaNote plan={plan} />
      </Block>
    )
  }

  return <Block title={plan.allowSpell ? 'New skill or spell' : 'New skill'}>{skillPicker}</Block>
}

function GroupChoice({ draft, plan, update }: StepProps<GroupPlan>) {
  if (plan.need === 'reroll') {
    return (
      <Notice tone="warn" title="Roll again">
        <p>{plan.rerollReason}</p>
        <Button variant="secondary" className="mt-3" onClick={() => update(reroll)}>
          Re-roll
        </Button>
      </Notice>
    )
  }
  if (plan.roll?.kind === 'statChoice') {
    return (
      <Block title="Choose a characteristic">
        <p className="text-sm leading-relaxed text-ink-dim">Every warrior in the group gains the same increase.</p>
        <StatGrid options={plan.statOptions} selected={draft.stat} onSelect={(stat) => update((d) => setStat(d, stat))} />
        <MaximaNote plan={plan} />
      </Block>
    )
  }
  if (plan.roll?.kind === 'ladsGotTalent') {
    return (
      <Block title="The lad's got talent">
        <p className="text-sm leading-relaxed text-ink-dim">
          One member becomes a hero of the same type, keeping his experience and characteristics, and takes one of each item the group carries.
          {plan.dissolvesGroup ? ' He is the last member, so the group leaves the roster.' : ''}
        </p>
        <TextField label="Name" value={draft.newHeroName} autoComplete="off" onChange={(e) => update((d) => setNewHeroName(d, e.target.value))} />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-ink-dim">Two skill tables · {draft.skillTableIds.length} of 2 chosen</p>
          <div className="flex flex-wrap gap-2">
            {plan.tableOptions.map((t) => {
              const on = draft.skillTableIds.includes(t.id)
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => update((d) => toggleSkillTable(d, t.id))}
                  className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${on ? 'border-brass bg-surface-high text-ink' : 'border-border text-ink-dim hover:text-ink'}`}
                >
                  {t.name}
                </button>
              )
            })}
          </div>
        </div>
        <p className="text-xs leading-relaxed text-ink-dim">
          {plan.heroCapacity !== null ? `The warband may have ${plan.heroCapacity} heroes. ` : ''}
          By the rulebook the new hero rolls once on the hero advance table straight away, and the rest of the group roll again for this advance (re-rolling 10-12). Both
          are queued as new advances when you confirm.
        </p>
      </Block>
    )
  }
  return null
}

function ReviewStep({ plan, subjectKind }: { plan: HeroPlan | GroupPlan; subjectKind: AdvanceSubject['kind'] }) {
  const result = plan.result!
  return (
    <>
      <Card className="flex flex-col gap-2 px-4 py-3">
        <p className="text-[10px] uppercase tracking-wider text-ink-dim">Summary</p>
        <p className="text-base leading-relaxed text-ink">{result.resolution.text}</p>
      </Card>
      <ul className="flex flex-col gap-1.5 text-sm text-ink-dim">
        {result.events
          .filter((e) => e.kind !== 'warning')
          .map((e, i) => (
            <li key={`${e.kind}-${i}`}>{e.message}</li>
          ))}
      </ul>
      {result.events.some((e) => e.kind === 'warning') ? (
        <Notice tone="warn">
          {result.events
            .filter((e) => e.kind === 'warning')
            .map((e) => e.message)
            .join(' ')}
        </Notice>
      ) : null}
      {subjectKind === 'hiredSword' ? <p className="text-xs text-ink-dim">Hired swords keep their fixed equipment; only characteristics, skills and the advance count change.</p> : null}
      <p className="text-xs text-ink-dim">Confirming writes the change to the roster and closes this advance.</p>
    </>
  )
}

// ---------------------------------------------------------------------------------------------
// Pickers
// ---------------------------------------------------------------------------------------------

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs uppercase tracking-[0.25em] text-ink-dim">{title}</h3>
      {children}
    </section>
  )
}

function StatGrid({ options, selected, onSelect }: { options: StatOption[]; selected: StatKey | null; onSelect: (stat: StatKey) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Characteristic">
      {options.map((o) => {
        const on = selected === o.stat
        return (
          <button
            key={o.stat}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={!o.eligible}
            onClick={() => onSelect(o.stat)}
            className={`flex min-h-14 flex-col items-start justify-center rounded-md border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              on ? 'border-brass bg-surface-high' : 'border-border bg-surface-low hover:border-ink-dim'
            }`}
          >
            <span className="text-sm text-ink">{o.name}</span>
            <span className="text-xs tabular-nums text-ink-dim">
              {o.stat} {o.current}
              {o.eligible ? ` → ${o.current + 1}` : ''} · max {o.max}
            </span>
            {!o.eligible && o.reason ? <span className="text-xs text-warn">{o.reason}</span> : null}
          </button>
        )
      })}
    </div>
  )
}

interface SkillOrSpellPickerProps {
  draft: AdvanceDraft
  tables: AvailableSkillTable[]
  /** Null when a spell may not be taken. */
  lore: SpellLore | null
  spells: Spell[]
  knownSpellIds: readonly string[]
  update: (edit: (d: AdvanceDraft) => AdvanceDraft) => void
}

function SkillOrSpellPicker({ draft, tables, lore, spells, knownSpellIds, update }: SkillOrSpellPickerProps) {
  return (
    <div className="flex flex-col gap-3">
      {lore ? (
        <SegmentedControl
          label="Skill or spell"
          value={draft.mode}
          options={[
            { value: 'skill', label: 'A skill' },
            { value: 'spell', label: `A spell (${lore.name})` },
          ]}
          onChange={(v) => update((d) => setMode(d, v))}
        />
      ) : null}
      {lore && draft.mode === 'spell' ? (
        <SpellPicker lore={lore} spells={spells} knownSpellIds={knownSpellIds} selected={draft.spellId} onSelect={(id) => update((d) => setSpell(d, id))} />
      ) : (
        <SkillPicker tables={tables} selected={draft.skillId} onSelect={(id) => update((d) => setSkill(d, id))} />
      )}
    </div>
  )
}

function SkillPicker({ tables, selected, onSelect }: { tables: AvailableSkillTable[]; selected: string | null; onSelect: (id: string) => void }) {
  const [search, setSearch] = useState('')
  const total = tables.reduce((n, t) => n + t.skills.length, 0)
  const q = search.trim().toLowerCase()
  const shown = tables
    .map((t) => ({ ...t, skills: q ? t.skills.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)) : t.skills }))
    .filter((t) => t.skills.length > 0)
  if (total === 0) return <Notice tone="warn">No skills are left to learn on this warrior's tables.</Notice>
  return (
    <div className="flex flex-col gap-3">
      {total > 12 ? <TextField label="Search skills" value={search} autoComplete="off" placeholder="Name or rule text" onChange={(e) => setSearch(e.target.value)} /> : null}
      {shown.length === 0 ? <p className="text-sm text-ink-dim">Nothing matches.</p> : null}
      {shown.map((t) => (
        <div key={t.tableId} className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-wider text-ink-dim">{t.tableName}</p>
          <ul className="flex flex-col gap-1.5">
            {t.skills.map((s) => {
              const on = selected === s.id
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => onSelect(s.id)}
                    className={`flex w-full flex-col gap-1 rounded-md border px-3 py-2.5 text-left transition-colors ${on ? 'border-brass bg-surface-high' : 'border-border bg-surface-low hover:border-ink-dim'}`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm text-ink">{s.name}</span>
                      {on ? <Tag tone="brass">Chosen</Tag> : null}
                    </span>
                    <span className={`text-xs leading-relaxed text-ink-dim ${on ? '' : 'line-clamp-3'}`}>{s.description}</span>
                    {s.restriction ? <span className="text-xs italic text-warn">{s.restriction}</span> : null}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

interface SpellPickerProps {
  lore: SpellLore
  spells: Spell[]
  knownSpellIds: readonly string[]
  selected: string | null
  onSelect: (id: string | null) => void
}

function SpellPicker({ lore, spells, knownSpellIds, selected, onSelect }: SpellPickerProps) {
  const [d6, setD6] = useState<number | null>(null)
  const rolledSpell = d6 !== null ? spellForRoll(lore, d6) : undefined
  const rolledKnown = rolledSpell !== undefined && knownSpellIds.includes(rolledSpell.id)

  function roll(v: number | null) {
    setD6(v)
    if (v === null) return
    const spell = spellForRoll(lore, v)
    if (spell && !knownSpellIds.includes(spell.id)) onSelect(spell.id)
  }

  if (spells.length === 0) return <Notice tone="warn">{lore.name}: every spell is already known. Take a skill instead.</Notice>
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-relaxed text-ink-dim">Spells are generated at random: roll a {lore.die} on the {lore.name} table, or tap the one you rolled.</p>
      <div className="flex flex-wrap items-end gap-3">
        <DieField label={lore.die} sides={6} value={d6} onChange={roll} rollable />
        {rolledKnown ? <p className="text-xs text-warn">Already known: roll again, or lower its difficulty by 1 by hand and pick another here.</p> : null}
      </div>
      <ul className="flex flex-col gap-1.5">
        {spells.map((s) => {
          const on = selected === s.id
          return (
            <li key={s.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onSelect(s.id)}
                className={`flex w-full flex-col gap-1 rounded-md border px-3 py-2.5 text-left transition-colors ${on ? 'border-brass bg-surface-high' : 'border-border bg-surface-low hover:border-ink-dim'}`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm text-ink">
                    <span className="text-ink-dim">{s.roll.min === s.roll.max ? s.roll.min : `${s.roll.min}-${s.roll.max}`}</span> {s.name}
                  </span>
                  <span className="shrink-0 text-xs text-ink-dim">{s.difficulty === null ? 'Auto' : `Difficulty ${s.difficulty}`}</span>
                </span>
                <span className={`whitespace-pre-line text-xs leading-relaxed text-ink-dim ${on ? '' : 'line-clamp-3'}`}>{s.text}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
