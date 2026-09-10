import { MAGICAL_ARTEFACTS } from '../../../rules/data/campaign/exploration'
import { Button, Markdown, TextField, DieField, NumberField, SelectField } from '../../../ui'
import { scenarioRewardRule } from '../../../rules/data/campaign/scenarioRewardRules'
import { Card, Section } from '../../roster/view/bits'
import { scenarioHoardFinds, scenarioRewards, type ScenarioRewardDraft } from '../model/scenarioRewards'
import type { StepProps } from './bits'

export function ScenarioRewards({ draft, derived, update, ctx }: Pick<StepProps, 'draft' | 'derived' | 'update' | 'ctx'>) {
  const rule = scenarioRewardRule(ctx.scenarioId)
  if (!rule) return null
  const state = draft.scenarioRewards ?? {}
  const reward = scenarioRewards(draft, ctx.scenarioId, derived.participants, ctx)
  function change(fn: (s: ScenarioRewardDraft) => ScenarioRewardDraft) {
    update(d => ({ ...d, scenarioRewards: fn(d.scenarioRewards ?? {}) }))
  }
  const heroes = derived.participants.heroes.filter(h => !draft.heroesOut.includes(h.id))
  return <Section title="Scenario rewards">
    <p className="text-sm text-ink-dim">{rule.note}</p>
    {rule.kind === 'bounty' ? <>
      {rule.winnerOnly && draft.result !== 'won' ? <p className="text-sm text-ink-dim">No winning-warband bounty.</p> : <>
        {rule.condition ? <SelectField label={rule.condition.question} value={state.conditions?.[rule.condition.id] === undefined ? '' : String(state.conditions[rule.condition.id])} onChange={e => change(s => ({ ...s, conditions: { ...s.conditions, [rule.condition!.id]: e.target.value === '' ? undefined : e.target.value === 'true' }, bountyCount: null, bountyDice: [] }))}><option value="">Choose…</option><option value="true">Yes</option><option value="false">No</option></SelectField> : null}
        {!rule.condition || state.conditions?.[rule.condition.id] ? <Card className="flex flex-col gap-3 px-4 py-3"><NumberField label={rule.label} allowEmpty value={state.bountyCount ?? null} onChange={bountyCount => change(s => ({ ...s, bountyCount }))} hint={`${rule.goldEach} gc each`} />{rule.baseDice ? <div className="flex flex-wrap gap-3">{Array.from({ length: rule.baseDice.count }, (_, i) => <DieField key={i} label={`Base payment D6 ${i + 1}`} sides={6} rollable value={state.bountyDice?.[i] ?? null} onChange={v => change(s => ({ ...s, bountyDice: Array.from({ length: rule.baseDice!.count }, (_, j) => i === j ? v : s.bountyDice?.[j] ?? null) }))} />)}</div> : null}</Card> : null}
      </>}
    </> : null}
    {rule.kind === 'repeated' ? <>
      {(state.repeated ?? []).map((entry, i) => {
        const row = rule.table.length === 1 ? rule.table[0] : rule.table.find(r => entry.roll != null && entry.roll >= r.min && entry.roll <= r.max)
        return <Card key={i} className="flex flex-col gap-3 px-4 py-3"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{rule.label} {i + 1}</h3><Button variant="ghost" onClick={() => change(s => ({ ...s, repeated: s.repeated?.filter((_, j) => i !== j) }))}>Remove {rule.label.toLowerCase()} {i + 1}</Button></div>
          {rule.table.length > 1 ? <DieField label={`${rule.label} ${i + 1}: loot D6`} sides={6} value={entry.roll} onChange={roll => change(s => ({ ...s, repeated: s.repeated?.map((e, j) => i === j ? { roll, dice: [] } : e) }))} /> : null}
          {row ? <p className="text-sm">{row.label}{row.shards ? `: ${row.shards} wyrdstone` : row.goldDice ? `: ${row.goldDice}D6 gc` : ': no reward'}.</p> : null}
          {row?.goldDice ? <div className="flex flex-wrap gap-3">{Array.from({ length: row.goldDice }, (_, d) => <DieField key={d} label={`${rule.label} ${i + 1}: gold D6 ${d + 1}`} sides={6} rollable value={entry.dice[d] ?? null} onChange={v => change(s => ({ ...s, repeated: s.repeated?.map((e, j) => i === j ? { ...e, dice: Array.from({ length: row.goldDice! }, (_, k) => d === k ? v : e.dice[k] ?? null) } : e) }))} />)}</div> : null}
        </Card>
      })}
      <Button variant="secondary" disabled={rule.max !== undefined && (state.repeated?.length ?? 0) >= rule.max} onClick={() => change(s => ({ ...s, repeated: [...(s.repeated ?? []), { roll: null, dice: [] }] }))}>Add {rule.label.toLowerCase()}</Button>
    </> : null}
    {rule.kind === 'counters' ? <NumberField label={rule.label ?? 'Counters held at the end'} value={state.counters ?? 0} onChange={counters => change(s => ({ ...s, counters }))} hint={rule.note} /> : null}
    {rule.kind === 'building' ? <Card className="px-4 py-3">{heroes.map(h => <label key={h.id} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={state.buildingHeroes?.includes(h.id) ?? false} onChange={e => change(s => ({ ...s, buildingHeroes: e.target.checked ? [...(s.buildingHeroes ?? []), h.id] : (s.buildingHeroes ?? []).filter(id => id !== h.id) }))} />{h.name} inside the objective building</label>)}{heroes.length === 0 ? <p className="text-sm text-ink-dim">No eligible Heroes.</p> : null}</Card> : null}
    {rule.kind === 'encounter' ? <Card className="flex flex-col gap-3 px-4 py-3"><div className="flex flex-wrap gap-3"><DieField label="Your starting shards (D3)" sides={3} rollable value={state.ownStarting ?? null} onChange={ownStarting => change(s => ({ ...s, ownStarting }))} /><DieField label="Opponent’s starting shards (D3)" sides={3} value={state.enemyStarting ?? null} onChange={enemyStarting => change(s => ({ ...s, enemyStarting }))} /></div><NumberField label="Enemy Heroes taken out of action" allowEmpty value={state.enemyHeroesOut ?? null} onChange={enemyHeroesOut => change(s => ({ ...s, enemyHeroesOut }))} hint="Count Heroes only, not every enemy casualty. Your own Hero casualties are taken from this report." /></Card> : null}
    {rule.kind === 'hoard' && rule.winnerOnly !== false && draft.result !== 'won' ? <p className="text-sm text-ink-dim">Only the winning warband receives this treasure.</p> : null}
    {rule.kind === 'hoard' && (rule.winnerOnly === false || draft.result === 'won') ? <>
      {rule.condition ? <SelectField label={rule.condition.question} value={state.conditions?.[rule.condition.id] === undefined ? '' : String(state.conditions[rule.condition.id])} onChange={e => change(s => ({ ...s, conditions: { ...s.conditions, [rule.condition!.id]: e.target.value === '' ? undefined : e.target.value === 'true' }, finds: {} }))}><option value="">Choose…</option><option value="true">Yes — resolve the hoard</option><option value="false">No — no hoard reward</option></SelectField> : null}
      {rule.needsRescue ? <SelectField label="Did the merchant’s son survive?" value={state.princeSurvived === undefined ? '' : String(state.princeSurvived)} onChange={e => change(s => ({ ...s, princeSurvived: e.target.value === '' ? undefined : e.target.value === 'true', finds: {} }))}><option value="">Choose…</option><option value="true">Yes — resolve the reward</option><option value="false">No — no reward</option></SelectField> : null}
      {(!rule.needsRescue || state.princeSurvived) && (!rule.condition || state.conditions?.[rule.condition.id]) ? scenarioHoardFinds(rule, draft, derived.participants).map(find => {
        const entry = state.finds?.[find.id]
        const discoveryCount = find.discoveryDice ?? 1
        const discoveries = discoveryCount === 1 ? [entry?.discovery ?? null] : entry?.discoveryDice ?? []
        const discoveryComplete = discoveries.length === discoveryCount && discoveries.every(d => d !== null)
        const available = !find.unclaimedBeforeBattle || state.unclaimedBooty?.[find.id] === true
        const found = available && (!find.threshold || (discoveryComplete && discoveries.reduce<number>((sum, d) => sum + (d ?? 0), 0) >= find.threshold))
        const quantity = find.quantity
        return <Card key={find.id} className="flex flex-col gap-3 px-4 py-3"><div><h3 className="font-semibold">{find.label}</h3><p className="text-xs text-ink-dim">{find.unclaimedBeforeBattle ? 'Awarded only if not already found before the battle' : find.threshold ? `Found on a separate ${discoveryCount === 1 ? 'D6' : `${discoveryCount}D6`} roll of ${find.threshold}+` : 'Automatically found'}</p></div>
          {find.unclaimedBeforeBattle ? <SelectField label={`${find.label}: was this already found before the battle?`} value={state.unclaimedBooty?.[find.id] === undefined ? '' : String(state.unclaimedBooty[find.id])} onChange={e => change(s => ({ ...s, unclaimedBooty: { ...s.unclaimedBooty, [find.id]: e.target.value === '' ? undefined : e.target.value === 'true' }, finds: { ...s.finds, [find.id]: { discovery: null, dice: [] } } }))}><option value="">Choose…</option><option value="false">Yes — do not award it again</option><option value="true">No — claim it now</option></SelectField> : null}
          {find.threshold && discoveryCount === 1 ? <DieField label={`${find.label}: discovery D6`} sides={6} rollable value={entry?.discovery ?? null} onChange={discovery => change(s => ({ ...s, finds: { ...s.finds, [find.id]: { discovery, dice: [] } } }))} /> : null}
          {find.threshold && discoveryCount > 1 ? <div className="flex flex-wrap gap-3">{Array.from({ length: discoveryCount }, (_, i) => <DieField key={i} label={`${find.label}: discovery D6 ${i + 1}`} sides={6} rollable value={discoveries[i] ?? null} onChange={value => change(s => { const current = s.finds?.[find.id]; return { ...s, finds: { ...s.finds, [find.id]: { discovery: null, discoveryDice: Array.from({ length: discoveryCount }, (_, j) => i === j ? value : current?.discoveryDice?.[j] ?? null), dice: [] } } } })} />)}</div> : null}
          {found && find.kind === 'artefact' ? <div className="flex flex-col gap-3"><p className="text-sm text-ink-dim">Each artefact may be found only once per campaign. Previously found results must be rerolled unless your table agrees an explained exception.</p><ul className="text-xs text-ink-dim">{MAGICAL_ARTEFACTS.map(a => { const previous = ctx.artefacts?.find(f => f.roll === a.band.min && (!ctx.reportId || f.reportId !== ctx.reportId)); return <li key={a.name}>{a.band.min}: {a.name} — {previous ? `found by ${previous.warbandName}` : ctx.artefacts ? 'not yet found' : 'checking campaign…'}</li> })}</ul><DieField label={`${find.label}: artefact D6`} sides={6} rollable value={entry?.artefactRoll ?? null} onChange={artefactRoll => change(s => ({ ...s, finds: { ...s.finds, [find.id]: { ...s.finds![find.id], artefactRoll, artefactOverrideReason: '' } } }))} />{MAGICAL_ARTEFACTS.filter(a => a.band.min === entry?.artefactRoll).map(a => <div key={a.name}><p className="font-semibold">{a.name}</p><Markdown source={a.text} /></div>)}<details><summary className="cursor-pointer text-sm">Agreed duplicate override</summary><TextField label={`${find.label}: duplicate override reason`} value={entry?.artefactOverrideReason ?? ''} onChange={e => change(s => ({ ...s, finds: { ...s.finds, [find.id]: { ...s.finds![find.id], artefactOverrideReason: e.target.value } } }))} /></details></div> : null}
          {found && typeof quantity !== 'number' && (quantity.bonus || quantity.multiplier) ? <p className="text-sm text-ink-dim">{quantity.count}D{quantity.sides}{quantity.multiplier ? ` × ${quantity.multiplier}` : ''}{quantity.bonus ? ` + ${quantity.bonus}` : ''}{find.quantityIsValue ? ' gc value; the item stays in your stash.' : ` ${find.kind === 'gold' ? 'gc' : find.kind === 'shards' ? 'wyrdstone' : 'items'}, calculated from the dice below.`}</p> : null}
          {found && typeof quantity !== 'number' ? <div className="flex flex-wrap gap-3">{Array.from({ length: quantity.count }, (_, i) => <DieField key={i} label={`${find.label}: D${quantity.sides} ${i + 1}`} sides={quantity.sides} rollable value={entry?.dice[i] ?? null} onChange={value => change(s => { const current = s.finds?.[find.id]; return { ...s, finds: { ...s.finds, [find.id]: { discovery: current?.discovery ?? null, discoveryDice: current?.discoveryDice, dice: Array.from({ length: quantity.count }, (_, j) => j === i ? value : current?.dice[j] ?? null) } } } })} />)}</div> : null}
          {find.threshold && discoveryComplete && !found ? <p className="text-sm text-ink-dim">Not found.</p> : null}
          {found && find.kind !== 'artefact' && typeof quantity === 'number' ? <p className="text-sm">{quantity} {find.kind === 'gold' ? 'gc added to the treasury' : find.kind === 'shards' ? 'wyrdstone added to the treasury' : 'added to the stash'} when the report is filed.</p> : null}
        </Card>
      }) : null}
    </> : null}
    {rule.kind !== 'none' ? <p className="text-sm">Resolved rewards: {reward.gold} gc, {reward.shards} wyrdstone{reward.items.length ? `, ${reward.items.reduce((sum, item) => sum + item.quantity, 0)} items for the stash` : ''}. {reward.problems.length ? 'Complete the remaining entries before filing.' : 'The calculation will appear in the battle report.'}</p> : null}
  </Section>
}
