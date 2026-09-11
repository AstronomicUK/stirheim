import { promoteHenchman } from './advances'
import { findWarbandTemplate, heroCapacity } from '../data/warbandTemplates'
import type { Resolution, RosterWarband } from '../types/roster'
import { RulesError } from './errors'

export function lustrianVacancies(roster: RosterWarband) {
  if (roster.warbandTemplateId !== 'lustrian_reavers') return []
  const replaced = new Set(roster.heroes.map(h => h.flags.lustrianReplacementOf).filter(Boolean))
  const units = new Set(findWarbandTemplate('lustrian_reavers')!.heroTemplates.map(h => h.id))
  return roster.heroes.filter(h => (h.status === 'dead' || h.status === 'retired') && units.has(h.unitTemplateId) && !replaced.has(h.id) && !roster.heroes.some(a => a.status === 'active' && a.unitTemplateId === h.unitTemplateId))
}

/** Promotions (grade1c): a Prospect inherits a lost role, not the old warrior's profile. */
export function replaceLustrianHero(roster: RosterWarband, fallenId: string, groupId: string, name: string, tables: string[], newHeroId: string): Resolution<RosterWarband> {
  const fallen = lustrianVacancies(roster).find(h => h.id === fallenId)
  if (!fallen) throw new RulesError('REAVER_VACANCY', 'That Hero’s position is no longer available.')
  const group = roster.henchmenGroups.find(g => g.id === groupId && g.unitTemplateId === 'lustrian_reavers_prospects' && g.size > 0)
  if (!group || !name.trim()) throw new RulesError('REAVER_PROSPECT', 'Choose a Prospect and name the new Hero.')
  const template = findWarbandTemplate('lustrian_reavers')!
  const allowed = new Set<string>(template.heroTemplates.flatMap(h => h.skillTableIds))
  if (tables.some(t => !allowed.has(t))) throw new RulesError('REAVER_TABLES', 'Choose two skill lists available to Lustrian Reaver Heroes.')
  const promoted = promoteHenchman(roster, group.id, name.trim(), tables, newHeroId, { heroCapacity: heroCapacity(template) ?? undefined })
  const hero = promoted.value.heroes.find(h => h.id === newHeroId)!
  const role = template.heroTemplates.find(h => h.id === fallen.unitTemplateId)!
  const message = `${name.trim()} replaces ${fallen.name} as ${role.name}, retaining the Prospect’s experience and characteristics. Inherits the equipment retained with ${fallen.name}; the Prospect’s own equipment goes to the stash. An immediate Hero advance is queued.`
  return {
    value: { ...promoted.value, stash: [...promoted.value.stash, ...hero.equipment], heroes: promoted.value.heroes.map(h => h.id === fallenId ? { ...h, equipment: [] } : h.id === newHeroId ? { ...h, unitTemplateId: fallen.unitTemplateId, equipment: fallen.equipment.map(i => ({...i})), flags: {...h.flags,lustrianReplacementOf:fallen.id}, notes: message } : h) },
    // This is a replacement opportunity, not an earned group advance: survivors get no re-roll.
    events: [{kind:'heroReplacement',subjectId:newHeroId,message}],
  }
}
