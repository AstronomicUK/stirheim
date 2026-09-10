import { DieField, NumberField, SelectField } from '../../../ui'
import { scenarioRewardRule } from '../../../rules/data/campaign/scenarioRewardRules'
import { Card, Section } from '../../roster/view/bits'
import { scenarioRewards, type ScenarioRewardDraft } from '../model/scenarioRewards'
import type { StepProps } from './bits'

export function ScenarioRewards({ draft, derived, update, ctx }: Pick<StepProps, 'draft' | 'derived' | 'update' | 'ctx'>) {
  const rule = scenarioRewardRule(ctx.scenarioId)
  if (!rule) return null
  const state = draft.scenarioRewards ?? {}
  const reward = scenarioRewards(draft, ctx.scenarioId, derived.participants)
  function change(fn: (s: ScenarioRewardDraft) => ScenarioRewardDraft) {
    update(d => ({ ...d, scenarioRewards: fn(d.scenarioRewards ?? {}) }))
  }
  const heroes = derived.participants.heroes.filter(h => !draft.heroesOut.includes(h.id))
  return <Section title="Scenario rewards">
    <p className="text-sm text-ink-dim">{rule.note}</p>
    {rule.kind === 'counters' ? <NumberField label="Counters held at the end" value={state.counters ?? 0} onChange={counters => change(s => ({ ...s, counters }))} hint="Include counters held by any of your warriors, even if your warband lost." /> : null}
    {rule.kind === 'building' ? <Card className="px-4 py-3">{heroes.map(h => <label key={h.id} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={state.buildingHeroes?.includes(h.id) ?? false} onChange={e => change(s => ({ ...s, buildingHeroes: e.target.checked ? [...(s.buildingHeroes ?? []), h.id] : (s.buildingHeroes ?? []).filter(id => id !== h.id) }))} />{h.name} inside the objective building</label>)}{heroes.length === 0 ? <p className="text-sm text-ink-dim">No eligible Heroes.</p> : null}</Card> : null}
    {rule.kind === 'encounter' ? <Card className="flex flex-col gap-3 px-4 py-3"><div className="flex flex-wrap gap-3"><DieField label="Your starting shards (D3)" sides={3} rollable value={state.ownStarting ?? null} onChange={ownStarting => change(s => ({ ...s, ownStarting }))} /><DieField label="Opponent’s starting shards (D3)" sides={3} value={state.enemyStarting ?? null} onChange={enemyStarting => change(s => ({ ...s, enemyStarting }))} /></div><NumberField label="Enemy Heroes taken out of action" allowEmpty value={state.enemyHeroesOut ?? null} onChange={enemyHeroesOut => change(s => ({ ...s, enemyHeroesOut }))} hint="Count Heroes only, not every enemy casualty. Your own Hero casualties are taken from this report." /></Card> : null}
    {rule.kind === 'hoard' && rule.winnerOnly !== false && draft.result !== 'won' ? <p className="text-sm text-ink-dim">Only the winning warband receives this treasure.</p> : null}
    {rule.kind === 'hoard' && (rule.winnerOnly === false || draft.result === 'won') ? <>
      {rule.condition ? <SelectField label={rule.condition.question} value={state.conditions?.[rule.condition.id] === undefined ? '' : String(state.conditions[rule.condition.id])} onChange={e => change(s => ({ ...s, conditions: { ...s.conditions, [rule.condition!.id]: e.target.value === '' ? undefined : e.target.value === 'true' }, finds: {} }))}><option value="">Choose…</option><option value="true">Yes — resolve the hoard</option><option value="false">No — no hoard reward</option></SelectField> : null}
      {rule.needsRescue ? <SelectField label="Did the merchant’s son survive?" value={state.princeSurvived === undefined ? '' : String(state.princeSurvived)} onChange={e => change(s => ({ ...s, princeSurvived: e.target.value === '' ? undefined : e.target.value === 'true', finds: {} }))}><option value="">Choose…</option><option value="true">Yes — resolve the reward</option><option value="false">No — no reward</option></SelectField> : null}
      {(!rule.needsRescue || state.princeSurvived) && (!rule.condition || state.conditions?.[rule.condition.id]) ? rule.finds.map(find => {
        const entry = state.finds?.[find.id]
        const discoveryCount = find.discoveryDice ?? 1
        const discoveries = discoveryCount === 1 ? [entry?.discovery ?? null] : entry?.discoveryDice ?? []
        const discoveryComplete = discoveries.length === discoveryCount && discoveries.every(d => d !== null)
        const found = !find.threshold || (discoveryComplete && discoveries.reduce<number>((sum, d) => sum + (d ?? 0), 0) >= find.threshold)
        const quantity = find.quantity
        return <Card key={find.id} className="flex flex-col gap-3 px-4 py-3"><div><h3 className="font-semibold">{find.label}</h3><p className="text-xs text-ink-dim">{find.threshold ? `Found on a separate ${discoveryCount === 1 ? 'D6' : `${discoveryCount}D6`} roll of ${find.threshold}+` : 'Automatically found'}</p></div>
          {find.threshold && discoveryCount === 1 ? <DieField label={`${find.label}: discovery D6`} sides={6} rollable value={entry?.discovery ?? null} onChange={discovery => change(s => ({ ...s, finds: { ...s.finds, [find.id]: { discovery, dice: [] } } }))} /> : null}
          {find.threshold && discoveryCount > 1 ? <div className="flex flex-wrap gap-3">{Array.from({ length: discoveryCount }, (_, i) => <DieField key={i} label={`${find.label}: discovery D6 ${i + 1}`} sides={6} rollable value={discoveries[i] ?? null} onChange={value => change(s => { const current = s.finds?.[find.id]; return { ...s, finds: { ...s.finds, [find.id]: { discovery: null, discoveryDice: Array.from({ length: discoveryCount }, (_, j) => i === j ? value : current?.discoveryDice?.[j] ?? null), dice: [] } } } })} />)}</div> : null}
          {found && typeof quantity !== 'number' && (quantity.bonus || quantity.multiplier) ? <p className="text-sm text-ink-dim">{quantity.count}D{quantity.sides}{quantity.multiplier ? ` × ${quantity.multiplier}` : ''}{quantity.bonus ? ` + ${quantity.bonus}` : ''}{find.quantityIsValue ? ' gc value; the item stays in your stash.' : ' gc, calculated from the dice below.'}</p> : null}
          {found && typeof quantity !== 'number' ? <div className="flex flex-wrap gap-3">{Array.from({ length: quantity.count }, (_, i) => <DieField key={i} label={`${find.label}: D${quantity.sides} ${i + 1}`} sides={quantity.sides} rollable value={entry?.dice[i] ?? null} onChange={value => change(s => { const current = s.finds?.[find.id]; return { ...s, finds: { ...s.finds, [find.id]: { discovery: current?.discovery ?? null, discoveryDice: current?.discoveryDice, dice: Array.from({ length: quantity.count }, (_, j) => j === i ? value : current?.dice[j] ?? null) } } } })} />)}</div> : null}
          {find.threshold && discoveryComplete && !found ? <p className="text-sm text-ink-dim">Not found.</p> : null}
          {found && typeof quantity === 'number' ? <p className="text-sm">{quantity} added to the stash when the report is filed.</p> : null}
        </Card>
      }) : null}
    </> : null}
    {rule.kind !== 'none' ? <p className="text-sm">Resolved rewards: {reward.gold} gc, {reward.shards} wyrdstone{reward.items.length ? `, ${reward.items.reduce((sum, item) => sum + item.quantity, 0)} items for the stash` : ''}. {reward.problems.length ? 'Complete the remaining entries before filing.' : 'The calculation will appear in the battle report.'}</p> : null}
  </Section>
}
