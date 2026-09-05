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
  /** Claws of Eshin's veteran pool before any report in this file (other suites may have set it). */
  let poolBefore: number | null = null

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
    const w = await admin.from('warbands').select('veteran_pool').eq('id', CLAWS_OF_ESHIN).single()
    poolBefore = w.data?.veteran_pool ?? null
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

  it('withdrawing undoes the roster changes the report made', async () => {
    // Claws of Eshin's report from the previous test is applied: xp 24, size 3, wyrdstone 5, gold 30, a locket in the stash.
    const before = await gm.from('warbands').select('wyrdstone, gold, veteran_pool').eq('id', CLAWS_OF_ESHIN).single()
    expect(before.data).toEqual({ wyrdstone: 5, gold: 30, veteran_pool: 7 })
    const withdrawn = await gm.rpc('withdraw_battle_report', { p_match_id: matchId, p_warband_id: CLAWS_OF_ESHIN })
    expect(withdrawn.error).toBeNull()
    const hero = await gm.from('heroes').select('xp, level_ups').eq('id', SKRITCH).single()
    expect(hero.data).toEqual({ xp: 20, level_ups: 8 })
    const group = await gm.from('henchman_groups').select('size, xp').eq('id', VERMINKIN).single()
    expect(group.data).toEqual({ size: 4, xp: 0 })
    const wb = await gm.from('warbands').select('wyrdstone, gold, veteran_pool').eq('id', CLAWS_OF_ESHIN).single()
    expect(wb.data).toEqual({ wyrdstone: 2, gold: 20, veteran_pool: poolBefore })
    const pending = await gm.from('pending_advances').select('id').eq('warband_id', CLAWS_OF_ESHIN)
    expect(pending.data).toEqual([])
    const stash = await gm.from('items').select('id').eq('warband_id', CLAWS_OF_ESHIN).eq('custom_name', 'Tarnished locket')
    expect(stash.data).toEqual([])
    // Refile so the later tests have their report back.
    const again = await player.rpc('submit_battle_report', { p_match_id: matchId, p_warband_id: CLAWS_OF_ESHIN, p_report: report })
    expect(again.error).toBeNull()
  })

  it('with approval on, a player report waits; the GM can return it with a note or approve it', async () => {
    const settingsRow = await admin.from('campaigns').select('settings').eq('id', CAMPAIGN).single()
    const settings = settingsRow.data!.settings as Record<string, unknown>
    await admin.from('campaigns').update({ settings: { ...settings, reportApproval: true } }).eq('id', CAMPAIGN)
    try {
      // Start from no report for Claws of Eshin.
      await gm.rpc('withdraw_battle_report', { p_match_id: matchId, p_warband_id: CLAWS_OF_ESHIN })
      const filed = await player.rpc('submit_battle_report', { p_match_id: matchId, p_warband_id: CLAWS_OF_ESHIN, p_report: report })
      expect(filed.error).toBeNull()
      const row = await player.from('match_reports').select('id, status, undo').eq('match_id', matchId).eq('warband_id', CLAWS_OF_ESHIN).single()
      expect(row.data?.status).toBe('pending')
      expect(row.data?.undo).toBeNull()
      // Nothing applied yet.
      const hero = await player.from('heroes').select('xp').eq('id', SKRITCH).single()
      expect(hero.data?.xp).toBe(20)

      const playerApprove = await player.rpc('approve_battle_report', { p_report_id: row.data!.id })
      expect(playerApprove.error?.message).toMatch(/only the GM/)

      const returned = await gm.rpc('return_battle_report', { p_report_id: row.data!.id, p_note: 'Roll the Verminkin injuries again' })
      expect(returned.error).toBeNull()
      const afterReturn = await player.from('match_reports').select('status, review_note').eq('id', row.data!.id).single()
      expect(afterReturn.data).toEqual({ status: 'returned', review_note: 'Roll the Verminkin injuries again' })

      // Filing again replaces the returned report and keeps it in the log.
      const refiled = await player.rpc('submit_battle_report', { p_match_id: matchId, p_warband_id: CLAWS_OF_ESHIN, p_report: { ...report, notes: 'Second attempt' } })
      expect(refiled.error).toBeNull()
      const afterRefile = await player.from('match_reports').select('id, status, revision, notes').eq('match_id', matchId).eq('warband_id', CLAWS_OF_ESHIN).single()
      expect(afterRefile.data).toMatchObject({ id: row.data!.id, status: 'pending', revision: 2, notes: 'Second attempt' })
      const revisions = await player.from('report_revisions').select('revision, note').eq('report_id', row.data!.id)
      expect(revisions.data).toEqual([{ revision: 1, note: 'Roll the Verminkin injuries again' }])

      const approved = await gm.rpc('approve_battle_report', { p_report_id: row.data!.id })
      expect(approved.error).toBeNull()
      const applied = await player.from('match_reports').select('status').eq('id', row.data!.id).single()
      expect(applied.data?.status).toBe('applied')
      const heroAfter = await player.from('heroes').select('xp').eq('id', SKRITCH).single()
      expect(heroAfter.data?.xp).toBe(24)
    } finally {
      await admin.from('campaigns').update({ settings }).eq('id', CAMPAIGN)
    }
  })

  it('the GM amends a filed report with a note: the old version is logged, its effects undone and the new ones applied', async () => {
    const asPlayer = await player.rpc('submit_battle_report', { p_match_id: matchId, p_warband_id: CLAWS_OF_ESHIN, p_report: report, p_amend_note: 'oops' })
    expect(asPlayer.error?.message).toMatch(/only the GM can amend/)

    const amendedReport = {
      ...report,
      notes: 'Amended: the assassin only earned 3 xp',
      xp_log: [{ ...report.xp_log[0], amount: 3, xpAfter: 23, advancesEarned: 0 }, report.xp_log[1]],
      applied: { ...report.applied, heroes: [{ id: SKRITCH, patch: { xp: 23, level_ups: 8 } }], pending_advances: [] },
    }
    const amended = await gm.rpc('submit_battle_report', { p_match_id: matchId, p_warband_id: CLAWS_OF_ESHIN, p_report: amendedReport, p_amend_note: 'Miscounted the kills' })
    expect(amended.error).toBeNull()
    const row = await gm.from('match_reports').select('status, revision, amendment_note, amended_by, notes').eq('match_id', matchId).eq('warband_id', CLAWS_OF_ESHIN).single()
    expect(row.data).toMatchObject({ status: 'applied', revision: 3, amendment_note: 'Miscounted the kills', amended_by: GM.id, notes: 'Amended: the assassin only earned 3 xp' })
    const hero = await gm.from('heroes').select('xp').eq('id', SKRITCH).single()
    expect(hero.data?.xp).toBe(23)
    const pending = await gm.from('pending_advances').select('id').eq('warband_id', CLAWS_OF_ESHIN)
    expect(pending.data).toEqual([])
    const wb = await gm.from('warbands').select('wyrdstone, gold').eq('id', CLAWS_OF_ESHIN).single()
    expect(wb.data).toEqual({ wyrdstone: 5, gold: 30 })
    const stash = await gm.from('items').select('id').eq('warband_id', CLAWS_OF_ESHIN).eq('custom_name', 'Tarnished locket')
    expect(stash.data).toHaveLength(1)
    const revisions = await gm.from('report_revisions').select('revision, note').eq('match_id', matchId).eq('warband_id', CLAWS_OF_ESHIN).order('revision')
    expect(revisions.data?.map((r) => r.revision)).toEqual([1, 2])
    expect(revisions.data?.[1]?.note).toBe('Miscounted the kills')
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
