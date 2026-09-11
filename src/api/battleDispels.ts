import {useEffect} from 'react'
import {useQuery,useQueryClient} from '@tanstack/react-query'
import {z} from 'zod'
import {supabase} from './supabase'
import type {Database} from './database.types'
const schema=z.object({id:z.string(),match_id:z.string(),source_hero_id:z.string(),source_name:z.string(),source_id:z.literal('staff_of_light'),round:z.number(),active_warband_id:z.string(),spell_name:z.string(),roll:z.number(),manual:z.boolean(),at:z.string()})
export type BattleDispel=z.infer<typeof schema>
export const dispelKey=(matchId:string)=>['battle-dispels',matchId] as const
export function useBattleDispels(matchId:string){
 const client=useQueryClient()
 useEffect(()=>{const c=supabase.channel(`dispels:${matchId}:${Math.random()}`).on('postgres_changes',{event:'*',schema:'public',table:'battle_dispels',filter:`match_id=eq.${matchId}`},()=>{void client.invalidateQueries({queryKey:dispelKey(matchId)})}).subscribe();return()=>{void supabase.removeChannel(c)}},[matchId,client])
 return useQuery({queryKey:dispelKey(matchId),refetchInterval:5000,queryFn:async()=>{const {data,error}=await supabase.from('battle_dispels').select('*').eq('match_id',matchId).order('at');if(error)throw new Error(error.message);return schema.array().parse(data)}})
}
export type StaffDispelInput=Database['public']['Functions']['record_staff_dispel']['Args']
export async function recordStaffDispel(input:StaffDispelInput){const {data,error}=await supabase.rpc('record_staff_dispel',input);if(error)throw new Error(error.message);return schema.parse(data)}
