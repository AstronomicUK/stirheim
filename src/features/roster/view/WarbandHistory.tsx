// Everything that has happened to this warband, from the audit log: manual edits with what changed,
// trading, recruitment, advances, reports. The same lines as the campaign's activity feed, but for
// one warband, so an edit by hand is never invisible.

import { useMemo, useState } from 'react'
import { useWarbandActivity } from '../../../api/campaigns'
import { Notice, Spinner } from '../../../ui'
import { activityLines } from '../../campaign/activity'
import { ActivityList } from '../../campaign/ActivityList'
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
        <ActivityList lines={shown} />
      )}
      {lines.length > 8 ? <Disclosure open={showAll} onToggle={() => setShowAll((v) => !v)} label="older entries" count={lines.length - 8} /> : null}
    </Section>
  )
}
