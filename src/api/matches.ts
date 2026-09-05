// Matches: scheduling, challenges, lifecycle transitions and the live battle sheet. Transitions
// go through the SQL functions in supabase/migrations/20260904000006_match_functions.sql; reads
// are PostgREST selects under RLS; the sheet is kept live with Supabase Realtime.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { Json } from './database.types'
import type { HenchmanGroupRow, HeroRow, ItemRow, MatchOrigin, MatchRow, MatchState, WarbandRow } from '../domain'
import { parseBattleLiveState, toRosterWarband, type BattleLiveState } from '../domain'
import type { CombatMode } from '../domain/settings'
import type { RosterWarband } from '../rules/types/roster'
import { findWarbandTemplate } from '../rules/data/warbandTemplates'
import { warbandRating } from '../rules/resolve/rating'
import { campaignKeys } from './campaigns'
import { supabase } from './supabase'

export const matchKeys = {
  all: ['matches'] as const,
  forCampaign: (campaignId: string | undefined) => ['matches', 'campaign', campaignId] as const,
  one: (id: string | undefined) => ['matches', 'one', id] as const,
  sessions: (id: string | undefined) => ['matches', 'sessions', id] as const,
  roster: (matchId: string | undefined, warbandId: string | undefined) => ['matches', 'roster', matchId, warbandId] as const,
}

export interface MatchParticipantView {
  warband_id: string
  warband_name: string
  type_name: string
  owner_id: string
  owner_display_name: string
  rating: number
  accepted_at: string | null
  /** True when the signed-in user owns this warband. */
  mine: boolean
}

export interface MatchSummary {
  id: string
  campaign_id: string
  state: MatchState
  combat_mode: CombatMode
  created_via: MatchOrigin
  created_by: string
  created_by_display_name: string
  scenario_rules_id: string | null
  custom_scenario_id: string | null
  custom_scenario_name: string | null
  scheduled_for: string | null
  started_at: string | null
  completed_at: string | null
  notes: string
  created_at: string
  updated_at: string
  participants: MatchParticipantView[]
  /** Participants that have submitted a report (Phase 7). */
  reported_warband_ids: string[]
}

type MatchQueryRow = MatchRow & {
  profiles: { display_name: string } | null
  scenarios: { name: string } | null
  match_participants: {
    warband_id: string
    accepted_at: string | null
    warbands: (Pick<WarbandRow, 'id' | 'name' | 'type_rules_id' | 'owner_id'> & {
      profiles: { display_name: string } | null
      heroes: Pick<HeroRow, 'id' | 'status' | 'is_hired_sword' | 'xp' | 'is_large' | 'hired_sword_rules_id'>[]
      henchman_groups: Pick<HenchmanGroupRow, 'id' | 'size' | 'xp' | 'is_large'>[]
    }) | null
  }[]
  match_reports: { warband_id: string }[]
}

export const MATCH_SELECT =
  '*, profiles!matches_created_by_profile_fkey(display_name), scenarios(name), ' +
  'match_participants(warband_id, accepted_at, warbands(id, name, type_rules_id, owner_id, profiles!warbands_owner_profile_fkey(display_name), ' +
  'heroes(id, status, is_hired_sword, xp, is_large, hired_sword_rules_id), henchman_groups(id, size, xp, is_large))), ' +
  'match_reports(warband_id)'

function ratingOf(w: NonNullable<MatchQueryRow['match_participants'][number]['warbands']>): number {
  const template = findWarbandTemplate(w.type_rules_id)
  // Rating needs stats-free data only: counts, xp and large flags. Cast the partial rows into the
  // roster shape with placeholder stats.
  const stats = { M: 0, WS: 0, BS: 0, S: 0, T: 0, W: 0, I: 0, A: 0, Ld: 0 }
  const heroes = w.heroes.map((h) => ({
    id: h.id, warband_id: w.id, name: '', is_hired_sword: h.is_hired_sword, unit_type_rules_id: h.is_hired_sword ? null : 'x',
    hired_sword_rules_id: h.hired_sword_rules_id, stats, xp: h.xp, level_ups: 0, skill_tables: [], skills: [], spells: [], injuries: [],
    flags: {}, equipment_locked: false, is_large: h.is_large, status: h.status, notes: '', sort_order: 0, created_at: '', updated_at: '',
  })) as unknown as HeroRow[]
  const groups = w.henchman_groups.map((g) => ({
    id: g.id, warband_id: w.id, name: '', unit_type_rules_id: 'x', size: g.size, stats, xp: g.xp, level_ups: 0, stat_increases: {},
    is_large: g.is_large, notes: '', sort_order: 0, created_at: '', updated_at: '',
  })) as unknown as HenchmanGroupRow[]
  const warband = { id: w.id, owner_id: w.owner_id, name: w.name, type_rules_id: w.type_rules_id, gold: 0, wyrdstone: 0, veteran_pool: null, notes: '', archived: false, created_at: '', updated_at: '' } as WarbandRow
  return warbandRating(toRosterWarband(warband, heroes, groups, []), template).total
}

