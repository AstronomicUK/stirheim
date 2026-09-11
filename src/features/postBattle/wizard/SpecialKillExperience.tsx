import {hiredSwordGainsExperience} from '../../../rules/resolve/hiredSwordRules'
import {unitGainsExperience} from '../../../rules/data/campaignRules'
import { Button, DieField, NumberField } from '../../../ui'
import { rollDie } from '../../../rules/resolve/dice'
import { Card } from '../../roster/view/bits'
import { emptySpecialKills, recordKillDie, specialKillAwards, specialKillProblems, type SpecialKillXp } from '../model/specialKillXp'
import type { StepProps } from './bits'

export function SpecialKillExperience({ draft, derived, ctx, update }: Pick<StepProps, 'draft' | 'derived' | 'ctx' | 'update'>) {
  const warriors = [...derived.participants.heroes, ...derived.participants.groups, ...derived.participants.hiredSwords].filter(w => {
    if ('unitTemplateId' in w ? !unitGainsExperience(w.unitTemplateId) : !hiredSwordGainsExperience(w.hiredSwordId)) return false
    const injury = derived.injuries.heroes.find(h => h.hero.id === w.id)?.resolution ?? derived.injuries.hiredSwords.find(h => h.sword.id === w.id)?.resolution
    const group = derived.injuries.groups.find(g => g.group.id === w.id)?.resolution.group
    return injury?.outcome !== 'dead' && injury?.outcome !== 'retired' && (!group || group.size > 0)
  })
  const hasSpecial = Object.values({ ...ctx.specialKillXp, ...draft.specialKillXp }).some(s => s.runts || s.snotlings)
  return <details open={hasSpecial || undefined} className="rounded-lg border border-border p-4">
    <summary className="cursor-pointer font-semibold">Runts and Night Goblin Snotlings: special experience</summary>
    <p className="my-3 text-sm text-ink-dim">Recorded attacks fill these counts where possible. Add casualties resolved at the table here. These counts are part of a hero’s total kills, not additional kills. Each Runt requires a 5+ test; Night Goblin Snotlings give heroes half XP each, rounded down after the battle.</p>
    {warriors.map(w => {
      const state = draft.specialKillXp?.[w.id] ?? ctx.specialKillXp?.[w.id] ?? emptySpecialKills()
      const hero = derived.participants.heroes.some(h => h.id === w.id)
      const change = (next: SpecialKillXp) => update(d => ({ ...d, specialKillXp: { ...d.specialKillXp, [w.id]: next } }))
      const count = (value: number | null) => Math.min(1000, Math.max(0, Math.trunc(value ?? 0)))
      const roll = (i: number, value: number | null, source: 'app' | 'manual') => {
        const rolls = [...state.rolls]; rolls[i] = recordKillDie(rolls[i], value, source); change({ ...state, rolls })
      }
      return <Card key={w.id} className="my-3 space-y-3 p-3">
        <p className="font-semibold">{w.name}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField label="Runts taken out" value={state.runts} onChange={n => change({ ...state, runts: count(n) })} />
          {hero && <NumberField label="Night Goblin Snotlings taken out" value={state.snotlings} onChange={n => change({ ...state, snotlings: count(n) })} />}
        </div>
        {Array.from({ length: Math.min(1000, state.runts) }, (_, i) => <div key={i} className="flex flex-wrap items-end gap-3">
          <DieField sides={6} label={`Runt ${i + 1}: XP on 5+`} value={state.rolls[i]?.value ?? null} onChange={n => roll(i, n, 'manual')} />
          <Button variant="secondary" onClick={() => roll(i, rollDie(6), 'app')}>Roll experience test</Button>
        </div>)}
        {specialKillAwards(state, hero).map((a, i) => <p key={i} className="text-sm">{a.reason}: +{a.amount} XP.</p>)}
        {specialKillProblems(state, hero ? draft.enemiesOut[w.id] ?? 0 : undefined).map(p => <p key={p} className="text-sm text-ink-dim">{p}</p>)}
      </Card>
    })}
  </details>
}
