import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { warbandKeys } from './warbands'
import { enginePrisonerKeys } from './engineCustody'
import type { RosterWarband } from '../rules/types/roster'
import { eventAdvances } from '../rules/resolve/eventAdvances'
import { hashutRewardPlan, resolveHashutReward, type HashutRewardPlan } from '../rules/resolve/engineOfChaos'

/**
 * Hashut's Reward journeys (migration 105). The holder dispatches one Engine with one escort Hero
 * and chosen held prisoners. Anonymous prisoners travel at departure; each named prisoner's player
 * answers an ordinary captive proposal of kind 'dispatch' (useRespondCaptiveProposal). The journey
 * departs on its own once every consent is decided; the Engine is 'away' and the escort carries the
 * roster's sits-out flag. Return needs a completed battle that began after departure (the server
 * decides readiness, never the calendar); the reward is applied once, with the player's dice and the
 * app's dice recorded separately and pending advances queued at real threshold boxes.
 */
export type EngineJourneyState = 'pending' | 'away' | 'returned' | 'cancelled'
export interface EngineJourneyPlan { recipient: 'leader' | 'heroes'; fixedXp: number; d3Count: number; d6GoldCount: number; label: string }
export interface EngineJourneyRow {
  id: string
  engine_id: string
  warband_id: string
  escort_hero_id: string | null
  escort_name: string
  state: EngineJourneyState
  prisoner_ids: string[]
  after_match_id: string | null
  /** Actual captives sent (never places); 0 until departure. */
  captive_count: number
  plan: EngineJourneyPlan | Record<string, never>
  dispatched_by: string | null
  dispatched_at: string
  departed_at: string | null
  missed_match_id: string | null
  returned_at: string | null
  returned_by: string | null
  reward: { d3?: number[]; appD3?: number[] | null; d6?: number | null; appD6?: number | null; xpTotal?: number; gold?: number; allocations?: { heroId: string; xp: number; name?: string }[]; leaderId?: string | null }
  advance_ids: string[]
  history: { event: string; at: string; by?: string | null; reason?: string; captives?: number; escort?: string; escort_flag_set?: boolean; missed_match_id?: string }[]
}
/** One row of engine_journeys_for_warband: the journey plus the server's readiness verdict. */
export interface EngineJourneyStatus {
  journey: EngineJourneyRow
  missed_match_id: string | null
  missed_match_label: string | null
  /** True only while the journey is away and the warband has a completed battle that began after departure. */
  ready_to_return: boolean
  /** The holder's current leader (for the 1–3 captive reward), only on the holder's own away journeys. */
  leader_id: string | null
}

const client = supabase as unknown as SupabaseClient
export const engineJourneyKeys = { all: ['engineJourneys'] as const, forWarband: (id: string | undefined) => ['engineJourneys', id] as const }

export async function fetchEngineJourneys(warbandId: string): Promise<EngineJourneyStatus[]> {
  const { data, error } = await client.rpc('engine_journeys_for_warband', { p_warband_id: warbandId })
  if (error) throw new Error(error.message)
  return (data ?? []) as EngineJourneyStatus[]
}
export function useEngineJourneys(warbandId: string | undefined) {
  return useQuery({ queryKey: engineJourneyKeys.forWarband(warbandId), enabled: Boolean(warbandId), refetchInterval: 30_000, queryFn: () => fetchEngineJourneys(warbandId!) })
}

function invalidateJourneys(cache: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    cache.invalidateQueries({ queryKey: ['engines'] }),
    cache.invalidateQueries({ queryKey: engineJourneyKeys.all }),
    cache.invalidateQueries({ queryKey: enginePrisonerKeys.all }),
    cache.invalidateQueries({ queryKey: ['captives'] }),
    cache.invalidateQueries({ queryKey: ['advances'] }),
    cache.invalidateQueries({ queryKey: warbandKeys.all }),
  ])
}

export interface DispatchEngineInput { engineId: string; escortHeroId: string; prisonerIds: string[]; expectedUpdatedAt: string }
export interface DispatchEngineResult { journeyId: string; proposalIds: string[]; departed: boolean }
export function useDispatchEngine() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: async (input: DispatchEngineInput): Promise<DispatchEngineResult> => {
    const { data, error } = await client.rpc('dispatch_engine', { p_engine_id: input.engineId, p_escort_hero_id: input.escortHeroId, p_prisoner_ids: input.prisonerIds, p_expected_updated_at: input.expectedUpdatedAt })
    if (error) throw new Error(error.message)
    return data as DispatchEngineResult
  }, onSuccess: () => invalidateJourneys(cache) })
}

/** Only before any captive's player has agreed; afterwards use useFinishEngineJourney. */
export function useCancelEngineJourney() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: async (input: { journeyId: string; reason: string }) => {
    const { error } = await client.rpc('cancel_engine_journey', { p_journey_id: input.journeyId, p_reason: input.reason })
    if (error) throw new Error(error.message)
  }, onSuccess: () => invalidateJourneys(cache) })
}

