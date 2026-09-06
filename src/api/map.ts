// Map campaigns (Phase 19): the events the map state is derived from (battles fought in a district,
// with the results reported so far, plus the GM's adjustments), the GM's adjustment writes, and
// moving an open battle to another district.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MapEvent, MapResult } from '../rules/resolve/mapCampaign'
import { matchKeys } from './matches'
import { supabase } from './supabase'

export const mapKeys = {
  events: (campaignId: string | undefined) => ['map', 'events', campaignId] as const,
}

export interface MapAdjustmentRow {
  id: string
  campaign_id: string
  district_id: string
  warband_id: string
  kind: 'explored' | 'foothold'
  value: boolean
  reason: string
  actor_id: string
  actor_display_name: string
  at: string
}

export interface MapEvents {
  events: MapEvent[]
  adjustments: MapAdjustmentRow[]
}

interface MatchEventRow {
  id: string
  district_id: string | null
  state: string
  created_at: string
  started_at: string | null
  completed_at: string | null
  match_participants: { warband_id: string }[]
  match_reports: { warband_id: string; result: string; status: string }[]
}

/** Battles that count for the map: fought (in progress or later) in a district, not cancelled. */
export async function fetchMapEvents(campaignId: string): Promise<MapEvents> {
  const [matches, adjustments] = await Promise.all([
    supabase
      .from('matches')
      .select('id, district_id, state, created_at, started_at, completed_at, match_participants(warband_id), match_reports(warband_id, result, status)')
      .eq('campaign_id', campaignId)
      .not('district_id', 'is', null)
      .in('state', ['in_progress', 'awaiting_reports', 'completed'])
      .order('created_at'),
    supabase.from('map_adjustments').select('*, profiles!map_adjustments_actor_profile_fkey(display_name)').eq('campaign_id', campaignId).order('at'),
  ])
  if (matches.error) throw new Error(matches.error.message)
  if (adjustments.error) throw new Error(adjustments.error.message)
  const events: MapEvent[] = []
  for (const m of (matches.data ?? []) as unknown as MatchEventRow[]) {
    if (!m.district_id) continue
    const reports = new Map(m.match_reports.filter((r) => r.status !== 'returned').map((r) => [r.warband_id, r.result as MapResult]))
    events.push({
      kind: 'battle',
      at: m.completed_at ?? m.started_at ?? m.created_at,
      matchId: m.id,
      districtId: m.district_id,
      participants: m.match_participants.map((p) => ({ warbandId: p.warband_id, result: reports.get(p.warband_id) ?? null })),
    })
  }
  const rows: MapAdjustmentRow[] = (adjustments.data ?? []).map((r) => {
    const { profiles, ...row } = r as typeof r & { profiles: { display_name: string } | null }
    return { ...row, kind: row.kind as 'explored' | 'foothold', actor_display_name: profiles?.display_name ?? 'GM' }
  })
  for (const r of rows) events.push({ kind: 'adjust', at: r.at, districtId: r.district_id, warbandId: r.warband_id, field: r.kind, value: r.value, reason: r.reason })
  return { events, adjustments: rows }
}

export function useMapEvents(campaignId: string | undefined, enabled = true) {
  return useQuery({ queryKey: mapKeys.events(campaignId), queryFn: () => fetchMapEvents(campaignId!), enabled: Boolean(campaignId) && enabled })
}

export interface MapAdjustmentInput {
  campaignId: string
  districtId: string
  warbandId: string
  kind: 'explored' | 'foothold'
  value: boolean
  reason: string
  actorId: string
}

export async function addMapAdjustment(input: MapAdjustmentInput): Promise<void> {
  const { error } = await supabase.from('map_adjustments').insert({
    campaign_id: input.campaignId,
    district_id: input.districtId,
    warband_id: input.warbandId,
    kind: input.kind,
    value: input.value,
    reason: input.reason.trim(),
    actor_id: input.actorId,
  })
  if (error) throw new Error(error.message)
}

export function useAddMapAdjustment(campaignId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addMapAdjustment,
    onSuccess: () => void qc.invalidateQueries({ queryKey: mapKeys.events(campaignId) }),
  })
}

export async function setMatchDistrict(matchId: string, districtId: string | null): Promise<void> {
  const { error } = await supabase.rpc('set_match_district', { p_match_id: matchId, p_district_id: districtId ?? '' })
  if (error) throw new Error(error.message)
}

export function useSetMatchDistrict(matchId: string, campaignId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (districtId: string | null) => setMatchDistrict(matchId, districtId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: matchKeys.one(matchId) })
      void qc.invalidateQueries({ queryKey: matchKeys.forCampaign(campaignId) })
      void qc.invalidateQueries({ queryKey: mapKeys.events(campaignId) })
    },
  })
}
