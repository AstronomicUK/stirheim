// The manual editor's model and its diff. An EditDraft is a snake_case, column-shaped copy of a
// warband's rows that the edit screen mutates freely; diffDraft compares it with the rows that
// were loaded and produces the smallest RosterChange[] update_roster needs:
//
//   - warbands: one update carrying only the columns that changed (never insert/delete).
//   - heroes / henchman_groups: update with changed columns (stats as a whole object), insert with
//     the full row for drafts flagged `isNew`, delete by id for loaded rows no longer in the draft.
//   - items: as above; holder_type and holder_id always travel together (the SQL function only
//     writes holder_id when holder_type is present), as do item_rules_id and custom_name.
//
// Ordering: updates and inserts first, then item deletes, then hero and group deletes, so a hero
// whose kit was moved to the stash is emptied before it goes. New warriors have client-side ids
// that the database never sees, so an item cannot be given to a warrior in the same save; the
// editor only offers loaded warriors as holders and validateDraft reports the rest.

import type { RosterChange } from '../../../api/warbands'
import type { HenchmanGroupRow, HeroRow, ItemHolder, ItemRow, WarbandRow, WarriorStatus } from '../../../domain'
import type { Stats } from '../../../rules/types'
import type { StatKey } from '../../../rules/types/common'
import type { AppliedInjury, WarriorFlags } from '../../../rules/types/roster'

export interface WarbandFields {
  name: string
  gold: number
  wyrdstone: number
  veteran_pool: number | null
  notes: string
}

export interface HeroDraft {
  id: string
  /** Client-side row that has not been saved yet (id is a temporary key). */
  isNew: boolean
  name: string
  is_hired_sword: boolean
  unit_type_rules_id: string | null
  hired_sword_rules_id: string | null
  stats: Stats
  xp: number
  level_ups: number
  skill_tables: string[]
  skills: string[]
  spells: string[]
  injuries: AppliedInjury[]
  flags: WarriorFlags
  is_large: boolean
  status: WarriorStatus
  notes: string
  sort_order: number
}

export interface GroupDraft {
  id: string
  isNew: boolean
  name: string
  unit_type_rules_id: string
  size: number
  stats: Stats
  xp: number
  level_ups: number
  stat_increases: Partial<Record<StatKey, number>>
  is_large: boolean
  notes: string
  model_names: string[]
  sort_order: number
}

export interface ItemDraft {
  id: string
  isNew: boolean
  holder_type: ItemHolder
  holder_id: string | null
  item_rules_id: string | null
  custom_name: string | null
  quantity: number
  notes: string
}

export interface EditDraft {
  warband: WarbandFields
  heroes: HeroDraft[]
  groups: GroupDraft[]
  items: ItemDraft[]
}

export interface LoadedRows {
  warband: WarbandRow
  heroes: HeroRow[]
  groups: HenchmanGroupRow[]
  items: ItemRow[]
}

// ---- Rows -> draft ----

export function heroDraftFromRow(row: HeroRow): HeroDraft {
  return {
    id: row.id,
    isNew: false,
    name: row.name,
    is_hired_sword: row.is_hired_sword,
    unit_type_rules_id: row.unit_type_rules_id,
    hired_sword_rules_id: row.hired_sword_rules_id,
    stats: { ...row.stats },
    xp: row.xp,
    level_ups: row.level_ups,
    skill_tables: [...row.skill_tables],
    skills: [...row.skills],
    spells: [...row.spells],
    injuries: row.injuries,
    flags: row.flags,
    is_large: row.is_large,
    status: row.status,
    notes: row.notes,
    sort_order: row.sort_order,
  }
}

export function groupDraftFromRow(row: HenchmanGroupRow): GroupDraft {
  return {
    id: row.id,
    isNew: false,
    name: row.name,
    unit_type_rules_id: row.unit_type_rules_id,
    size: row.size,
    stats: { ...row.stats },
    xp: row.xp,
    level_ups: row.level_ups,
    stat_increases: { ...row.stat_increases },
    is_large: row.is_large,
    notes: row.notes,
    model_names: [...(row.model_names ?? [])],
    sort_order: row.sort_order,
  }
}

