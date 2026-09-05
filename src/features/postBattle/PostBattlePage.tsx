// The post-battle report wizard for one warband in one match (/matches/:id/report/:warbandId).
// Seven steps: outcome, casualties, injuries, experience, exploration, veterans & notes, review.
// The draft lives in localStorage until the report is filed, so the table can finish later.

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useCampaign } from '../../api/campaigns'
import { useBattleEvents, useBattleSessions, useMatch, useMatchRoster, type MatchParticipantView, type MatchSummary } from '../../api/matches'
import { applyBattleEvents, emptyBattleLiveState } from '../../domain'
import { advanceKeys } from '../../api/advances'
import { useSubmitBattleReport } from '../../api/reports'
import { warbandKeys } from '../../api/warbands'
import { applyWizardAdvances } from './applyAdvances'
import { useSession } from '../../app/session'
import type { BattleLiveState } from '../../domain'
import { findWarbandTemplate } from '../../rules/data/warbandTemplates'
import { Button, Notice, Sheet, Spinner } from '../../ui'
import { buildReport, deriveReport, seedFromBattleSheet, setStep, STEP_IDS, type ReportContext, type ReportDraft } from './model'
import { forgetReportStore, reportStore, useReportStore } from './store'
import { CasualtiesStep } from './wizard/CasualtiesStep'
import { ExperienceStep } from './wizard/ExperienceStep'
import { AdvancesStep } from './wizard/AdvancesStep'
import { ExplorationStep } from './wizard/ExplorationStep'
import { InjuriesStep } from './wizard/InjuriesStep'
import { OutcomeStep } from './wizard/OutcomeStep'
import { ReviewStep } from './wizard/ReviewStep'
import { VeteransStep } from './wizard/VeteransStep'
import { StepIndicator, WizardBar } from './wizard/WizardShell'
import type { CampaignHouseRules } from '../../rules/types/roster'
import { applyHouseRuleDefaults } from '../../rules/resolve/houseRules'

function BackToMatch({ matchId }: { matchId: string | undefined }) {
  return (
    <Link to={matchId ? `/matches/${matchId}` : '/campaigns'} className="text-brass underline-offset-4 hover:underline">
      Back to the match
    </Link>
  )
}

export function PostBattlePage() {
  const { id, warbandId } = useParams<{ id: string; warbandId: string }>()
  const [search] = useSearchParams()
  const amending = search.get('amend') === '1'
  const user = useSession((s) => s.user)
  const match = useMatch(id, user?.id)
  const sessions = useBattleSessions(id)
  const events = useBattleEvents(id)

  // The wizard seeds itself once from the sheet with the shared log laid over it, so the log must be
  // in hand before rendering (on a slow connection it used to arrive a beat late and be missed).
  if (match.isPending || sessions.isPending || events.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner label="Loading the match" />
      </div>
    )
  }
  if (match.isError || sessions.isError) {
    return (
      <>
        <Notice tone="error" title="Could not load this match">
          {match.error?.message ?? sessions.error?.message}
        </Notice>
        <BackToMatch matchId={id} />
      </>
    )
  }

  const summary = match.data
  const participant = summary.participants.find((p) => p.warband_id === warbandId)
  if (summary.state !== 'in_progress' && summary.state !== 'awaiting_reports') {
    return (
      <>
        <Notice tone="info" title="No report to file">
          {summary.state === 'scheduled' ? 'This battle has not been fought yet.' : summary.state === 'completed' ? 'This match is complete and every report is in.' : 'This match was cancelled.'}
        </Notice>
        <BackToMatch matchId={summary.id} />
      </>
    )
  }
  if (!participant) {
    return (
      <>
        <Notice tone="error" title="Not in this match">
          That warband did not take part in this battle.
        </Notice>
        <BackToMatch matchId={summary.id} />
      </>
    )
  }
  const filed = summary.reported_warband_ids.includes(participant.warband_id) || summary.pending_report_warband_ids.includes(participant.warband_id)
  if (filed && !amending) {
    return (
      <>
        <Notice tone="info" title="Already filed">
          A report for {participant.warband_name} is already in. The GM can amend it or withdraw it from the match page if something needs correcting.
        </Notice>
        <BackToMatch matchId={summary.id} />
      </>
    )
  }
  const rawLive = sessions.data.find((s) => s.warband_id === participant.warband_id)?.live_state
  const logged = (events.data ?? []).filter((e) => e.reverted_at === null)
  const liveState = rawLive || logged.length > 0 ? applyBattleEvents(rawLive ?? emptyBattleLiveState(), logged, participant.warband_id) : undefined
  return <Guarded match={summary} participant={participant} userId={user?.id} amending={amending && filed} liveState={liveState} />
}

