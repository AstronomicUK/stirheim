// Pure helpers behind the warband list, template picker and builder screens. No React, no store:
// everything here is unit-tested in helpers.test.ts.

import type { WarbandSummary } from '../../../api/warbands'
import { findUnitTemplate } from '../../../rules/data/warbandTemplates'
import {
  DEFAULT_STARTING_GOLD,
  draftItemCost,
  type DraftGroup,
  type DraftHero,
  type DraftItem,
  type EquipmentOption,
  type WarbandDraft,
} from '../../../rules/resolve/builder'
import { parseEquipmentCost, type EquipmentCurrency } from '../../../rules/resolve/equipmentCost'
import { parseRosterLimit, type RosterProblem } from '../../../rules/resolve/roster'
import type { UnitTemplate, WarbandGrade, WarbandTemplate } from '../../../rules/types'

// ---- Warband list ----

export function splitArchived<T extends Pick<WarbandSummary, 'archived'>>(warbands: T[]): { active: T[]; archived: T[] } {
  return {
    active: warbands.filter((w) => !w.archived),
    archived: warbands.filter((w) => w.archived),
  }
}

// ---- Grades ----

export const GRADE_ORDER: WarbandGrade[] = ['core', '1a', '1b', '1c', '2a', 'variant']

const GRADE_LABELS: Record<WarbandGrade, string> = {
  core: 'Core rulebook',
  '1a': 'Grade 1a',
  '1b': 'Grade 1b',
  '1c': 'Grade 1c',
  '2a': 'Grade 2a',
  variant: 'Variants',
}

export function gradeLabel(grade: WarbandGrade): string {
  return GRADE_LABELS[grade] ?? grade
}

/** The grades that actually occur in `templates`, in rulebook order. */
export function gradesPresent(templates: Pick<WarbandTemplate, 'grade'>[]): WarbandGrade[] {
  const present = new Set(templates.map((t) => t.grade))
  return GRADE_ORDER.filter((g) => present.has(g))
}

// ---- Template search ----

export type GradeFilter = WarbandGrade | 'all'

/**
 * Case-insensitive search over name, race and setting. Every whitespace-separated word of the
 * query must appear somewhere; an empty query matches everything. `grade` narrows further.
 */
export function filterTemplates<T extends Pick<WarbandTemplate, 'name' | 'race' | 'originalSetting' | 'grade'>>(
  templates: T[],
  query: string,
  grade: GradeFilter = 'all',
): T[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  return templates.filter((t) => {
    if (grade !== 'all' && t.grade !== grade) return false
    if (words.length === 0) return true
    const haystack = `${t.name} ${t.race} ${t.originalSetting}`.toLowerCase()
    return words.every((w) => haystack.includes(w))
  })
}

// ---- Composition ----

export function startingGoldOf(template: Pick<WarbandTemplate, 'composition'>): number {
  return template.composition?.startingGold ?? DEFAULT_STARTING_GOLD
}

/** "3 to 15 warriors", "at least 3 warriors", "up to 12 warriors" or "" when nothing is stated. */
export function modelRangeText(min: number | null | undefined, max: number | null | undefined): string {
  const lo = min ?? null
  const hi = max ?? null
  if (lo !== null && hi !== null) return `${lo} to ${hi} warriors`
  if (lo !== null) return `at least ${lo} warriors`
  if (hi !== null) return `up to ${hi} warriors`
  return ''
}

/** "500 gc · 3 to 15 warriors" — the one-line composition summary for a template row. */
export function compositionSummary(template: Pick<WarbandTemplate, 'composition'>): string {
  const parts = [`${startingGoldOf(template)} gc`]
  const range = modelRangeText(template.composition?.minModels, template.composition?.maxModels)
  if (range) parts.push(range)
  return parts.join(' · ')
}

// ---- Units and limits ----

/** Models of this unit type in the draft: heroes count heads, henchman templates count group members. */
export function draftUnitCount(draft: Pick<WarbandDraft, 'heroes' | 'groups'>, unit: Pick<UnitTemplate, 'id' | 'role'>): number {
  if (unit.role === 'hero') return draft.heroes.filter((h) => h.unitTemplateId === unit.id).length
  return draft.groups.filter((g) => g.unitTemplateId === unit.id).reduce((sum, g) => sum + g.size, 0)
}

/** True when one more model of this unit type would exceed its roster limit. */
export function unitLimitReached(draft: Pick<WarbandDraft, 'heroes' | 'groups'>, unit: Pick<UnitTemplate, 'id' | 'role' | 'rosterLimit'>): boolean {
  const limit = parseRosterLimit(unit.rosterLimit)
  if (limit.max === null) return false
  return draftUnitCount(draft, unit) >= limit.max
}

/** "1 of 2 taken", "3 taken" (unlimited), "none yet". */
export function takenText(taken: number, rosterLimit: string): string {
  const limit = parseRosterLimit(rosterLimit)
  if (limit.max !== null) return `${taken} of ${limit.max} taken`
  return taken === 0 ? 'none yet' : `${taken} taken`
}

/** How many more models a group may hold given the unit limit and the other groups of the same type; null = unbounded. */
export function groupSizeCeiling(draft: Pick<WarbandDraft, 'heroes' | 'groups'>, group: DraftGroup, unit: Pick<UnitTemplate, 'id' | 'role' | 'rosterLimit'>): number | null {
  const limit = parseRosterLimit(unit.rosterLimit)
  if (limit.max === null) return null
  const others = draftUnitCount(draft, unit) - group.size
  return Math.max(1, limit.max - others)
}

export function modelCount(draft: Pick<WarbandDraft, 'heroes' | 'groups'>): number {
  return draft.heroes.length + draft.groups.reduce((sum, g) => sum + g.size, 0)
}

