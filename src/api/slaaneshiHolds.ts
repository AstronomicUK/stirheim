import type {SupabaseClient} from '@supabase/supabase-js'
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query'
import {z} from 'zod'
import {supabase} from './supabase'
import type {LockReleaseReason} from '../rules/resolve/slaaneshiLock'
const client=supabase as unknown as SupabaseClient
export const slaaneshiHoldSchema=z.object({id:z.string().uuid(),match_id:z.string().uuid(),source_event_id:z.string().uuid(),wielder_warband_id:z.string().uuid(),wielder_id:z.string().uuid(),target_warband_id:z.string().uuid(),target_id:z.string(),target_kind:z.enum(['hero','group']),target_model_index:z.number().int().nonnegative(),target_name:z.string(),created_at:z.string(),released_at:z.string().nullable(),release_reason:z.string().nullable(),confirmed_end_at:z.string().nullable()})
export type SlaaneshiHold=z.infer<typeof slaaneshiHoldSchema>
export const slaaneshiHoldKey=(matchId:string)=>['slaaneshi-holds',matchId] as const
export async function fetchSlaaneshiHolds(matchId:string):Promise<SlaaneshiHold[]>{
 const {data,error}=await client.from('slaaneshi_holds').select('*').eq('match_id',matchId).order('created_at')
 if(error)throw new Error(error.message)
 return z.array(slaaneshiHoldSchema).parse(data)
}
export function useSlaaneshiHolds(matchId:string|undefined){return useQuery({queryKey:slaaneshiHoldKey(matchId??''),enabled:!!matchId,refetchInterval:5000,queryFn:()=>fetchSlaaneshiHolds(matchId!)})}
export function useSlaaneshiHoldAction(matchId:string){
 const query=useQueryClient()
 return useMutation({mutationFn:async({id,action,reason=''}:{id:string;action:LockReleaseReason|'confirmEnd';reason?:string})=>{
  const {data,error}=await client.rpc('slaaneshi_hold_action',{p_hold_id:id,p_action:action,p_reason:reason})
  if(error)throw new Error(error.message)
  return slaaneshiHoldSchema.parse(data)
 },onSuccess:()=>query.invalidateQueries({queryKey:slaaneshiHoldKey(matchId)})})
}
