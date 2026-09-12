import { findEquipmentList, findUnitTemplate, findWarbandTemplate } from '../data/warbandTemplates'
import { findItem, resolveEquipmentName } from '../data/items'
import type { Item } from '../types/items'
import type { RosterWarband } from '../types/roster'
import type { ItemHolder } from './itemRestrictions'
import { currentLeader, leaderTemplate } from './roster'

/** Material changes do not require learning a different kind of weapon. */
function equipmentType(item: Item): string {
  if (item.category === 'melee' && /^(gromril|ithilmar)_/.test(item.id)) {
    const base = item.id.replace(/^(gromril|ithilmar)_/, '')
    if (findItem(base)?.category === 'melee') return base
  }
  return item.id
}

export function equipmentListWarning(roster: RosterWarband, item: Item, holder: ItemHolder): string | null {
  if (!['hero', 'henchmanGroup'].includes(holder.kind) || !['melee', 'missile', 'blackpowder', 'armour'].includes(item.category)) return null
  // Their source does not identify a base-list equivalent; keep existing category bans,
  // but do not invent a heavy-armour prerequisite for these rare armour types.
  if (['gromril_armour', 'ithilmar_armour'].includes(item.id)) return null
  const template = findWarbandTemplate(roster.warbandTemplateId)
  const unit = template && findUnitTemplate(template, holder.unitTemplateId ?? '')
  if (!template || !unit) return null // Imported/custom units cannot be certified from an unrelated list.
  const hero = holder.kind === 'hero' ? roster.heroes.find(h => h.id === holder.id) : undefined
  const skills = hero?.skillIds ?? []
  if (item.category === 'melee' && skills.includes('weapons_training')) return null
  if (['missile', 'blackpowder'].includes(item.category) && skills.includes('weapons_expert')) return null
  const listIds = new Set([unit.equipmentListId])
  if (hero?.skillIds.includes('black_orcs_skills_proven_warrior') && template.id === 'black_orcs') listIds.add('black_orcs_black_orc_list')
  if (hero && currentLeader(roster.heroes, template)?.id === hero.id) {
    const leader = leaderTemplate(template)
    if (leader) listIds.add(leader.equipmentListId)
  }
  const lists = [...listIds].map(id => findEquipmentList(template, id)).filter(list => list !== undefined)
  const allowed = new Set(lists.flatMap(list => [...list.meleeWeapons, ...list.missileWeapons, ...list.armour]).flatMap(line => {
    if (line.heroesOnly && holder.kind !== 'hero') return []
    if (line.onlyUnitTemplateIds && !line.onlyUnitTemplateIds.includes(unit.id)) return []
    const resolved = resolveEquipmentName(line.name)
    return resolved ? [equipmentType(resolved)] : []
  }))
  if (allowed.has(equipmentType(item))) return null
  const names = lists.map(list => list.name).join(' or ') || 'no weapons or armour'
  return `${item.name} is not on ${holder.name ?? unit.name}’s equipment list (${names}).${item.category === 'melee' ? ' Weapons Training permits other hand-to-hand weapons.' : ['missile', 'blackpowder'].includes(item.category) ? ' Weapons Expert permits other missile weapons.' : ''}`
}
