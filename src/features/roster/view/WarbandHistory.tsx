// Everything that has happened to this warband, from the audit log: manual edits with what changed,
// trading, recruitment, advances, reports. The same lines as the campaign's activity feed, but for
// one warband, so an edit by hand is never invisible.

import { useMemo, useState } from 'react'
import { useWarbandActivity } from '../../../api/campaigns'
import { Icon, Notice, Spinner } from '../../../ui'
import { activityLines, formatRelativeTime } from '../../campaign/activity'
import { Disclosure, Section } from '../../campaign/bits'

export function WarbandHistory({ warbandId }: { warbandId: string }) {
  const activity = useWarbandActivity(warbandId)
  const [showAll, setShowAll] = useState(false)
  const lines = useMemo(() => (activity.data ? activityLines(activity.data) : []), [activity.data])
  const shown = showAll ? lines : lines.slice(0, 8)

  return (
    <Section title="History" aside={activity.data ? `${lines.length} ${lines.length === 1 ? 'entry' : 'entries'}` : undefined}>
      {activity.isPending ? (
        <div className="flex justify-center py-3">
          <Spinner label="Loading the history" />
        </div>
      ) : activity.isError ? (
        <Notice tone="error">{activity.error.message}</Notice>
      ) : lines.length === 0 ? (
        <p className="text-sm text-ink-dim">Nothing recorded yet.</p>
      ) : (
        <ol className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
          {shown.map((line) => (
            <li key={line.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
              <span className="flex min-w-0 items-start gap-2.5">
                <Icon name={line.icon} size={18} className="mt-0.5 shrink-0 text-brass" />
                <span className="text-sm leading-relaxed text-ink">{line.text}</span>
              </span>
              <time dateTime={line.at} className="shrink-0 text-xs text-ink-dim">
                {formatRelativeTime(line.at)}
              </time>
            </li>
          ))}
        </ol>
      )}
      {lines.length > 8 ? <Disclosure open={showAll} onToggle={() => setShowAll((v) => !v)} label="older entries" count={lines.length - 8} /> : null}
    </Section>
  )
}
