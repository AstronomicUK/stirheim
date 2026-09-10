import { ITEMS } from '../../../rules/data/items'
import type { FoundItem } from './state'

// TC22 names the core rulebook Trading chart, not every common item in later supplements.
export const ROCK_COMMON_ITEMS = ITEMS.filter(item => item.availability.kind === 'common' && item.source.publication === 'Mordheim Rulebook (core)' && !item.superseded && !item.scenarioRewardOnly)
export interface RockLootRoll {
  searcher: string
  die: number | null
  commonItemId?: string
  desecrate?: boolean
  initiativeDie?: number | null
}
export interface RockLootContext {
  sisters: boolean
  evil: boolean
  leaderName?: string
  leaderInitiative?: number
}
/** The actual in-battle searches, not an extra post-battle roll for every warrior. */
export function rockLoot(rolls: RockLootRoll[], context: RockLootContext) {
  const out = {items: [] as FoundItem[], notes: [] as string[], problems: [] as string[]}
  if (context.sisters) {
    if (rolls.length) out.problems.push('Sisters of Sigmar cannot loot rooms in Assault on the Rock.')
    return out
  }
  const d6=(n:number|null|undefined):n is number=>n!=null&&Number.isInteger(n)&&n>=1&&n<=6
  for (const [i,roll] of rolls.entries()) {
    const name=roll.searcher.trim()
    const label=`Rock search ${i+1}${name?` (${name})`:''}`
    if (!name) out.problems.push(`${label}: name the warrior who searched.`)
    if (!d6(roll.die)) {out.problems.push(`${label}: enter the actual looting D6.`);continue}
    if (roll.die<=2) {out.notes.push(`${label}: D6 ${roll.die}, nothing of value.`);continue}
    if (roll.die<=4) {out.items.push({item_rules_id:'blessed_water',custom_name:null,quantity:1});out.notes.push(`${label}: D6 ${roll.die}, one Blessed Water.`);continue}
    if (roll.die===5) {
      const item=ROCK_COMMON_ITEMS.find(item=>item.id===roll.commonItemId)
      if (!item) {out.problems.push(`${label}: choose one common item from the core rulebook Trading chart.`);continue}
      out.items.push({item_rules_id:item.id,custom_name:null,quantity:1})
      out.notes.push(`${label}: D6 5, ${item.name}.`)
      continue
    }
    let desecrated=false
    if (roll.desecrate) {
      if (!context.evil) out.problems.push(`${label}: only a chaotic or evil warband may desecrate the Holy Relic.`)
      if (!context.leaderName || !Number.isInteger(context.leaderInitiative) || context.leaderInitiative!<1) out.problems.push(`${label}: identify the leader and their Initiative for desecration.`)
      if (!d6(roll.initiativeDie)) out.problems.push(`${label}: enter the leader’s desecration Initiative D6.`)
      else if (context.evil && context.leaderName && context.leaderInitiative) {
        // Characteristic tests always fail on a natural 6.
        desecrated=roll.initiativeDie!==6&&roll.initiativeDie<=context.leaderInitiative
        out.notes.push(`${label}: ${context.leaderName} Initiative ${context.leaderInitiative}, D6 ${roll.initiativeDie}; desecration ${desecrated?'passed':'failed'}.`)
      }
    }
    out.items.push({item_rules_id:'holy_unholy_relic',custom_name:desecrated?'Unholy Relic':'Holy Relic',quantity:1})
    out.notes.push(`${label}: D6 6, ${desecrated?'Unholy':'Holy'} Relic.`)
  }
  return out
}

