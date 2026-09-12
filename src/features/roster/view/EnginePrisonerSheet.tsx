import type { ReactNode } from 'react'
import { Notice, Sheet } from '../../../ui'

export interface EnginePrisonerDetail {
  name: string
  origin: string
  engineName: string
  large: boolean
  state: 'held' | 'reversed' | 'freed' | 'dispatched'
  placedAt: string
  equipment: { id: string; name: string; quantity: number; notes?: string | null }[]
  /** Undefined means the original kit could not be loaded, not that it was empty. */
  equipmentKnown: boolean
  history: { at: string; text: string }[]
}

/** Named and exploration prisoners share the same readable record. Actions come from the authoritative custody case. */
export function EnginePrisonerSheet({ prisoner, children, onClose }: {
  prisoner: EnginePrisonerDetail
  children?: ReactNode
  onClose: () => void
}) {
  const status = { held: 'Imprisoned', reversed: 'Placement reversed', freed: 'Freed', dispatched: 'Sent to the Dark Lands' }[prisoner.state]
  const date = (value: string) => Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null
  return <Sheet open title={prisoner.name} description={prisoner.origin} onClose={onClose}>
    <div className="flex flex-col gap-5 pt-3">
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-xs uppercase tracking-wider text-brass">{status}</p>
        <p className="mt-2 break-words font-headline text-xl">{prisoner.engineName}</p>
        <p className="mt-1 text-sm text-ink-dim">{prisoner.large ? 'Large captive · 2 places' : '1 place'}{date(prisoner.placedAt) ? ` · Placed ${date(prisoner.placedAt)}` : ''}</p>
      </div>
      <section aria-label="Confiscated equipment">
        <h3 className="text-sm font-semibold">Equipment taken on imprisonment</h3>
        {!prisoner.equipmentKnown ? <Notice tone="warn">The original equipment record could not be loaded. Refresh before relying on this list.</Notice>
          : prisoner.equipment.length ? <ul className="mt-2 divide-y divide-border border-y border-border">{prisoner.equipment.map(item => <li key={item.id} className="py-3">
            <div className="flex justify-between gap-3 text-sm"><span className="min-w-0 break-words">{item.name}</span><span className="shrink-0 text-ink-dim">×{item.quantity}</span></div>
            {item.notes ? <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-ink-dim">{item.notes}</p> : null}
          </li>)}</ul> : <p className="mt-2 text-sm text-ink-dim">No equipment was confiscated.</p>}
        <p className="mt-2 text-xs leading-relaxed text-ink-dim">This records the equipment transferred at the time of imprisonment.</p>
      </section>
      {prisoner.history.length ? <details className="border-t border-border pt-3"><summary className="cursor-pointer text-sm font-semibold">Prisoner history</summary><ol className="mt-2 divide-y divide-border">{prisoner.history.map((entry, index) => <li key={`${entry.at}:${index}`} className="py-3"><p className="break-words text-sm leading-relaxed">{entry.text}</p>{date(entry.at) ? <time dateTime={entry.at} className="mt-1 block text-xs text-ink-dim">{date(entry.at)}</time> : null}</li>)}</ol></details> : null}
      {children}
    </div>
  </Sheet>
}
