// One match: who is playing, what scenario, when, and the actions its state allows. Kept live
// through useMatchRealtime so acceptances, the start of the battle and the other table's tallies
// appear without a refresh.

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useCampaign } from '../../api/campaigns'
import {
  useBattleSessions,
  useCancelMatch,
  useEndMatch,
  useMatch,
  useMatchRealtime,
  useRespondToChallenge,
  useStartMatch,
  type BattleSessionView,
  type MatchSummary,
} from '../../api/matches'
import { reportKeys, useMatchReports, useWithdrawBattleReport, type ReportView } from '../../api/reports'
import { useSession } from '../../app/session'
import { battleTotals } from '../../domain'
import { Button, Notice, PageHeader, Sheet, Spinner } from '../../ui'
import { formatRelativeTime } from '../campaign/activity'
import { Card, KeyValue, LinkButton, Section, Tag, TextLink } from '../campaign/bits'
import { MatchStateTag, ParticipantCard } from './shared/bits'
import { formatMatchTime, matchActions, pendingLabel, scenarioLink, scenarioTitle, versusLabel } from './shared/helpers'
import { ReportCard } from './shared/ReportCard'

export function MatchPage() {
  const { id } = useParams<{ id: string }>()
  const user = useSession((s) => s.user)
  const query = useMatch(id, user?.id)
  useMatchRealtime(id)

  if (query.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner label="Loading the battle" />
      </div>
    )
  }
  if (query.isError) {
    return (
      <>
        <PageHeader eyebrow="Battle" title="Battle not found" description="This match does not exist, or you are not in its campaign." />
        <TextLink to="/campaigns">Back to your campaigns</TextLink>
      </>
    )
  }
  return <MatchView match={query.data} userId={user?.id} />
}

