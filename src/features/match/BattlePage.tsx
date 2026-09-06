// The one screen a player keeps open on their phone during the game: their own tally sheet, the
// enemy rosters and live tallies, loot and notes. Saves itself; every phone at the table is kept
// in step by Realtime.

import { useMemo, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { usePendingAdvances } from '../../api/advances'
import { useCampaign } from '../../api/campaigns'
import { useBattleBoosts } from './battle/useBattleBoosts'
import { NO_BOOSTS, type BattleBoosts } from './fight/combatants'
import { defaultCampaignHouseRules, type CampaignHouseRules } from '../../rules/types/roster'
import { useBattleEvents, useBattlePrompts, useBattleSessions, useEndMatch, useLogBattleEvent, useMatch, useMatchRealtime, useMatchRoster, type BattleSessionView, type MatchSummary } from '../../api/matches'
import { applyBattleEvents, battleTotals, emptyBattleLiveState, routThreshold, type AttackEventPayload, type BattleEventRow } from '../../domain'
import { useSession } from '../../app/session'
import { findScenario } from '../../rules/data/campaign/scenarios'
import { findWarbandTemplate } from '../../rules/data/warbandTemplates'
import type { RosterWarband } from '../../rules/types/roster'
import { Button, Notice, Sheet, Spinner, useIsDesktop } from '../../ui'
import { EnemyView } from './battle/EnemyView'
import { FightTab } from './fight/FightTab'
import { BattleNav, type BattleTab } from './battle/BattleNav'
import { useEnemyRosters } from './fight/useEnemyRosters'
import { CastTab } from './battle/CastTab'
import { PromptSheet } from './battle/PromptSheet'
import { castersOf } from './battle/casters'
import { LogTab } from './battle/LogTab'
import { MyWarbandTab } from './battle/MyWarbandTab'
import { NotesTab } from './battle/NotesTab'
import { SaveBar } from './battle/SaveBar'
import { routStatus, setRouted, setTurn, sheetTotals, startingModels } from './battle/sheet'
import { PreBattle } from './battle/PreBattle'
import { RoutCheck } from './battle/RoutCheck'
import { TopStrip } from './battle/TopStrip'
import { useBattleSheet } from './battle/useBattleSheet'

type Tab = BattleTab

/**
 * Every sheet at the table with the shared log laid over it. A warband that has not saved a sheet
 * of its own but appears in the log gets one made of the log alone, so its casualties still show.
 */
function overlaySessions(sessions: BattleSessionView[], events: BattleEventRow[], participants: MatchSummary['participants']): BattleSessionView[] {
  const live = events.filter((e) => e.reverted_at === null)
  const out = sessions.map((s) => ({ ...s, live_state: applyBattleEvents(s.live_state, live, s.warband_id) }))
  for (const p of participants) {
    if (out.some((s) => s.warband_id === p.warband_id)) continue
    const involved = live.some((e) => e.payload.attacker_warband_id === p.warband_id || e.payload.target_warband_id === p.warband_id)
    if (involved) out.push({ warband_id: p.warband_id, live_state: applyBattleEvents(emptyBattleLiveState(), live, p.warband_id), updated_at: live[live.length - 1]?.at ?? '' })
  }
  return out
}

export function BattlePage() {
  const { id } = useParams<{ id: string }>()
  const user = useSession((s) => s.user)
  const match = useMatch(id, user?.id)
  const sessions = useBattleSessions(id)
  const events = useBattleEvents(id)
  useMatchRealtime(id)

  if (match.isPending || sessions.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner label="Loading the battle" />
      </div>
    )
  }
  if (match.isError || sessions.isError) {
    return (
      <>
        <Notice tone="error" title="Could not load this battle">
          {match.error?.message ?? sessions.error?.message}
        </Notice>
        <Link to={id ? `/matches/${id}` : '/campaigns'} className="text-brass underline-offset-4 hover:underline">
          Back to the match
        </Link>
      </>
    )
  }

  const summary = match.data
  if (summary.state === 'completed' || summary.state === 'cancelled') {
    return <Navigate to={`/matches/${summary.id}`} replace />
  }
  if (summary.state === 'scheduled') {
    return (
      <>
        <Notice tone="info" title="This battle has not started yet">
          The sheet opens as soon as someone taps Start on the match page. This screen will come alive on its own when that happens.
        </Notice>
        <Link to={`/matches/${summary.id}`} className="text-brass underline-offset-4 hover:underline">
          Back to the match
        </Link>
      </>
    )
  }
  return <Battle match={summary} sessions={sessions.data} events={events.data ?? []} userId={user?.id} />
}

