// Pure helpers for the advancement screen: grouping pending advances by warrior, the persisted
// draft of one advance being rolled, and turning that draft plus the loaded roster into a plan
// (what the player still has to supply) or a finished result (the new roster, the events and the
// `resolution` narrative stored on the pending_advances row). Nothing here touches React, storage
// or the network, so it is unit-tested in node.
//
// Rule judgements made here (the resolvers in src/rules/resolve/advances.ts make the rest):
// - Hired swords roll on the hero table. They are given a RosterHero shape for the resolvers: skill
//   tables are read from the core table names in their entry's "Skills" text (all five when none
//   is named), and racial maxima come from a keyword match on the entry name ("Ogre Bodyguard"),
//   falling back to Human rather than the warband's race.
// - A hero whose rolled characteristic is at its racial maximum picks a skill instead; when both
//   offered stats of a "choose" result are maxed the resolver's any-other-stat fallback is shown
//   alongside "a skill instead".
// - A henchman result that cannot be taken (characteristic already increased, at racial maximum,
//   hero roster full for The lad's got talent) has to be re-rolled; earlier totals are kept in
//   `rerolled` for the record.
// - A wizard may learn a spell instead of a skill on a New Skill result. The lore is the one
//   holding a spell the hero already knows, or the Wizard -> Type of Magic row whose label is
//   "<warband name> <unit name>" or the unit name alone.

import type { PendingAdvanceRow } from '../../domain'
import { findHiredSword } from '../../rules/data/campaign/hiredSwords'
import { findRacialMaximum } from '../../rules/data/campaign/experience'
import { SPELL_LORES, WIZARD_ALLOCATIONS, findLore } from '../../rules/data/campaign/magic'
import { findUnitTemplate, heroCapacity } from '../../rules/data/warbandTemplates'
import {
  CORE_SKILL_TABLE_IDS,
  STAT_KEYS,
  allowedSkillTablesFor,
  applyHenchmanStatIncrease,
  applyStatIncrease,
  availableSkills,
  eligibleHenchmanStats,
  eligibleStatChoices,
  learnSkill,
  learnSpell,
  promoteHenchman,
  resolveHenchmanAdvanceRoll,
  resolveHeroAdvanceRoll,
  resolveHeroAdvanceSubRoll,
  resolveRacialProfile,
  type AvailableSkillTable,
  type HenchmanAdvanceRoll,
  type HeroAdvanceRoll,
} from '../../rules/resolve/advances'
import { isRulesError } from '../../rules/resolve/errors'
import { STAT_NAMES } from '../../rules/resolve/injuries'
import type { Stats, WarbandTemplate } from '../../rules/types'
import type { StatKey } from '../../rules/types/common'
import type { Spell, SpellLore } from '../../rules/types/magic'
import type { ResolutionEvent, RosterHenchmanGroup, RosterHero, RosterHiredSword, RosterWarband } from '../../rules/types/roster'
import { unitRules } from '../../rules/data/campaignRules'

// ---------------------------------------------------------------------------------------------
// Pending advances by warrior
// ---------------------------------------------------------------------------------------------

export interface AdvanceGroup {
  subjectType: 'hero' | 'group'
  subjectId: string
  /** Oldest first; the first one is the next to resolve. */
  advances: PendingAdvanceRow[]
}

/** One entry per warrior, ordered by the oldest advance owed, each with its advances oldest first. */
export function groupAdvancesBySubject(rows: readonly PendingAdvanceRow[]): AdvanceGroup[] {
  const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.threshold_xp - b.threshold_xp)
  const groups = new Map<string, AdvanceGroup>()
  for (const row of sorted) {
    const key = `${row.subject_type}:${row.subject_id}`
    const group = groups.get(key)
    if (group) group.advances.push(row)
    else groups.set(key, { subjectType: row.subject_type, subjectId: row.subject_id, advances: [row] })
  }
  return [...groups.values()]
}

export type AdvanceSubject =
  | { kind: 'hero'; hero: RosterHero }
  | { kind: 'hiredSword'; sword: RosterHiredSword }
  | { kind: 'group'; group: RosterHenchmanGroup }

/** The warrior an advance belongs to, or null when it has left the roster since the advance was earned. */
export function findSubject(roster: RosterWarband, subjectType: 'hero' | 'group', subjectId: string): AdvanceSubject | null {
  if (subjectType === 'group') {
    const group = roster.henchmenGroups.find((g) => g.id === subjectId)
    return group ? { kind: 'group', group } : null
  }
  const hero = roster.heroes.find((h) => h.id === subjectId)
  if (hero) return { kind: 'hero', hero }
  const sword = roster.hiredSwords.find((h) => h.id === subjectId)
  return sword ? { kind: 'hiredSword', sword } : null
}

