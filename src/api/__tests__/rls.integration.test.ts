// Row Level Security integration tests against the LOCAL Supabase stack.
//
// Skipped unless SUPABASE_LOCAL=1 (npm run test:integration). Needs `supabase start` and a
// fresh `supabase db reset` so the seed accounts exist. Connection details come from
// `supabase status -o env` or the defaults below, which match supabase/config.toml.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const enabled = process.env.SUPABASE_LOCAL === '1'
const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const anonKey = process.env.SUPABASE_ANON_KEY ?? ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

const GM = { email: 'gm@stirheim.test', password: 'stirheim-dev', id: '11111111-1111-4111-8111-111111111111' }
const PLAYER = { email: 'player@stirheim.test', password: 'stirheim-dev', id: '22222222-2222-4222-8222-222222222222' }
const REIKLAND_WATCH = 'aaaaaaaa-0000-4000-8000-000000000001'
const CLAWS_OF_ESHIN = 'aaaaaaaa-0000-4000-8000-000000000002'
const CAMPAIGN = 'dddddddd-0000-4000-8000-000000000001'

function client(): SupabaseClient {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function signedIn(user: { email: string; password: string }): Promise<SupabaseClient> {
  const c = client()
  const { error } = await c.auth.signInWithPassword(user)
  if (error) throw error
  return c
}

describe.skipIf(!enabled)('row level security', () => {
  let anon: SupabaseClient
  let gm: SupabaseClient
  let player: SupabaseClient
  let admin: SupabaseClient
  const created = { warbands: [] as string[], matches: [] as string[] }

  beforeAll(async () => {
    if (!anonKey || !serviceKey) {
      throw new Error('Set SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY (see `supabase status -o env`).')
    }
    anon = client()
    gm = await signedIn(GM)
    player = await signedIn(PLAYER)
    admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  })

  afterAll(async () => {
    if (!admin) return
    if (created.matches.length) await admin.from('matches').delete().in('id', created.matches)
    if (created.warbands.length) await admin.from('warbands').delete().in('id', created.warbands)
    await admin.from('warbands').update({ gold: 35, name: 'Reikland Watch' }).eq('id', REIKLAND_WATCH)
    await admin.from('warbands').update({ gold: 20, name: 'Claws of Eshin' }).eq('id', CLAWS_OF_ESHIN)
  })

  it('anonymous users read nothing', async () => {
    const { data, error } = await anon.from('warbands').select('id')
    expect(error).toBeNull()
    expect(data).toEqual([])
    const profiles = await anon.from('profiles').select('user_id')
    expect(profiles.data).toEqual([])
  })

  it('sign-up created profiles with the requested display names', async () => {
    const { data } = await player.from('profiles').select('user_id, display_name').order('display_name')
    expect(data).toEqual([
      { user_id: PLAYER.id, display_name: 'Ana' },
      { user_id: GM.id, display_name: 'Tom (GM)' },
    ])
  })

  it('campaign members see every warband in their campaign, with warriors and items', async () => {
    const { data, error } = await player
      .from('warbands')
      .select('id, name, heroes(id), henchman_groups(id), items(id)')
      .order('name')
    expect(error).toBeNull()
    expect(data?.map((w) => w.name)).toEqual(['Claws of Eshin', 'Reikland Watch'])
    const reikland = data?.find((w) => w.id === REIKLAND_WATCH)
    expect(reikland?.heroes).toHaveLength(4)
    expect(reikland?.henchman_groups).toHaveLength(2)
    expect(reikland?.items).toHaveLength(11)
  })

  it('a player edits their own warband but not another member’s', async () => {
    const own = await player.from('warbands').update({ gold: 25 }).eq('id', CLAWS_OF_ESHIN).select('gold')
    expect(own.error).toBeNull()
    expect(own.data).toEqual([{ gold: 25 }])

    const other = await player.from('warbands').update({ gold: 999 }).eq('id', REIKLAND_WATCH).select('gold')
    expect(other.error).toBeNull()
    expect(other.data).toEqual([]) // RLS filters the row out; nothing updated
    const check = await gm.from('warbands').select('gold').eq('id', REIKLAND_WATCH).single()
    expect(check.data?.gold).toBe(35)
  })

  it('the GM edits any warband in their campaign and the edit is audited', async () => {
    const before = await admin.from('audit_log').select('id', { count: 'exact', head: true }).eq('warband_id', CLAWS_OF_ESHIN)
    const res = await gm.from('warbands').update({ gold: 30 }).eq('id', CLAWS_OF_ESHIN).select('gold')
    expect(res.error).toBeNull()
    expect(res.data).toEqual([{ gold: 30 }])

    const { data: log } = await player
      .from('audit_log')
      .select('actor_id, table_name, action, before, after')
      .eq('warband_id', CLAWS_OF_ESHIN)
      .order('at', { ascending: false })
      .limit(1)
    expect(log?.[0]?.actor_id).toBe(GM.id)
    expect(log?.[0]?.table_name).toBe('warbands')
    expect(log?.[0]?.action).toBe('update')
    expect(log?.[0]?.before).toMatchObject({ gold: 25 })
    expect(log?.[0]?.after).toMatchObject({ gold: 30 })
    const after = await admin.from('audit_log').select('id', { count: 'exact', head: true }).eq('warband_id', CLAWS_OF_ESHIN)
    expect((after.count ?? 0) - (before.count ?? 0)).toBe(1)
  })

  it('nobody can hand a warband to someone else', async () => {
    const asOwner = await player.from('warbands').update({ owner_id: GM.id }).eq('id', CLAWS_OF_ESHIN)
    expect(asOwner.error?.message).toMatch(/owner cannot be changed/)
    const asNewOwner = await player.from('warbands').insert({ owner_id: GM.id, name: 'Sneaky', type_rules_id: 'witch_hunters' })
    expect(asNewOwner.error?.code).toBe('42501')
  })

  it('a warband outside any campaign is private to its owner', async () => {
    const { data, error } = await player
      .from('warbands')
      .insert({ name: 'Private Reserve', type_rules_id: 'witch_hunters', gold: 500 })
      .select('id')
      .single()
    expect(error).toBeNull()
    created.warbands.push(data!.id)
    const asGm = await gm.from('warbands').select('id').eq('id', data!.id)
    expect(asGm.data).toEqual([])
  })

  it('campaign_preview shows name, GM and size for a valid code, case- and dash-insensitively', async () => {
    const { data, error } = await player.rpc('campaign_preview', { p_invite_code: ' TEST2026 ' })
    expect(error).toBeNull()
    expect(data).toEqual([
      { campaign_id: CAMPAIGN, name: 'Ruins of the Stir', gm_display_name: 'Tom (GM)', member_count: 2, archived: false },
    ])
    const missing = await player.rpc('campaign_preview', { p_invite_code: 'nope-nope' })
    expect(missing.data).toEqual([])
  })

  it('join_campaign enrols an owned warband once, and rejects the rest', async () => {
    const { data: wb } = await player
      .from('warbands')
      .insert({ name: 'Second String', type_rules_id: 'witch_hunters' })
      .select('id')
      .single()
    created.warbands.push(wb!.id)

    const joined = await player.rpc('join_campaign', { p_invite_code: 'test-2026', p_warband_id: wb!.id })
    expect(joined.error).toBeNull()
    expect(joined.data).toMatchObject({ campaign_id: CAMPAIGN, warband_id: wb!.id, user_id: PLAYER.id, left_at: null })

    const again = await player.rpc('join_campaign', { p_invite_code: 'test-2026', p_warband_id: wb!.id })
    expect(again.error?.message).toMatch(/already in a campaign/)

    const notMine = await player.rpc('join_campaign', { p_invite_code: 'test-2026', p_warband_id: REIKLAND_WATCH })
    expect(notMine.error?.message).toMatch(/warband you own/)

    const badCode = await player.rpc('join_campaign', { p_invite_code: 'zzzz-zzzz', p_warband_id: wb!.id })
    expect(badCode.error?.message).toMatch(/No campaign/)

    // Direct inserts bypassing the function are refused.
    const direct = await player.from('campaign_members').insert({ campaign_id: CAMPAIGN, warband_id: wb!.id, user_id: PLAYER.id })
    expect(direct.error?.code).toBe('42501')

    // The GM now sees the new warband because it is in their campaign.
    const asGm = await gm.from('warbands').select('name').eq('id', wb!.id)
    expect(asGm.data).toEqual([{ name: 'Second String' }])
  })

  it('campaign settings are GM-only and carry the house-rule defaults', async () => {
    const { data } = await player.from('campaigns').select('settings, invite_code').eq('id', CAMPAIGN).single()
    expect(data?.invite_code).toBe('test-2026')
    expect(data?.settings).toMatchObject({
      startingGold: 500,
      houseRules: { strengthArmourPiercing: false, optionalCriticalTables: true, halfPriceArmour: true },
    })
    const asPlayer = await player.from('campaigns').update({ name: 'Hijacked' }).eq('id', CAMPAIGN).select('name')
    expect(asPlayer.data).toEqual([])
    const asGm = await gm.from('campaigns').update({ name: 'Ruins of the Stir' }).eq('id', CAMPAIGN).select('name')
    expect(asGm.data).toEqual([{ name: 'Ruins of the Stir' }])
  })

  it('match reports are insert-once and immutable; only the GM can remove one', async () => {
    const { data: match, error } = await gm
      .from('matches')
      .insert({ campaign_id: CAMPAIGN, created_by: GM.id, created_via: 'gm', scenario_rules_id: 'skirmish', state: 'in_progress' })
      .select('id')
      .single()
    expect(error).toBeNull()
    created.matches.push(match!.id)

    const parts = await gm.from('match_participants').insert([
      { match_id: match!.id, warband_id: REIKLAND_WATCH, accepted_at: new Date().toISOString() },
      { match_id: match!.id, warband_id: CLAWS_OF_ESHIN, accepted_at: new Date().toISOString() },
    ])
    expect(parts.error).toBeNull()

    // A player cannot report for a warband they do not own.
    const forOther = await player.from('match_reports').insert({ match_id: match!.id, warband_id: REIKLAND_WATCH, submitted_by: PLAYER.id })
    expect(forOther.error?.code).toBe('42501')

    const report = await player
      .from('match_reports')
      .insert({ match_id: match!.id, warband_id: CLAWS_OF_ESHIN, submitted_by: PLAYER.id, won: true })
      .select('id')
      .single()
    expect(report.error).toBeNull()

    const edit = await player.from('match_reports').update({ won: false }).eq('id', report.data!.id).select('won')
    expect(edit.data).toEqual([])

    const twice = await player.from('match_reports').insert({ match_id: match!.id, warband_id: CLAWS_OF_ESHIN, submitted_by: PLAYER.id })
    expect(twice.error?.code).toBe('23505')

    const playerDelete = await player.from('match_reports').delete().eq('id', report.data!.id).select('id')
    expect(playerDelete.data).toEqual([])
    const gmDelete = await gm.from('match_reports').delete().eq('id', report.data!.id).select('id')
    expect(gmDelete.data).toEqual([{ id: report.data!.id }])
  })

  it('a player may challenge but not schedule as GM', async () => {
    const asGm = await player
      .from('matches')
      .insert({ campaign_id: CAMPAIGN, created_by: PLAYER.id, created_via: 'gm' })
    expect(asGm.error?.code).toBe('42501')
    const challenge = await player
      .from('matches')
      .insert({ campaign_id: CAMPAIGN, created_by: PLAYER.id, created_via: 'challenge' })
      .select('id')
      .single()
    expect(challenge.error).toBeNull()
    created.matches.push(challenge.data!.id)
  })
})
