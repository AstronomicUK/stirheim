// Reading one of the three books. A Tome of Magic, a Book of the Dead or a Liber Bubonicus on the
// roster offers itself to whoever may read it: choose the reader, choose the table where the book
// opens more than one, roll the die, and the spell is his. A spell he already knows is either
// rolled again or taken at one lower Difficulty, as the rulebook allows.

import { useMemo, useState } from 'react'
import { useUpdateRoster, type WarbandDetail } from '../../../api/warbands'
import { findLore } from '../../../rules/data/campaign/magic'
import { findUnitTemplate } from '../../../rules/data/warbandTemplates'
import {
  emptyGrimoireChoices,
  grimoireUses,
  planGrimoire,
  type GrimoireChoices,
  type GrimoireUse,
} from '../../../rules/resolve/grimoires'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterWarband } from '../../../rules/types/roster'
import { Button, DicePicker, Icon, Notice, Sheet } from '../../../ui'
import { Card, Section } from './bits'
import { diffRoster } from '../../../domain/rosterDiff'

export interface GrimoireCardProps {
  detail: WarbandDetail
  template: WarbandTemplate | undefined
  canEdit: boolean
  /** Books already used up in this campaign (the Liber Bubonicus is once only). */
  spentInCampaign?: string[]
  onError: (message: string | null) => void
}

