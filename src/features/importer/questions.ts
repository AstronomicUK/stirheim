// Questions left over from an import, derived from the roster itself rather than stored anywhere:
// a custom item that now matches something in the catalogue, a skill or spell the importer could
// not place, a hired sword the warband's own list carries as a unit of its own (the Restless Dead
// Variant's Bone Goliath), a henchman group whose type was never settled. Each question offers the
// answers as roster changes, so the roster page can ask once and apply the choice as a logged edit.
//
// Certainties are handled silently by ./fixups.ts; this file is only for the judgement calls.

import type { HenchmanGroupRow, HeroRow, ItemRow } from '../../domain'
import type { RosterChange } from '../../domain/rosterChange'
import { SKILLS } from '../../rules/data/skills'
import { SPELL_LORES } from '../../rules/data/campaign/magic'
import { WARBAND_SKILL_TABLES } from '../../rules/data/campaign/warbandSkills'
import { findHiredSword } from '../../rules/data/campaign/hiredSwords'
import { ITEMS } from '../../rules/data/items'
import { findUnitTemplate, findWarbandTemplate } from '../../rules/data/warbandTemplates'
import { unitStartingStats } from '../../rules/resolve/builder'
import type { WarbandTemplate } from '../../rules/types'
import { namedByCatalogue, stripQualifier, unmatchedNames } from './fixups'
import { matchSkillOrSpell, normaliseName } from './rosterImport'

export interface ImportQuestionOption {
  id: string
  label: string
  /** One line under the label. */
  hint?: string
  /** What answering does; empty means "leave it as it is". */
  changes: RosterChange[]
}

export interface ImportQuestion {
  /** Stable within a roster, so an answered or dismissed question is not asked twice. */
  id: string
  kind: 'customItem' | 'unknownName' | 'hiredSwordUnit' | 'groupUnit'
  title: string
  detail: string
  options: ImportQuestionOption[]
}

export interface QuestionInput {
  warbandId: string
  typeRulesId: string
  heroes: HeroRow[]
  groups: HenchmanGroupRow[]
  items: ItemRow[]
}

/** A candidate whose name starts with, or is started by, the written name: "Flight Of Zim" -> "Flight of Zimmeran". */
function closestByPrefix<T>(written: string, candidates: T[], nameOf: (c: T) => string): T | undefined {
  const q = normaliseName(written)
  if (q.length < 4) return undefined
  return candidates.find((c) => {
    const n = normaliseName(nameOf(c))
    return n !== q && (n.startsWith(q) || q.startsWith(n))
  })
}

interface NameCandidate {
  kind: 'skill' | 'spell'
  id: string
  name: string
  where: string
}

function allNameCandidates(): NameCandidate[] {
  const out: NameCandidate[] = SKILLS.map((s) => ({ kind: 'skill' as const, id: s.id, name: s.name, where: 'core skills' }))
  for (const table of WARBAND_SKILL_TABLES) for (const s of table.skills) out.push({ kind: 'skill', id: s.id, name: s.name, where: table.name })
  for (const lore of SPELL_LORES) for (const s of lore.spells) out.push({ kind: 'spell', id: s.id, name: s.name, where: lore.name })
  return out
}

/** The warband's own unit whose name matches a hired sword on the roster (the same creature, listed twice in the rules). */
function unitForHiredSword(template: WarbandTemplate, hiredSwordId: string) {
  const entry = findHiredSword(hiredSwordId)
  if (!entry) return undefined
  return template.henchmanTemplates.find((u) => normaliseName(u.name) === normaliseName(entry.name)) ?? template.heroTemplates.find((u) => normaliseName(u.name) === normaliseName(entry.name))
}

