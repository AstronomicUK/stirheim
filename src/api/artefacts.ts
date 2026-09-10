import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase } from './supabase'
const ledgerEntry = z.object({roll:z.number().int().min(1).max(6),reportId:z.string().nullable(),warbandId:z.string().nullable(),warbandName:z.string(),foundAt:z.string()})
export type ArtefactDiscovery = z.infer<typeof ledgerEntry>
export function useCampaignArtefacts(campaignId: string) {
  return useQuery({queryKey:['campaign-artefacts',campaignId], queryFn:async () => {
    const {data,error} = await supabase.rpc('campaign_artefact_ledger',{p_campaign_id:campaignId})
    if (error) throw new Error(error.message)
    return z.array(ledgerEntry).parse(data)
  }})
}
