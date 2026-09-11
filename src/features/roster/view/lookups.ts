// Pure display helpers for the roster screens: names for rules ids, experience progress, flag
// tags. Nothing here touches React or the network, so it is unit-tested in node.

import { unitRules } from '../../../rules/data/campaignRules'
import { findItem } from '../../../rules/data/items'
import { findHiredSword } from '../../../rules/data/campaign/hiredSwords'
import { nextThreshold, xpThresholds, type AdvanceRate } from '../../../rules/data/campaign/experience'
import { SPELL_LORES } from '../../../rules/data/campaign/magic'
import { WARBAND_SKILL_TABLES, findWarbandSkill, skillTablesForWarband } from '../../../rules/data/campaign/warbandSkills'
import { SKILLS, findSkill } from '../../../rules/data/skills'
import { findUnitTemplate } from '../../../rules/data/warbandTemplates'
import type { CharacterRole, NamedRule, SkillCategory, Stats, WarbandTemplate } from '../../../rules/types'
import { unitStartingStats } from '../../../rules/resolve/builder'
import type { WarriorFlags } from '../../../rules/types/roster'
import { toRosterItem, type ItemRow, type WarriorStatus } from '../../../domain'
import { WARBAND_UNIQUE_TABLE_ID } from '../../../rules/resolve/advances'
import type { IconName } from '../../../ui'
import type { RosterItem } from '../../../rules/types/roster'

export const CORE_SKILL_CATEGORIES: readonly SkillCategory[] = ['combat', 'shooting', 'academic', 'strength', 'speed']

const CATEGORY_ICON: Record<SkillCategory, IconName> = {
  combat: 'battle',
  shooting: 'shooting',
  academic: 'academic',
  strength: 'strength',
  speed: 'speed',
  'warband-unique': 'template',
}

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
  if (id === WARBAND_UNIQUE_TABLE_ID) return 'Warband skills'
  return WARBAND_SKILL_TABLES.find((t) => t.id === id)?.name ?? id
}

