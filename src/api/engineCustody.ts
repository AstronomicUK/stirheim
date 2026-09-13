import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { warbandKeys, type WarbandDetail } from './warbands'
import type { CaptiveCase } from './captives'
import { forcedCaptureSnapshot, snapshotKit, type ForcedCaptureSnapshot } from './forcedCaptives'
import type { RosterItem, RosterWarband } from '../rules/types/roster'
import { findItem } from '../rules/data/items'
import { WARBAND_TEMPLATES, findUnitTemplate } from '../rules/data/warbandTemplates'
import { HIRED_SWORDS } from '../rules/data/campaign/hiredSwords'
import { DRAMATIS_PERSONAE } from '../rules/data/campaign/dramatisPersonae'
import { unitIsLarge } from '../rules/resolve/builder'

/**
 * Engine of Chaos custody (migration 102). A captured Hero is locked up through an ordinary captive
 * proposal of kind 'engine_placement': the victim's side hands over exactly the Hero's kit, the
 * Chaos Dwarf stash gains it, and the case moves to 'held' (not resolved) so ransom, exchange and
 * sale wait until the placement is reversed. Anonymous prisoners from the holder's own exploration
 * report (Straggler = one, Prisoners = D3) are recorded by the holder alone. Places, capacity and
 * Large status are decided by the server; the builder here only previews them.
 */
export type EnginePrisonerState = 'held' | 'reversed' | 'freed' | 'dispatched'
export interface EnginePrisonerRow {
  id: string
  engine_id: string
  holder_warband_id: string
  /** Set for a named prisoner (a captive case); null for an anonymous one. */
  case_id: string | null
  /** Set for an anonymous prisoner found exploring; null for a named one. */
  exploration_report_id: string | null
  victim_warband_id: string | null
  name: string
  large: boolean
  places: 1 | 2
  /** Named: { hero, items (original rows), report_id, report_revision, source }. Anonymous: { anonymous: true, report_id, location, count_roll, allowed }. */
  snapshot: Record<string, unknown>
  /** The item rows moved to the holder's stash when the placement was accepted (roster change objects). */
  confiscated: { table: string; op: string; id?: string; data?: Record<string, unknown> }[]
  state: EnginePrisonerState
  proposal_id: string | null
  placed_by: string | null
  placed_at: string
  released_at: string | null
  release_reason: string
  history: { event: string; at: string; by?: string | null; reason?: string; proposal_id?: string; report_id?: string; location?: string }[]
}

const client = supabase as unknown as SupabaseClient
export const enginePrisonerKeys = { all: ['enginePrisoners'] as const, forWarband: (id: string | undefined) => ['enginePrisoners', id] as const }

/** Prisoners visible to a warband: everyone in its own Engines, plus its own warriors held elsewhere. */
export async function fetchEnginePrisoners(warbandId: string): Promise<EnginePrisonerRow[]> {
  const { data, error } = await client.from('engine_prisoners').select('*')
    .or(`holder_warband_id.eq.${warbandId},victim_warband_id.eq.${warbandId}`)
    .order('placed_at').order('id')
  if (error) throw new Error(error.message)
  return data as EnginePrisonerRow[]
}
export function useEnginePrisoners(warbandId: string | undefined) {
  return useQuery({ queryKey: enginePrisonerKeys.forWarband(warbandId), enabled: Boolean(warbandId), refetchInterval: 30_000, queryFn: () => fetchEnginePrisoners(warbandId!) })
}

/** The original item rows a named prisoner carried, as stored in his custody snapshot. */
export function prisonerOriginalKit(row: EnginePrisonerRow): { id: string; item_rules_id: string | null; custom_name: string | null; quantity: number; notes: string }[] | null {
  const items = row.snapshot?.items
  return Array.isArray(items) ? items as { id: string; item_rules_id: string | null; custom_name: string | null; quantity: number; notes: string }[] : null
}

function invalidateCustody(cache: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    cache.invalidateQueries({ queryKey: ['engines'] }),
    cache.invalidateQueries({ queryKey: enginePrisonerKeys.all }),
    cache.invalidateQueries({ queryKey: ['captives'] }),
    cache.invalidateQueries({ queryKey: warbandKeys.all }),
  ])
}

/** Whether a Hero row is Large by its native profile or its own flag (server: capture_unit_large). */
export function heroIsLarge(owner: WarbandDetail, heroId: string): boolean {
  const row = owner.heroes.find(h => h.id === heroId)
  if (!row) return false
  if (row.is_large) return true
  if (row.is_hired_sword && row.hired_sword_rules_id) {
    const hired = [...HIRED_SWORDS, ...DRAMATIS_PERSONAE].find(h => h.id === row.hired_sword_rules_id)
    return Boolean(hired?.detail?.specialRules.some(r => /large/i.test(r.name)))
  }
  const unitId = row.unit_type_rules_id ?? ''
  const own = WARBAND_TEMPLATES.find(w => w.id === owner.roster.warbandTemplateId)
  const unit = (own && findUnitTemplate(own, unitId)) ?? WARBAND_TEMPLATES.map(w => findUnitTemplate(w, unitId)).find(Boolean)
  return unitIsLarge(unit)
}

