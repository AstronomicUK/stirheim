import type { WarbandDraft } from '../../../rules/resolve/builder'
import { parseRosterLimit } from '../../../rules/resolve/roster'
import type { UnitTemplate, WarbandTemplate } from '../../../rules/types'
import { Sheet } from '../../../ui'
import { StatLine } from '../shared/StatLine'
import { draftUnitCount, takenText, unitLimitReached } from './helpers'

export interface AddUnitSheetProps {
  open: boolean
  onClose: () => void
  role: 'hero' | 'henchman'
  template: WarbandTemplate
  draft: WarbandDraft
  onPick: (unit: UnitTemplate) => void
}

/** The template's hero or henchman unit types with hire cost, limit and how many the draft already holds. */
export function AddUnitSheet({ open, onClose, role, template, draft, onPick }: AddUnitSheetProps) {
  const units = role === 'hero' ? template.heroTemplates : template.henchmanTemplates
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={role === 'hero' ? 'Add hero' : 'Add henchman group'}
      description={role === 'hero' ? 'Hire costs come off your starting gold.' : 'A new group starts with one model; grow it on the card.'}
    >
      <ul className="flex flex-col divide-y divide-border pb-2">
        {units.map((unit) => {
          const taken = draftUnitCount(draft, unit)
          const full = unitLimitReached(draft, unit)
          const limit = parseRosterLimit(unit.rosterLimit)
          return (
            <li key={unit.id}>
              <button
                type="button"
                disabled={full}
                onClick={() => onPick(unit)}
                className="flex w-full flex-col gap-2 py-3 text-left disabled:cursor-not-allowed disabled:opacity-50 hover:bg-surface-high"
              >
                <span className="flex w-full items-baseline justify-between gap-3">
                  <span className="text-base text-ink">{unit.name}</span>
                  <span className="shrink-0 font-mono text-sm tabular-nums text-ink-dim">
                    {unit.cost === null ? 'no hire cost' : `${unit.cost} gc`}
                  </span>
                </span>
                <span className="flex w-full items-baseline justify-between gap-3 text-xs text-ink-dim">
                  <span>Limit {unit.rosterLimit}</span>
                  <span className={full ? 'text-warn' : ''}>{full ? 'limit reached' : takenText(taken, unit.rosterLimit)}</span>
                </span>
                {limit.note ? <span className="text-xs text-ink-dim">{limit.note}</span> : null}
                <StatLine stats={unit.stats} />
              </button>
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
