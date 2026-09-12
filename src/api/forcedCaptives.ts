import type { WarbandDetail } from './warbands'
import type { CaptiveCase } from './captives'
import type { RosterHenchmanGroup, RosterItem, RosterWarband } from '../rules/types/roster'
import type { Stats } from '../rules/types'
import { findItem } from '../rules/data/items'

/**
 * Pure builder for a forced-captured henchman's outcome (migration 092): release, ransom or sale.
 * It produces the two rosters exactly as the server validates them — the returning model rejoins his
 * original group only while that group still matches the snapshot (profile, experience, state and
 * kit per model, and fewer than five models), otherwise he forms a new group carrying the snapshot; kit identity includes the
 * roster notes, so two rows of one item with different annotations stay distinct.
 */
export type ForcedCaptiveChoice = ({ kind: 'release' } | { kind: 'ransom'; gold: number } | { kind: 'sell'; d6: number; originalD6?: number | null }) & { groupId?: string }

export interface ForcedCaptureSnapshot {
  group: { id: string; name: string; unit_type_rules_id: string; stats: Stats; size: number; xp: number; level_ups?: number; campaign_state?: Record<string, unknown> | null; stat_increases?: Record<string, number> | null; is_large?: boolean }
  items: { source_item_id: string; item_rules_id: string | null; custom_name: string | null; quantity: number; notes?: string | null }[]
  event_id: string
  reason: string
  captor_name?: string
}

/** The identity the server uses for a piece of kit: item or custom name plus its annotation. */
export function kitKey(itemId: string | null | undefined, customName: string | null | undefined, notes: string | null | undefined): string {
  return (itemId ?? `custom:${customName ?? ''}`) + (notes ? ` [${notes}]` : '')
}

export function forcedCaptureSnapshot(item: CaptiveCase): ForcedCaptureSnapshot | null {
  const snap = item.model_snapshot as ForcedCaptureSnapshot | null
  return snap?.group?.stats && item.source === 'forced_capture' ? snap : null
}

/** The captured model's own kit, as roster items (notes carried so identities match). */
export function snapshotKit(snap: ForcedCaptureSnapshot): RosterItem[] {
  return snap.items.map(i => ({ itemId: i.item_rules_id, ...(i.item_rules_id ? {} : { customName: i.custom_name ?? undefined }), quantity: i.quantity, ...(i.notes ? { notes: i.notes } : {}) }))
}

/** Deep equality the way PostgreSQL compares jsonb: object key order does not matter. */
export function sameJson(a: unknown, b: unknown): boolean {
  const x = a ?? {}, y = b ?? {}
  if (x === y) return true
  if (typeof x !== 'object' || typeof y !== 'object' || x === null || y === null || Array.isArray(x) !== Array.isArray(y)) return false
  if (Array.isArray(x) && Array.isArray(y)) return x.length === y.length && x.every((v, i) => sameJson(v, y[i]))
  const kx = Object.keys(x as object).sort(), ky = Object.keys(y as object).sort()
  return kx.length === ky.length && kx.every((k, i) => k === ky[i] && sameJson((x as Record<string, unknown>)[k], (y as Record<string, unknown>)[k]))
}

/** Whether the original group can take the model back, mirroring the server's compatibility rule. */
export function canReturnToGroup(owner: WarbandDetail, item: CaptiveCase): boolean {
  const snap = forcedCaptureSnapshot(item)
  const row = owner.groups.find(g => g.id === item.hero_id)
  if (!snap || !row || row.size >= 5) return false
  if (row.unit_type_rules_id !== snap.group.unit_type_rules_id || !sameJson(row.stats, snap.group.stats) || row.xp !== snap.group.xp) return false
  if (row.level_ups !== (snap.group.level_ups ?? row.level_ups) || !sameJson(row.campaign_state, snap.group.campaign_state ?? {}) || !sameJson(row.stat_increases, snap.group.stat_increases ?? {})) return false
  if (row.size === 0) return true
  const perModel = new Map<string, number>()
  for (const i of owner.items.filter(i => i.holder_type === 'group' && i.holder_id === row.id)) {
    const key = kitKey(i.item_rules_id, i.custom_name, i.notes)
    perModel.set(key, (perModel.get(key) ?? 0) + i.quantity)
  }
  const wanted = new Map<string, number>()
  for (const i of snap.items) { const key = kitKey(i.item_rules_id, i.custom_name, i.notes); wanted.set(key, (wanted.get(key) ?? 0) + i.quantity) }
  if (perModel.size !== wanted.size) return false
  for (const [key, total] of perModel) { if (total % row.size !== 0 || wanted.get(key) !== total / row.size) return false }
  return true
}

