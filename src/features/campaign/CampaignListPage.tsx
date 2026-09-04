import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useMyCampaigns, type CampaignSummary } from '../../api/campaigns'
import { useMyWarbands } from '../../api/warbands'
import { useSession } from '../../app/session'
import { Notice, PageHeader, Spinner } from '../../ui'
import { Disclosure, LinkButton, Tag, TextLink } from './bits'

export function CampaignListPage() {
  const user = useSession((s) => s.user)
  const campaigns = useMyCampaigns(user?.id)
  const warbands = useMyWarbands(user?.id)
  const [showArchived, setShowArchived] = useState(false)

  const warbandNames = useMemo(() => new Map((warbands.data ?? []).map((w) => [w.id, w.name])), [warbands.data])
  const active = campaigns.data?.filter((c) => !c.archived) ?? []
  const archived = campaigns.data?.filter((c) => c.archived) ?? []

  return (
    <>
      <PageHeader eyebrow="Ledger" title="Your campaigns" aside={<TextLink to="/campaigns/new">New campaign</TextLink>} />

      {campaigns.isPending ? (
        <div className="flex justify-center py-10">
          <Spinner label="Loading campaigns" />
        </div>
      ) : campaigns.isError ? (
        <Notice tone="error" title="Could not load your campaigns">
          {campaigns.error.message}{' '}
          <button type="button" onClick={() => void campaigns.refetch()} className="text-brass underline-offset-4 hover:underline">
            Try again
          </button>
        </Notice>
      ) : active.length === 0 && archived.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {active.length > 0 ? <CampaignRows campaigns={active} warbandNames={warbandNames} /> : <p className="text-sm text-ink-dim">Every campaign is archived.</p>}

          {archived.length > 0 ? (
            <div className="flex flex-col gap-3">
              <Disclosure open={showArchived} onToggle={() => setShowArchived((v) => !v)} label="archived" count={archived.length} />
              {showArchived ? <CampaignRows campaigns={archived} warbandNames={warbandNames} /> : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            <LinkButton to="/campaigns/new">New campaign</LinkButton>
            <LinkButton to="/campaigns/join" variant="secondary">
              Join with a code
            </LinkButton>
          </div>
        </>
      )}
    </>
  )
}

function EmptyState() {
  return (
    <section className="flex flex-col gap-4 rounded-md border border-dashed border-border px-5 py-8 text-center">
      <p className="font-headline text-xl text-ink">No campaigns yet</p>
      <p className="text-sm leading-relaxed text-ink-dim">
        Start a campaign to run it as GM: you set the house rules and starting gold, and hand out an invite code. Or join a friend's campaign with the code they
        sent you and one of your warbands.
      </p>
      <LinkButton to="/campaigns/new">Start a campaign</LinkButton>
      <LinkButton to="/campaigns/join" variant="secondary">
        Join with a code
      </LinkButton>
    </section>
  )
}

function CampaignRows({ campaigns, warbandNames }: { campaigns: CampaignSummary[]; warbandNames: Map<string, string> }) {
  return (
    <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
      {campaigns.map((c) => {
        const mine = c.my_warband_ids.map((id) => warbandNames.get(id)).filter((n): n is string => Boolean(n))
        return (
          <li key={c.id}>
            <Link to={`/campaigns/${c.id}`} className="flex min-h-11 items-center justify-between gap-3 px-4 py-3 no-underline hover:bg-surface-high">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="flex items-center gap-2">
                  <span className="truncate font-medium text-ink">{c.name}</span>
                  {c.archived ? <Tag>Archived</Tag> : null}
                  {c.is_gm ? <Tag tone="brass">GM</Tag> : null}
                </span>
                <span className="truncate text-sm text-ink-dim">{c.is_gm ? 'You run this' : `Run by ${c.gm_display_name}`}</span>
                {mine.length > 0 ? <span className="truncate text-sm text-ink-dim">Playing as {mine.join(', ')}</span> : null}
              </div>
              <span className="shrink-0 font-mono text-sm tabular-nums text-ink-dim">
                {c.member_count} {c.member_count === 1 ? 'warband' : 'warbands'}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
