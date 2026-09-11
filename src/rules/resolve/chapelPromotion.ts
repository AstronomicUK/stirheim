import { promoteHenchman } from './advances'
import { equipmentOptionsFor } from './builder'
import { findWarbandTemplate } from '../data/warbandTemplates'
import { resolveEquipmentName } from '../data/items'
import type { Resolution, RosterWarband } from '../types/roster'
import { RulesError } from './errors'

export const SQUIRE_TABLES = ['combat', 'academic', 'strength', 'speed']
export type SquirePromotion = 'squire' | 'knight'
/** Knighthood, grade-1c:775. Existing characteristics and experience are never replaced. */
export function promoteChapelSquire(roster: RosterWarband, groupId: string, name: string, tables: string[], heroId: string, choice: SquirePromotion, capacity?: number): Resolution<RosterWarband> {
  if (choice !== 'squire' && choice !== 'knight') throw new RulesError('KNIGHTHOOD_CHOICE', 'Choose whether the promoted warrior remains a Squire or becomes a Knight Errant.')
  const group = roster.henchmenGroups.find(g => g.id === groupId)
  if (roster.warbandTemplateId !== 'bretonnian_chapel_guard' || group?.unitTemplateId !== 'bretonnian_squires') throw new RulesError('KNIGHTHOOD_UNIT', 'Only a Chapel Guard Squire may choose this promotion.')
  if (tables.some(t => !SQUIRE_TABLES.includes(t))) throw new RulesError('KNIGHTHOOD_TABLES', 'Choose two of Combat, Academic, Strength or Speed.')
  const promoted = promoteHenchman(roster, groupId, name, tables, heroId, { heroCapacity: capacity })
  if (choice === 'squire') return promoted
  const template = findWarbandTemplate(roster.warbandTemplateId)!
  const allowed = new Set(equipmentOptionsFor(template, 'bretonnian_knight_errant').filter(o => o.section !== 'missile').flatMap(o => o.item ? [o.item.id] : []))
  allowed.delete('helmet')
  const hero = promoted.value.heroes.find(h => h.id === heroId)!
  const canKeep = (item: typeof hero.equipment[number]) => allowed.has(item.itemId ?? resolveEquipmentName(item.customName ?? '')?.id ?? '')
  const stored = hero.equipment.filter(i => !canKeep(i))
  const knight = { ...hero, unitTemplateId: 'bretonnian_knight_errant', levelUps: hero.levelUps + 1, skillTableIds: [...hero.skillTableIds, 'warband-unique'], equipment: hero.equipment.filter(canKeep), notes: `${hero.notes} Chose knighthood: Knight, Vain and Impetuous replace the immediate advance.` }
  const message = `${name} becomes a Knight Errant, retaining experience and characteristics. Knight, Vain and Impetuous replace the immediate Hero advance; Special Skills are added to the two chosen tables.${stored.length ? ` Equipment outside the Knight list returns to the stash: ${stored.map(i => i.customName ?? i.itemId).join(', ')}.` : ''}`
  return { value: { ...promoted.value, heroes: promoted.value.heroes.map(h => h.id === heroId ? knight : h), stash: [...promoted.value.stash, ...stored] }, events: [...promoted.events.filter(e => e.kind !== 'advanceDue'), { kind: 'heroKnighthood', subjectId: heroId, message }] }
}
