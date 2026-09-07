// The first spell a spellcasting hero starts with, at warband creation. RAW is a random roll on
// the lore table; two house rules seen at the table (settings.houseRules.firstSpellRule) let the
// player choose instead, or roll twice and keep either result. Reuses the advancement wizard's own
// spell picker (roll a D6, or tap a spell from the list) rather than a second implementation.

import { useState } from 'react'
import { SpellPicker } from '../../advances/AdvanceBody'
import { spellForRoll } from '../../advances/model'
import type { FirstSpellRule } from '../../../rules/types/roster'
import type { SpellLore } from '../../../rules/types/magic'
import { Card, Section } from '../view/bits'
import { DieField } from '../../../ui'

export interface FirstSpellCardProps {
  lore: SpellLore
  rule: FirstSpellRule
  selected: string | null
  onSelect: (id: string | null) => void
}

export function FirstSpellCard({ lore, rule, selected, onSelect }: FirstSpellCardProps) {
  return (
    <Section title="First spell" aside={lore.name}>
      <Card className="flex flex-col gap-3 px-4 py-3">
        {rule === 'chooseFreely' ? (
          <SpellPicker lore={lore} spells={lore.spells} knownSpellIds={[]} selected={selected} onSelect={onSelect} chooseFrom={{ reason: 'House rule' }} />
        ) : rule === 'rollTwicePickOne' ? (
          <RollTwicePickOne lore={lore} selected={selected} onSelect={onSelect} />
        ) : (
          <SpellPicker lore={lore} spells={lore.spells} knownSpellIds={[]} selected={selected} onSelect={onSelect} />
        )}
      </Card>
    </Section>
  )
}

function RollTwicePickOne({ lore, selected, onSelect }: { lore: SpellLore; selected: string | null; onSelect: (id: string | null) => void }) {
  const [first, setFirst] = useState<number | null>(null)
  const [second, setSecond] = useState<number | null>(null)
  const firstSpell = first !== null ? spellForRoll(lore, first) : undefined
  const secondSpell = second !== null ? spellForRoll(lore, second) : undefined
  const rolled = [firstSpell, secondSpell].filter((s): s is NonNullable<typeof s> => s !== undefined)
  const choices = rolled.filter((s, i) => rolled.findIndex((x) => x.id === s.id) === i)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-relaxed text-ink-dim">House rule: roll a {lore.die} on the {lore.name} table twice, then keep either result.</p>
      <div className="flex flex-wrap items-end gap-3">
        <DieField label="First roll" sides={6} value={first} onChange={setFirst} rollable />
        <DieField label="Second roll" sides={6} value={second} onChange={setSecond} rollable />
      </div>
      {choices.length > 0 ? (
        <SpellPicker lore={lore} spells={choices} knownSpellIds={[]} selected={selected} onSelect={onSelect} chooseFrom={{ reason: 'Roll twice, pick one' }} />
      ) : null}
    </div>
  )
}