/** Depart with the captives already agreed; undecided proposals are withdrawn and those captives stay held. */
export function useFinishEngineJourney() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: async (input: { journeyId: string; reason?: string }): Promise<{ journeyId: string; departed: boolean; captiveCount: number }> => {
    const { data, error } = await client.rpc('finish_engine_journey', { p_journey_id: input.journeyId, ...(input.reason ? { p_reason: input.reason } : {}) })
    if (error) throw new Error(error.message)
    return data as { journeyId: string; departed: boolean; captiveCount: number }
  }, onSuccess: () => invalidateJourneys(cache) })
}

/** GM only, while the journey is away: the Engine comes back, the captives are held again and their cases reopen as held. */
export function useReverseEngineJourney() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: async (input: { journeyId: string; reason: string }) => {
    const { error } = await client.rpc('reverse_engine_journey', { p_journey_id: input.journeyId, p_reason: input.reason })
    if (error) throw new Error(error.message)
  }, onSuccess: () => invalidateJourneys(cache) })
}

export interface HashutReturnInput {
  journey: EngineJourneyRow
  /** The holder's roster as it stands (for the advance boxes the award crosses). */
  roster: RosterWarband
  /** The player's D3 results (plan.d3Count of them) and, when the app rolled them first, those too. */
  d3: number[]
  appD3?: number[] | null
  /** Only with six captives. */
  d6?: number | null
  appD6?: number | null
  /** Who receives the experience. For 1–3 captives this must be the current leader alone (leaderId). */
  allocations: { heroId: string; xp: number }[]
  leaderId?: string | null
}
export interface HashutReturnPayload {
  reward: { d3: number[]; appD3: number[] | null; d6: number | null; appD6: number | null; allocations: { heroId: string; xp: number }[]; leaderId: string | null }
  advances: { warband_id: string; subject_type: string; subject_id: string; threshold_xp: number }[]
  xpTotal: number
  gold: number
}

/** Pure builder: validates the dice against the plan and lists the advances the award crosses; the server re-checks all of it. */
export function buildHashutReturn(input: HashutReturnInput): HashutReturnPayload {
  const { journey, roster } = input
  if (journey.state !== 'away') throw new Error('This journey is not away.')
  const plan = hashutRewardPlan(Array.from({ length: journey.captive_count }, (_, i) => ({ id: `captive-${i}`, large: false }))) satisfies HashutRewardPlan
  const outcome = resolveHashutReward(plan, input.d3, plan.d6GoldCount ? input.d6 ?? undefined : undefined)
  const total = input.allocations.reduce((sum, a) => sum + a.xp, 0)
  if (!input.allocations.length || input.allocations.some(a => !Number.isInteger(a.xp) || a.xp < 1)) throw new Error('Say which Heroes receive the experience.')
  // The same checks the server makes on recipients, so the preview never disagrees with it.
  if (new Set(input.allocations.map(a => a.heroId)).size !== input.allocations.length) throw new Error('A Hero is listed twice in the allocation.')
  for (const a of input.allocations) {
    const h = roster.heroes.find(x => x.id === a.heroId)
    if (!h || h.status !== 'active') throw new Error('Experience goes to this warband’s own active Heroes.')
  }
  if (total !== outcome.xp) throw new Error(`The allocation must share exactly ${outcome.xp} experience (it shares ${total}).`)
  if (plan.xpRecipient === 'leader' && (input.allocations.length !== 1 || !input.leaderId || input.allocations[0].heroId !== input.leaderId)) throw new Error('With three captives or fewer the +1 Experience goes to the warband leader alone.')
  const next: RosterWarband = { ...roster, heroes: roster.heroes.map(h => { const a = input.allocations.find(x => x.heroId === h.id); return a ? { ...h, xp: h.xp + a.xp } : h }) }
  return {
    reward: { d3: input.d3, appD3: input.appD3 ?? null, d6: plan.d6GoldCount ? input.d6 ?? null : null, appD6: plan.d6GoldCount ? input.appD6 ?? null : null, allocations: input.allocations, leaderId: input.leaderId ?? null },
    advances: eventAdvances(roster, next),
    xpTotal: outcome.xp, gold: outcome.gold,
  }
}

export function useReturnEngine() {
  const cache = useQueryClient()
  return useMutation({ mutationFn: async (input: { journeyId: string; payload: HashutReturnPayload }) => {
    const { error } = await client.rpc('return_engine', { p_journey_id: input.journeyId, p_reward: input.payload.reward, p_advances: input.payload.advances })
    if (error) throw new Error(error.message)
  }, onSuccess: () => invalidateJourneys(cache) })
}
