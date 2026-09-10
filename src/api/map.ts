import { gatheringControl, type GatheringReward } from '../rules/resolve/gatheringControl'
// Map campaigns (Phase 19): the events the map state is derived from (battles fought in a district,
// with the results reported so far, plus the GM's adjustments), the GM's adjustment writes, and
// moving an open battle to another district.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MapEvent, MapResult } from '../rules/resolve/mapCampaign'
import { matchKeys } from './matches'
import { supabase } from './supabase'

export const mapKeys = {
  events: (campaignId: string | undefined) => ['map', 'events', campaignId] as const,
  tolls: (matchId: string | undefined) => ['map', 'tolls', matchId] as const,
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
  warnings?: string[]
  events: MapEvent[]
  adjustments: MapAdjustmentRow[]
}

interface MatchEventRow {
  id: string
  district_id: string | null
  scenario_rules_id: string | null
  state: string
  created_at: string
  started_at: string | null
  completed_at: string | null
  match_participants: { warband_id: string }[]
  match_reports: { warband_id: string; result: string; status: string; applied: {gathering_control?:GatheringReward} | null }[]
}

/** Battles that count for the map: fought (in progress or later) in a district, not cancelled. */
export async function fetchMapEvents(campaignId: string): Promise<MapEvents> {
  const [matches, adjustments] = await Promise.all([
    supabase
      .from('matches')
      .select('id, district_id, scenario_rules_id, state, created_at, started_at, completed_at, match_participants(warband_id), match_reports(warband_id, result, status, applied)')
      .eq('campaign_id', campaignId)
      .in('state', ['in_progress', 'awaiting_reports', 'completed'])
      .order('created_at'),
    supabase.from('map_adjustments').select('*, profiles!map_adjustments_actor_profile_fkey(display_name)').eq('campaign_id', campaignId).order('at'),
  ])
  if (matches.error) throw new Error(matches.error.message)
  if (adjustments.error) throw new Error(adjustments.error.message)
  const events: MapEvent[] = []
  const warnings: string[] = []
  for (const m of (matches.data ?? []) as unknown as MatchEventRow[]) {
    if(m.scenario_rules_id==='gathering_of_the_horde'){
      const control=gatheringControl(m.match_participants.map(p=>p.warband_id),m.match_reports.map(r=>({warbandId:r.warband_id,result:r.result,status:r.status,reward:r.applied?.gathering_control})))
      if(control.warning)warnings.push(control.warning)
      if(control.controller)events.push({kind:'battle',at:m.completed_at??m.started_at??m.created_at,matchId:m.id,districtId:'executioners-square',participants:[],scenarioId:m.scenario_rules_id,claimControl:control.controller})
    }
    if (!m.district_id) continue
    const reports = new Map(m.match_reports.filter((r) => r.status !== 'returned').map((r) => [r.warband_id, r.result as MapResult]))
    events.push({
      kind: 'battle',
      at: m.completed_at ?? m.started_at ?? m.created_at,
      matchId: m.id,
      districtId: m.district_id,
      participants: m.match_participants.map((p) => ({ warbandId: p.warband_id, result: reports.get(p.warband_id) ?? null })),
      scenarioId: m.scenario_rules_id,
    })
  }
  const rows: MapAdjustmentRow[] = (adjustments.data ?? []).map((r) => {
    const { profiles, ...row } = r as typeof r & { profiles: { display_name: string } | null }
    return { ...row, kind: row.kind as 'explored' | 'foothold', actor_display_name: profiles?.display_name ?? 'GM' }
  })
  for (const r of rows) events.push({ kind: 'adjust', at: r.at, districtId: r.district_id, warbandId: r.warband_id, field: r.kind, value: r.value, reason: r.reason })
  events.sort((a,b)=>a.at.localeCompare(b.at)||Number(a.kind==='battle'&&!!a.claimControl)-Number(b.kind==='battle'&&!!b.claimControl))
  return { events, adjustments: rows, warnings: [...new Set(warnings)] }
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

// ---- Tolls ----

export interface MapTollRow {
  id: string
  match_id: string
  warband_id: string
  kind: 'gate' | 'bridge'
  amount: number
  to_warband_id: string | null
  note: string
  actor_id: string
  paid_at: string
}

export async function fetchMatchTolls(matchId: string): Promise<MapTollRow[]> {
  const { data, error } = await supabase.from('map_tolls').select('*').eq('match_id', matchId).order('paid_at')
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({ ...r, kind: r.kind as 'gate' | 'bridge' }))
}

export function useMatchTolls(matchId: string | undefined, enabled = true) {
  return useQuery({ queryKey: mapKeys.tolls(matchId), queryFn: () => fetchMatchTolls(matchId!), enabled: Boolean(matchId) && enabled })
}

export interface PayTollInput {
  matchId: string
  warbandId: string
  kind: 'gate' | 'bridge'
  amount: number
  toWarbandId: string | null
  note: string
}

/** Pay a map toll from the warband's treasury (to the bridge's controller when there is one); recorded on the match. */
export async function payMapToll(input: PayTollInput): Promise<void> {
  const { error } = await supabase.rpc('pay_map_toll', {
    p_match_id: input.matchId,
    p_warband_id: input.warbandId,
    p_kind: input.kind,
    p_amount: input.amount,
    p_to_warband_id: input.toWarbandId ?? undefined,
    p_note: input.note,
  })
  if (error) throw new Error(error.message)
}

export function usePayMapToll(matchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: payMapToll,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mapKeys.tolls(matchId) })
      void qc.invalidateQueries({ queryKey: ['warbands'] })
      void qc.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}
