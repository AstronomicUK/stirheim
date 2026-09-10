import type { ReportDraft } from './state'
export interface HarpyDraft { defeated?: boolean; shards?: number | null; stragglerDie?: number | null; stragglerUse?: 'now' | 'next' }
export function harpyRewards(draft: ReportDraft) {
  const state = draft.scenarioRewards?.harpy ?? {}
  const eligible = draft.result === 'won' && state.defeated === true
  const result = { eligible, shards: 0, stragglerNow: false, stragglerNext: false, notes: [] as string[], problems: [] as string[] }
  if (draft.result !== 'won') return result
  if (state.defeated === undefined) result.problems.push('Record whether all three Harpies were taken out before the rival warbands routed.')
  if (!eligible) return result
  if (!Number.isInteger(state.shards) || state.shards! < 1 || state.shards! > 3) result.problems.push('Record the 1–3 wyrdstone shards originally placed in the nest.')
  else result.shards = state.shards!
  if (!Number.isInteger(state.stragglerDie) || state.stragglerDie! < 1 || state.stragglerDie! > 6) result.problems.push('Roll the nest’s D6 for finding a Straggler.')
  else if (state.stragglerDie! >= 5) {
    if (!['now', 'next'].includes(state.stragglerUse ?? '')) result.problems.push('Choose whether the rescued Straggler helps this exploration or the next.')
    result.stragglerNow = state.stragglerUse === 'now'; result.stragglerNext = state.stragglerUse === 'next'
  }
  result.notes.push(`Harpy nest: ${result.shards} setup shards recovered. Straggler D6 ${state.stragglerDie ?? 'unrolled'}${state.stragglerDie! >= 5 ? `; helps ${state.stragglerUse === 'now' ? 'this exploration' : 'the next exploration'}` : '; not found'}.`)
  return result
}