function scenarioName(match: MatchSummary): string {
  if (match.scenario_rules_id) return findScenario(match.scenario_rules_id)?.title ?? match.scenario_rules_id
  return match.custom_scenario_name ?? 'Scenario to be decided'
}

function Battle({ match, sessions, events, userId }: { match: MatchSummary; sessions: BattleSessionView[]; events: BattleEventRow[]; userId: string | undefined }) {
  const navigate = useNavigate()
  const campaign = useCampaign(match.campaign_id)
  const isGm = campaign.data?.campaign.gm_id === userId
  const mine = match.participants.find((p) => p.mine)
  const boosts = useBattleBoosts(match, Boolean(campaign.data?.settings.mapCampaign))
  const others = match.participants.filter((p) => p.warband_id !== mine?.warband_id)
  const inProgress = match.state === 'in_progress'
  const editable = inProgress && mine !== undefined

  const myRoster = useMatchRoster(match.id, mine?.warband_id)
  const remote = mine ? sessions.find((s) => s.warband_id === mine.warband_id) : undefined
  const handle = useBattleSheet(match.id, mine?.warband_id ?? null, remote, editable)
  const shownSessions = useMemo(() => overlaySessions(sessions, events, match.participants), [sessions, events, match.participants])
  const logEvent = useLogBattleEvent(userId)

  const [tab, setTab] = useState<Tab>('mine')
  const [endOpen, setEndOpen] = useState(false)
  const [endError, setEndError] = useState<string | null>(null)
  const end = useEndMatch()

  const canEnd = inProgress && (mine !== undefined || isGm)

  async function confirmEnd() {
    setEndError(null)
    try {
      await handle.flush()
      await end.mutateAsync(match.id)
      navigate(`/matches/${match.id}`, { replace: true })
    } catch (e) {
      setEndError(e instanceof Error ? e.message : 'Could not end the battle.')
    }
  }

  const scenario = scenarioName(match)

  const endSheet = (
    <Sheet
      open={endOpen}
      onClose={() => setEndOpen(false)}
      title="Battle over?"
      description="This ends the game for everyone at the table. Each player then files a post-battle report from the match page; the sheets stay editable until the reports are in."
      footer={
        <div className="flex flex-col gap-2">
          {endError ? <Notice tone="error">{endError}</Notice> : null}
          <Button variant="primary" block pending={end.isPending} onClick={() => void confirmEnd()}>
            Yes, the battle is over
          </Button>
          <Button variant="ghost" block onClick={() => setEndOpen(false)}>
            Keep playing
          </Button>
        </div>
      }
    >
      <p className="text-sm text-ink-dim">
        {handle.saveState === 'pending' || handle.saveState === 'saving' ? 'Your latest taps will be saved first. ' : ''}
        Nothing is applied to any roster yet; that happens in the report.
      </p>
    </Sheet>
  )

  // Spectators (the GM, or a member who is not playing) see every sheet read-only.
  if (!mine) {
    return (
      <>
        <header className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.25em] text-ink-dim">{scenario}</p>
          <h1 className="font-headline text-3xl font-semibold leading-tight text-ink">Watching the battle</h1>
          <p className="text-sm text-ink-dim">
            You are not fielding a warband in this game. Every sheet below updates live.{' '}
            <Link to={`/matches/${match.id}`} className="text-brass underline-offset-4 hover:underline">
              Match page
            </Link>
          </p>
        </header>
        {!inProgress ? <AwaitingReportsNotice matchId={match.id} /> : null}
        <EnemyView matchId={match.id} participants={match.participants} sessions={shownSessions} />
        {match.combat_mode === 'app' ? <LogTab matchId={match.id} events={events} participants={match.participants} canRevert={inProgress && (isGm || mine !== undefined)} /> : null}
        {canEnd ? (
          <>
            <SaveBar saveState="readonly" saveError={null} onRetry={() => {}} onBattleOver={() => setEndOpen(true)} />
            {endSheet}
          </>
        ) : null}
      </>
    )
  }

  if (myRoster.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner label="Loading your warband" />
      </div>
    )
  }
  if (myRoster.isError) {
    return (
      <>
        <Notice tone="error" title="Could not load your warband">
          {myRoster.error.message}
        </Notice>
        <Link to={`/matches/${match.id}`} className="text-brass underline-offset-4 hover:underline">
          Back to the match
        </Link>
      </>
    )
  }

  return (
    <PlayerBattle
      match={match}
      sessions={shownSessions}
      events={events}
      onLogEvent={(payload) => logEvent.mutateAsync({ matchId: match.id, actorWarbandId: mine.warband_id, payload }).then(() => undefined)}
      roster={myRoster.data.roster}
      scenario={scenario}
      handle={handle}
      readOnly={!editable}
      tab={tab}
      setTab={setTab}
      onBattleOver={canEnd ? () => setEndOpen(true) : undefined}
      others={others}
      houseRules={campaign.data?.settings.houseRules ?? defaultCampaignHouseRules()}
      boosts={boosts}
    >
      {endSheet}
    </PlayerBattle>
  )
}

