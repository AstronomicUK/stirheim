import type { BattleEventRow } from './battleEvent'

/** Each final natural 1 produces its own independently reversible self-hit. */
export function pendingVolatileBackfires(events: readonly BattleEventRow[], warbandId: string) {
  return events.filter(e => !e.reverted_at && e.payload.attacker_warband_id === warbandId)
    .flatMap(e => [
      ...Array.from({ length: e.payload.volatileBackfires ?? 0 }, (_, index) => ({ key: `${e.id}:${index}`, warriorId: e.payload.attacker_id, name: e.payload.attacker_name, eventId: e.id, weaponName: 'Cathayan Candles', strength: 6 })),
      ...Array.from({ length: e.payload.bolasBackfires ?? 0 }, (_, index) => ({ key: `${e.id}:bolas:${index}`, warriorId: e.payload.attacker_id, name: e.payload.attacker_name, eventId: e.id, weaponName: 'Bolas', strength: 3 })),
    ]).filter(hit => !events.some(e => !e.reverted_at && e.payload.volatileBackfireKey === hit.key))
}
