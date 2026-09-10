import type { ReportApplied } from '../../../domain'
import { findUnitTemplate } from '../../../rules/data/warbandTemplates'
import { findItem } from '../../../rules/data/items'
import { itemPrice } from '../../../rules/resolve/trading'
import { applyHouseRuleDefaults } from '../../../rules/resolve/houseRules'
import { recruitmentBlock } from '../../../rules/resolve/recruitment'
import { startingLevelUps, unitStartingStats } from '../../../rules/resolve/builder'
import { findLeaderId } from './participants'
import type { ReportContext, InjuriesDerived } from './derive'
import type { ReportDraft } from './state'

/** Town Cryer #9, Pirates: optional replacement for ordinary Straggler/Prisoner rewards. */
export function pirateRecruits(draft: ReportDraft, ctx: ReportContext, injuries: InjuriesDerived, location: string, budget: number) {
  const choice = draft.exploration.pirateRecruits!
  const roster = { ...ctx.roster, heroes: ctx.roster.heroes.map(h => injuries.heroes.find(r => r.hero.id === h.id)?.resolution.hero ?? h), henchmenGroups: ctx.roster.henchmenGroups.map(g => ({ ...(injuries.groups.find(r => r.group.id === g.id)?.resolution.group ?? g) })) }
  const living = roster.heroes.filter(h => h.status === 'active')
  const captain = living.find(h => h.id === findLeaderId(living, ctx.template))
  const leadership = choice.leadership ?? captain?.stats.Ld
  const count = location === 'straggler' ? 1 : choice.count
  const out = {
    kind: 'pirate' as const, needsDie: location === 'prisoners', count: count ?? null,
    groups: roster.henchmenGroups.filter(g => g.unitTemplateId === 'pirates_crew' && g.size > 0), newUnit: undefined,
    problems: [] as string[], goldCost: 0, listedCost: 0 as number | null,
    newGroups: [] as NonNullable<ReportApplied['new_groups']>, groupPatches: [] as ReportApplied['groups'], itemPatches: [] as ReportApplied['item_patches'],
    awardedItems: [] as NonNullable<ReportApplied['awarded_items']>, notes: [] as string[], captain, leadership,
    results: [] as { index: number; passed?: boolean; text: string; cost?: number }[],
  }
  if (!captain) out.problems.push('Appoint a living Pirate Captain before resolving recruitment.')
  if (!Number.isInteger(leadership) || leadership! < 1 || leadership! > 10) out.problems.push('The Captain’s Leadership must be from 1 to 10.')
  if (choice.leadership != null && choice.leadership !== captain?.stats.Ld && !choice.leadershipReason?.trim()) out.problems.push('Explain the Captain’s adjusted Leadership.')
  if (!Number.isInteger(count) || count! < 1 || count! > 3) out.problems.push('Roll D3 for the number of prisoners.')
  if (out.problems.length || !ctx.template) return out
  for (let index = 0; index < count!; index++) {
    const person = choice.people[index]
    if (!person || person.rolls.some(n => !Number.isInteger(n) || n! < 1 || n! > 6)) { out.problems.push(`Person ${index + 1}: enter both Leadership dice.`); continue }
    const passed = person.rolls[0]! + person.rolls[1]! <= leadership!
    const prefix = `Pirate ${location} ${index + 1}: ${captain!.name}, Leadership ${leadership}${choice.leadershipReason?.trim() ? ` (${choice.leadershipReason.trim()})` : ''}; rolled ${person.rolls.join('+')}, ${passed ? 'passed' : 'failed'}.`
    if (location === 'straggler' && !passed) { out.notes.push(`${prefix} No recruit.`); out.results.push({index, passed, text: 'No recruit'}); continue }
    if (person.destination === 'release') { out.notes.push(`${prefix} Released rather than retained.`); out.results.push({index, passed, text: 'Released'}); continue }
    let swabbie = location === 'straggler' || !passed
    let group = !swabbie ? roster.henchmenGroups.find(g => g.id === person.destination && g.unitTemplateId === 'pirates_crew' && g.size > 0) : undefined
    let cost = 0
    const kit: ReportApplied['item_patches'] = []
    if (!swabbie && person.destination !== 'new' && !group) { out.problems.push(`Prisoner ${index + 1}: choose a Crew group or a new group.`); continue }
    if (group) {
      const original = ctx.roster.henchmenGroups.find(g => g.id === group!.id)!
      let unknown = false
      for (const item of ctx.items.filter(i => i.holder_type === 'group' && i.holder_id === group!.id)) {
        const perModel = item.quantity / original.size
        if (!Number.isInteger(perModel)) { out.problems.push(`${group.name}: resolve uneven equipment before adding a recruit.`); continue }
        const entry = item.item_rules_id ? findItem(item.item_rules_id) : undefined
        const price = entry ? itemPrice(entry, ctx.houseRules ?? applyHouseRuleDefaults()).total : null
        if (price === null) unknown = true
        else cost += price * (item.item_rules_id === 'dagger' ? Math.max(0, perModel - 1) : perModel)
        kit.push({id: item.id, quantity: (out.itemPatches.find(p => p.id === item.id)?.quantity ?? item.quantity) + perModel})
      }
      if (person.kitCost != null) {
        if (!Number.isSafeInteger(person.kitCost) || person.kitCost < 0 || !person.kitReason?.trim()) out.problems.push(`Prisoner ${index + 1}: record a valid agreed equipment cost and reason.`)
        else cost = person.kitCost
      } else if (unknown) out.problems.push(`Prisoner ${index + 1}: agree a price for the group’s custom or variable-priced equipment.`)
      if (cost > Math.max(0, budget - out.goldCost)) { swabbie = true; group = undefined }
    }
    const unit = findUnitTemplate(ctx.template, swabbie ? 'pirates_swabbie' : 'pirates_crew')!
    const block = recruitmentBlock(roster, ctx.template, {...unit, cost: 0}, 1)
    const limit = block ?? (group && group.size >= 5 ? 'A Crew group may contain at most five models.' : undefined)
    const text = swabbie ? `${cost > 0 && passed && location === 'prisoners' ? 'Equipment unaffordable; ' : ''}joins as a Swabbie` : group ? `joins ${group.name}; equipment ${cost} gc` : 'starts a new Crew group with a free dagger; buy additional equipment in Trading Post'
    out.results.push({index, passed, text: limit ?? text, cost: swabbie ? 0 : cost})
    if (limit) { out.problems.push(`Person ${index + 1}: ${limit} Release the recruit or change the destination.`); continue }
    if (group) {
      group.size++
      const patch = out.groupPatches.find(p => p.id === group!.id)
      if (patch) patch.patch.size = group.size
      else out.groupPatches.push({id: group.id, patch: {size: group.size}})
      for (const item of kit) { const old = out.itemPatches.find(p => p.id === item.id); if (old) Object.assign(old,item); else out.itemPatches.push(item) }
    } else {
      if (roster.henchmenGroups.some(g => g.id === person.id)) { out.problems.push('Each recruit needs a separate new group identity.'); continue }
      const stats = unitStartingStats(unit)
      out.newGroups.push({id:person.id, name:swabbie ? 'Swabbie' : 'Crew', unit_type_rules_id:unit.id, size:1, stats, xp:0, level_ups:startingLevelUps(unit,'henchman')})
      roster.henchmenGroups.push({id:person.id, name:unit.name, unitTemplateId:unit.id, size:1, stats, xp:0, levelUps:0, statIncreases:{}, equipment:[]})
      out.awardedItems.push({holder_type:'group', holder_id:person.id, item_rules_id:'dagger', custom_name:null, quantity:1})
    }
    if (!swabbie) out.goldCost += cost
    out.notes.push(`${prefix} ${text}.${person.kitReason?.trim() ? ` Equipment price ruling: ${person.kitReason.trim()}.` : ''}`)
  }
  const total = (type:string) => roster.henchmenGroups.filter(g=>g.unitTemplateId===type).reduce((n,g)=>n+g.size,0)
  if (total('pirates_swabbie') > total('pirates_crew')) out.problems.push('There cannot be more Swabbies than Crew. Release enough recruits to respect this limit.')
  return out
}
