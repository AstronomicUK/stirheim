import { absentGroupModels } from '../../../rules/resolve/groupAbsences'
import type { ReportApplied } from '../../../domain'
import type { ReportContext } from './derive'
import type { ReportDraft } from './state'

export function abominationCasualties(draft: ReportDraft, ctx: ReportContext) {
  return ctx.roster.henchmenGroups.filter(g => g.unitTemplateId === 'necrarchs_abomination').flatMap(group =>
    Array.from({ length: Math.min(group.size - absentGroupModels(group), draft.groupsOut[group.id] ?? 0) }, (_, index) => ({ group, index, key: `${group.id}:${index}` })))
}
export function applyAbominationAftermath(draft: ReportDraft, ctx: ReportContext, applied: ReportApplied) {
  const problems: string[] = [], notes: string[] = []
  const rewards: NonNullable<ReportApplied['abomination_rewards']> = []
  for (const { group, index, key } of abominationCasualties(draft, ctx)) {
    const choice = draft.abominationRecipients?.[key]
    const opponent = ctx.opponents?.find(o => o.id === choice?.warbandId)
    if (!opponent || !choice?.modelName.trim()) {
      problems.push(`${group.name}, model ${index + 1}: record the opposing warrior who took it down and receives its shard.`)
      continue
    }
    rewards.push({ group_id: group.id, model_index: index, recipient_id: opponent.id, model_name: choice.modelName.trim() })
    notes.push(`${group.name}, model ${index + 1}: ${choice.modelName.trim()} (${opponent.name}) receives 1 wyrdstone shard. The Abomination needs 1 new shard to reanimate before it can fight again.`)
  }
  for (const group of ctx.roster.henchmenGroups.filter(g => g.unitTemplateId === 'necrarchs_abomination')) {
    const count = abominationCasualties(draft, ctx).filter(c => c.group.id === group.id).length
    if (!count) continue
    let patch = applied.groups.find(g => g.id === group.id)
    if (!patch) { patch = { id: group.id, patch: {} }; applied.groups.push(patch) }
    patch.patch.campaign_state = { ...group.campaignState, ...patch.patch.campaign_state, reanimationOwed: (group.campaignState?.reanimationOwed ?? 0) + count }
  }
  if (rewards.length) applied.abomination_rewards = rewards
  return { problems, notes }
}
