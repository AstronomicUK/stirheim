import {useEffect} from 'react'
import {useQuery,useQueryClient} from '@tanstack/react-query'
import {z} from 'zod'
import {supabase} from './supabase'
import type {Database} from './database.types'
const schema=z.object({id:z.string(),match_id:z.string(),warband_id:z.string(),merchant_id:z.string(),merchant_name:z.string(),non_heroes:z.number(),amount:z.number(),round:z.number(),at:z.string()})
export type BattleBribe=z.infer<typeof schema>
export const bribeKey=(matchId:string)=>['battle-bribes',matchId] as const
export function useBattleBribes(matchId:string){
 const client=useQueryClient()
 useEffect(()=>{const c=supabase.channel(`bribes:${matchId}:${Math.random()}`).on('postgres_changes',{event:'*',schema:'public',table:'battle_bribes',filter:`match_id=eq.${matchId}`},()=>{void client.invalidateQueries({queryKey:bribeKey(matchId)});void client.invalidateQueries({queryKey:['matches','roster',matchId]});void client.invalidateQueries({queryKey:['warbands']})}).subscribe();return()=>{void supabase.removeChannel(c)}},[matchId,client])
 return useQuery({queryKey:bribeKey(matchId),refetchInterval:5000,queryFn:async()=>{const {data,error}=await supabase.from('battle_bribes').select('*').eq('match_id',matchId).order('at');if(error)throw new Error(error.message);return schema.array().parse(data)}})
}
export type BriberyPayment=Database['public']['Functions']['pay_merchant_bribery']['Args']
export async function payBribery(input:BriberyPayment){const {data,error}=await supabase.rpc('pay_merchant_bribery',input);if(error)throw new Error(error.message);return schema.parse(data)}
