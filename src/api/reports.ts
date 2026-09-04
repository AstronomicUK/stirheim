// Post-battle reports: filing (submit_battle_report), withdrawing (GM), and the campaign's
// battle records with CSV export.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Json } from './database.types'
import { battleReportSchema, type BattleReport, type MatchOrigin, type MatchState } from '../domain'
import { findScenario } from '../rules/data/campaign/scenarios'
import { campaignKeys } from './campaigns'
import { matchKeys } from './matches'
import { supabase } from './supabase'
import { warbandKeys } from './warbands'

export const reportKeys = {
  all: ['reports'] as const,
  forCampaign: (campaignId: string | undefined) => ['reports', 'campaign', campaignId] as const,
  forMatch: (matchId: string | undefined) => ['reports', 'match', matchId] as const,
}

export async function submitBattleReport(matchId: string, warbandId: string, report: BattleReport): Promise<MatchState> {
  const parsed = battleReportSchema.parse(report)
  const { data, error } = await supabase.rpc('submit_battle_report', { p_match_id: matchId, p_warband_id: warbandId, p_report: parsed as unknown as Json })
  if (error) throw new Error(error.message)
  return data
}

export async function withdrawBattleReport(matchId: string, warbandId: string): Promise<MatchState> {
  const { data, error } = await supabase.rpc('withdraw_battle_report', { p_match_id: matchId, p_warband_id: warbandId })
  if (error) throw new Error(error.message)
  return data
}

export interface ReportView {
  id: string
  match_id: string
  warband_id: string
  warband_name: string
  submitted_by: string
  submitted_by_display_name: string
  submitted_at: string
  won: boolean
  result: 'won' | 'lost' | 'draw'
  routed: boolean
  xp_log: BattleReport['xp_log']
  ooa: BattleReport['ooa']
  injuries: BattleReport['injuries']
  exploration: BattleReport['exploration']
  veteran_pool_roll: number | null
  notes: string
}

/** One completed (or cancelled) match with whatever reports were filed. */
export interface BattleRecord {
  match_id: string
  state: MatchState
  /** 'import' marks history brought over from another tracker (Phase 9). */
  created_via: MatchOrigin
  scenario_title: string
  scheduled_for: string | null
  started_at: string | null
  completed_at: string | null
  participants: { warband_id: string; warband_name: string; owner_display_name: string }[]
  reports: ReportView[]
}

const REPORT_SELECT = '*, warbands(name), profiles!match_reports_submitted_by_profile_fkey(display_name)'

type ReportRow = {
  id: string; match_id: string; warband_id: string; submitted_by: string; submitted_at: string; won: boolean; result: string; routed: boolean
  xp_log: unknown; ooa: unknown; injuries: unknown; exploration: unknown; veteran_pool_roll: number | null; notes: string
  warbands: { name: string } | null; profiles: { display_name: string } | null
}

function toReportView(r: ReportRow): ReportView {
  const explorationParsed = battleReportSchema.shape.exploration.safeParse(r.exploration && Object.keys(r.exploration as object).length ? r.exploration : null)
  return {
    id: r.id,
    match_id: r.match_id,
    warband_id: r.warband_id,
    warband_name: r.warbands?.name ?? 'Warband',
    submitted_by: r.submitted_by,
    submitted_by_display_name: r.profiles?.display_name ?? 'Player',
    submitted_at: r.submitted_at,
    won: r.won,
    result: (r.result as ReportView['result']) ?? (r.won ? 'won' : 'lost'),
    routed: r.routed,
    xp_log: battleReportSchema.shape.xp_log.catch([]).parse(r.xp_log),
    ooa: battleReportSchema.shape.ooa.catch([]).parse(r.ooa),
    injuries: battleReportSchema.shape.injuries.catch([]).parse(r.injuries),
    exploration: explorationParsed.success ? explorationParsed.data : null,
    veteran_pool_roll: r.veteran_pool_roll,
    notes: r.notes,
  }
}

export async function fetchMatchReports(matchId: string): Promise<ReportView[]> {
  const { data, error } = await supabase.from('match_reports').select(REPORT_SELECT).eq('match_id', matchId).order('submitted_at')
  if (error) throw new Error(error.message)
  return (data as unknown as ReportRow[]).map(toReportView)
}

export async function fetchBattleRecords(campaignId: string): Promise<BattleRecord[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('id, state, created_via, scenario_rules_id, scheduled_for, started_at, completed_at, scenarios(name), match_participants(warband_id, warbands(name, profiles!warbands_owner_profile_fkey(display_name)))')
    .eq('campaign_id', campaignId)
    .in('state', ['completed', 'cancelled', 'awaiting_reports'])
    .order('completed_at', { ascending: false, nullsFirst: true })
  if (error) throw new Error(error.message)
  const matchIds = data.map((m) => m.id)
  const reports = matchIds.length
    ? await supabase.from('match_reports').select(REPORT_SELECT).in('match_id', matchIds).order('submitted_at')
    : { data: [], error: null }
  if (reports.error) throw new Error(reports.error.message)
  const byMatch = new Map<string, ReportView[]>()
  for (const r of (reports.data ?? []) as unknown as ReportRow[]) {
    const list = byMatch.get(r.match_id) ?? []
    list.push(toReportView(r))
    byMatch.set(r.match_id, list)
  }
  return data.map((m) => ({
    match_id: m.id,
    state: m.state,
    created_via: m.created_via,
    scenario_title: m.scenario_rules_id ? (findScenario(m.scenario_rules_id)?.title ?? m.scenario_rules_id) : (m.scenarios?.name ?? 'Decided at the table'),
    scheduled_for: m.scheduled_for,
    started_at: m.started_at,
    completed_at: m.completed_at,
    participants: m.match_participants.map((p) => ({
      warband_id: p.warband_id,
      warband_name: p.warbands?.name ?? 'Warband',
      owner_display_name: (p.warbands?.profiles as unknown as { display_name: string } | null)?.display_name ?? 'Player',
    })),
    reports: byMatch.get(m.id) ?? [],
  }))
}

// ---- hooks ----

export function useMatchReports(matchId: string | undefined) {
  return useQuery({ queryKey: reportKeys.forMatch(matchId), queryFn: () => fetchMatchReports(matchId!), enabled: Boolean(matchId) })
}

export function useBattleRecords(campaignId: string | undefined) {
  return useQuery({ queryKey: reportKeys.forCampaign(campaignId), queryFn: () => fetchBattleRecords(campaignId!), enabled: Boolean(campaignId) })
}

function useInvalidateAfterReport() {
  const qc = useQueryClient()
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: reportKeys.all }),
      qc.invalidateQueries({ queryKey: matchKeys.all }),
      qc.invalidateQueries({ queryKey: warbandKeys.all }),
      qc.invalidateQueries({ queryKey: campaignKeys.all }),
    ])
}

export function useSubmitBattleReport(matchId: string, warbandId: string) {
  const invalidate = useInvalidateAfterReport()
  return useMutation({ mutationFn: (report: BattleReport) => submitBattleReport(matchId, warbandId, report), onSuccess: invalidate })
}

export function useWithdrawBattleReport() {
  const invalidate = useInvalidateAfterReport()
  return useMutation({ mutationFn: ({ matchId, warbandId }: { matchId: string; warbandId: string }) => withdrawBattleReport(matchId, warbandId), onSuccess: invalidate })
}
