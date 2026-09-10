import type { ReportApplied } from '../../../domain/report'
export interface EncampmentDraft {
  role?: 'attacker' | 'defender'
  captured?: boolean
  defenderId?: string
  camp?: string
  treatment?: 'destroy' | 'occupy'
  eligible?: boolean
  reviewed?: boolean
  transfers?: NonNullable<ReportApplied['scenario_item_transfers']>
}
/** Encampment Raid, TC28: claim existing stashed equipment, never a new copy of carried kit. */
export function encampmentRewards(state: EncampmentDraft, won: boolean, opponents: {id:string;name?:string}[]) {
  const out = { notes: [] as string[], problems: [] as string[], transfers: [] as NonNullable<ReportApplied['scenario_item_transfers']> }
  if (!['attacker','defender'].includes(state.role ?? '')) out.problems.push('Choose whether you attacked or defended the encampment.')
  if (state.captured === undefined) out.problems.push('Record whether the attackers captured the camp.')
  if (state.role === 'defender') {
    if (state.captured && won) out.problems.push('A defending victory cannot also award the camp to the attackers. Review the outcome.')
    out.notes.push(state.captured ? 'Encampment lost: the victorious attacker claims the stash and chooses whether to destroy or occupy the camp. The defender must roll for a new camp using the settlement Housing chart; record that separately under the optional encampment rules.' : 'The camp was not captured; no stash changes.')
    return out
  }
  if (!state.captured) { out.notes.push('No captured camp or stash reward.'); return out }
  if (!won) out.problems.push('Only the victorious attacker can claim the captured camp and stash.')
  const defender = opponents.find(o => o.id === state.defenderId)
  if (!defender) out.problems.push('Select the defending warband whose camp was captured.')
  if (!state.camp?.trim()) out.problems.push('Name the captured camp or its settlement.')
  if (!['destroy','occupy'].includes(state.treatment ?? '')) out.problems.push('Choose whether to destroy or occupy the captured camp.')
  if (state.treatment === 'occupy' && !state.eligible) out.problems.push('Confirm that your warband is allowed to occupy this camp under the settlement rules.')
  if (!state.reviewed) out.problems.push('Review and confirm the defender’s complete stashed equipment, including an empty stash.')
  const seen = new Set<string>()
  for (const t of state.transfers ?? []) {
    if (seen.has(t.item_id) || t.from_warband_id !== state.defenderId || t.expected.holder_type !== 'stash' || !Number.isInteger(t.quantity) || t.quantity < 1 || t.quantity !== t.expected.quantity || !t.reason.trim()) out.problems.push('Review the complete stash again; each stack must be transferred once in full.')
    else out.transfers.push(t)
    seen.add(t.item_id)
  }
  out.notes.push(`Captured camp: ${state.camp?.trim() || 'pending'} (${defender?.name || 'defender pending'}); ${state.treatment === 'occupy' ? 'occupied, settlement eligibility confirmed' : 'destroyed'}. Defender must roll for a new camp. Existing stashed equipment transfers with this report; carried equipment and treasury gold/wyrdstone are not included in that equipment list. Any agreed wider interpretation of “stash” must be recorded separately.`)
  return out
}
