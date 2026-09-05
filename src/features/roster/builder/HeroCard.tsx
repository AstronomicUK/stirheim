import { useMemo, useState } from 'react'
import { findUnitTemplate } from '../../../rules/data/warbandTemplates'
import { equipmentOptionsFor, removeDraftHero, renameDraftHero, type DraftHero } from '../../../rules/resolve/builder'
import type { WarbandTemplate } from '../../../rules/types'
import { Button, TextField } from '../../../ui'
import { StatLine } from '../shared/StatLine'
import { useDraftStore } from './draftStore'
import { EquipmentRows } from './EquipmentRows'
import { EquipmentSheet } from './EquipmentSheet'
import { formatAmount, heroCost } from './helpers'

export interface HeroCardProps {
  hero: DraftHero
  template: WarbandTemplate
  /** The mandatory leader cannot be removed. */
  isLeader: boolean
}

export function HeroCard({ hero, template, isLeader }: HeroCardProps) {
  const update = useDraftStore((s) => s.update)
  const [shopping, setShopping] = useState(false)
  const unit = findUnitTemplate(template, hero.unitTemplateId)
  const options = useMemo(() => equipmentOptionsFor(template, hero.unitTemplateId), [template, hero.unitTemplateId])
  const cost = heroCost(hero, template)
  const subject = { kind: 'hero' as const, id: hero.id }

  return (
    <article className="flex flex-col gap-3 rounded-md border border-border bg-surface-low px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-xs uppercase tracking-wider text-ink-dim">{unit?.name ?? hero.unitTemplateId}{isLeader ? ' · Leader' : ''}</span>
          <span className="text-sm tabular-nums text-ink-dim">
            hire {formatAmount(cost.hire)} · total <span className="text-ink">{formatAmount(cost.total)}</span>
          </span>
        </div>
        {!isLeader ? (
          <button
            type="button"
            onClick={() => update((d) => removeDraftHero(d, hero.id))}
            className="-mr-2 inline-flex min-h-11 shrink-0 items-center px-2 text-xs text-ink-dim hover:text-accent-strong"
          >
            Remove
          </button>
        ) : null}
      </div>

      <TextField label="Name" autoComplete="off" maxLength={60} value={hero.name} onChange={(e) => update((d) => renameDraftHero(d, hero.id, e.target.value))} />

      {unit ? <StatLine stats={unit.stats} /> : null}

      <EquipmentRows subject={subject} equipment={hero.equipment} options={options} />

      <Button variant="secondary" block onClick={() => setShopping(true)}>
        Add equipment
      </Button>

      <EquipmentSheet
        open={shopping}
        onClose={() => setShopping(false)}
        subjectLabel={`${hero.name.trim() || unit?.name || 'Hero'} (${unit?.name ?? hero.unitTemplateId})`}
        subject={subject}
        equipment={hero.equipment}
        options={options}
      />
    </article>
  )
}
