// submit_battle_report / withdraw_battle_report against the LOCAL stack (SUPABASE_LOCAL=1).

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const enabled = process.env.SUPABASE_LOCAL === '1'
const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const anonKey = process.env.SUPABASE_ANON_KEY ?? ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const PLAYER = { email: 'player@stirheim.test', password: 'stirheim-dev', id: '22222222-2222-4222-8222-222222222222' }
const GM = { email: 'gm@stirheim.test', password: 'stirheim-dev', id: '11111111-1111-4111-8111-111111111111' }
const CAMPAIGN = 'dddddddd-0000-4000-8000-000000000001'
const REIKLAND_WATCH = 'aaaaaaaa-0000-4000-8000-000000000001'
const CLAWS_OF_ESHIN = 'aaaaaaaa-0000-4000-8000-000000000002'
const SKRITCH = 'bbbbbbbb-0000-4000-8000-000000000011'
const VERMINKIN = 'cccccccc-0000-4000-8000-000000000011'

function client(): SupabaseClient {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

describe.skipIf(!enabled)('post-battle reports', () => {
  let player: SupabaseClient
  let gm: SupabaseClient
  let admin: SupabaseClient
  let matchId: string

  beforeAll(async () => {
    player = client()
    gm = client()
    const a = await player.auth.signInWithPassword(PLAYER)
    const b = await gm.auth.signInWithPassword(GM)
    if (a.error || b.error) throw a.error ?? b.error
    admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const m = await gm.rpc('schedule_match', { p_campaign_id: CAMPAIGN, p_warband_ids: [REIKLAND_WATCH, CLAWS_OF_ESHIN], p_scenario_rules_id: 'skirmish' })
    matchId = m.data as string
    await gm.rpc('start_match', { p_match_id: matchId })
    await gm.rpc('end_match', { p_match_id: matchId })
  })

  afterAll(async () => {
    if (matchId) await admin.from('matches').delete().eq('id', matchId)
    await admin.from('pending_advances').delete().eq('warband_id', CLAWS_OF_ESHIN)
    await admin.from('heroes').update({ xp: 20, level_ups: 8, injuries: [], flags: {}, status: 'active' }).eq('id', SKRITCH)
    await admin.from('henchman_groups').update({ size: 4, xp: 0, level_ups: 0 }).eq('id', VERMINKIN)
    await admin.from('warbands').update({ wyrdstone: 2, gold: 20, veteran_pool: null }).eq('id', CLAWS_OF_ESHIN)
    await admin.from('items').delete().eq('warband_id', CLAWS_OF_ESHIN).eq('custom_name', 'Tarnished locket')
  })

  const report = {
    version: 1,
    won: true,
    result: 'won',
    routed: false,
    xp_log: [
      { subjectType: 'hero', subjectId: SKRITCH, subjectName: 'Skritch Nightblade', amount: 4, reasons: ['+1 survived', '+1 winning leader', '+2 enemies out of action'], xpBefore: 20, xpAfter: 24, advancesEarned: 1 },
      { subjectType: 'group', subjectId: VERMINKIN, subjectName: 'Verminkin', amount: 1, reasons: ['+1 survived'], xpBefore: 0, xpAfter: 1, advancesEarned: 0 },
    ],
    ooa: [{ subjectType: 'group', subjectId: VERMINKIN, subjectName: 'Verminkin', count: 2 }],
    injuries: [{ subjectType: 'group', subjectId: VERMINKIN, subjectName: 'Verminkin', rolls: [1, 5], dead: 1 }],
    exploration: {
      diceAllowed: 4, diceReason: '3 surviving heroes, +1 for winning = 4 dice', rolls: [3, 3, 5, 6], total: 17, shards: 3,
      locationId: 'well', locationName: 'Well', locationText: 'x', subRoll: null, goldFound: 10,
      itemsFound: [{ item_rules_id: null, custom_name: 'Tarnished locket', quantity: 1 }], notes: [],
    },
    veteran_pool_roll: 7,
    notes: 'Good night for the clan.',
    applied: {
      heroes: [{ id: SKRITCH, patch: { xp: 24, level_ups: 8 } }],
      groups: [{ id: VERMINKIN, patch: { size: 3, xp: 1 } }],
      warband: { wyrdstone_delta: 3, gold_delta: 10, veteran_pool: 7 },
      pending_advances: [{ subject_type: 'hero', subject_id: SKRITCH, threshold_xp: 24 }],
      remove_item_ids: [],
      stash_items: [{ item_rules_id: null, custom_name: 'Tarnished locket', quantity: 1 }],
    },
  }

  it('a player cannot file for another warband; the owner files and the roster changes land atomically', async () => {
    const wrong = await player.rpc('submit_battle_report', { p_match_id: matchId, p_warband_id: REIKLAND_WATCH, p_report: report })
    expect(wrong.error?.code).toBe('42501')

    const ok = await player.rpc('submit_battle_report', { p_match_id: matchId, p_warband_id: CLAWS_OF_ESHIN, p_report: report })
    expect(ok.error).toBeNull()
    expect(ok.data).toBe('awaiting_reports') // Reikland still to report

    const hero = await player.from('heroes').select('xp, level_ups').eq('id', SKRITCH).single()
    expect(hero.data).toEqual({ xp: 24, level_ups: 8 })
    const group = await player.from('henchman_groups').select('size, xp').eq('id', VERMINKIN).single()
    expect(group.data).toEqual({ size: 3, xp: 1 })
    const wb = await player.from('warbands').select('wyrdstone, gold, veteran_pool').eq('id', CLAWS_OF_ESHIN).single()
    expect(wb.data).toEqual({ wyrdstone: 5, gold: 30, veteran_pool: 7 })
    const pending = await player.from('pending_advances').select('subject_id, threshold_xp, resolved_at').eq('warband_id', CLAWS_OF_ESHIN)
    expect(pending.data).toEqual([{ subject_id: SKRITCH, threshold_xp: 24, resolved_at: null }])
    const stash = await player.from('items').select('custom_name, holder_type').eq('warband_id', CLAWS_OF_ESHIN).eq('custom_name', 'Tarnished locket')
    expect(stash.data).toEqual([{ custom_name: 'Tarnished locket', holder_type: 'stash' }])

    const again = await player.rpc('submit_battle_report', { p_match_id: matchId, p_warband_id: CLAWS_OF_ESHIN, p_report: report })
    expect(again.error?.message).toMatch(/already been filed/)

    const stored = await gm.from('match_reports').select('result, won, veteran_pool_roll, xp_log, profiles!match_reports_submitted_by_profile_fkey(display_name)').eq('match_id', matchId).single()
    expect(stored.data?.result).toBe('won')
    expect(stored.data?.veteran_pool_roll).toBe(7)
    expect((stored.data?.profiles as unknown as { display_name: string } | null)?.display_name).toBe('Ana')
  })

  it('the match completes when the last participant reports; the GM can withdraw and reopen', async () => {
    const gmReport = { ...report, won: false, result: 'lost', xp_log: [], ooa: [], injuries: [], exploration: null, veteran_pool_roll: 5, applied: { heroes: [], groups: [], warband: { wyrdstone_delta: 0, gold_delta: 0, veteran_pool: 5 }, pending_advances: [], remove_item_ids: [], stash_items: [] } }
    const done = await gm.rpc('submit_battle_report', { p_match_id: matchId, p_warband_id: REIKLAND_WATCH, p_report: gmReport })
    expect(done.error).toBeNull()
    expect(done.data).toBe('completed')
    const m = await gm.from('matches').select('state, completed_at').eq('id', matchId).single()
    expect(m.data?.state).toBe('completed')
    expect(m.data?.completed_at).not.toBeNull()

    const asPlayer = await player.rpc('withdraw_battle_report', { p_match_id: matchId, p_warband_id: REIKLAND_WATCH })
    expect(asPlayer.error?.message).toMatch(/only the GM/)
    const withdrawn = await gm.rpc('withdraw_battle_report', { p_match_id: matchId, p_warband_id: REIKLAND_WATCH })
    expect(withdrawn.data).toBe('awaiting_reports')
    const reopened = await gm.from('matches').select('state').eq('id', matchId).single()
    expect(reopened.data?.state).toBe('awaiting_reports')
    await admin.from('warbands').update({ veteran_pool: null }).eq('id', REIKLAND_WATCH)
  })
})
