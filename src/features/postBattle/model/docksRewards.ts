import { findItem } from '../../../rules/data/items'
import type { FoundItem } from './state'
import { foundItemFromName } from './exploration'
export interface DocksDraft { role?: 'raider' | 'defender'; crates?: number | null; rolls?: Record<string, (number | null)[]>; medicine?: Record<string, 'chest' | 'herbs' | undefined>; gems?: Record<string, 'keep' | 'sell' | undefined>; garlicMembers?: number | null }
export interface CargoRoll { key: string; label: string; count: number; sides: number }
export function docksRewards(state: DocksDraft, participantCount?: number) {
  const out = { gold: 0, items: [] as FoundItem[], notes: [] as string[], problems: [] as string[], prompts: [] as CargoRoll[], medicine: [] as string[], gems: [] as string[], garlic: false }
  const valid = (n: number | null | undefined, min: number, max: number): n is number => n != null && Number.isInteger(n) && n >= min && n <= max
  if (!participantCount || participantCount < 2) { out.problems.push('Load the battle participants before resolving the cargo.'); return out }
  const max = participantCount === 2 ? 7 : 10
  if (!['raider', 'defender'].includes(state.role ?? '') || (state.role === 'defender' && participantCount === 2)) { out.problems.push('Choose your role; a defending warband exists only in the multiplayer game.'); return out }
  if (!valid(state.crates, 0, max)) { out.problems.push(`Record 0–${max} qualifying crates.`); return out }
  if (state.role === 'defender') { out.gold = state.crates * 25; out.notes.push(`Down at the Docks: ${state.crates} crates remaining on the battlefield ×25 = ${out.gold} gc defensive payment. No cargo contents claimed from these crates.`); return out }
  out.notes.push(`Down at the Docks: ${state.crates} crates retained. Crates lost while routing are excluded.`)
  const roll = (key: string, label: string, count = 1, sides = 6): number | null => {
    out.prompts.push({ key, label, count, sides })
    const values = state.rolls?.[key]
    if (values?.length !== count || values.some(d => !valid(d, 1, sides))) { out.problems.push(`${label}: enter ${count}D${sides}.`); return null }
    const total = values.reduce<number>((n, d) => n + d!, 0)
    out.notes.push(`${label}: ${values.join(' + ')} = ${total}.`)
    return total
  }
  const item = (name: string, count = 1) => { if (count > 0) out.items.push(foundItemFromName(name, count)) }
  for (let i = 0; i < state.crates; i++) {
    const key = String(i), label = `Crate ${i + 1}`
    const total = roll(`${key}:cargo`, `${label}: cargo`, 4)
    if (total === null) continue
    const die = (suffix: string, name: string, count = 1, sides = 6) => roll(`${key}:${suffix}`, `${label}: ${name}`, count, sides)
    if (total === 4) {
      out.gems.push(key)
      if (!['keep', 'sell'].includes(state.gems?.[key] ?? '')) out.problems.push(`${label}: keep the gems or fence them for 40 gc.`)
      else if (state.gems?.[key] === 'sell') { out.gold += 40; out.notes.push(`${label}: gems fenced for 40 gc.`) }
      else { item('Smuggled Gems'); out.notes.push(`${label}: gems kept; +1 rarity finds when worn.`) }
      item('Tarot Cards')
    } else if (total === 5) item('Blunderbuss')
    else if (total === 6) {
      out.medicine.push(key)
      if (!['chest', 'herbs'].includes(state.medicine?.[key] ?? '')) out.problems.push(`${label}: keep the medicine chest or take its Healing Herbs doses.`)
      else if (state.medicine?.[key] === 'chest') item('Medicine Chest')
      else { const n = die('herbs', 'Healing Herbs doses'); if (n !== null) item('Healing Herbs', n) }
    } else if (total === 7) item('Heavy armour')
    else if (total === 8) item('Elven Cloak')
    else if (total === 9) { const n = die('weapons', 'shields and swords', 1, 3); if (n !== null) { item('Shield', n); item('Sword', n) } }
    else if (total <= 11) {
      out.gold += die('beer', 'beer value', 2) ?? 0
      if (die('ale', 'Bugman’s Ale discovery') === 6) item("Bugman's Ale")
    } else if (total <= 16) {
      out.gold += die('food', 'food value') ?? 0
      out.garlic = true
      if (!valid(state.garlicMembers, 0, 100)) out.problems.push('Record the number of warband members receiving a clove of garlic from each food crate.')
      else { item('Garlic', state.garlicMembers); out.notes.push(`${label}: ${state.garlicMembers} warband members receive one clove of garlic each.`) }
      if (die('drug-find', 'hidden drug discovery') === 6) { const d = die('drug', 'hidden drug'); if (d !== null) item(d <= 2 ? 'Dark Venom' : d <= 4 ? 'Black Lotus' : 'Crimson Shade') }
    } else if (total <= 18) {
      out.gold += die('clothes', 'clothing value', 2) ?? 0
      const n = die('leathers', 'toughened leathers sets', 1, 3); if (n !== null) item('Toughened Leathers', n)
    } else if (total === 19) {
      out.gold += die('luxury', 'luxury goods value', 4) ?? 0
      const d = die('hidden', 'hidden luxury item'); if (d !== null) item(d <= 3 ? 'Wyrdstone Pendulum' : 'Cathayan Silk Clothes')
    } else if (total === 20) { out.gold += die('powder', 'blackpowder value', 5) ?? 0; item('Superior Blackpowder') }
    else if (total === 21) { const n = die('crossbows', 'crossbows with hunting bolts', 1, 3); if (n !== null) { item('Crossbow', n); item('Hunting Bolts', n) } }
    else if (total === 22) { const n = die('bows', 'Elven bows', 1, 3); if (n !== null) item('Elf Bow', n) }
    else if (total === 23) item('Hochland Long Rifle')
    else item('Gromril Armour')
  }
  out.notes.push(`Cargo income: ${out.gold} gc. Items: ${out.items.map(i => `${i.quantity} × ${i.item_rules_id ? findItem(i.item_rules_id)?.name ?? i.item_rules_id : i.custom_name}`).join(', ') || 'none'}.`)
  return out
}
