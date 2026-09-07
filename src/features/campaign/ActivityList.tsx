// One rendering of the audit feed, shared by the campaign's "Recent activity" and a warband's
// "History": a line per batched save, and on tap the column-by-column before/after behind it.

import { useState } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../ui'
import { activityFieldChanges, formatRelativeTime, type ActivityLine } from './activity'

export function ActivityList({ lines, linkable = false }: { lines: ActivityLine[]; linkable?: boolean }) {
  const [openId, setOpenId] = useState<number | null>(null)
  return (
    <ol className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
      {lines.map((line) => {
        const open = openId === line.id
        return (
          <li key={line.id} className="flex flex-col gap-2 px-4 py-2.5">
            <div className="flex items-start justify-between gap-3">
              <span className="flex min-w-0 items-start gap-2.5">
                <Icon name={line.icon} size={18} className="mt-0.5 shrink-0 text-brass" />
                {linkable && line.to ? (
                  <Link to={line.to} className="text-sm leading-relaxed text-ink underline-offset-4 hover:underline">
                    {line.text}
                  </Link>
                ) : (
                  <span className="text-sm leading-relaxed text-ink">{line.text}</span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <time dateTime={line.at} className="text-xs text-ink-dim">
                  {formatRelativeTime(line.at)}
                </time>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : line.id)}
                  className="min-h-6 whitespace-nowrap text-xs text-ink-dim underline-offset-2 hover:text-ink hover:underline"
                >
                  {open ? 'Hide' : 'Details'}
                </button>
              </span>
            </div>
            {open ? <ActivityDetail line={line} /> : null}
          </li>
        )
      })}
    </ol>
  )
}

function ActivityDetail({ line }: { line: ActivityLine }) {
  const groups = line.entries.map((entry) => ({ entry, changes: activityFieldChanges(entry) })).filter((g) => g.changes.length > 0)
  if (groups.length === 0) return <p className="rounded-md bg-surface px-3 py-2 text-xs text-ink-dim">Nothing else recorded on this save.</p>
  return (
    <div className="flex flex-col gap-2 rounded-md bg-surface px-3 py-2">
      {groups.map(({ entry, changes }) => (
        <div key={entry.id} className="flex flex-col gap-1">
          {groups.length > 1 ? <p className="text-[10px] uppercase tracking-wider text-ink-dim">{entry.table_name.replace(/_/g, ' ')}</p> : null}
          <ul className="flex flex-col gap-0.5">
            {changes.map((c) => (
              <li key={c.label} className="flex flex-wrap items-baseline gap-x-1.5 text-xs text-ink-dim">
                <span className="text-ink">{c.label}:</span>
                <span>{c.before}</span>
                <span aria-hidden>→</span>
                <span className="text-ink">{c.after}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
