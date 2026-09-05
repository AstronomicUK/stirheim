import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useCampaign, useCampaignActivity, useLeaveCampaign, type CampaignDetail, type CampaignMemberView } from '../../api/campaigns'
import { useCampaignMatches } from '../../api/matches'
import { useSession } from '../../app/session'
import { describeHouseRules } from '../../rules/resolve/houseRules'
import { Button, Markdown, Notice, Sheet, Spinner } from '../../ui'
import { CampaignBattles } from '../match/shared/CampaignBattles'
import { GmChecklist } from '../onboarding/GmChecklist'
import { usePageTitle } from '../onboarding/usePageTitle'
import { activityLines, formatRelativeTime } from './activity'
import { Card, Disclosure, Section, Tag, TextLink } from './bits'
import { InviteCard } from './InviteCard'
import { usePendingAdvanceCounts } from '../../api/advances'
import { combatModeLabel, dicePolicyLabel } from './settingsForm'

export function CampaignPage() {
  const { id } = useParams<{ id: string }>()
  const query = useCampaign(id)
  usePageTitle(query.data?.campaign.name ?? 'Campaign')

  if (query.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner label="Loading the campaign" />
      </div>
    )
  }
  if (query.isError) {
    return (
      <>
        <Notice tone="error" title="Could not load this campaign">
          {query.error.message}
        </Notice>
        <TextLink to="/campaigns">Back to your campaigns</TextLink>
      </>
    )
  }
  return <CampaignView detail={query.data} />
}

