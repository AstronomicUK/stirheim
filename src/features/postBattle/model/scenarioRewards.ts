import { scenarioRewardRule } from '../../../rules/data/campaign/scenarioRewardRules'
import type { ReportDraft, FoundItem } from './state'
import type { Participants } from './participants'
import { foundItemFromName } from './exploration'

export interface ScenarioRewardDraft {
  conditions?: Record<string, boolean | undefined>
  counters?: number | null
  buildingHeroes?: string[]
  ownStarting?: number | null
  enemyStarting?: number | null
  enemyHeroesOut?: number | null
  princeSurvived?: boolean
  finds?: Record<string, { discovery: number | null; discoveryDice?: (number | null)[]; dice: (number | null)[] }>
}
const valid = (n: number | null | undefined, min: number, max = Number.MAX_SAFE_INTEGER): n is number => n != null && Number.isSafeInteger(n) && n >= min && n <= max
export function scenarioRewards(draft: ReportDraft, scenarioId: string | null | undefined, participants: Participants) {
  const rule = scenarioRewardRule(scenarioId)
  const state = draft.scenarioRewards ?? {}
  const rewards = { gold: 0, shards: 0, items: [] as FoundItem[], notes: [] as string[], problems: [] as string[] }
  if (!rule) return rewards
  if (rule.kind === 'counters') {
    const count = state.counters ?? 0
    if (!valid(count, 0, rule.max)) rewards.problems.push(`Enter the number of counters held at the end${rule.max ? ` (0–${rule.max})` : ''}.`)
    else { rewards.shards = count; rewards.notes.push(`Scenario counters held at the end: ${count}; +${count} wyrdstone.`) }
  } else if (rule.kind === 'building') {
    const ids = [...new Set(state.buildingHeroes ?? [])]
    const eligible = participants.heroes.filter(h => !draft.heroesOut.includes(h.id))
    if (ids.some(id => !eligible.some(h => h.id === id))) rewards.problems.push('Check the objective-building Heroes: choose participating Heroes who were not taken out of action.')
    else {
      rewards.shards = Math.min(3, ids.length)
      rewards.notes.push(`Defend the Find: ${ids.map(id => eligible.find(h => h.id === id)!.name).join(', ') || 'no Heroes'} inside the building; +${rewards.shards} wyrdstone (maximum 3).`)
    }
  } else if (rule.kind === 'encounter') {
    if (!valid(state.ownStarting, 1, 3) || !valid(state.enemyStarting, 1, 3) || !valid(state.enemyHeroesOut, 0)) rewards.problems.push('Chance Encounter: enter both starting D3 shard results and the number of enemy Heroes taken out of action.')
    else {
      const ownOut = participants.heroes.filter(h => draft.heroesOut.includes(h.id)).length
      const kept = Math.max(0, state.ownStarting - ownOut)
      const captured = Math.min(state.enemyStarting, state.enemyHeroesOut)
      rewards.shards = kept + captured
      rewards.notes.push(`Chance Encounter: started with ${state.ownStarting} shards; ${ownOut} own Heroes out of action, retained ${kept}. Opponent started with ${state.enemyStarting}; ${state.enemyHeroesOut} enemy Heroes out of action, captured ${captured}. Total +${rewards.shards} wyrdstone.`)
    }
  } else if (rule.kind === 'hoard') {
    if (rule.winnerOnly !== false && draft.result !== 'won') { rewards.notes.push('Scenario treasure: no winning-warband reward.'); return rewards }
    if (rule.condition) {
      const met = state.conditions?.[rule.condition.id]
      if (met === undefined) { rewards.problems.push(rule.condition.question); return rewards }
      rewards.notes.push(`${rule.condition.question} ${met ? 'Yes' : 'No; no hoard reward.'}`)
      if (!met) return rewards
    }
    if (rule.needsRescue && state.princeSurvived === undefined) { rewards.problems.push('Record whether the merchant’s son survived.'); return rewards }
    if (rule.needsRescue && !state.princeSurvived) { rewards.notes.push('The Lost Prince: the merchant’s son died; no reward.'); return rewards }
    for (const find of rule.finds) {
      const entry = state.finds?.[find.id]
      const discoveryCount = find.discoveryDice ?? 1
      const discoveryDice = discoveryCount === 1 ? [entry?.discovery ?? null] : entry?.discoveryDice ?? []
      const discovery = discoveryDice.reduce<number>((sum, d) => sum + (d ?? 0), 0)
      const discoveryNote = discoveryCount === 1 ? `D6 ${discovery}` : `${discoveryCount}D6 ${discoveryDice.join(', ')} (total ${discovery})`
      if (find.threshold) {
        if (discoveryDice.length !== discoveryCount || discoveryDice.some(d => !valid(d, 1, 6))) { rewards.problems.push(`${find.label}: enter the separate discovery ${discoveryCount}D6.`); continue }
        if (discovery < find.threshold) { rewards.notes.push(`${find.label}: discovery ${discoveryNote}, needed ${find.threshold}+; not found.`); continue }
      }
      let amount: number
      let diceNote = ''
      if (typeof find.quantity === 'number') amount = find.quantity
      else {
        const { count, sides } = find.quantity
        const dice = entry?.dice ?? []
        if (dice.length !== count || dice.some(d => !valid(d, 1, sides))) { rewards.problems.push(`${find.label}: enter all ${count}D${sides} for the quantity.`); continue }
        amount = dice.reduce<number>((sum, d) => sum + d!, 0) * (find.quantity.multiplier ?? 1) + (find.quantity.bonus ?? 0)
        diceNote = `; ${count}D${sides} rolled ${dice.join(', ')}`
      }
      if (find.kind === 'gold') rewards.gold += amount
      else if (find.kind === 'shards') rewards.shards += amount
      else rewards.items.push(foundItemFromName(find.itemName!.replace('{amount}', String(amount)), find.quantityIsValue ? 1 : amount))
      rewards.notes.push(`${find.label}: ${find.threshold ? `discovery ${discoveryNote}, needed ${find.threshold}+` : 'automatically found'}${diceNote}; +${find.quantityIsValue ? `1 item worth ${amount} gc` : amount}${find.kind === 'gold' ? ' gc' : find.kind === 'shards' ? ' wyrdstone' : ' to stash'}.`)
    }
  }
  return rewards
}
