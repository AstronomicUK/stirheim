import { useLatestReport, useTradePhaseState, useWarbandCampaign } from '../../api/trading'
import { useMatchReports } from '../../api/reports'
import type { WarbandDetail } from '../../api/warbands'
import { applyHouseRuleDefaults } from '../../rules/resolve/houseRules'
import type { MapPerks } from '../../rules/resolve/mapAdvantages'
import { Notice, Spinner } from '../../ui'
import { CharactersTab } from '../trading/CharactersTab'
import { heroesOutInReport, phaseInfo, useTrade } from '../trading/useTrade'

/** Uses the same persisted phase and mutation as rare searches; changing pages cannot reset usage. */
export function PersonaeRecruitment({ detail, canEdit, perks }: { detail: WarbandDetail; canEdit: boolean; perks: MapPerks | null }) {
  const id = detail.warband.id
  const campaign = useWarbandCampaign(id)
  const report = useLatestReport(id)
  const matchId = report.data?.match_id ?? null
  const phase = useTradePhaseState(id, matchId)
  const reports = useMatchReports(matchId ?? undefined)
  const loading = campaign.isPending || report.isPending || (matchId !== null && (phase.isPending || reports.isPending))
  const error = campaign.error ?? report.error ?? phase.error ?? reports.error
  const trade = useTrade(detail, applyHouseRuleDefaults(campaign.data?.settings.houseRules),
    phaseInfo(matchId, phase.data, heroesOutInReport(reports.data, id)), canEdit && !loading && !error, perks)
  if (loading) return <Spinner label="Loading Dramatis Personae and hero searches" />
  if (error) return <Notice tone="error" title="Could not load hero searches">{error.message}</Notice>
  return <CharactersTab trade={trade} />
}
