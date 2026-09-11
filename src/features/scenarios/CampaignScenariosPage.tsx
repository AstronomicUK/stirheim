import { Link, useParams } from 'react-router'
import { useCampaign } from '../../api/campaigns'
import { useCustomScenarios } from '../../api/scenarios'
import { useSession } from '../../app/session'
import { Notice, PageHeader, Spinner } from '../../ui'
import { usePageTitle } from '../onboarding/usePageTitle'

export function CampaignScenariosPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const user = useSession(s => s.user)
  const campaign = useCampaign(campaignId)
  const scenarios = useCustomScenarios()
  usePageTitle('Campaign scenarios')
  if (campaign.isPending || scenarios.isPending) return <Spinner label="Loading scenarios" />
  if (campaign.error || scenarios.error) return <Notice tone="error">{campaign.error?.message ?? scenarios.error?.message}</Notice>
  if (campaign.data?.campaign.gm_id !== user?.id) return <Notice title="GM only">Scenario management lives in the campaign settings and is available to its GM.</Notice>
  const rows = (scenarios.data ?? []).filter(s => s.campaign_id === campaignId || (s.campaign_id === null && s.owner_id === user?.id))
  return <>
    <PageHeader eyebrow={`${campaign.data.campaign.name} · Settings`} title="Scenarios" description="Manage this campaign’s scenarios and your shared scenarios." />
    <Link to={`/campaigns/${campaignId}/settings/scenarios/new`} className="text-brass">Write a scenario</Link>
    {rows.map(row => <div key={row.id} className="flex items-center justify-between gap-4 rounded border border-border bg-surface-low p-4">
      <Link to={`/scenarios/custom/${row.id}`} className="text-ink">{row.name}</Link>
      {row.owner_id === user?.id ? <Link to={`/campaigns/${campaignId}/settings/scenarios/${row.id}/edit`} className="text-brass">Edit</Link> : <span className="text-xs text-ink-dim">Only its author can edit</span>}
    </div>)}
    {rows.length === 0 ? <p className="text-sm text-ink-dim">No custom scenarios for this campaign yet.</p> : null}
    <Link to={`/campaigns/${campaignId}/settings#scenario-library`} className="text-brass">Choose from the full scenario library in campaign settings</Link>
    <Link to={`/campaigns/${campaignId}/settings`} className="text-brass">Back to campaign settings</Link>
  </>
}
