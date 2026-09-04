// Trading post: the campaign a warband trades under (for house rules such as half-price armour),
// the post-battle "phase" it is in (its latest match report), the once-per-phase bookkeeping in
// trade_phase_state, and the record_trade SQL function that applies a visit atomically
// (supabase/migrations/20260904000008_advances_trading.sql).
//
// The phase is keyed by the warband's latest match report. A warband with no report yet has no
// phase: pass matchId null and record_trade applies the roster changes without recording or
// enforcing the one-sale / one-search-per-hero limits.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Json } from './database.types'
import { campaignSettingsSchema, tradePhaseStateRowSchema, type CampaignSettings, type RosterChange, type TradePhaseStateRow } from '../domain'
import { supabase } from './supabase'
import { warbandKeys } from './warbands'

export type { TradePhaseStateRow }

export const tradeKeys = {
  all: ['trading'] as const,
  campaign: (warbandId: string | undefined) => ['trading', 'campaign', warbandId] as const,
  latestReport: (warbandId: string | undefined) => ['trading', 'latest-report', warbandId] as const,
  state: (warbandId: string | undefined, matchId: string | null | undefined) => ['trading', 'state', warbandId, matchId] as const,
}

export interface WarbandCampaign {
  campaignId: string
  name: string
  settings: CampaignSettings
}

/** The campaign the warband is currently enrolled in, or null when it plays alone. */
export async function fetchWarbandCampaign(warbandId: string): Promise<WarbandCampaign | null> {
  const { data, error } = await supabase
    .from('campaign_members')
    .select('campaign_id, campaigns(id, name, settings)')
    .eq('warband_id', warbandId)
    .is('left_at', null)
    .maybeSingle()
  if (error) throw new Error(error.message)
  const campaign = data?.campaigns
  if (!campaign) return null
  return { campaignId: campaign.id, name: campaign.name, settings: campaignSettingsSchema.parse(campaign.settings ?? {}) }
}

export interface LatestReport {
  match_id: string
  submitted_at: string
}

/** The warband's most recent battle report, which defines its current post-battle phase. */
export async function fetchLatestReport(warbandId: string): Promise<LatestReport | null> {
  const { data, error } = await supabase
    .from('match_reports')
    .select('match_id, submitted_at')
    .eq('warband_id', warbandId)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

/** What has already been done this phase; null until the first sale or search is recorded. */
export async function fetchTradePhaseState(warbandId: string, matchId: string): Promise<TradePhaseStateRow | null> {
  const { data, error } = await supabase
    .from('trade_phase_state')
    .select('*')
    .eq('warband_id', warbandId)
    .eq('match_id', matchId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? tradePhaseStateRowSchema.parse(data) : null
}

export interface RecordTradeInput {
  /** The current phase (latest report's match), or null when the warband has not fought yet. */
  matchId: string | null
  /** From diffRoster(rows, next); applied with audit reason 'trading'. */
  changes: RosterChange[]
  /** True when this visit sold wyrdstone; refused if the phase already had a sale. */
  wyrdstoneSold: boolean
  /** Heroes who made a rare-item search this visit; refused if any already searched this phase. */
  heroesSearched: string[]
}

/** Returns the number of roster changes applied. */
export async function recordTrade(warbandId: string, input: RecordTradeInput): Promise<number> {
  const { data, error } = await supabase.rpc('record_trade', {
    p_warband_id: warbandId,
    p_match_id: input.matchId ?? undefined,
    p_changes: input.changes as unknown as Json,
    p_wyrdstone_sold: input.wyrdstoneSold,
    p_heroes_searched: input.heroesSearched,
  })
  if (error) throw new Error(error.message)
  return data
}

// ---- hooks ----

export function useWarbandCampaign(warbandId: string | undefined) {
  return useQuery({ queryKey: tradeKeys.campaign(warbandId), queryFn: () => fetchWarbandCampaign(warbandId!), enabled: Boolean(warbandId) })
}

export function useLatestReport(warbandId: string | undefined) {
  return useQuery({ queryKey: tradeKeys.latestReport(warbandId), queryFn: () => fetchLatestReport(warbandId!), enabled: Boolean(warbandId) })
}

/** Skipped (never loads) while matchId is null: a warband without a report has no phase to track. */
export function useTradePhaseState(warbandId: string | undefined, matchId: string | null | undefined) {
  return useQuery({
    queryKey: tradeKeys.state(warbandId, matchId),
    queryFn: () => fetchTradePhaseState(warbandId!, matchId!),
    enabled: Boolean(warbandId) && Boolean(matchId),
  })
}

export function useRecordTrade(warbandId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: RecordTradeInput) => recordTrade(warbandId, input),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: warbandKeys.one(warbandId) }),
        qc.invalidateQueries({ queryKey: warbandKeys.all }),
        qc.invalidateQueries({ queryKey: tradeKeys.all }),
      ]),
  })
}
