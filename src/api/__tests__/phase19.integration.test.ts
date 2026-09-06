// Phase 19 against the LOCAL stack (SUPABASE_LOCAL=1): map campaigns. A match carries its district
// from schedule_match, set_match_district moves an open match, and map_adjustments accept the GM
// (with a reason) but not a player.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const enabled = process.env.SUPABASE_LOCAL === '1'
const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const anonKey = process.env.SUPABASE_ANON_KEY ?? ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const PLAYER = { email: 'player@stirheim.test', password: 'stirheim-dev' }
const GM = { email: 'gm@stirheim.test', password: 'stirheim-dev' }
const GM_ID = '11111111-1111-4111-8111-111111111111'
const CAMPAIGN = 'dddddddd-0000-4000-8000-000000000001'
const REIKLAND_WATCH = 'aaaaaaaa-0000-4000-8000-000000000001'
const CLAWS_OF_ESHIN = 'aaaaaaaa-0000-4000-8000-000000000002'

function client(): SupabaseClient {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

describe.skipIf(!enabled)('phase 19: map campaigns', () => {
  let player: SupabaseClient
  let gm: SupabaseClient
  let admin: SupabaseClient
  let matchId: string
  const adjustmentIds: string[] = []

  beforeAll(async () => {
    player = client()
    gm = client()
    const a = await player.auth.signInWithPassword(PLAYER)
    const b = await gm.auth.signInWithPassword(GM)
    if (a.error || b.error) throw a.error ?? b.error
    admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  })

  afterAll(async () => {
    if (matchId) await admin.from('matches').delete().eq('id', matchId)
    if (adjustmentIds.length) await admin.from('map_adjustments').delete().in('id', adjustmentIds)
  })

  it('schedule_match stores the district and set_match_district moves an open match', async () => {
    const booked = await gm.rpc('schedule_match', { p_campaign_id: CAMPAIGN, p_warband_ids: [REIKLAND_WATCH, CLAWS_OF_ESHIN], p_district_id: 'west-gate' })
    expect(booked.error).toBeNull()
    matchId = booked.data as string
    const row = await gm.from('matches').select('district_id').eq('id', matchId).single()
    expect(row.data?.district_id).toBe('west-gate')

    const moved = await player.rpc('set_match_district', { p_match_id: matchId, p_district_id: 'raven-barracks' })
    expect(moved.error).toBeNull()
    const after = await gm.from('matches').select('district_id').eq('id', matchId).single()
    expect(after.data?.district_id).toBe('raven-barracks')

    const cleared = await gm.rpc('set_match_district', { p_match_id: matchId, p_district_id: '' })
    expect(cleared.error).toBeNull()
    const none = await gm.from('matches').select('district_id').eq('id', matchId).single()
    expect(none.data?.district_id).toBeNull()
  })

  it('the GM records a map correction; a player cannot; everyone in the campaign reads it', async () => {
    const mine = await gm
      .from('map_adjustments')
      .insert({ campaign_id: CAMPAIGN, district_id: 'west-gate', warband_id: REIKLAND_WATCH, kind: 'foothold', value: true, reason: 'played off the app', actor_id: GM_ID })
      .select('id')
      .single()
    expect(mine.error).toBeNull()
    if (mine.data) adjustmentIds.push(mine.data.id)

    const playerId = (await player.auth.getUser()).data.user!.id
    const theirs = await player
      .from('map_adjustments')
      .insert({ campaign_id: CAMPAIGN, district_id: 'west-gate', warband_id: CLAWS_OF_ESHIN, kind: 'foothold', value: true, reason: 'nope', actor_id: playerId })
    expect(theirs.error).not.toBeNull()

    const seen = await player.from('map_adjustments').select('id, kind, value, reason').eq('campaign_id', CAMPAIGN)
    expect(seen.error).toBeNull()
    expect(seen.data?.some((r) => r.id === mine.data?.id && r.reason === 'played off the app')).toBe(true)
  })

  it('rejects a bad kind', async () => {
    const bad = await gm.from('map_adjustments').insert({ campaign_id: CAMPAIGN, district_id: 'west-gate', warband_id: REIKLAND_WATCH, kind: 'ownership', value: true, actor_id: GM_ID })
    expect(bad.error).not.toBeNull()
  })
})
