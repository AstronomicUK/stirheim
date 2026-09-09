import { findLore, startingMagicFor, startingMagicOptions } from '../../../rules/data/campaign/magic'
import type { WarbandTemplate } from '../../../rules/types'
import type { FirstSpellRule } from '../../../rules/types/roster'
import { SelectField } from '../../../ui'
import { FirstSpellCard } from './FirstSpellCard'

export function StartingMagicCard({ unitId, template, choiceId, spells, rule, onChoice, onSpells, apprenticeSpells }: {
  unitId: string; template: WarbandTemplate; choiceId?: string; spells: string[]; rule: FirstSpellRule;
  onChoice: (id: string) => void; onSpells: (ids: string[]) => void; apprenticeSpells?: string[];
}) {
  const options = startingMagicOptions(unitId, template)
  const selected = startingMagicFor(unitId, template, choiceId)
  const lore = selected?.loreId ? findLore(selected.loreId) : undefined
  if (!options.length) return null
  return <div className="flex flex-col gap-3">
    {options.length > 1 ? <SelectField label={unitId === 'marauders_seer' ? 'Mark of Chaos' : 'Starting lore'} value={choiceId ?? ''} onChange={e => onChoice(e.target.value)}><option value="">Choose…</option>{options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</SelectField> : null}
    {selected?.id === 'arkhar' ? <p className="text-sm text-ink-dim">A Bloodfather cannot cast spells. He may also learn Strength skills.</p> : null}
    {lore && selected ? Array.from({ length: selected.count }, (_, i) => {
      const available = lore.spells.filter(s => !spells.some((id, j) => j !== i && id === s.id) && (!apprenticeSpells || apprenticeSpells.includes(s.id)))
      return <FirstSpellCard key={`${selected.id}:${i}`} title={selected.count > 1 ? `Starting spell ${i + 1} of ${selected.count}` : 'First spell'} lore={{ ...lore, spells: available }} rule={apprenticeSpells || (i === 0 && selected.firstChosen) ? 'chooseFreely' : i === 0 ? rule : 'random'} selected={spells[i] ?? null} onSelect={id => { const next = [...spells]; next[i] = id ?? ''; onSpells(next) }} />
    }) : null}
    {apprenticeSpells?.length === 0 ? <p className="text-sm text-warn">Choose the Liche’s spells first; the apprentice starts with one of those spells.</p> : null}
  </div>
}
