import { useState } from 'react'
import { Link } from 'react-router'
import { useMyCampaigns } from '../../api/campaigns'
import { useMyWarbands, type WarbandSummary } from '../../api/warbands'
import { useSession } from '../../app/session'
import { Icon, Notice, PageHeader, Spinner, type IconName } from '../../ui'
import { PrimaryLink } from '../onboarding/bits'
import { GettingStartedChecklist, JoinCampaignNudge } from '../onboarding/GettingStarted'
import { homeStage } from '../onboarding/checklist'
import { usePageTitle } from '../onboarding/usePageTitle'
import { useDraftStore } from './builder/draftStore'
import { groupByCampaign, splitArchived } from './builder/helpers'
import { warbandTypeName } from './shared/names'

/** Icon then value, the icon in its own fixed column so the values line up down the grid. */
function Figure({ icon, value, strong = false }: { icon: IconName; value: string; strong?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap ${strong ? 'text-ink' : 'text-ink-dim'}`}>
      <Icon name={icon} size={14} className="shrink-0 text-brass" />
      {value}
    </span>
  )
}

export function WarbandListPage() {
  usePageTitle('Your warbands')
  const user = useSession((s) => s.user)
  const warbands = useMyWarbands(user?.id)
  const campaigns = useMyCampaigns(user?.id)
  const draft = useDraftStore((s) => s.draft)
  const [showArchived, setShowArchived] = useState(false)

  const split = warbands.data ? splitArchived(warbands.data) : null
  // Archived warbands do not count: someone whose only warband is put away is back at the start.
  const stage = homeStage({
    warbands: split ? split.active.length : null,
    campaigns: campaigns.data ? campaigns.data.filter((c) => !c.archived).length : null,
  })

  return (
    <>
      <PageHeader
        eyebrow="Ledger"
        title="Your warbands"
        aside={
          <span className="flex items-center gap-1">
            <Link to="/warbands/import" className="inline-flex min-h-11 items-center px-2 text-sm text-brass underline-offset-4 hover:underline">
              Import
            </Link>
            <Link to="/warbands/new" className="inline-flex min-h-11 items-center px-2 text-sm text-brass underline-offset-4 hover:underline">
              New warband
            </Link>
          </span>
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
      ) : stage === 'new_user' && split ? (
        <>
          <GettingStartedChecklist />
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
        </>
      ) : split ? (
        <>
          {groupByCampaign(split.active).map((group) => (
            <div key={group.key} className="flex flex-col gap-2">
              {group.title ? (
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-xs uppercase tracking-[0.25em] text-ink-dim">{group.title}</h2>
                  {group.campaignId ? (
                    <Link to={`/campaigns/${group.campaignId}`} className="text-xs text-link underline-offset-4 hover:underline">
                      Open campaign
                    </Link>
                  ) : null}
                </div>
              ) : null}
              <WarbandRows warbands={group.warbands} />
            </div>
          ))}
          {stage === 'no_campaign' ? <JoinCampaignNudge /> : null}

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

    </>
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
            {/* A grid, not stacked rows: right-aligning lines of different widths left their icons in
                different places from one line to the next. */}
            <div className="grid shrink-0 grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-sm tabular-nums">
              <Figure icon="gold" value={`${w.gold} gc`} strong />
              <Figure icon="wyrdstone" value={`${w.wyrdstone} ${w.wyrdstone === 1 ? 'shard' : 'shards'}`} strong />
              <Figure icon="heroes" value={`${w.hero_count} ${w.hero_count === 1 ? 'hero' : 'heroes'}`} />
              <Figure icon="henchmen" value={`${w.model_count - w.hero_count} henchmen`} />
              <Figure icon="models" value={`${w.model_count} ${w.model_count === 1 ? 'model' : 'models'}`} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
