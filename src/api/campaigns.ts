// Campaign reads and writes. Membership is created only by the join_campaign SQL function;
// settings and rules are GM-only by RLS.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Json } from './database.types'
import { campaignSettingsSchema, type CampaignRow, type CampaignSettings, type HenchmanGroupRow, type HeroRow, type WarbandRow } from '../domain'
import { toRosterWarband } from '../domain'
import { findWarbandTemplate } from '../rules/data/warbandTemplates'
import { warbandRating } from '../rules/resolve/rating'
import { fetchCampaignAliases, nameIn } from './aliases'
import { supabase } from './supabase'
import { warbandKeys } from './warbands'

export const campaignKeys = {
  all: ['campaigns'] as const,
  mine: (userId: string | undefined) => ['campaigns', 'mine', userId] as const,
  one: (id: string | undefined) => ['campaigns', 'one', id] as const,
  activity: (id: string | undefined) => ['campaigns', 'activity', id] as const,
  preview: (code: string) => ['campaigns', 'preview', code] as const,
}

export interface CampaignSummary {
  id: string
  name: string
  gm_id: string
  gm_display_name: string
  invite_code: string
  archived: boolean
  member_count: number
  /** True when the signed-in user runs it. */
  is_gm: boolean
  /** Ids of the user's own warbands enrolled in it. */
  my_warband_ids: string[]
  updated_at: string
}

export interface CampaignMemberView {
  campaign_id: string
  warband_id: string
  user_id: string
  display_name: string
  joined_at: string
  left_at: string | null
  warband: {
    id: string
    name: string
    type_rules_id: string
    type_name: string
    gold: number
    wyrdstone: number
    archived: boolean
    hero_count: number
    model_count: number
    rating: number
    owner_id: string
  }
}

export interface CampaignDetail {
  campaign: CampaignRow
  settings: CampaignSettings
  gm_display_name: string
  members: CampaignMemberView[]
  former_members: CampaignMemberView[]
}

export interface CampaignActivity {
  id: number
  at: string
  actor_id: string | null
  actor_display_name: string | null
  table_name: string
  action: string
  reason: string | null
  warband_id: string | null
  warband_name: string | null
  before: Json | null
  after: Json | null
}

export async function fetchMyCampaigns(userId: string): Promise<CampaignSummary[]> {
  // RLS already limits this to campaigns the user runs or plays in.
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, name, gm_id, invite_code, archived, updated_at, profiles!campaigns_gm_profile_fkey(display_name), campaign_members(warband_id, user_id, left_at)')
    .order('archived')
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data.map((c) => {
    const active = c.campaign_members.filter((m) => m.left_at === null)
    return {
      id: c.id,
      name: c.name,
      gm_id: c.gm_id,
      gm_display_name: c.profiles?.display_name ?? 'GM',
      invite_code: c.invite_code,
      archived: c.archived,
      member_count: active.length,
      is_gm: c.gm_id === userId,
      my_warband_ids: active.filter((m) => m.user_id === userId).map((m) => m.warband_id),
      updated_at: c.updated_at,
    }
  })
}

type MemberRow = {
  campaign_id: string
  warband_id: string
  user_id: string
  joined_at: string
  left_at: string | null
  profiles: { display_name: string } | null
  warbands: (WarbandRow & { heroes: HeroRow[]; henchman_groups: HenchmanGroupRow[] }) | null
}

function toMemberView(m: MemberRow): CampaignMemberView | null {
  const w = m.warbands
  if (!w) return null
  const template = findWarbandTemplate(w.type_rules_id)
  const roster = toRosterWarband(w, w.heroes, w.henchman_groups, [])
  const heroes = w.heroes.filter((h) => !h.is_hired_sword && h.status === 'active').length
  const henchmen = w.henchman_groups.reduce((s, g) => s + g.size, 0)
  const hired = w.heroes.filter((h) => h.is_hired_sword && h.status === 'active').length
  return {
    campaign_id: m.campaign_id,
    warband_id: m.warband_id,
    user_id: m.user_id,
    display_name: m.profiles?.display_name ?? 'Player',
    joined_at: m.joined_at,
    left_at: m.left_at,
    warband: {
      id: w.id,
      name: w.name,
      type_rules_id: w.type_rules_id,
      type_name: template?.name ?? w.type_rules_id,
      gold: w.gold,
      wyrdstone: w.wyrdstone,
      archived: w.archived,
      hero_count: heroes,
      model_count: heroes + henchmen + hired,
      rating: warbandRating(roster, template).total,
      owner_id: w.owner_id,
    },
  }
}