/** Everything the import left open on this roster, in the order they should be asked. */
export function importQuestions(input: QuestionInput): ImportQuestion[] {
  const template = findWarbandTemplate(input.typeRulesId)
  const out: ImportQuestion[] = []
  const holderName = (item: ItemRow): string => {
    if (item.holder_type === 'stash') return 'the stash'
    const list = item.holder_type === 'hero' ? input.heroes : input.groups
    return list.find((h) => h.id === item.holder_id)?.name ?? 'a warrior'
  }

  // 1. Custom items the catalogue can nearly name. An exact hit on the alias table is not a
  //    judgement call and is applied silently by ./fixups.ts, so only near misses are asked about.
  for (const item of input.items) {
    if (item.item_rules_id !== null || !item.custom_name) continue
    if (namedByCatalogue(item.custom_name)) continue
    const match = closestByPrefix(stripQualifier(item.custom_name), ITEMS, (i) => i.name)
    if (!match) continue
    out.push({
      id: `item:${item.id}`,
      kind: 'customItem',
      title: item.custom_name,
      detail: `Written in by the import, held by ${holderName(item)}. The nearest catalogue entry is ${match.name}.`,
      options: [
        { id: 'use', label: `Use ${match.name}`, hint: 'Its rules, price and tooltip come with it.', changes: [{ table: 'items', op: 'update', id: item.id, data: { item_rules_id: match.id, custom_name: null } }] },
        { id: 'keep', label: 'Keep it as written', hint: 'Stays a custom line with no rules attached.', changes: [] },
      ],
    })
  }

  // 2. Skills and spells the importer could not place.
  const candidates = allNameCandidates()
  for (const hero of input.heroes) {
    for (const written of unmatchedNames(hero.notes)) {
      const exact = matchSkillOrSpell(written)
      const near = exact ? undefined : closestByPrefix(written, candidates, (c) => c.name)
      const options: ImportQuestionOption[] = []
      const clearNote = (): RosterChange[] => [{ table: 'heroes', op: 'update', id: hero.id, data: { notes: removeName(hero.notes, written) } }]
      if (exact || near) {
        const id = exact ? exact.id : near!.id
        const kind = exact ? exact.kind : near!.kind
        const name = exact ? (candidates.find((c) => c.id === exact.id)?.name ?? written) : near!.name
        const field = kind === 'spell' ? 'spells' : 'skills'
        const current = kind === 'spell' ? hero.spells : hero.skills
        options.push({
          id: 'use',
          label: `Add ${name}`,
          hint: near ? `The nearest match to "${written}"${near.where ? ` (${near.where})` : ''}.` : undefined,
          changes: [{ table: 'heroes', op: 'update', id: hero.id, data: { [field]: [...current, id], notes: removeName(hero.notes, written) } }],
        })
      }
      options.push({ id: 'drop', label: 'Not a skill or spell we have', hint: 'Takes the name off the note.', changes: clearNote() })
      options.push({ id: 'keep', label: 'Leave the note as it is', changes: [] })
      out.push({ id: `name:${hero.id}:${normaliseName(written)}`, kind: 'unknownName', title: written, detail: `On ${hero.name}'s notes from the import; not in the skill or spell lists.`, options })
    }
  }

  // 3. A hired sword the warband's own list carries as a unit.
  if (template) {
    for (const hero of input.heroes) {
      if (!hero.is_hired_sword || !hero.hired_sword_rules_id || hero.status !== 'active') continue
      const unit = unitForHiredSword(template, hero.hired_sword_rules_id)
      if (!unit) continue
      const asGroup: RosterChange[] = [
        {
          table: 'henchman_groups',
          op: 'insert',
          data: { name: hero.name, unit_type_rules_id: unit.id, size: 1, stats: hero.stats, xp: 0, level_ups: 0, stat_increases: {}, is_large: hero.is_large, notes: `Imported as a Hired Sword; moved to ${template.name}'s own entry.`, sort_order: input.groups.length },
        },
        { table: 'heroes', op: 'delete', id: hero.id },
      ]
      out.push({
        id: `hiredSword:${hero.id}`,
        kind: 'hiredSwordUnit',
        title: hero.name,
        detail: `Imported as a hired sword, but ${template.name} has ${unit.name} in its own list. As part of the warband it follows that entry's rules.`,
        options: [
          { id: 'move', label: `Make it ${unit.name} in the warband`, hint: 'Moves it to the henchmen with the list entry’s rules.', changes: asGroup },
          { id: 'keep', label: 'Keep it as a hired sword', hint: 'Earns experience and is not counted for the income band.', changes: [] },
        ],
      })
    }
  }

  // 4. A henchman group whose type was never settled.
  if (template) {
    for (const group of input.groups) {
      if (findUnitTemplate(template, group.unit_type_rules_id)) continue
      out.push({
        id: `group:${group.id}`,
        kind: 'groupUnit',
        title: group.name,
        detail: `The import could not tell which ${template.name} unit these ${group.size === 1 ? 'model is' : 'models are'}.`,
        options: [
          ...template.henchmanTemplates.map((unit) => ({
            id: unit.id,
            label: unit.name,
            hint: `${unit.cost ?? 0} gc each`,
            changes: [{ table: 'henchman_groups' as const, op: 'update' as const, id: group.id, data: { unit_type_rules_id: unit.id, stats: statsOrKeep(unit.id, template, group) } }],
          })),
          { id: 'keep', label: 'Leave it as it is', changes: [] },
        ],
      })
    }
  }

  return out
}

/** Keep the recorded profile (it carries advances); fall back to the unit's own when the roster has none. */
function statsOrKeep(unitId: string, template: WarbandTemplate, group: HenchmanGroupRow): HenchmanGroupRow['stats'] {
  const zeroed = Object.values(group.stats).every((v) => v === 0)
  return zeroed ? unitStartingStats(findUnitTemplate(template, unitId)) : group.stats
}

/** Take one name out of a "Skills/spells to check: …" note, dropping the note when it empties. */
export function removeName(notes: string, written: string): string {
  const line = /Skills\/spells to check: ([^\n]*?)\.?(?=\n|$)/
  const m = line.exec(notes)
  if (!m) return notes
  const left = m[1]
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && normaliseName(s) !== normaliseName(written))
  const replacement = left.length ? `Skills/spells to check: ${left.join(', ')}.` : ''
  return notes.replace(line, replacement).replace(/\n{2,}/g, '\n').trim()
}

/** A short line for the roster card: "2 questions from the import". */
export function describeQuestions(questions: ImportQuestion[]): string {
  const n = questions.length
  return `${n} ${n === 1 ? 'question' : 'questions'} from the import`
}