export function itemDraftFromRow(row: ItemRow): ItemDraft {
  return {
    id: row.id,
    isNew: false,
    holder_type: row.holder_type,
    holder_id: row.holder_id,
    item_rules_id: row.item_rules_id,
    custom_name: row.custom_name,
    quantity: row.quantity,
    notes: row.notes,
  }
}

export function draftFromRows(rows: LoadedRows): EditDraft {
  const { warband } = rows
  return {
    warband: {
      name: warband.name,
      gold: warband.gold,
      wyrdstone: warband.wyrdstone,
      veteran_pool: warband.veteran_pool,
      notes: warband.notes,
    },
    heroes: rows.heroes.map(heroDraftFromRow),
    groups: rows.groups.map(groupDraftFromRow),
    items: rows.items.map(itemDraftFromRow),
  }
}

// ---- Diff ----

const STAT_KEYS: readonly StatKey[] = ['M', 'WS', 'BS', 'S', 'T', 'W', 'I', 'A', 'Ld']

function statsEqual(a: Stats, b: Stats): boolean {
  return STAT_KEYS.every((k) => a[k] === b[k])
}

function listEqual(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

function statIncreasesEqual(a: Partial<Record<StatKey, number>>, b: Partial<Record<StatKey, number>>): boolean {
  return STAT_KEYS.every((k) => (a[k] ?? 0) === (b[k] ?? 0))
}

function warbandChanges(before: WarbandRow, after: WarbandFields): RosterChange[] {
  const data: Record<string, unknown> = {}
  if (after.name !== before.name) data.name = after.name
  if (after.gold !== before.gold) data.gold = after.gold
  if (after.wyrdstone !== before.wyrdstone) data.wyrdstone = after.wyrdstone
  if (after.veteran_pool !== before.veteran_pool) data.veteran_pool = after.veteran_pool
  if (after.notes !== before.notes) data.notes = after.notes
  return Object.keys(data).length > 0 ? [{ table: 'warbands', op: 'update', id: before.id, data }] : []
}

function heroInsertData(hero: HeroDraft): Record<string, unknown> {
  return {
    name: hero.name,
    is_hired_sword: hero.is_hired_sword,
    unit_type_rules_id: hero.unit_type_rules_id,
    hired_sword_rules_id: hero.hired_sword_rules_id,
    stats: hero.stats,
    xp: hero.xp,
    level_ups: hero.level_ups,
    skill_tables: hero.skill_tables,
    skills: hero.skills,
    spells: hero.spells,
    injuries: hero.injuries,
    flags: hero.flags,
    equipment_locked: hero.is_hired_sword,
    is_large: hero.is_large,
    status: hero.status,
    notes: hero.notes,
    sort_order: hero.sort_order,
  }
}

function heroUpdateData(before: HeroRow, after: HeroDraft): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  if (after.name !== before.name) data.name = after.name
  if (!statsEqual(after.stats, before.stats)) data.stats = after.stats
  if (after.xp !== before.xp) data.xp = after.xp
  if (after.level_ups !== before.level_ups) data.level_ups = after.level_ups
  if (!listEqual(after.skill_tables, before.skill_tables)) data.skill_tables = after.skill_tables
  if (!listEqual(after.skills, before.skills)) data.skills = after.skills
  if (!listEqual(after.spells, before.spells)) data.spells = after.spells
  if (after.injuries !== before.injuries) data.injuries = after.injuries
  if (after.flags !== before.flags) data.flags = after.flags
  if (after.is_large !== before.is_large) data.is_large = after.is_large
  if (after.status !== before.status) data.status = after.status
  if (after.notes !== before.notes) data.notes = after.notes
  if (after.sort_order !== before.sort_order) data.sort_order = after.sort_order
  return data
}

function groupInsertData(group: GroupDraft): Record<string, unknown> {
  return {
    name: group.name,
    unit_type_rules_id: group.unit_type_rules_id,
    size: group.size,
    stats: group.stats,
    xp: group.xp,
    level_ups: group.level_ups,
    stat_increases: group.stat_increases,
    is_large: group.is_large,
    notes: group.notes,
    model_names: group.model_names,
    sort_order: group.sort_order,
  }
}

