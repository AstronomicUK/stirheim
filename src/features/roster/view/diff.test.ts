import { describe, expect, it } from 'vitest'
import { CAPTAIN_ID, MARTA_ID, WATCHMEN_ID, reiklandGroups, reiklandHeroes, reiklandItems, reiklandWatch } from '../../../domain/__tests__/fixtures'
import { diffDraft, draftFromRows, removeHolder, tempId, type EditDraft, type LoadedRows } from './diff'
import { normaliseDraft, validateDraft } from './validate'

const rows: LoadedRows = { warband: reiklandWatch, heroes: reiklandHeroes, groups: reiklandGroups, items: reiklandItems }

function fresh(): EditDraft {
  return draftFromRows(rows)
}

describe('diffDraft', () => {
  it('returns nothing for an unchanged draft', () => {
    expect(diffDraft(rows, fresh())).toEqual([])
  })

  it('sends only the changed warband column', () => {
    const draft = fresh()
    draft.warband.gold = 80
    expect(diffDraft(rows, draft)).toEqual([{ table: 'warbands', op: 'update', id: reiklandWatch.id, data: { gold: 80 } }])
  })

  it('sends veteran_pool null explicitly when it is cleared', () => {
    const withPool: LoadedRows = { ...rows, warband: { ...reiklandWatch, veteran_pool: 7 } }
    const draft = draftFromRows(withPool)
    draft.warband.veteran_pool = null
    const changes = diffDraft(withPool, draft)
    expect(changes).toHaveLength(1)
    expect(changes[0].data).toEqual({ veteran_pool: null })
    expect('veteran_pool' in (changes[0].data ?? {})).toBe(true)
  })

  it('sends the whole stats object when one characteristic changes', () => {
    const draft = fresh()
    const captain = draft.heroes.find((h) => h.id === CAPTAIN_ID)!
    captain.stats = { ...captain.stats, WS: captain.stats.WS + 1 }
    const changes = diffDraft(rows, draft)
    expect(changes).toEqual([{ table: 'heroes', op: 'update', id: CAPTAIN_ID, data: { stats: captain.stats } }])
    expect(Object.keys(changes[0].data!.stats as object)).toHaveLength(9)
  })

  it('sends array columns whole when they change and not otherwise', () => {
    const draft = fresh()
    const marta = draft.heroes.find((h) => h.id === MARTA_ID)!
    marta.skills = ['strike_to_injure']
    const [change] = diffDraft(rows, draft)
    expect(change.op).toBe('update')
    expect(change.data).toEqual({ skills: ['strike_to_injure'] })
  })

  it('inserts a new item with its holder fields and no id', () => {
    const draft = fresh()
    draft.items.push({
      id: tempId('item'),
      isNew: true,
      holder_type: 'hero',
      holder_id: CAPTAIN_ID,
      item_rules_id: 'helmet',
      custom_name: null,
      quantity: 1,
      notes: '',
    })
    const changes = diffDraft(rows, draft)
    expect(changes).toEqual([
      {
        table: 'items',
        op: 'insert',
        data: { holder_type: 'hero', holder_id: CAPTAIN_ID, item_rules_id: 'helmet', custom_name: null, quantity: 1, notes: '' },
      },
    ])
    expect(changes[0]).not.toHaveProperty('id')
  })

  it('moves an item by sending holder_type and holder_id together', () => {
    const draft = fresh()
    const held = draft.items.find((i) => i.holder_id === CAPTAIN_ID)!
    held.holder_type = 'stash'
    held.holder_id = null
    const [change] = diffDraft(rows, draft)
    expect(change).toEqual({ table: 'items', op: 'update', id: held.id, data: { holder_type: 'stash', holder_id: null } })
  })

  it('deletes a removed hero by id, after moving its kit to the stash', () => {
    const draft = removeHolder(fresh(), CAPTAIN_ID)
    const changes = diffDraft(rows, draft)
    const kit = reiklandItems.filter((i) => i.holder_id === CAPTAIN_ID)
    expect(kit.length).toBeGreaterThan(0)
    for (const item of kit) {
      expect(changes).toContainEqual({ table: 'items', op: 'update', id: item.id, data: { holder_type: 'stash', holder_id: null } })
    }
    const del = { table: 'heroes', op: 'delete', id: CAPTAIN_ID }
    expect(changes).toContainEqual(del)
    expect(changes.indexOf(changes.find((c) => c.op === 'delete')!)).toBe(changes.length - 1)
  })

  it('inserts a new henchman group with the full row', () => {
    const draft = fresh()
    draft.groups.push({
      id: tempId('group'),
      isNew: true,
      name: 'Marksmen II',
      unit_type_rules_id: 'mercenaries_reikland_marksmen',
      size: 2,
      stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 },
      xp: 0,
      level_ups: 0,
      stat_increases: {},
      is_large: false,
      notes: '',
      model_names: [],
      sort_order: 5,
    })
    const [change] = diffDraft(rows, draft)
    expect(change.table).toBe('henchman_groups')
    expect(change.op).toBe('insert')
    expect(change.data).toMatchObject({ name: 'Marksmen II', size: 2, unit_type_rules_id: 'mercenaries_reikland_marksmen' })
  })

  it('treats stat_increases of 0 and absent as equal', () => {
    const draft = fresh()
    const group = draft.groups.find((g) => g.id === WATCHMEN_ID)!
    group.stat_increases = { WS: 0 }
    expect(diffDraft(rows, draft)).toEqual([])
  })
})

describe('validateDraft', () => {
  it('passes the loaded rows', () => {
    expect(validateDraft(fresh())).toEqual({})
  })

  it('flags bad numbers by path', () => {
    const draft = fresh()
    draft.warband.gold = -1
    draft.warband.veteran_pool = 13
    const captain = draft.heroes.find((h) => h.id === CAPTAIN_ID)!
    captain.stats = { ...captain.stats, Ld: 11 }
    captain.xp = 2.5
    const errors = validateDraft(draft)
    expect(errors['warband.gold']).toMatch(/below zero/)
    expect(errors['warband.veteran_pool']).toMatch(/2-12/)
    expect(errors[`heroes.${CAPTAIN_ID}.stats.Ld`]).toMatch(/exceed 10/)
    expect(errors[`heroes.${CAPTAIN_ID}.xp`]).toMatch(/whole number/)
  })

  it('requires an item to be named and a held item to have a saved holder', () => {
    const draft = fresh()
    const newHero = tempId('hero')
    draft.items.push({ id: 'a', isNew: true, holder_type: 'stash', holder_id: null, item_rules_id: null, custom_name: ' ', quantity: 1, notes: '' })
    draft.items.push({ id: 'b', isNew: true, holder_type: 'hero', holder_id: newHero, item_rules_id: 'sword', custom_name: null, quantity: 0, notes: '' })
    const errors = validateDraft(draft)
    expect(errors['items.a.name']).toBeDefined()
    expect(errors['items.b.holder']).toMatch(/Save the new warrior/)
    expect(errors['items.b.quantity']).toMatch(/at least 1/)
  })

  it('normalises whitespace so a padded name is not a change', () => {
    const draft = fresh()
    draft.warband.name = `  ${reiklandWatch.name}  `
    expect(diffDraft(rows, normaliseDraft(draft))).toEqual([])
  })
})
