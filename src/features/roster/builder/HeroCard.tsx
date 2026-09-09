import { useMemo, useState } from 'react'
import { findUnitTemplate } from '../../../rules/data/warbandTemplates'
import type { CampaignBans } from '../../../rules/types/roster'
import { equipmentOptionsFor, removeDraftHero, renameDraftHero, type DraftHero } from '../../../rules/resolve/builder'
import type { WarbandTemplate } from '../../../rules/types'
import { Button, Sheet, TextField } from '../../../ui'
import { StatLine } from '../shared/StatLine'
import { useDraftStore } from './draftStore'
import { EquipmentRows } from './EquipmentRows'
import { EquipmentSheet } from './EquipmentSheet'
import { StartingMagicCard } from './StartingMagicCard'
import { formatAmount, heroCost } from './helpers'
import { useBuilderRules } from './rulesContext'

export interface HeroCardProps {
  hero: DraftHero
  template: WarbandTemplate
  /** The mandatory leader cannot be removed. */
  isLeader: boolean
  bans?: CampaignBans
}

export function HeroCard({ hero, template, isLeader, bans }: HeroCardProps) {
  const update = useDraftStore((s) => s.update)
  const [shopping, setShopping] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const unit = findUnitTemplate(template, hero.unitTemplateId)
  const options = useMemo(() => equipmentOptionsFor(template, hero.unitTemplateId, bans), [template, hero.unitTemplateId, bans])
  const houseRules = useBuilderRules()
  const cost = heroCost(hero, template, houseRules)
  const subject = { kind: 'hero' as const, id: hero.id }
  const masterSpells = useDraftStore(s => s.draft?.heroes.find(h => h.unitTemplateId === 'restless_dead_variant_liche')?.spellIds)

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
            onClick={() => setConfirmRemove(true)}
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

      <StartingMagicCard unitId={hero.unitTemplateId} template={template} rule={houseRules.firstSpellRule} choiceId={hero.magicChoiceId} spells={hero.spellIds}
        apprenticeSpells={hero.unitTemplateId === 'restless_dead_variant_necromancer' ? masterSpells ?? [] : undefined}
        onChoice={id => update(d => ({ ...d, heroes: d.heroes.map(h => h.id === hero.id ? { ...h, magicChoiceId: id, spellIds: [] } : h) }))}
        onSpells={ids => update(d => ({ ...d, heroes: d.heroes.map(h => h.id === hero.id ? { ...h, spellIds: ids } : h) }))} />

      <EquipmentSheet
        open={shopping}
        onClose={() => setShopping(false)}
        subjectLabel={`${hero.name.trim() || unit?.name || 'Hero'} (${unit?.name ?? hero.unitTemplateId})`}
        subject={subject}
        equipment={hero.equipment}
        options={options}
        template={template}
      />

      <Sheet
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Remove this hero?"
        description={`${hero.name.trim() || unit?.name || 'This hero'} and everything bought for them will be gone, with no way to bring them back.`}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmRemove(false)}>
              Keep them
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => update((d) => removeDraftHero(d, hero.id))}>
              Remove
            </Button>
          </div>
        }
      >
        {null}
      </Sheet>
    </article>
  )
}
