// Pure helpers for the trading post: catalogue grouping and search, price and availability lines,
// who may still search for rare items this phase, the sell listing across every inventory, and the
// hand-built roster edits the resolvers do not cover (custom items, manual prices).

import { unitRules } from '../../rules/data/campaignRules'
import { findItem } from '../../rules/data/items'
import { WARBAND_SIZE_BANDS, warbandSizeBandIndex } from '../../rules/data/campaign/income'
import { sellPrice } from '../../rules/data/campaign/trading'
import type { DiceSpec } from '../../rules/resolve/dice'
import { itemPrice, type InventoryLocation } from '../../rules/resolve/trading'
import type { Item, ItemCategory } from '../../rules/types/items'
import type { CampaignHouseRules, RosterHero, RosterItem, RosterWarband } from '../../rules/types/roster'

// ---- Catalogue ----

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  melee: 'Hand-to-hand weapons',
  missile: 'Missile weapons',
  blackpowder: 'Blackpowder weapons',
  armour: 'Armour',
  misc: 'Miscellaneous',
  animal: 'Animals',
}

export const CATEGORY_ORDER: ItemCategory[] = ['melee', 'missile', 'blackpowder', 'armour', 'misc', 'animal']

export interface CatalogueGroup {
  category: ItemCategory
  title: string
  items: Item[]
}

/**
 * Case-insensitive search over name and availability text: every whitespace-separated word of the
 * query must appear. Results are grouped in CATEGORY_ORDER, alphabetical within a group; groups
 * with nothing left are dropped.
 */