function MatchView({ match, userId }: { match: MatchSummary; userId: string | undefined }) {
  const navigate = useNavigate()
  const campaign = useCampaign(match.campaign_id)
  const gmId = campaign.data?.campaign.gm_id
  const showTallies = match.state === 'in_progress' || match.state === 'awaiting_reports'
  const sessions = useBattleSessions(showTallies ? match.id : undefined)

  const isGm = Boolean(userId) && userId === gmId
  const showReports = match.state === 'awaiting_reports' || match.state === 'completed'
  const reports = useMatchReports(showReports ? match.id : undefined)

  // The match row (kept live by Realtime) tells us which warbands have reported; when that set
  // changes, the reports list is stale too, so refetch it. Skipped on first render.
  const qc = useQueryClient()
  const reportedKey = match.reported_warband_ids.join(',')
  const lastReportedKey = useRef(reportedKey)
  useEffect(() => {
    if (lastReportedKey.current === reportedKey) return
    lastReportedKey.current = reportedKey
    if (showReports) void qc.invalidateQueries({ queryKey: reportKeys.forMatch(match.id) })
  }, [qc, match.id, reportedKey, showReports])

  const respond = useRespondToChallenge()
  const start = useStartMatch()
  const end = useEndMatch()
  const cancel = useCancelMatch()
  const withdraw = useWithdrawBattleReport()

  const [confirm, setConfirm] = useState<'end' | 'cancel' | null>(null)
  const [withdrawing, setWithdrawing] = useState<ReportView | null>(null)
  const [error, setError] = useState<string | null>(null)

  const actions = matchActions(match, userId, gmId)
  const busy = respond.isPending || start.isPending || end.isPending || cancel.isPending || withdraw.isPending
  const link = scenarioLink(match)
  const pending = match.state === 'scheduled' ? pendingLabel(match.participants) : null

  // Warbands still to report that this user may file for: their own, or any if they run the campaign.
  const toFile = match.state === 'awaiting_reports' ? match.participants.filter((p) => !match.reported_warband_ids.includes(p.warband_id) && (p.mine || isGm)) : []
  const unreported = match.participants.filter((p) => !match.reported_warband_ids.includes(p.warband_id)).length

  async function run(task: () => Promise<unknown>, fallback: string) {
    setError(null)
    try {
      await task()
      setConfirm(null)
      setWithdrawing(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : fallback)
    }
  }

  const sessionFor = (warbandId: string): BattleSessionView | undefined => sessions.data?.find((s) => s.warband_id === warbandId)
  const reportFor = (warbandId: string): ReportView | undefined => reports.data?.find((r) => r.warband_id === warbandId)

  return (
    <>
      <PageHeader
        eyebrow={campaign.data ? campaign.data.campaign.name : 'Battle'}
        title={scenarioTitle(match)}
        description={versusLabel(match.participants)}
        aside={<TextLink to={`/campaigns/${match.campaign_id}`}>Campaign</TextLink>}
      />

      <Card className="flex flex-col gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <MatchStateTag state={match.state} />
          {pending ? <Tag tone="warn">{pending}</Tag> : null}
          <span className="text-sm text-ink-dim">
            {match.created_via === 'gm' ? 'Scheduled by' : match.created_via === 'import' ? 'Imported by' : 'Challenge from'} {match.created_by_display_name}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3">
          <KeyValue label="Booked for" value={match.scheduled_for ? formatMatchTime(match.scheduled_for) : 'No date yet'} />
          {match.started_at ? <KeyValue label="Started" value={formatMatchTime(match.started_at)} /> : null}
          {match.completed_at ? <KeyValue label={match.state === 'cancelled' ? 'Cancelled' : 'Ended'} value={formatMatchTime(match.completed_at)} /> : null}
        </dl>
        {link ? <TextLink to={link}>Read the scenario</TextLink> : <p className="text-sm text-ink-dim">Roll on the scenario table or agree one when you sit down.</p>}
        {match.notes.trim() ? <p className="whitespace-pre-wrap border-t border-border pt-3 text-sm leading-relaxed text-ink">{match.notes}</p> : null}
      </Card>

      {error ? <Notice tone="error">{error}</Notice> : null}

      {match.state === 'scheduled' ? (
        <div className="flex flex-col gap-3">
          {actions.showStart ? (
            <>
              <Button block disabled={!actions.canStart} pending={start.isPending} onClick={() => void run(() => start.mutateAsync(match.id), 'Could not start the battle.')}>
                Start battle
              </Button>
              {actions.startBlocked ? <p className="text-center text-sm text-ink-dim">{actions.startBlocked}</p> : null}
            </>
          ) : null}
        </div>
      ) : null}

      {match.state === 'in_progress' ? (
        <div className="flex flex-col gap-3">
          {actions.canOpenSheet ? (
            <LinkButton to={`/matches/${match.id}/battle`}>Open battle sheet</LinkButton>
          ) : (
            <Card className="px-4 py-3">
              <p className="text-sm leading-relaxed text-ink-dim">The battle is under way. The players' tallies below update as they keep their sheets.</p>
            </Card>
          )}
          {actions.canEnd ? (
            <Button variant="secondary" block disabled={busy} onClick={() => setConfirm('end')}>
              Battle over
            </Button>
          ) : null}
        </div>
      ) : null}

      {match.state === 'awaiting_reports' ? (
        <div className="flex flex-col gap-3">
          {toFile.map((p) => (
            <LinkButton key={p.warband_id} to={`/matches/${match.id}/report/${p.warband_id}`}>
              {toFile.length > 1 || !p.mine ? `File post-battle report: ${p.warband_name}` : 'File post-battle report'}
            </LinkButton>
          ))}
          <Notice tone="info" title={toFile.length > 0 ? 'Reports are next' : unreported > 0 ? `Waiting on ${unreported} ${unreported === 1 ? 'report' : 'reports'}` : 'Reports are in'}>
            The battle is over. Each player files a post-battle report for their warband: experience, injuries, exploration and the rest. The match completes once every report is in.
          </Notice>
        </div>
      ) : null}

      <Section title="Warbands" aside={`${match.participants.length}`}>
        {match.participants.length === 0 ? (
          <Card className="px-4 py-4">
            <p className="text-sm text-ink-dim">Every warband has dropped out of this match.</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {match.participants.map((p) => {
              const answering = actions.respondFor.includes(p.warband_id)
              const reported = match.reported_warband_ids.includes(p.warband_id)
              return (
                <ParticipantCard key={p.warband_id} participant={p} showAcceptance={match.state === 'scheduled'}>
                  {answering ? (
                    <div className="flex gap-2 border-t border-border pt-2">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        pending={respond.isPending}
                        onClick={() => void run(() => respond.mutateAsync({ matchId: match.id, warbandId: p.warband_id, accept: false }), 'Could not decline.')}
                      >
                        Decline
                      </Button>
                      <Button className="flex-1" pending={respond.isPending} onClick={() => void run(() => respond.mutateAsync({ matchId: match.id, warbandId: p.warband_id, accept: true }), 'Could not accept.')}>
                        Accept
                      </Button>
                    </div>
                  ) : null}
                  {showTallies ? <Tallies session={sessionFor(p.warband_id)} loading={sessions.isPending} /> : null}
                  {showReports ? <ReportStatus reported={reported} report={reportFor(p.warband_id)} canFile={toFile.some((f) => f.warband_id === p.warband_id)} to={`/matches/${match.id}/report/${p.warband_id}`} /> : null}
                </ParticipantCard>
              )
            })}
          </ul>
        )}
      </Section>

      {showReports ? (
        <Section title="Reports" aside={reports.data ? `${reports.data.length} of ${match.participants.length}` : undefined}>
          {reports.isPending ? (
            <div className="flex justify-center py-4">
              <Spinner label="Loading the reports" />
            </div>
          ) : reports.isError ? (
            <Notice tone="error" title="Could not load the reports">
              {reports.error.message}{' '}
              <button type="button" onClick={() => void reports.refetch()} className="text-brass underline-offset-4 hover:underline">
                Try again
              </button>
            </Notice>
          ) : reports.data.length === 0 ? (
            <Card className="px-4 py-4">
              <p className="text-sm text-ink-dim">No reports filed yet.</p>
            </Card>
          ) : (
            <ul className="flex flex-col gap-2">
              {reports.data.map((r) => (
                <ReportCard key={r.id} report={r} onWithdraw={isGm ? setWithdrawing : undefined} />
              ))}
            </ul>
          )}
        </Section>
      ) : null}

      {match.state === 'cancelled' ? (
        <Notice tone="warn" title="Cancelled">
          This battle was called off{match.completed_at ? ` ${formatRelativeTime(match.completed_at)}` : ''}. Nothing from it counts towards the campaign.
        </Notice>
      ) : null}
      {match.state === 'completed' ? (
        <Notice tone="success" title="Finished">
          Every report is in and the rosters have moved on.
        </Notice>
      ) : null}

      {actions.canCancel ? (
        <div className="pt-2">
          <Button variant="danger" block disabled={busy} onClick={() => setConfirm('cancel')}>
            Cancel battle
          </Button>
        </div>
      ) : null}

      <Sheet
        open={confirm === 'end'}
        onClose={() => setConfirm(null)}
        title="Battle over?"
        description="Everyone at the table should agree first. The sheets are frozen and each player files a post-battle report next."
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirm(null)} disabled={end.isPending}>
              Keep playing
            </Button>
            <Button className="flex-1" pending={end.isPending} onClick={() => void run(() => end.mutateAsync(match.id), 'Could not end the battle.')}>
              Battle over
            </Button>
          </div>
        }
      >
        <p className="py-2 text-sm text-ink-dim">{versusLabel(match.participants)}</p>
      </Sheet>

      <Sheet
        open={confirm === 'cancel'}
        onClose={() => setConfirm(null)}
        title="Cancel this battle?"
        description={
          match.state === 'scheduled'
            ? 'The booking is dropped. Nobody gains or loses anything; you can book another any time.'
            : 'The game is struck from the campaign: no reports, no experience, no injuries. Use this for a game that was abandoned, not one that finished.'
        }
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirm(null)} disabled={cancel.isPending}>
              Keep it
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              pending={cancel.isPending}
              onClick={() =>
                void run(async () => {
                  await cancel.mutateAsync(match.id)
                  navigate(`/campaigns/${match.campaign_id}`, { replace: true })
                }, 'Could not cancel the battle.')
              }
            >
              Cancel battle
            </Button>
          </div>
        }
      >
        <p className="py-2 text-sm text-ink-dim">{versusLabel(match.participants)}</p>
      </Sheet>

      <Sheet
        open={withdrawing !== null}
        onClose={() => setWithdrawing(null)}
        title="Withdraw this report?"
        description={withdrawing ? `${withdrawing.warband_name}'s report is struck and the match goes back to awaiting reports, so ${withdrawing.submitted_by_display_name} can file again.` : undefined}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setWithdrawing(null)} disabled={withdraw.isPending}>
              Keep it
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              pending={withdraw.isPending}
              onClick={() => {
                if (!withdrawing) return
                const warbandId = withdrawing.warband_id
                void run(() => withdraw.mutateAsync({ matchId: match.id, warbandId }), 'Could not withdraw the report.')
              }}
            >
              Withdraw report
            </Button>
          </div>
        }
      >
        <Notice tone="warn" title="Roster changes are not undone">
          Filing the report already moved the roster on: experience, injuries, deaths, gold and wyrdstone were applied. Withdrawing removes the record only. Put the roster right by hand before the report is filed again, or the changes will be applied twice.
        </Notice>
      </Sheet>
    </>
  )
}

