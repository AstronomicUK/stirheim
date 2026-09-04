// Scenarios: the built-in library ships with the client (src/rules/data/campaign/scenarios.ts,
// full text lazily from scenarioDetails.ts); custom scenarios live in the `scenarios` table and
// are readable by every signed-in user, writable by their owner.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ScenarioRow } from '../domain'
import { supabase } from './supabase'

export const scenarioKeys = {
  all: ['scenarios'] as const,
  custom: ['scenarios', 'custom'] as const,
  one: (id: string | undefined) => ['scenarios', 'custom', id] as const,
}

export async function fetchCustomScenarios(): Promise<ScenarioRow[]> {
  const { data, error } = await supabase.from('scenarios').select('*').order('name')
  if (error) throw new Error(error.message)
  return data as ScenarioRow[]
}

export async function fetchCustomScenario(id: string): Promise<ScenarioRow> {
  const { data, error } = await supabase.from('scenarios').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('This scenario does not exist.')
  return data as ScenarioRow
}

export interface ScenarioInput {
  name: string
  setting?: string
  summary?: string
  rules_markdown?: string
  campaign_id?: string | null
}

export async function createScenario(input: ScenarioInput): Promise<string> {
  const { data, error } = await supabase
    .from('scenarios')
    .insert({
      name: input.name.trim(),
      setting: input.setting?.trim() || 'Custom',
      summary: input.summary ?? '',
      rules_markdown: input.rules_markdown ?? '',
      campaign_id: input.campaign_id ?? null,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

export async function updateScenario(id: string, input: Partial<ScenarioInput>): Promise<void> {
  const row: { name?: string; setting?: string; summary?: string; rules_markdown?: string; campaign_id?: string | null } = {}
  if (input.name !== undefined) row.name = input.name.trim()
  if (input.setting !== undefined) row.setting = input.setting.trim() || 'Custom'
  if (input.summary !== undefined) row.summary = input.summary
  if (input.rules_markdown !== undefined) row.rules_markdown = input.rules_markdown
  if (input.campaign_id !== undefined) row.campaign_id = input.campaign_id
  const { data, error } = await supabase.from('scenarios').update(row).eq('id', id).select('id')
  if (error) throw new Error(error.message)
  if (!data?.length) throw new Error('Only the scenario owner can edit it.')
}

export async function deleteScenario(id: string): Promise<void> {
  const { error } = await supabase.from('scenarios').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export function useCustomScenarios() {
  return useQuery({ queryKey: scenarioKeys.custom, queryFn: fetchCustomScenarios })
}

export function useCustomScenario(id: string | undefined) {
  return useQuery({ queryKey: scenarioKeys.one(id), queryFn: () => fetchCustomScenario(id!), enabled: Boolean(id) })
}

export function useCreateScenario() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createScenario, onSuccess: () => qc.invalidateQueries({ queryKey: scenarioKeys.all }) })
}

export function useUpdateScenario(id: string) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (input: Partial<ScenarioInput>) => updateScenario(id, input), onSuccess: () => qc.invalidateQueries({ queryKey: scenarioKeys.all }) })
}

export function useDeleteScenario() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteScenario, onSuccess: () => qc.invalidateQueries({ queryKey: scenarioKeys.all }) })
}