/** One icon per skill table, so a hero's tables read at a glance on his card and in the picker. */
export function skillTableIcon(id: string): IconName {
  if (isCoreCategory(id)) return CATEGORY_ICON[id]
  return 'template'
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
export function skillOptionsFor(skillTableIds: readonly string[], warbandTemplateId?: string): SkillOption[] {
  const out: SkillOption[] = []
  for (const tableId of expandTableIds(skillTableIds, warbandTemplateId)) {
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

/**
 * Templates and imports write the pseudo-table "warband-unique" rather than naming a table, which
 * the roster's own lists cannot resolve. Swap it for the warband's real tables (and, with no
 * warband to go on, for the core catalogue's warband-unique entries).
 */
export function expandTableIds(skillTableIds: readonly string[], warbandTemplateId?: string): string[] {
  const out: string[] = []
  for (const id of skillTableIds) {
    if (id !== WARBAND_UNIQUE_TABLE_ID) {
      out.push(id)
      continue
    }
    const own = warbandTemplateId ? skillTablesForWarband(warbandTemplateId) : []
    if (own.length > 0) out.push(...own.map((t) => t.id))
    else out.push(id)
  }
  return [...new Set(out)]
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

/** The profile a warrior started with: the unit's stats (with any list bonus) or the hired sword's first profile. */
export function startingProfile(template: WarbandTemplate | undefined, unitId: string | null, hiredSwordId: string | null): Stats | undefined {
  if (hiredSwordId) return findHiredSword(hiredSwordId)?.detail?.profiles[0]?.stats
  if (template && unitId) {
    const unit = findUnitTemplate(template, unitId)
    return unit ? unitStartingStats(unit) : undefined
  }
  return undefined
}

/** Special rules shown when a card is expanded: the unit's own (heroes, henchmen) or the hired sword entry's. */
export function warriorSpecialRules(template: WarbandTemplate | undefined, unitId: string | null, hiredSwordId: string | null, luthorRole?: 'crimson' | 'wizard' | 'archer', isHero = false): NamedRule[] {
  if (hiredSwordId) {
    const detail = findHiredSword(hiredSwordId)?.detail
    const role = luthorRole === 'crimson' ? 'Crimson Blade' : luthorRole === 'wizard' ? 'Dark Wizard' : 'Master Archer'
    return [...(detail?.specialRules ?? []), ...(hiredSwordId === 'luthor_wolfenbaum' && luthorRole ? detail?.otherSections?.filter(s => s.name.includes(role)) ?? [] : [])]
  }
  if (template && unitId) {
    const rules = findUnitTemplate(template, unitId)?.specialRules ?? []
    if (isHero && unitRules(unitId).promotionAdvanceSkill) return rules.filter(rule => rule.name !== 'Skittish')
    if (isHero && unitRules(unitId).rigorsOfLeadership) {
      const grants = findUnitTemplate(template, 'bullied_goblin')?.specialRules.filter(rule => ['Mob Rule', 'The Rigors of Leadership'].includes(rule.name)) ?? []
      const grantNames = new Set(grants.map(rule => rule.name))
      return [...rules.filter(rule => !grantNames.has(rule.name) && !(unitId === 'runts' && rule.name === 'Teeny Hands')), ...grants]
    }
    if (isHero && unitId === 'restless_dead_wights') {
      const blades = findUnitTemplate(template, 'restless_dead_grave_guards')?.specialRules.find(rule => /^wight blades$/i.test(rule.name))
      return blades ? [...rules, blades] : rules
    }
    return rules
  }
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

export interface XpNotch {
  /** The experience total this notch stands for. */
  point: number
  /** He has reached it. */
  earned: boolean
}

/**
 * The stretch the warrior is on, one notch per point: the box he last crossed (or his start), then
 * a notch for every point up to the next box. The notch he is standing on is earned, so a warrior
 * who has just advanced shows one filled notch and the rest empty, and the count of empty notches
 * is how many more points he needs. Empty once there are no boxes left.
 */
export function xpNotches(xp: number, role: CharacterRole, rate: AdvanceRate = 'normal'): XpNotch[] {
  const { previous, next } = xpProgress(xp, 0, role, rate)
  if (next === null) return []
  const notches: XpNotch[] = []
  for (let point = previous; point <= next; point++) {
    // `previous` is only a real, already-earned checkpoint once a box has actually been crossed
    // (previous > 0). At 0 xp there is no box behind him yet, so that first notch is not "his" —
    // filling it would show progress he has not made.
    notches.push({ point, earned: point <= xp && point > 0 })
  }
  return notches
}

/** Short labels for a warrior's persistent conditions, in a stable order. */
export function flagTags(flags: WarriorFlags): string[] {
  const tags: string[] = []
  if (flags.leaderRoleId) tags.push("Leader")
  if (flags.temporaryLeader) tags.push("Temporary leader")
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
  if (flags.nurglesRot) tags.push("Nurgle's Rot")
  if (flags.daemonPossessed) tags.push('Possessed by a Daemon')
  if (flags.addictedTo && flags.addictedTo.length > 0) tags.push(`Addicted (${flags.addictedTo.map((id) => findItem(id)?.name ?? id).join(', ')})`)
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

/** Catalogue rules headed "Note" are just the item's text; the heading adds nothing. */
export function isPlainNote(name: string): boolean {
  return /^notes?:?$/i.test(name.trim())
}

/** A Black Orc successor inherits leadership and Oi Behave, never the Boss’s species/armour rule. */
export function inheritedLeadershipRules(template: WarbandTemplate | undefined, leaderRoleId?: string): NamedRule[] {
  if (template?.id !== 'black_orcs' || leaderRoleId !== 'black_orcs_black_orc_boss') return []
  return findUnitTemplate(template, leaderRoleId)?.specialRules.filter(r => ['Leader','Oi Behave!'].includes(r.name)) ?? []
}
