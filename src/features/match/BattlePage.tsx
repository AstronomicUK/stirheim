// The one screen a player keeps open on their phone during the game: their own tally sheet, the
// enemy rosters and live tallies, loot and notes. Saves itself; every phone at the table is kept
// in step by Realtime.

import { useMemo, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { useCampaign } from '../../api/campaigns'
import { defaultCampaignHouseRules, type CampaignHouseRules } from '../../rules/types/roster'
import { useBattleSessions, useEndMatch, useMatch, useMatchRealtime, useMatchRoster, type BattleSessionView, type MatchSummary } from '../../api/matches'
import { useSession } from '../../app/session'
import { findScenario } from '../../rules/data/campaign/scenarios'
import { findWarbandTemplate } from '../../rules/data/warbandTemplates'
import type { RosterWarband } from '../../rules/types/roster'
import { Button, Notice, SegmentedControl, Sheet, Spinner } from '../../ui'
import { EnemyView } from './battle/EnemyView'
import { FightTab } from './fight/FightTab'
import { MyWarbandTab } from './battle/MyWarbandTab'
import { NotesTab } from './battle/NotesTab'
import { SaveBar } from './battle/SaveBar'
import { routStatus, setRouted, setTurn, sheetTotals } from './battle/sheet'
import { TopStrip } from './battle/TopStrip'
import { useBattleSheet } from './battle/useBattleSheet'

type Tab = 'mine' | 'enemy' | 'fight' | 'notes'

const TABS: { value: Tab; label: string }[] = [
  { value: 'mine', label: 'My warband' },
  { value: 'enemy', label: 'Enemy' },
  { value: 'fight', label: 'Attack' },
  { value: 'notes', label: 'Notes' },
]

export function BattlePage() {
  const { id } = useParams<{ id: string }>()
  const user = useSession((s) => s.user)
  const match = useMatch(id, user?.id)
  const sessions = useBattleSessions(id)
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
  return <Battle match={summary} sessions={sessions.data} userId={user?.id} />
}

function scenarioName(match: MatchSummary): string {
  if (match.scenario_rules_id) return findScenario(match.scenario_rules_id)?.title ?? match.scenario_rules_id
  return match.custom_scenario_name ?? 'Scenario to be decided'
}

function Battle({ match, sessions, userId }: { match: MatchSummary; sessions: BattleSessionView[]; userId: string | undefined }) {
  const navigate = useNavigate()
  const campaign = useCampaign(match.campaign_id)
  const isGm = campaign.data?.campaign.gm_id === userId
  const mine = match.participants.find((p) => p.mine)
  const others = match.participants.filter((p) => p.warband_id !== mine?.warband_id)
  const inProgress = match.state === 'in_progress'
  const editable = inProgress && mine !== undefined

  const myRoster = useMatchRoster(match.id, mine?.warband_id)
  const remote = mine ? sessions.find((s) => s.warband_id === mine.warband_id) : undefined
  const handle = useBattleSheet(match.id, mine?.warband_id ?? null, remote, editable)

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
  const opponentsLine = others.length > 0 ? `vs ${others.map((p) => p.warband_name).join(', ')}` : 'No opponents listed'

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
        <EnemyView matchId={match.id} participants={match.participants} sessions={sessions} />
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
      sessions={sessions}
      roster={myRoster.data.roster}
      scenario={scenario}
      opponentsLine={opponentsLine}
      handle={handle}
      readOnly={!editable}
      tab={tab}
      setTab={setTab}
      onBattleOver={canEnd ? () => setEndOpen(true) : undefined}
      others={others}
      houseRules={campaign.data?.settings.houseRules ?? defaultCampaignHouseRules()}
    >
      {endSheet}
    </PlayerBattle>
  )
}

interface PlayerBattleProps {
  match: MatchSummary
  sessions: BattleSessionView[]
  roster: RosterWarband
  scenario: string
  opponentsLine: string
  handle: ReturnType<typeof useBattleSheet>
  readOnly: boolean
  tab: Tab
  setTab: (tab: Tab) => void
  onBattleOver: (() => void) | undefined
  others: MatchSummary['participants']
  houseRules: CampaignHouseRules
  children: ReactNode
}

function PlayerBattle({ match, sessions, roster, scenario, opponentsLine, handle, readOnly, tab, setTab, onBattleOver, others, houseRules, children }: PlayerBattleProps) {
  const template = useMemo(() => findWarbandTemplate(roster.warbandTemplateId), [roster.warbandTemplateId])
  const totals = useMemo(() => sheetTotals(handle.sheet, roster), [handle.sheet, roster])
  const rout = routStatus(handle.sheet, totals.startingModels)

  return (
    <>
      <TopStrip
        scenario={scenario}
        opponents={`${roster.name} ${opponentsLine}`}
        turn={handle.sheet.turn}
        onTurn={(turn) => handle.edit((s) => setTurn(s, turn))}
        totals={totals}
        rout={rout}
        onRouted={(routed) => handle.edit((s) => setRouted(s, routed))}
        readOnly={readOnly}
      />

      {readOnly ? <AwaitingReportsNotice matchId={match.id} /> : null}

      <SegmentedControl options={TABS} value={tab} onChange={setTab} label="Battle sheet section" />

      {tab === 'mine' ? <MyWarbandTab roster={roster} template={template} sheet={handle.sheet} edit={handle.edit} readOnly={readOnly} /> : null}
      {tab === 'enemy' ? (
        <EnemyView matchId={match.id} participants={others} sessions={sessions} intro="Their rosters for reference, and whatever they have tallied so far. Refreshes live." />
      ) : null}
      {tab === 'fight' ? (
        <FightTab matchId={match.id} roster={roster} template={template} others={others} sessions={sessions} houseRules={houseRules} sheet={handle.sheet} edit={handle.edit} readOnly={readOnly} />
      ) : null}
      {tab === 'notes' ? <NotesTab sheet={handle.sheet} edit={handle.edit} readOnly={readOnly} /> : null}

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