export function subjectName(subject: AdvanceSubject): string {
  switch (subject.kind) {
    case 'hero':
      return subject.hero.name
    case 'hiredSword':
      return subject.sword.name
    case 'group':
      return subject.group.name
  }
}

// ---------------------------------------------------------------------------------------------
// Hired swords and henchman groups as heroes, for the resolvers that want a RosterHero
// ---------------------------------------------------------------------------------------------

/** Core skill tables named in the hired sword's "Skills" text; all five when it names none. */
export function hiredSwordSkillTables(sword: RosterHiredSword): string[] {
  const text = findHiredSword(sword.hiredSwordId)?.detail?.skills ?? ''
  const named = CORE_SKILL_TABLE_IDS.filter((id) => new RegExp(`\\b${id}\\b`, 'i').test(text))
  return named.length > 0 ? named : [...CORE_SKILL_TABLE_IDS]
}

/** A hired sword in the shape learnSkill / applyStatIncrease expect. `name` can be overridden for profile matching. */
export function hiredSwordAsHero(sword: RosterHiredSword, name: string = sword.name): RosterHero {
  return {
    id: sword.id,
    name,
    unitTemplateId: `hired_sword:${sword.hiredSwordId}`,
    stats: sword.stats,
    xp: sword.xp,
    levelUps: sword.levelUps,
    skillTableIds: hiredSwordSkillTables(sword),
    skillIds: sword.skillIds,
    spellIds: [],
    injuries: sword.injuries,
    flags: sword.flags,
    equipment: sword.equipment,
    status: sword.status === 'left' ? 'retired' : sword.status,
  }
}

/** Fold a resolver's hero result back onto the hired sword row (stats, advances and skills only). */
export function heroToHiredSword(sword: RosterHiredSword, hero: RosterHero): RosterHiredSword {
  return { ...sword, stats: hero.stats, levelUps: hero.levelUps, skillIds: hero.skillIds }
}

function groupAsHero(group: RosterHenchmanGroup): RosterHero {
  return {
    id: group.id,
    name: group.name,
    unitTemplateId: group.unitTemplateId,
    stats: group.stats,
    xp: group.xp,
    levelUps: group.levelUps,
    skillTableIds: [],
    skillIds: [],
    spellIds: [],
    injuries: [],
    flags: {},
    equipment: group.equipment,
    status: 'active',
  }
}

export interface MaximaInfo {
  maxima: Stats
  /** RACIAL_MAXIMUMS profile name. */
  profile: string
  /** Shown when the profile was guessed rather than read from the roster. */
  note: string | null
}

function humanMaxima(): Stats {
  const human = findRacialMaximum('Human')
  if (!human) throw new RangeError('RACIAL_MAXIMUMS has no Human row')
  return { ...human.stats }
}

export function heroMaxima(hero: RosterHero, warbandTemplateId: string): MaximaInfo {
  const match = resolveRacialProfile(hero, warbandTemplateId)
  const warning = match.events.find((e) => e.kind === 'warning')
  return { maxima: match.value.maxima, profile: match.value.profile, note: warning ? warning.message : null }
}

/** Hired swords: a keyword match on the entry name ("Ogre Bodyguard" -> Ogre), otherwise Human. */
export function hiredSwordMaxima(sword: RosterHiredSword, warbandTemplateId: string): MaximaInfo {
  const entryName = findHiredSword(sword.hiredSwordId)?.name ?? sword.name
  const match = resolveRacialProfile(hiredSwordAsHero(sword, entryName), warbandTemplateId)
  if (match.value.matchedBy === 'unitName') {
    return { maxima: match.value.maxima, profile: match.value.profile, note: `Racial maximums taken from the ${entryName} entry.` }
  }
  return { maxima: humanMaxima(), profile: 'Human', note: `Hired swords have no racial profile on the roster; ${entryName} is treated as Human.` }
}

export function groupMaxima(group: RosterHenchmanGroup, warbandTemplateId: string): MaximaInfo {
  return heroMaxima(groupAsHero(group), warbandTemplateId)
}

// ---------------------------------------------------------------------------------------------
// Spells
// ---------------------------------------------------------------------------------------------

