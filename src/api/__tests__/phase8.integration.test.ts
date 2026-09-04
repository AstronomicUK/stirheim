// Phase 8 SQL functions against the LOCAL stack (SUPABASE_LOCAL=1): update_roster with client
// ids, resolve_pending_advance and record_trade (supabase/migrations/20260904000008_advances_trading.sql).

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const enabled = process.env.SUPABASE_LOCAL === '1'
const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const anonKey = process.env.SUPABASE_ANON_KEY ?? ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

const PLAYER = { email: 'player@stirheim.test', password: 'stirheim-dev', id: '22222222-2222-4222-8222-222222222222' }
const GM = { email: 'gm@stirheim.test', password: 'stirheim-dev', id: '11111111-1111-4111-8111-111111111111' }
const STRANGER = { email: 'stranger-phase8@stirheim.test', password: 'stirheim-dev' }
const CAMPAIGN = 'dddddddd-0000-4000-8000-000000000001'
const REIKLAND_WATCH = 'aaaaaaaa-0000-4000-8000-000000000001'
const CLAWS_OF_ESHIN = 'aaaaaaaa-0000-4000-8000-000000000002'
const CAPTAIN = 'bbbbbbbb-0000-4000-8000-000000000001'
const SKRITCH = 'bbbbbbbb-0000-4000-8000-000000000011'
const QUEEK = 'bbbbbbbb-0000-4000-8000-000000000012'
const NEW_HERO = 'f8f8f8f8-0000-4000-8000-000000000001'
const NEW_GROUP = 'f8f8f8f8-0000-4000-8000-000000000002'
const NEW_ITEM = 'f8f8f8f8-0000-4000-8000-000000000003'
const STATS = { M: 6, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 5 }

