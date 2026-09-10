import type { ReactNode } from 'react'
import { Button, DieField, Notice, TextField } from '../../ui'
import { Card, Section } from '../roster/view/bits'
import { STAT_ORDER } from '../roster/shared/stats'
import { skillName } from '../roster/view/lookups'
import { findItem } from '../../rules/data/items'
import { POSSESSED_MUTATION_IDS } from '../../rules/data/campaign/rewards'
import { rollDie } from '../../rules/resolve/dice'
import type { RewardChoices, RewardPlan } from '../../rules/resolve/rewards'
import type { RosterHero } from '../../rules/types/roster'

export function ShadowlordRewardFields({ choices, plan, hero, change, introduction }: {
  choices: RewardChoices; plan: RewardPlan | null; hero: RosterHero | null;
  change: (patch: Partial<RewardChoices>) => void; introduction?: ReactNode
}) {
  const row = plan?.row ?? null
  return (
    <div className="flex flex-col gap-3">
      {introduction ? <p className="text-sm leading-relaxed text-ink-dim">{introduction}</p> : null}
      <div className="flex flex-wrap items-end gap-3">
        <DieField label="First D6" sides={6} value={choices.dice[0]} onChange={(v) => change({ dice: [v, choices.dice[1]] })} />
        <DieField label="Second D6" sides={6} value={choices.dice[1]} onChange={(v) => change({ dice: [choices.dice[0], v] })} />
        <Button variant="secondary" onClick={() => change({ dice: [rollDie(6), rollDie(6)] })}>
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
        <Section title="Mutation: roll a D6">
          <DieField label="D6" sides={6} value={choices.mutationD6} onChange={(v) => change({ mutationD6: v, lostStat: null, mutationId: null })} rollable />
        </Section>
      ) : null}
      {plan?.need === 'lostStat' && hero ? (
        <Section title="Atrophy: a characteristic loses a point">
          <div className="flex flex-wrap gap-2">
            {STAT_ORDER.map((k) => (
              <Button key={k} variant="secondary" disabled={hero.stats[k] <= 1} onClick={() => change({ lostStat: k })}>
                {k} {hero.stats[k]} → {Math.max(1, hero.stats[k] - 1)}
              </Button>
            ))}
          </div>
        </Section>
      ) : null}
      {plan?.need === 'mutation' ? (
        <Section title="Choose the mutation">
          <ul className="flex flex-col gap-1.5">
            {POSSESSED_MUTATION_IDS.map((id) => {
              const item = findItem(id)
              return (
                <li key={id}>
                  <button type="button" onClick={() => change({ mutationId: id })} className="flex w-full flex-col gap-1 rounded-md border border-border bg-surface-low px-3 py-2.5 text-left hover:border-ink-dim">
                    <span className="text-sm text-ink">{item?.name.replace(/^Mutation: /, '') ?? id}</span>
                    <span className="text-xs leading-relaxed text-ink-dim">{item?.description}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Section>
      ) : null}
      {plan?.need === 'weaponForm' ? (
        <Section title="The Daemon Weapon's form">
          <TextField label="Form" value={choices.weaponForm} autoComplete="off" placeholder="sword, axe, spear…" onChange={(e) => change({ weaponForm: e.target.value })} />
        </Section>
      ) : null}
      {plan?.need === 'skillsD6' ? (
        <Section title="Possessed: roll a D6 for the D3 skills lost">
          <DieField label="D6" sides={6} value={choices.skillsD6} onChange={(v) => change({ skillsD6: v, lostSkillIds: [] })} rollable />
        </Section>
      ) : null}
      {plan?.need === 'lostSkills' && hero ? (
        <Section title={`Choose ${plan.skillsToLose} ${plan.skillsToLose === 1 ? 'skill' : 'skills'} to lose`}>
          <div className="flex flex-wrap gap-2">
            {hero.skillIds.map((id) => {
              const on = choices.lostSkillIds.includes(id)
              return (
                <Button
                  key={id}
                  variant={on ? 'primary' : 'secondary'}
                  onClick={() => change({ lostSkillIds: on ? choices.lostSkillIds.filter((x) => x !== id) : [...choices.lostSkillIds, id] })}
                >
                  {skillName(id)}
                </Button>
              )
            })}
          </div>
        </Section>
      ) : null}
      {plan?.result ? (
        <Notice tone={row?.kind === 'wrath' ? 'warn' : 'info'}>
          {plan.result.events.map((e) => e.message).join(' ')}
        </Notice>
      ) : null}
    </div>
  )
}