export function groupCatalogue(items: readonly Item[], query = ''): CatalogueGroup[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const matches = items.filter((item) => {
    if (words.length === 0) return true
    const haystack = `${item.name} ${item.availability.text}`.toLowerCase()
    return words.every((w) => haystack.includes(w))
  })
  return CATEGORY_ORDER.map((category) => ({
    category,
    title: CATEGORY_LABEL[category],
    items: matches.filter((i) => i.category === category).sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((g) => g.items.length > 0)
}

/** "Common", "Rare 9", "Rare 9 · Dwarfs only", or "Special" for text the roll cannot resolve. */
export function availabilityLabel(item: Item): string {
  const a = item.availability
  if (a.kind === 'common') return 'Common'
  if (a.kind === 'rare' && a.rarity !== undefined) return a.restriction ? `Rare ${a.rarity} · ${a.restriction}` : `Rare ${a.rarity}`
  return 'Special'
}

/**
 * Price for a catalogue row, before any dice are rolled: "10 gc", "5 gc (half price armour, from
 * 10 gc)", "50 + 3D6 gc (roll 3D6)", or the source text when nothing is listed.
 */
export function priceLine(item: Item, houseRules: CampaignHouseRules): string {
  return itemPrice(item, houseRules).text
}

/** Total of a dice expression from the faces the player entered, or null until every die is filled. */
export function diceTotal(spec: DiceSpec, faces: readonly (number | null)[]): number | null {
  if (faces.length !== spec.count) return null
  let sum = 0
  for (const f of faces) {
    if (f === null || !Number.isInteger(f) || f < 1 || f > spec.sides) return null
    sum += f
  }
  return sum * spec.multiplier + spec.bonus
}

// ---- Rare-item searches ----

/**
 * Heroes who may still roll for a rare item this phase: active heroes (hired swords never search)
 * who are not in `heroesSearched`, in roster order.
 */
export function eligibleSearchers(roster: RosterWarband, heroesSearched: readonly string[]): RosterHero[] {
  const used = new Set(heroesSearched)
  return roster.heroes.filter((h) => h.status === 'active' && !used.has(h.id) && !unitRules(h.unitTemplateId).noRareSearch)
}

// ---- Wyrdstone ----

/** "4-6" for a warband of `size` warriors. */
export function sizeBandLabel(size: number): string {
  return WARBAND_SIZE_BANDS[warbandSizeBandIndex(size)]
}

// ---- Inventories ----

export interface LocationOption {
  key: string
  location: InventoryLocation
  label: string
  /** "Heroes" / "Henchmen" for optgroups; undefined for the stash. */
  group?: 'Heroes' | 'Henchmen'
}

export function locationKey(loc: InventoryLocation): string {
  return loc.kind === 'stash' ? 'stash' : `${loc.kind}:${loc.id}`
}

export function parseLocationKey(key: string): InventoryLocation {
  if (key === 'stash') return { kind: 'stash' }
  const sep = key.indexOf(':')
  const kind = key.slice(0, sep)
  const id = key.slice(sep + 1)
  if (kind === 'hero') return { kind: 'hero', id }
  if (kind === 'henchmanGroup') return { kind: 'henchmanGroup', id }
  throw new Error(`Unknown inventory location "${key}"`)
}

export function sameLocation(a: InventoryLocation, b: InventoryLocation): boolean {
  return locationKey(a) === locationKey(b)
}

/** The stash, every active hero and every henchman group. Hired swords are left out: their kit is fixed. */
export function locationOptions(roster: RosterWarband): LocationOption[] {
  const out: LocationOption[] = [{ key: 'stash', location: { kind: 'stash' }, label: 'Stash' }]
  for (const h of roster.heroes) {
    if (h.status !== 'active') continue
    out.push({ key: `hero:${h.id}`, location: { kind: 'hero', id: h.id }, label: h.name, group: 'Heroes' })
  }
  for (const g of roster.henchmenGroups) {
    out.push({ key: `henchmanGroup:${g.id}`, location: { kind: 'henchmanGroup', id: g.id }, label: `${g.name} (${g.size})`, group: 'Henchmen' })
  }
  return out
}

export function locationLabel(roster: RosterWarband, loc: InventoryLocation): string {
  switch (loc.kind) {
    case 'stash':
      return 'Stash'
    case 'hero':
      return roster.heroes.find((h) => h.id === loc.id)?.name ?? 'Unknown hero'
    case 'henchmanGroup':
      return roster.henchmenGroups.find((g) => g.id === loc.id)?.name ?? 'Unknown group'
  }
}

export function readInventory(roster: RosterWarband, loc: InventoryLocation): RosterItem[] {
  switch (loc.kind) {
    case 'stash':
      return roster.stash
    case 'hero':
      return roster.heroes.find((h) => h.id === loc.id)?.equipment ?? []
    case 'henchmanGroup':
      return roster.henchmenGroups.find((g) => g.id === loc.id)?.equipment ?? []
  }
}

function writeInventory(roster: RosterWarband, loc: InventoryLocation, items: RosterItem[]): RosterWarband {
  switch (loc.kind) {
    case 'stash':
      return { ...roster, stash: items }
    case 'hero':
      return { ...roster, heroes: roster.heroes.map((h) => (h.id === loc.id ? { ...h, equipment: items } : h)) }
    case 'henchmanGroup':
      return { ...roster, henchmenGroups: roster.henchmenGroups.map((g) => (g.id === loc.id ? { ...g, equipment: items } : g)) }
  }
}

/** Identity of a stack for matching: the catalogue id, or the custom name. Mirrors diffRoster. */
export function stackKey(item: Pick<RosterItem, 'itemId' | 'customName'>): string {
  return item.itemId !== null ? `rules:${item.itemId}` : `custom:${item.customName ?? ''}`
}

/** Copies of a stack held at `loc` (all stacks with the same key added up). */
export function heldQuantity(roster: RosterWarband, loc: InventoryLocation, stack: Pick<RosterItem, 'itemId' | 'customName'>): number {
  const key = stackKey(stack)
  return readInventory(roster, loc)
    .filter((i) => stackKey(i) === key)
    .reduce((sum, i) => sum + i.quantity, 0)
}

function takeStack(items: RosterItem[], stack: Pick<RosterItem, 'itemId' | 'customName'>, quantity: number, where: string): RosterItem[] {
  const key = stackKey(stack)
  const held = items.filter((i) => stackKey(i) === key).reduce((sum, i) => sum + i.quantity, 0)
  if (held < quantity) throw new Error(`${where} has ${held} of that item, cannot remove ${quantity}`)
  let remaining = quantity
  const out: RosterItem[] = []
  for (const s of items) {
    if (stackKey(s) !== key || remaining === 0) {
      out.push(s)
      continue
    }
    const take = Math.min(s.quantity, remaining)
    remaining -= take
    if (s.quantity > take) out.push({ ...s, quantity: s.quantity - take })
  }
  return out
}

function putStack(items: RosterItem[], stack: Pick<RosterItem, 'itemId' | 'customName' | 'notes'>, quantity: number): RosterItem[] {
  const key = stackKey(stack)
  const idx = items.findIndex((i) => stackKey(i) === key)
  if (idx === -1) {
    const fresh: RosterItem = { itemId: stack.itemId, quantity }
    if (stack.itemId === null) fresh.customName = stack.customName
    if (stack.notes) fresh.notes = stack.notes
    return [...items, fresh]
  }
  return items.map((i, n) => (n === idx ? { ...i, quantity: i.quantity + quantity } : i))
}

function assertQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1) throw new Error(`Quantity must be a whole number of at least 1 (got ${quantity})`)
}

/**
 * Sell `quantity` of a stack for an agreed total. Used for custom items and for catalogue entries
 * with no listed price, where sellItem cannot compute a figure; the player types the gold.
 */
export function sellForGold(
  roster: RosterWarband,
  from: InventoryLocation,
  stack: Pick<RosterItem, 'itemId' | 'customName'>,
  quantity: number,
  gold: number,
): RosterWarband {
  assertQuantity(quantity)
  if (!Number.isInteger(gold) || gold < 0) throw new Error(`Sale price must be a whole number of gold crowns (got ${gold})`)
  const inventory = takeStack(readInventory(roster, from), stack, quantity, locationLabel(roster, from))
  return writeInventory({ ...roster, gold: roster.gold + gold }, from, inventory)
}

/** Move `quantity` of any stack (custom items included) between two inventories. */
export function moveStack(
  roster: RosterWarband,
  from: InventoryLocation,
  to: InventoryLocation,
  stack: Pick<RosterItem, 'itemId' | 'customName' | 'notes'>,
  quantity: number,
): RosterWarband {
  assertQuantity(quantity)
  if (sameLocation(from, to)) throw new Error('Source and destination are the same inventory')
  const source = takeStack(readInventory(roster, from), stack, quantity, locationLabel(roster, from))
  const target = readInventory(roster, to)
  let next = writeInventory(roster, from, source)
  next = writeInventory(next, to, putStack(target, stack, quantity))
  return next
}

// ---- Sell listing ----

export interface SaleLine {
  /** Stable key for React and for the sheet: location + stack. */
  key: string
  location: InventoryLocation
  holder: string
  item: RosterItem
  catalogue: Item | undefined
  /** Listed basic price, null for custom items and entries with no cost line. */
  base: number | null
  /** Gold received per copy at half the listed price, null when a manual price is needed. */
  each: number | null
}

/** Every stack in the stash, on an active hero or in a henchman group. Hired swords' kit is not for sale. */
export function sellListing(roster: RosterWarband): SaleLine[] {
  const out: SaleLine[] = []
  const push = (location: InventoryLocation, holder: string, items: RosterItem[]) => {
    items.forEach((item, i) => {
      const catalogue = item.itemId ? findItem(item.itemId) : undefined
      const base = catalogue?.price.base ?? null
      out.push({
        key: `${locationKey(location)}/${stackKey(item)}/${i}`,
        location,
        holder,
        item,
        catalogue,
        base,
        each: base === null ? null : sellPrice(base),
      })
    })
  }
  push({ kind: 'stash' }, 'Stash', roster.stash)
  for (const h of roster.heroes) {
    if (h.status !== 'active') continue
    push({ kind: 'hero', id: h.id }, h.name, h.equipment)
  }
  for (const g of roster.henchmenGroups) push({ kind: 'henchmanGroup', id: g.id }, g.name, g.equipment)
  return out
}

/** Sentence for the phase banner. */
export function phaseSummary(matchId: string | null, wyrdstoneSold: boolean, searchesUsed: number, searchesLeft: number): string {
  if (matchId === null) return 'Not in a post-battle sequence, no limits apply.'
  const sale = wyrdstoneSold ? 'wyrdstone already sold' : 'wyrdstone not yet sold'
  const searches = `${searchesLeft} rare-item ${searchesLeft === 1 ? 'search' : 'searches'} left${searchesUsed > 0 ? ` (${searchesUsed} used)` : ''}`
  return `This post-battle sequence: ${sale}; ${searches}.`
}