/** The lore a hero draws new spells from, or null when the roster gives no sign he is a wizard. */
export function loreForHero(hero: RosterHero, template: WarbandTemplate | undefined): SpellLore | null {
  const known = SPELL_LORES.find((lore) => lore.spells.some((s) => hero.spellIds.includes(s.id)))
  if (known) return known
  const unit = template ? findUnitTemplate(template, hero.unitTemplateId) : undefined
  if (!unit) return null
  const labels = [template ? `${template.name} ${unit.name}` : null, unit.name].filter((x): x is string => x !== null).map((x) => x.toLowerCase())
  const row = WIZARD_ALLOCATIONS.find((a) => a.loreId !== null && labels.includes(a.wizard.toLowerCase()))
  return row?.loreId ? (findLore(row.loreId) ?? null) : null
}

/** Spells of the lore the hero does not know yet, in table order. */
export function unknownSpells(lore: SpellLore, hero: RosterHero): Spell[] {
  return lore.spells.filter((s) => !hero.spellIds.includes(s.id))
}

/** The spell a D6 generates on the lore's table (the first when a band covers two). */
export function spellForRoll(lore: SpellLore, d6: number): Spell | undefined {
  return lore.spells.find((s) => d6 >= s.roll.min && d6 <= s.roll.max)
}

// ---------------------------------------------------------------------------------------------
// The draft: what the player has entered, and nothing derived from it
// ---------------------------------------------------------------------------------------------

export const ADVANCE_DRAFT_VERSION = 1

export type AdvanceStep = 'roll' | 'choose' | 'review'
export const ADVANCE_STEPS: readonly AdvanceStep[] = ['roll', 'choose', 'review']

export interface AdvanceDraft {
  /** The two D6 as rolled. */
  dice: [number | null, number | null]
  /** The D6 follow-up of a "roll again" characteristic result. */
  subRoll: number | null
  /** 2D6 totals that had to be re-rolled, oldest first. */
  rerolled: number[]
  /** New Skill result: learn a skill, or (wizards) a spell instead. */
  mode: 'skill' | 'spell'
  skillId: string | null
  spellId: string | null
  stat: StatKey | null
  /** Every offered characteristic is at its maximum and the player takes a skill instead. */
  skillInstead: boolean
  /** The lad's got talent. */
  newHeroName: string
  skillTableIds: string[]
  /** Generated once with crypto.randomUUID() so a refresh does not change the new hero's id. */
  newHeroId: string
  step: AdvanceStep
}

export function emptyDraft(newHeroId: string, newHeroName = ''): AdvanceDraft {
  return {
    dice: [null, null],
    subRoll: null,
    rerolled: [],
    mode: 'skill',
    skillId: null,
    spellId: null,
    stat: null,
    skillInstead: false,
    newHeroName,
    skillTableIds: [],
    newHeroId,
    step: 'roll',
  }
}

export function diceTotal(draft: Pick<AdvanceDraft, 'dice'>): number | null {
  const [a, b] = draft.dice
  return a !== null && b !== null ? a + b : null
}

/** Anything chosen after the roll is forgotten when the roll changes. */
function clearChoices(draft: AdvanceDraft): AdvanceDraft {
  return { ...draft, subRoll: null, skillId: null, spellId: null, stat: null, skillInstead: false, mode: 'skill' }
}

export function setDie(draft: AdvanceDraft, index: 0 | 1, value: number | null): AdvanceDraft {
  if (draft.dice[index] === value) return draft
  const dice: [number | null, number | null] = [draft.dice[0], draft.dice[1]]
  dice[index] = value
  return clearChoices({ ...draft, dice, step: 'roll' })
}

export function setDice(draft: AdvanceDraft, a: number, b: number): AdvanceDraft {
  return clearChoices({ ...draft, dice: [a, b], step: 'roll' })
}

export function setSubRoll(draft: AdvanceDraft, value: number | null): AdvanceDraft {
  if (draft.subRoll === value) return draft
  return { ...draft, subRoll: value, skillId: null, spellId: null, stat: null, skillInstead: false }
}

export function setStat(draft: AdvanceDraft, stat: StatKey | null): AdvanceDraft {
  return { ...draft, stat, skillInstead: false }
}

export function setSkill(draft: AdvanceDraft, skillId: string | null): AdvanceDraft {
  return { ...draft, skillId, spellId: null, mode: 'skill' }
}

export function setSpell(draft: AdvanceDraft, spellId: string | null): AdvanceDraft {
  return { ...draft, spellId, skillId: null, mode: 'spell' }
}

export function setMode(draft: AdvanceDraft, mode: 'skill' | 'spell'): AdvanceDraft {
  if (draft.mode === mode) return draft
  return { ...draft, mode, skillId: null, spellId: null }
}

export function setSkillInstead(draft: AdvanceDraft, skillInstead: boolean): AdvanceDraft {
  return { ...draft, skillInstead, stat: skillInstead ? null : draft.stat, skillId: skillInstead ? draft.skillId : null }
}

