import { useMemo, useState } from 'react'
import { findUnitTemplate } from '../../../rules/data/warbandTemplates'
import type { CampaignBans } from '../../../rules/types/roster'
import {
  equipmentOptionsFor,
  removeDraftGroup,
  renameDraftGroup,
  setDraftGroupSize,
  type DraftGroup,
  type WarbandDraft,
} from '../../../rules/resolve/builder'
import type { WarbandTemplate } from '../../../rules/types'
import { Button, Sheet, Stepper, TextField } from '../../../ui'
import { StatLine } from '../shared/StatLine'
import { useDraftStore } from './draftStore'
import { EquipmentRows } from './EquipmentRows'
import { EquipmentSheet } from './EquipmentSheet'
import { formatAmount, groupCost, groupSizeCeiling } from './helpers'
import { useBuilderRules } from './rulesContext'

export interface GroupCardProps {
  group: DraftGroup
  draft: WarbandDraft
  template: WarbandTemplate
  bans?: CampaignBans
}

export function GroupCard({ group, draft, template, bans }: GroupCardProps) {
  const update = useDraftStore((s) => s.update)
  const [shopping, setShopping] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const unit = findUnitTemplate(template, group.unitTemplateId)
  const options = useMemo(() => equipmentOptionsFor(template, group.unitTemplateId, bans), [template, group.unitTemplateId, bans])
  const houseRules = useBuilderRules()
  const cost = groupCost(group, template, houseRules)
  const ceiling = unit ? groupSizeCeiling(draft, group, unit) : null
  const subject = { kind: 'group' as const, id: group.id }
  const perModelHire = unit?.cost ?? 0

  return (
    <article className="flex flex-col gap-3 rounded-md border border-border bg-surface-low px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-xs uppercase tracking-wider text-ink-dim">{unit?.name ?? group.unitTemplateId}</span>
          <span className="text-sm tabular-nums text-ink-dim">
            {group.size} x {formatAmount(perModelHire)} hire · total <span className="text-ink">{formatAmount(cost.total)}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setConfirmRemove(true)}
          className="-mr-2 inline-flex min-h-11 shrink-0 items-center px-2 text-xs text-ink-dim hover:text-accent-strong"
        >
          Remove
        </button>
      </div>

      <TextField label="Group name" autoComplete="off" maxLength={60} value={group.name} onChange={(e) => update((d) => renameDraftGroup(d, group.id, e.target.value))} />

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-ink-dim">
          Models{ceiling !== null ? <span className="ml-1 text-xs">(up to {ceiling})</span> : null}
        </span>
        <Stepper label="models" value={group.size} min={1} max={ceiling} onChange={(size) => update((d) => setDraftGroupSize(d, group.id, size))} />
      </div>

      {unit ? <StatLine stats={unit.stats} /> : null}

      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wider text-ink-dim">Equipment, each model</span>
        <EquipmentRows subject={subject} equipment={group.equipment} options={options} models={group.size} />
      </div>

      <Button variant="secondary" block onClick={() => setShopping(true)}>
        Add equipment
      </Button>

      <EquipmentSheet
        open={shopping}
        onClose={() => setShopping(false)}
        subjectLabel={`${group.name.trim() || unit?.name || 'Group'} (${unit?.name ?? group.unitTemplateId}, each model)`}
        subject={subject}
        equipment={group.equipment}
        options={options}
        template={template}
      />

      <Sheet
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Remove this group?"
        description={`${group.name.trim() || unit?.name || 'This group'} and everything bought for it will be gone, with no way to bring it back.`}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmRemove(false)}>
              Keep it
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => update((d) => removeDraftGroup(d, group.id))}>
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
