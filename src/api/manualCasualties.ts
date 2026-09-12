import {useMutation,useQueryClient} from '@tanstack/react-query'
import {supabase} from './supabase'
import {matchKeys} from './matches'
import {attackSummary,type AttackEventPayload} from '../domain/battleEvent'
import type {Json} from './database.types'

export const manualCasualtyToken=(matchId:string,warbandId:string,targetId:string,index:number)=>`casualty:${matchId}:${warbandId}:${targetId}:manual:${index}`

/** Metadata marks a casualty already counted on the manual sheet. It never adds another casualty. */
export function useManualCasualty(){
 const qc=useQueryClient()
 return useMutation({
  mutationFn:async(input:{matchId:string;warbandId:string;token:string;payload?:AttackEventPayload;reason?:string})=>{
   const result=input.payload
    ?await supabase.rpc('mark_casualty_event' as never,{p_match_id:input.matchId,p_actor_warband_id:input.warbandId,p_payload:input.payload as unknown as Json,p_summary:attackSummary(input.payload)} as never)
    :await supabase.rpc('unmark_casualty_event' as never,{p_match_id:input.matchId,p_token:input.token,p_note:input.reason??'Manual casualty attribution changed.'} as never)
   if(result.error)throw new Error(result.error.message)
   return result.data
  },
  onSuccess:(_result,input)=>qc.invalidateQueries({queryKey:matchKeys.events(input.matchId)}),
 })
}
