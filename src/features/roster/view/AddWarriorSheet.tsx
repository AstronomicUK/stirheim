import { useMemo, useState } from 'react'
import { HIRED_SWORDS } from '../../../rules/data/campaign/hiredSwords'
import type { UnitTemplate, WarbandTemplate } from '../../../rules/types'
import { Button, SelectField, Sheet } from '../../../ui'
import { StatLine } from '../shared/StatLine'

export type AddWarriorChoice =
  | { kind: 'hero'; unit: UnitTemplate }
  | { kind: 'group'; unit: UnitTemplate }
  | { kind: 'hired'; hiredSwordId: string }

export interface AddWarriorSheetProps {
  open: boolean
  onClose: () => void
  template: WarbandTemplate | undefined
  onAdd: (choice: AddWarriorChoice) => void
}

/** Pick a unit type from the warband list (stats prefilled) or a hired sword by name. */
export function AddWarriorSheet({ open, onClose, template, onAdd }: AddWarriorSheetProps) {
  const [hired, setHired] = useState('')
  const hiredSwords = useMemo(() => [...HIRED_SWORDS].sort((a, b) => a.name.localeCompare(b.name)), [])

  function pick(choice: AddWarriorChoice) {
    onAdd(choice)
    onClose()
  }

  const unitButton = (unit: UnitTemplate, kind: 'hero' | 'group') => (
    <li key={unit.id}>
      <button
        type="button"
        onClick={() => pick({ kind, unit })}
        className="flex w-full flex-col gap-1.5 py-3 text-left hover:bg-surface-high/60"
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-ink">{unit.name}</span>
          <span className="text-xs text-ink-dim">
            {unit.rosterLimit}
            {unit.cost !== null ? ` · ${unit.cost} gc` : ''}
          </span>
        </span>
        <StatLine stats={unit.stats} compact className="text-xs" />
      </button>
    </li>
  )

  return (
    <Sheet open={open} onClose={onClose} title="Add a warrior" description={template ? `From the ${template.name} list.` : 'This warband type is not in the rules data; only hired swords can be added.'}>
      <div className="flex flex-col gap-5 pb-2">
        {template ? (
          <>
            <section>
              <h3 className="text-xs uppercase tracking-[0.25em] text-ink-dim">Heroes</h3>
              <ul className="divide-y divide-border">{template.heroTemplates.map((u) => unitButton(u, 'hero'))}</ul>
            </section>
            <section>
              <h3 className="text-xs uppercase tracking-[0.25em] text-ink-dim">Henchmen</h3>
              <ul className="divide-y divide-border">{template.henchmanTemplates.map((u) => unitButton(u, 'group'))}</ul>
            </section>
          </>
        ) : null}
        <section className="flex flex-col gap-3">
          <h3 className="text-xs uppercase tracking-[0.25em] text-ink-dim">Hired swords</h3>
          <SelectField label="Hired sword" hideLabel value={hired} onChange={(e) => setHired(e.target.value)}>
            <option value="">Choose a hired sword…</option>
            {hiredSwords.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
                {h.hireCost.base !== null ? ` (${h.hireCost.text})` : ''}
              </option>
            ))}
          </SelectField>
          <Button variant="secondary" block disabled={hired === ''} onClick={() => pick({ kind: 'hired', hiredSwordId: hired })}>
            Add hired sword
          </Button>
        </section>
      </div>
    </Sheet>
  )
}
