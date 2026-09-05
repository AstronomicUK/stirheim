// Match lifecycle functions and the match query embed, against the LOCAL stack (SUPABASE_LOCAL=1).

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

const MATCH_SELECT =
  '*, profiles!matches_created_by_profile_fkey(display_name), scenarios(name), ' +
  'match_participants(warband_id, accepted_at, warbands(id, name, type_rules_id, owner_id, profiles!warbands_owner_profile_fkey(display_name), ' +
  'heroes(id, status, is_hired_sword, xp, is_large, hired_sword_rules_id), henchman_groups(id, size, xp, is_large))), ' +
  'match_reports(warband_id)'

function client(): SupabaseClient {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

describe.skipIf(!enabled)('match lifecycle', () => {
  let player: SupabaseClient
  let gm: SupabaseClient
  let admin: SupabaseClient
  const matches: string[] = []

  beforeAll(async () => {
    player = client()
    gm = client()
    const a = await player.auth.signInWithPassword(PLAYER)
    const b = await gm.auth.signInWithPassword(GM)
    if (a.error || b.error) throw a.error ?? b.error
    admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  })

  afterAll(async () => {
    if (matches.length) await admin.from('matches').delete().in('id', matches)
  })

  it('a challenge invites the other warband; accepting, starting and ending walk the states', async () => {
    const challenge = await player.rpc('schedule_match', {
      p_campaign_id: CAMPAIGN,
      p_warband_ids: [CLAWS_OF_ESHIN, REIKLAND_WATCH],
      p_scenario_rules_id: 'skirmish',
      p_notes: 'Friday at the club',
    })
    expect(challenge.error).toBeNull()
    const id = challenge.data as string
    matches.push(id)

    const row = await player.from('matches').select(MATCH_SELECT).eq('id', id).single()
    expect(row.error).toBeNull()
    const m = row.data as unknown as { created_via: string; state: string; profiles: { display_name: string } | null; match_participants: { warband_id: string; accepted_at: string | null; warbands: { name: string; profiles: { display_name: string } | null } | null }[] }
    expect(m.created_via).toBe('challenge')
    expect(m.state).toBe('scheduled')
    expect(m.profiles?.display_name).toBe('Ana')
    const byId = Object.fromEntries(m.match_participants.map((p) => [p.warband_id, p]))
    expect(byId[CLAWS_OF_ESHIN]!.accepted_at).not.toBeNull()
    expect(byId[REIKLAND_WATCH]!.accepted_at).toBeNull()
    expect(byId[REIKLAND_WATCH]!.warbands?.profiles?.display_name).toBe('Tom (GM)')

    // Cannot start before everyone accepts.
    const early = await player.rpc('start_match', { p_match_id: id })
    expect(early.error?.message).toMatch(/not accepted/)

    // The challenged player cannot accept for a warband they do not own.
    const wrong = await player.rpc('respond_to_challenge', { p_match_id: id, p_warband_id: REIKLAND_WATCH, p_accept: true })
    expect(wrong.error?.message).toMatch(/warband owner/)

    const accept = await gm.rpc('respond_to_challenge', { p_match_id: id, p_warband_id: REIKLAND_WATCH, p_accept: true })
    expect(accept.error).toBeNull()
    expect(accept.data).toBe('scheduled')

    const start = await player.rpc('start_match', { p_match_id: id })
    expect(start.error).toBeNull()
    expect(start.data).toBe('in_progress')

    // Live sheet: each side saves its own; the other side can read it.
    const sheet = { version: 1, turn: 2, routed: false, wyrdstoneFound: 1, loot: [], tallies: [{ id: 'x', kind: 'hero', enemiesOutOfAction: 2, outOfAction: 0, note: '' }], notes: '' }
    const save = await player.rpc('save_battle_session', { p_match_id: id, p_warband_id: CLAWS_OF_ESHIN, p_live_state: sheet })
    expect(save.error).toBeNull()
    const forOther = await player.rpc('save_battle_session', { p_match_id: id, p_warband_id: REIKLAND_WATCH, p_live_state: sheet })
    expect(forOther.error?.code).toBe('42501')
    const seen = await gm.from('battle_sessions').select('warband_id, live_state').eq('match_id', id)
    expect(seen.data).toHaveLength(1)
    expect(seen.data?.[0]?.live_state).toMatchObject({ turn: 2 })

    const end = await gm.rpc('end_match', { p_match_id: id })
    expect(end.data).toBe('awaiting_reports')
    const again = await gm.rpc('end_match', { p_match_id: id })
    expect(again.error?.message).toMatch(/not in progress/)

    // Sheets stay editable while reports are pending, then the match is closed to them once completed.
    const late = await player.rpc('save_battle_session', { p_match_id: id, p_warband_id: CLAWS_OF_ESHIN, p_live_state: { ...sheet, turn: 3 } })
    expect(late.error).toBeNull()
  })

  it('declining a two-warband challenge cancels it; the GM can cancel anything', async () => {
    const c = await player.rpc('schedule_match', { p_campaign_id: CAMPAIGN, p_warband_ids: [CLAWS_OF_ESHIN, REIKLAND_WATCH] })
    matches.push(c.data as string)
    const decline = await gm.rpc('respond_to_challenge', { p_match_id: c.data, p_warband_id: REIKLAND_WATCH, p_accept: false })
    expect(decline.data).toBe('cancelled')

    const booked = await gm.rpc('schedule_match', { p_campaign_id: CAMPAIGN, p_warband_ids: [REIKLAND_WATCH, CLAWS_OF_ESHIN], p_scheduled_for: '2026-09-12T19:00:00Z' })
    expect(booked.error).toBeNull()
    matches.push(booked.data as string)
    const parts = await player.from('match_participants').select('accepted_at').eq('match_id', booked.data)
    expect(parts.data?.every((p) => p.accepted_at !== null)).toBe(true)

    const playerCancel = await player.rpc('cancel_match', { p_match_id: booked.data })
    expect(playerCancel.error?.message).toMatch(/only the GM/)
    const gmCancel = await gm.rpc('cancel_match', { p_match_id: booked.data })
    expect(gmCancel.data).toBe('cancelled')
  })

  it('the shared combat log: participants append while the battle runs; anyone at the table may revert once', async () => {
    const m = await gm.rpc('schedule_match', { p_campaign_id: CAMPAIGN, p_warband_ids: [REIKLAND_WATCH, CLAWS_OF_ESHIN] })
    matches.push(m.data as string)
    const payload = {
      attacker_warband_id: CLAWS_OF_ESHIN, attacker_id: 'bbbbbbbb-0000-4000-8000-000000000011', attacker_kind: 'hero', attacker_name: 'Skritch',
      target_warband_id: REIKLAND_WATCH, target_id: 'bbbbbbbb-0000-4000-8000-000000000001', target_kind: 'hero', target_name: 'Captain',
      target_size: 1, wounds_lost: 1, out_of_action: true, kill: true, outcome: 'Out of action', turn: 1,
    }
    // Not in progress yet: refused.
    const early = await player.from('battle_events').insert({ match_id: m.data, actor_id: PLAYER.id, actor_warband_id: CLAWS_OF_ESHIN, kind: 'attack', payload, summary: 'x' })
    expect(early.error).not.toBeNull()

    await gm.rpc('start_match', { p_match_id: m.data })
    const forged = await player.from('battle_events').insert({ match_id: m.data, actor_id: GM.id, actor_warband_id: CLAWS_OF_ESHIN, kind: 'attack', payload, summary: 'x' })
    expect(forged.error).not.toBeNull()
    const ok = await player.from('battle_events').insert({ match_id: m.data, actor_id: PLAYER.id, actor_warband_id: CLAWS_OF_ESHIN, kind: 'attack', payload, summary: 'Turn 1: Skritch took Captain out of action.' }).select('id').single()
    expect(ok.error).toBeNull()

    // Both sides read it.
    const seen = await gm.from('battle_events').select('id, summary, reverted_at').eq('match_id', m.data)
    expect(seen.data).toEqual([{ id: ok.data!.id, summary: 'Turn 1: Skritch took Captain out of action.', reverted_at: null }])

    const reverted = await gm.rpc('revert_battle_event', { p_event_id: ok.data!.id, p_note: 'wrong target' })
    expect(reverted.error).toBeNull()
    const after = await player.from('battle_events').select('reverted_by, revert_note').eq('id', ok.data!.id).single()
    expect(after.data).toEqual({ reverted_by: GM.id, revert_note: 'wrong target' })
    const again = await player.rpc('revert_battle_event', { p_event_id: ok.data!.id })
    expect(again.error?.message).toMatch(/already reverted/)
  })

  it('start_match takes the combat mode from the campaign default, and the lock stops players changing it', async () => {
    const before = await admin.from('campaigns').select('settings').eq('id', CAMPAIGN).single()
    const settings = before.data!.settings as Record<string, unknown>
    try {
      // Default mode, no lock: a player may pick either.
      const a = await gm.rpc('schedule_match', { p_campaign_id: CAMPAIGN, p_warband_ids: [REIKLAND_WATCH, CLAWS_OF_ESHIN] })
      matches.push(a.data as string)
      const startA = await player.rpc('start_match', { p_match_id: a.data, p_combat_mode: 'players' })
      expect(startA.error).toBeNull()
      const rowA = await player.from('matches').select('combat_mode').eq('id', a.data).single()
      expect(rowA.data?.combat_mode).toBe('players')

      // Campaign default "players", locked: a player starting with no choice gets the default,
      // asking for "app" is refused, and the GM may still override.
      await admin.from('campaigns').update({ settings: { ...settings, combatMode: 'players', lockCombatMode: true } }).eq('id', CAMPAIGN)
      const b = await gm.rpc('schedule_match', { p_campaign_id: CAMPAIGN, p_warband_ids: [REIKLAND_WATCH, CLAWS_OF_ESHIN] })
      matches.push(b.data as string)
      const refused = await player.rpc('start_match', { p_match_id: b.data, p_combat_mode: 'app' })
      expect(refused.error?.message).toMatch(/fixed how combat is scored/)
      const startB = await player.rpc('start_match', { p_match_id: b.data })
      expect(startB.error).toBeNull()
      const rowB = await player.from('matches').select('combat_mode').eq('id', b.data).single()
      expect(rowB.data?.combat_mode).toBe('players')

      const c = await gm.rpc('schedule_match', { p_campaign_id: CAMPAIGN, p_warband_ids: [REIKLAND_WATCH, CLAWS_OF_ESHIN] })
      matches.push(c.data as string)
      const startC = await gm.rpc('start_match', { p_match_id: c.data, p_combat_mode: 'app' })
      expect(startC.error).toBeNull()
      const rowC = await gm.from('matches').select('combat_mode').eq('id', c.data).single()
      expect(rowC.data?.combat_mode).toBe('app')
    } finally {
      await admin.from('campaigns').update({ settings }).eq('id', CAMPAIGN)
    }
  })

  it('rejects bad schedules: one warband, duplicates, non-members, a challenge without your warband', async () => {
    const one = await gm.rpc('schedule_match', { p_campaign_id: CAMPAIGN, p_warband_ids: [REIKLAND_WATCH] })
    expect(one.error?.message).toMatch(/at least two/)
    const dup = await gm.rpc('schedule_match', { p_campaign_id: CAMPAIGN, p_warband_ids: [REIKLAND_WATCH, REIKLAND_WATCH] })
    expect(dup.error?.message).toMatch(/twice/)
    const outsider = await player.from('warbands').insert({ name: 'Outsiders', type_rules_id: 'orc_mob' }).select('id').single()
    const notMember = await gm.rpc('schedule_match', { p_campaign_id: CAMPAIGN, p_warband_ids: [REIKLAND_WATCH, outsider.data!.id] })
    expect(notMember.error?.message).toMatch(/enrolled/)
    await admin.from('warbands').delete().eq('id', outsider.data!.id)
    // Ana challenging with two warbands that are not hers: the GM's is the only one she does not own here,
    // so a list without Claws of Eshin fails.
    const notMine = await player.rpc('schedule_match', { p_campaign_id: CAMPAIGN, p_warband_ids: [REIKLAND_WATCH, REIKLAND_WATCH] })
    expect(notMine.error).not.toBeNull()
  })
})