function toSummary(row: MatchQueryRow, userId: string | undefined): MatchSummary {
  return {
    id: row.id,
    campaign_id: row.campaign_id,
    state: row.state,
    combat_mode: row.combat_mode,
    created_via: row.created_via,
    created_by: row.created_by,
    created_by_display_name: row.profiles?.display_name ?? 'Someone',
    scenario_rules_id: row.scenario_rules_id,
    custom_scenario_id: row.custom_scenario_id,
    custom_scenario_name: row.scenarios?.name ?? null,
    scheduled_for: row.scheduled_for,
    started_at: row.started_at,
    completed_at: row.completed_at,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    participants: row.match_participants
      .filter((p) => p.warbands)
      .map((p) => {
        const w = p.warbands!
        return {
          warband_id: p.warband_id,
          warband_name: w.name,
          type_name: findWarbandTemplate(w.type_rules_id)?.name ?? w.type_rules_id,
          owner_id: w.owner_id,
          owner_display_name: w.profiles?.display_name ?? 'Player',
          rating: ratingOf(w),
          accepted_at: p.accepted_at,
          mine: w.owner_id === userId,
        }
      }),
    reported_warband_ids: row.match_reports.map((r) => r.warband_id),
  }
}

export async function fetchCampaignMatches(campaignId: string, userId: string | undefined): Promise<MatchSummary[]> {
  const { data, error } = await supabase.from('matches').select(MATCH_SELECT).eq('campaign_id', campaignId).order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as unknown as MatchQueryRow[]).map((r) => toSummary(r, userId))
}

export async function fetchMatch(id: string, userId: string | undefined): Promise<MatchSummary> {
  const { data, error } = await supabase.from('matches').select(MATCH_SELECT).eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('This match does not exist, or you are not in its campaign.')
  return toSummary(data as unknown as MatchQueryRow, userId)
}

export interface BattleSessionView {
  warband_id: string
  live_state: BattleLiveState
  updated_at: string
}

export async function fetchBattleSessions(matchId: string): Promise<BattleSessionView[]> {
  const { data, error } = await supabase.from('battle_sessions').select('warband_id, live_state, updated_at').eq('match_id', matchId)
  if (error) throw new Error(error.message)
  return data.map((s) => ({ warband_id: s.warband_id, live_state: parseBattleLiveState(s.live_state), updated_at: s.updated_at }))
}

/** Full roster of any participant (members may read each other's warbands). */
export async function fetchMatchRoster(warbandId: string): Promise<{ warband: WarbandRow; roster: RosterWarband; heroes: HeroRow[]; groups: HenchmanGroupRow[]; items: ItemRow[] }> {
  const [warband, heroes, groups, items] = await Promise.all([
    supabase.from('warbands').select('*').eq('id', warbandId).maybeSingle(),
    supabase.from('heroes').select('*').eq('warband_id', warbandId).order('sort_order'),
    supabase.from('henchman_groups').select('*').eq('warband_id', warbandId).order('sort_order'),
    supabase.from('items').select('*').eq('warband_id', warbandId),
  ])
  const err = warband.error ?? heroes.error ?? groups.error ?? items.error
  if (err) throw new Error(err.message)
  if (!warband.data) throw new Error('Warband not found.')
  const w = warband.data as WarbandRow
  const h = (heroes.data ?? []) as HeroRow[]
  const g = (groups.data ?? []) as HenchmanGroupRow[]
  const i = (items.data ?? []) as ItemRow[]
  return { warband: w, heroes: h, groups: g, items: i, roster: toRosterWarband(w, h, g, i) }
}

// ---- transitions ----

export interface ScheduleMatchInput {
  campaignId: string
  warbandIds: string[]
  scenarioRulesId?: string | null
  customScenarioId?: string | null
  scheduledFor?: string | null
  notes?: string
}

export async function scheduleMatch(input: ScheduleMatchInput): Promise<string> {
  const { data, error } = await supabase.rpc('schedule_match', {
    p_campaign_id: input.campaignId,
    p_warband_ids: input.warbandIds,
    p_scenario_rules_id: input.scenarioRulesId ?? undefined,
    p_custom_scenario_id: input.customScenarioId ?? undefined,
    p_scheduled_for: input.scheduledFor ?? undefined,
    p_notes: input.notes ?? '',
  })
  if (error) throw new Error(error.message)
  return data
}

