import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query'
import type {SupabaseClient} from '@supabase/supabase-js'
import {supabase} from './supabase'
import type {EngineRescueAction,EngineRescueState} from '../rules/resolve/engineRescue'
const client=supabase as unknown as SupabaseClient
export interface EngineRescueRecord {id:string;match_id:string;engine_id:string;revision:number;state:EngineRescueState;history:{note?:string;at:string;action?:EngineRescueAction}[]}
const key=(matchId:string)=>['engineRescue',matchId] as const
export function useEngineRescues(matchId:string){return useQuery({queryKey:key(matchId),refetchInterval:5000,queryFn:async()=>{const {data,error}=await client.from('engine_rescue_battles').select('*').eq('match_id',matchId).order('created_at');if(error)throw Error(error.message);return data as EngineRescueRecord[]}})}
export function useStartEngineRescue(matchId:string){const cache=useQueryClient();return useMutation({mutationFn:async(engineId:string)=>{const {data,error}=await client.rpc('start_engine_rescue',{p_match_id:matchId,p_engine_id:engineId});if(error)throw Error(error.message);return data as EngineRescueRecord},onSuccess:()=>cache.invalidateQueries({queryKey:key(matchId)})})}
export function useEngineRescueAction(matchId:string){const cache=useQueryClient();return useMutation({mutationFn:async({record,action,note}:{record:EngineRescueRecord;action:EngineRescueAction;note:string})=>{const {data,error}=await client.rpc('record_engine_rescue_action',{p_rescue_id:record.id,p_revision:record.revision,p_action:action,p_note:note});if(error)throw Error(error.message);return data as EngineRescueRecord},onSuccess:()=>cache.invalidateQueries({queryKey:key(matchId)})})}
