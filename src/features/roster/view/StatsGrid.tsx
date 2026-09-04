import type { Stats } from '../../../rules/types'
import { NumberField } from '../../../ui'
import { STAT_ORDER } from '../shared/stats'

export interface StatsGridProps {
  stats: Stats
  onChange: (stats: Stats) => void
  /** Error for one characteristic, if the validator flagged it. */
  errorFor: (key: keyof Stats) => string | undefined
}

/** Nine compact number inputs in rulebook order; the first error is shown once under the row. */
export function StatsGrid({ stats, onChange, errorFor }: StatsGridProps) {
  const firstError = STAT_ORDER.map(errorFor).find(Boolean)
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-9 gap-1">
        {STAT_ORDER.map((k) => (
          <NumberField
            key={k}
            compact
            label={k}
            value={stats[k]}
            error={errorFor(k) ? ' ' : undefined}
            onChange={(v) => onChange({ ...stats, [k]: v ?? 0 })}
          />
        ))}
      </div>
      {firstError ? <p className="text-sm text-accent-strong">{firstError}</p> : null}
    </div>
  )
}
