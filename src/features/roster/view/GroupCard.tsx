import { useState } from 'react'
import type { HenchmanGroupRow } from '../../../domain'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterItem } from '../../../rules/types/roster'
import { StatLine } from '../shared/StatLine'
import { unitTypeName } from '../shared/names'
import { STAT_ORDER } from '../shared/stats'
import { Card, ItemLines, RuleList, Tag, XpBar } from './bits'
import { warriorSpecialRules } from './lookups'

export interface GroupCardProps {
  group: HenchmanGroupRow
  /** The group's whole kit (quantities are group totals). */
  equipment: RosterItem[]
  template: WarbandTemplate | undefined
}

/** Per-model equipment: divide group totals by size where it divides evenly. */
function perModel(items: RosterItem[], size: number): { items: RosterItem[]; exact: boolean } {
  if (size <= 1) return { items, exact: true }
  const exact = items.every((i) => i.quantity % size === 0)
  if (!exact) return { items, exact: false }
  return { items: items.map((i) => ({ ...i, quantity: i.quantity / size })), exact: true }
}

export function GroupCard({ group, equipment, template }: GroupCardProps) {
  const [expanded, setExpanded] = useState(false)
  const typeName = unitTypeName(template?.id ?? '', group.unit_type_rules_id)
  const increases = STAT_ORDER.filter((k) => (group.stat_increases[k] ?? 0) > 0).map((k) => `+${group.stat_increases[k]} ${k}`)
  const kit = perModel(equipment, group.size)
  const rules = warriorSpecialRules(template, group.unit_type_rules_id, null)

  return (
    <Card className={group.size === 0 ? 'opacity-70' : ''}>
      <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="flex w-full flex-col gap-3 px-4 pt-3 pb-3 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-headline text-lg font-semibold leading-tight text-ink">{group.name}</h3>
            <p className="text-sm text-ink-dim">
              {typeName}
              {group.is_large ? ' · Large' : ''}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            <Tag tone={group.size === 0 ? 'danger' : 'neutral'}>{group.size === 1 ? '1 model' : `${group.size} models`}</Tag>
            {increases.map((t) => (
              <Tag key={t} tone="brass">
                {t}
              </Tag>
            ))}
          </div>
        </div>
        <StatLine stats={group.stats} />
        <XpBar xp={group.xp} levelUps={group.level_ups} role="henchman" />
      </button>

      <div className="flex flex-col gap-3 border-t border-border px-4 py-3">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] uppercase tracking-wider text-ink-dim">{kit.exact && group.size > 1 ? 'Each carries' : 'Equipment'}</p>
          <ItemLines items={kit.items} detailed={expanded} />
          {!kit.exact ? <p className="text-xs text-ink-dim">Group totals shown: the kit does not divide evenly between {group.size} models.</p> : null}
        </div>
        {group.notes ? <p className="whitespace-pre-line text-sm text-ink-dim">{group.notes}</p> : null}
        {expanded ? (
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            {rules.length > 0 ? (
              <>
                <p className="text-[10px] uppercase tracking-wider text-ink-dim">Special rules</p>
                <RuleList rules={rules} />
              </>
            ) : (
              <p className="text-xs text-ink-dim">No special rules.</p>
            )}
          </div>
        ) : null}
      </div>
    </Card>
  )
}
