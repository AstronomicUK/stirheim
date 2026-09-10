import type { ScenarioRewardRule } from '../../../rules/data/campaign/scenarioRewardRules'
import type { ScenarioCampaignEffect, ScenarioCampaignState } from '../../../rules/resolve/scenarioCampaignEffects'
export interface CaravanDraft { role?: 'attacker' | 'defender' | 'traitor'; escaped?: number | null; looted?: number | null; penaltyDie?: number | null; overrideReason?: string; cargoDie?: number | null; heldShards?: number | null; merchantKept?: boolean; friendVariant?: boolean; rounding?: 'up' | 'down' }
export function caravanRewards(state: CaravanDraft, archive: boolean, result: 'won' | 'lost' | 'draw' | null, campaignId?: string, history?: ScenarioCampaignState) {
  const out = { rule: null as ScenarioRewardRule | null, effects: {} as ScenarioCampaignEffect, problems: [] as string[], notes: [] as string[] }
  const valid = (n: number | null | undefined, min: number, max: number): n is number => n != null && Number.isInteger(n) && n >= min && n <= max
  if (!['attacker', 'defender', ...(archive ? [] : ['traitor'])].includes(state.role ?? '')) { out.problems.push('Choose your Caravan role.'); return out }
  if (archive) {
    if (!valid(state.cargoDie, 1, 3) || !valid(state.heldShards, 0, (state.cargoDie ?? 0) + 1) || state.merchantKept === undefined) { out.problems.push('Record the original cargo D3, shards your warband retained and whether the merchant kept his cargo.'); return out }
    if (state.merchantKept && state.heldShards > 0) out.problems.push('The merchant cannot keep his cargo while your warband also claims its shards.')
    const finds: Extract<ScenarioRewardRule, { kind: 'hoard' }>['finds'] = []
    if (state.heldShards) finds.push({ id: 'cargo', label: 'Retained cargo shards', kind: 'shards', quantity: state.heldShards })
    if (state.role === 'defender' && state.merchantKept) finds.push({ id: 'guard-shard', label: 'Guard payment shard', kind: 'shards', quantity: 1 }, { id: 'guard-gold', label: 'Guard payment', kind: 'gold', quantity: { count: 1, sides: 6, multiplier: 5 } })
    if (state.role === 'defender') {
      if (state.friendVariant === undefined) out.problems.push('Record whether A Friend in the Business was used.')
      else if (state.friendVariant && result !== 'draw') {
        if (!['up', 'down'].includes(state.rounding ?? '')) out.problems.push('Agree how to round the 20% equipment price adjustment to whole gold crowns.')
        else if (result) out.effects.caravanTrade = { percent: result === 'won' ? -20 : 20, rounding: state.rounding! }
      }
    }
    out.notes.push(`Archive Caravan: ${state.role}; original cargo D3 ${state.cargoDie} +1 = ${state.cargoDie + 1}; own retained shards ${state.heldShards}; merchant kept cargo: ${state.merchantKept ? 'yes' : 'no'}.`)
    if (state.role === 'defender') out.notes.push(`A Friend in the Business: ${state.friendVariant ? result === 'draw' ? 'used; tie, no price change' : `used; equipment ${result === 'won' ? '20% cheaper' : '20% dearer'} until the next battle starts; agreed rounding ${state.rounding}` : 'not used'}.`)
    out.rule = { kind: 'hoard', winnerOnly: false, note: 'Claim only actual retained cargo, or the merchant’s guard payment. These are distinct rewards.', finds }
    return out
  }
  if (!valid(state.escaped, 0, 3) || !valid(state.looted, 0, 3) || state.escaped + state.looted > 3) { out.problems.push('Record escaped wagons and wagons looted by your warband, without counting a wagon twice (three in total).'); return out }
  if (state.role !== 'attacker' && campaignId && history?.caravanBannedCampaigns.includes(campaignId) && !state.overrideReason?.trim()) out.problems.push('This warband previously betrayed a caravan and cannot escort another in this campaign. Record an agreed exception if your table deliberately waived that restriction.')
  if (state.role !== 'traitor') {
    const expected = state.escaped >= 2 ? 'defender' : 'attacker'
    if (result !== (state.role === expected ? 'won' : 'lost') && !state.overrideReason?.trim()) out.problems.push(`With ${state.escaped} wagons escaped, the ${expected} wins regardless of routing. Correct the result or record your table’s agreed exception.`)
    if (state.role === 'defender' && state.looted > 0) out.problems.push('A defender who looted wagons must use the traitorous defender role.')
  }
  const finds: Extract<ScenarioRewardRule, { kind: 'hoard' }>['finds'] = []
  if (state.role === 'defender') {
    finds.push({ id: 'base', label: 'Starting escort payment', kind: 'gold', quantity: { count: 5, sides: 6 } })
    for (let i = 0; i < state.escaped; i++) finds.push({ id: `escaped-${i}`, label: `Escaped wagon ${i + 1} payment`, kind: 'gold', quantity: { count: 5, sides: 6 } })
    if (state.escaped === 3) finds.push({ id: 'all', label: 'All three escaped bonus', kind: 'gold', quantity: { count: 5, sides: 6 } })
  } else {
    for (let i = 0; i < state.looted; i++) finds.push({ id: `loot-${i}`, label: `Looted wagon ${i + 1}`, kind: 'gold', quantity: { count: 3, sides: 6 } })
    if (state.role === 'traitor') {
      if (!valid(state.penaltyDie, 1, 6)) out.problems.push('Roll D6 for the duration of the traitor’s rare-item search penalty.')
      else out.effects.caravanTreachery = state.penaltyDie
      out.notes.push(`Traitorous defender: no escort payments; barred from escorting another caravan in this campaign; −1 rarity searches for the next ${state.penaltyDie ?? '?'} games.`)
    }
  }
  out.notes.push(`The Caravan: ${state.role}; ${state.escaped} wagons escaped, ${state.looted} looted by this warband.${state.overrideReason?.trim() ? ` Agreed exception: ${state.overrideReason.trim()}` : ''}`)
  out.rule = { kind: 'hoard', winnerOnly: false, note: 'Roll each qualifying payment separately. Wagons, drivers and horses are not permanent recruits.', finds }
  return out
}