export function setNewHeroName(draft: AdvanceDraft, newHeroName: string): AdvanceDraft {
  return { ...draft, newHeroName }
}

/** Toggle a skill table for the promoted hero; a third pick replaces the oldest. */
export function toggleSkillTable(draft: AdvanceDraft, tableId: string): AdvanceDraft {
  if (draft.skillTableIds.includes(tableId)) return { ...draft, skillTableIds: draft.skillTableIds.filter((t) => t !== tableId) }
  const kept = draft.skillTableIds.length >= 2 ? draft.skillTableIds.slice(1) : draft.skillTableIds
  return { ...draft, skillTableIds: [...kept, tableId] }
}

export function setStep(draft: AdvanceDraft, step: AdvanceStep): AdvanceDraft {
  return draft.step === step ? draft : { ...draft, step }
}

/** What "Pick later" stores on the pending row: the dice as rolled, so the choice can be made later. */
export interface AdvanceRolled {
  version: 1
  dice: [number, number]
  subRoll?: number
  rerolled?: number[]
  mode?: 'skill' | 'spell'
  /** "Rolled 11: New skill" for lists. */
  text: string
}

export function rolledFromDraft(draft: AdvanceDraft, rollText: string): AdvanceRolled | null {
  const total = diceTotal(draft)
  if (total === null) return null
  const out: AdvanceRolled = { version: 1, dice: [draft.dice[0] ?? 0, draft.dice[1] ?? 0], text: `Rolled ${total}: ${rollText}` }
  if (draft.subRoll !== null) out.subRoll = draft.subRoll
  if (draft.rerolled.length > 0) out.rerolled = [...draft.rerolled]
  if (draft.mode === 'spell') out.mode = 'spell'
  return out
}

/** A draft that starts at the choice, from a row whose dice were rolled earlier; null when the stored shape is unusable. */
export function draftFromRolled(rolled: Record<string, unknown> | null | undefined, newHeroId: string, newHeroName = ''): AdvanceDraft | null {
  if (!rolled || !Array.isArray(rolled.dice) || rolled.dice.length !== 2) return null
  const [a, b] = rolled.dice
  if (typeof a !== 'number' || typeof b !== 'number') return null
  const draft = emptyDraft(newHeroId, newHeroName)
  return {
    ...draft,
    dice: [a, b],
    subRoll: typeof rolled.subRoll === 'number' ? rolled.subRoll : null,
    rerolled: Array.isArray(rolled.rerolled) ? rolled.rerolled.filter((n): n is number => typeof n === 'number') : [],
    mode: rolled.mode === 'spell' ? 'spell' : 'skill',
    step: 'choose',
  }
}

/** Human summary of a stored roll ("Rolled 11: New skill"), or null. */
export function readRolled(value: Record<string, unknown> | null | undefined): string | null {
  return value && typeof value.text === 'string' ? value.text : null
}

/** Put the current total on record and clear the dice for another roll. */
export function reroll(draft: AdvanceDraft): AdvanceDraft {
  const total = diceTotal(draft)
  return clearChoices({ ...draft, dice: [null, null], rerolled: total === null ? draft.rerolled : [...draft.rerolled, total], step: 'roll' })
}

/** "Watchmen" -> "Watchman", "Marksmen" -> "Marksman", "Youngbloods" -> "Youngblood". */
export function singular(name: string): string {
  const trimmed = name.trim()
  if (/men$/i.test(trimmed)) return trimmed.replace(/men$/i, (m) => (m === 'MEN' ? 'MAN' : 'man'))
  if (/ies$/i.test(trimmed)) return trimmed.replace(/ies$/i, 'y')
  if (/(ss|us)$/i.test(trimmed)) return trimmed
  if (/s$/i.test(trimmed)) return trimmed.slice(0, -1)
  return trimmed
}

/** Default name for a promoted henchman: the group's singular plus the next free number. */
export function defaultPromotedName(group: RosterHenchmanGroup, roster: RosterWarband): string {
  const base = singular(group.name) || 'Hero'
  const taken = new Set(roster.heroes.map((h) => h.name.trim().toLowerCase()))
  let n = 1
  while (taken.has(`${base} ${n}`.toLowerCase())) n += 1
  return `${base} ${n}`
}

// ---------------------------------------------------------------------------------------------
// The resolution stored on the row
// ---------------------------------------------------------------------------------------------

export type AdvanceOutcome = 'skill' | 'spell' | 'stat' | 'promotion'

