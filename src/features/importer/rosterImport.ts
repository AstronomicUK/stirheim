// From a parsed the old tracker roster to a Stirheim warband: match the warband type, each unit
// type, item, skill, spell, injury and hired sword by name, report what did not match so the GM
// can fix it on screen, and build the create_warband payload plus the follow-up roster changes
// (skills, spells, injuries, flags, hired swords, treasury) that create_warband does not take.

import type { RosterChange } from '../../domain'
import { HIRED_SWORDS } from '../../rules/data/campaign/hiredSwords'
import { HENCHMAN_XP_THRESHOLDS, HERO_XP_THRESHOLDS } from '../../rules/data/campaign/experience'
import { HERO_INJURIES } from '../../rules/data/campaign/injuries'
import { SPELL_LORES } from '../../rules/data/campaign/magic'
import { WARBAND_SKILL_TABLES } from '../../rules/data/campaign/warbandSkills'
import { resolveEquipmentName } from '../../rules/data/items/aliases'
import { SKILLS } from '../../rules/data/skills'
import { WARBAND_TEMPLATES, findWarbandTemplate } from '../../rules/data/warbandTemplates'
import type { CreateWarbandPayload } from '../../rules/resolve/builder'
import type { Stats, UnitTemplate, WarbandTemplate } from '../../rules/types'
import type { AppliedInjury, WarriorFlags } from '../../rules/types/roster'
import type { ParsedRoster, ParsedWarrior } from './rosterText'

// ---------------------------------------------------------------------------------------------
// Name matching
// ---------------------------------------------------------------------------------------------

/** "KNIGHT_ERRANT" -> "knight errant"; "The Possessed" -> "possessed"; "Dire Wolves" -> "dire wolf". */
export function normaliseName(name: string): string {
  let n = name
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (n.startsWith('the ')) n = n.slice(4)
  return n
}

