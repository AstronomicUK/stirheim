// Pure helpers for the recruitment screen: unit listings with counts and limits, hired-sword
// eligibility, upkeep wording, default names and error messages. No React, no Supabase.

import { HIRED_SWORDS } from '../../rules/data/campaign/hiredSwords'
import { VETERAN_XP_COST_GC } from '../../rules/data/campaign/trading'
import { heroCapacity } from '../../rules/data/warbandTemplates'
import { isRulesError } from '../../rules/resolve/errors'
import { canRecruit, type CanRecruitResult } from '../../rules/resolve/recruitment'
import { parseRosterLimit, unitCount, warbandHeroCount, warbandModelCount } from '../../rules/resolve/roster'
import type { CharacterRole, UnitTemplate, WarbandTemplate } from '../../rules/types'
import type { HiredSwordSummary } from '../../rules/types/campaignContent'
import type { RosterHenchmanGroup, RosterHiredSword, RosterWarband } from '../../rules/types/roster'

// ---------------------------------------------------------------------------------------------
// Unit listings
// ---------------------------------------------------------------------------------------------

export interface UnitListing {
  unit: UnitTemplate
  /** Active heroes of this type, or total henchmen across groups of this type. */
  count: number
  /** Null = unlimited. */
  max: number | null
  /** "2 of 5", "3 hired" (unlimited) or "none yet". */
  countText: string
  /** Prose the limit carried, e.g. "taken instead of a Champion". */
  note?: string
  recruit: CanRecruitResult
}

/** The template's hero or henchman unit types with how many the roster holds and whether one more may be hired. */
export function listUnits(roster: RosterWarband, template: WarbandTemplate, role: CharacterRole): UnitListing[] {
  const units = role === 'hero' ? template.heroTemplates : template.henchmanTemplates
  return units.map((unit) => {
    const limit = parseRosterLimit(unit.rosterLimit)
    const count = unitCount(roster, unit)
    return {
      unit,
      count,
      max: limit.max,
      countText: countText(count, limit.max),
      note: limit.note,
      recruit: canRecruit(roster, template, unit.id),
    }
  })
}

export function countText(count: number, max: number | null): string {
  if (max !== null) return `${count} of ${max}`
  if (count === 0) return 'none yet'
  return `${count} hired`
}

/**
 * The most henchmen of this type that could join in one go before a roster rule (unit limit or
 * warband size) stops it; null when nothing but gold limits it. Never below 1 so a Stepper can
 * still show the first recruit and let the resolver explain why he cannot be hired.
 */
export function maxRecruitable(roster: RosterWarband, template: WarbandTemplate, unit: UnitTemplate): number | null {
  const bounds: number[] = []
  const limit = parseRosterLimit(unit.rosterLimit)
  if (limit.max !== null) bounds.push(limit.max - unitCount(roster, unit))
  const maxModels = template.composition?.maxModels ?? null
  if (maxModels !== null) bounds.push(maxModels - warbandModelCount(roster))
  if (unit.role === 'hero') {
    const capacity = heroCapacity(template)
    if (capacity !== null) bounds.push(capacity - warbandHeroCount(roster))
  }
  if (bounds.length === 0) return null
  return Math.max(1, Math.min(...bounds))
}

/** Henchman groups of one unit type, so recruits can join an existing group. */
export function groupsOfType(roster: RosterWarband, unitTemplateId: string): RosterHenchmanGroup[] {
  return roster.henchmenGroups.filter((g) => g.unitTemplateId === unitTemplateId)
}

export interface VeteranQuote {
  /** Experience the recruits take from the pool (group xp x size). 0 for a green group. */
  xp: number
  /** Extra gold on top of the hire fee. */
  gold: number
  /** True when the group has experience and no pool has been rolled. */
  needsPool: boolean
  /** True when the pool cannot cover the xp. */
  exceedsPool: boolean
}

/** What joining `group` with `size` recruits costs in veteran experience and gold (see recruitment.ts header). */
export function veteranQuote(group: RosterHenchmanGroup | undefined, size: number, pool: number | null): VeteranQuote {
  if (!group || group.xp <= 0 || size < 1) return { xp: 0, gold: 0, needsPool: false, exceedsPool: false }
  const xp = group.xp * size
  return {
    xp,
    gold: xp * VETERAN_XP_COST_GC,
    needsPool: pool === null,
    exceedsPool: pool !== null && xp > pool,
  }
}

// ---------------------------------------------------------------------------------------------
// Hired swords
// ---------------------------------------------------------------------------------------------

export type EligibilityKind =
  /** Nothing in the data stops the hire. */
  | 'ok'
  /** The rules text names this warband type as allowed. */
  | 'allowed'
  /** The rules text reads as excluding this warband type; the player may still overrule it. */
  | 'restricted'
  /** The restriction could not be matched against the warband type; show the text. */
  | 'check'
  /** Cannot be hired here at all (duplicate, not for gold, no profile). */
  | 'blocked'

