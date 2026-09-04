import { StatLine } from '../roster/shared/StatLine'
import type { UnitListing } from './helpers'

export interface UnitListProps {
  listings: UnitListing[]
  /** Read-only view: nothing can be tapped. */
  disabled?: boolean
  onPick: (listing: UnitListing) => void
}

/** The template's unit types with hire cost, how many the roster holds and why one more cannot be hired. */
export function UnitList({ listings, disabled = false, onPick }: UnitListProps) {
  return (
    <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
      {listings.map((row) => {
        const blocked = disabled || !row.recruit.ok
        const full = row.max !== null && row.count >= row.max
        return (
          <li key={row.unit.id}>
            <button
              type="button"
              disabled={blocked}
              onClick={() => onPick(row)}
              className="flex w-full flex-col gap-2 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60 hover:bg-surface-high"
            >
              <span className="flex w-full items-baseline justify-between gap-3">
                <span className="text-base text-ink">{row.unit.name}</span>
                <span className="shrink-0 font-mono text-sm tabular-nums text-ink-dim">
                  {row.unit.cost === null ? 'no hire cost' : `${row.unit.cost} gc`}
                </span>
              </span>
              <span className="flex w-full items-baseline justify-between gap-3 text-xs text-ink-dim">
                <span>Limit {row.unit.rosterLimit}</span>
                <span className={full ? 'text-warn' : ''}>{full ? 'limit reached' : row.countText}</span>
              </span>
              {row.note ? <span className="text-xs text-ink-dim">{row.note}</span> : null}
              {!row.recruit.ok && !full && row.recruit.reason ? <span className="text-xs text-warn">{row.recruit.reason}</span> : null}
              <StatLine stats={row.unit.stats} compact className="text-xs" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
