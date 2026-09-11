import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { GmChecklistStepId } from '../features/onboarding/checklist'

export interface ChecklistState {
  status: 'open' | 'hidden' | 'complete'
  completed_steps: GmChecklistStepId[]
}
export function useGmChecklist(campaignId: string, userId: string | undefined) {
  const key = ['gmChecklist', userId, campaignId] as const
  const cache = useQueryClient()
  const query = useQuery({queryKey:key,enabled:!!userId,queryFn:async():Promise<ChecklistState> => {
    const {data,error}=await supabase.from('gm_checklists').select('status,completed_steps').eq('campaign_id',campaignId).eq('user_id',userId!).maybeSingle()
    if(error)throw error
    return data ? data as ChecklistState : {status:'open',completed_steps:[]}
  }})
  const save=useMutation({mutationFn:async(state:ChecklistState) => {
    if(!userId)throw new Error('Sign in to save your checklist.')
    const {data,error}=await supabase.from('gm_checklists').upsert({...state,campaign_id:campaignId,user_id:userId}).select('status,completed_steps').single()
    if(error)throw error
    return data as ChecklistState
  },onSuccess:state=>cache.setQueryData(key,state)})
  return {query,save}
}
