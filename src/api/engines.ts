import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { warbandKeys } from './warbands'

export interface EngineInventoryRow {
  id: string
  warband_id: string
  inventory_item_id: string | null
  stock_index: number
  name: string
  state: 'present' | 'away' | 'retired'
  history: { count?: number; event: string; at: string; by?: string | null; from?: string; to?: string; name?: string; reason?: string; places?: number }[]
  created_at: string
  updated_at: string
}

const client = supabase as unknown as SupabaseClient
export async function fetchEngines(warbandId: string): Promise<EngineInventoryRow[]> {
  const { data, error } = await client.from('engine_of_chaos_units').select('*').eq('warband_id', warbandId).neq('state', 'retired').order('created_at').order('id')
  if (error) throw new Error(error.message)
  return data as EngineInventoryRow[]
}
export function useEngines(warbandId: string | undefined) {
  return useQuery({ queryKey: ['engines', warbandId], enabled: Boolean(warbandId), refetchInterval: 30_000, queryFn: async () => {
    return fetchEngines(warbandId!)
  } })
}

export function useRenameEngine() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: async (input: { engine: EngineInventoryRow; name: string }) => {
    const { error } = await client.rpc('rename_engine', { p_engine_id: input.engine.id, p_name: input.name, p_expected_updated_at: input.engine.updated_at })
    if (error) throw new Error(error.message)
  }, onSuccess: () => cache.invalidateQueries({ queryKey: ['engines'] }) })
}

export function useRemoveEngineCopy() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: async (input: { engine: EngineInventoryRow; reason: string }) => {
    const { error } = await client.rpc('remove_engine_copy', { p_engine_id: input.engine.id, p_reason: input.reason, p_expected_updated_at: input.engine.updated_at })
    if (error) throw new Error(error.message)
  }, onSuccess: () => Promise.all([cache.invalidateQueries({ queryKey: ['engines'] }), cache.invalidateQueries({ queryKey: warbandKeys.all })]) })
}