export interface AdvanceResolution {
  version: 1
  kind: 'hero' | 'group'
  subjectName: string
  roll2d6: number
  dice: [number, number]
  subRoll?: number
  rerolled?: number[]
  outcome: AdvanceOutcome
  stat?: StatKey
  before?: number
  after?: number
  skillId?: string
  skillName?: string
  tableName?: string
  spellId?: string
  spellName?: string
  loreId?: string
  newHeroId?: string
  newHeroName?: string
  skillTableIds?: string[]
  /** Advances the database should queue when this one closes (promotion: the new hero's hero-table roll and the group's re-roll). */
  followUps?: AdvanceFollowUp[]
  /** One-line summary for the history list. */
  text: string
}

export interface AdvanceFollowUp {
  subjectType: 'hero' | 'group'
  subjectId: string
  thresholdXp: number
}

/** Rulebook: a promoted lad rolls once on the hero table straight away; the rest of the group re-roll this advance. */
export function promotionFollowUps(next: RosterWarband, groupId: string, newHeroId: string, thresholdXp: number): AdvanceFollowUp[] {
  const out: AdvanceFollowUp[] = [{ subjectType: 'hero', subjectId: newHeroId, thresholdXp }]
  const group = next.henchmenGroups.find((g) => g.id === groupId)
  if (group && group.size > 0) out.push({ subjectType: 'group', subjectId: groupId, thresholdXp })
  return out
}

export type ResolutionParts = Omit<AdvanceResolution, 'text' | 'version'> & { groupSize?: number }

/** "Rolled 9: +1 Strength, now S4" and friends. */
export function summaryText(p: ResolutionParts): string {
  const rolled = `Rolled ${p.roll2d6}${p.subRoll !== undefined ? ` (then ${p.subRoll})` : ''}`
  let body: string
  switch (p.outcome) {
    case 'stat': {
      const stat = p.stat ?? 'M'
      const who = p.kind === 'group' ? ` for all ${p.groupSize ?? ''} ${p.subjectName}`.replace('  ', ' ') : ''
      body = `+1 ${STAT_NAMES[stat]}${who}, now ${stat}${p.after ?? ''}`
      break
    }
    case 'skill':
      body = `learned ${p.skillName ?? p.skillId ?? 'a skill'}${p.tableName ? ` (${p.tableName})` : ''}`
      break
    case 'spell':
      body = `learned the spell ${p.spellName ?? p.spellId ?? ''}`.trimEnd()
      break
    case 'promotion':
      body = `The lad's got talent — ${p.newHeroName ?? 'a henchman'} becomes a hero`
      break
  }
  const rerolled = p.rerolled && p.rerolled.length > 0 ? ` · re-rolled ${p.rerolled.join(', ')}` : ''
  return `${rolled}: ${body}${rerolled}`
}

export function buildResolution(p: ResolutionParts): AdvanceResolution {
  const rest: Record<string, unknown> = { ...p }
  delete rest.groupSize
  const resolution = { version: 1, ...rest, text: summaryText(p) } as AdvanceResolution
  if (!resolution.rerolled || resolution.rerolled.length === 0) delete resolution.rerolled
  return resolution
}

/** The stored resolution of a resolved row, read loosely (older or foreign shapes give nulls). */
export function readResolution(value: Record<string, unknown> | null): { subjectName: string | null; text: string | null } {
  if (!value) return { subjectName: null, text: null }
  const subject = typeof value.subjectName === 'string' ? value.subjectName : null
  const text = typeof value.text === 'string' ? value.text : null
  return { subjectName: subject, text }
}

// ---------------------------------------------------------------------------------------------
// Plans: what the draft still needs, or the finished result
// ---------------------------------------------------------------------------------------------

export interface AdvanceContext {
  roster: RosterWarband
  template: WarbandTemplate | undefined
  /** The experience threshold this advance was earned at (pending_advances.threshold_xp). */
  thresholdXp?: number
}

export interface AdvanceResult {
  next: RosterWarband
  events: ResolutionEvent[]
  resolution: AdvanceResolution
}

export interface StatOption {
  stat: StatKey
  name: string
  current: number
  max: number
  eligible: boolean
  /** Why it cannot be taken, when it cannot. */
  reason: string | null
}

export type HeroNeed = 'roll' | 'subRoll' | 'stat' | 'skill'