export async function fetchCampaign(id: string): Promise<CampaignDetail> {
  const [campaign, members, aliases] = await Promise.all([
    supabase.from('campaigns').select('*, profiles!campaigns_gm_profile_fkey(display_name)').eq('id', id).maybeSingle(),
    supabase
      .from('campaign_members')
      .select('campaign_id, warband_id, user_id, joined_at, left_at, profiles(display_name), warbands(*, heroes(*), henchman_groups(*))')
      .eq('campaign_id', id)
      .order('joined_at'),
    fetchCampaignAliases(id).catch(() => new Map<string, string>()),
  ])
  const firstError = campaign.error ?? members.error
  if (firstError) throw new Error(firstError.message)
  if (!campaign.data) throw new Error('This campaign does not exist, or you are not a member.')
  const { profiles, ...row } = campaign.data
  const views = ((members.data ?? []) as unknown as MemberRow[])
    .map(toMemberView)
    .filter((m): m is CampaignMemberView => m !== null)
    .map((m) => ({ ...m, display_name: nameIn(aliases, m.user_id, m.display_name) }))
  return {
    campaign: row as CampaignRow,
    settings: campaignSettingsSchema.parse(row.settings ?? {}),
    gm_display_name: nameIn(aliases, row.gm_id, profiles?.display_name ?? 'GM'),
    members: views.filter((m) => m.left_at === null),
    former_members: views.filter((m) => m.left_at !== null),
  }
}

export async function fetchCampaignActivity(id: string, limit = 40): Promise<CampaignActivity[]> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('id, at, actor_id, table_name, action, reason, warband_id, campaign_id, before, after')
    .or(`campaign_id.eq.${id},warband_id.in.(${await memberWarbandIdList(id)})`)
    .order('at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  const actorIds = [...new Set(data.map((d) => d.actor_id).filter((x): x is string => Boolean(x)))]
  const warbandIds = [...new Set(data.map((d) => d.warband_id).filter((x): x is string => Boolean(x)))]
  const [profiles, warbands] = await Promise.all([
    actorIds.length ? supabase.from('profiles').select('user_id, display_name').in('user_id', actorIds) : Promise.resolve({ data: [], error: null }),
    warbandIds.length ? supabase.from('warbands').select('id, name').in('id', warbandIds) : Promise.resolve({ data: [], error: null }),
  ])
  const aliases = await fetchCampaignAliases(id).catch(() => new Map<string, string>())
  const names = new Map((profiles.data ?? []).map((p) => [p.user_id, nameIn(aliases, p.user_id, p.display_name)]))
  const wnames = new Map((warbands.data ?? []).map((w) => [w.id, w.name]))
  return data.map((d) => ({
    id: Number(d.id),
    at: d.at,
    actor_id: d.actor_id,
    actor_display_name: d.actor_id ? (names.get(d.actor_id) ?? null) : null,
    table_name: d.table_name,
    action: d.action,
    reason: d.reason,
    warband_id: d.warband_id,
    warband_name: d.warband_id ? (wnames.get(d.warband_id) ?? null) : null,
    before: d.before,
    after: d.after,
  }))
}

async function memberWarbandIdList(campaignId: string): Promise<string> {
  const { data } = await supabase.from('campaign_members').select('warband_id').eq('campaign_id', campaignId)
  const ids = (data ?? []).map((m) => m.warband_id)
  // PostgREST `in.()` with an empty list is an error; a nil UUID matches nothing.
  return ids.length ? ids.join(',') : '00000000-0000-0000-0000-000000000000'
}

export interface CampaignPreview {
  campaign_id: string
  name: string
  gm_display_name: string
  member_count: number
  archived: boolean
}

export async function previewCampaign(code: string): Promise<CampaignPreview | null> {
  const { data, error } = await supabase.rpc('campaign_preview', { p_invite_code: code })
  if (error) throw new Error(error.message)
  const row = data?.[0]
  return row ? { ...row, member_count: Number(row.member_count) } : null
}

export async function joinCampaign(code: string, warbandId: string): Promise<void> {
  const { error } = await supabase.rpc('join_campaign', { p_invite_code: code, p_warband_id: warbandId })
  if (error) throw new Error(error.message)
}

