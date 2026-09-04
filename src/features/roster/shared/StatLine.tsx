import type { Stats } from '../../../rules/types'
import { STAT_ORDER } from './stats'

export interface StatLineProps {
  stats: Stats
  /** Compact: single row of nine cells, no labels row (labels shown once above by the caller). */
  compact?: boolean
  /** Extra classes on the wrapper, e.g. print colours. */
  className?: string
}

/** The nine-characteristic profile as a tight grid that fits a 360 px phone. */
export function StatLine({ stats, compact = false, className = '' }: StatLineProps) {
  return (
    <div className={`grid grid-cols-9 text-center font-mono text-sm tabular-nums ${className}`} aria-label="Characteristics">
      {!compact
        ? STAT_ORDER.map((k) => (
            <span key={`l-${k}`} className="text-[10px] uppercase tracking-wide text-ink-dim">
              {k}
            </span>
          ))
        : null}
      {STAT_ORDER.map((k) => (
        <span key={k} className="text-ink">
          {stats[k]}
        </span>
      ))}
    </div>
  )
}

/** Column headings alone, for tables where several StatLines share one header. */
export function StatHeader({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-9 text-center text-[10px] uppercase tracking-wide text-ink-dim ${className}`} aria-hidden>
      {STAT_ORDER.map((k) => (
        <span key={k}>{k}</span>
      ))}
    </div>
  )
}
