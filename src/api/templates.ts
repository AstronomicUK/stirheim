// Saved warband templates (see rules/resolve/warbandTemplates for the payload).

import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '../app/queryClient'
import type { WarbandTemplatePayload } from '../rules/resolve/warbandTemplates'
import type { Json } from './database.types'
import { supabase } from './supabase'

export interface SavedTemplate {
  id: string
  owner_id: string
  name: string
  type_rules_id: string
  payload: WarbandTemplatePayload
  campaign_id: string | null
  created_at: string
}

export async function fetchMyTemplates(): Promise<SavedTemplate[]> {
  const { data, error } = await supabase.from('warband_templates').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({ ...row, payload: row.payload as unknown as WarbandTemplatePayload }))
}

export async function saveTemplate(input: { ownerId: string; name: string; typeRulesId: string; payload: WarbandTemplatePayload }): Promise<string> {
  const { data, error } = await supabase
    .from('warband_templates')
    .insert({ owner_id: input.ownerId, name: input.name, type_rules_id: input.typeRulesId, payload: input.payload as unknown as Json })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

/** Share a template with one campaign (its members can start warbands from it), or make it private again with null. */
export async function shareTemplate(id: string, campaignId: string | null): Promise<void> {
  const { error } = await supabase.from('warband_templates').update({ campaign_id: campaignId }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('warband_templates').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export function useMyTemplates(enabled = true) {
  return useQuery({ queryKey: ['warband-templates'] as const, queryFn: fetchMyTemplates, enabled })
}

export function useSaveTemplate() {
  return useMutation({
    mutationFn: saveTemplate,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['warband-templates'] }),
  })
}

export function useShareTemplate() {
  return useMutation({
    mutationFn: ({ id, campaignId }: { id: string; campaignId: string | null }) => shareTemplate(id, campaignId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['warband-templates'] }),
  })
}

export function useDeleteTemplate() {
  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['warband-templates'] }),
  })
}
