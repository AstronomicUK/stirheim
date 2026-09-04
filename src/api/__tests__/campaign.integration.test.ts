// Campaign helpers against the LOCAL stack (SUPABASE_LOCAL=1): profile embeds, invite code
// regeneration, leaving, and settings being GM-only.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const enabled = process.env.SUPABASE_LOCAL === '1'
const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const anonKey = process.env.SUPABASE_ANON_KEY ?? ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const PLAYER = { email: 'player@stirheim.test', password: 'stirheim-dev', id: '22222222-2222-4222-8222-222222222222' }
const GM = { email: 'gm@stirheim.test', password: 'stirheim-dev', id: '11111111-1111-4111-8111-111111111111' }
const CAMPAIGN = 'dddddddd-0000-4000-8000-000000000001'

function client(): SupabaseClient {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

describe.skipIf(!enabled)('campaign helpers', () => {
  let player: SupabaseClient
  let gm: SupabaseClient
  let admin: SupabaseClient
  const createdCampaigns: string[] = []
  const createdWarbands: string[] = []

  beforeAll(async () => {
    player = client()
    gm = client()
    const a = await player.auth.signInWithPassword(PLAYER)
    const b = await gm.auth.signInWithPassword(GM)
    if (a.error || b.error) throw a.error ?? b.error
    admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  })

  afterAll(async () => {
    if (createdCampaigns.length) await admin.from('campaigns').delete().in('id', createdCampaigns)
    if (createdWarbands.length) await admin.from('warbands').delete().in('id', createdWarbands)
    await admin.from('campaigns').update({ invite_code: 'test-2026' }).eq('id', CAMPAIGN)
  })

  it('embeds GM and member display names through the profile foreign keys', async () => {
    const { data, error } = await player
      .from('campaigns')
      .select('name, profiles!campaigns_gm_profile_fkey(display_name), campaign_members(warband_id, profiles(display_name))')
      .eq('id', CAMPAIGN)
      .single()
    expect(error).toBeNull()
    const gm = data?.profiles as unknown as { display_name: string } | null
    expect(gm?.display_name).toBe('Tom (GM)')
    const names = (data?.campaign_members ?? []).map((m) => (m.profiles as unknown as { display_name: string } | null)?.display_name)
    expect(names.sort()).toEqual(['Ana', 'Tom (GM)'])
  })

  it('creating a campaign defaults gm_id to the caller and fills default settings', async () => {
    const { data, error } = await player.from('campaigns').insert({ name: 'Ana runs one' }).select('id, gm_id, settings, invite_code').single()
    expect(error).toBeNull()
    createdCampaigns.push(data!.id)
    expect(data?.gm_id).toBe(PLAYER.id)
    expect(data?.invite_code).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}$/)
    expect(data?.settings).toMatchObject({ startingGold: 500, houseRules: { halfPriceArmour: true } })
  })

  it('only the GM can regenerate the invite code', async () => {
    const asPlayer = await player.rpc('regenerate_invite_code', { p_campaign_id: CAMPAIGN })
    expect(asPlayer.error?.message).toMatch(/only the GM/)
    const asGm = await gm.rpc('regenerate_invite_code', { p_campaign_id: CAMPAIGN })
    expect(asGm.error).toBeNull()
    expect(asGm.data).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}$/)
    expect(asGm.data).not.toBe('test-2026')
    const preview = await player.rpc('campaign_preview', { p_invite_code: asGm.data })
    expect(preview.data?.[0]?.name).toBe('Ruins of the Stir')
  })

  it('a member can leave, which frees the warband to join elsewhere, and can rejoin', async () => {
    const wb = await player.from('warbands').insert({ name: 'Wanderers', type_rules_id: 'kislevites' }).select('id').single()
    createdWarbands.push(wb.data!.id)
    const code = (await admin.from('campaigns').select('invite_code').eq('id', CAMPAIGN).single()).data!.invite_code
    const joined = await player.rpc('join_campaign', { p_invite_code: code, p_warband_id: wb.data!.id })
    expect(joined.error).toBeNull()

    const left = await player.rpc('leave_campaign', { p_campaign_id: CAMPAIGN, p_warband_id: wb.data!.id })
    expect(left.error).toBeNull()
    const row = await player.from('campaign_members').select('left_at').eq('warband_id', wb.data!.id).single()
    expect(row.data?.left_at).not.toBeNull()

    const again = await player.rpc('leave_campaign', { p_campaign_id: CAMPAIGN, p_warband_id: wb.data!.id })
    expect(again.error?.message).toMatch(/not an active member/)

    const rejoined = await player.rpc('join_campaign', { p_invite_code: code, p_warband_id: wb.data!.id })
    expect(rejoined.error).toBeNull()
    expect(rejoined.data).toMatchObject({ left_at: null })
    await player.rpc('leave_campaign', { p_campaign_id: CAMPAIGN, p_warband_id: wb.data!.id })
  })

  it('members cannot change settings; the GM can', async () => {
    const asPlayer = await player.from('campaigns').update({ rules_markdown: 'nope' }).eq('id', CAMPAIGN).select('id')
    expect(asPlayer.data).toEqual([])
    const asGm = await gm.from('campaigns').update({ rules_markdown: '# House rules\n\nNo armour erosion.' }).eq('id', CAMPAIGN).select('rules_markdown')
    expect(asGm.data?.[0]?.rules_markdown).toMatch(/House rules/)
  })
})