function singular(word: string): string {
  if (word.endsWith('wolves')) return word.slice(0, -6) + 'wolf'
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y'
  if (word.endsWith('men')) return word.slice(0, -3) + 'man'
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

function sameName(a: string, b: string): boolean {
  const na = normaliseName(a)
  const nb = normaliseName(b)
  if (na === nb) return true
  const sa = na.split(' ').map(singular).join('')
  const sb = nb.split(' ').map(singular).join('')
  return sa === sb
}

// ---------------------------------------------------------------------------------------------
// Warband and unit types
// ---------------------------------------------------------------------------------------------

/** The template whose name matches the printed type; the Restless Dead variant when a Bone Goliath is on the roster. */
export function matchWarbandTemplate(parsed: ParsedRoster): WarbandTemplate | undefined {
  const type = normaliseName(parsed.typeName)
  if (type === 'restless dead') {
    const goliath = parsed.hiredSwords.some((h) => /goliath/i.test(h.typeName ?? h.name)) || parsed.henchmen.some((g) => /goliath/i.test(g.typeName ?? g.name))
    return findWarbandTemplate(goliath ? 'the_restless_dead_variant' : 'the_restless_dead')
  }
  return WARBAND_TEMPLATES.find((t) => sameName(t.name, parsed.typeName)) ?? WARBAND_TEMPLATES.find((t) => normaliseName(t.name).includes(type) || type.includes(normaliseName(t.name)))
}

function statsWithin(actual: Stats, base: Stats, slack: number): boolean {
  return (Object.keys(base) as (keyof Stats)[]).every((k) => actual[k] >= base[k] - slack && actual[k] <= base[k] + slack)
}

/** Unit template by printed type name, else (henchman groups without a type) by a stat line within one advance of a template's. */
export function matchUnitTemplate(unit: ParsedWarrior, template: WarbandTemplate, role: 'hero' | 'henchman'): { unit: UnitTemplate | undefined; guessed: boolean } {
  const pool = role === 'hero' ? template.heroTemplates : template.henchmanTemplates
  const both = [...template.heroTemplates, ...template.henchmanTemplates]
  if (unit.typeName) {
    const byName = pool.find((u) => sameName(u.name, unit.typeName!)) ?? both.find((u) => sameName(u.name, unit.typeName!))
    if (byName) return { unit: byName, guessed: false }
    // "Group 1 — Zombie": the name carries the type.
  }
  const fromName = /—\s*(.+)$/.exec(unit.name)?.[1]
  if (fromName) {
    const byGroupName = pool.find((u) => sameName(u.name, fromName))
    if (byGroupName) return { unit: byGroupName, guessed: false }
  }
  if (unit.stats) {
    const exact = pool.filter((u) => statsWithin(unit.stats!, u.stats, 0))
    if (exact.length === 1) return { unit: exact[0], guessed: true }
    const close = pool.filter((u) => statsWithin(unit.stats!, u.stats, 1))
    if (close.length === 1) return { unit: close[0], guessed: true }
  }
  return { unit: undefined, guessed: false }
}

// ---------------------------------------------------------------------------------------------
// Skills, spells, injuries, items
// ---------------------------------------------------------------------------------------------

export function matchSkillOrSpell(name: string): { kind: 'skill' | 'spell'; id: string } | null {
  const core = SKILLS.find((s) => sameName(s.name, name))
  if (core) return { kind: 'skill', id: core.id }
  for (const table of WARBAND_SKILL_TABLES) {
    const skill = table.skills.find((s) => sameName(s.name, name))
    if (skill) return { kind: 'skill', id: skill.id }
  }
  for (const lore of SPELL_LORES) {
    const spell = lore.spells.find((s) => sameName(s.name, name))
    if (spell) return { kind: 'spell', id: spell.id }
  }
  return null
}

/** the old tracker lists some injury-chart outcomes as flags rather than injuries. */
const FLAG_INJURIES: Record<string, keyof WarriorFlags> = { frenzy: 'frenzy', hardened: 'immuneToFear', 'horrible scars': 'causesFear' }

export function matchInjury(name: string): { injury: AppliedInjury | null; flag: keyof WarriorFlags | null } {
  const norm = normaliseName(name)
  const flag = FLAG_INJURIES[norm] ?? null
  const result = HERO_INJURIES.find((i) => sameName(i.name, name)) ?? (norm === 'frenzy' ? HERO_INJURIES.find((i) => i.code === 'madness') : undefined)
  const injury: AppliedInjury | null = result ? { injuryCode: result.code, name: result.name, rolled: { d66: 0 }, effect: result.effects.map((e) => ('text' in e && typeof e.text === 'string' ? e.text : '')).filter(Boolean).join(' ') || result.text.slice(0, 120) } : null
  return { injury, flag }
}

export interface ItemMatch {
  name: string
  itemId: string | null
}

export function matchItems(names: readonly string[]): ItemMatch[] {
  return names.map((name) => ({ name, itemId: resolveEquipmentName(name)?.id ?? null }))
}

/** Stacks of the same item; a custom name when the catalogue has no entry. */
export function toPayloadItems(matches: readonly ItemMatch[]): { item_rules_id: string | null; custom_name: string | null; quantity: number }[] {
  const out: { item_rules_id: string | null; custom_name: string | null; quantity: number }[] = []
  for (const m of matches) {
    const key = m.itemId ?? `custom:${m.name}`
    const existing = out.find((o) => (o.item_rules_id ?? `custom:${o.custom_name}`) === key)
    if (existing) existing.quantity += 1
    else out.push({ item_rules_id: m.itemId, custom_name: m.itemId ? null : m.name, quantity: 1 })
  }
  return out
}

function levelUpsFor(role: 'hero' | 'henchman', xp: number): number {
  const table = role === 'hero' ? HERO_XP_THRESHOLDS : HENCHMAN_XP_THRESHOLDS
  return table.filter((t) => t <= xp).length
}

// ---------------------------------------------------------------------------------------------
// The resolved roster
// ---------------------------------------------------------------------------------------------

export interface ResolvedWarrior {
  parsed: ParsedWarrior
  unitId: string | null
  /** The unit type was inferred from the stat line, not read from the page. */
  guessed: boolean
  items: ItemMatch[]
  skillIds: string[]
  spellIds: string[]
  unknownSkills: string[]
  injuries: AppliedInjury[]
  flags: WarriorFlags
  unknownInjuries: string[]
}

export interface ResolvedGroup extends ResolvedWarrior {
  size: number
}

export interface ResolvedHiredSword {
  parsed: ParsedWarrior
  hiredSwordId: string | null
  items: ItemMatch[]
  skillIds: string[]
  unknownSkills: string[]
}

export interface ResolvedRoster {
  parsed: ParsedRoster
  template: WarbandTemplate | undefined
  heroes: ResolvedWarrior[]
  henchmen: ResolvedGroup[]
  hiredSwords: ResolvedHiredSword[]
  stash: ItemMatch[]
  /** Plain-English problems the GM should look at before saving. */
  issues: string[]
}

/** Overrides the GM made on the review screen: unit types by warrior index, the warband template. */
export interface RosterOverrides {
  templateId?: string
  heroUnits?: Record<number, string>
  groupUnits?: Record<number, string>
  hiredSwordIds?: Record<number, string>
}

function resolveWarrior(parsed: ParsedWarrior, template: WarbandTemplate | undefined, role: 'hero' | 'henchman', override: string | undefined, issues: string[], label: string): ResolvedWarrior {
  const match = template ? matchUnitTemplate(parsed, template, role) : { unit: undefined, guessed: false }
  const unitId = override ?? match.unit?.id ?? null
  if (!unitId) issues.push(`${label}: no unit type matched "${parsed.typeName ?? parsed.name}". Pick one.`)
  else if (match.guessed && !override) issues.push(`${label}: unit type guessed from the stat line (${match.unit?.name}). Check it.`)
  if (!parsed.stats) issues.push(`${label}: no stat line found.`)
  const items = matchItems(parsed.equipment)
  for (const i of items) if (!i.itemId) issues.push(`${label}: "${i.name}" is not in the catalogue; kept as a custom item.`)
  const skillIds: string[] = []
  const spellIds: string[] = []
  const unknownSkills: string[] = []
  for (const s of parsed.skills) {
    const m = matchSkillOrSpell(s)
    if (!m) unknownSkills.push(s)
    else if (m.kind === 'skill') skillIds.push(m.id)
    else spellIds.push(m.id)
  }
  for (const s of unknownSkills) issues.push(`${label}: skill or spell "${s}" not recognised; noted on the warrior.`)
  const injuries: AppliedInjury[] = []
  const flags: WarriorFlags = {}
  const unknownInjuries: string[] = []
  for (const name of parsed.injuries) {
    const m = matchInjury(name)
    if (m.flag) (flags as Record<string, unknown>)[m.flag] = true
    if (m.injury) injuries.push(m.injury)
    else if (!m.flag) unknownInjuries.push(name)
  }
  for (const s of unknownInjuries) issues.push(`${label}: injury "${s}" not recognised; noted on the warrior.`)
  return { parsed, unitId, guessed: match.guessed && !override, items, skillIds, spellIds, unknownSkills, injuries, flags, unknownInjuries }
}

export function resolveRelicRoster(parsed: ParsedRoster, overrides: RosterOverrides = {}): ResolvedRoster {
  const issues: string[] = []
  const template = overrides.templateId ? findWarbandTemplate(overrides.templateId) : matchWarbandTemplate(parsed)
  if (!template) issues.push(`Warband type "${parsed.typeName}" not recognised. Pick one.`)
  const heroes = parsed.heroes.map((h, i) => resolveWarrior(h, template, 'hero', overrides.heroUnits?.[i], issues, h.name))
  const henchmen = parsed.henchmen.map((g, i) => ({ ...resolveWarrior(g, template, 'henchman', overrides.groupUnits?.[i], issues, g.name), size: g.size }))
  const hiredSwords: ResolvedHiredSword[] = parsed.hiredSwords.map((h, i) => {
    const id = overrides.hiredSwordIds?.[i] ?? (HIRED_SWORDS.find((s) => sameName(s.name, h.typeName ?? h.name)) ?? HIRED_SWORDS.find((s) => sameName(s.name, h.name)))?.id ?? null
    if (!id) issues.push(`${h.name}: hired sword "${h.typeName ?? h.name}" not recognised. Pick one.`)
    const items = matchItems(h.equipment)
    for (const it of items) if (!it.itemId) issues.push(`${h.name}: "${it.name}" is not in the catalogue; kept as a custom item.`)
    const skillIds: string[] = []
    const unknownSkills: string[] = []
    for (const s of h.skills) {
      const m = matchSkillOrSpell(s)
      if (m?.kind === 'skill') skillIds.push(m.id)
      else unknownSkills.push(s)
    }
    return { parsed: h, hiredSwordId: id, items, skillIds, unknownSkills }
  })
  const stash = matchItems(parsed.stash)
  for (const i of stash) if (!i.itemId) issues.push(`Stash: "${i.name}" is not in the catalogue; kept as a custom item.`)
  if (parsed.unplaced.length > 0) issues.push(`Lines not understood: ${parsed.unplaced.slice(0, 5).join('; ')}${parsed.unplaced.length > 5 ? '…' : ''}`)
  return { parsed, template, heroes, henchmen, hiredSwords, stash, issues }
}

// ---------------------------------------------------------------------------------------------
// What gets written
// ---------------------------------------------------------------------------------------------

const DEFAULT_STATS: Stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }

