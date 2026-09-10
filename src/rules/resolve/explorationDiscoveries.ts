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
  applied?: { scenario_benefits?: string[] }
  exploration: { locationId?: string | null; benefits?: string[] } | null
}
/** Reports must be oldest first. A skipped exploration does not consume a Straggler die. */
export function explorationDiscoveries(reports: DiscoveryReport[]): ExplorationDiscoveries {
  const latest = reports.at(-1)
  let straggler = false
  for (const report of reports) {
    if (report.exploration !== null) straggler = report.exploration.benefits?.includes('straggler') ?? false
    if (report.applied?.scenario_benefits?.includes('harpy_straggler')) straggler = true
  }
  return {
    catacombs: reports.some(r => r.exploration?.locationId === 'entrance_to_the_catacombs'),
    straggler,
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
