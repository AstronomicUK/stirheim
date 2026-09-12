import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
export function useAwakeningOffers(warbandId: string) {
  return useQuery({ queryKey: ['awakening',warbandId], refetchInterval: 30_000, queryFn: async()=>{
    const {data,error}=await supabase.from('awakening_offers').select('*,recipient:warbands!awakening_offers_to_warband_id_fkey(name),source:warbands!awakening_offers_from_warband_id_fkey(name)').or(`from_warband_id.eq.${warbandId},to_warband_id.eq.${warbandId}`).in('state',['offered','accepted']).order('created_at',{ascending:false})
    if(error)throw new Error(error.message)
    return (data??[]) as Array<NonNullable<typeof data>[number]&{allocation_required:boolean;agreed_recipient_warband_id:string|null;allocation_reason:string;allocation_at:string|null}>
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

export function useAgreeAwakeningRecipient(){
 const cache=useQueryClient()
 return useMutation({mutationFn:async(input:{offerId:string})=>{
  const rpc=supabase.rpc as unknown as (name:string,args:Record<string,unknown>)=>Promise<{error:{message:string}|null}>
  const {error}=await rpc('agree_awakening_recipient',{p_offer_id:input.offerId,p_reason:''})
  if(error)throw new Error(error.message)
 },onSuccess:async()=>{await cache.invalidateQueries()}})
}
