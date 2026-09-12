// Trading post and stash (Phase 8): sell wyrdstone, buy from the catalogue with rare-item searches,
// sell equipment, and move kit between the stash and warriors. Every action is one record_trade
// call built from a resolver result and diffRoster (see ./useTrade.ts), so the roster shown is
// always what the database holds.

import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useTradeWagonSearchRestriction, useLatestReport, useTradePhaseState, useWarbandCampaign, type WarbandCampaign } from '../../api/trading'
import { useWarband, type WarbandDetail } from '../../api/warbands'
import { useSession } from '../../app/session'
import { applyHouseRuleDefaults } from '../../rules/resolve/houseRules'
import { IconTabs, Notice, PageHeader, Spinner, type IconTab } from '../../ui'
import { Card, KeyValue } from '../roster/view/bits'
import { BuyTab } from './BuyTab'
import { eligibleSearchers, phaseSummary } from './helpers'
import { SellTab } from './SellTab'
import { SellWyrdstoneTab } from './SellWyrdstoneTab'
import { StashTab } from './StashTab'
import { ActionsSection } from './CharactersTab'
import { useMatchReports } from '../../api/reports'
import { phaseInfo, useTrade, heroesOutInReport, type PhaseInfo } from './useTrade'
import { useMapPerks } from '../map/useMapPerks'
import { MapPerksCard } from '../map/MapPerksCard'
import { usePageTitle } from '../onboarding/usePageTitle'

type Tab = 'wyrdstone' | 'buy' | 'sell' | 'stash'

const TABS: IconTab<Tab>[] = [
  { value: 'wyrdstone', label: 'Sell wyrdstone', icon: 'wyrdstone' },
  { value: 'buy', label: 'Buy', icon: 'buy' },
  { value: 'sell', label: 'Sell', icon: 'sell' },
  { value: 'stash', label: 'Stash', icon: 'stash' },
]

export function TradingPage() {
  const { id } = useParams<{ id: string }>()
  const warband = useWarband(id)
  const campaign = useWarbandCampaign(id)
  const restriction = useTradeWagonSearchRestriction(id)
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

  if (restriction.isPending || warband.isPending || campaign.isPending || report.isPending || (matchId !== null && (state.isPending || reports.isPending))) {
    return (
      <>
        {header}
        <div className="flex flex-1 items-center justify-center py-20">
          <Spinner label="Loading the trading post" />
        </div>
      </>
    )
  }
  const loadError = restriction.error ?? warband.error ?? campaign.error ?? report.error ?? state.error
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
      <TradingView detail={warband.data} campaign={campaign.data ?? null} phase={{...phaseInfo(matchId, state.data, heroesOutInReport(reports.data, id)),rareItemSearchBlocked:restriction.data}} />
    </>
  )
}

function TradingView({ detail, campaign, phase }: { detail: WarbandDetail; campaign: WarbandCampaign | null; phase: PhaseInfo }) {
  usePageTitle(`Trading post · ${detail.warband.name}`)
  const user = useSession((s) => s.user)
  const isOwner = user?.id === detail.warband.owner_id
  const houseRules = useMemo(() => applyHouseRuleDefaults(campaign?.settings.houseRules), [campaign])
  const { perks } = useMapPerks(campaign?.campaignId, detail.warband.id, Boolean(campaign?.settings.mapCampaign))
  const trade = useTrade(detail, houseRules, phase, isOwner, perks)
  const [tab, setTab] = useState<Tab>(detail.roster.wyrdstone > 0 && !phase.wyrdstoneSold ? 'wyrdstone' : 'buy')

  const searchesLeft = phase.rareItemSearchBlocked ? 0 : eligibleSearchers(detail.roster, phase.heroesSearched, phase.heroesOutOfAction).length
  const searchesUsed = phase.heroesSearched.length
  const stashCount = detail.roster.stash.reduce((n, i) => n + i.quantity, 0)

  return (
    <>
      {phase.rareItemSearchBlocked?<Notice tone="info" title="Rare-item searches unavailable">Local traders refuse rare-item searches after the captured Merchant Caravan wagon. This ends when your next battle starts. Common purchases and character searches remain available.</Notice>:null}
      <Card className="grid grid-cols-3 gap-y-4 px-4 py-3">
        <KeyValue icon="gold" label="Gold" value={`${detail.warband.gold} gc`} />
        <KeyValue icon="wyrdstone" label="Wyrdstone" value={detail.warband.wyrdstone} />
        <KeyValue icon="stash" label="Stash" value={stashCount} />
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
            {houseRules.halfPriceArmour ? `: armour at half price${houseRules.halfPriceShields && houseRules.halfPriceHelmets ? ', shields and helmets included' : houseRules.halfPriceShields ? ', shields included' : houseRules.halfPriceHelmets ? ', helmets included' : ' (shields and helmets excepted)'}.` : '.'}
          </>
        ) : (
          <> Not in a campaign: default house rules apply{houseRules.halfPriceArmour ? ' (armour at half price, shields and helmets excepted)' : ''}.</>
        )}
      </p>

      {perks ? <MapPerksCard perks={perks} campaignId={campaign?.campaignId} /> : null}

      {trade.error && !sheetOwnsError(tab) ? <Notice tone="error">{trade.error}</Notice> : null}

      <IconTabs
        label="Trading post section"
        tabs={TABS.map((t) => ({
          ...t,
          detail:
            t.value === 'wyrdstone'
              ? `${detail.warband.wyrdstone} ${detail.warband.wyrdstone === 1 ? 'shard' : 'shards'}`
              : t.value === 'stash'
                ? `${stashCount} ${stashCount === 1 ? 'item' : 'items'}`
                : undefined,
        }))}
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
      <ActionsSection trade={trade} searchers={eligibleSearchers(detail.roster, phase.heroesSearched, phase.heroesOutOfAction)} />
    </>
  )
}

/** Buy, sell and move show the error inside their sheet; the wyrdstone tab has no sheet. */
function sheetOwnsError(tab: Tab): boolean {
  return tab !== 'wyrdstone'
}
