import {raidsRewards,type RaidsDraft,type RaidSurvivors} from './raidsRewards'
import {stopThiefRewards,type StopThiefDraft} from './stopThiefRewards'
import { rockRewards, type RockDraft, type RockRoster } from './rockRewards'
import { encampmentRewards, type EncampmentDraft } from './encampmentRewards'
import { forbiddenSquareRewards, type ForbiddenSquareDraft } from './forbiddenSquareRewards'
import { gatheringRewardProblems } from '../../../rules/resolve/gatheringControl'
import { brigandsRewards, type BrigandsDraft } from './brigandsRewards'
import { huntersRewards, type HuntersDraft } from './huntersRewards'
import { caravanRewards, type CaravanDraft } from './caravanRewards'
import { docksRewards, type DocksDraft } from './docksRewards'
import { muleRewards, type MuleDraft } from './muleRewards'
import { harpyRewards, type HarpyDraft } from './harpyRewards'
import type { RitualZombiesDraft } from './scenarioRecruits'
import type { KidnappedDraft } from './kidnappedRewards'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import { explorationFaction } from '../../../rules/resolve/explorationDiscoveries'
import { ferryRewards, type FerryRewardDraft } from './ferryRewards'
import { MAGICAL_ARTEFACTS } from '../../../rules/data/campaign/exploration'
import type { ArtefactDiscovery } from '../../../api/artefacts'
import { scenarioRewardRule, type ScenarioRewardRule } from '../../../rules/data/campaign/scenarioRewardRules'
import type { ReportDraft, FoundItem } from './state'
import type { Participants } from './participants'
import { foundItemFromName } from './exploration'

