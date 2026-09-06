import type { Stats } from '../../../rules/types'
import type { StatKey } from '../../../rules/types/common'
import { STAT_ORDER } from './stats'

export interface StatLineProps {
  stats: Stats
  /** Compact: a single row of nine figures with no labels (the caller shows a StatHeader once). */
  compact?: boolean
  /** Characteristics raised by advances; shown in green. */
  raised?: Partial<Record<StatKey, number>> | StatKey[]
  /** Characteristics below the warrior's starting profile (injuries); shown in oxblood. */
  lowered?: StatKey[]
  /** Extra classes on the wrapper, e.g. print colours. */
  className?: string
}

function isRaised(raised: StatLineProps['raised'], key: StatKey): boolean {
  if (!raised) return false
  if (Array.isArray(raised)) return raised.includes(key)
  return (raised[key] ?? 0) > 0
}

/**
 * The nine-characteristic profile as a bordered grid of cells, label over figure, as on the printed
 * roster sheet. Fits a 360 px phone at 15 px figures.
 */
export function StatLine({ stats, compact = false, raised, lowered, className = '' }: StatLineProps) {
  const tone = (k: StatKey) => (lowered?.includes(k) ? 'text-accent-strong' : isRaised(raised, k) ? 'text-ok' : 'text-ink')
  const title = (k: StatKey) => (lowered?.includes(k) ? 'Below the starting profile' : isRaised(raised, k) ? 'Raised by an advance' : undefined)
  if (compact) {
    return (
      <div className={`grid grid-cols-9 text-center text-sm tabular-nums ${className}`} aria-label="Characteristics">
        {STAT_ORDER.map((k) => (
          <span key={k} title={title(k)} className={`${tone(k)} ${tone(k) !== 'text-ink' ? 'font-semibold' : ''}`}>
            {stats[k]}
          </span>
        ))}
      </div>
    )
  }
  return (
    <div className={`grid grid-cols-9 divide-x divide-border overflow-hidden rounded border border-border text-center tabular-nums ${className}`} aria-label="Characteristics">
      {STAT_ORDER.map((k) => (
        <div key={k} className="flex flex-col py-1" title={title(k)}>
          <span className="text-[10px] font-bold tracking-wide text-ink-dim">{k}</span>
          <span className={`text-[15px] font-semibold leading-5 ${tone(k)}`}>{stats[k]}</span>
        </div>
      ))}
    </div>
  )
}

/** Column headings alone, for tables where several compact StatLines share one header. */
export function StatHeader({ className = '' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-9 text-center text-[10px] font-bold tracking-wide text-ink-dim ${className}`} aria-hidden>
      {STAT_ORDER.map((k) => (
        <span key={k}>{k}</span>
      ))}
    </div>
  )
}
