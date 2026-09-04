// Small presentational pieces shared by the scenario screens.

import type { ReactNode } from 'react'
import { Link } from 'react-router'

export function Tag({ tone = 'neutral', children }: { tone?: 'neutral' | 'brass'; children: ReactNode }) {
  const cls = tone === 'brass' ? 'border-brass/60 text-brass' : 'border-border text-ink-dim'
  return <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs leading-5 ${cls}`}>{children}</span>
}

export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xs uppercase tracking-[0.25em] text-ink-dim">{title}</h2>
        {aside ? <span className="text-xs text-ink-dim">{aside}</span> : null}
      </div>
      {children}
    </section>
  )
}

/** A router link dressed as the primary button (a button inside an anchor is not valid HTML). */
export function PrimaryLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-base font-medium text-ink no-underline transition-colors hover:bg-accent-strong"
    >
      {children}
    </Link>
  )
}

export function SecondaryLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border bg-surface-high px-4 text-base font-medium text-ink no-underline transition-colors hover:border-ink-dim"
    >
      {children}
    </Link>
  )
}

export interface ScenarioRowItem {
  key: string
  to: string
  /** Rulebook number shown in the left margin, when known. */
  number?: number | null
  title: string
  subtitle?: string
  /** One-line description; clamped to two lines. */
  description?: string
  badge?: ReactNode
}

/** A ledger-style list of scenario links. */
export function ScenarioRows({ rows }: { rows: ScenarioRowItem[] }) {
  return (
    <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
      {rows.map((row) => (
        <li key={row.key}>
          <Link to={row.to} className="flex min-h-11 items-start gap-3 px-4 py-3 no-underline hover:bg-surface-high">
            {row.number != null ? (
              <span className="w-5 shrink-0 pt-0.5 text-right font-mono text-sm tabular-nums text-ink-dim">{row.number}</span>
            ) : null}
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2">
                <span className="truncate font-medium text-ink">{row.title}</span>
                {row.badge}
              </span>
              {row.subtitle ? <span className="truncate text-xs text-ink-dim">{row.subtitle}</span> : null}
              {row.description ? <span className="line-clamp-2 text-sm leading-snug text-ink-dim">{row.description}</span> : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
