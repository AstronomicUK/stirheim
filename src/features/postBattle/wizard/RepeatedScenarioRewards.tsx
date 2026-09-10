import { Button, DieField, SelectField } from '../../../ui'
import type { ScenarioRewardRule } from '../../../rules/data/campaign/scenarioRewardRules'
import { Card } from '../../roster/view/bits'
import { scenarioRepeatedEntries, scenarioTableRoll, type ScenarioRewardDraft } from '../model/scenarioRewards'

type Rule = Extract<ScenarioRewardRule, { kind: 'repeated' }>
type Entry = NonNullable<ScenarioRewardDraft['repeated']>[number]
export function RepeatedScenarioRewards({ rule, state, change }: {
  rule: Rule
  state: ScenarioRewardDraft
  change: (edit: (s: ScenarioRewardDraft) => ScenarioRewardDraft) => void
}) {
  const entries = scenarioRepeatedEntries(rule, state)
  function patch(index: number, edit: (entry: Entry) => Entry) {
    change(s => ({ ...s, repeated: scenarioRepeatedEntries(rule, s).map((e, i) => i === index ? edit(e) : e) }))
  }
  const fixedCount = Boolean(rule.requiredCount || rule.countSides)
  const conditionMet = !rule.condition || state.conditions?.[rule.condition.id] === true
  return <>
    {rule.condition ? <SelectField label={rule.condition.question} value={state.conditions?.[rule.condition.id] === undefined ? '' : String(state.conditions[rule.condition.id])} onChange={e => change(s => ({ ...s, conditions: { ...s.conditions, [rule.condition!.id]: e.target.value === '' ? undefined : e.target.value === 'true' }, repeated: undefined, tableCountRoll: null }))}>
      <option value="">Choose…</option><option value="true">Yes</option><option value="false">No</option>
    </SelectField> : null}
    {conditionMet ? <>
      {rule.countSides ? <DieField label={`Number of finds: D${rule.countSides}`} sides={rule.countSides} rollable value={state.tableCountRoll ?? null} onChange={tableCountRoll => change(s => ({ ...s, tableCountRoll, repeated: undefined }))} /> : null}
      {rule.attackerBonus ? <SelectField label="Was your warband the attacker?" value={state.conditions?.attacker === undefined ? '' : String(state.conditions.attacker)} onChange={e => change(s => ({ ...s, conditions: { ...s.conditions, attacker: e.target.value === '' ? undefined : e.target.value === 'true' }, repeated: undefined }))}>
        <option value="">Choose…</option><option value="true">Yes</option><option value="false">No</option>
      </SelectField> : null}
      {entries.map((entry, i) => {
        const roll = scenarioTableRoll(rule, entry)
        const adjusted = roll === null ? null : roll + (state.conditions?.attacker ? rule.attackerBonus ?? 0 : 0)
        const row = rule.table.length === 1 ? rule.table[0] : rule.table.find(r => adjusted !== null && adjusted >= r.min && adjusted <= r.max)
        const quantity = typeof row?.itemQuantity === 'object' ? row.itemQuantity : row?.goldDice ? { count: row.goldDice, sides: 6 } : row?.shardDice ? { count: row.shardDice, sides: 3 } : undefined
        const quantityLabel = row?.goldDice ? 'gold' : row?.shardDice ? 'shards' : row?.quantityIsValue ? 'value' : 'quantity'
        return <Card key={i} className="flex flex-col gap-3 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">{rule.label} {i + 1}</h3>
            {!fixedCount ? <Button variant="ghost" onClick={() => change(s => ({ ...s, repeated: s.repeated?.filter((_, j) => i !== j) }))}>Remove {rule.label.toLowerCase()} {i + 1}</Button> : null}
          </div>
          {rule.table.length > 1 && !rule.tableDice ? <DieField label={`${rule.label} ${i + 1}: loot D6`} sides={6} value={entry.roll} onChange={roll => patch(i, () => ({ roll, dice: [] }))} /> : null}
          {rule.tableDice ? <div className="flex flex-wrap gap-3">{Array.from({ length: rule.tableDice }, (_, d) => <DieField key={d} label={`${rule.label} ${i + 1}: table D6 ${d + 1}`} sides={6} rollable value={entry.tableDice?.[d] ?? null} onChange={v => patch(i, e => ({ ...e, dice: [], itemChoice: undefined, tableDice: Array.from({ length: rule.tableDice! }, (_, k) => d === k ? v : e.tableDice?.[k] ?? null) }))} />)}</div> : null}
          {row ? <p className="text-sm">{row.label}{quantity ? `: ${quantity.count}D${quantity.sides}${'multiplier' in quantity && quantity.multiplier ? ` × ${quantity.multiplier}` : ''}${row.goldBonus ? ` + ${row.goldBonus}` : ''} ${row.quantityIsValue ? 'gc value' : quantityLabel}` : row.shards ? `: ${row.shards} wyrdstone` : row.itemName || row.itemOptions ? ': one item for the stash' : ': no reward'}.</p> : null}
          {row?.itemOptions ? <SelectField label={`${rule.label} ${i + 1}: item choice`} value={entry.itemChoice ?? ''} onChange={e => patch(i, current => ({ ...current, itemChoice: e.target.value }))}><option value="">Choose…</option>{row.itemOptions.map(name => <option key={name} value={name}>{name}</option>)}</SelectField> : null}
          {quantity ? <div className="flex flex-wrap gap-3">{Array.from({ length: quantity.count }, (_, d) => <DieField key={d} label={`${rule.label} ${i + 1}: ${quantityLabel} D${quantity.sides} ${d + 1}`} sides={quantity.sides} rollable value={entry.dice[d] ?? null} onChange={v => patch(i, e => ({ ...e, dice: Array.from({ length: quantity.count }, (_, k) => d === k ? v : e.dice[k] ?? null) }))} />)}</div> : null}
        </Card>
      })}
      {!fixedCount ? <Button variant="secondary" disabled={rule.max !== undefined && entries.length >= rule.max} onClick={() => change(s => ({ ...s, repeated: [...(s.repeated ?? []), { roll: null, dice: [] }] }))}>Add {rule.label.toLowerCase()}</Button> : null}
    </> : null}
  </>
}
