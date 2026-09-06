import { describe, expect, it } from 'vitest'
import type { HenchmanGroupRow, HeroRow, ItemRow } from '../../domain'
import { importQuestions, removeName } from './questions'

const T0 = '2026-09-04T09:00:00.000000+00:00'
const W = 'aaaaaaaa-0000-4000-8000-000000000001'
const stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }

function hero(over: Partial<HeroRow> = {}): HeroRow {
  return {
    id: 'h1', warband_id: W, name: 'Nephanis', is_hired_sword: false, unit_type_rules_id: 'restless_dead_variant_liche', hired_sword_rules_id: null,
    stats, xp: 0, level_ups: 0, skill_tables: [], skills: [], spells: [], injuries: [], flags: {}, equipment_locked: false, is_large: false,
    status: 'active', notes: '', sort_order: 0, created_at: T0, updated_at: T0, ...over,
  }
}
function group(over: Partial<HenchmanGroupRow> = {}): HenchmanGroupRow {
  return {
    id: 'g1', warband_id: W, name: 'Group 1 — Zombie', unit_type_rules_id: 'restless_dead_variant_zombies', size: 3, stats, xp: 0, level_ups: 0,
    stat_increases: {}, is_large: false, notes: '', model_names: [], sort_order: 0, created_at: T0, updated_at: T0, ...over,
  }
}
function item(over: Partial<ItemRow> = {}): ItemRow {
  return { id: 'i1', warband_id: W, holder_type: 'hero', holder_id: 'h1', item_rules_id: null, custom_name: null, quantity: 1, notes: '', created_at: T0, updated_at: T0, ...over }
}
const input = (over: Partial<Parameters<typeof importQuestions>[0]> = {}) => ({ warbandId: W, typeRulesId: 'the_restless_dead_variant', heroes: [hero()], groups: [group()], items: [], ...over })

describe('questions left by an import', () => {
  it('asks nothing about a roster the importer placed cleanly', () => {
    expect(importQuestions(input())).toEqual([])
  })

  it('asks only about a written-in item the catalogue can nearly name', () => {
    // An exact hit on the alias table is the rules speaking, so ./fixups.ts applies it silently.
    expect(importQuestions(input({ items: [item({ custom_name: "Wizard's Staff" })] }))).toEqual([])
    expect(importQuestions(input({ items: [item({ custom_name: 'Staff' })] }))).toEqual([])

    // "Cooking pot (counts as a Helmet)" too: the qualifier is part of the alias.
    expect(importQuestions(input({ items: [item({ custom_name: 'Cooking pot (counts as a Helmet)' })] }))).toEqual([])

    // A name the alias table misses but the catalogue nearly matches is a judgement call, so it is asked.
    const q = importQuestions(input({ items: [item({ custom_name: 'Elven Runeston' })] }))
    expect(q).toHaveLength(1)
    expect(q[0]).toMatchObject({ kind: 'customItem', title: 'Elven Runeston' })
    expect(q[0].detail).toContain('Nephanis')
    expect(q[0].options[0].label).toBe('Use Elven Runestones')
    expect(q[0].options[0].changes).toEqual([{ table: 'items', op: 'update', id: 'i1', data: { item_rules_id: 'elven_runestones', custom_name: null } }])
    expect(q[0].options[1].changes).toEqual([])

    // Nothing to say about a custom line the catalogue still cannot name.
    expect(importQuestions(input({ items: [item({ custom_name: "Hunter's cloak" })] }))).toEqual([])
  })

  it('suggests the nearest skill or spell for a name the import could not place', () => {
    const notes = 'Skills/spells to check: Flight Of Zim, Silver Arrows Of Arha.'
    const q = importQuestions(input({ heroes: [hero({ notes })] }))
    expect(q.map((x) => x.title)).toEqual(['Flight Of Zim', 'Silver Arrows Of Arha'])
    const near = q[0].options[0]
    expect(near.label).toBe('Add Flight of Zimmeran')
    expect(near.hint).toMatch(/nearest match/)
    expect(near.changes[0]).toMatchObject({ table: 'heroes', op: 'update', id: 'h1' })
    expect((near.changes[0].data as { spells: string[] }).spells).toEqual(['flight_of_zimmeran'])
    expect((near.changes[0].data as { notes: string }).notes).toBe('Skills/spells to check: Silver Arrows Of Arha.')
    // An exact match (bar the casing) is offered without the "nearest" wording.
    expect(q[1].options[0].label).toBe('Add Silver Arrows of Arha')
    expect(q[1].options[0].hint).toBeUndefined()
    // Dropping the name tidies the note; leaving it changes nothing.
    expect((q[0].options[1].changes[0].data as { notes: string }).notes).toBe('Skills/spells to check: Silver Arrows Of Arha.')
    expect(q[0].options[2].changes).toEqual([])
  })

  it("offers to move a hired sword the warband's own list carries as a unit", () => {
    const goliath = hero({ id: 'h2', name: 'Bone Goliath', is_hired_sword: true, unit_type_rules_id: null, hired_sword_rules_id: 'bone_goliath', is_large: true })
    const q = importQuestions(input({ heroes: [hero(), goliath] }))
    expect(q).toHaveLength(1)
    expect(q[0]).toMatchObject({ kind: 'hiredSwordUnit', title: 'Bone Goliath' })
    expect(q[0].options[0].label).toBe('Make it Bone Goliath in the warband')
    expect(q[0].options[0].changes[0]).toMatchObject({ table: 'henchman_groups', op: 'insert', data: { unit_type_rules_id: 'restless_dead_variant_bone_goliath', size: 1, is_large: true } })
    expect(q[0].options[0].changes[1]).toEqual({ table: 'heroes', op: 'delete', id: 'h2' })
    // A hired sword with no counterpart in the list is left alone.
    const scout = hero({ id: 'h3', name: 'Pip', is_hired_sword: true, unit_type_rules_id: null, hired_sword_rules_id: 'halfling_scout' })
    expect(importQuestions(input({ heroes: [hero(), scout] }))).toEqual([])
  })

  it('asks which unit a group of no known type is', () => {
    const q = importQuestions(input({ groups: [group({ unit_type_rules_id: 'unknown', name: 'The Shambling' })] }))
    expect(q).toHaveLength(1)
    expect(q[0]).toMatchObject({ kind: 'groupUnit', title: 'The Shambling' })
    expect(q[0].options.map((o) => o.label)).toEqual(['Zombies', 'Skeletons', 'Wights', 'Bone Goliath', 'Leave it as it is'])
    expect(q[0].options[0].changes[0]).toMatchObject({ table: 'henchman_groups', op: 'update', id: 'g1', data: { unit_type_rules_id: 'restless_dead_variant_zombies' } })
    // The recorded profile is kept: it carries whatever advances the group already had.
    expect((q[0].options[0].changes[0].data as { stats: typeof stats }).stats).toEqual(stats)
  })
})

describe('removeName', () => {
  it('drops one name and the whole note when it empties', () => {
    expect(removeName('Skills/spells to check: A, B.', 'A')).toBe('Skills/spells to check: B.')
    expect(removeName('Skills/spells to check: A.', 'a')).toBe('')
    expect(removeName('Kept a diary\nSkills/spells to check: A.', 'A')).toBe('Kept a diary')
    expect(removeName('no note here', 'A')).toBe('no note here')
  })
})
