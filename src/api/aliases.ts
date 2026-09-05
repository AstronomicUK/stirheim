// Per-campaign aliases: the name a player goes by inside one campaign. Read alongside anything
// that shows member names; written only through set_campaign_alias().

import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '../app/queryClient'
import { campaignKeys } from './campaigns'
import { matchKeys } from './matches'
import { reportKeys } from './reports'
import { supabase } from './supabase'

/** user_id -> alias for one campaign. */
export type AliasMap = Map<string, string>

export async function fetchCampaignAliases(campaignId: string): Promise<AliasMap> {
  const { data, error } = await supabase.from('campaign_aliases').select('user_id, alias').eq('campaign_id', campaignId)
  if (error) throw new Error(error.message)
  return new Map((data ?? []).map((r) => [r.user_id, r.alias]))
}

/** The alias when one is set, otherwise the account's display name. */
export function nameIn(aliases: AliasMap | undefined, userId: string | null | undefined, fallback: string): string {
  if (!userId || !aliases) return fallback
  return aliases.get(userId) ?? fallback
}

export async function setCampaignAlias(campaignId: string, userId: string, alias: string): Promise<void> {
  const { error } = await supabase.rpc('set_campaign_alias', { p_campaign_id: campaignId, p_user_id: userId, p_alias: alias })
  if (error) throw new Error(error.message)
}

export function useCampaignAliases(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['campaign-aliases', campaignId] as const,
    queryFn: () => fetchCampaignAliases(campaignId!),
    enabled: Boolean(campaignId),
  })
}

export function useSetCampaignAlias(campaignId: string) {
  return useMutation({
    mutationFn: ({ userId, alias }: { userId: string; alias: string }) => setCampaignAlias(campaignId, userId, alias),
    onSuccess: () => {
      // Every screen that shows a member's name re-reads it.
      void queryClient.invalidateQueries({ queryKey: ['campaign-aliases', campaignId] })
      void queryClient.invalidateQueries({ queryKey: campaignKeys.all })
      void queryClient.invalidateQueries({ queryKey: matchKeys.all })
      void queryClient.invalidateQueries({ queryKey: reportKeys.all })
    },
  })
}
