// Phase 18 against the LOCAL stack (SUPABASE_LOCAL=1): moving a warband between campaigns in one step.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const enabled = process.env.SUPABASE_LOCAL === '1'
const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const anonKey = process.env.SUPABASE_ANON_KEY ?? ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const PLAYER = { email: 'player@stirheim.test', password: 'stirheim-dev' }
const GM = { email: 'gm@stirheim.test', password: 'stirheim-dev' }
const CAMPAIGN = 'dddddddd-0000-4000-8000-000000000001'
const CLAWS_OF_ESHIN = 'aaaaaaaa-0000-4000-8000-000000000002'
const REIKLAND_WATCH = 'aaaaaaaa-0000-4000-8000-000000000001'

function client(): SupabaseClient {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

describe.skipIf(!enabled)('phase 18: moving a warband between campaigns', () => {
  let player: SupabaseClient
  let gm: SupabaseClient
  let admin: SupabaseClient
  let otherId: string
  let otherCode: string

  beforeAll(async () => {
    player = client()
    gm = client()
    const a = await player.auth.signInWithPassword(PLAYER)
    const b = await gm.auth.signInWithPassword(GM)
    if (a.error || b.error) throw a.error ?? b.error
    admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const created = await gm.from('campaigns').insert({ name: 'Second front' }).select('id, invite_code').single()
    if (created.error) throw created.error
    otherId = created.data.id
    otherCode = created.data.invite_code
  })

  afterAll(async () => {
    // Put Claws of Eshin back in the seed campaign and drop the second one.
    await admin.from('campaign_members').update({ left_at: null, joined_at: new Date().toISOString() }).eq('campaign_id', CAMPAIGN).eq('warband_id', CLAWS_OF_ESHIN)
    if (otherId) await admin.from('campaigns').delete().eq('id', otherId)
  })

  it('the owner moves the warband with the new campaign\'s invite code; the old membership is closed, not deleted', async () => {
    const moved = await player.rpc('move_warband_campaign', { p_warband_id: CLAWS_OF_ESHIN, p_invite_code: otherCode })
    expect(moved.error).toBeNull()
    const rows = await admin.from('campaign_members').select('campaign_id, left_at').eq('warband_id', CLAWS_OF_ESHIN)
    const old = rows.data?.find((r) => r.campaign_id === CAMPAIGN)
    const now = rows.data?.find((r) => r.campaign_id === otherId)
    expect(old?.left_at).not.toBeNull()
    expect(now?.left_at).toBeNull()
  })

  it('refuses a stranger\'s warband, the same campaign, and a bad code', async () => {
    const notMine = await player.rpc('move_warband_campaign', { p_warband_id: REIKLAND_WATCH, p_invite_code: otherCode })
    expect(notMine.error?.message).toMatch(/only move a warband you own/)
    const same = await player.rpc('move_warband_campaign', { p_warband_id: CLAWS_OF_ESHIN, p_invite_code: otherCode })
    expect(same.error?.message).toMatch(/already in this campaign/)
    const bad = await player.rpc('move_warband_campaign', { p_warband_id: CLAWS_OF_ESHIN, p_invite_code: 'nope-nope' })
    expect(bad.error?.message).toMatch(/No campaign has the invite code/)
  })

  it('moving back reopens the original membership row', async () => {
    const back = await player.rpc('move_warband_campaign', { p_warband_id: CLAWS_OF_ESHIN, p_invite_code: 'test-2026' })
    expect(back.error).toBeNull()
    const rows = await admin.from('campaign_members').select('campaign_id, left_at').eq('warband_id', CLAWS_OF_ESHIN)
    expect(rows.data?.find((r) => r.campaign_id === CAMPAIGN)?.left_at).toBeNull()
    expect(rows.data?.find((r) => r.campaign_id === otherId)?.left_at).not.toBeNull()
  })
})