export function GrimoireCard({ detail, template, canEdit, spentInCampaign, onError }: GrimoireCardProps) {
  const update = useUpdateRoster(detail.warband.id)
  const uses = useMemo(
    () =>
      grimoireUses({
        roster: detail.roster,
        warbandName: template?.name,
        unitNameFor: (hero) => (template ? findUnitTemplate(template, hero.unitTemplateId)?.name : undefined),
        spentInCampaign,
      }),
    [detail.roster, template, spentInCampaign],
  )
  const [openFor, setOpenFor] = useState<string | null>(null)

  if (!canEdit || uses.length === 0) return null

  // One card per book, listing everyone who could read it.
  const books = [...new Set(uses.map((u) => u.itemId))]
  return (
    <Section title="Unread books">
      <div className="flex flex-col gap-3">
        {books.map((itemId) => {
          const forBook = uses.filter((u) => u.itemId === itemId)
          const name = forBook[0].itemName
          return (
            <Card key={itemId} className="flex flex-col gap-3 px-4 py-3">
              <div className="flex items-start gap-2">
                <Icon name="book" size={20} className="mt-0.5 shrink-0 text-brass" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{name}</p>
                  <p className="text-xs leading-relaxed text-ink-dim">{forBook[0].note}</p>
                </div>
              </div>
              <ul className="flex flex-col gap-2">
                {forBook.map((use) => (
                  <li key={use.heroId} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2">
                    <span className="min-w-0">
                      <span className="text-sm text-ink">{use.heroName}</span>
                      {use.blocks.length > 0 ? <span className="block text-xs leading-relaxed text-ink-dim">{use.blocks.join(' ')}</span> : null}
                    </span>
                    <Button variant="secondary" disabled={use.blocks.length > 0} onClick={() => setOpenFor(`${use.itemId}:${use.heroId}`)}>
                      Read it
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          )
        })}
      </div>

      {uses.map((use) => (
        <ReadingSheet
          key={`${use.itemId}:${use.heroId}`}
          open={openFor === `${use.itemId}:${use.heroId}`}
          use={use}
          detail={detail}
          pending={update.isPending}
          onClose={() => setOpenFor(null)}
          onApply={async (next) => {
            onError(null)
            try {
              await update.mutateAsync({ reason: 'grimoire', changes: diffRoster(detail, next) })
              setOpenFor(null)
            } catch (e) {
              onError(e instanceof Error ? e.message : 'Could not record the spell.')
            }
          }}
        />
      ))}
    </Section>
  )
}

function ReadingSheet({
  open,
  use,
  detail,
  pending,
  onClose,
  onApply,
}: {
  open: boolean
  use: GrimoireUse
  detail: WarbandDetail
  pending: boolean
  onClose: () => void
  onApply: (next: RosterWarband) => Promise<void>
}) {
  const [choices, setChoices] = useState<GrimoireChoices>(emptyGrimoireChoices)
  const plan = planGrimoire(detail.roster, use, choices)
  const loreId = choices.loreId ?? (use.sources.length === 1 ? use.sources[0].loreId : null)
  const lore = loreId ? findLore(loreId) : null

  function reset() {
    setChoices(emptyGrimoireChoices())
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title={`${use.heroName} reads the ${use.itemName}`}
      description={use.note}
      footer={
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              reset()
              onClose()
            }}
            disabled={pending}
          >
            Not now
          </Button>
          <Button
            className="flex-1"
            disabled={plan.result === null}
            pending={pending}
            onClick={() => {
              if (plan.result) void onApply(plan.result.roster)
            }}
          >
            {plan.result ? 'Keep it' : 'Roll first'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {use.sources.length > 1 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-ink-dim">Which list</p>
            <div className="flex flex-wrap gap-2">
              {use.sources.map((source) => {
                const on = loreId === source.loreId
                return (
                  <button
                    key={source.loreId}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setChoices({ ...emptyGrimoireChoices(), loreId: source.loreId })}
                    className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${on ? 'border-brass bg-surface-high text-ink' : 'border-border text-ink-dim hover:text-ink'}`}
                  >
                    {source.loreName}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {lore ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-ink-dim">Roll on the {lore.name} table</p>
            <DicePicker
              count={1}
              label={`${lore.name} table`}
              resetKey={`${loreId}:${choices.duplicate ?? ''}:${choices.roll ?? ''}`}
              onComplete={(values) => setChoices((c) => ({ ...c, loreId, roll: values[0], duplicate: null }))}
            />
            <ol className="flex flex-col divide-y divide-border rounded-md border border-border">
              {lore.spells.map((spell) => {
                const on = choices.roll !== null && choices.roll >= spell.roll.min && choices.roll <= spell.roll.max
                return (
                  <li key={spell.id} className={`flex items-baseline gap-2 px-3 py-2 ${on ? 'bg-brass/15' : ''}`}>
                    <span className="w-6 shrink-0 text-xs tabular-nums text-ink-dim">{spell.roll.min === spell.roll.max ? spell.roll.min : `${spell.roll.min}-${spell.roll.max}`}</span>
                    <span className="min-w-0">
                      <span className={`text-sm ${on ? 'font-semibold text-ink' : 'text-ink'}`}>{spell.name}</span>
                      <span className="block text-xs text-ink-dim">{spell.difficulty === null ? 'Automatic' : `Difficulty ${spell.difficulty}+`}</span>
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>
        ) : null}

        {plan.duplicate && plan.spell ? (
          <Notice tone="warn" title={`${use.heroName} already knows ${plan.spell.name}`}>
            <div className="flex flex-col gap-2">
              <p>Roll again, or keep it and lower its Difficulty by 1.</p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setChoices((c) => ({ ...c, roll: null, duplicate: null }))}>
                  Roll again
                </Button>
                <Button variant="secondary" onClick={() => setChoices((c) => ({ ...c, duplicate: 'lowerDifficulty' }))}>
                  Lower its Difficulty
                </Button>
              </div>
            </div>
          </Notice>
        ) : null}

        {plan.result ? (
          <Notice tone="info" title="What this does">
            <ul className="flex flex-col gap-1">
              {plan.result.events.map((event, i) => (
                <li key={i}>{event.message}</li>
              ))}
            </ul>
          </Notice>
        ) : plan.need === 'roll' && choices.roll !== null && lore ? (
          <p className="text-sm text-ink-dim">Nothing on the {lore.name} table for a {choices.roll}; the table is a {lore.die}.</p>
        ) : null}
      </div>
    </Sheet>
  )
}
