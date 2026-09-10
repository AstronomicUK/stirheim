import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { warbandKeys, type WarbandDetail } from './warbands'
import { diffRoster } from '../domain/rosterDiff'
import { eventAdvances } from '../rules/resolve/eventAdvances'
import type { RosterWarband } from '../rules/types/roster'
export function useResolveCaptive() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: async (input: { owner: WarbandDetail; captor: WarbandDetail; nextOwner: RosterWarband; nextCaptor: RosterWarband; reason: string }) => {
    const rpc = supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
    const { error } = await rpc('resolve_captive_rosters', {
      p_first: input.owner.warband.id, p_second: input.captor.warband.id,
      p_first_updated: input.owner.warband.updated_at, p_second_updated: input.captor.warband.updated_at,
      p_expected: { heroes: [...input.owner.heroes, ...input.captor.heroes], henchman_groups: [...input.owner.groups, ...input.captor.groups], items: [...input.owner.items, ...input.captor.items] },
      p_advances: [...eventAdvances(input.owner.roster, input.nextOwner), ...eventAdvances(input.captor.roster, input.nextCaptor)],
      p_reason: input.reason, p_first_changes: diffRoster(input.owner, input.nextOwner), p_second_changes: diffRoster(input.captor, input.nextCaptor),
    })
    if (error) throw new Error(error.message)
  }, onSuccess: () => Promise.all([cache.invalidateQueries({ queryKey: warbandKeys.all }), cache.invalidateQueries({ queryKey: ['advances'] })]) })
}