interface GuardedProps {
  match: MatchSummary
  participant: MatchParticipantView
  userId: string | undefined
  /** The GM is replacing a filed report. */
  amending: boolean
  liveState: BattleLiveState | undefined
}

/** Owner or GM only: the roster query must succeed and the viewer must be allowed to edit the warband. */
function Guarded({ match, participant, userId, liveState, amending }: GuardedProps) {
  const campaign = useCampaign(match.campaign_id)
  const roster = useMatchRoster(match.id, participant.warband_id)
  const isGm = campaign.data?.campaign.gm_id === userId
  const allowed = participant.mine || isGm

  if (campaign.isPending || roster.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner label="Loading the warband" />
      </div>
    )
  }
  if (roster.isError) {
    return (
      <>
        <Notice tone="error" title="Could not load the warband">
          {roster.error.message}
        </Notice>
        <BackToMatch matchId={match.id} />
      </>
    )
  }
  if (!allowed) {
    return (
      <>
        <Notice tone="info" title="Not your report to file">
          Only {participant.owner_display_name} or the GM can file the report for {participant.warband_name}.
        </Notice>
        <BackToMatch matchId={match.id} />
      </>
    )
  }
  return <Wizard match={match} participant={participant} rosterData={roster.data} liveState={liveState} amending={amending} houseRules={applyHouseRuleDefaults(campaign.data?.settings.houseRules)} />
}

interface WizardProps {
  match: MatchSummary
  participant: MatchParticipantView
  rosterData: NonNullable<ReturnType<typeof useMatchRoster>['data']>
  liveState: BattleLiveState | undefined
  amending: boolean
  houseRules: CampaignHouseRules
}