export interface HeroPlan {
  total: number | null
  roll: HeroAdvanceRoll | null
  maxima: MaximaInfo
  need: HeroNeed | null
  /** The characteristic the sub-roll landed on. */
  subStat: StatKey | null
  statOptions: StatOption[]
  /** Every offered stat is maxed: the fallback stats are in statOptions and a skill may be taken instead. */
  fallbackToAny: boolean
  /** Set when the skill choice is a fallback for a maxed characteristic. */
  skillReason: string | null
  /** A spell may be taken instead of the skill. */
  allowSpell: boolean
  lore: SpellLore | null
  spells: Spell[]
  skillTables: AvailableSkillTable[]
  result: AdvanceResult | null
  error: string | null
}

function statOption(hero: { stats: Stats }, stat: StatKey, maxima: Stats, extraReason: string | null = null): StatOption {
  const current = hero.stats[stat]
  const max = maxima[stat]
  const atMax = current >= max
  return {
    stat,
    name: STAT_NAMES[stat],
    current,
    max,
    eligible: !atMax && extraReason === null,
    reason: atMax ? `at the racial maximum of ${max}` : extraReason,
  }
}

function replaceHero(roster: RosterWarband, hero: RosterHero): RosterWarband {
  return { ...roster, heroes: roster.heroes.map((h) => (h.id === hero.id ? hero : h)) }
}

function replaceHiredSword(roster: RosterWarband, sword: RosterHiredSword): RosterWarband {
  return { ...roster, hiredSwords: roster.hiredSwords.map((h) => (h.id === sword.id ? sword : h)) }
}

function replaceGroup(roster: RosterWarband, group: RosterHenchmanGroup): RosterWarband {
  return { ...roster, henchmenGroups: roster.henchmenGroups.map((g) => (g.id === group.id ? group : g)) }
}

function errorMessage(e: unknown): string {
  if (isRulesError(e)) return e.message
  if (e instanceof Error) return e.message
  return 'The advance could not be applied.'
}

/**
 * Work out where a hero's (or hired sword's) advance stands. `subject` is the hero as loaded;
 * hired swords are passed through hiredSwordAsHero and folded back on the result.
 */
