import { promoteHenchman, splitEquipment } from './advances'
import { findLore } from '../data/campaign/magic'
import type { Resolution, RosterWarband } from '../types/roster'
import { RulesError } from './errors'

export const SORCEROUS_LORES = ['elemental_lore_of_water', 'elemental_lore_of_fire', 'elemental_lore_of_earth', 'elemental_lore_of_air', 'lesser_magic']
export type HarnessedAdvance = 'advance' | 'spell'

/** Harnessed: Wizard is automatic; the spell replaces, rather than accompanies, the immediate advance. */
export function promoteUntrained(roster: RosterWarband, groupId: string, name: string, tables: string[], heroId: string, choice: HarnessedAdvance, loreId: string, spellRoll?: number | null, capacity?: number): Resolution<RosterWarband> {
  const group = roster.henchmenGroups.find(g => g.id === groupId)
  if (roster.warbandTemplateId !== 'sorcerous_society' || group?.unitTemplateId !== 'untrained') throw new RulesError('HARNESS_UNIT', 'Only an Untrained may use Harnessed.')
  if (choice !== 'advance' && choice !== 'spell') throw new RulesError('HARNESS_CHOICE', 'Choose the immediate Hero advance or a random spell.')
  if (!SORCEROUS_LORES.includes(loreId)) throw new RulesError('HARNESS_LORE', 'Choose an Elemental lore or Lesser Magic.')
  const lore = findLore(loreId)!
  const spell = choice === 'spell' && Number.isInteger(spellRoll) ? lore.spells.find(s => spellRoll! >= s.roll.min && spellRoll! <= s.roll.max) : undefined
  if (choice === 'spell' && !spell) throw new RulesError('HARNESS_SPELL', 'Roll a D6 to generate the spell.')
  const promoted = promoteHenchman(roster, groupId, name, tables, heroId, { heroCapacity: capacity })
  return {
    value: { ...promoted.value, heroes: promoted.value.heroes.map(h => h.id !== heroId ? h : {
      ...h, flags: { ...h.flags, magicLoreId: loreId }, spellIds: spell ? [spell.id] : [],
      levelUps: h.levelUps + (spell ? 1 : 0),
      notes: `${h.notes} Harnessed: gains Wizard (${lore.name}).${spell ? ` Rolled ${spellRoll}: learns ${spell.name} instead of the immediate Hero advance.` : ' Takes the normal immediate Hero advance.'}`,
    }) },
    events: [...promoted.events.filter(e => !spell || e.kind !== 'advanceDue'), {
      kind: 'wizardHarnessed', subjectId: heroId,
      message: `${name} gains Wizard (${lore.name}). ${spell ? `Rolled ${spellRoll}: learns ${spell.name} instead of the immediate Hero advance.` : 'The immediate Hero advance is queued as normal.'}`,
    }],
  }
}

/** Prove That Talent: one Grunt becomes an Untrained henchman, retaining his earned profile. */
export function trainGrunt(roster: RosterWarband, groupId: string, name: string, newGroupId: string): Resolution<RosterWarband> {
  const group = roster.henchmenGroups.find(g => g.id === groupId)
  if (roster.warbandTemplateId !== 'sorcerous_society' || group?.unitTemplateId !== 'grunts' || group.size < 1) throw new RulesError('GRUNT_UNIT', 'Only a Grunt can take this path.')
  if (!name.trim() || roster.henchmenGroups.some(g => g.id === newGroupId) || roster.heroes.some(h => h.id === newGroupId)) throw new RulesError('GRUNT_ID', 'Give the new Untrained a name and a new identity.')
  const { heroItems, groupItems } = splitEquipment(group)
  const trained = { ...group, id: newGroupId, name: name.trim(), unitTemplateId: 'untrained', size: 1, levelUps: group.levelUps + 1, equipment: heroItems, modelNames: [name.trim()], notes: `${group.notes ?? ''} Prove That Talent: became a Grunt Untrained. A future Lad’s Got Talent result can make him a Wizard.`.trim() }
  const remaining = group.size > 1 ? roster.henchmenGroups.map(g => g.id === groupId ? { ...g, size: g.size - 1, equipment: groupItems, ...(g.modelNames ? {modelNames:g.modelNames.slice(1)} : {}) } : g) : roster.henchmenGroups.filter(g => g.id !== groupId)
  return { value: { ...roster, henchmenGroups: [...remaining, trained] }, events: [{kind:'henchmanTrained',subjectId:newGroupId,message:`${trained.name} becomes a Grunt Untrained, keeping his experience, characteristics and equipment. He remains a henchman; a future Lad’s Got Talent result may make him a Wizard.`}] }
}
