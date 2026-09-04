// The Battles section of the campaign dashboard: this campaign's matches grouped by state, with
// inline Accept / Decline for challenges aimed at the signed-in user and the way in to booking a
// new one.

import { useMemo, useState, type ReactNode } from 'react'
import { useCampaignMatches, useRespondToChallenge } from '../../../api/matches'
import { Notice, Spinner } from '../../../ui'
import { Card, Disclosure, LinkButton, Section } from '../../campaign/bits'
import { MatchRows } from './bits'
import { groupMatches, MATCH_GROUP_TITLES } from './helpers'

export interface CampaignBattlesProps {
  campaignId: string
  userId: string | undefined
  isGm: boolean
  /** True when the signed-in user has a warband enrolled (so may issue a challenge). */
  isMember: boolean
  archived: boolean
}

export function CampaignBattles({ campaignId, userId, isGm, isMember, archived }: CampaignBattlesProps) {
  const query = useCampaignMatches(campaignId, userId)
  const respond = useRespondToChallenge()
  const [showFinished, setShowFinished] = useState(false)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [respondError, setRespondError] = useState<string | null>(null)

  const groups = useMemo(() => groupMatches(query.data ?? []), [query.data])
  const open = groups.now_playing.length + groups.awaiting_reports.length + groups.scheduled.length

  async function onRespond(matchId: string, warbandId: string, accept: boolean) {
    setRespondError(null)
    setRespondingTo(matchId)
    try {
      await respond.mutateAsync({ matchId, warbandId, accept })
    } catch (e) {
      setRespondError(e instanceof Error ? e.message : 'Could not answer the challenge.')
    } finally {
      setRespondingTo(null)
    }
  }

  const canCreate = !archived && (isGm || isMember)
  const createLabel = isGm ? 'Schedule a battle' : 'Challenge'

  return (
    <Section title="Battles" aside={query.data ? `${open} open` : undefined}>
      {query.isPending ? (
        <div className="flex justify-center py-4">
          <Spinner label="Loading battles" />
        </div>
      ) : query.isError ? (
        <Notice tone="error" title="Could not load the battles">
          {query.error.message}{' '}
          <button type="button" onClick={() => void query.refetch()} className="text-brass underline-offset-4 hover:underline">
            Try again
          </button>
        </Notice>
      ) : query.data.length === 0 ? (
        <Card className="px-4 py-4">
          <p className="text-sm leading-relaxed text-ink-dim">
            {archived
              ? 'No battles were recorded in this campaign.'
              : isGm
                ? 'No battles yet. Schedule one between any enrolled warbands, or let players challenge each other.'
                : isMember
                  ? 'No battles yet. Challenge a rival warband to get the campaign moving.'
                  : 'No battles yet.'}
          </p>
        </Card>
      ) : (
        <>
          {respondError ? <Notice tone="error">{respondError}</Notice> : null}
          {groups.now_playing.length > 0 ? (
            <Group title={MATCH_GROUP_TITLES.now_playing}>
              <MatchRows matches={groups.now_playing} />
            </Group>
          ) : null}
          {groups.awaiting_reports.length > 0 ? (
            <Group title={MATCH_GROUP_TITLES.awaiting_reports}>
              <MatchRows matches={groups.awaiting_reports} />
            </Group>
          ) : null}
          {groups.scheduled.length > 0 ? (
            <Group title={MATCH_GROUP_TITLES.scheduled}>
              <MatchRows matches={groups.scheduled} onRespond={(m, w, a) => void onRespond(m, w, a)} respondingTo={respondingTo} />
            </Group>
          ) : null}
          {groups.finished.length > 0 ? (
            <div className="flex flex-col gap-3">
              <Disclosure open={showFinished} onToggle={() => setShowFinished((v) => !v)} label="finished battles" count={groups.finished.length} />
              {showFinished ? <MatchRows matches={groups.finished} muted /> : null}
            </div>
          ) : null}
        </>
      )}
      {canCreate ? (
        <LinkButton to={`/campaigns/${campaignId}/matches/new`} variant={query.data && query.data.length > 0 ? 'secondary' : 'primary'}>
          {createLabel}
        </LinkButton>
      ) : null}
    </Section>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-[10px] uppercase tracking-wider text-ink-dim">{title}</h3>
      {children}
    </div>
  )
}
