// Client-side checks for the manual editor. Mirrors the database constraints (schema migration 1)
// so a bad number is caught next to the field instead of as an RPC error. Errors are keyed by a
// dotted path the form can look up: "warband.gold", "heroes.<id>.stats.WS", "items.<id>.name".

import { z } from 'zod'
import type { EditDraft, HeroDraft, ItemDraft } from './diff'

export type DraftErrors = Record<string, string>

const int = (label: string) => z.number({ error: `${label} must be a whole number.` }).int(`${label} must be a whole number.`)
const nonNegative = (label: string) => int(label).min(0, `${label} cannot be below zero.`)
/** Characteristics run 0-10 on every profile in the data (Ld tops out at 10). */
const stat = (label: string) => int(label).min(0, `${label} cannot be below zero.`).max(10, `${label} cannot exceed 10.`)

const name = z.string().trim().min(1, 'Enter a name.').max(60, 'Use at most 60 characters.')

export const statsSchema = z.object({
  M: stat('M'),
  WS: stat('WS'),
  BS: stat('BS'),
  S: stat('S'),
  T: stat('T'),
  W: stat('W'),
  I: stat('I'),
  A: stat('A'),
  Ld: stat('Ld'),
})

export const warbandFieldsSchema = z.object({
  name,
  gold: nonNegative('Gold'),
  wyrdstone: nonNegative('Wyrdstone'),
  veteran_pool: int('Veteran pool').min(2, 'Veteran pool is a 2D6 roll (2-12).').max(12, 'Veteran pool is a 2D6 roll (2-12).').nullable(),
  notes: z.string(),
})

export const heroDraftSchema = z.object({
  name,
  stats: statsSchema,
  xp: nonNegative('Experience'),
  level_ups: nonNegative('Advances taken'),
})

export const groupDraftSchema = z.object({
  name,
  size: nonNegative('Size'),
  stats: statsSchema,
  xp: nonNegative('Experience'),
  level_ups: nonNegative('Advances taken'),
})

export const itemDraftSchema = z.object({
  quantity: int('Quantity').min(1, 'Quantity must be at least 1.'),
})

function collect(errors: DraftErrors, prefix: string, result: z.ZodSafeParseResult<unknown>): void {
  if (result.success) return
  for (const issue of result.error.issues) {
    const key = `${prefix}.${issue.path.join('.')}`
    if (!(key in errors)) errors[key] = issue.message
  }
}

/** Every problem in the draft, keyed by field path. Empty when the draft can be saved. */
export function validateDraft(draft: EditDraft): DraftErrors {
  const errors: DraftErrors = {}
  collect(errors, 'warband', warbandFieldsSchema.safeParse(draft.warband))

  const savedHolders = new Set<string>()
  for (const hero of draft.heroes) {
    collect(errors, `heroes.${hero.id}`, heroDraftSchema.safeParse(hero))
    if (!hero.isNew) savedHolders.add(hero.id)
  }
  for (const group of draft.groups) {
    collect(errors, `groups.${group.id}`, groupDraftSchema.safeParse(group))
    if (!group.isNew) savedHolders.add(group.id)
  }
  for (const item of draft.items) {
    const prefix = `items.${item.id}`
    collect(errors, prefix, itemDraftSchema.safeParse(item))
    if (item.item_rules_id == null && (item.custom_name == null || item.custom_name.trim() === '')) {
      errors[`${prefix}.name`] = 'Pick an item or type a name.'
    }
    if (item.holder_type !== 'stash') {
      if (item.holder_id == null) errors[`${prefix}.holder`] = 'Choose who carries this.'
      else if (!savedHolders.has(item.holder_id)) {
        errors[`${prefix}.holder`] = 'Save the new warrior first, then give it equipment.'
      }
    }
  }
  return errors
}

/** Trim names and blank out empty custom names so the diff compares like with like. */
export function normaliseDraft(draft: EditDraft): EditDraft {
  const trimHero = (h: HeroDraft): HeroDraft => ({ ...h, name: h.name.trim() })
  const trimItem = (i: ItemDraft): ItemDraft => ({
    ...i,
    custom_name: i.custom_name == null || i.custom_name.trim() === '' ? null : i.custom_name.trim(),
  })
  return {
    warband: { ...draft.warband, name: draft.warband.name.trim() },
    heroes: draft.heroes.map(trimHero),
    groups: draft.groups.map((g) => ({ ...g, name: g.name.trim() })),
    items: draft.items.map(trimItem),
  }
}