function warriorNotes(w: ResolvedWarrior): string {
  const parts: string[] = []
  if (w.parsed.mutations.length > 0) parts.push(`Mutations: ${w.parsed.mutations.join(', ')}.`)
  if (w.unknownSkills.length > 0) parts.push(`Skills/spells to check: ${w.unknownSkills.join(', ')}.`)
  if (w.unknownInjuries.length > 0) parts.push(`Injuries to check: ${w.unknownInjuries.join(', ')}.`)
  return parts.join(' ')
}

/** The create_warband payload: heroes, henchmen and their kit, the stash. Skills, injuries and hired swords follow in `followUpChanges`. */
export function toCreatePayload(resolved: ResolvedRoster, importedFrom = 'Relic & Ruin'): CreateWarbandPayload {
  if (!resolved.template) throw new Error('Pick the warband type first.')
  const template = resolved.template
  return {
    name: resolved.parsed.name,
    type_rules_id: template.id,
    gold: resolved.parsed.gold,
    notes: `Imported from ${importedFrom} on ${new Date().toISOString().slice(0, 10)}.`,
    heroes: resolved.heroes.map((h, i) => {
      const unit = template.heroTemplates.find((u) => u.id === h.unitId) ?? template.henchmanTemplates.find((u) => u.id === h.unitId)
      return {
        name: h.parsed.name,
        unit_type_rules_id: h.unitId ?? 'unknown',
        stats: h.parsed.stats ?? unit?.stats ?? DEFAULT_STATS,
        xp: h.parsed.xp,
        level_ups: levelUpsFor('hero', h.parsed.xp),
        skill_tables: unit?.skillTableIds ?? [],
        is_large: Boolean(unit?.traitIds?.includes('large_target')) || h.parsed.typeName?.toLowerCase().includes('centaur') === true,
        sort_order: i,
        equipment: toPayloadItems(h.items),
      }
    }),
    henchman_groups: resolved.henchmen.map((g, i) => {
      const unit = template.henchmanTemplates.find((u) => u.id === g.unitId)
      return {
        name: g.parsed.name,
        unit_type_rules_id: g.unitId ?? 'unknown',
        size: g.size,
        stats: g.parsed.stats ?? unit?.stats ?? DEFAULT_STATS,
        xp: g.parsed.xp,
        level_ups: levelUpsFor('henchman', g.parsed.xp),
        is_large: Boolean(unit?.traitIds?.includes('large_target')),
        sort_order: i,
        equipment: toPayloadItems(g.items),
      }
    }),
    stash: toPayloadItems(resolved.stash),
  }
}

