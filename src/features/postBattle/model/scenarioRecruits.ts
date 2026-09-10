import type { ReportApplied } from '../../../domain'
import { recruitmentBlock } from '../../../rules/resolve/recruitment'
import { unitStartingStats, startingLevelUps } from '../../../rules/resolve/builder'
import type { ReportContext, InjuriesDerived } from './derive'
import type { ReportDraft } from './state'

export interface RitualZombiesDraft { completed?: boolean; die?: number | null; retain?: number | null; groupIds?: string[] }
export function ritualZombies(draft: ReportDraft, ctx: ReportContext, injuries: InjuriesDerived, prior?: { newGroups: NonNullable<ReportApplied['new_groups']>; groupPatches: ReportApplied['groups'] }) {
  const state = draft.scenarioRewards?.ritualZombies ?? {}
  const result = { problems: [] as string[], notes: [] as string[], newGroups: [] as NonNullable<ReportApplied['new_groups']>, available: null as number | null, capacity: 0 }
  if (ctx.scenarioId !== 'in_the_dead_of_the_night') return result
  if (state.completed === undefined) { result.problems.push('Record whether your defending warband completed the Zombie ritual.'); return result }
  if (!state.completed) { result.notes.push('No summoned Zombies retained: this warband did not complete the defending ritual.'); return result }
  if (!Number.isInteger(state.die) || state.die! < 1 || state.die! > 3) { result.problems.push('Roll D3 for the D3+3 Zombies available after the ritual.'); return result }
  result.available = state.die! + 3
  const unit = ctx.template?.henchmanTemplates.find(u => /zombie/i.test(u.name))
  const roster = { ...ctx.roster, heroes: ctx.roster.heroes.map(h => injuries.heroes.find(r => r.hero.id === h.id)?.resolution.hero ?? h), henchmenGroups: ctx.roster.henchmenGroups.map(g => injuries.groups.find(r => r.group.id === g.id)?.resolution.group ?? g) }
  if (prior) {
    roster.henchmenGroups = [...roster.henchmenGroups.map(g => ({ ...g, size: prior.groupPatches.find(p => p.id === g.id)?.patch.size ?? g.size })), ...prior.newGroups.map(g => ({ id: g.id, name: g.name, unitTemplateId: g.unit_type_rules_id, size: g.size, stats: g.stats, xp: g.xp, levelUps: g.level_ups, statIncreases: {}, equipment: [] }))]
  }
  if (unit && ctx.template) for (let n = 1; n <= result.available; n++) if (!recruitmentBlock(roster, ctx.template, unit, n)) result.capacity = n
  if (!Number.isInteger(state.retain) || state.retain! < 0 || state.retain! > result.capacity) { result.problems.push(`Choose how many summoned Zombies to retain, from 0 to ${result.capacity}. Excess Zombies wander away.`); return result }
  const count = state.retain!
  if (count && unit) {
    const groups = Math.ceil(count / 5)
    if (!state.groupIds || state.groupIds.length !== groups || new Set(state.groupIds).size !== groups || state.groupIds.some(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || roster.henchmenGroups.some(g => g.id === id))) result.problems.push('Confirm the new summoned Zombie groups.')
    else for (let i = 0; i < groups; i++) result.newGroups.push({ id: state.groupIds[i], name: groups > 1 ? `Summoned Zombies ${i + 1}` : 'Summoned Zombies', unit_type_rules_id: unit.id, size: Math.min(5, count - i * 5), stats: unitStartingStats(unit), xp: unit.startingExperience, level_ups: startingLevelUps(unit, 'henchman') })
  }
  result.notes.push(`Completed Zombie ritual: D3 ${state.die} +3 = ${result.available} available; ${count} retained, ${result.available - count} wander away. No hire fee.`)
  return result
}
