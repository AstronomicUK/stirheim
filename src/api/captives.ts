import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { warbandKeys, type WarbandDetail } from './warbands'
import { feedbackKeys } from './feedback'
import { reportKeys } from './reports'
import { diffRoster } from '../domain/rosterDiff'
import { eventAdvances } from '../rules/resolve/eventAdvances'
import type { RosterWarband } from '../rules/types/roster'
import type { CaptiveChoice } from '../rules/resolve/captives'

type Rpc = (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
const rpc = supabase.rpc as unknown as Rpc

/** The snapshot both captive RPCs check before writing: every row of both rosters with its updated_at. */
function expectedSnapshot(owner: WarbandDetail, captor: WarbandDetail) {
  return {
    warbands: [owner.warband, captor.warband].map(w => ({ id: w.id, updated_at: w.updated_at })),
    heroes: [...owner.heroes, ...captor.heroes],
    henchman_groups: [...owner.groups, ...captor.groups],
    items: [...owner.items, ...captor.items],
  }
}

/** Direct two-roster save for a caller who edits both warbands (legacy path, kept for captures without a case). */
export function useResolveCaptive() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: async (input: { owner: WarbandDetail; captor: WarbandDetail; nextOwner: RosterWarband; nextCaptor: RosterWarband; reason: string }) => {
    const { error } = await rpc('resolve_captive_rosters', {
      p_first: input.owner.warband.id, p_second: input.captor.warband.id,
      p_first_updated: input.owner.warband.updated_at, p_second_updated: input.captor.warband.updated_at,
      p_expected: { heroes: [...input.owner.heroes, ...input.captor.heroes], henchman_groups: [...input.owner.groups, ...input.captor.groups], items: [...input.owner.items, ...input.captor.items] },
      p_advances: [...eventAdvances(input.owner.roster, input.nextOwner), ...eventAdvances(input.captor.roster, input.nextCaptor)],
      p_reason: input.reason, p_first_changes: diffRoster(input.owner, input.nextOwner), p_second_changes: diffRoster(input.captor, input.nextCaptor),
    })
    if (error) throw new Error(error.message)
  }, onSuccess: () => Promise.all([cache.invalidateQueries({ queryKey: warbandKeys.all }), cache.invalidateQueries({ queryKey: ['advances'] }), cache.invalidateQueries({ queryKey: ['captives'] })]) })
}

export type CaptiveCaseState = 'unassigned' | 'open' | 'held' | 'resolved' | 'withdrawn'
export type CaptiveProposalState = 'proposed' | 'accepted' | 'rejected' | 'withdrawn' | 'stale' | 'reversed'
export interface CaptiveProposal {
  id: string
  case_id: string
  proposed_by_warband_id: string
  proposed_by: string
  choice: CaptiveChoice
  /** The server's own account of the roster changes it validated; this is what the other player accepts. */
  message: string
  /** The proposer's words (the resolver's preview), for colour only. */
  proposer_note: string
  state: CaptiveProposalState
  reason: string
  created_at: string
  resolved_at: string | null
}
export interface CaptiveCase {
  id: string
  report_id: string
  match_id: string
  victim_warband_id: string
  captor_warband_id: string | null
  hero_id: string
  hero_name: string
  state: CaptiveCaseState
  /** A captured Hero or hired sword, one lost or captured henchman model, or a captured equipment companion. */
  subject_kind: 'hero' | 'henchman' | 'companion'
  model_index: number
  /** Which rule opened the case: 'captured' (serious injury 61) or 'pirates_kidnapped'. */
  source: string
  model_snapshot: unknown | null
  recovery: unknown | null
  contest: unknown | null
  history: unknown[]
  created_at: string
  resolved_at: string | null
  resolution_kind: string | null
  resolution_message: string
  victim: { name: string } | null
  captor: { name: string } | null
  proposals: CaptiveProposal[]
}

const PROPOSAL_COLUMNS = 'id,case_id,proposed_by_warband_id,proposed_by,choice,message,proposer_note,state,reason,created_at,resolved_at'

