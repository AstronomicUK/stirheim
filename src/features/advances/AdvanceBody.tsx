// The step content of one advance (roll, choose, review) and its pickers, shared by the bottom
// sheet on the Advancements screen and by the Advances step of the post-battle wizard.

import { useState, type ReactNode } from 'react'
import { rollDie } from '../../rules/resolve/dice'
import type { StatKey } from '../../rules/types/common'
import type { Spell, SpellLore } from '../../rules/types/magic'
import type { RosterHero } from '../../rules/types/roster'
import { STAT_ORDER } from '../roster/shared/stats'
import { findItem } from '../../rules/data/items'
import { POSSESSED_MUTATION_IDS } from '../../rules/data/campaign/rewards'
import type { RewardPlan } from '../../rules/resolve/rewards'
import { skillName } from '../roster/view/lookups'
import type { PerkSource } from '../../rules/resolve/mapAdvantages'
import type { AvailableSkillTable } from '../../rules/resolve/advances'
import { Button, DieField, Notice, SegmentedControl, SelectField, TextField } from '../../ui'
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
  setReward,
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
  /** Map campaigns: the district that lets a new spell be chosen rather than rolled (Sage's Hall). */
  chooseSpell?: PerkSource | null
}

/** The content of the current step. The caller decides the step (effectiveStep) and the footer buttons. */
export function AdvanceBody({ draft, plan, subject, step, update, hideRail = false, chooseSpell = null }: AdvanceBodyProps) {
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
            <HeroChoice draft={draft} plan={plan as HeroPlan} hero={subject.kind === 'hero' ? subject.hero : null} update={update} chooseSpell={chooseSpell} />
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

function HeroChoice({ draft, plan, hero, update, chooseSpell }: StepProps<HeroPlan> & { hero: RosterHero | null; chooseSpell: PerkSource | null }) {
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
      chooseSpell={chooseSpell}
      reward={plan.allowReward ? { plan: plan.reward, hero } : null}
    />
  )

  if (plan.roll?.kind === 'statSubRoll' && plan.subStat !== null) {
    const rolledOption = plan.statOptions[0]
    const taken = plan.statOptions.find((o) => o.stat === plan.subStat) ?? rolledOption
    if (plan.fallbackToAny) {
      return (
        <Block title="Characteristic at its maximum">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ink">
              Rolled {draft.subRoll}: {rolledOption.name}
            </p>
            <button type="button" onClick={() => update((d) => setSubRoll(d, null))} className="text-xs text-brass underline-offset-4 hover:underline">
              Change
            </button>
          </div>
          <Notice tone="warn">Both characteristics from this roll are at their racial maximum. The rulebook lets you take any other characteristic that is not, or a skill instead.</Notice>
          {!draft.skillInstead ? <StatGrid options={plan.statOptions} selected={draft.stat} onSelect={(stat) => update((d) => setStat(d, stat))} /> : null}
          <SegmentedControl
            label="Take a characteristic or a skill"
            value={draft.skillInstead ? 'skill' : 'stat'}
            options={[
              { value: 'stat', label: 'Another characteristic' },
              { value: 'skill', label: 'A skill instead' },
            ]}
            onChange={(v) => update((d) => setSkillInstead(d, v === 'skill'))}
          />
          {draft.skillInstead ? skillPicker : null}
          <MaximaNote plan={plan} />
        </Block>
      )
    }
    return (
      <Block title={taken.eligible ? `+1 ${taken.name}` : 'Characteristic at its maximum'}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink">
            Rolled {draft.subRoll}: {rolledOption.name}
          </p>
          <button type="button" onClick={() => update((d) => setSubRoll(d, null))} className="text-xs text-brass underline-offset-4 hover:underline">
            Change
          </button>
        </div>
        {taken.eligible ? (
          <>
            {plan.skillReason ? <Notice tone="info">{plan.skillReason}</Notice> : null}
            <p className="text-sm text-ink-dim">
              {taken.stat} {taken.current} → {taken.current + 1} (maximum {taken.max}).
            </p>
          </>
        ) : (
          <>
            <Notice tone="warn">{plan.skillReason}</Notice>
            <Button variant="secondary" className="self-start" onClick={() => update(reroll)}>
              Roll the 2D6 again
            </Button>
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
  chooseSpell?: PerkSource | null
  /** Rewards of the Shadowlord may be rolled instead (house rule, Possessed Magister and Mutants). */
  reward?: { plan: RewardPlan | null; hero: RosterHero | null } | null
}

function SkillOrSpellPicker({ draft, tables, lore, spells, knownSpellIds, update, chooseSpell = null, reward = null }: SkillOrSpellPickerProps) {
  const options: { value: 'skill' | 'spell' | 'reward'; label: string }[] = [{ value: 'skill', label: 'A skill' }]
  if (lore) options.push({ value: 'spell', label: `A spell (${lore.name})` })
  if (reward) options.push({ value: 'reward', label: 'Rewards of the Shadowlord' })
  return (
    <div className="flex flex-col gap-3">
      {options.length > 1 ? <SegmentedControl label="Skill, spell or reward" value={draft.mode} options={options} onChange={(v) => update((d) => setMode(d, v))} /> : null}
      {reward && draft.mode === 'reward' ? (
        <RewardPicker draft={draft} plan={reward.plan} hero={reward.hero} update={update} />
      ) : lore && draft.mode === 'spell' ? (
        <SpellPicker
          lore={lore}
          spells={spells}
          knownSpellIds={knownSpellIds}
          selected={draft.spellId}
          onSelect={(id) => update((d) => setSpell(d, id))}
          chooseFrom={chooseSpell ? { reason: `${chooseSpell.districtName} (map advantage)` } : null}
        />
      ) : (
        <SkillPicker tables={tables} selected={draft.skillId} onSelect={(id) => update((d) => setSkill(d, id))} />
      )}
    </div>
  )
}

/** The pilgrimage to the Pit: 2D6 on the Rewards table, then whatever the result asks for. */
function RewardPicker({ draft, plan, hero, update }: { draft: AdvanceDraft; plan: RewardPlan | null; hero: RosterHero | null; update: (edit: (d: AdvanceDraft) => AdvanceDraft) => void }) {
  const choices = draft.reward
  const row = plan?.row ?? null
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-relaxed text-ink-dim">
        Instead of a skill, the warrior makes the pilgrimage to the Pit and beseeches the Shadowlord. Roll 2D6 on the Rewards table (rulebook optional
        rule). The advance is spent whatever comes of it.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <DieField label="First D6" sides={6} value={choices.dice[0]} onChange={(v) => update((d) => setReward(d, { dice: [v, d.reward.dice[1]] }))} />
        <DieField label="Second D6" sides={6} value={choices.dice[1]} onChange={(v) => update((d) => setReward(d, { dice: [d.reward.dice[0], v] }))} />
        <Button variant="secondary" onClick={() => update((d) => setReward(d, { dice: [rollDie(6), rollDie(6)] }))}>
          Roll for me
        </Button>
      </div>
      {row && plan ? (
        <Card className="flex flex-col gap-1 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-ink-dim">Rolled {plan.total}</p>
          <p className="text-sm font-medium text-ink">{row.title}</p>
          <p className="text-sm leading-relaxed text-ink-dim">{row.text}</p>
        </Card>
      ) : null}
      {plan?.need === 'mutationD6' ? (
        <Block title="Mutation: roll a D6">
          <DieField label="D6" sides={6} value={choices.mutationD6} onChange={(v) => update((d) => setReward(d, { mutationD6: v, lostStat: null, mutationId: null }))} rollable />
        </Block>
      ) : null}
      {plan?.need === 'lostStat' && hero ? (
        <Block title="Atrophy: a characteristic loses a point">
          <div className="flex flex-wrap gap-2">
            {STAT_ORDER.map((k) => (
              <Button key={k} variant="secondary" disabled={hero.stats[k] <= 1} onClick={() => update((d) => setReward(d, { lostStat: k }))}>
                {k} {hero.stats[k]} → {Math.max(1, hero.stats[k] - 1)}
              </Button>
            ))}
          </div>
        </Block>
      ) : null}
      {plan?.need === 'mutation' ? (
        <Block title="Choose the mutation">
          <ul className="flex flex-col gap-1.5">
            {POSSESSED_MUTATION_IDS.map((id) => {
              const item = findItem(id)
              return (
                <li key={id}>
                  <button type="button" onClick={() => update((d) => setReward(d, { mutationId: id }))} className="flex w-full flex-col gap-1 rounded-md border border-border bg-surface-low px-3 py-2.5 text-left hover:border-ink-dim">
                    <span className="text-sm text-ink">{item?.name.replace(/^Mutation: /, '') ?? id}</span>
                    <span className="text-xs leading-relaxed text-ink-dim">{item?.description}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Block>
      ) : null}
      {plan?.need === 'weaponForm' ? (
        <Block title="The Daemon Weapon's form">
          <TextField label="Form" value={choices.weaponForm} autoComplete="off" placeholder="sword, axe, spear…" onChange={(e) => update((d) => setReward(d, { weaponForm: e.target.value }))} />
        </Block>
      ) : null}
      {plan?.need === 'skillsD6' ? (
        <Block title="Possessed: roll a D6 for the D3 skills lost">
          <DieField label="D6" sides={6} value={choices.skillsD6} onChange={(v) => update((d) => setReward(d, { skillsD6: v, lostSkillIds: [] }))} rollable />
        </Block>
      ) : null}
      {plan?.need === 'lostSkills' && hero ? (
        <Block title={`Choose ${plan.skillsToLose} ${plan.skillsToLose === 1 ? 'skill' : 'skills'} to lose`}>
          <div className="flex flex-wrap gap-2">
            {hero.skillIds.map((id) => {
              const on = choices.lostSkillIds.includes(id)
              return (
                <Button
                  key={id}
                  variant={on ? 'primary' : 'secondary'}
                  onClick={() => update((d) => setReward(d, { lostSkillIds: on ? d.reward.lostSkillIds.filter((x) => x !== id) : [...d.reward.lostSkillIds, id] }))}
                >
                  {skillName(id)}
                </Button>
              )
            })}
          </div>
        </Block>
      ) : null}
      {plan?.result ? (
        <Notice tone={row?.kind === 'wrath' ? 'warn' : 'info'}>
          {plan.result.events.map((e) => e.message).join(' ')}
        </Notice>
      ) : null}
    </div>
  )
}

function SkillPicker({ tables, selected, onSelect }: { tables: AvailableSkillTable[]; selected: string | null; onSelect: (id: string) => void }) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const total = tables.reduce((n, t) => n + t.skills.length, 0)
  const q = search.trim().toLowerCase()
  const shown = tables
    .filter((t) => !type || t.tableName === type)
    .map((t) => ({ ...t, skills: q ? t.skills.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)) : t.skills }))
    .filter((t) => t.skills.length > 0)
  if (total === 0) return <Notice tone="warn">No skills are left to learn on this warrior's tables.</Notice>
  return (
    <div className="flex flex-col gap-3">
      {tables.length > 1 ? (
        <SelectField label="Skill type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Skills</option>
          {tables.map((t) => (
            <option key={t.tableId} value={t.tableName}>
              {t.tableName}
            </option>
          ))}
        </SelectField>
      ) : null}
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
                    className={`flex w-full flex-col gap-1 rounded-md border px-3 py-2.5 text-left transition-colors ${on ? 'border-brass bg-surface-high' : 'border-border bg-surface-low hover:border-ink-dim'} ${s.blocked && !on ? 'opacity-70' : ''}`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm text-ink">{s.name}</span>
                      {on ? <Tag tone="brass">Chosen</Tag> : s.blocked ? <Tag tone="warn">Restricted</Tag> : null}
                    </span>
                    <span className={`text-xs leading-relaxed text-ink-dim ${on ? '' : 'line-clamp-3'}`}>{s.description}</span>
                    {s.blocked ? (
                      <span className="text-xs text-accent-strong">{s.blocked} Picking it anyway goes on the record.</span>
                    ) : s.restriction ? (
                      <span className="text-xs italic text-warn">{s.restriction}</span>
                    ) : null}
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

export interface SpellPickerProps {
  lore: SpellLore
  spells: Spell[]
  knownSpellIds: readonly string[]
  selected: string | null
  onSelect: (id: string | null) => void
  /** Lets the spell be chosen from the list rather than rolled, with the reason shown above the list (a map advantage, a house rule...). Null/undefined: roll on the lore table as usual. */
  chooseFrom?: { reason: string } | null
}

export function SpellPicker({ lore, spells, knownSpellIds, selected, onSelect, chooseFrom = null }: SpellPickerProps) {
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
      {chooseFrom ? (
        <p className="text-sm leading-relaxed text-ink-dim">
          {chooseFrom.reason}: choose a spell from the {lore.name} table rather than rolling for it. Tap the one you want.
        </p>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-ink-dim">Spells are generated at random: roll a {lore.die} on the {lore.name} table, or tap the one you rolled.</p>
          <div className="flex flex-wrap items-end gap-3">
            <DieField label={lore.die} sides={6} value={d6} onChange={roll} rollable />
            {rolledKnown ? <p className="text-xs text-warn">Already known: roll again, or lower its difficulty by 1 by hand and pick another here.</p> : null}
          </div>
        </>
      )}
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
