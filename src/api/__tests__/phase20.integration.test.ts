// Phase 20 against the LOCAL stack (SUPABASE_LOCAL=1): map tolls move gold and are recorded once.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const enabled = process.env.SUPABASE_LOCAL === '1'
const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const anonKey = process.env.SUPABASE_ANON_KEY ?? ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const PLAYER = { email: 'player@stirheim.test', password: 'stirheim-dev' }
const GM = { email: 'gm@stirheim.test', password: 'stirheim-dev' }
const CAMPAIGN = 'dddddddd-0000-4000-8000-000000000001'
const REIKLAND_WATCH = 'aaaaaaaa-0000-4000-8000-000000000001'
const CLAWS_OF_ESHIN = 'aaaaaaaa-0000-4000-8000-000000000002'

function client(): SupabaseClient {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

describe.skipIf(!enabled)('phase 20: map tolls', () => {
  let player: SupabaseClient
  let gm: SupabaseClient
  let admin: SupabaseClient
  let matchId: string
  let goldBefore: { watch: number; claws: number }

  beforeAll(async () => {
    player = client()
    gm = client()
    const a = await player.auth.signInWithPassword(PLAYER)
    const b = await gm.auth.signInWithPassword(GM)
    if (a.error || b.error) throw a.error ?? b.error
    admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const rows = await admin.from('warbands').select('id, gold').in('id', [REIKLAND_WATCH, CLAWS_OF_ESHIN])
    goldBefore = { watch: rows.data!.find((r) => r.id === REIKLAND_WATCH)!.gold, claws: rows.data!.find((r) => r.id === CLAWS_OF_ESHIN)!.gold }
    const booked = await gm.rpc('schedule_match', { p_campaign_id: CAMPAIGN, p_warband_ids: [REIKLAND_WATCH, CLAWS_OF_ESHIN], p_district_id: 'merchants-quarter' })
    if (booked.error) throw booked.error
    matchId = booked.data as string
  })

  afterAll(async () => {
    if (matchId) await admin.from('matches').delete().eq('id', matchId)
    await admin.from('warbands').update({ gold: goldBefore.watch }).eq('id', REIKLAND_WATCH)
    await admin.from('warbands').update({ gold: goldBefore.claws }).eq('id', CLAWS_OF_ESHIN)
  })

  it('the owner pays a bridge toll to the controller; the gold moves and the row is kept', async () => {
    const paid = await player.rpc('pay_map_toll', { p_match_id: matchId, p_warband_id: CLAWS_OF_ESHIN, p_kind: 'bridge', p_amount: 7, p_to_warband_id: REIKLAND_WATCH, p_note: '2D6: 3+4' })
    expect(paid.error).toBeNull()
    const rows = await admin.from('warbands').select('id, gold').in('id', [REIKLAND_WATCH, CLAWS_OF_ESHIN])
    expect(rows.data!.find((r) => r.id === CLAWS_OF_ESHIN)!.gold).toBe(goldBefore.claws - 7)
    expect(rows.data!.find((r) => r.id === REIKLAND_WATCH)!.gold).toBe(goldBefore.watch + 7)
    const tolls = await gm.from('map_tolls').select('kind, amount, to_warband_id').eq('match_id', matchId)
    expect(tolls.data).toEqual([{ kind: 'bridge', amount: 7, to_warband_id: REIKLAND_WATCH }])
  })

  it('refuses a second payment of the same toll, a stranger paying, and an unaffordable toll', async () => {
    const again = await player.rpc('pay_map_toll', { p_match_id: matchId, p_warband_id: CLAWS_OF_ESHIN, p_kind: 'bridge', p_amount: 5 })
    expect(again.error?.message).toMatch(/already been paid/)
    const notMine = await player.rpc('pay_map_toll', { p_match_id: matchId, p_warband_id: REIKLAND_WATCH, p_kind: 'gate', p_amount: 5 })
    expect(notMine.error?.message).toMatch(/only the warband owner or the GM/)
    const tooMuch = await gm.rpc('pay_map_toll', { p_match_id: matchId, p_warband_id: REIKLAND_WATCH, p_kind: 'gate', p_amount: 100000 })
    expect(tooMuch.error?.message).toMatch(/not enough/)
    // The GM may pay a member's gate toll.
    const byGm = await gm.rpc('pay_map_toll', { p_match_id: matchId, p_warband_id: REIKLAND_WATCH, p_kind: 'gate', p_amount: 5 })
    expect(byGm.error).toBeNull()
  })
})
