// Pure display helpers for the roster screens: names for rules ids, experience progress, flag
// tags. Nothing here touches React or the network, so it is unit-tested in node.

import { findHiredSword } from '../../../rules/data/campaign/hiredSwords'
import { nextThreshold, xpThresholds, type AdvanceRate } from '../../../rules/data/campaign/experience'
import { SPELL_LORES } from '../../../rules/data/campaign/magic'
import { WARBAND_SKILL_TABLES, findWarbandSkill, skillTablesForWarband } from '../../../rules/data/campaign/warbandSkills'
import { SKILLS, findSkill } from '../../../rules/data/skills'
import { findUnitTemplate } from '../../../rules/data/warbandTemplates'
import type { CharacterRole, NamedRule, SkillCategory, WarbandTemplate } from '../../../rules/types'
import type { WarriorFlags } from '../../../rules/types/roster'
import { toRosterItem, type ItemRow, type WarriorStatus } from '../../../domain'
import type { RosterItem } from '../../../rules/types/roster'

export const CORE_SKILL_CATEGORIES: readonly SkillCategory[] = ['combat', 'shooting', 'academic', 'strength', 'speed']

const CATEGORY_LABEL: Record<SkillCategory, string> = {
  combat: 'Combat',
  shooting: 'Shooting',
  academic: 'Academic',
  strength: 'Strength',
  speed: 'Speed',
  'warband-unique': 'Warband',
}

/** Display name for a skill id from either the core catalogue or a warband skill table. */
export function skillName(id: string): string {
  return findSkill(id)?.name ?? findWarbandSkill(id)?.skill.name ?? id
}

/** Rule text for a skill id, for the expanded card. */
export function skillText(id: string): string | undefined {
  return findSkill(id)?.description ?? findWarbandSkill(id)?.skill.text
}

/** A skill table id is either a core category or a warband skill table id. */
export function skillTableName(id: string): string {
  if (isCoreCategory(id)) return CATEGORY_LABEL[id]
  return WARBAND_SKILL_TABLES.find((t) => t.id === id)?.name ?? id
}

function isCoreCategory(id: string): id is SkillCategory {
  return (CORE_SKILL_CATEGORIES as readonly string[]).includes(id)
}

export interface SkillOption {
  id: string
  name: string
  text: string
  /** Where it comes from: a core category label or the warband table name. */
  group: string
}

/** Every skill a hero with these skill tables may pick, grouped by table, for the editor. */
export function skillOptionsFor(skillTableIds: readonly string[]): SkillOption[] {
  const out: SkillOption[] = []
  for (const tableId of skillTableIds) {
    if (isCoreCategory(tableId)) {
      const label = CATEGORY_LABEL[tableId]
      for (const s of SKILLS) if (s.category === tableId) out.push({ id: s.id, name: s.name, text: s.description, group: label })
      continue
    }
    const table = WARBAND_SKILL_TABLES.find((t) => t.id === tableId)
    if (table) for (const s of table.skills) out.push({ id: s.id, name: s.name, text: s.text, group: table.name })
  }
  return out
}

/** The skill tables a hero of this warband could be given: the five core lists plus the warband's own. */
export function skillTableOptions(warbandTemplateId: string): { id: string; name: string }[] {
  const core = CORE_SKILL_CATEGORIES.map((c) => ({ id: c, name: CATEGORY_LABEL[c] }))
  const own = skillTablesForWarband(warbandTemplateId).map((t) => ({ id: t.id, name: t.name }))
  return [...core, ...own]
}

export interface SpellOption {
  id: string
  name: string
  lore: string
  text: string
}

const SPELL_INDEX: Map<string, SpellOption> = new Map()
for (const lore of SPELL_LORES) {
  for (const spell of lore.spells) {
    if (!SPELL_INDEX.has(spell.id)) SPELL_INDEX.set(spell.id, { id: spell.id, name: spell.name, lore: lore.name, text: spell.text })
  }
}

export function spellName(id: string): string {
  return SPELL_INDEX.get(id)?.name ?? id
}

export function findSpellOption(id: string): SpellOption | undefined {
  return SPELL_INDEX.get(id)
}

export function allSpellOptions(): SpellOption[] {
  return [...SPELL_INDEX.values()]
}

export function hiredSwordName(id: string): string {
  return findHiredSword(id)?.name ?? id
}

