// Trading post and stash (Phase 8): sell wyrdstone, buy from the catalogue with rare-item searches,
// sell equipment, and move kit between the stash and warriors. Every action is one record_trade
// call built from a resolver result and diffRoster (see ./useTrade.ts), so the roster shown is
// always what the database holds.

import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useLatestReport, useTradePhaseState, useWarbandCampaign, type WarbandCampaign } from '../../api/trading'
import { useWarband, type WarbandDetail } from '../../api/warbands'
import { useSession } from '../../app/session'
import { applyHouseRuleDefaults } from '../../rules/resolve/houseRules'
import { Notice, PageHeader, SegmentedControl, Spinner } from '../../ui'
import { Card, KeyValue } from '../roster/view/bits'
import { BuyTab } from './BuyTab'
import { eligibleSearchers, phaseSummary } from './helpers'
import { SellTab } from './SellTab'
import { SellWyrdstoneTab } from './SellWyrdstoneTab'
import { StashTab } from './StashTab'
import { CharactersTab } from './CharactersTab'
import { useMatchReports, type ReportView } from '../../api/reports'
import { phaseInfo, useTrade, type PhaseInfo } from './useTrade'

type Tab = 'wyrdstone' | 'buy' | 'sell' | 'stash' | 'characters'

const TABS: { value: Tab; label: string }[] = [
  { value: 'wyrdstone', label: 'Sell wyrdstone' },
  { value: 'buy', label: 'Buy' },
  { value: 'sell', label: 'Sell' },
  { value: 'stash', label: 'Stash' },
  { value: 'characters', label: 'Characters' },
]

export function TradingPage() {
  const { id } = useParams<{ id: string }>()
  const warband = useWarband(id)
  const campaign = useWarbandCampaign(id)
  const report = useLatestReport(id)
  const matchId = report.data?.match_id ?? null
  const state = useTradePhaseState(id, matchId)
  const reports = useMatchReports(matchId ?? undefined)

  const header = (
    <PageHeader
      eyebrow="Between battles"
      title="Trading post"
      aside={
        <Link to={`/warbands/${id}`} className="text-sm text-brass underline-offset-4 hover:underline">
          Back to the roster
        </Link>
      }
    />
  )

  if (warband.isPending || campaign.isPending || report.isPending || (matchId !== null && (state.isPending || reports.isPending))) {
    return (
      <>
        {header}
        <div className="flex flex-1 items-center justify-center py-20">
          <Spinner label="Loading the trading post" />
        </div>
      </>
    )
  }
  const loadError = warband.error ?? campaign.error ?? report.error ?? state.error
  if (loadError || !warband.data) {
    return (
      <>
        {header}
        <Notice tone="error" title="Could not open the trading post">
          {loadError?.message ?? 'This warband does not exist, or you cannot see it.'}
        </Notice>
      </>
    )
  }

  return (
    <>
      {header}
      <TradingView detail={warband.data} campaign={campaign.data ?? null} phase={phaseInfo(matchId, state.data, heroesOutInReport(reports.data, id))} />
    </>
  )
}

function TradingView({ detail, campaign, phase }: { detail: WarbandDetail; campaign: WarbandCampaign | null; phase: PhaseInfo }) {
  const user = useSession((s) => s.user)
  const isOwner = user?.id === detail.warband.owner_id
  const houseRules = useMemo(() => applyHouseRuleDefaults(campaign?.settings.houseRules), [campaign])
  const trade = useTrade(detail, houseRules, phase, isOwner)
  const [tab, setTab] = useState<Tab>(detail.roster.wyrdstone > 0 && !phase.wyrdstoneSold ? 'wyrdstone' : 'buy')

  const searchesLeft = eligibleSearchers(detail.roster, phase.heroesSearched, phase.heroesOutOfAction).length
  const searchesUsed = phase.heroesSearched.length

  return (
    <>
      <Card className="grid grid-cols-3 gap-y-4 px-4 py-3">
        <KeyValue label="Gold" value={`${detail.warband.gold} gc`} />
        <KeyValue label="Wyrdstone" value={detail.warband.wyrdstone} />
        <KeyValue label="Stash" value={detail.roster.stash.reduce((n, i) => n + i.quantity, 0)} />
      </Card>

      {!isOwner ? (
        <Notice tone="info" title="Read only">
          Only the warband's owner can trade. You can look through the stash and the catalogue.
        </Notice>
      ) : null}

      <p className="text-xs leading-relaxed text-ink-dim">
        {phaseSummary(phase.matchId, phase.wyrdstoneSold, searchesUsed, searchesLeft)}
        {campaign ? (
          <>
            {' '}
            House rules from <span className="text-ink">{campaign.name}</span>
            {houseRules.halfPriceArmour ? ': armour at half price (shields and helmets excepted).' : '.'}
          </>
        ) : (
          <> Not in a campaign: default house rules apply{houseRules.halfPriceArmour ? ' (armour at half price, shields and helmets excepted)' : ''}.</>
        )}
      </p>

      {trade.error && !sheetOwnsError(tab) ? <Notice tone="error">{trade.error}</Notice> : null}

      <SegmentedControl
        label="Trading post section"
        options={TABS}
        value={tab}
        onChange={(next) => {
          trade.clearError()
          setTab(next)
        }}
      />

      {tab === 'wyrdstone' ? <SellWyrdstoneTab trade={trade} /> : null}
      {tab === 'buy' ? <BuyTab trade={trade} /> : null}
      {tab === 'sell' ? <SellTab trade={trade} /> : null}
      {tab === 'stash' ? <StashTab trade={trade} /> : null}
      {tab === 'characters' ? <CharactersTab trade={trade} /> : null}
    </>
  )
}

/** Heroes this warband's filed report for the match lists as out of action. */
function heroesOutInReport(reports: ReportView[] | undefined, warbandId: string | undefined): string[] {
  const mine = reports?.find((r) => r.warband_id === warbandId)
  if (!mine) return []
  return mine.ooa.filter((line) => line.subjectType === 'hero' || line.subjectType === 'hiredSword').map((line) => line.subjectId)
}

/** Buy, sell and move show the error inside their sheet; the wyrdstone tab has no sheet. */
function sheetOwnsError(tab: Tab): boolean {
  return tab !== 'wyrdstone' && tab !== 'characters'
}