export interface Eligibility {
  kind: EligibilityKind
  reason?: string
}

const STOPWORDS = new Set(['of', 'the', 'and', 'or', 'a', 'an', 'with', 'in', 'from', 'to', 'warband', 'warbands', 'led', 'mixed', 'variant'])

/** Lower-case words that describe the warband type: its name, race and a few common synonyms. */
export function warbandDescriptors(template: WarbandTemplate): string[] {
  const words = new Set<string>()
  const add = (text: string) => {
    for (const raw of text.toLowerCase().split(/[^a-z]+/)) {
      if (raw.length < 3 || STOPWORDS.has(raw)) continue
      words.add(raw)
      if (raw.endsWith('ies')) words.add(`${raw.slice(0, -3)}y`)
      else if (raw.endsWith('s')) words.add(raw.slice(0, -1))
      else words.add(`${raw}s`)
    }
  }
  add(template.name)
  add(template.race)
  if (words.has('mercenaries') || words.has('mercenary')) words.add('mercs')
  if (words.has('dwarf')) words.add('dwarves')
  if (words.has('elf')) words.add('elves')
  if (words.has('elves')) words.add('elf')
  return [...words]
}

const EXCLUSION_RE = /\b(except(?:ing)?|apart from|other than|save for|excluding|may not be hired by|cannot be hired by|will never join|will not join|not be hired by)\b/i
const UNIVERSAL_RE = /\b(any|all|anyone|every)\b/i
/** Qualifiers that make "any … warband" mean less than every warband. */
const QUALIFIER_RE = /\b(good|evil|chaos|chaotic|greenskin|non|devoted|include|includes|human|dwarf|elf|elves|only)\b/i
/** Words that may sit before a warband name without changing which warband is meant. */
const GENERIC = new Set(['any', 'all', 'except', 'including', 'aligned', 'good', 'evil', 'non', 'other', 'includes', 'include', 'hire', 'hired', 'for', 'by', 'only', 'human', 'as', 'such', 'are', 'ie', 'eg'])

/**
 * Does the text name one of the descriptors as a whole word? "Middenheim mercenaries" names a
 * different warband than the Reikland one, so an occurrence qualified by a proper noun that is not
 * one of ours does not count.
 */
function mentions(text: string, descriptors: string[]): boolean {
  const lower = text.toLowerCase()
  return descriptors.some((d) => {
    const re = new RegExp(`\\b${d}\\b`, 'g')
    let m: RegExpExecArray | null
    while ((m = re.exec(lower))) {
      const before = /([a-z]+)[ -]$/.exec(lower.slice(0, m.index))?.[1]
      if (!before || descriptors.includes(before) || STOPWORDS.has(before) || GENERIC.has(before)) return true
    }
    return false
  })
}

/**
 * Read a "May be hired" paragraph against the warband type. Returns 'allowed' when the text names the
 * warband, 'restricted' when it names the warband in an exclusion or lists other warbands only,
 * 'ok' for "any warband" with no matching exclusion and 'check' when the text is unclear.
 */
export function readRestriction(mayBeHired: string | undefined, template: WarbandTemplate | undefined, entryName = ''): Eligibility {
  const text = (mayBeHired ?? '').trim()
  if (!text || text === '?') return { kind: 'check', reason: 'The rules data has no "may be hired" text for this entry.' }
  if (!template) return { kind: 'check', reason: text }
  const descriptors = warbandDescriptors(template)
  // "may hire the Human Scout" must not read as naming a human warband.
  const body = entryName.trim() ? text.replace(new RegExp(`\\b(?:a|an|the)\\s+${escapeRegExp(entryName.trim())}\\b`, 'gi'), 'him') : text
  const sentences = body.split(/(?<=[.!?])\s+/)
  let positiveMatch = false
  let universal = false
  let listOnly = false
  for (const sentence of sentences) {
    const cut = EXCLUSION_RE.exec(sentence)
    const positive = cut ? sentence.slice(0, cut.index) : sentence
    // The exclusion runs until the sentence picks its verb back up ("… or Skaven may hire the …").
    const negative = cut ? sentence.slice(cut.index).split(/\b(?:may|can|will)\b/i)[0] : ''
    if (negative && mentions(negative, descriptors)) return { kind: 'restricted', reason: text }
    if (mentions(positive, descriptors)) positiveMatch = true
    else if (UNIVERSAL_RE.test(positive) && !QUALIFIER_RE.test(positive.replace(UNIVERSAL_RE, ''))) universal = true
    else if (/\bmay (?:be )?hire|can (?:be )?hire|only\b/i.test(positive) && !UNIVERSAL_RE.test(positive)) listOnly = true
  }
  if (positiveMatch) return { kind: 'allowed', reason: text }
  if (universal) return { kind: 'ok', reason: text }
  if (listOnly) return { kind: 'restricted', reason: text }
  return { kind: 'check', reason: text }
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Why this hired sword can or cannot be hired by the warband right now. */
export function hiredSwordEligibility(entry: HiredSwordSummary, roster: RosterWarband, template: WarbandTemplate | undefined): Eligibility {
  if (roster.hiredSwords.some((s) => s.hiredSwordId === entry.id && s.status === 'active')) {
    return { kind: 'blocked', reason: `Already in the warband; you can only have one of each type of Hired Sword.` }
  }
  if (entry.hireCost.base === null) {
    return { kind: 'blocked', reason: `Not hired for a plain fee (${entry.hireCost.text}); add by hand from the roster if the rules allow it.` }
  }
  if (!entry.detail?.profiles[0]) {
    return { kind: 'blocked', reason: 'The rules data has no stat profile for this entry.' }
  }
  return readRestriction(entry.detail.mayBeHired, template, entry.name)
}

export interface HiredSwordOption {
  entry: HiredSwordSummary
  eligibility: Eligibility
}

/** Every hired sword, sorted by name, with its eligibility for this warband. */
export function hiredSwordOptions(roster: RosterWarband, template: WarbandTemplate | undefined): HiredSwordOption[] {
  return [...HIRED_SWORDS]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => ({ entry, eligibility: hiredSwordEligibility(entry, roster, template) }))
}

