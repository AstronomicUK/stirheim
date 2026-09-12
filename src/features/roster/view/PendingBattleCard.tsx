// A battle this warband has coming, shown on its own page. The campaign screen already lists the
// fixtures, but a player who has gone straight to their roster had no sign of one and no way into
// the sheet. This is that sign: who they are playing, when, where, and the way in.

import { Link } from 'react-router'
import { useCampaignMatches, type MatchSummary } from '../../../api/matches'
import { findDistrict } from '../../../rules/data/map/districts'
import { findScenario } from '../../../rules/data/campaign/scenarios'
import { Icon, Notice } from '../../../ui'
import { battleSheetPath } from '../../match/battle/myWarband'

export interface PendingBattleCardProps {
  warbandId: string
  campaignId: string | undefined
  userId: string | undefined
}

/** Fixtures still to be played, soonest first: a challenge awaiting an answer, one scheduled, one under way. */
function pendingFor(matches: MatchSummary[], warbandId: string): MatchSummary[] {
  return matches
    .filter((m) => (m.state === 'scheduled' || m.state === 'in_progress') && m.participants.some((p) => p.warband_id === warbandId))
    .sort((a, b) => {
      // Whatever has started comes first, then by date, then undated.
      if (a.state !== b.state) return a.state === 'in_progress' ? -1 : b.state === 'in_progress' ? 1 : 0
      if (a.scheduled_for && b.scheduled_for) return a.scheduled_for.localeCompare(b.scheduled_for)
      return a.scheduled_for ? -1 : b.scheduled_for ? 1 : 0
    })
}

function whenText(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
}

export function PendingBattleCard({ warbandId, campaignId, userId }: PendingBattleCardProps) {
  const matches = useCampaignMatches(campaignId, userId)
  const pending = matches.data ? pendingFor(matches.data, warbandId) : []
  if (pending.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {pending.map((match) => {
        const others = match.participants.filter((p) => p.warband_id !== warbandId)
        const opponents = others.map((p) => p.warband_name).join(' and ') || 'an opponent yet to be set'
        const scenario = match.scenario_rules_id ? (findScenario(match.scenario_rules_id)?.title ?? null) : match.custom_scenario_name
        const district = match.district_id ? (findDistrict(match.district_id)?.name ?? null) : null
        const when = whenText(match.scheduled_for)
        // A map battle booked without a district: the players have to settle it before they play.
        const districtOpen = district === null && match.district_id === null && match.participants.length > 1
        const started = match.state === 'in_progress'
        const mine = match.participants.find((p) => p.warband_id === warbandId)
        // A challenge is scheduled but not yet accepted by this warband.
        const unanswered = match.created_via === 'challenge' && mine?.accepted_at === null

        return (
          <Notice
            key={match.id}
            tone={started ? 'warn' : 'info'}
            title={started ? `Battle under way against ${opponents}` : unanswered ? `Challenge from ${opponents}` : `Battle to come against ${opponents}`}
          >
            <div className="flex flex-col gap-2">
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {when ? (
                  <li className="flex items-center gap-1.5">
                    <Icon name="history" size={14} className="text-brass" />
                    {when}
                  </li>
                ) : null}
                {scenario ? (
                  <li className="flex items-center gap-1.5">
                    <Icon name="scenarios" size={14} className="text-brass" />
                    {scenario}
                  </li>
                ) : null}
                {district ? (
                  <li className="flex items-center gap-1.5">
                    <Icon name="map" size={14} className="text-brass" />
                    {district}
                  </li>
                ) : null}
                {match.district_decided_by === 'roll_off' ? <li className="text-ink-dim">settled by a roll-off</li> : null}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link
                  // Carry this warband into the sheet: one account can own both sides (#206).
                  to={started ? battleSheetPath(match.id, warbandId) : `/matches/${match.id}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-brass bg-brass px-4 text-sm font-semibold text-surface-low no-underline hover:bg-brass/90"
                >
                  <Icon name="battle" size={16} />
                  {started ? 'Open the battle sheet' : unanswered ? 'Answer the challenge' : 'Start battle'}
                </Link>
                {!started ? (
                  <Link
                    to={`/matches/${match.id}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface-low px-4 text-sm font-medium text-ink no-underline hover:bg-surface-high"
                  >
                    {districtOpen ? <Icon name="map" size={16} className="text-brass" /> : null}
                    {districtOpen ? 'Settle the district' : 'Match details'}
                  </Link>
                ) : null}
              </div>
            </div>
          </Notice>
        )
      })}
    </div>
  )
}