export function planHero(draft: AdvanceDraft, subject: Extract<AdvanceSubject, { kind: 'hero' | 'hiredSword' }>, ctx: AdvanceContext): HeroPlan {
  const isSword = subject.kind === 'hiredSword'
  const hero = isSword ? hiredSwordAsHero(subject.sword) : subject.hero
  const warbandTemplateId = ctx.roster.warbandTemplateId
  const maxima = isSword ? hiredSwordMaxima(subject.sword, warbandTemplateId) : heroMaxima(hero, warbandTemplateId)
  const lore = isSword ? null : loreForHero(hero, ctx.template)
  const plan: HeroPlan = {
    total: diceTotal(draft),
    roll: null,
    maxima,
    need: null,
    subStat: null,
    statOptions: [],
    fallbackToAny: false,
    skillReason: null,
    allowSpell: false,
    lore,
    spells: lore ? unknownSpells(lore, hero) : [],
    skillTables: availableSkills(hero, warbandTemplateId),
    result: null,
    error: null,
  }
  if (plan.total === null) return { ...plan, need: 'roll' }

  const dice: [number, number] = [draft.dice[0] ?? 0, draft.dice[1] ?? 0]
  const base = {
    kind: 'hero' as const,
    subjectName: subject.kind === 'hero' ? subject.hero.name : subject.sword.name,
    roll2d6: plan.total,
    dice,
    ...(draft.rerolled.length > 0 ? { rerolled: draft.rerolled } : {}),
  }

  const finish = (next: RosterHero, events: ResolutionEvent[], parts: Omit<ResolutionParts, keyof typeof base>): AdvanceResult => {
    const roster = isSword ? replaceHiredSword(ctx.roster, heroToHiredSword(subject.sword, next)) : replaceHero(ctx.roster, next)
    return { next: roster, events, resolution: buildResolution({ ...base, ...parts }) }
  }

  const skillRoute = (reason: string | null, allowSpell: boolean, subRoll?: number): HeroPlan => {
    const out: HeroPlan = { ...plan, skillReason: reason, allowSpell: allowSpell && lore !== null }
    try {
      if (out.allowSpell && draft.mode === 'spell') {
        if (!draft.spellId || !lore) return { ...out, need: 'skill' }
        const spell = lore.spells.find((s) => s.id === draft.spellId)
        const r = learnSpell(hero, lore.id, draft.spellId)
        return {
          ...out,
          result: finish(r.value, r.events, {
            outcome: 'spell',
            spellId: draft.spellId,
            spellName: spell?.name ?? draft.spellId,
            loreId: lore.id,
            ...(subRoll !== undefined ? { subRoll } : {}),
          }),
        }
      }
      if (!draft.skillId) return { ...out, need: 'skill' }
      const table = plan.skillTables.find((t) => t.skills.some((s) => s.id === draft.skillId))
      const skill = table?.skills.find((s) => s.id === draft.skillId)
      const r = learnSkill(hero, draft.skillId, undefined, { warbandTemplateId })
      return {
        ...out,
        result: finish(r.value, r.events, {
          outcome: 'skill',
          skillId: draft.skillId,
          skillName: skill?.name ?? draft.skillId,
          ...(table ? { tableName: table.tableName } : {}),
          ...(subRoll !== undefined ? { subRoll } : {}),
        }),
      }
    } catch (e) {
      return { ...out, error: errorMessage(e) }
    }
  }

  const statRoute = (stat: StatKey, subRoll?: number): HeroPlan => {
    try {
      const r = applyStatIncrease(hero, stat, maxima.maxima)
      return {
        ...plan,
        result: finish(r.value, r.events, {
          outcome: 'stat',
          stat,
          before: hero.stats[stat],
          after: r.value.stats[stat],
          ...(subRoll !== undefined ? { subRoll } : {}),
        }),
      }
    } catch (e) {
      return { ...plan, error: errorMessage(e) }
    }
  }

  let roll: HeroAdvanceRoll
  try {
    roll = resolveHeroAdvanceRoll(plan.total)
  } catch (e) {
    return { ...plan, need: 'roll', error: errorMessage(e) }
  }
  plan.roll = roll

  switch (roll.kind) {
    case 'newSkill':
      return skillRoute(null, true)
    case 'statChoice': {
      const eligibility = eligibleStatChoices(hero, roll.options, maxima.maxima)
      const offered = roll.options.map((s) => statOption(hero, s, maxima.maxima))
      const fallback = eligibility.fallbackToAny ? eligibility.options.map((s) => statOption(hero, s, maxima.maxima)) : []
      const withOptions: HeroPlan = { ...plan, statOptions: [...offered, ...fallback], fallbackToAny: eligibility.fallbackToAny }
      if (eligibility.fallbackToAny && draft.skillInstead) {
        return { ...skillRoute(`${roll.options.map((s) => STAT_NAMES[s]).join(' and ')} are both at their racial maximum.`, false), statOptions: withOptions.statOptions, fallbackToAny: true }
      }
      if (draft.stat && eligibility.options.includes(draft.stat)) return { ...statRoute(draft.stat), statOptions: withOptions.statOptions, fallbackToAny: eligibility.fallbackToAny }
      return { ...withOptions, need: 'stat' }
    }
    case 'statSubRoll': {
      if (draft.subRoll === null) return { ...plan, need: 'subRoll' }
      let stat: StatKey
      try {
        stat = resolveHeroAdvanceSubRoll(plan.total, draft.subRoll)
      } catch (e) {
        return { ...plan, need: 'subRoll', error: errorMessage(e) }
      }
      const option = statOption(hero, stat, maxima.maxima)
      if (!option.eligible) {
        return { ...skillRoute(`${STAT_NAMES[stat]} is already at its racial maximum of ${option.max}, so a skill is taken instead.`, false, draft.subRoll), subStat: stat, statOptions: [option] }
      }
      return { ...statRoute(stat, draft.subRoll), subStat: stat, statOptions: [option] }
    }
  }
}

export type GroupNeed = 'roll' | 'reroll' | 'stat' | 'promotion'

export interface SkillTableOption {
  id: string
  name: string
}

export interface GroupPlan {
  total: number | null
  roll: HenchmanAdvanceRoll | null
  maxima: MaximaInfo
  need: GroupNeed | null
  /** Why the roll has to be made again. */
  rerollReason: string | null
  statOptions: StatOption[]
  /** The lad's got talent: tables the new hero may be given. */
  tableOptions: SkillTableOption[]
  heroCapacity: number | null
  /** True when promoting the last member removes the group. */
  dissolvesGroup: boolean
  result: AdvanceResult | null
  error: string | null
}