function CampaignView({ detail }: { detail: CampaignDetail }) {
  const { campaign, settings, gm_display_name, members, former_members } = detail
  const navigate = useNavigate()
  const user = useSession((s) => s.user)
  const activity = useCampaignActivity(campaign.id)
  // Same query CampaignBattles runs, so this is a cache read; it only feeds the GM checklist.
  const matches = useCampaignMatches(campaign.id, user?.id)
  const leave = useLeaveCampaign()
  const [showFormer, setShowFormer] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [leaveWarbandId, setLeaveWarbandId] = useState<string | null>(null)
  const [leaveError, setLeaveError] = useState<string | null>(null)

  const isGm = user?.id === campaign.gm_id
  const mine = members.filter((m) => m.user_id === user?.id)
  const houseRuleLines = useMemo(() => describeHouseRules(settings.houseRules), [settings.houseRules])
  const lines = useMemo(() => (activity.data ? activityLines(activity.data) : []), [activity.data])

  const leaving = mine.find((m) => m.warband_id === leaveWarbandId) ?? (mine.length === 1 ? mine[0] : undefined)

  async function confirmLeave() {
    if (!leaving) return
    setLeaveError(null)
    try {
      await leave.mutateAsync({ campaignId: campaign.id, warbandId: leaving.warband_id })
      navigate('/campaigns', { replace: true })
    } catch (e) {
      setLeaveError(e instanceof Error ? e.message : 'Could not leave the campaign.')
    }
  }

  return (
    <>
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.25em] text-ink-dim">Campaign</p>
            <h1 className="font-headline text-3xl font-semibold leading-tight text-ink">{campaign.name}</h1>
          </div>
          {isGm ? (
            <div className="flex shrink-0 flex-col items-end pt-1">
              <TextLink to={`/campaigns/${campaign.id}/settings`}>Settings</TextLink>
              <TextLink to={`/campaigns/${campaign.id}/import`}>Import battle records</TextLink>
            </div>
          ) : null}
        </div>
        <p className="text-base leading-relaxed text-ink-dim">
          {isGm ? 'You run this campaign.' : `Run by ${gm_display_name}.`}
          {mine.length > 0 ? ` Playing as ${mine.map((m) => m.warband.name).join(', ')}.` : ''}
        </p>
      </header>

      {campaign.archived ? (
        <Notice tone="warn" title="Archived">
          This campaign has been put away. Rosters stay readable, nobody new can join, and battles are not scheduled.
          {isGm ? ' Unarchive it from Settings to carry on.' : ''}
        </Notice>
      ) : null}

      {isGm && !campaign.archived ? <GmChecklist key={campaign.id} campaignId={campaign.id} memberCount={members.length} matchCount={matches.data?.length ?? 0} /> : null}

      <InviteCard code={campaign.invite_code} archived={campaign.archived} campaignName={campaign.name} />

      <Section title="Warbands" aside={`${members.length} enrolled${settings.maxRosters ? ` of ${settings.maxRosters}` : ''}`}>
        {members.length === 0 ? (
          <Card className="px-4 py-4">
            <p className="text-sm leading-relaxed text-ink-dim">
              Nobody has enrolled yet. Share the invite code and the warbands appear here as players join.
            </p>
          </Card>
        ) : (
          <MemberRows members={members} userId={user?.id} gmId={campaign.gm_id} />
        )}
        {former_members.length > 0 ? (
          <div className="flex flex-col gap-3">
            <Disclosure open={showFormer} onToggle={() => setShowFormer((v) => !v)} label="former members" count={former_members.length} />
            {showFormer ? <MemberRows members={former_members} userId={user?.id} gmId={campaign.gm_id} former /> : null}
          </div>
        ) : null}
      </Section>

      <CampaignBattles campaignId={campaign.id} userId={user?.id} isGm={isGm} isMember={mine.length > 0} archived={campaign.archived} />

      <Section title="Settings and house rules">
        <Card className="flex flex-col gap-3 px-4 py-3">
          <dl className="grid grid-cols-2 gap-3">
            <Stat label="Starting gold" value={`${settings.startingGold} gc`} />
            <Stat label="Roster cap" value={settings.maxRosters === null ? 'None' : String(settings.maxRosters)} />
            <Stat label="Dice" value={dicePolicyLabel(settings.dicePolicy)} />
            <Stat label="Combat" value={`${combatModeLabel(settings.combatMode)}${settings.lockCombatMode ? ' (locked)' : ''}`} />
            <Stat label="Reports" value={settings.reportApproval ? 'GM approves' : 'Apply at once'} />
          </dl>
          <ul className="flex flex-col gap-1.5 border-t border-border pt-3 text-sm leading-relaxed text-ink-dim">
            {houseRuleLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section title="Campaign rules">
        <Card className="px-4 py-3">
          {campaign.rules_markdown.trim() ? (
            <Markdown source={campaign.rules_markdown} />
          ) : (
            <p className="text-sm text-ink-dim">{isGm ? 'Nothing written yet. Add schedule notes or extra house rules from Settings.' : 'The GM has not written any campaign rules yet.'}</p>
          )}
        </Card>
      </Section>

      <Section title="Recent activity">
        {activity.isPending ? (
          <div className="flex justify-center py-4">
            <Spinner label="Loading activity" />
          </div>
        ) : activity.isError ? (
          <Notice tone="error">{activity.error.message}</Notice>
        ) : lines.length === 0 ? (
          <p className="text-sm text-ink-dim">Nothing has happened yet.</p>
        ) : (
          <ol className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
            {lines.map((line) => (
              <li key={line.id} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                <span className="text-sm leading-relaxed text-ink">{line.text}</span>
                <time dateTime={line.at} className="shrink-0 text-xs text-ink-dim">
                  {formatRelativeTime(line.at)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </Section>

      {mine.length > 0 ? (
        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="danger"
            block
            onClick={() => {
              setLeaveError(null)
              setLeaveWarbandId(mine.length === 1 ? mine[0].warband_id : null)
              setLeaveOpen(true)
            }}
          >
            Leave campaign
          </Button>
        </div>
      ) : null}

      <Sheet
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Leave this campaign?"
        description="Your warband keeps its roster and history; it just stops taking part. You can rejoin with the invite code."
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setLeaveOpen(false)} disabled={leave.isPending}>
              Stay
            </Button>
            <Button variant="danger" className="flex-1" disabled={!leaving} pending={leave.isPending} onClick={confirmLeave}>
              Leave
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3 py-2">
          {mine.length > 1 ? (
            <ul role="radiogroup" aria-label="Warband to withdraw" className="flex flex-col divide-y divide-border rounded-md border border-border">
              {mine.map((m) => {
                const on = leaveWarbandId === m.warband_id
                return (
                  <li key={m.warband_id}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setLeaveWarbandId(m.warband_id)}
                      className={`flex min-h-11 w-full items-center px-4 py-2 text-left ${on ? 'bg-surface-high text-brass' : 'text-ink hover:bg-surface-high'}`}
                    >
                      {m.warband.name}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : leaving ? (
            <p className="text-sm text-ink">{leaving.warband.name}</p>
          ) : null}
          {leaveError ? <Notice tone="error">{leaveError}</Notice> : null}
        </div>
      </Sheet>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-[10px] uppercase tracking-wider text-ink-dim">{label}</dt>
      <dd className="truncate font-mono text-sm tabular-nums text-ink">{value}</dd>
    </div>
  )
}

function MemberRows({ members, userId, gmId, former = false }: { members: CampaignMemberView[]; userId: string | undefined; gmId: string; former?: boolean }) {
  const counts = usePendingAdvanceCounts(former ? [] : members.map((m) => m.warband_id))
  return (
    <ul className={`flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low ${former ? 'opacity-70' : ''}`}>
      {members.map((m) => (
        <li key={`${m.warband_id}-${m.left_at ?? 'active'}`}>
          <Link to={`/warbands/${m.warband_id}`} className="flex min-h-11 items-center justify-between gap-3 px-4 py-3 no-underline hover:bg-surface-high">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-2">
                <span className="truncate font-medium text-ink">{m.warband.name}</span>
                {m.user_id === userId ? <Tag tone="brass">You</Tag> : null}
                {m.warband.archived ? <Tag>Archived</Tag> : null}
                {(counts.data?.[m.warband_id] ?? 0) > 0 ? <Tag tone="warn">{counts.data![m.warband_id]} {counts.data![m.warband_id] === 1 ? 'advance' : 'advances'} due</Tag> : null}
              </span>
              <span className="truncate text-sm text-ink-dim">
                {m.display_name}
                {m.user_id === gmId ? ' (GM)' : ''} · {m.warband.type_name}
              </span>
              {former && m.left_at ? <span className="text-xs text-ink-dim">Left {formatRelativeTime(m.left_at)}</span> : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5 font-mono text-sm tabular-nums">
              <span className="text-ink">Rating {m.warband.rating}</span>
              <span className="text-ink-dim">
                {m.warband.gold} gc · {m.warband.wyrdstone} shards
              </span>
              <span className="text-ink-dim">
                {m.warband.model_count} {m.warband.model_count === 1 ? 'model' : 'models'}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