export async function leaveCampaign(campaignId: string, warbandId: string): Promise<void> {
  const { error } = await supabase.rpc('leave_campaign', { p_campaign_id: campaignId, p_warband_id: warbandId })
  if (error) throw new Error(error.message)
}

export interface CreateCampaignInput {
  name: string
  settings?: Partial<CampaignSettings>
  rules_markdown?: string
}

export async function createCampaign(input: CreateCampaignInput): Promise<string> {
  const settings = campaignSettingsSchema.parse(input.settings ?? {})
  const { data, error } = await supabase
    .from('campaigns')
    .insert({ name: input.name.trim(), settings: settings as unknown as Json, rules_markdown: input.rules_markdown ?? '' })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

export interface UpdateCampaignInput {
  name?: string
  settings?: CampaignSettings
  rules_markdown?: string
  archived?: boolean
}

export async function updateCampaign(id: string, patch: UpdateCampaignInput): Promise<void> {
  const row: { name?: string; settings?: Json; rules_markdown?: string; archived?: boolean } = {}
  if (patch.name !== undefined) row.name = patch.name.trim()
  if (patch.settings !== undefined) row.settings = campaignSettingsSchema.parse(patch.settings) as unknown as Json
  if (patch.rules_markdown !== undefined) row.rules_markdown = patch.rules_markdown
  if (patch.archived !== undefined) row.archived = patch.archived
  const { error, data } = await supabase.from('campaigns').update(row).eq('id', id).select('id')
  if (error) throw new Error(error.message)
  if (!data?.length) throw new Error('Only the GM can change campaign settings.')
}

export async function regenerateInviteCode(id: string): Promise<string> {
  const { data, error } = await supabase.rpc('regenerate_invite_code', { p_campaign_id: id })
  if (error) throw new Error(error.message)
  return data
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabase.from('campaigns').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ---- hooks ----

export function useMyCampaigns(userId: string | undefined) {
  return useQuery({ queryKey: campaignKeys.mine(userId), queryFn: () => fetchMyCampaigns(userId!), enabled: Boolean(userId) })
}

export function useCampaign(id: string | undefined) {
  return useQuery({ queryKey: campaignKeys.one(id), queryFn: () => fetchCampaign(id!), enabled: Boolean(id) })
}

export function useCampaignActivity(id: string | undefined) {
  return useQuery({ queryKey: campaignKeys.activity(id), queryFn: () => fetchCampaignActivity(id!), enabled: Boolean(id) })
}

export function useCampaignPreview(code: string) {
  const trimmed = code.replace(/[\s-]/g, '')
  return useQuery({ queryKey: campaignKeys.preview(trimmed), queryFn: () => previewCampaign(code), enabled: trimmed.length >= 8, retry: false })
}

function useInvalidateCampaigns() {
  const qc = useQueryClient()
  return () => Promise.all([qc.invalidateQueries({ queryKey: campaignKeys.all }), qc.invalidateQueries({ queryKey: warbandKeys.all })])
}

export function useCreateCampaign() {
  const invalidate = useInvalidateCampaigns()
  return useMutation({ mutationFn: createCampaign, onSuccess: invalidate })
}

export function useUpdateCampaign(id: string) {
  const invalidate = useInvalidateCampaigns()
  return useMutation({ mutationFn: (patch: UpdateCampaignInput) => updateCampaign(id, patch), onSuccess: invalidate })
}

export function useJoinCampaign() {
  const invalidate = useInvalidateCampaigns()
  return useMutation({ mutationFn: ({ code, warbandId }: { code: string; warbandId: string }) => joinCampaign(code, warbandId), onSuccess: invalidate })
}

export function useLeaveCampaign() {
  const invalidate = useInvalidateCampaigns()
  return useMutation({ mutationFn: ({ campaignId, warbandId }: { campaignId: string; warbandId: string }) => leaveCampaign(campaignId, warbandId), onSuccess: invalidate })
}

export function useRegenerateInviteCode(id: string) {
  const invalidate = useInvalidateCampaigns()
  return useMutation({ mutationFn: () => regenerateInviteCode(id), onSuccess: invalidate })
}

export function useDeleteCampaign() {
  const invalidate = useInvalidateCampaigns()
  return useMutation({ mutationFn: deleteCampaign, onSuccess: invalidate })
}