interface PlayerBattleProps {
  match: MatchSummary
  /** Sheets with the log already laid over them. */
  sessions: BattleSessionView[]
  events: BattleEventRow[]
  onLogEvent: (payload: AttackEventPayload) => Promise<void>
  roster: RosterWarband
  scenario: string
  handle: ReturnType<typeof useBattleSheet>
  readOnly: boolean
  tab: Tab
  setTab: (tab: Tab) => void
  onBattleOver: (() => void) | undefined
  others: MatchSummary['participants']
  houseRules: CampaignHouseRules
  /** Map campaigns: what the map adds to each warband this battle. */
  boosts: Record<string, BattleBoosts>
  children: ReactNode
}

function PlayerBattle({ match, sessions, events, onLogEvent, roster, scenario, handle, readOnly, tab, setTab, onBattleOver, others, houseRules, boosts, children }: PlayerBattleProps) {
  const myBoosts = boosts[roster.id] ?? NO_BOOSTS
  const boostLines = [
    ...(myBoosts.leaderLd ? [`Leader +${myBoosts.leaderLd} Ld (${myBoosts.leaderLdSources.join(', ')})`] : []),
    ...(myBoosts.fearImmunity ? [`Immune to Fear, Terror counts as Fear (${myBoosts.fearImmunity})`] : []),
  ]
  const template = useMemo(() => findWarbandTemplate(roster.warbandTemplateId), [roster.warbandTemplateId])
  // What the player sees: their own taps plus every kill and casualty the shared log recorded for them.
  const shown = useMemo(() => applyBattleEvents(handle.sheet, events, roster.id), [handle.sheet, events, roster.id])
  const pendingAdvances = usePendingAdvances(roster.id)
  const advancesDue = pendingAdvances.data?.length ?? 0
  const totals = useMemo(() => sheetTotals(shown, roster), [shown, roster])
  const rout = routStatus(shown, totals.startingModels)
  // Desktop: my warband always on the left, the other sections as tabs on the right.
  const desktop = useIsDesktop()
  const inApp = match.combat_mode === 'app'
  // Shares the Enemy tab's cache, so this costs nothing extra: it only feeds the "enemies out of N".
  const enemyRosters = useEnemyRosters(match.id, others)
  const prompts = useBattlePrompts(match.id)
  // The other side taken together: what they have lost, and how close that puts them to a rout
  // test. Read from their own sheets, so it counts everything that felled them, not only my kills.
  const enemy = useMemo(() => {
    if (others.length === 0 || enemyRosters.warbands.length !== others.length) return null
    const models = enemyRosters.warbands.reduce((n, w) => n + startingModels(w.roster), 0)
    const out = others.reduce((n, p) => {
      const theirs = sessions.find((x) => x.warband_id === p.warband_id)
      return n + (theirs ? battleTotals(theirs.live_state).ownOutOfAction : 0)
    }, 0)
    return { outOfAction: out, models, routAt: routThreshold(models) }
  }, [others, enemyRosters.warbands, sessions])
  const canCast = useMemo(() => castersOf(roster, template).length > 0, [roster, template])
  const sideTab: Tab = desktop && tab === 'mine' ? 'enemy' : tab

  return (
    <>
      <TopStrip
        scenario={scenario}
        warbands={[{ name: roster.name, mine: true }, ...others.map((p) => ({ name: p.warband_name, mine: false }))]}
        turn={shown.turn}
        onTurn={(turn) => handle.edit((s) => setTurn(s, turn))}
        totals={totals}
        rout={rout}
        onRouted={(routed) => handle.edit((s) => setRouted(s, routed))}
        readOnly={readOnly}
        enemy={enemy}
      />

      {readOnly ? <AwaitingReportsNotice matchId={match.id} /> : null}
      {!readOnly ? <PreBattle roster={roster} template={template} sheet={shown} edit={handle.edit} /> : null}
      {boostLines.length > 0 && !readOnly ? (
        <Notice tone="info" title="From the map">
          {boostLines.join('. ')}.
        </Notice>
      ) : null}
      {rout === 'test' && !readOnly ? <RoutCheck roster={roster} template={template} sheet={shown} totals={totals} edit={handle.edit} onBattleOver={onBattleOver} leaderLd={{ bonus: myBoosts.leaderLd, sources: myBoosts.leaderLdSources }} /> : null}
      {advancesDue > 0 && !readOnly ? (
        <Notice tone="warn" title={`${advancesDue} ${advancesDue === 1 ? 'advance' : 'advances'} still to bestow`}>
          Skills and characteristic gains should be chosen before a warrior fights again.{' '}
          <Link to={`/warbands/${roster.id}/advances`} className="text-brass underline-offset-4 hover:underline">
            Bestow advancements
          </Link>
        </Notice>
      ) : null}

      <div className={desktop ? 'grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-8' : 'flex flex-col gap-6'}>
        {desktop ? (
          <div className="flex flex-col gap-3">
            <h2 className="text-xs uppercase tracking-[0.25em] text-ink-dim">My warband</h2>
            <MyWarbandTab roster={roster} template={template} sheet={shown} edit={handle.edit} readOnly={readOnly} events={events} matchId={match.id} others={others} />
          </div>
        ) : null}
        <div className="flex flex-col gap-6">
          <BattleNav tab={sideTab} setTab={setTab} inApp={inApp} canCast={canCast} desktop={desktop} />

          {!desktop && sideTab === 'mine' ? <MyWarbandTab roster={roster} template={template} sheet={shown} edit={handle.edit} readOnly={readOnly} events={events} matchId={match.id} others={others} /> : null}
          {sideTab === 'enemy' ? <EnemyView matchId={match.id} participants={others} sessions={sessions} events={events} turn={shown.turn} /> : null}
          {sideTab === 'cast' ? <CastTab roster={roster} template={template} sheet={shown} readOnly={readOnly} edit={readOnly ? undefined : handle.edit} /> : null}
          {sideTab === 'fight' && inApp ? (
            <FightTab matchId={match.id} roster={roster} template={template} others={others} sessions={sessions} houseRules={houseRules} sheet={shown} readOnly={readOnly} onLogEvent={onLogEvent} edit={readOnly ? undefined : handle.edit} boosts={boosts} />
          ) : null}
          {sideTab === 'log' && inApp ? <LogTab matchId={match.id} events={events} participants={match.participants} canRevert={!readOnly} /> : null}
          {sideTab === 'notes' ? <NotesTab sheet={shown} edit={handle.edit} readOnly={readOnly} scenarioId={match.scenario_rules_id} custom={match.custom_scenario_name !== null} /> : null}
        </div>
      </div>

      {/* A question the other player has put to this warband, wherever on the sheet they happen to be. */}
      {!readOnly ? <PromptSheet matchId={match.id} prompts={prompts.data ?? []} myWarbandIds={[roster.id]} /> : null}

      <SaveBar saveState={handle.saveState} saveError={handle.saveError} onRetry={handle.retry} onBattleOver={onBattleOver} />
      {children}
    </>
  )
}

function AwaitingReportsNotice({ matchId }: { matchId: string }) {
  return (
    <Notice tone="info" title="The battle is over">
      This sheet is now read only.{' '}
      <Link to={`/matches/${matchId}`} className="text-brass underline-offset-4 hover:underline">
        Go to the match page
      </Link>{' '}
      to file your post-battle report.
    </Notice>
  )
}