export function planGroup(draft: AdvanceDraft, group: RosterHenchmanGroup, ctx: AdvanceContext, tableName: (id: string) => string = (id) => id): GroupPlan {
  const warbandTemplateId = ctx.roster.warbandTemplateId
  const maxima = groupMaxima(group, warbandTemplateId)
  const capacity = ctx.template ? heroCapacity(ctx.template) : null
  const plan: GroupPlan = {
    total: diceTotal(draft),
    roll: null,
    maxima,
    need: null,
    rerollReason: null,
    statOptions: [],
    tableOptions: allowedSkillTablesFor(warbandTemplateId)
      .filter((id) => {
        const rule = unitRules(group.unitTemplateId).promotion
        return !rule || !('tables' in rule) || (rule.tables as string[]).includes(id)
      })
      .map((id) => ({ id, name: tableName(id) })),
    heroCapacity: capacity,
    dissolvesGroup: group.size <= 1,
    result: null,
    error: null,
  }
  if (plan.total === null) return { ...plan, need: 'roll' }

  const dice: [number, number] = [draft.dice[0] ?? 0, draft.dice[1] ?? 0]
  const base = {
    kind: 'group' as const,
    subjectName: group.name,
    roll2d6: plan.total,
    dice,
    groupSize: group.size,
    ...(draft.rerolled.length > 0 ? { rerolled: draft.rerolled } : {}),
  }

  let roll: HenchmanAdvanceRoll
  try {
    roll = resolveHenchmanAdvanceRoll(plan.total)
  } catch (e) {
    return { ...plan, need: 'roll', error: errorMessage(e) }
  }
  plan.roll = roll

  const groupStatOption = (stat: StatKey): StatOption => {
    const increased = (group.statIncreases[stat] ?? 0) >= 1
    return statOption(group, stat, maxima.maxima, increased ? 'already increased once (henchmen never add more than +1)' : null)
  }

  const statRoute = (stat: StatKey): GroupPlan => {
    try {
      const r = applyHenchmanStatIncrease(group, stat)
      return {
        ...plan,
        result: {
          next: replaceGroup(ctx.roster, r.value),
          events: r.events,
          resolution: buildResolution({ ...base, outcome: 'stat', stat, before: group.stats[stat], after: r.value.stats[stat] }),
        },
      }
    } catch (e) {
      return { ...plan, error: errorMessage(e) }
    }
  }

  switch (roll.kind) {
    case 'statIncrease': {
      const options = [groupStatOption(roll.stat)]
      const eligible = eligibleHenchmanStats(group, [roll.stat], maxima.maxima)
      if (eligible.length === 0) {
        return { ...plan, statOptions: options, need: 'reroll', rerollReason: `${STAT_NAMES[roll.stat]} is ${options[0].reason}; roll again.` }
      }
      return { ...statRoute(roll.stat), statOptions: options }
    }
    case 'statChoice': {
      const options = roll.options.map(groupStatOption)
      const eligible = eligibleHenchmanStats(group, roll.options, maxima.maxima)
      if (eligible.length === 0) {
        return { ...plan, statOptions: options, need: 'reroll', rerollReason: `Neither ${roll.options.map((s) => STAT_NAMES[s]).join(' nor ')} can be increased; roll again.` }
      }
      if (draft.stat && eligible.includes(draft.stat)) return { ...statRoute(draft.stat), statOptions: options }
      return { ...plan, statOptions: options, need: 'stat' }
    }
    case 'ladsGotTalent': {
      const promotionRule = unitRules(group.unitTemplateId).promotion
      if (promotionRule && 'never' in promotionRule) {
        return { ...plan, need: 'reroll', rerollReason: promotionRule.note }
      }
      const active = ctx.roster.heroes.filter((h) => h.status === 'active').length
      if (capacity !== null && active >= capacity) {
        return { ...plan, need: 'reroll', rerollReason: `The warband already has its maximum of ${capacity} heroes; roll again.` }
      }
      const name = draft.newHeroName.trim()
      if (name.length === 0 || draft.skillTableIds.length !== 2) return { ...plan, need: 'promotion' }
      try {
        const r = promoteHenchman(ctx.roster, group.id, name, draft.skillTableIds, draft.newHeroId, capacity !== null ? { heroCapacity: capacity } : undefined)
        return {
          ...plan,
          result: {
            next: r.value,
            events: r.events,
            resolution: buildResolution({
              ...base,
              outcome: 'promotion',
              newHeroId: draft.newHeroId,
              newHeroName: name,
              skillTableIds: [...draft.skillTableIds],
              followUps: promotionFollowUps(r.value, group.id, draft.newHeroId, ctx.thresholdXp ?? group.xp),
            }),
          },
        }
      } catch (e) {
        return { ...plan, need: 'promotion', error: errorMessage(e) }
      }
    }
  }
}

/** The furthest step the draft may show: no further than the choice until the roll is in, no review without a result. */
export function effectiveStep(draft: AdvanceDraft, plan: { need: HeroNeed | GroupNeed | null; result: AdvanceResult | null }): AdvanceStep {
  if (plan.need === 'roll') return 'roll'
  if (!plan.result) return draft.step === 'review' ? 'choose' : draft.step
  return draft.step
}

/** Which characteristics the resolver knows about, for tests and stat grids. */
export { STAT_KEYS }