function Wizard({ match, participant, rosterData, liveState, amending, houseRules }: WizardProps) {
  const navigate = useNavigate()
  const store = useMemo(() => reportStore(match.id, participant.warband_id), [match.id, participant.warband_id])
  const draft = useReportStore(store, (s) => s.draft)
  const savedAt = useReportStore(store, (s) => s.savedAt)
  const update = useReportStore(store, (s) => s.update)
  const seed = useReportStore(store, (s) => s.seed)

  // Once the report is filed or discarded the draft goes away; do not seed a fresh one while leaving.
  const closing = useRef(false)
  useEffect(() => {
    if (!draft && !closing.current) seed(seedFromBattleSheet(rosterData.roster, liveState))
  }, [draft, seed, rosterData.roster, liveState])

  const opponents = useMemo(() => match.participants.filter((p) => p.warband_id !== participant.warband_id), [match.participants, participant.warband_id])
  const ctx = useMemo<ReportContext>(
    () => ({
      roster: rosterData.roster,
      template: findWarbandTemplate(rosterData.roster.warbandTemplateId),
      items: rosterData.items,
      matchId: match.id,
      myRating: participant.rating,
      opponentRating: opponents.reduce<number | null>((best, o) => (best === null || o.rating > best ? o.rating : best), null),
      houseRules,
      preBattle: liveState?.preBattle ?? {},
    }),
    [rosterData, match.id, participant.rating, opponents, houseRules, liveState],
  )

  const derived = useMemo(() => (draft ? deriveReport(draft, ctx) : null), [draft, ctx])

  const submit = useSubmitBattleReport(match.id, participant.warband_id)
  const qc = useQueryClient()
  const [amendNote, setAmendNote] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)
  const [discardOpen, setDiscardOpen] = useState(false)

  if (!draft || !derived) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner label="Preparing the report" />
      </div>
    )
  }

  const step = Math.min(draft.step, STEP_IDS.length - 1)
  const stepId = STEP_IDS[step]
  const problems = derived.problems[stepId]
  const reachable = derived.firstIncompleteStep ?? STEP_IDS.length - 1
  const go = (next: number) => {
    update((d) => setStep(d, next))
    window.scrollTo({ top: 0 })
  }

  async function file() {
    setFileError(null)
    try {
      const report = buildReport(draft as ReportDraft, ctx)
      if (amending && amendNote.trim() === '') throw new Error('Say why the report is being amended; the note goes in the change log.')
      await submit.mutateAsync({ report, amendNote: amending ? amendNote.trim() : undefined })
      closing.current = true
      // The report is in. Now the advances rolled in the wizard, one at a time; anything that fails
      // stays pending on the Bestow advancements screen.
      const outcome = await applyWizardAdvances(participant.warband_id, derived?.advances.items ?? [], ctx.template)
      await Promise.all([qc.invalidateQueries({ queryKey: advanceKeys.all }), qc.invalidateQueries({ queryKey: warbandKeys.all })])
      forgetReportStore(match.id, participant.warband_id)
      navigate(`/matches/${match.id}`, { replace: true, state: outcome.failed.length > 0 ? { advancesFailed: outcome.failed } : undefined })
    } catch (e) {
      setFileError(e instanceof Error ? e.message : 'The report could not be filed.')
    }
  }

  function discard() {
    closing.current = true
    forgetReportStore(match.id, participant.warband_id)
    navigate(`/matches/${match.id}`, { replace: true })
  }

  const stepProps = { draft, derived, ctx, update, match, mine: participant, opponents, amend: amending ? { note: amendNote, onNote: setAmendNote } : undefined }

  return (
    <>
      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.25em] text-ink-dim">{amending ? 'Amending the filed report' : 'Post-battle report'}</p>
        <h1 className="font-headline text-3xl leading-tight text-ink">{participant.warband_name}</h1>
        {savedAt ? <p className="text-xs text-ink-dim">Draft saved on this phone. Nothing is applied until you file.</p> : null}
      </header>

      <StepIndicator step={step} reachable={reachable} onJump={go} />

      {stepId === 'outcome' ? <OutcomeStep {...stepProps} /> : null}
      {stepId === 'casualties' ? <CasualtiesStep {...stepProps} /> : null}
      {stepId === 'injuries' ? <InjuriesStep {...stepProps} /> : null}
      {stepId === 'experience' ? <ExperienceStep {...stepProps} /> : null}
      {stepId === 'advances' ? <AdvancesStep {...stepProps} /> : null}
      {stepId === 'exploration' ? <ExplorationStep {...stepProps} /> : null}
      {stepId === 'veterans' ? <VeteransStep {...stepProps} /> : null}
      {stepId === 'review' ? <ReviewStep {...stepProps} /> : null}

      <WizardBar
        step={step}
        problems={stepId === 'review' ? STEP_IDS.flatMap((s) => derived.problems[s]) : problems}
        onBack={() => go(step - 1)}
        onNext={() => go(step + 1)}
        onFile={stepId === 'review' ? () => void file() : undefined}
        filing={submit.isPending}
        fileError={fileError}
        onContinueLater={() => navigate(`/matches/${match.id}`)}
        onDiscard={() => setDiscardOpen(true)}
      />

      <Sheet
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Discard this draft?"
        description="Every roll and note entered here is thrown away. The battle sheet is untouched, so you can start again."
        footer={
          <div className="flex flex-col gap-2">
            <Button variant="danger" block onClick={discard}>
              Discard the draft
            </Button>
            <Button variant="ghost" block onClick={() => setDiscardOpen(false)}>
              Keep it
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-dim">Nothing has been applied to the roster.</p>
      </Sheet>
    </>
  )
}
