import type { ItemRow, ReportApplied } from '../../../domain'
import { unitGainsExperience } from '../../../rules/data/campaignRules'
import { planReward, type RewardChoices } from '../../../rules/resolve/rewards'
import type { RosterWarband } from '../../../rules/types/roster'
import type { LocationXpAward } from './locationXp'
export interface KidnappedDraft {
  outcome?: 'none' | 'held' | 'rescued' | 'sacrificed'
  xpDie?: number | null
  xp?: Record<string, number>
  shadowlord?: Record<string, RewardChoices>
  sacrificeReason?: string
}
export function kidnappedRewards(state: KidnappedDraft = {}, roster: RosterWarband, items: readonly ItemRow[]) {
  const eligible = roster.heroes.filter(h => h.status === 'active' && unitGainsExperience(h.unitTemplateId))
  const rewards = { eligible, total: null as number | null, gold: 0, xpAwards: [] as LocationXpAward[], heroes: [] as ReportApplied['heroes'], awardedItems: [] as NonNullable<ReportApplied['awarded_items']>, itemPatches: [] as ReportApplied['item_patches'], removeIds: [] as string[], notes: [] as string[], problems: [] as string[] }
  if (!['none', 'held', 'rescued', 'sacrificed'].includes(state.outcome ?? '')) { rewards.problems.push('Record the fate of the sacrificial victim for your warband.'); return rewards }
  if (state.outcome === 'none') return rewards
  const label = state.outcome === 'held' ? 'Possession of the living victim' : state.outcome === 'rescued' ? 'Victim rescued off the table' : 'Victim sacrificed'
  rewards.notes.push(`Kidnapped: ${label}.`)
  if (state.outcome === 'sacrificed' && roster.warbandTemplateId !== 'cult_of_the_possessed' && !state.sacrificeReason?.trim()) rewards.problems.push('Record the table’s exception for a different warband conducting the Possessed ritual.')
  if (state.sacrificeReason?.trim()) rewards.notes.push(`Agreed scenario adaptation: ${state.sacrificeReason.trim()}`)
  if (state.outcome === 'rescued') rewards.gold = 50
  rewards.total = state.outcome === 'held' ? 1 : state.xpDie && Number.isInteger(state.xpDie) && state.xpDie >= 1 && state.xpDie <= 6 ? state.xpDie : null
  if (rewards.total === null) rewards.problems.push('Roll the D6 for the Kidnapped experience reward.')
  else {
    const allocations = Object.entries(state.xp ?? {})
    if (allocations.some(([id, n]) => !Number.isInteger(n) || n < 0 || (n > 0 && !eligible.some(h => h.id === id))) || allocations.reduce((n, [, v]) => n + v, 0) !== rewards.total) rewards.problems.push(`Allocate all ${rewards.total} reward experience to living Heroes of this warband.`)
    else for (const [id, amount] of allocations) if (amount) { const hero = eligible.find(h => h.id === id)!; rewards.xpAwards.push({ id, name: hero.name, amount, reason: `Kidnapped — ${label}${state.outcome !== 'held' ? ` (D6 ${state.xpDie})` : ''}` }) }
  }
  if (state.outcome !== 'sacrificed') return rewards
  const selected = Object.entries(state.shadowlord ?? {})
  if (selected.length > 2) { rewards.problems.push('At most two different Heroes may seek a Shadowlord reward for the sacrifice.'); return rewards }
  let current = roster
  for (const [id, choices] of selected) {
    const hero = current.heroes.find(h => h.id === id && h.status === 'active')
    if (!hero) { rewards.problems.push('Choose living Heroes of this warband for the optional Shadowlord rewards.'); continue }
    const plan = planReward(current, hero, choices, false)
    if (!plan.result) { rewards.problems.push(`${hero.name}: finish the Shadowlord reward’s dice and choices.`); continue }
    const next = plan.result.hero
    current = plan.result.roster
    rewards.notes.push(`${hero.name}: optional sacrifice reward, D6 ${choices.dice.join(' + ')}. ${plan.result.summary}`)
    rewards.heroes.push({ id, patch: { stats: next.stats, skills: next.skillIds, spells: next.spellIds, flags: next.flags, status: next.status, notes: next.notes ?? '' } })
    const held = items.filter(i => i.holder_type === 'hero' && i.holder_id === id)
    if (next.status !== 'active') rewards.removeIds.push(...held.map(i => i.id))
    else {
      for (const row of held) {
        const kept = next.equipment.some(i => i.itemId === row.item_rules_id && (i.customName ?? '') === (row.custom_name ?? '') && (i.notes ?? '') === row.notes)
        if (!kept) rewards.itemPatches.push({ id: row.id, holder_type: 'stash', holder_id: null })
      }
      for (const item of next.equipment.filter(i => !hero.equipment.includes(i))) rewards.awardedItems.push({ holder_type: 'hero', holder_id: id, item_rules_id: item.itemId, custom_name: item.customName ?? null, quantity: item.quantity, notes: item.notes ?? `Kidnapped reward for ${hero.name}` })
    }
  }
  return rewards
}
