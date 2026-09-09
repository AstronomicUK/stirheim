import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase } from './supabase'
export const recoverySchema = z.object({ warbandId: z.string(), at: z.string(), round: z.number() })
export type Recovery = z.infer<typeof recoverySchema>
const turnSchema = z.object({
  match_id: z.string(), turn_order: z.array(z.string()), active_index: z.number(), round: z.number(),
  round_limit: z.number().nullable(), recovered: z.boolean(), finished: z.boolean(), revision: z.number(),
  recoveries: z.array(recoverySchema), updated_at: z.string(),
})
export type BattleTurns = z.infer<typeof turnSchema>
const key = (id: string) => ['battle-turns', id] as const
export function useBattleTurns(matchId: string) {
  const client = useQueryClient()
  useEffect(() => {
    const channel = supabase.channel(`turns:${matchId}:${Math.random()}`).on('postgres_changes',
      { event: '*', schema: 'public', table: 'battle_turns', filter: `match_id=eq.${matchId}` },
      () => { void client.invalidateQueries({ queryKey: key(matchId) }) }).subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [client, matchId])
  return useQuery({ queryKey: key(matchId), refetchInterval: 5000, queryFn: async () => {
    const { data, error } = await supabase.from('battle_turns').select('*').eq('match_id', matchId).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? turnSchema.parse(data) : null
  } })
}
export function useTurnAction(matchId: string) {
  const client = useQueryClient()
  return useMutation({ mutationFn: async (input: { action: 'start' | 'recover' | 'end' | 'extend'; revision: number; order?: string[]; limit?: number }) => {
    const { data, error } = await supabase.rpc('battle_turn_action', { p_match_id: matchId, p_action: input.action, p_revision: input.revision, p_order: input.order, p_limit: input.limit })
    if (error) throw new Error(error.message)
    return turnSchema.parse(data)
  }, onSuccess: data => { client.setQueryData(key(matchId), data) }, onError: () => { void client.invalidateQueries({ queryKey: key(matchId) }) } })
}