function itemName(item: RosterItem): string {
  return (item.itemId ? findItem(item.itemId)?.name : undefined) ?? item.customName ?? item.itemId ?? 'item'
}

export interface EnginePlacementInput {
  item: CaptiveCase
  owner: WarbandDetail
  captor: WarbandDetail
  engineId: string
}

/** Whether a forced-captured henchman's group is Large by its snapshot flag or native profile. */
function snapshotGroupIsLarge(snap: ForcedCaptureSnapshot): boolean {
  if (snap.group.is_large) return true
  const unit = WARBAND_TEMPLATES.map(w => findUnitTemplate(w, snap.group.unit_type_rules_id)).find(Boolean)
  return unitIsLarge(unit)
}

/**
 * Pure builder: the two rosters exactly as the server validates them. A Hero keeps his row and his
 * 'captured' status; his equipment leaves him and lands in the captor's stash as new rows. A
 * forced-captured henchman (Man-catcher, migration 104) is already off the roster with his kit, so
 * only the captor's stash changes: it gains exactly the snapshot kit.
 */
export function buildEnginePlacementProposal(input: EnginePlacementInput): { choice: Record<string, unknown>; nextOwner: RosterWarband; nextCaptor: RosterWarband; message: string; large: boolean; kit: RosterItem[] } {
  const { item, owner, captor, engineId } = input
  if (!engineId) throw new Error('Choose the Engine that holds the prisoner.')
  if (item.subject_kind === 'henchman') {
    const snap = forcedCaptureSnapshot(item)
    if (!snap) throw new Error('A lost henchman can only be resolved through Kidnapped!.')
    const kit = snapshotKit(snap), large = snapshotGroupIsLarge(snap)
    const kitText = kit.length ? kit.map(i => `${i.quantity > 1 ? `${i.quantity} × ` : ''}${itemName(i)}${i.notes ? ` (${i.notes})` : ''}`).join(', ') : 'no equipment'
    return {
      choice: { kind: 'engine_placement', engineId },
      nextOwner: owner.roster, nextCaptor: { ...captor.roster, stash: [...captor.roster.stash, ...kit] }, large, kit,
      message: `${item.hero_name} locked in the Engine of Chaos of ${captor.warband.name} (${large ? 'two places, Large' : 'one place'}); ${kitText} confiscated to the stash. He stays captured.`,
    }
  }
  if (item.subject_kind !== 'hero') throw new Error('Only a captured Hero, hired sword or henchman can be locked in an Engine of Chaos.')
  const hero = owner.roster.heroes.find(h => h.id === item.hero_id)
  if (!hero) throw new Error('This warrior is no longer on the roster.')
  if (hero.status !== 'captured') throw new Error('This warrior is no longer recorded as captured.')
  const kit = hero.equipment
  const large = heroIsLarge(owner, item.hero_id)
  const nextOwner: RosterWarband = { ...owner.roster, heroes: owner.roster.heroes.map(h => h.id === hero.id ? { ...h, equipment: [] } : h) }
  const nextCaptor: RosterWarband = { ...captor.roster, stash: [...captor.roster.stash, ...kit.map(i => ({ ...i }))] }
  const kitText = kit.length ? kit.map(i => `${i.quantity > 1 ? `${i.quantity} × ` : ''}${itemName(i)}${i.notes ? ` (${i.notes})` : ''}`).join(', ') : 'no equipment'
  return {
    choice: { kind: 'engine_placement', engineId },
    nextOwner, nextCaptor, large, kit,
    message: `${item.hero_name} locked in the Engine of Chaos of ${captor.warband.name} (${large ? 'two places, Large' : 'one place'}); ${kitText} confiscated to the stash. He stays captured.`,
  }
}

export interface AnonymousPrisonerInput {
  engineId: string
  /** The holder's own applied report whose exploration found the Straggler or Prisoners. */
  reportId: string
  prisoners: { name: string }[]
  /** Prisoners result only: the D3 for how many were found. Fixed by the first placement for that report. */
  countRoll?: number | null
}
export function usePlaceAnonymousPrisoners() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: async (input: AnonymousPrisonerInput): Promise<string[]> => {
    const { data, error } = await client.rpc('place_anonymous_prisoners', { p_engine_id: input.engineId, p_report_id: input.reportId, p_prisoners: input.prisoners, p_count_roll: input.countRoll ?? null })
    if (error) throw new Error(error.message)
    return data as string[]
  }, onSuccess: () => invalidateCustody(cache) })
}

/** Undo an anonymous placement. Named prisoners go back through useReverseCaptive on their case. */
export function useReverseAnonymousPlacement() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: async (input: { prisonerId: string; reason: string }) => {
    const { error } = await client.rpc('reverse_anonymous_placement', { p_prisoner_id: input.prisonerId, p_reason: input.reason })
    if (error) throw new Error(error.message)
  }, onSuccess: () => invalidateCustody(cache) })
}