function groupUpdateData(before: HenchmanGroupRow, after: GroupDraft): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  if (after.name !== before.name) data.name = after.name
  if (after.size !== before.size) data.size = after.size
  if (!statsEqual(after.stats, before.stats)) data.stats = after.stats
  if (after.xp !== before.xp) data.xp = after.xp
  if (after.level_ups !== before.level_ups) data.level_ups = after.level_ups
  if (!statIncreasesEqual(after.stat_increases, before.stat_increases)) data.stat_increases = after.stat_increases
  if (after.is_large !== before.is_large) data.is_large = after.is_large
  if (after.notes !== before.notes) data.notes = after.notes
  if (after.model_names.join('\n') !== (before.model_names ?? []).join('\n')) data.model_names = after.model_names
  if (after.sort_order !== before.sort_order) data.sort_order = after.sort_order
  return data
}

function itemInsertData(item: ItemDraft): Record<string, unknown> {
  return {
    holder_type: item.holder_type,
    holder_id: item.holder_id,
    item_rules_id: item.item_rules_id,
    custom_name: item.custom_name,
    quantity: item.quantity,
    notes: item.notes,
  }
}

function itemUpdateData(before: ItemRow, after: ItemDraft): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  if (after.holder_type !== before.holder_type || after.holder_id !== before.holder_id) {
    data.holder_type = after.holder_type
    data.holder_id = after.holder_id
  }
  if (after.item_rules_id !== before.item_rules_id || after.custom_name !== before.custom_name) {
    data.item_rules_id = after.item_rules_id
    data.custom_name = after.custom_name
  }
  if (after.quantity !== before.quantity) data.quantity = after.quantity
  if (after.notes !== before.notes) data.notes = after.notes
  return data
}

interface Diffable {
  id: string
  isNew: boolean
}

function diffTable<Row extends { id: string }, Draft extends Diffable>(
  table: RosterChange['table'],
  rows: readonly Row[],
  drafts: readonly Draft[],
  insertData: (draft: Draft) => Record<string, unknown>,
  updateData: (row: Row, draft: Draft) => Record<string, unknown>,
): { upserts: RosterChange[]; deletes: RosterChange[] } {
  const byId = new Map(rows.map((r) => [r.id, r]))
  const upserts: RosterChange[] = []
  const seen = new Set<string>()
  for (const draft of drafts) {
    if (draft.isNew) {
      upserts.push({ table, op: 'insert', data: insertData(draft) })
      continue
    }
    seen.add(draft.id)
    const row = byId.get(draft.id)
    if (!row) continue // loaded row vanished under us; nothing sensible to send
    const data = updateData(row, draft)
    if (Object.keys(data).length > 0) upserts.push({ table, op: 'update', id: draft.id, data })
  }
  const deletes: RosterChange[] = rows.filter((r) => !seen.has(r.id)).map((r) => ({ table, op: 'delete', id: r.id }))
  return { upserts, deletes }
}

/** The minimal batch that turns `rows` into `draft`. Empty when nothing changed. */
export function diffDraft(rows: LoadedRows, draft: EditDraft): RosterChange[] {
  const heroes = diffTable('heroes', rows.heroes, draft.heroes, heroInsertData, heroUpdateData)
  const groups = diffTable('henchman_groups', rows.groups, draft.groups, groupInsertData, groupUpdateData)
  const items = diffTable('items', rows.items, draft.items, itemInsertData, itemUpdateData)
  return [
    ...warbandChanges(rows.warband, draft.warband),
    ...heroes.upserts,
    ...groups.upserts,
    ...items.upserts,
    ...items.deletes,
    ...heroes.deletes,
    ...groups.deletes,
  ]
}

// ---- Draft edits that need care ----

let tempCounter = 0

/** A key for a row the database has not seen. Never sent to the server (inserts carry no id). */
export function tempId(prefix: string): string {
  tempCounter += 1
  return `new-${prefix}-${tempCounter}`
}

/** Remove a hero or group and send its kit to the stash (the database trigger would do the same). */
export function removeHolder(draft: EditDraft, holderId: string): EditDraft {
  return {
    ...draft,
    heroes: draft.heroes.filter((h) => h.id !== holderId),
    groups: draft.groups.filter((g) => g.id !== holderId),
    items: draft.items.map((i) => (i.holder_id === holderId ? { ...i, holder_type: 'stash', holder_id: null } : i)),
  }
}
