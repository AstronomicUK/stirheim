import type { BattleEventRow } from './battleEvent'

/** One independently reversible self-hit per final natural 1, never one per whole phase. */
export function pendingVolatileBackfires(events: readonly BattleEventRow[], warbandId: string) {
  return events.filter(e => !e.reverted_at && e.payload.attacker_warband_id === warbandId && e.payload.volatileBackfires)
    .flatMap(e => Array.from({ length: e.payload.volatileBackfires! }, (_, index) => ({
      key: `${e.id}:${index}`, warriorId: e.payload.attacker_id, name: e.payload.attacker_name, eventId: e.id,
    }))).filter(hit => !events.some(e => !e.reverted_at && e.payload.volatileBackfireKey === hit.key))
}
