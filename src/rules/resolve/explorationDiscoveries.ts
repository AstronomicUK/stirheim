/** Discoveries are derived from applied reports, so withdrawal/amendment also changes them.
 * Pending reports do not grant benefits. Repeated permanent discoveries never stack.
 */
export interface ExplorationDiscoveries {
  catacombs: boolean
  straggler: boolean
  tunnels: boolean
  freeHireReportId?: string
}
export interface DiscoveryReport {
  id: string
  exploration: { locationId?: string | null; benefits?: string[] } | null
}
/** Reports must be oldest first. A skipped exploration does not consume a Straggler die. */
export function explorationDiscoveries(reports: DiscoveryReport[]): ExplorationDiscoveries {
  const latest = reports.at(-1)
  const lastExploration = reports.findLast(r => r.exploration !== null)
  return {
    catacombs: reports.some(r => r.exploration?.locationId === 'entrance_to_the_catacombs'),
    straggler: lastExploration?.exploration?.benefits?.includes('straggler') ?? false,
    tunnels: latest?.exploration?.locationId === 'catacombs',
    ...(latest?.exploration?.locationId === 'returning_a_favour' ? { freeHireReportId: latest.id } : {}),
  }
}

export function explorationFaction(warbandId: string): 'skaven' | 'possessed' | 'undead' | 'other' {
  if (warbandId.startsWith('skaven_of_clan_')) return 'skaven'
  if (warbandId === 'cult_of_the_possessed') return 'possessed'
  if (warbandId === 'the_undead') return 'undead'
  return 'other'
}
