// Advancements: the pending_advances a post-battle report created, and resolving one through the
// resolve_pending_advance SQL function (supabase/migrations/20260904000008_advances_trading.sql),
// which applies the roster changes the advance produced and closes the row in one transaction.
//
// The screen runs the Phase 2 resolvers on the loaded roster, then `diffRoster(rows, next)` from
// src/domain turns the result into the `changes` passed here. `resolution` is the narrative kept
// on the row (what was rolled and chosen); its shape belongs to the advances screen.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Json } from './database.types'
import { pendingAdvanceRowSchema, type PendingAdvanceRow, type RosterChange } from '../domain'
import { supabase } from './supabase'
import { warbandKeys } from './warbands'

export type { PendingAdvanceRow }

export const advanceKeys = {
  all: ['advances'] as const,
  pending: (warbandId: string | undefined) => ['advances', 'pending', warbandId] as const,
  history: (warbandId: string | undefined) => ['advances', 'history', warbandId] as const,
}

/** Advances still to be rolled for, oldest first. */
export async function fetchPendingAdvances(warbandId: string): Promise<PendingAdvanceRow[]> {
  const { data, error } = await supabase
    .from('pending_advances')
    .select('*')
    .eq('warband_id', warbandId)
    .is('resolved_at', null)
    .order('created_at')
  if (error) throw new Error(error.message)
  return pendingAdvanceRowSchema.array().parse(data)
}

/** Advances already taken, newest first. */
export async function fetchAdvanceHistory(warbandId: string, limit = 50): Promise<PendingAdvanceRow[]> {
  const { data, error } = await supabase
    .from('pending_advances')
    .select('*')
    .eq('warband_id', warbandId)
    .not('resolved_at', 'is', null)
    .order('resolved_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return pendingAdvanceRowSchema.array().parse(data)
}

export interface ResolveAdvanceInput {
  advanceId: string
  /** What was rolled and chosen, stored on the row for the record. */
  resolution: Record<string, unknown>
  /** From diffRoster(rows, next); applied with audit reason 'advancement'. */
  changes: RosterChange[]
}

/** Returns the number of roster changes applied. */
export async function resolvePendingAdvance({ advanceId, resolution, changes }: ResolveAdvanceInput): Promise<number> {
  const { data, error } = await supabase.rpc('resolve_pending_advance', {
    p_advance_id: advanceId,
    p_resolution: resolution as Json,
    p_changes: changes as unknown as Json,
  })
  if (error) throw new Error(error.message)
  return data
}

// ---- hooks ----

export function usePendingAdvances(warbandId: string | undefined) {
  return useQuery({ queryKey: advanceKeys.pending(warbandId), queryFn: () => fetchPendingAdvances(warbandId!), enabled: Boolean(warbandId) })
}

export function useAdvanceHistory(warbandId: string | undefined) {
  return useQuery({ queryKey: advanceKeys.history(warbandId), queryFn: () => fetchAdvanceHistory(warbandId!), enabled: Boolean(warbandId) })
}

export function useResolveAdvance(warbandId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: resolvePendingAdvance,
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: warbandKeys.one(warbandId) }),
        qc.invalidateQueries({ queryKey: warbandKeys.all }),
        qc.invalidateQueries({ queryKey: advanceKeys.all }),
      ]),
  })
}
