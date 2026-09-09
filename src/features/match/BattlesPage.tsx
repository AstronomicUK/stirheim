import { useQueries } from '@tanstack/react-query'
import { Link } from 'react-router'
import { useMyCampaigns } from '../../api/campaigns'
import { fetchCampaignMatches, matchKeys } from '../../api/matches'
import { useSession } from '../../app/session'
import { Notice, PageHeader, Spinner } from '../../ui'
import { Section } from '../campaign/bits'
import { MatchRows } from './shared/bits'
import { groupMatches } from './shared/helpers'
import { usePageTitle } from '../onboarding/usePageTitle'

export function BattlesPage() {
  usePageTitle('Battles')
  const user = useSession(s => s.user)
  const campaigns = useMyCampaigns(user?.id)
  const queries = useQueries({ queries: (campaigns.data ?? []).map(c => ({
    queryKey: matchKeys.forCampaign(c.id), queryFn: () => fetchCampaignMatches(c.id, user?.id), refetchInterval: 15000,
  })) })
  const groups = groupMatches(queries.flatMap(q => q.data ?? []))
  const sections = [
    { title: 'Active battles', matches: [...groups.now_playing, ...groups.awaiting_reports], empty: 'No battles in progress or awaiting reports.' },
    { title: 'Upcoming battles', matches: groups.scheduled, empty: 'No upcoming battles scheduled.' },
    { title: 'Past battles', matches: groups.finished, empty: 'No past battles yet.' },
  ]
  return <>
    <PageHeader eyebrow="Across your campaigns" title="Battles" description="Current games, upcoming challenges and past battles in one place." aside={<Link className="text-sm text-brass" to="/scenarios">Scenario library</Link>} />
    {campaigns.isPending || queries.some(q => q.isPending) ? <Spinner label="Loading battles" /> : null}
    {campaigns.error || queries.some(q => q.error) ? <Notice tone="error" title="Some battles could not be loaded">{campaigns.error?.message ?? queries.find(q => q.error)?.error?.message}</Notice> : null}
    {sections.map(section => <Section key={section.title} title={section.title} aside={String(section.matches.length)}>
      {[...new Set(section.matches.map(match => match.campaign_id))].map(campaignId => <div key={campaignId} className="flex flex-col gap-1">
        <Link to={`/campaigns/${campaignId}`} className="text-xs text-brass">{campaigns.data?.find(c => c.id === campaignId)?.name ?? 'Campaign'}</Link>
        <MatchRows matches={section.matches.filter(match => match.campaign_id === campaignId)} muted={section.title === 'Past battles'} />
      </div>)}
      {section.matches.length === 0 && !campaigns.isPending && !queries.some(q => q.isPending) ? <p className="text-sm text-ink-dim">{section.empty}</p> : null}
    </Section>)}
    <Link to="/campaigns" className="text-sm text-brass">Open a campaign to schedule a battle</Link>
  </>
}