export interface ScenarioRewardDraft {
  raids?: RaidsDraft
  stopThief?: StopThiefDraft
  rock?: RockDraft
  encampment?: EncampmentDraft
  forbiddenSquare?: ForbiddenSquareDraft
  gathering?: import("../../../rules/resolve/gatheringControl").GatheringReward
  brigands?: BrigandsDraft
  hunters?: HuntersDraft
  caravan?: CaravanDraft
  docks?: DocksDraft
  mule?: MuleDraft
  harpy?: HarpyDraft
  ritualZombies?: RitualZombiesDraft
  kidnapped?: KidnappedDraft
  herald?: { splinters?: number | null; sword?: 'none' | 'sell' | 'keep'; keepReason?: string }
  stakeOut?: { mode?: 'income-only' | 'also-explore'; reason?: string; die?: number | null }
  ferry?: FerryRewardDraft
  recipe?: { pies?: number | null; cartPies?: number | null; turnsInGeefer?: boolean; dice?: (number | null)[] }
  tableCountRoll?: number | null
  containers?: string[]
  defendingHeroes?: number | null
  startingDie?: number | null
  horses?: number | null
  lostHorsesDie?: number | null
  branch?: string
  unclaimedBooty?: Record<string, boolean | undefined>
  bountyCount?: number | null
  bountyDice?: (number | null)[]
  repeated?: { itemChoice?: string; roll: number | null; tableDice?: (number | null)[]; dice: (number | null)[] }[]
  conditions?: Record<string, boolean | undefined>
  counters?: number | null
  buildingHeroes?: string[]
  ownStarting?: number | null
  enemyStarting?: number | null
  enemyHeroesOut?: number | null
  princeSurvived?: boolean
  finds?: Record<string, { discovery: number | null; unitValueDice?: (number | null)[]; items?: string[]; multiplier?: number | null; multiplierReason?: string; artefactRoll?: number | null; artefactOverrideReason?: string; discoveryDice?: (number | null)[]; dice: (number | null)[] }>
}
const valid = (n: number | null | undefined, min: number, max = Number.MAX_SAFE_INTEGER): n is number => n != null && Number.isSafeInteger(n) && n >= min && n <= max
export function scenarioRepeatedEntries(rule: Extract<ScenarioRewardRule, { kind: 'repeated' }>, state: ScenarioRewardDraft): NonNullable<ScenarioRewardDraft['repeated']> {
  return state.repeated ?? Array.from({ length: rule.countSides && valid(state.tableCountRoll, 1, rule.countSides) ? state.tableCountRoll : rule.requiredCount ?? 0 }, () => ({ roll: null, dice: [] as (number | null)[] }))
}
export function scenarioTableRoll(rule: Extract<ScenarioRewardRule, { kind: 'repeated' }>, entry: NonNullable<ScenarioRewardDraft['repeated']>[number]): number | null {
  if (!rule.tableDice || rule.tableDice === 1) return valid(entry.roll, 1, 6) ? entry.roll : null
  const dice = entry.tableDice ?? []
  return dice.length === rule.tableDice && dice.every(d => valid(d, 1, 6)) ? dice.reduce<number>((n, d) => n + d!, 0) : null
}
export function scenarioHoardFinds(rule: Extract<ScenarioRewardRule, { kind: 'hoard' }>, draft: ReportDraft, participants: Participants) {
  const containerFinds = rule.containers?.filter(c => draft.scenarioRewards?.containers?.includes(c.id)).flatMap(c => c.finds.map(f => ({ ...f, id: `${c.id}:${f.id}`, label: `${c.label} — ${f.label}` })))
  const finds = containerFinds ?? (rule.branches ? rule.branches.options.find(b => b.id === draft.scenarioRewards?.branch)?.finds ?? [] : rule.finds)
  if (!rule.repeatPerStandingHero) return finds
  const heroes = participants.heroes.filter(h => !draft.heroesOut.includes(h.id)).slice(0, 6)
  return [...(rule.onceFinds ?? []), ...heroes.flatMap(h => finds.map(f => ({ ...f, id: `${h.id}:${f.id}`, label: `${h.name} — ${f.label}` })))]
}
export function canKeepHeraldSword(warbandId: string) {
  return ['possessed', 'undead', 'skaven'].includes(explorationFaction(warbandId)) || /undead|skaven|beastm[ae]n/i.test(findWarbandTemplate(warbandId)?.race ?? '')
}
export interface ScenarioRewardsResult { artefacts: { roll: number; overrideReason?: string }[]; gold: number; shards: number; items: FoundItem[]; notes: string[]; problems: string[] }
export function scenarioRewards(draft: ReportDraft, scenarioId: string | null | undefined, participants: Participants, context?: { raidSurvivors?: RaidSurvivors; campaignId?: string; roster?: RockRoster; opponents?: { id: string; name?:string }[]; artefacts?: ArtefactDiscovery[]; artefactsError?: string; reportId?: string }, ruleOverride?: ScenarioRewardRule): ScenarioRewardsResult {
  let rule = ruleOverride ?? scenarioRewardRule(scenarioId)
  const state = draft.scenarioRewards ?? {}
  const rewards = { artefacts: [] as { roll: number; overrideReason?: string }[], gold: 0, shards: 0, items: [] as FoundItem[], notes: [] as string[], problems: [] as string[] }
  if (!rule) return rewards
  if (scenarioId === 'happy_harpy_hunting_grounds' && !ruleOverride) {
    const harpy = harpyRewards(draft)
    rewards.problems.push(...harpy.problems); rewards.notes.push(...harpy.notes); rewards.shards += harpy.shards
    if (!harpy.eligible) return rewards
  }
  if (rule.kind === 'repeated' && rule.extraPerWarband) {
    if (!context?.opponents) { rewards.problems.push('Load the battle participants before calculating the bandit count.'); return rewards }
    rule = { ...rule, requiredCount: (rule.requiredCount ?? 0) + rule.extraPerWarband * (new Set(context.opponents.map(o => o.id)).size + 1) }
  }
  if(rule.kind==='raids')return {...rewards,...raidsRewards(state.raids??{},context?.raidSurvivors??{warriors:[],groups:[]})}
  if(rule.kind==='stop-thief')return {...rewards,...stopThiefRewards(state.stopThief??{},draft.result==='won',context?.roster?.id??'',[{id:context?.roster?.id??'',name:context?.roster?.name??'This warband'},...(context?.opponents??[]).map(o=>({id:o.id,name:o.name??'Opponent'}))])}
  if(rule.kind==='rock')return {...rewards,...rockRewards(state.rock??{},draft.result==='won',context?.roster??{warbandTemplateId:''})}
  if(rule.kind==='encampment')return {...rewards,...encampmentRewards(state.encampment??{},draft.result==='won',context?.opponents??[])}
  if(rule.kind==='forbidden-square')return {...rewards,...forbiddenSquareRewards(state.forbiddenSquare??{},[context?.roster?.id??'',...(context?.opponents??[]).map(o=>o.id)],context?.roster?.id??'')}
  if(rule.kind==='gathering') {const g=state.gathering??{};rewards.problems.push(...gatheringRewardProblems(g,draft.result==='won',[context?.roster?.id??'',...(context?.opponents??[]).map(o=>o.id)]));rewards.notes.push(`Gathering of the Horde: ${g.ending==='rout'?'horde routed':g.ending?`${g.ending==='dirk'?'Dirk':'Valnor'} taken out`:'ending pending'}. ${draft.result==='won'&&g.controllerId?`Executioner’s Square controller: ${g.controllerId===context?.roster?.id?context?.roster?.name??'this warband':context?.opponents?.find(o=>o.id===g.controllerId)?.name??'the agreed winning warband'}. ${g.reason??''}`:'No extra treasure.'}`);return rewards}
  if (rule.kind === 'brigands') return {...rewards,...brigandsRewards(state.brigands??{},draft.result==='won',!!context?.campaignId)}
  if (rule.kind === 'hunters') return {...rewards,...huntersRewards(state.hunters??{},draft.result==='won',context?.opponents?new Set(context.opponents.map(o=>o.id)).size+1:6)}
  if (rule.kind === 'caravan') {
    const caravan = caravanRewards(state.caravan ?? {}, scenarioId === 'the_caravan_archive_pestilen', draft.result, context?.campaignId, context?.roster?.scenarioEffects)
    const found = caravan.rule ? scenarioRewards(draft, scenarioId, participants, context, caravan.rule) : rewards
    found.notes.unshift(...caravan.notes); found.problems.push(...caravan.problems)
    return found
  }
  if (rule.kind === 'docks') {
    const cargo = docksRewards(state.docks ?? {}, context?.opponents ? new Set(context.opponents.map(o => o.id)).size + 1 : undefined)
    return { ...rewards, gold: cargo.gold, items: cargo.items, notes: cargo.notes, problems: cargo.problems }
  }
  if (rule.kind === 'mule-train') {
    const mule = muleRewards(state.mule ?? {})
    if (!mule.rule) { rewards.problems.push(...mule.problems); return rewards }
    const found = scenarioRewards(draft, scenarioId, participants, context, mule.rule)
    found.notes.unshift(`${state.mule?.role}: ${state.mule?.recovered} of ${state.mule?.starting} mules led off. ${mule.rule.note}`)
    return found
  }
  if (rule.kind === 'choice') {
    const branch = rule.options.find(o => o.id === state.branch)
    if (!branch) { rewards.problems.push(rule.question); return rewards }
    const chosen = scenarioRewards(draft, scenarioId, participants, context, branch.rule)
    chosen.notes.unshift(`${rule.question} ${branch.label}.`)
    return chosen
  } else if (rule.kind === 'none') { rewards.notes.push(rule.note)
  } else if (rule.kind === 'kidnapped') {
    if (state.kidnapped?.outcome === 'rescued') { rewards.gold = 50; rewards.notes.push('Kidnapped: victim rescued off the table; 50 gc reward.') }
  } else if (rule.kind === 'herald') {
    const herald = state.herald ?? {}
    const max = Math.min(5, context?.opponents ? new Set(context.opponents.map(o => o.id)).size + 1 : 5)
    if (!valid(herald.splinters, 0, max)) rewards.problems.push(`Record 0–${max} Star Stone splinters carried off the table.`)
    else { rewards.shards = herald.splinters * 3; rewards.notes.push(`Star Stone splinters carried off: ${herald.splinters} ×3 = ${rewards.shards} wyrdstone.`) }
    if (!['none', 'sell', 'keep'].includes(herald.sword ?? '')) rewards.problems.push('Record whether your warband recovered the sword, and whether it was kept or handed over.')
    else if (herald.sword === 'sell') { rewards.gold = 100; rewards.notes.push('Recovered Sword of the Herald handed over for 100 gc; no sword added to the stash.') }
    else if (herald.sword === 'keep') {
      if (!canKeepHeraldSword(context?.roster?.warbandTemplateId ?? '') && !herald.keepReason?.trim()) rewards.problems.push('This warband is not in the printed sword-retention list. Hand it over, or record the referee’s agreed exception.')
      else { rewards.items.push(foundItemFromName('Sword of the Herald')); rewards.notes.push(`Recovered Sword of the Herald kept; no sale payment.${herald.keepReason?.trim() ? ` Referee’s exception: ${herald.keepReason.trim()}` : ''}`) }
    } else rewards.notes.push('This warband did not recover the Sword of the Herald.')
  } else if (rule.kind === 'stake-out') {
    const income = state.stakeOut ?? {}
    if (!['income-only', 'also-explore'].includes(income.mode ?? '') || !income.reason?.trim()) rewards.problems.push('Record the agreed Stake-Out exploration interpretation on the Outcome step.')
    else rewards.notes.push(`Stake-Out interpretation: ${income.mode === 'income-only' ? 'printed income replaces exploration' : 'printed income plus normal exploration'}. Table ruling: ${income.reason.trim()}`)
    if (draft.result === 'draw') rewards.notes.push('No printed draw income; any agreed draw reward is recorded separately.')
    else if (!valid(income.die, 1, 6)) rewards.problems.push('Roll the D6 for Stake-Out income.')
    else { rewards.shards = income.die + (draft.result === 'won' ? 1 : 0); rewards.notes.push(`Stake-Out income: D6 ${income.die}${draft.result === 'won' ? ' +1 for winning' : ''} = ${rewards.shards} wyrdstone.`) }
  } else if (rule.kind === 'recipe') {
    const recipe = state.recipe ?? {}, won = draft.result === 'won'
    const carried = recipe.pies, cart = won ? recipe.cartPies : 0
    if (!valid(carried, 0, 24) || !valid(cart, 0, 24) || carried + cart > 24) rewards.problems.push('Record unspoiled pies carried away and, if you won, those claimed from the cart (at most 24 pies in the game).')
    else { const gold = won ? Math.ceil((carried + cart) / 2) : carried; rewards.gold += gold; rewards.notes.push(`The Recipe: ${carried} intact pies carried away${won ? ` + ${cart} from the cart; winning rate, half rounded up` : '; non-winning rate, 1 gc each (routing does not lose them)'} = ${gold} gc.`) }
    if (won) {
      if (recipe.turnsInGeefer === undefined) rewards.problems.push('Record whether your warband is the one turning Geefer in.')
      else if (recipe.turnsInGeefer) {
        const dice = recipe.dice ?? []
        if (dice.length !== 5 || dice.some(d => !valid(d, 1, 6))) rewards.problems.push('Roll all 5D6 for turning Geefer in.')
        else { const gold = dice.reduce<number>((n, d) => n + d!, 0); rewards.gold += gold; rewards.notes.push(`This warband turns Geefer in: 5D6 ${dice.join(', ')} = ${gold} gc. Allied winners do not claim this payment again.`) }
      } else rewards.notes.push('This warband is not claiming the payment for turning Geefer in.')
    }
  } else if (rule.kind === 'ferry') {
    const ferry = ferryRewards(state.ferry ?? {}, draft.result === 'won')
    rewards.gold = ferry.gold; rewards.notes.push(...ferry.notes); rewards.problems.push(...ferry.problems)
  } else if (rule.kind === 'ambush') {
    const defender = state.conditions?.defender
    if (defender === undefined || !valid(state.startingDie, 1, 6) || !valid(state.defendingHeroes, 0)) rewards.problems.push('Record your side, the defender’s starting D6, and their starting Hero count.')
    else {
      const starting = Math.min(state.startingDie, state.defendingHeroes)
      if (defender) {
        const casualties = participants.heroes.filter(h => draft.heroesOut.includes(h.id)).length
        rewards.shards = Math.max(0, starting - casualties)
        rewards.notes.push(`Defender: D6 ${state.startingDie}, capped at ${state.defendingHeroes} Heroes = ${starting} shards; ${casualties} Hero casualties; retained ${rewards.shards}.`)
      } else if (!valid(state.enemyHeroesOut, 0, state.defendingHeroes)) rewards.problems.push('Record the number of defending Heroes your warband took out of action.')
      else { rewards.shards = Math.min(starting, state.enemyHeroesOut); rewards.notes.push(`Attacker: defender D6 ${state.startingDie}, capped at ${state.defendingHeroes} Heroes = ${starting} shards; ${state.enemyHeroesOut} enemy Hero casualties; captured ${rewards.shards}.`) }
    }
  } else if (rule.kind === 'horses') {
    if (!valid(state.horses, 0, 6)) rewards.problems.push('Record 0–6 successfully stolen horses.')
    else if (draft.routed && !valid(state.lostHorsesDie, 1, 3)) rewards.problems.push('Roll the D3 for horses lost while routing.')
    else {
      const lost = draft.routed ? Math.min(state.horses, state.lostHorsesDie! - 1) : 0
      const kept = state.horses - lost
      if (kept) rewards.items.push(foundItemFromName('Horse', kept))
      rewards.notes.push(`Stolen horses: ${state.horses}.${draft.routed ? ` Routed: D3 ${state.lostHorsesDie} − 1; lost ${lost}.` : ''} Kept ${kept} horses.`)
    }
  } else if (rule.kind === 'bounty') {
    if (rule.winnerOnly && draft.result !== 'won') { rewards.notes.push('No winning-warband bounty.'); return rewards }
    if (rule.condition) {
      const met = state.conditions?.[rule.condition.id]
      if (met === undefined) { rewards.problems.push(rule.condition.question); return rewards }
      rewards.notes.push(`${rule.condition.question} ${met ? 'Yes' : 'No; no bounty.'}`)
      if (!met) return rewards
    }
    if (!valid(state.bountyCount, 0)) rewards.problems.push(`Enter ${rule.label.toLowerCase()}.`)
    else { rewards.gold = state.bountyCount * rule.goldEach; rewards.notes.push(`${rule.label}: ${state.bountyCount} × ${rule.goldEach} gc = ${rewards.gold} gc.`) }
    if (rule.baseDice) {
      const dice = state.bountyDice ?? []
      if (dice.length !== rule.baseDice.count || dice.some(d => !valid(d, 1, 6))) rewards.problems.push('Enter the base payment dice.')
      else { const gold = dice.reduce<number>((sum, d) => sum + d!, 0) * rule.baseDice.multiplier; rewards.gold += gold; rewards.notes.push(`Base payment: ${rule.baseDice.count}D6 rolled ${dice.join(', ')} × ${rule.baseDice.multiplier} = ${gold} gc.`) }
    }
  } else if (rule.kind === 'repeated') {
    if (rule.winnerOnly && draft.result !== 'won') { rewards.notes.push('No winning-warband scenario reward.'); return rewards }
    if (rule.condition) {
      const met = state.conditions?.[rule.condition.id]
      if (met === undefined) { rewards.problems.push(rule.condition.question); return rewards }
      rewards.notes.push(`${rule.condition.question} ${met ? 'Yes' : 'No; no reward.'}`)
      if (!met) return rewards
    }
    if (rule.countSides && !valid(state.tableCountRoll, 1, rule.countSides)) { rewards.problems.push(`Roll D${rule.countSides} for the number of finds.`); return rewards }
    if (rule.attackerBonus && state.conditions?.attacker === undefined) { rewards.problems.push('Record whether your warband was the attacker.'); return rewards }
    const entries = scenarioRepeatedEntries(rule, state)
    const requiredCount = rule.countSides ? state.tableCountRoll : rule.requiredCount
    if (requiredCount && entries.length !== requiredCount) { rewards.problems.push(`Record ${requiredCount} ${rule.label.toLowerCase()} rolls.`); return rewards }
    if (rule.max && entries.length > rule.max) { rewards.problems.push(`At most ${rule.max} ${rule.label.toLowerCase()} rewards are available.`); return rewards }
    entries.forEach((entry, i) => {
      const roll = scenarioTableRoll(rule, entry)
      const row = rule.table.length === 1 ? rule.table[0] : roll !== null ? rule.table.find(r => roll + (state.conditions?.attacker ? rule.attackerBonus ?? 0 : 0) >= r.min && roll + (state.conditions?.attacker ? rule.attackerBonus ?? 0 : 0) <= r.max) : undefined
      const label = `${rule.label} ${i + 1}${rule.tableDice ? ` (${rule.tableDice}D6 ${entry.tableDice?.join(', ')}, total ${roll})` : ''}${rule.attackerBonus ? ` (D6 ${entry.roll}${state.conditions?.attacker ? ` +${rule.attackerBonus} attacker bonus` : ''})` : ''}`
      if (!row) { rewards.problems.push(`${label}: enter its D6 result.`); return }
      if (row.goldDice) {
        if (entry.dice.length !== row.goldDice || entry.dice.some(d => !valid(d, 1, 6))) { rewards.problems.push(`${label}: enter all ${row.goldDice}D6 gold dice.`); return }
        const gold = entry.dice.reduce<number>((sum, d) => sum + d!, 0) + (row.goldBonus ?? 0)
        rewards.gold += gold
        rewards.notes.push(`${label}${rule.table.length > 1 ? ` (D6 ${entry.roll})` : ''}: ${row.label}; ${row.goldDice}D6 rolled ${entry.dice.join(', ')}${row.goldBonus ? ` +${row.goldBonus}` : ''}; +${gold} gc.`)
      } else if (row.shardDice) {
        if (entry.dice.length !== row.shardDice || entry.dice.some(d => !valid(d, 1, 3))) { rewards.problems.push(`${label}: enter all ${row.shardDice}D3 shard dice.`); return }
        const shards = entry.dice.reduce<number>((sum, d) => sum + d!, 0)
        rewards.shards += shards
        rewards.notes.push(`${label}: ${row.shardDice}D3 rolled ${entry.dice.join(', ')}; +${shards} wyrdstone.`)
      } else if (row.itemName || row.itemOptions) {
        if (row.itemOptions && !row.itemOptions.includes(entry.itemChoice ?? "")) { rewards.problems.push(`${label}: choose the awarded item.`); return }
        let amount = typeof row.itemQuantity === 'number' ? row.itemQuantity : 1
        let diceNote = ''
        if (typeof row.itemQuantity === 'object') {
          const q = row.itemQuantity
          if (entry.dice.length !== q.count || entry.dice.some(d => !valid(d, 1, q.sides))) { rewards.problems.push(`${label}: enter ${q.count}D${q.sides} for the ${row.quantityIsValue ? 'value' : 'quantity'}.`); return }
          amount = entry.dice.reduce<number>((sum, d) => sum + d!, 0) * (q.multiplier ?? 1) + (q.bonus ?? 0)
          diceNote = `; ${q.count}D${q.sides} rolled ${entry.dice.join(', ')}${q.multiplier ? ` ×${q.multiplier}` : ''}`
        }
        const name = (row.itemOptions ? entry.itemChoice! : row.itemName!).replace('{amount}', String(amount))
        rewards.items.push(foundItemFromName(name, row.quantityIsValue ? 1 : amount)); rewards.notes.push(`${label}${rule.tableDice ? '' : ` (D6 ${entry.roll})`}: ${name}${diceNote}; ${row.quantityIsValue ? 1 : amount} added to the stash.`)
      } else { rewards.shards += row.shards ?? 0; rewards.notes.push(`${label} (D6 ${entry.roll}): ${row.label}; ${row.shards ? `+${row.shards} wyrdstone` : 'nothing found'}.`) }
    })
    if (rule.bonusFinds) {
      const bonus = scenarioRewards(draft, scenarioId, participants, context, { kind: 'hoard', finds: rule.bonusFinds, note: rule.note, winnerOnly: rule.winnerOnly ?? false })
      rewards.gold += bonus.gold; rewards.shards += bonus.shards
      rewards.items.push(...bonus.items); rewards.artefacts.push(...bonus.artefacts); rewards.notes.push(...bonus.notes); rewards.problems.push(...bonus.problems)
    }
    if (!entries.length) rewards.notes.push(`No ${rule.label.toLowerCase()} rewards recorded.`)
  } else if (rule.kind === 'counters') {
    const count = state.counters ?? 0
    if (!valid(count, 0, rule.max)) rewards.problems.push(`Enter the number of counters held at the end${rule.max ? ` (0–${rule.max})` : ''}.`)
    else { rewards.shards = count; rewards.notes.push(`${rule.label ?? 'Scenario counters held at the end'}: ${count}; +${count} wyrdstone.`) }
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
    if (rule.containers) rewards.notes.push(`Containers recovered: ${rule.containers.filter(c => state.containers?.includes(c.id)).map(c => c.label).join(', ') || 'none'}.`)
    if (rule.branches && !rule.branches.options.some(b => b.id === state.branch)) { rewards.problems.push(rule.branches.question); return rewards }
    if (rule.branches) rewards.notes.push(`${rule.branches.question} ${rule.branches.options.find(b => b.id === state.branch)!.label}.`)
    for (const find of scenarioHoardFinds(rule, draft, participants)) {
      if (find.unclaimedBeforeBattle) {
        const unclaimed = state.unclaimedBooty?.[find.id]
        if (unclaimed === undefined) { rewards.problems.push(`${find.label}: record whether it was found before the battle.`); continue }
        if (!unclaimed) { rewards.notes.push(`${find.label}: already found before the battle; no second award.`); continue }
      }
      const entry = state.finds?.[find.id]
      const discoveryCount = find.discoveryDice ?? 1
      const discoveryDice = discoveryCount === 1 ? [entry?.discovery ?? null] : entry?.discoveryDice ?? []
      const discovery = discoveryDice.reduce<number>((sum, d) => sum + (d ?? 0), 0)
      const discoveryNote = discoveryCount === 1 ? `D6 ${discovery}` : `${discoveryCount}D6 ${discoveryDice.join(', ')} (total ${discovery})`
      if (find.threshold) {
        if (discoveryDice.length !== discoveryCount || discoveryDice.some(d => !valid(d, 1, 6))) { rewards.problems.push(`${find.label}: enter the separate discovery ${discoveryCount}D6.`); continue }
        if (discovery < find.threshold) { rewards.notes.push(`${find.label}: discovery ${discoveryNote}, needed ${find.threshold}+; not found.`); continue }
      }
      if (find.kind === 'artefact') {
        const artefact = MAGICAL_ARTEFACTS.find(a => a.band.min === entry?.artefactRoll)
        if (!artefact) { rewards.problems.push(`${find.label}: roll on the Magical Artefacts table.`); continue }
        if (!context?.artefacts) rewards.problems.push(context?.artefactsError ? `Cannot check campaign artefacts: ${context.artefactsError}` : 'Waiting for the campaign artefact record.')
        const previous = context?.artefacts?.find(a => a.roll === entry!.artefactRoll && (!context.reportId || a.reportId !== context.reportId))
        const reason = entry?.artefactOverrideReason?.trim()
        if ((previous || rewards.artefacts.some(a => a.roll === entry!.artefactRoll)) && !reason) rewards.problems.push(`${artefact.name} was already found. Reroll or record the agreed duplicate override.`)
        rewards.artefacts.push({ roll: entry!.artefactRoll!, ...(reason ? { overrideReason: reason } : {}) })
        rewards.items.push(foundItemFromName(artefact.name))
        rewards.notes.push(`${find.label}: discovery ${discoveryNote}; artefact D6 ${entry!.artefactRoll}: ${artefact.name}.${reason ? ` Agreed override: ${reason}` : ''}`)
        continue
      }
      let amount: number
      let diceNote = ''
      if (typeof find.quantity === 'number') amount = find.quantity
      else {
        const { count, sides } = find.quantity
        const dice = entry?.dice ?? []
        if (dice.length !== count || dice.some(d => !valid(d, 1, sides))) { rewards.problems.push(`${find.label}: enter all ${count}D${sides} for the quantity.`); continue }
        if (find.multiplierRuling && (!valid(entry?.multiplier, 1) || !entry?.multiplierReason?.trim())) { rewards.problems.push(`${find.label}: record the agreed multiplier and reason.`); continue }
        amount = dice.reduce<number>((sum, d) => sum + d!, 0) * (find.multiplierRuling ? entry!.multiplier! : find.quantity.multiplier ?? 1) + (find.quantity.bonus ?? 0)
        diceNote = `; ${count}D${sides} rolled ${dice.join(', ')}`
      }
      if (find.multiplierRuling) rewards.notes.push(`${find.label}: agreed multiplier ×${entry!.multiplier}. ${entry!.multiplierReason!.trim()}`)
      if (find.unitValueMultiplier) {
        const values = entry?.unitValueDice ?? []
        if (values.length !== amount || values.some(d => !valid(d, 1, 6))) { rewards.problems.push(`${find.label}: enter a value D6 for each of the ${amount} gems.`); continue }
        values.forEach((die, i) => { const value = die! * find.unitValueMultiplier!; rewards.items.push(foundItemFromName(find.itemName!.replace('{amount}', String(value)))); rewards.notes.push(`${find.label}${diceNote}; gem ${i + 1}: value D6 ${die} ×${find.unitValueMultiplier} = ${value} gc, added to stash.`) })
        continue
      }
      if (find.itemOptions) {
        const selected = entry?.items ?? []
        const expected = find.chooseUpTo !== undefined ? selected.length : amount
        if (selected.length !== expected || selected.some(name => !find.itemOptions!.includes(name)) || (find.chooseUpTo !== undefined && (selected.length > find.chooseUpTo || new Set(selected).size !== selected.length))) { rewards.problems.push(`${find.label}: check the selected items and quantity.`); continue }
        for (const name of selected) rewards.items.push(foundItemFromName(name))
        rewards.notes.push(`${find.label}${diceNote}: ${selected.join(', ') || 'none recovered'}.`)
        continue
      }
      if (find.kind === 'gold') rewards.gold += amount
      else if (find.kind === 'shards') rewards.shards += amount
      else rewards.items.push(foundItemFromName(find.itemName!.replace('{amount}', String(amount)), find.quantityIsValue ? 1 : amount))
      rewards.notes.push(`${find.label}: ${find.threshold ? `discovery ${discoveryNote}, needed ${find.threshold}+` : 'automatically found'}${diceNote}; +${find.quantityIsValue ? `1 item worth ${amount} gc` : amount}${find.kind === 'gold' ? ' gc' : find.kind === 'shards' ? ' wyrdstone' : ' to stash'}.`)
    }
  }
  return rewards
}