/** Hero rows as created, matched back by sort order, so the follow-up changes can address them. */
export interface CreatedHero {
  id: string
  sort_order: number
  name: string
}

/** Skills, spells, injuries, flags and notes per hero; hired swords and their kit; wyrdstone and the veteran pool. */
export function followUpChanges(resolved: ResolvedRoster, created: CreatedHero[], newId: () => string = () => crypto.randomUUID()): RosterChange[] {
  const changes: RosterChange[] = []
  changes.push({ table: 'warbands', op: 'update', data: { wyrdstone: resolved.parsed.wyrdstone, veteran_pool: resolved.parsed.veteranPool } })
  resolved.heroes.forEach((h, i) => {
    const row = created.find((c) => c.sort_order === i) ?? created.find((c) => c.name === h.parsed.name)
    if (!row) return
    const data: Record<string, unknown> = {}
    if (h.skillIds.length) data.skills = h.skillIds
    if (h.spellIds.length) data.spells = h.spellIds
    if (h.injuries.length) data.injuries = h.injuries
    if (Object.keys(h.flags).length) data.flags = h.flags
    const notes = warriorNotes(h)
    if (notes) data.notes = notes
    if (Object.keys(data).length) changes.push({ table: 'heroes', op: 'update', id: row.id, data })
  })
  resolved.hiredSwords.forEach((s, i) => {
    if (!s.hiredSwordId) return
    const id = newId()
    changes.push({
      table: 'heroes',
      op: 'insert',
      id,
      data: {
        name: s.parsed.name,
        is_hired_sword: true,
        hired_sword_rules_id: s.hiredSwordId,
        stats: s.parsed.stats ?? DEFAULT_STATS,
        xp: s.parsed.xp,
        level_ups: levelUpsFor('hero', s.parsed.xp),
        skills: s.skillIds,
        equipment_locked: true,
        sort_order: 100 + i,
        notes: s.unknownSkills.length ? `Skills/spells to check: ${s.unknownSkills.join(', ')}.` : '',
      },
    })
    for (const item of toPayloadItems(s.items)) {
      changes.push({ table: 'items', op: 'insert', id: newId(), data: { holder_type: 'hero', holder_id: id, item_rules_id: item.item_rules_id, custom_name: item.custom_name, quantity: item.quantity } })
    }
  })
  return changes
}
