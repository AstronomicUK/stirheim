/** Discoveries are derived from applied reports, so withdrawal/amendment also changes them.
 * Pending reports do not grant benefits. Repeated permanent discoveries never stack.
 */
export interface ExplorationDiscoveries {
  catacombs: boolean
  straggler: boolean
  tunnels: boolean
  freeHireRewards?: { id: string; choices: string[]; label: string }[]
  freeHireReportId?: string
}
export interface DiscoveryReport {
  id: string
  applied?: { scenario_benefits?: string[]; scenario_free_hire?: {choices: string[]} }
  exploration: { locationId?: string | null; benefits?: string[] } | null
}
export interface DatedDiscoveryReport extends DiscoveryReport {
  matchId: string
  submittedAt: string
  battleAt?: string
}
/** Battle order survives later report amendments. Legacy reports without a start use their filing time. */
export function discoveryHistory(reports: DatedDiscoveryReport[], excludeMatchId?: string, cutoffAt?: string): DiscoveryReport[] {
  const time=(r:DatedDiscoveryReport)=>Date.parse(r.battleAt??r.submittedAt)
  const current=reports.find(r=>r.matchId===excludeMatchId)
  const cutoff=cutoffAt?Date.parse(cutoffAt):current?time(current):undefined
  return reports.filter(r=>r.matchId!==excludeMatchId&&(cutoff===undefined||time(r)<cutoff))
    .sort((a,b)=>time(a)-time(b)||a.id.localeCompare(b.id))
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
    freeHireRewards: reports.filter(r=>r.applied?.scenario_free_hire).map(r=>({id:`${r.id}:brigands`,choices:r.applied!.scenario_free_hire!.choices,label:'Brigands in the Pasturelands'})),
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

export function availableFreeHires(roster: {explorationDiscoveries?: ExplorationDiscoveries; hiredSwords: {flags: {returningFavourReportId?: string}}[]}, hiredSwordId: string) {
  const rewards = [...(roster.explorationDiscoveries?.freeHireRewards ?? []).filter(r => r.choices.includes(hiredSwordId))]
  const favour = roster.explorationDiscoveries?.freeHireReportId
  if (favour) rewards.push({ id: favour, choices: [hiredSwordId], label: 'Returning a Favour' })
  return rewards.filter(r => !roster.hiredSwords.some(h => h.flags.returningFavourReportId === r.id))
}
