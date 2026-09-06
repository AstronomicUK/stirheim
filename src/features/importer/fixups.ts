// Tidying an imported roster after the rules data has grown: skills and spells the importer could
// not place at the time were left in a hero's notes ("Skills/spells to check: Frostbolts, Geyser.")
// and "roll again" injuries carried the whole sub-table as their effect. Both can be re-run against
// today's data from the roster page, as one logged edit.

import type { HeroRow, ItemRow } from '../../domain'
import type { WarriorFlags } from '../../rules/types/roster'
import type { RosterChange } from '../../domain/rosterChange'
import type { AppliedInjury } from '../../rules/types/roster'
import { resolveEquipmentName } from '../../rules/data/items/aliases'
import { HERO_INJURIES } from '../../rules/data/campaign/injuries'
import { describeInjuryOutcome } from '../../rules/resolve/injuries'
import type { InjurySubOutcome } from '../../rules/types/campaign'
import { matchInjury, matchSkillOrSpell } from './rosterImport'

const TO_CHECK = /Skills\/spells to check: ([^\n]*?)\.?(?=\n|$)/

/** Names still listed as unmatched in a hero's notes. */
export function unmatchedNames(notes: string): string[] {
  const m = TO_CHECK.exec(notes)
  if (!m) return []
  return m[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export interface HeroFixup {
  heroId: string
  heroName: string
  skillIds: string[]
  spellIds: string[]
  /** Names that still match nothing. */
  stillUnknown: string[]
  /** Injuries whose recorded effect was the chart text rather than the outcome, now re-derived. */
  injuries: AppliedInjury[] | null
  notes: string
}

/**
 * Injuries recorded before the outcome was the thing recorded. Two shapes are fixed: an effect that
 * is still the whole sub-table ("Roll again: …"), and a name that is the roll rather than what came
 * of it — a warrior has Frenzy or Stupidity, never Madness, which by itself does nothing.
 */
function tidyInjury(injury: AppliedInjury, flags: WarriorFlags): AppliedInjury | null {
  const outcome = subOutcomeFor(injury, flags)
  if (outcome?.name && injury.name !== outcome.name) return { ...injury, name: outcome.name, effect: describeInjuryOutcome(outcome) }
  if (!/^Roll again:/i.test(injury.effect)) return null
  const again = matchInjury(injury.name).injury
  if (!again || (again.name === injury.name && again.effect === injury.effect)) return null
  return { ...injury, name: again.name, effect: again.effect }
}

/**
 * Which outcome of a sub-table an injury landed on. The follow-up die settles it where one was
 * kept; where none was — every imported injury, which carries no dice — the condition the importer
 * set from the same line does, so long as exactly one outcome could have set it.
 */
function subOutcomeFor(injury: AppliedInjury, flags: WarriorFlags): InjurySubOutcome | undefined {
  const result = HERO_INJURIES.find((i) => i.code === injury.injuryCode)
  const table = result?.effects.find((e) => e.kind === 'subRoll')
  if (!table || table.kind !== 'subRoll') return undefined

  const sub = injury.rolled.subRoll
  if (sub !== undefined) return table.outcomes.find((o) => sub >= o.band.min && sub <= o.band.max)

  // Not every injury flag is a warrior flag (a robbery is not a condition), hence the lookup.
  const set = flags as Record<string, unknown>
  const byFlag = table.outcomes.filter((o) => o.effects.some((e) => e.kind === 'flag' && set[e.flag] === true))
  return byFlag.length === 1 ? byFlag[0] : undefined
}

/** What re-running the matchers would change on a hero, or null when nothing would. */
export function planHeroFixup(hero: Pick<HeroRow, 'id' | 'name' | 'notes' | 'skills' | 'spells' | 'injuries' | 'flags'>): HeroFixup | null {
  const names = unmatchedNames(hero.notes)
  const skillIds: string[] = []
  const spellIds: string[] = []
  const stillUnknown: string[] = []
  for (const name of names) {
    const m = matchSkillOrSpell(name)
    if (!m) stillUnknown.push(name)
    else if (m.kind === 'skill' && !hero.skills.includes(m.id) && !skillIds.includes(m.id)) skillIds.push(m.id)
    else if (m.kind === 'spell' && !hero.spells.includes(m.id) && !spellIds.includes(m.id)) spellIds.push(m.id)
  }
  let injuriesChanged = false
  const injuries = hero.injuries.map((inj) => {
    const tidy = tidyInjury(inj, hero.flags)
    if (tidy) injuriesChanged = true
    return tidy ?? inj
  })
  const matchedAny = skillIds.length > 0 || spellIds.length > 0 || (names.length > 0 && stillUnknown.length < names.length)
  if (!matchedAny && !injuriesChanged) return null
  const notes = names.length
    ? hero.notes.replace(TO_CHECK, stillUnknown.length ? `Skills/spells to check: ${stillUnknown.join(', ')}.` : '').replace(/\n{2,}/g, '\n').trim()
    : hero.notes
  return { heroId: hero.id, heroName: hero.name, skillIds, spellIds, stillUnknown, injuries: injuriesChanged ? injuries : null, notes }
}

/** The roster changes that apply a set of fix-ups. */
export function fixupChanges(fixups: readonly HeroFixup[], heroes: readonly Pick<HeroRow, 'id' | 'skills' | 'spells'>[]): RosterChange[] {
  return fixups.map((f) => {
    const hero = heroes.find((h) => h.id === f.heroId)
    const data: Record<string, unknown> = { notes: f.notes }
    if (f.skillIds.length) data.skills = [...(hero?.skills ?? []), ...f.skillIds]
    if (f.spellIds.length) data.spells = [...(hero?.spells ?? []), ...f.spellIds]
    if (f.injuries) data.injuries = f.injuries
    return { table: 'heroes', op: 'update', id: f.heroId, data }
  })
}

/** "Cooking pot (counts as a Helmet)" -> "Cooking pot": the old tracker's parenthetical aside. */
export function stripQualifier(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

/** The catalogue entry a written-in name resolves to outright, aside and all. */
export function namedByCatalogue(customName: string) {
  return resolveEquipmentName(customName) ?? resolveEquipmentName(stripQualifier(customName))
}

/**
 * A written-in item the catalogue can name outright. The alias table is the rules speaking — a
 * Staff is the rulebook's Club / Mace / Hammer entry, a cooking pot is the Cooking Pot Helmet — so
 * there is no judgement to put to the player, and asking every time a roster is opened is noise.
 * Anything the alias table cannot name stays a question (see ./questions.ts).
 */
export function itemFixupChanges(items: readonly Pick<ItemRow, 'id' | 'item_rules_id' | 'custom_name'>[]): RosterChange[] {
  const out: RosterChange[] = []
  for (const item of items) {
    if (item.item_rules_id !== null || !item.custom_name) continue
    const named = namedByCatalogue(item.custom_name)
    if (!named) continue
    out.push({ table: 'items', op: 'update', id: item.id, data: { item_rules_id: named.id, custom_name: null } })
  }
  return out
}

/** One line per hero, for the notice. */
export function describeFixup(f: HeroFixup): string {
  const parts: string[] = []
  if (f.spellIds.length) parts.push(`${f.spellIds.length} ${f.spellIds.length === 1 ? 'spell' : 'spells'}`)
  if (f.skillIds.length) parts.push(`${f.skillIds.length} ${f.skillIds.length === 1 ? 'skill' : 'skills'}`)
  if (f.injuries) parts.push('injury text')
  const tail = f.stillUnknown.length ? ` (still unknown: ${f.stillUnknown.join(', ')})` : ''
  return `${f.heroName}: ${parts.join(', ')}${tail}`
}
