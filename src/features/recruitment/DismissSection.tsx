import { useState } from 'react'
import type { WarbandDetail } from '../../api/warbands'
import { dismissWarrior } from '../../rules/resolve/recruitment'
import type { WarbandTemplate } from '../../rules/types'
import { Button, Notice, Sheet } from '../../ui'
import { unitTypeName } from '../roster/shared/names'
import { Section } from '../roster/view/bits'
import { outcomeFrom, useCommit, type Outcome } from './useCommit'

export interface DismissSectionProps {
  detail: WarbandDetail
  template: WarbandTemplate | undefined
  onDone: (outcome: Outcome) => void
}

type Target = { kind: 'hero'; id: string; name: string; type: string; items: number } | { kind: 'group'; id: string; name: string; type: string; size: number; items: number }

/** Let heroes and henchmen go: heroes retire with their kit to the stash, one henchman leaves a group at a time. */
export function DismissSection({ detail, template, onDone }: DismissSectionProps) {
  const { roster, warband } = detail
  const [target, setTarget] = useState<Target | null>(null)
  const typeName = (unitTemplateId: string) => (template ? unitTypeName(warband.type_rules_id, unitTemplateId) : unitTemplateId)

  const rows: Target[] = [
    ...roster.heroes
      .filter((h) => h.status === 'active')
      .map((h): Target => ({ kind: 'hero', id: h.id, name: h.name, type: typeName(h.unitTemplateId), items: h.equipment.length })),
    ...roster.henchmenGroups.map(
      (g): Target => ({ kind: 'group', id: g.id, name: g.name, type: typeName(g.unitTemplateId), size: g.size, items: g.equipment.length }),
    ),
  ]
  if (rows.length === 0) return null

  return (
    <Section title="Dismiss a warrior">
      <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm text-ink">{row.name}</p>
              <p className="text-xs text-ink-dim">
                {row.type}
                {row.kind === 'group' ? ` · ${row.size} ${row.size === 1 ? 'model' : 'models'}` : ''}
              </p>
            </div>
            <Button variant="danger" className="shrink-0" onClick={() => setTarget(row)}>
              {row.kind === 'group' ? 'Dismiss one' : 'Dismiss'}
            </Button>
          </li>
        ))}
      </ul>
      {target ? (
        <DismissSheet
          key={target.id}
          detail={detail}
          target={target}
          onClose={() => setTarget(null)}
          onDone={(outcome) => {
            setTarget(null)
            onDone(outcome)
          }}
        />
      ) : null}
    </Section>
  )
}

function DismissSheet({ detail, target, onClose, onDone }: { detail: WarbandDetail; target: Target; onClose: () => void; onDone: (outcome: Outcome) => void }) {
  const { commit, error, pending } = useCommit(detail)

  async function confirm() {
    const result = await commit(() => dismissWarrior(detail.roster, target.id), (w) => w)
    if (result) onDone(outcomeFrom(target.kind === 'hero' ? `${target.name} retires` : `One of ${target.name} leaves`, result.events, { tone: 'warn' }))
  }

  const explanation =
    target.kind === 'hero'
      ? `${target.name} is retired from the roster (kept for the record) and ${target.items ? 'their equipment goes to the stash' : 'they had no equipment to return'}.`
      : target.size > 1
        ? `The group shrinks to ${target.size - 1}${target.items ? ' and one set of its equipment goes to the stash' : ''}.`
        : `The last member leaves and the group is removed${target.items ? '; its equipment goes to the stash' : ''}.`

  return (
    <Sheet
      open
      onClose={onClose}
      title={target.kind === 'hero' ? `Dismiss ${target.name}?` : `Dismiss one of ${target.name}?`}
      footer={
        <Button block variant="danger" pending={pending} onClick={() => void confirm()}>
          Dismiss
        </Button>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <p className="text-sm text-ink-dim">{explanation} No gold is refunded.</p>
        {error ? <Notice tone="error">{error}</Notice> : null}
      </div>
    </Sheet>
  )
}
