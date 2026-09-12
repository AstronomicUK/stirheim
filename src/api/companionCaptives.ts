import type { WarbandDetail } from './warbands'
import type { CaptiveCase } from './captives'
import type { RosterItem, RosterWarband } from '../rules/types/roster'
import { ANIMAL_KINDS } from '../rules/resolve/animals'

/**
 * Pure builder for a captured equipment companion (Wardog or Gnoblar Fighter, migration 093):
 * release and ransom put one of the item back on its original handler while he is still an active
 * Hero, otherwise on the chosen active Hero or into the stash; sale pays the captor 5 × D6 and the
 * animal is gone. The rosters produced are exactly what the server validates.
 */
export type CompanionCaptiveChoice = ({ kind: 'release' } | { kind: 'ransom'; gold: number } | { kind: 'sell'; d6: number; originalD6?: number | null }) & { holderId?: string | null }

export interface CompanionCaptureSnapshot {
  item: { id: string; item_rules_id: string; custom_name: string | null; notes: string }
  holder: { id: string; name: string; unit_type_rules_id: string | null }
  animal_id: string
  event_id: string
  reason: string
  captor_name?: string
  kind_name: string
}

export function companionCaptureSnapshot(item: CaptiveCase): CompanionCaptureSnapshot | null {
  const snap = item.model_snapshot as CompanionCaptureSnapshot | null
  return item.subject_kind === 'companion' && snap?.item?.item_rules_id ? snap : null
}

/** Where the animal would go on return: the original handler if he is still active, else the chosen Hero or the stash. */
export function companionReturnHolder(owner: WarbandDetail, item: CaptiveCase, chosenHolderId?: string | null): { holderId: string | null; original: boolean } {
  const snap = companionCaptureSnapshot(item)
  if (snap && owner.roster.heroes.some(h => h.id === snap.holder.id && h.status === 'active')) return { holderId: snap.holder.id, original: true }
  if (chosenHolderId && owner.roster.heroes.some(h => h.id === chosenHolderId && h.status === 'active')) return { holderId: chosenHolderId, original: false }
  return { holderId: null, original: false }
}

function addOne(equipment: RosterItem[], itemId: string, notes: string): RosterItem[] {
  const at = equipment.findIndex(e => e.itemId === itemId && (e.notes ?? '') === notes)
  if (at >= 0) return equipment.map((e, i) => i === at ? { ...e, quantity: e.quantity + 1 } : e)
  return [...equipment, { itemId, quantity: 1, ...(notes ? { notes } : {}) }]
}

export function buildCompanionCaptiveProposal(input: { item: CaptiveCase; owner: WarbandDetail; captor: WarbandDetail; choice: CompanionCaptiveChoice }): { choice: Record<string, unknown>; nextOwner: RosterWarband; nextCaptor: RosterWarband; message: string; holderId: string | null; original: boolean } {
  const { item, owner, captor, choice } = input
  const snap = companionCaptureSnapshot(item)
  if (!snap) throw new Error('This case is not a captured companion.')
  const kindName = ANIMAL_KINDS[snap.item.item_rules_id]?.name ?? snap.kind_name
  let nextOwner = owner.roster, nextCaptor = captor.roster, message: string, holderId: string | null = null, original = false
  if (choice.kind === 'sell') {
    if (!Number.isInteger(choice.d6) || choice.d6 < 1 || choice.d6 > 6) throw new Error('Enter a D6 result from 1 to 6.')
    if (choice.originalD6 != null && (!Number.isInteger(choice.originalD6) || choice.originalD6 < 1 || choice.originalD6 > 6)) throw new Error('The app’s original D6 must be 1 to 6.')
    nextCaptor = { ...captor.roster, gold: captor.roster.gold + 5 * choice.d6 }
    const dice = choice.originalD6 == null ? `tabletop D6 ${choice.d6}` : choice.originalD6 === choice.d6 ? `app rolled ${choice.d6}` : `app rolled ${choice.originalD6}; player changed this to ${choice.d6}`
    message = `${item.hero_name} sold to slavers for ${5 * choice.d6} gc (${dice}); the ${kindName} is gone.`
  } else {
    ;({ holderId, original } = companionReturnHolder(owner, item, choice.holderId))
    if (holderId) nextOwner = { ...owner.roster, heroes: owner.roster.heroes.map(h => h.id === holderId ? { ...h, equipment: addOne(h.equipment, snap.item.item_rules_id, snap.item.notes) } : h) }
    else nextOwner = { ...owner.roster, stash: addOne(owner.roster.stash, snap.item.item_rules_id, snap.item.notes) }
    const holderName = holderId ? owner.roster.heroes.find(h => h.id === holderId)?.name ?? 'a Hero' : 'the stash'
    const where = original ? `returns to ${holderName}` : `returns to ${holderName} (${snap.holder.name} is no longer active)`
    if (choice.kind === 'ransom') {
      if (!Number.isInteger(choice.gold) || choice.gold < 0 || choice.gold > owner.roster.gold) throw new Error('Enter an affordable, non-negative ransom.')
      nextOwner = { ...nextOwner, gold: nextOwner.gold - choice.gold }
      nextCaptor = { ...captor.roster, gold: captor.roster.gold + choice.gold }
      message = `${item.hero_name} ransomed for ${choice.gold} gc and ${where}.`
    } else {
      message = `${item.hero_name} released and ${where}.`
    }
  }
  return { choice: { ...choice, holderId: holderId ?? choice.holderId ?? null }, nextOwner, nextCaptor, message, holderId, original }
}