// ---- Costs ----

export interface SubjectCost {
  /** Hire cost: one hero, or every model of a group. */
  hire: number
  /** Equipment spend for the whole subject (group: per model x size); null when a line is unpriced. */
  equipment: number | null
  total: number | null
}

function equipmentTotal(items: DraftItem[], models: number): number | null {
  let sum = 0
  for (const item of items) {
    const each = draftItemCost(item)
    if (each === null) return null
    sum += each * models
  }
  return sum
}

export function heroCost(hero: DraftHero, template: WarbandTemplate): SubjectCost {
  const hire = findUnitTemplate(template, hero.unitTemplateId)?.cost ?? 0
  const equipment = equipmentTotal(hero.equipment, 1)
  return { hire, equipment, total: equipment === null ? null : hire + equipment }
}

export function groupCost(group: DraftGroup, template: WarbandTemplate): SubjectCost {
  const hire = (findUnitTemplate(template, group.unitTemplateId)?.cost ?? 0) * group.size
  const equipment = equipmentTotal(group.equipment, group.size)
  return { hire, equipment, total: equipment === null ? null : hire + equipment }
}

export function formatAmount(amount: number | null, currency: EquipmentCurrency = 'gc'): string {
  return amount === null ? 'price needed' : `${amount} ${currency}`
}

export function itemCurrency(item: Pick<DraftItem, 'costText'>): EquipmentCurrency {
  return parseEquipmentCost(item.costText).currency
}

/** True when the list price cannot be known from the text ("3 times the cost") and the player must enter one. */
export function needsPrice(item: Pick<DraftItem, 'costText'>): boolean {
  const kind = parseEquipmentCost(item.costText).kind
  return kind === 'multiplier' || kind === 'unknown'
}

// ---- Equipment options ----

export type EquipmentSection = EquipmentOption['section']

export const SECTION_TITLES: Record<EquipmentSection, string> = {
  melee: 'Hand-to-hand weapons',
  missile: 'Missile weapons',
  armour: 'Armour',
}

export interface EquipmentSectionGroup {
  section: EquipmentSection
  title: string
  options: EquipmentOption[]
}

/** Options in list order, split by section; empty sections are left out. */
export function groupEquipmentOptions(options: EquipmentOption[]): EquipmentSectionGroup[] {
  const order: EquipmentSection[] = ['melee', 'missile', 'armour']
  return order
    .map((section) => ({ section, title: SECTION_TITLES[section], options: options.filter((o) => o.section === section) }))
    .filter((group) => group.options.length > 0)
}

/** The equipment-list option a draft stack came from (same catalogue item, or same list name for custom lines). */
export function optionForItem(options: EquipmentOption[], item: Pick<DraftItem, 'itemId' | 'customName'>): EquipmentOption | undefined {
  if (item.itemId !== null) return options.find((o) => o.item?.id === item.itemId)
  return options.find((o) => o.item === undefined && o.name === (item.customName ?? ''))
}

/** How many of an option a subject already carries (per model for groups). */
export function quantityOf(equipment: DraftItem[], option: EquipmentOption): number {
  const stack = equipment.find((item) =>
    option.item ? item.itemId === option.item.id : item.itemId === null && (item.customName ?? '') === option.name,
  )
  return stack?.quantity ?? 0
}

// ---- Problems ----

export type ProblemGroupKey = 'treasury' | 'roster' | 'names' | 'prices' | 'other'

export interface ProblemGroup {
  key: ProblemGroupKey
  title: string
  problems: RosterProblem[]
}

const GROUP_TITLES: Record<ProblemGroupKey, string> = {
  treasury: 'Treasury',
  roster: 'Roster',
  names: 'Names',
  prices: 'Prices',
  other: 'Other',
}

export function problemGroupKey(code: string): ProblemGroupKey {
  switch (code) {
    case 'builder.overspent':
    case 'roster.negativeGold':
      return 'treasury'
    case 'builder.emptyName':
    case 'builder.unnamedWarrior':
      return 'names'
    case 'builder.unknownCost':
      return 'prices'
  }
  if (code.startsWith('roster.')) return 'roster'
  return 'other'
}

/** Problems bucketed for display, in a fixed order; empty buckets are dropped. Order within a bucket is preserved. */
export function groupProblems(problems: RosterProblem[]): ProblemGroup[] {
  const order: ProblemGroupKey[] = ['treasury', 'roster', 'names', 'prices', 'other']
  return order
    .map((key) => ({ key, title: GROUP_TITLES[key], problems: problems.filter((p) => problemGroupKey(p.code) === key) }))
    .filter((group) => group.problems.length > 0)
}

export interface WarbandGroup {
  key: string
  /** Campaign name, "No campaign", or null when everything is in one place and no heading is needed. */
  title: string | null
  campaignId: string | null
  warbands: WarbandSummary[]
}

/** Active warbands under their campaign, campaigns alphabetically, "No campaign" last. */
export function groupByCampaign(warbands: WarbandSummary[]): WarbandGroup[] {
  const byCampaign = new Map<string, WarbandGroup>()
  const loose: WarbandSummary[] = []
  for (const w of warbands) {
    if (!w.campaign) {
      loose.push(w)
      continue
    }
    const existing = byCampaign.get(w.campaign.id)
    if (existing) existing.warbands.push(w)
    else byCampaign.set(w.campaign.id, { key: w.campaign.id, title: w.campaign.name, campaignId: w.campaign.id, warbands: [w] })
  }
  const groups = [...byCampaign.values()].sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
  if (loose.length > 0) groups.push({ key: 'none', title: groups.length > 0 ? 'No campaign' : null, campaignId: null, warbands: loose })
  return groups
}
