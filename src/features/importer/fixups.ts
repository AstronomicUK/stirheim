// Tidying an imported roster after the rules data has grown: skills and spells the importer could
// not place at the time were left in a hero's notes ("Skills/spells to check: Frostbolts, Geyser.")
// and "roll again" injuries carried the whole sub-table as their effect. Both can be re-run against
// today's data from the roster page, as one logged edit.

import type { HeroRow } from '../../domain'
import type { RosterChange } from '../../domain/rosterChange'
import type { AppliedInjury } from '../../rules/types/roster'
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

function tidyInjury(injury: AppliedInjury): AppliedInjury | null {
  if (!/^Roll again:/i.test(injury.effect)) return null
  const again = matchInjury(injury.name).injury
  if (!again) return null
  return { ...injury, name: again.name, effect: again.effect }
}

/** What re-running the matchers would change on a hero, or null when nothing would. */
export function planHeroFixup(hero: Pick<HeroRow, 'id' | 'name' | 'notes' | 'skills' | 'spells' | 'injuries'>): HeroFixup | null {
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
    const tidy = tidyInjury(inj)
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

/** One line per hero, for the notice. */
export function describeFixup(f: HeroFixup): string {
  const parts: string[] = []
  if (f.spellIds.length) parts.push(`${f.spellIds.length} ${f.spellIds.length === 1 ? 'spell' : 'spells'}`)
  if (f.skillIds.length) parts.push(`${f.skillIds.length} ${f.skillIds.length === 1 ? 'skill' : 'skills'}`)
  if (f.injuries) parts.push('injury text')
  const tail = f.stillUnknown.length ? ` (still unknown: ${f.stillUnknown.join(', ')})` : ''
  return `${f.heroName}: ${parts.join(', ')}${tail}`
}
