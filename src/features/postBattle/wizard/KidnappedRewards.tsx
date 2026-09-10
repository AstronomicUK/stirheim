import { DieField, NumberField, SelectField, TextField } from '../../../ui'
import { Card, Section } from '../../roster/view/bits'
import { ShadowlordRewardFields } from '../../advances/ShadowlordRewardFields'
import { emptyRewardChoices, planReward } from '../../../rules/resolve/rewards'
import { kidnappedRewards, type KidnappedDraft } from '../model/kidnappedRewards'
import type { StepProps } from './bits'

export function KidnappedRewards({ draft, derived, ctx, update }: Pick<StepProps, 'draft' | 'derived' | 'ctx' | 'update'>) {
  const state = draft.scenarioRewards?.kidnapped ?? {}
  const roster = { ...ctx.roster, heroes: ctx.roster.heroes.map(h => derived.injuries.heroes.find(r => r.hero.id === h.id)?.resolution.hero ?? h) }
  const reward = kidnappedRewards(state, roster, ctx.items)
  function change(edit: (s: KidnappedDraft) => KidnappedDraft) { update(d => ({ ...d, scenarioRewards: { ...d.scenarioRewards, kidnapped: edit(d.scenarioRewards?.kidnapped ?? {}) } })) }
  return <Section title="The victim’s fate">
    <SelectField label="Your warband’s Kidnapped outcome" value={state.outcome ?? ''} onChange={e => change(() => ({ outcome: e.target.value as KidnappedDraft['outcome'] }))}>
      <option value="">Choose…</option><option value="none">No victim reward</option><option value="held">Held the living victim at the end — 1 XP</option><option value="rescued">Rescued the victim off the table — D6 XP and 50 gc</option><option value="sacrificed">Sacrificed the victim — D6 XP and optional rewards</option>
    </SelectField>
    {state.outcome && state.outcome !== 'none' ? <>
      {state.outcome !== 'held' ? <DieField label="Victim reward XP: D6" sides={6} rollable value={state.xpDie ?? null} onChange={xpDie => change(s => ({ ...s, xpDie, xp: {} }))} /> : null}
      {reward.total !== null ? <Card className="flex flex-col gap-3 px-4 py-3"><p className="text-sm">Allocate {reward.total} XP between your living Heroes. These awards count towards advances this battle.</p>{reward.eligible.map(h => <NumberField key={h.id} label={`${h.name}: victim reward XP`} value={state.xp?.[h.id] ?? 0} onChange={v => change(s => ({ ...s, xp: { ...s.xp, [h.id]: v ?? 0 } }))} />)}</Card> : null}
    </> : null}
    {state.outcome === 'sacrificed' ? <>
      {roster.warbandTemplateId !== 'cult_of_the_possessed' ? <TextField label="Agreed exception allowing this warband to conduct the ritual" value={state.sacrificeReason ?? ''} onChange={e => change(s => ({ ...s, sacrificeReason: e.target.value }))} /> : null}
      <p className="text-sm text-ink-dim">Up to two different Heroes may seek a Shadowlord reward. This is optional and does not spend an advance. Select each Hero before entering their dice.</p>
      {roster.heroes.filter(h => h.status === 'active').map(h => {
        const choices = state.shadowlord?.[h.id]
        return <Card key={h.id} className="flex flex-col gap-3 px-4 py-3">
          <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={!!choices} disabled={!choices && Object.keys(state.shadowlord ?? {}).length >= 2} onChange={e => change(s => { const shadowlord = { ...s.shadowlord }; if (e.target.checked) shadowlord[h.id] = emptyRewardChoices(); else delete shadowlord[h.id]; return { ...s, shadowlord } })} />{h.name}: seek a reward</label>
          {choices ? <ShadowlordRewardFields choices={choices} hero={h} plan={planReward(roster, h, choices, false)} change={patch => change(s => ({ ...s, shadowlord: { ...s.shadowlord, [h.id]: { ...emptyRewardChoices(), ...s.shadowlord?.[h.id], ...patch } } }))} /> : null}
        </Card>
      })}
    </> : null}
    {reward.problems.map(p => <p key={p} className="text-sm text-danger">{p}</p>)}
  </Section>
}