export function findHiredSwordEntry(hiredSwordId: string): HiredSwordSummary | undefined {
  return HIRED_SWORDS.find((h) => h.id === hiredSwordId)
}

export function gradeLabel(grade: string): string {
  switch (grade) {
    case 'core':
      return 'Rulebook'
    case '1a':
      return 'Official'
    case '1b':
      return 'GW / Fanatic'
    case '1c':
      return 'Experimental'
    case '2a':
      return 'Fan'
    default:
      return grade
  }
}

/** "10 gc" / "1 wyrdstone" / "no upkeep listed". */
export function upkeepText(entry: HiredSwordSummary | undefined): string {
  return entry?.upkeep?.text ?? 'no upkeep listed'
}

/** The gold the resolver will charge for upkeep: the override, else the listed fee, else 0 for non-gold upkeep. */
export function upkeepDue(entry: HiredSwordSummary | undefined, amountOverride: number | null): number {
  if (amountOverride !== null && Number.isFinite(amountOverride)) return Math.max(0, amountOverride)
  return entry?.upkeep?.base ?? 0
}

/** One sentence on what paying upkeep will do, before the player confirms. */
export function upkeepSummary(hs: RosterHiredSword, entry: HiredSwordSummary | undefined, gold: number, amountOverride: number | null = null): string {
  const due = upkeepDue(entry, amountOverride)
  if (due <= 0) {
    const listed = entry?.upkeep?.text
    return listed && entry?.upkeep?.base === null
      ? `${hs.name}'s upkeep is ${listed}, not gold: settle it by hand, nothing is charged here.`
      : `${hs.name} has no upkeep due.`
  }
  if (gold >= due) return `Pay ${hs.name} ${due} gc; the treasury drops from ${gold} gc to ${gold - due} gc.`
  return `${hs.name} wants ${due} gc but the treasury holds ${gold} gc: he will leave the warband and any experience he gained is lost.`
}

// ---------------------------------------------------------------------------------------------
// Names and messages
// ---------------------------------------------------------------------------------------------

/** "Champions" -> "Champion", "Marksmen" -> "Marksman", "Warriors" -> "Warrior", "Youngbloods" -> "Youngblood". */
export function singular(name: string): string {
  const trimmed = name.trim()
  if (/men$/i.test(trimmed)) return trimmed.replace(/men$/i, 'man')
  if (/ies$/i.test(trimmed)) return trimmed.replace(/ies$/i, 'y')
  if (/(ss|us|is)$/i.test(trimmed)) return trimmed
  if (/s$/i.test(trimmed)) return trimmed.slice(0, -1)
  return trimmed
}

/** "Champion 2" when one Champion already stands, "Mercenary Captain" when none does. */
export function defaultHeroName(unit: UnitTemplate, roster: RosterWarband): string {
  const base = singular(unit.name)
  const existing = roster.heroes.filter((h) => h.unitTemplateId === unit.id).length
  return existing === 0 ? base : `${base} ${existing + 1}`
}

/** "Warriors" for the first group of a type, "Warriors 2" for the next. */
export function defaultGroupName(unit: UnitTemplate, roster: RosterWarband): string {
  const existing = groupsOfType(roster, unit.id).length
  return existing === 0 ? unit.name : `${unit.name} ${existing + 1}`
}

/** A RulesError's message, a plain Error's message, or a fallback. */
export function errorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (isRulesError(err)) return err.message
  if (err instanceof Error) return err.message || fallback
  return fallback
}