/** `choice.groupId` is the form's stable id for a new group; `newGroupId` is a fallback for callers without one. */
export interface ForcedCaptiveProposalInput { item: CaptiveCase; owner: WarbandDetail; captor: WarbandDetail; choice: ForcedCaptiveChoice; newGroupId?: string }

export function buildForcedCaptiveProposal(input: ForcedCaptiveProposalInput): { choice: Record<string, unknown>; nextOwner: RosterWarband; nextCaptor: RosterWarband; message: string; rejoins: boolean } {
  const { item, owner, captor, choice } = input
  const groupId = choice.groupId ?? input.newGroupId
  if (!groupId) throw new Error('A stable id for the returning model’s group is required.')
  const snap = forcedCaptureSnapshot(item)
  if (!snap) throw new Error('This case is not a forced capture.')
  const kit = snapshotKit(snap)
  const kitText = kit.map(i => `${(i.itemId ? findItem(i.itemId)?.name : undefined) ?? i.itemId ?? i.customName}${i.quantity > 1 ? ` ×${i.quantity}` : ''}${i.notes ? ` (${i.notes})` : ''}`).join(', ') || 'no equipment'
  let nextOwner = owner.roster, nextCaptor = captor.roster, rejoins = false, message: string
  if (choice.kind === 'sell') {
    if (!Number.isInteger(choice.d6) || choice.d6 < 1 || choice.d6 > 6) throw new Error('Enter a D6 result from 1 to 6.')
    if (choice.originalD6 != null && (!Number.isInteger(choice.originalD6) || choice.originalD6 < 1 || choice.originalD6 > 6)) throw new Error('The app’s original D6 must be 1 to 6.')
    nextCaptor = { ...captor.roster, gold: captor.roster.gold + 5 * choice.d6, stash: [...captor.roster.stash, ...kit] }
    const dice = choice.originalD6 == null ? `tabletop D6 ${choice.d6}` : choice.originalD6 === choice.d6 ? `app rolled ${choice.d6}` : `app rolled ${choice.originalD6}; player changed this to ${choice.d6}`
    message = `${item.hero_name} sold to slavers for ${5 * choice.d6} gc (${dice}); ${captor.warband.name} keep his kit: ${kitText}.`
  } else {
    rejoins = canReturnToGroup(owner, item)
    const groups = owner.roster.henchmenGroups
    if (rejoins) {
      nextOwner = { ...owner.roster, henchmenGroups: groups.map(g => {
        if (g.id !== item.hero_id) return g
        const equipment = [...g.equipment]
        for (const piece of kit) {
          const at = equipment.findIndex(e => kitKey(e.itemId, e.customName, e.notes) === kitKey(piece.itemId, piece.customName, piece.notes))
          if (at >= 0) equipment[at] = { ...equipment[at], quantity: equipment[at].quantity + piece.quantity }
          else equipment.push({ ...piece })
        }
        return { ...g, size: g.size + 1, equipment }
      }) }
    } else {
      const group: RosterHenchmanGroup = {
        id: groupId, name: `${snap.group.name} (returned)`, unitTemplateId: snap.group.unit_type_rules_id, size: 1, stats: snap.group.stats, xp: snap.group.xp, levelUps: snap.group.level_ups ?? 0,
        statIncreases: (snap.group.stat_increases ?? {}) as RosterHenchmanGroup['statIncreases'], equipment: kit, modelNames: [], isLarge: snap.group.is_large ?? false,
        ...(snap.group.campaign_state && Object.keys(snap.group.campaign_state).length ? { campaignState: snap.group.campaign_state as RosterHenchmanGroup['campaignState'] } : {}),
      }
      nextOwner = { ...owner.roster, henchmenGroups: [...groups, group] }
    }
    const where = rejoins ? `rejoins ${snap.group.name}` : `returns as his own group (${snap.group.name} has changed since he was taken)`
    if (choice.kind === 'ransom') {
      if (!Number.isInteger(choice.gold) || choice.gold < 0 || choice.gold > owner.roster.gold) throw new Error('Enter an affordable, non-negative ransom.')
      nextOwner = { ...nextOwner, gold: nextOwner.gold - choice.gold }
      nextCaptor = { ...captor.roster, gold: captor.roster.gold + choice.gold }
      message = `${item.hero_name} ransomed for ${choice.gold} gc and ${where} with his kit: ${kitText}.`
    } else {
      message = `${item.hero_name} released and ${where} with his kit: ${kitText}.`
    }
  }
  return { choice: { ...choice, groupId }, nextOwner, nextCaptor, message, rejoins }
}
