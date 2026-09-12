import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
export function useAwakeningOffers(warbandId: string) {
  return useQuery({ queryKey: ['awakening',warbandId], refetchInterval: 30_000, queryFn: async()=>{
    const {data,error}=await supabase.from('awakening_offers').select('*,recipient:warbands!awakening_offers_to_warband_id_fkey(name),source:warbands!awakening_offers_from_warband_id_fkey(name)').or(`from_warband_id.eq.${warbandId},to_warband_id.eq.${warbandId}`).in('state',['offered','accepted']).order('created_at',{ascending:false})
    if(error)throw new Error(error.message)
    return data
  } })
}
export type AwakeningOffer = NonNullable<ReturnType<typeof useAwakeningOffers>['data']>[number]
export function useResolveAwakening(){
 const cache=useQueryClient()
 return useMutation({mutationFn:async(input:{id:string;action:'accept'|'decline'|'reverse';reason:string})=>{
  const {data,error}=await supabase.rpc('resolve_awakening',{p_offer_id:input.id,p_action:input.action,p_reason:input.reason})
  if(error)throw new Error(error.message)
  return data
 },onSuccess:async()=>{await cache.invalidateQueries()}})
}
