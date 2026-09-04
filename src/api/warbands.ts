// Warband reads and writes. Reads are plain PostgREST selects filtered by RLS; every write goes
// through one of the two SQL functions in supabase/migrations/20260904000004_roster_functions.sql
// so multi-row changes are atomic and carry an audit reason.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Json } from './database.types'
import type { HenchmanGroupRow, HeroRow, ItemRow, WarbandRow } from '../domain'
import { toRosterWarband } from '../domain'
import type { RosterWarband } from '../rules/types/roster'
import type { CreateWarbandPayload } from '../rules/resolve/builder'
import { supabase } from './supabase'

export const warbandKeys = {
  all: ['warbands'] as const,
  mine: (userId: string | undefined) => ['warbands', 'mine', userId] as const,
  one: (id: string | undefined) => ['warbands', 'one', id] as const,
}

export interface WarbandSummary {
  id: string
  name: string
  type_rules_id: string
  owner_id: string
  gold: number
  wyrdstone: number
  archived: boolean
  updated_at: string
  hero_count: number
  model_count: number
}

/** Everything needed to show one warband: the rows, plus the resolver-side view of them. */
export interface WarbandDetail {
  warband: WarbandRow
  heroes: HeroRow[]
  groups: HenchmanGroupRow[]
  items: ItemRow[]
  roster: RosterWarband
}

export async function fetchMyWarbands(userId: string): Promise<WarbandSummary[]> {
  const { data, error } = await supabase
    .from('warbands')
    .select('id, name, type_rules_id, owner_id, gold, wyrdstone, archived, updated_at, heroes(status), henchman_groups(size)')
    .eq('owner_id', userId)
    .order('archived')
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data.map((row) => {
    const heroes = row.heroes.filter((h) => h.status === 'active').length
    const henchmen = row.henchman_groups.reduce((sum, g) => sum + g.size, 0)
    return {
      id: row.id,
      name: row.name,
      type_rules_id: row.type_rules_id,
      owner_id: row.owner_id,
      gold: row.gold,
      wyrdstone: row.wyrdstone,
      archived: row.archived,
      updated_at: row.updated_at,
      hero_count: heroes,
      model_count: heroes + henchmen,
    }
  })
}

export async function fetchWarband(id: string): Promise<WarbandDetail> {
  const [warband, heroes, groups, items] = await Promise.all([
    supabase.from('warbands').select('*').eq('id', id).maybeSingle(),
    supabase.from('heroes').select('*').eq('warband_id', id).order('sort_order').order('created_at'),
    supabase.from('henchman_groups').select('*').eq('warband_id', id).order('sort_order').order('created_at'),
    supabase.from('items').select('*').eq('warband_id', id).order('created_at'),
  ])
  const firstError = warband.error ?? heroes.error ?? groups.error ?? items.error
  if (firstError) throw new Error(firstError.message)
  if (!warband.data) throw new Error('This warband does not exist, or you cannot see it.')
  const w = warband.data as WarbandRow
  const h = (heroes.data ?? []) as HeroRow[]
  const g = (groups.data ?? []) as HenchmanGroupRow[]
  const i = (items.data ?? []) as ItemRow[]
  return { warband: w, heroes: h, groups: g, items: i, roster: toRosterWarband(w, h, g, i) }
}

export function useMyWarbands(userId: string | undefined) {
  return useQuery({
    queryKey: warbandKeys.mine(userId),
    queryFn: () => fetchMyWarbands(userId!),
    enabled: Boolean(userId),
  })
}

export function useWarband(id: string | undefined) {
  return useQuery({
    queryKey: warbandKeys.one(id),
    queryFn: () => fetchWarband(id!),
    enabled: Boolean(id),
  })
}

export async function createWarband(payload: CreateWarbandPayload): Promise<string> {
  const { data, error } = await supabase.rpc('create_warband', { payload: payload as unknown as Json })
  if (error) throw new Error(error.message)
  return data
}

export type RosterTable = 'warbands' | 'heroes' | 'henchman_groups' | 'items'

export interface RosterChange {
  table: RosterTable
  op: 'insert' | 'update' | 'delete'
  id?: string
  data?: Record<string, unknown>
}

/** Reasons the audit log distinguishes. Free text is allowed but keep to these where possible. */
export type RosterChangeReason = 'manual_edit' | 'trading' | 'recruitment' | 'post_battle' | 'advancement' | 'archive' | (string & {})

export async function updateRoster(warbandId: string, reason: RosterChangeReason, changes: RosterChange[]): Promise<number> {
  if (changes.length === 0) return 0
  const { data, error } = await supabase.rpc('update_roster', {
    p_warband_id: warbandId,
    p_reason: reason,
    p_changes: changes as unknown as Json,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function deleteWarband(id: string): Promise<void> {
  const { error } = await supabase.from('warbands').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export function useCreateWarband() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createWarband,
    onSuccess: () => qc.invalidateQueries({ queryKey: warbandKeys.all }),
  })
}

export function useUpdateRoster(warbandId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reason, changes }: { reason: RosterChangeReason; changes: RosterChange[] }) =>
      updateRoster(warbandId, reason, changes),
    onSuccess: () => qc.invalidateQueries({ queryKey: warbandKeys.all }),
  })
}

export function useDeleteWarband() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteWarband,
    onSuccess: () => qc.invalidateQueries({ queryKey: warbandKeys.all }),
  })
}
