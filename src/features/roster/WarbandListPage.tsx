import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useMyWarbands, type WarbandSummary } from '../../api/warbands'
import { useSession } from '../../app/session'
import { Notice, PageHeader, Spinner } from '../../ui'
import { useDraftStore } from './builder/draftStore'
import { splitArchived } from './builder/helpers'
import { warbandTypeName } from './shared/names'

export function WarbandListPage() {
  const user = useSession((s) => s.user)
  const warbands = useMyWarbands(user?.id)
  const draft = useDraftStore((s) => s.draft)
  const [showArchived, setShowArchived] = useState(false)

  const split = warbands.data ? splitArchived(warbands.data) : null

  return (
    <>
      <PageHeader
        eyebrow="Ledger"
        title="Your warbands"
        aside={
          <Link to="/warbands/new" className="inline-flex min-h-11 items-center px-2 text-sm text-brass underline-offset-4 hover:underline">
            New warband
          </Link>
        }
      />

      {draft ? (
        <Notice tone="warn" title="Unfinished draft">
          <span className="text-ink">{draft.name.trim() || 'Unnamed warband'}</span> ({warbandTypeName(draft.warbandTemplateId)}).{' '}
          <Link to={`/warbands/new/${draft.warbandTemplateId}`} className="text-brass underline-offset-4 hover:underline">
            Continue building
          </Link>
        </Notice>
      ) : null}

      {warbands.isPending ? (
        <div className="flex justify-center py-10">
          <Spinner label="Loading warbands" />
        </div>
      ) : warbands.isError ? (
        <Notice tone="error" title="Could not load your warbands">
          {warbands.error.message}{' '}
          <button type="button" onClick={() => void warbands.refetch()} className="text-brass underline-offset-4 hover:underline">
            Try again
          </button>
        </Notice>
      ) : split && split.active.length === 0 && split.archived.length === 0 ? (
        <EmptyState />
      ) : split ? (
        <>
          {split.active.length > 0 ? (
            <WarbandRows warbands={split.active} />
          ) : (
            <p className="text-sm text-ink-dim">Every warband is archived.</p>
          )}

          {split.archived.length > 0 ? (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                aria-expanded={showArchived}
                onClick={() => setShowArchived((v) => !v)}
                className="inline-flex min-h-11 items-center self-start text-sm text-ink-dim hover:text-ink"
              >
                {showArchived ? 'Hide archived' : 'Show archived'} ({split.archived.length})
              </button>
              {showArchived ? <WarbandRows warbands={split.archived} /> : null}
            </div>
          ) : null}

          <PrimaryLink to="/warbands/new">New warband</PrimaryLink>
        </>
      ) : null}

      <p className="mt-auto pt-4 text-sm text-ink-dim">Campaigns, battles and the map arrive in Phase 5.</p>
    </>
  )
}

/** A router link dressed as the primary button (a button inside an anchor is not valid HTML). */
function PrimaryLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-base font-medium text-ink no-underline transition-colors hover:bg-accent-strong"
    >
      {children}
    </Link>
  )
}

function EmptyState() {
  return (
    <section className="flex flex-col gap-4 rounded-md border border-dashed border-border px-5 py-8 text-center">
      <p className="font-headline text-xl text-ink">No warbands yet</p>
      <p className="text-sm leading-relaxed text-ink-dim">
        Pick a warband type, spend your starting gold and the ledger keeps the roster from here on.
      </p>
      <PrimaryLink to="/warbands/new">Create your first warband</PrimaryLink>
    </section>
  )
}

function WarbandRows({ warbands }: { warbands: WarbandSummary[] }) {
  return (
    <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
      {warbands.map((w) => (
        <li key={w.id}>
          <Link to={`/warbands/${w.id}`} className="flex min-h-11 items-center justify-between gap-3 px-4 py-3 no-underline hover:bg-surface-high">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-2">
                <span className="truncate font-medium text-ink">{w.name}</span>
                {w.archived ? (
                  <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-ink-dim">Archived</span>
                ) : null}
              </span>
              <span className="truncate text-sm text-ink-dim">{warbandTypeName(w.type_rules_id)}</span>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5 font-mono text-sm tabular-nums">
              <span className="text-ink">{w.gold} gc</span>
              <span className="text-ink-dim">
                {w.wyrdstone} shards · {w.model_count} {w.model_count === 1 ? 'model' : 'models'}
              </span>
              <span className="text-ink-dim">
                {w.hero_count} {w.hero_count === 1 ? 'hero' : 'heroes'} · {w.model_count - w.hero_count} henchmen
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