/** Under a participant once the battle is over: who filed the report and when, or the way to file it. */
function ReportStatus({ reported, report, canFile, to }: { reported: boolean; report: ReportView | undefined; canFile: boolean; to: string }) {
  if (reported) {
    return (
      <div className="flex items-center justify-between gap-3 border-t border-border pt-2 text-sm">
        <span className="min-w-0 truncate text-ink-dim">{report ? `Report filed by ${report.submitted_by_display_name} · ${formatRelativeTime(report.submitted_at)}` : 'Report filed'}</span>
        <Tag tone="brass">Filed</Tag>
      </div>
    )
  }
  if (canFile) {
    return (
      <div className="border-t border-border pt-2">
        <LinkButton to={to} variant="secondary">
          File post-battle report
        </LinkButton>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-2 text-sm">
      <span className="text-ink-dim">Post-battle report</span>
      <Tag tone="warn">Not yet filed</Tag>
    </div>
  )
}

/** The live tallies from one warband's battle sheet, or a note that none has been opened. */
function Tallies({ session, loading }: { session: BattleSessionView | undefined; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex justify-center border-t border-border py-2">
        <Spinner size="sm" label="Loading the sheet" />
      </div>
    )
  }
  if (!session) {
    return <p className="border-t border-border pt-2 text-sm text-ink-dim">No battle sheet opened yet.</p>
  }
  const totals = battleTotals(session.live_state)
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-2">
      <dl className="grid grid-cols-4 gap-2">
        <KeyValue label="Turn" value={session.live_state.turn} />
        <KeyValue label="Enemies OOA" value={totals.enemiesOutOfAction} />
        <KeyValue label="Own OOA" value={totals.ownOutOfAction} />
        <KeyValue label="Wyrdstone" value={session.live_state.wyrdstoneFound} />
      </dl>
      <div className="flex items-center justify-between gap-3 text-xs text-ink-dim">
        <span>{session.live_state.routed ? <Tag tone="warn">Routed</Tag> : 'Still fighting'}</span>
        <span>Updated {formatRelativeTime(session.updated_at)}</span>
      </div>
    </div>
  )
}