function client(): SupabaseClient {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

describe.skipIf(!enabled)('phase 8 functions', () => {
  let player: SupabaseClient
  let gm: SupabaseClient
  let stranger: SupabaseClient
  let admin: SupabaseClient
  let strangerId: string | undefined
  let matchId: string | undefined

  beforeAll(async () => {
    admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const created = await admin.auth.admin.createUser({ email: STRANGER.email, password: STRANGER.password, email_confirm: true })
    if (created.error) throw created.error
    strangerId = created.data.user.id
    player = client()
    gm = client()
    stranger = client()
    const a = await player.auth.signInWithPassword(PLAYER)
    const b = await gm.auth.signInWithPassword(GM)
    const c = await stranger.auth.signInWithPassword(STRANGER)
    if (a.error || b.error || c.error) throw a.error ?? b.error ?? c.error
  })

  afterAll(async () => {
    if (matchId) await admin.from('matches').delete().eq('id', matchId)
    await admin.from('items').delete().in('holder_id', [NEW_HERO, NEW_GROUP])
    await admin.from('items').delete().eq('id', NEW_ITEM)
    await admin.from('heroes').delete().eq('id', NEW_HERO)
    await admin.from('henchman_groups').delete().eq('id', NEW_GROUP)
    await admin.from('pending_advances').delete().in('warband_id', [CLAWS_OF_ESHIN, REIKLAND_WATCH])
    await admin.from('heroes').update({ level_ups: 8, stats: { M: 6, WS: 4, BS: 4, S: 4, T: 3, W: 1, I: 5, A: 1, Ld: 7 } }).eq('id', SKRITCH)
    await admin.from('warbands').update({ gold: 20, wyrdstone: 2 }).eq('id', CLAWS_OF_ESHIN)
    if (strangerId) await admin.auth.admin.deleteUser(strangerId)
  })

  it('update_roster honours a client id on insert so items can reference the new warrior in the same batch', async () => {
    const changes = [
      {
        table: 'heroes',
        op: 'insert',
        id: NEW_HERO,
        data: { name: 'Skreek', unit_type_rules_id: 'skaven_night_runners', stats: STATS, skill_tables: ['combat', 'speed'], sort_order: 3 },
      },
      { table: 'items', op: 'insert', data: { holder_type: 'hero', holder_id: NEW_HERO, item_rules_id: 'dagger', quantity: 1 } },
      { table: 'henchman_groups', op: 'insert', id: NEW_GROUP, data: { name: 'Rat Ogre', unit_type_rules_id: 'skaven_rat_ogre', size: 1, stats: STATS, is_large: true } },
      { table: 'items', op: 'insert', id: NEW_ITEM, data: { holder_type: 'group', holder_id: NEW_GROUP, item_rules_id: 'sword', quantity: 1 } },
    ]
    const { data: count, error } = await player.rpc('update_roster', { p_warband_id: CLAWS_OF_ESHIN, p_reason: 'recruitment', p_changes: changes })
    expect(error).toBeNull()
    expect(count).toBe(4)

    const hero = await player.from('heroes').select('id, name, warband_id').eq('id', NEW_HERO).single()
    expect(hero.data).toEqual({ id: NEW_HERO, name: 'Skreek', warband_id: CLAWS_OF_ESHIN })
    const heroItems = await player.from('items').select('holder_type, holder_id, item_rules_id').eq('holder_id', NEW_HERO)
    expect(heroItems.data).toEqual([{ holder_type: 'hero', holder_id: NEW_HERO, item_rules_id: 'dagger' }])
    const groupItem = await player.from('items').select('id, holder_type, holder_id').eq('id', NEW_ITEM).single()
    expect(groupItem.data).toEqual({ id: NEW_ITEM, holder_type: 'group', holder_id: NEW_GROUP })

    // Without an id the database still generates one.
    const anon = await player.rpc('update_roster', {
      p_warband_id: CLAWS_OF_ESHIN,
      p_reason: 'trading',
      p_changes: [{ table: 'items', op: 'insert', data: { holder_type: 'stash', item_rules_id: 'rope_and_hook', quantity: 1 } }],
    })
    expect(anon.error).toBeNull()
    const stashed = await player.from('items').select('id').eq('warband_id', CLAWS_OF_ESHIN).eq('item_rules_id', 'rope_and_hook')
    expect(stashed.data).toHaveLength(1)
    await admin.from('items').delete().eq('id', stashed.data![0]!.id)

    // An item pointing at a warrior that is not in the batch (or the warband) fails the whole batch.
    const bad = await player.rpc('update_roster', {
      p_warband_id: CLAWS_OF_ESHIN,
      p_reason: 'recruitment',
      p_changes: [
        { table: 'warbands', op: 'update', data: { gold: 1 } },
        { table: 'items', op: 'insert', data: { holder_type: 'hero', holder_id: CAPTAIN, item_rules_id: 'dagger', quantity: 1 } },
      ],
    })
    expect(bad.error?.message).toMatch(/not a hero of warband/)
    const gold = await player.from('warbands').select('gold').eq('id', CLAWS_OF_ESHIN).single()
    expect(gold.data?.gold).toBe(20)
  })

  it('resolve_pending_advance applies the changes, closes the row once, and is refused for warbands you cannot edit', async () => {
    const inserted = await admin
      .from('pending_advances')
      .insert({ warband_id: CLAWS_OF_ESHIN, subject_type: 'hero', subject_id: SKRITCH, threshold_xp: 24 })
      .select('id')
      .single()
    if (inserted.error) throw inserted.error
    const advanceId = inserted.data.id as string

    const resolution = { roll: 9, kind: 'stat', stat: 'WS', from: 4, to: 5 }
    const changes = [{ table: 'heroes', op: 'update', id: SKRITCH, data: { level_ups: 9, stats: { M: 6, WS: 5, BS: 4, S: 4, T: 3, W: 1, I: 5, A: 1, Ld: 7 } } }]

    const asStranger = await stranger.rpc('resolve_pending_advance', { p_advance_id: advanceId, p_resolution: resolution, p_changes: changes })
    expect(asStranger.error?.message).toMatch(/not found/)

    const ok = await player.rpc('resolve_pending_advance', { p_advance_id: advanceId, p_resolution: resolution, p_changes: changes })
    expect(ok.error).toBeNull()
    expect(ok.data).toBe(1)

    const hero = await player.from('heroes').select('level_ups, stats').eq('id', SKRITCH).single()
    expect(hero.data?.level_ups).toBe(9)
    expect(hero.data?.stats).toMatchObject({ WS: 5 })
    const row = await player.from('pending_advances').select('resolved_at, resolution').eq('id', advanceId).single()
    expect(row.data?.resolved_at).not.toBeNull()
    expect(row.data?.resolution).toEqual(resolution)
    const audit = await player.from('audit_log').select('reason').eq('row_id', SKRITCH).eq('reason', 'advancement')
    expect(audit.data?.length).toBeGreaterThan(0)

    const again = await player.rpc('resolve_pending_advance', { p_advance_id: advanceId, p_resolution: resolution, p_changes: [] })
    expect(again.error?.message).toMatch(/already been resolved/)
    const stillNine = await player.from('heroes').select('level_ups').eq('id', SKRITCH).single()
    expect(stillNine.data?.level_ups).toBe(9)

    // A fellow player can read the GM's warband (same campaign) but not resolve its advances.
    const theirs = await admin
      .from('pending_advances')
      .insert({ warband_id: REIKLAND_WATCH, subject_type: 'hero', subject_id: CAPTAIN, threshold_xp: 24 })
      .select('id')
      .single()
    if (theirs.error) throw theirs.error
    const notMine = await player.rpc('resolve_pending_advance', { p_advance_id: theirs.data.id, p_resolution: {}, p_changes: [] })
    expect(notMine.error?.code).toBe('42501')
    expect(notMine.error?.message).toMatch(/only the warband owner or the GM/)
    const untouched = await gm.from('pending_advances').select('resolved_at').eq('id', theirs.data.id).single()
    expect(untouched.data?.resolved_at).toBeNull()

    // A resolution may queue follow-up advances (promotion): they open under the same warband.
    const promo = await admin
      .from('pending_advances')
      .insert({ warband_id: CLAWS_OF_ESHIN, subject_type: 'hero', subject_id: SKRITCH, threshold_xp: 30 })
      .select('id')
      .single()
    if (promo.error) throw promo.error
    const newHeroId = crypto.randomUUID()
    const withFollowUps = await player.rpc('resolve_pending_advance', {
      p_advance_id: promo.data.id,
      p_resolution: { outcome: 'promotion', followUps: [{ subjectType: 'hero', subjectId: newHeroId, thresholdXp: 30 }] },
      p_changes: [],
    })
    expect(withFollowUps.error).toBeNull()
    const queued = await player.from('pending_advances').select('threshold_xp').eq('subject_id', newHeroId).is('resolved_at', null)
    expect(queued.data).toEqual([{ threshold_xp: 30 }])

    // The veteran pool may be spent down to 0 (null still means "not rolled").
    const spent = await player.rpc('update_roster', {
      p_warband_id: CLAWS_OF_ESHIN,
      p_reason: 'recruitment',
      p_changes: [{ table: 'warbands', op: 'update', data: { veteran_pool: 0 } }],
    })
    expect(spent.error).toBeNull()
  })

  it('record_trade applies the batch, keeps the once-per-phase state, and refuses repeats', async () => {
    const m = await gm.rpc('schedule_match', { p_campaign_id: CAMPAIGN, p_warband_ids: [REIKLAND_WATCH, CLAWS_OF_ESHIN], p_scenario_rules_id: 'skirmish' })
    if (m.error) throw m.error
    matchId = m.data as string

    // No phase: changes apply, nothing is recorded.
    const free = await player.rpc('record_trade', {
      p_warband_id: CLAWS_OF_ESHIN,
      p_match_id: null,
      p_changes: [{ table: 'warbands', op: 'update', data: { gold: 25 } }],
      p_wyrdstone_sold: true,
      p_heroes_searched: [SKRITCH],
    })
    expect(free.error).toBeNull()
    expect(free.data).toBe(1)
    const none = await player.from('trade_phase_state').select('match_id').eq('warband_id', CLAWS_OF_ESHIN)
    expect(none.data).toEqual([])

    const first = await player.rpc('record_trade', {
      p_warband_id: CLAWS_OF_ESHIN,
      p_match_id: matchId,
      p_changes: [{ table: 'warbands', op: 'update', data: { gold: 60, wyrdstone: 0 } }],
      p_wyrdstone_sold: true,
      p_heroes_searched: [SKRITCH],
    })
    expect(first.error).toBeNull()
    expect(first.data).toBe(1)
    const state = await player.from('trade_phase_state').select('wyrdstone_sold, heroes_searched').eq('warband_id', CLAWS_OF_ESHIN).eq('match_id', matchId).single()
    expect(state.data).toEqual({ wyrdstone_sold: true, heroes_searched: [SKRITCH] })
    const audit = await player.from('audit_log').select('reason').eq('warband_id', CLAWS_OF_ESHIN).eq('reason', 'trading')
    expect(audit.data?.length).toBeGreaterThan(0)

    // A second sale fails and rolls the roster change back with it.
    const resell = await player.rpc('record_trade', {
      p_warband_id: CLAWS_OF_ESHIN,
      p_match_id: matchId,
      p_changes: [{ table: 'warbands', op: 'update', data: { gold: 999 } }],
      p_wyrdstone_sold: true,
      p_heroes_searched: [],
    })
    expect(resell.error?.message).toMatch(/wyrdstone already sold/)
    const gold = await player.from('warbands').select('gold').eq('id', CLAWS_OF_ESHIN).single()
    expect(gold.data?.gold).toBe(60)

    // The same hero cannot search twice; a different one can, and the state accumulates.
    const research = await player.rpc('record_trade', { p_warband_id: CLAWS_OF_ESHIN, p_match_id: matchId, p_changes: [], p_wyrdstone_sold: false, p_heroes_searched: [QUEEK, SKRITCH] })
    expect(research.error?.message).toMatch(/already searched/)
    const second = await player.rpc('record_trade', { p_warband_id: CLAWS_OF_ESHIN, p_match_id: matchId, p_changes: [], p_wyrdstone_sold: false, p_heroes_searched: [QUEEK] })
    expect(second.error).toBeNull()
    expect(second.data).toBe(0)
    const after = await player.from('trade_phase_state').select('wyrdstone_sold, heroes_searched').eq('warband_id', CLAWS_OF_ESHIN).eq('match_id', matchId).single()
    expect(after.data).toEqual({ wyrdstone_sold: true, heroes_searched: [SKRITCH, QUEEK] })

    // Not yours: a stranger sees no warband; a fellow player cannot write the GM's.
    const asStranger = await stranger.rpc('record_trade', { p_warband_id: CLAWS_OF_ESHIN, p_match_id: matchId, p_changes: [], p_wyrdstone_sold: false, p_heroes_searched: [] })
    expect(asStranger.error?.message).toMatch(/not found/)
    const notMine = await player.rpc('record_trade', { p_warband_id: REIKLAND_WATCH, p_match_id: matchId, p_changes: [], p_wyrdstone_sold: true, p_heroes_searched: [] })
    expect(notMine.error).not.toBeNull()
    const theirs = await gm.from('trade_phase_state').select('match_id').eq('warband_id', REIKLAND_WATCH)
    expect(theirs.data).toEqual([])
  })
})