export async function respondToChallenge(matchId: string, warbandId: string, accept: boolean): Promise<MatchState> {
  const { data, error } = await supabase.rpc('respond_to_challenge', { p_match_id: matchId, p_warband_id: warbandId, p_accept: accept })
  if (error) throw new Error(error.message)
  return data
}

export async function startMatch({ matchId, combatMode }: { matchId: string; combatMode?: CombatMode }): Promise<MatchState> {
  const { data, error } = await supabase.rpc('start_match', combatMode ? { p_match_id: matchId, p_combat_mode: combatMode } : { p_match_id: matchId })
  if (error) throw new Error(error.message)
  return data
}

export async function endMatch(matchId: string): Promise<MatchState> {
  const { data, error } = await supabase.rpc('end_match', { p_match_id: matchId })
  if (error) throw new Error(error.message)
  return data
}

export async function cancelMatch(matchId: string): Promise<MatchState> {
  const { data, error } = await supabase.rpc('cancel_match', { p_match_id: matchId })
  if (error) throw new Error(error.message)
  return data
}

export async function saveBattleSession(matchId: string, warbandId: string, state: BattleLiveState): Promise<string> {
  const { data, error } = await supabase.rpc('save_battle_session', { p_match_id: matchId, p_warband_id: warbandId, p_live_state: state as unknown as Json })
  if (error) throw new Error(error.message)
  return data
}

// ---- hooks ----

export function useCampaignMatches(campaignId: string | undefined, userId: string | undefined) {
  return useQuery({ queryKey: matchKeys.forCampaign(campaignId), queryFn: () => fetchCampaignMatches(campaignId!, userId), enabled: Boolean(campaignId) })
}

export function useMatch(id: string | undefined, userId: string | undefined) {
  return useQuery({ queryKey: matchKeys.one(id), queryFn: () => fetchMatch(id!, userId), enabled: Boolean(id) })
}

export function useBattleSessions(matchId: string | undefined) {
  return useQuery({ queryKey: matchKeys.sessions(matchId), queryFn: () => fetchBattleSessions(matchId!), enabled: Boolean(matchId) })
}

export function useMatchRoster(matchId: string | undefined, warbandId: string | undefined) {
  return useQuery({ queryKey: matchKeys.roster(matchId, warbandId), queryFn: () => fetchMatchRoster(warbandId!), enabled: Boolean(matchId && warbandId) })
}

/**
 * Keep the match and its battle sheets fresh while this component is mounted: subscribes to
 * Realtime changes on matches, match_participants and battle_sessions for one match and
 * invalidates the queries. RLS applies to the subscription as it does to reads.
 */
export function useMatchRealtime(matchId: string | undefined) {
  const qc = useQueryClient()
  useEffect(() => {
    if (!matchId) return
    const channel = supabase
      .channel(`match:${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'battle_sessions', filter: `match_id=eq.${matchId}` }, () => {
        void qc.invalidateQueries({ queryKey: matchKeys.sessions(matchId) })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` }, () => {
        void qc.invalidateQueries({ queryKey: matchKeys.one(matchId) })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_participants', filter: `match_id=eq.${matchId}` }, () => {
        void qc.invalidateQueries({ queryKey: matchKeys.one(matchId) })
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [matchId, qc])
}

function useInvalidateMatches() {
  const qc = useQueryClient()
  return () => Promise.all([qc.invalidateQueries({ queryKey: matchKeys.all }), qc.invalidateQueries({ queryKey: campaignKeys.all })])
}

export function useScheduleMatch() {
  const invalidate = useInvalidateMatches()
  return useMutation({ mutationFn: scheduleMatch, onSuccess: invalidate })
}

export function useRespondToChallenge() {
  const invalidate = useInvalidateMatches()
  return useMutation({
    mutationFn: ({ matchId, warbandId, accept }: { matchId: string; warbandId: string; accept: boolean }) => respondToChallenge(matchId, warbandId, accept),
    onSuccess: invalidate,
  })
}

export function useStartMatch() {
  const invalidate = useInvalidateMatches()
  return useMutation({ mutationFn: startMatch, onSuccess: invalidate })
}

export function useEndMatch() {
  const invalidate = useInvalidateMatches()
  return useMutation({ mutationFn: endMatch, onSuccess: invalidate })
}

export function useCancelMatch() {
  const invalidate = useInvalidateMatches()
  return useMutation({ mutationFn: cancelMatch, onSuccess: invalidate })
}

export function useSaveBattleSession(matchId: string, warbandId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (state: BattleLiveState) => saveBattleSession(matchId, warbandId, state),
    onSuccess: () => qc.invalidateQueries({ queryKey: matchKeys.sessions(matchId) }),
  })
}
