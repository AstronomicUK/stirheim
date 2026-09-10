import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { warbandKeys, type WarbandDetail } from './warbands'
import { diffRoster } from '../domain/rosterDiff'
import { eventAdvances } from '../rules/resolve/eventAdvances'
import type { RosterWarband } from '../rules/types/roster'
export function useRosterEvent(detail: WarbandDetail) {
 const cache=useQueryClient()
 return useMutation({mutationFn:async({next,reason}:{next:RosterWarband;reason:string})=>{
  const rpc=supabase.rpc as unknown as (name:string,args:Record<string,unknown>)=>Promise<{error:{message:string}|null}>
  const {error}=await rpc('resolve_roster_event',{
   p_warband_id:detail.warband.id,p_updated:detail.warband.updated_at,p_reason:reason,
   p_changes:diffRoster(detail,next),p_expected:{heroes:detail.heroes,henchman_groups:detail.groups,items:detail.items},p_advances:eventAdvances(detail.roster,next),
  })
  if(error)throw new Error(error.message)
 },onSuccess:()=>Promise.all([cache.invalidateQueries({queryKey:warbandKeys.all}),cache.invalidateQueries({queryKey:['advances']})])})
}