/** Every captive case this warband is a party to (as victim or captor), newest first, with its proposals. */
export function useCaptiveCases(warbandId: string | undefined) {
  return useQuery({ queryKey: ['captives', warbandId], enabled: Boolean(warbandId), refetchInterval: 30_000, queryFn: async () => {
    const from = supabase.from as unknown as (table: string) => { select: (cols: string) => { or: (f: string) => { in: (col: string, v: string[]) => { order: (col: string, o: { ascending: boolean }) => Promise<{ data: unknown; error: { message: string } | null }> } } } }
    const { data, error } = await from('captive_cases')
      .select(`*,victim:warbands!captive_cases_victim_warband_id_fkey(name),captor:warbands!captive_cases_captor_warband_id_fkey(name),proposals:captive_proposals(${PROPOSAL_COLUMNS})`)
      .or(`victim_warband_id.eq.${warbandId},captor_warband_id.eq.${warbandId}`)
      .in('state', ['unassigned', 'open', 'held', 'resolved'])
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data as CaptiveCase[]).map(c => ({ ...c, proposals: [...c.proposals].sort((a, b) => b.created_at.localeCompare(a.created_at)) }))
  } })
}

function invalidateAll(cache: ReturnType<typeof useQueryClient>) {
  return Promise.all([cache.invalidateQueries({ queryKey: ['engines'] }), cache.invalidateQueries({ queryKey: ['enginePrisoners'] }), cache.invalidateQueries({ queryKey: warbandKeys.all }), cache.invalidateQueries({ queryKey: ['advances'] }), cache.invalidateQueries({ queryKey: ['captives'] }), cache.invalidateQueries({ queryKey: feedbackKeys.all }), cache.invalidateQueries({ queryKey: reportKeys.all })])
}

/** The victim's player (or GM) names the enemy warband holding the captive when the report did not settle it. */
export function useAssignCaptiveCaptor() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: async (input: { caseId: string; captorWarbandId: string; reason?: string }) => {
    const { error } = await rpc('assign_captive_captor', { p_case_id: input.caseId, p_captor_warband_id: input.captorWarbandId, p_reason: input.reason ?? '' })
    if (error) throw new Error(error.message)
  }, onSuccess: () => invalidateAll(cache) })
}

/**
 * One side proposes the exact outcome the resolver previewed. The server applies it at once when the
 * caller edits both warbands (or is the GM); otherwise the other side is asked to accept it.
 */
export function useProposeCaptiveOutcome() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: async (input: { caseId: string; choice: CaptiveChoice | Record<string, unknown>; owner: WarbandDetail; captor: WarbandDetail; nextOwner: RosterWarband; nextCaptor: RosterWarband; message: string }) => {
    const { data, error } = await rpc('propose_captive_outcome', {
      p_case_id: input.caseId, p_choice: input.choice, p_message: input.message,
      p_owner_changes: diffRoster(input.owner, input.nextOwner), p_captor_changes: diffRoster(input.captor, input.nextCaptor),
      p_advances: [...eventAdvances(input.owner.roster, input.nextOwner), ...eventAdvances(input.captor.roster, input.nextCaptor)],
      p_expected: expectedSnapshot(input.owner, input.captor),
    })
    if (error) throw new Error(error.message)
    return data as string
  }, onSuccess: () => invalidateAll(cache) })
}

/** The other side accepts (applies both roster changes) or rejects; the proposer withdraws. */
export function useRespondCaptiveProposal() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: async (input: { proposalId: string; action: 'accept' | 'reject' | 'withdraw'; reason?: string }) => {
    const { error } = await rpc('respond_captive_proposal', { p_proposal_id: input.proposalId, p_action: input.action, p_reason: input.reason ?? '' })
    if (error) throw new Error(error.message)
  }, onSuccess: () => invalidateAll(cache) })
}

/** Restore both rosters to just before a recorded outcome (GM or a player of both warbands); GM may release without restoring. */
export function useReverseCaptiveResolution() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: async (input: { caseId: string; reason: string; releaseOnly?: boolean }) => {
    const { error } = await rpc('reverse_captive_resolution', { p_case_id: input.caseId, p_reason: input.reason, p_release_only: input.releaseOnly ?? false })
    if (error) throw new Error(error.message)
  }, onSuccess: () => invalidateAll(cache) })
}