/** Special rules shown when a card is expanded: the unit's own (heroes, henchmen) or the hired sword entry's. */
export function warriorSpecialRules(template: WarbandTemplate | undefined, unitId: string | null, hiredSwordId: string | null): NamedRule[] {
  if (hiredSwordId) return findHiredSword(hiredSwordId)?.detail?.specialRules ?? []
  if (template && unitId) return findUnitTemplate(template, unitId)?.specialRules ?? []
  return []
}

export interface XpProgress {
  xp: number
  /** The next advance box above the current total, or null when the sheet runs out. */
  next: number | null
  /** The box just crossed (or 0): the start of the current band, for the progress bar. */
  previous: number
  /** Boxes crossed so far minus advances already taken. */
  advancesOwed: number
  /** 0..1 progress from `previous` to `next`; 1 when there is no next box. */
  fraction: number
}

/** Where a warrior sits between advance boxes and whether any advances are still to be rolled. */
export function xpProgress(xp: number, levelUps: number, role: CharacterRole, rate: AdvanceRate = 'normal'): XpProgress {
  const thresholds = xpThresholds(role, rate)
  const crossed = thresholds.filter((t) => t <= xp)
  const previous = crossed.length > 0 ? crossed[crossed.length - 1] : 0
  const next = nextThreshold(xp, role, rate)
  const fraction = next === null ? 1 : Math.min(1, Math.max(0, (xp - previous) / (next - previous)))
  return { xp, next, previous, advancesOwed: Math.max(0, crossed.length - levelUps), fraction }
}

export interface XpSegment {
  from: number
  to: number
  /** 0..1 of this segment earned. */
  fill: number
}

/**
 * The advance boxes as track segments, from 0 to the first box and between each pair after it,
 * shown up to two boxes past the current total so the track always has somewhere to go.
 */
export function xpTrack(xp: number, role: CharacterRole, rate: AdvanceRate = 'normal'): XpSegment[] {
  const thresholds = xpThresholds(role, rate)
  const nextIndex = thresholds.findIndex((t) => t > xp)
  const shownUpTo = nextIndex === -1 ? thresholds.length : Math.min(thresholds.length, Math.max(nextIndex + 2, 6))
  const segments: XpSegment[] = []
  let from = 0
  for (const to of thresholds.slice(0, shownUpTo)) {
    const fill = xp >= to ? 1 : xp <= from ? 0 : (xp - from) / (to - from)
    segments.push({ from, to, fill })
    from = to
  }
  return segments
}

/** Short labels for a warrior's persistent conditions, in a stable order. */
export function flagTags(flags: WarriorFlags): string[] {
  const tags: string[] = []
  if (flags.missNextGames && flags.missNextGames > 0) {
    tags.push(flags.missNextGames === 1 ? 'Misses next game' : `Misses next ${flags.missNextGames} games`)
  }
  if (flags.oldBattleWound) tags.push('Old battle wound')
  if (flags.singleHandedWeaponsOnly) tags.push('One-handed weapons only')
  if (flags.noRunning) tags.push('May not run')
  if (flags.blindedInOneEye) tags.push('Blind in one eye')
  if (flags.stupidity) tags.push('Stupidity')
  if (flags.frenzy) tags.push('Frenzy')
  if (flags.immuneToFear) tags.push('Immune to fear')
  if (flags.causesFear) tags.push('Causes fear')
  if (flags.captured) tags.push('Captured')
  if (flags.hates) tags.push(`Hates ${flags.hates}`)
  return tags
}

/** Label for a non-active status, or null for an active warrior. */
export function statusLabel(status: WarriorStatus): string | null {
  switch (status) {
    case 'active':
      return null
    case 'dead':
      return 'Dead'
    case 'retired':
      return 'Retired'
    case 'captured':
      return 'Captured'
    case 'left':
      return 'Left'
  }
}

export const STATUS_OPTIONS: { value: WarriorStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'dead', label: 'Dead' },
  { value: 'retired', label: 'Retired' },
  { value: 'captured', label: 'Captured' },
  { value: 'left', label: 'Left' },
]

/** Items grouped by holder id as roster items; the stash lives under the empty key. */
export function itemsByHolder(items: readonly ItemRow[]): Map<string, RosterItem[]> {
  const map = new Map<string, RosterItem[]>()
  for (const item of items) {
    const key = item.holder_type === 'stash' || item.holder_id == null ? '' : item.holder_id
    const list = map.get(key)
    if (list) list.push(toRosterItem(item))
    else map.set(key, [toRosterItem(item)])
  }
  return map
}
