import { useState } from 'react'
import { Card } from '../../roster/view/bits'
import { EXPERIENCE_REMINDERS } from './sheet'

/** What the post-battle wizard will award. Reference only; nothing on this screen applies experience. */
export function ExperienceReminders() {
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left">
        <span className="text-sm font-medium text-ink">Experience reminders</span>
        <span className="text-xs text-ink-dim">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open ? (
        <div className="flex flex-col gap-2 border-t border-border px-4 py-3">
          <ul className="flex flex-col gap-1.5 text-sm">
            {EXPERIENCE_REMINDERS.map((r) => (
              <li key={`${r.who}-${r.text}`}>
                <span className="text-ink">{r.who}.</span> <span className="text-ink-dim">{r.text}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-dim">Nothing is applied here. The post-battle report counts it all up from this sheet.</p>
        </div>
      ) : null}
    </Card>
  )
}
