import type { BattleEventRow } from '../../../domain'

/** Capture identity follows the saved OOA event, not an assumed named member of a group. */
export function captureEvents(events: readonly BattleEventRow[], matchId: string, warbandId: string | undefined, subjectId: string) {
  const seen = new Set<string>()
  const matching = events
    .filter(event => event.match_id === matchId && !event.reverted_at && event.payload.out_of_action && event.payload.target_warband_id === warbandId && event.payload.target_id === subjectId)
    .slice().sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))
    .filter(event => { if (seen.has(event.id)) return false; seen.add(event.id); return true })
  const logged=matching.filter(event=>!event.payload.metadata_only)
  const manual=matching.filter(event=>event.payload.metadata_only&&Number.isInteger(event.payload.manual_casualty_index))
  return [...logged.map((event,modelIndex)=>({event,modelIndex})),...manual.map(event=>({event,modelIndex:logged.length+event.payload.manual_casualty_index!}))]
    .filter(({event}) => event.payload.capture_reason === 'subjugator' || event.payload.capture_reason === 'man_catcher' || event.payload.capture_reason === 'cavalcade')
    .sort((a,b)=>a.modelIndex-b.modelIndex)
}
