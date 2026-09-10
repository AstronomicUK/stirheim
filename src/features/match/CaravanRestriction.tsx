import { useWarband } from '../../api/warbands'
import { Notice } from '../../ui'
export function CaravanRestriction({ warbandId, campaignId }: { warbandId: string; campaignId: string }) {
  const detail = useWarband(warbandId)
  if (!detail.data?.roster.scenarioEffects?.caravanBannedCampaigns.includes(campaignId)) return null
  return <Notice tone="warn">{detail.data.roster.name} previously betrayed a caravan in this campaign. It may attack this caravan, but cannot serve as its escort. An agreed table exception must be recorded in the report.</Notice>
}
