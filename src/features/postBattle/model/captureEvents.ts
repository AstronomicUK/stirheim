import type { BattleEventRow } from '../../../domain'

/** Capture identity follows the saved OOA event, not an assumed named member of a group. */
export function captureEvents(events: readonly BattleEventRow[], matchId: string, warbandId: string | undefined, subjectId: string) {
  const seen = new Set<string>()
  return events
    .filter(event => event.match_id === matchId && !event.reverted_at && event.payload.out_of_action && event.payload.target_warband_id === warbandId && event.payload.target_id === subjectId)
    .slice().sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))
    .filter(event => { if (seen.has(event.id)) return false; seen.add(event.id); return true })
    .map((event, modelIndex) => ({ event, modelIndex }))
    .filter(({event}) => event.payload.capture_reason === 'subjugator')
}
