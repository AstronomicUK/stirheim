import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
const owner = '22222222-2222-4222-8222-222222222222'
describe.skipIf(process.env.SUPABASE_LOCAL !== '1')('Snake Hunter transactions', () => {
  let admin: SupabaseClient, player: SupabaseClient, warband: string, campaign: string, match: string, hero: string
  beforeAll(async () => {
    admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    player = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
    const r = await player.auth.signInWithPassword({ email: 'player@stirheim.test', password: 'stirheim-dev' }); if (r.error) throw r.error
  })
  beforeEach(async () => {
    warband = crypto.randomUUID(); campaign = crypto.randomUUID(); match = crypto.randomUUID(); hero = crypto.randomUUID()
    for (const r of [await admin.from('warbands').insert({ id: warband, name: 'Disposable Snake QA', owner_id: owner, type_rules_id: 'mercenaries_reikland', gold: 100 }), await admin.from('heroes').insert({ id: hero, warband_id: warband, name: 'Charmer', is_hired_sword: true, hired_sword_rules_id: 'snake_charmer', status: 'active', flags: { hireGroupId: hero }, stats: { M: 4, WS: 2, BS: 2, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 7 } }), await admin.from('campaigns').insert({ id: campaign, name: 'Snake QA', gm_id: owner }), await admin.from('matches').insert({ id: match, campaign_id: campaign, created_by: owner, state: 'completed' }), await admin.from('match_participants').insert({ match_id: match, warband_id: warband }), await admin.from('match_reports').insert({ match_id: match, warband_id: warband, submitted_by: owner, status: 'applied', ooa: [], notes: '', undo: {} })]) if (r.error) throw r.error
  })
  afterEach(async () => { await admin.from('campaigns').delete().eq('id', campaign); await admin.from('warbands').delete().eq('id', warband) })
  const hunt = (extra = {}) => player.rpc('hunt_snake', { p_warband_id: warband, p_hero_id: hero, p_match_id: match, p_die: 3, ...extra })
  it('serializes concurrent attempts, records the result and creates only one snake', async () => {
    const results = await Promise.all([hunt(), hunt()])
    expect(results.filter(r => !r.error)).toHaveLength(1)
    expect(results.find(r => r.error)?.error?.message).toContain('already been attempted')
    const rows = (await admin.from('heroes').select('stats,flags,xp').eq('warband_id', warband).neq('id', hero)).data!
    expect(rows).toHaveLength(1); expect(rows[0]).toMatchObject({ stats: { S: 1, I: 5 }, flags: { hireGroupId: hero, hireCompanion: true }, xp: 0 })
    expect((await admin.from('match_reports').select('notes').eq('match_id', match).single()).data?.notes).toContain('caught one snake')
    expect((await player.rpc('withdraw_battle_report', { p_match_id: match, p_warband_id: warband })).error?.message).toContain('Snake Hunter was resolved')
  })
  it('uses strictly under Initiative and requires the danger/hit resolution', async () => {
    expect((await hunt({ p_die: 4 })).error?.message).toContain('danger D6')
    expect((await hunt({ p_die: 4, p_danger_die: 1 })).error?.message).toContain('Resolve the S3 hit')
    expect((await hunt({ p_die: 4, p_danger_die: 1, p_hit_outcome: 'recovered', p_hit_rolls: 'Wound D6 2 against T3: no wound.' })).error).toBeNull()
    expect((await admin.from('heroes').select('id').eq('warband_id', warband)).data).toHaveLength(1)
    expect((await admin.from('heroes').select('flags').eq('id', hero).single()).data?.flags.snakeHuntLog).toContain('No lasting harm')
  })
  it('requires a participating survivor and enforces the five-snake cap', async () => {
    await admin.from('match_reports').update({ ooa: [{ subjectId: hero, count: 1 }] }).eq('match_id', match)
    expect((await hunt()).error?.message).toContain('out of action')
    await admin.from('match_reports').update({ ooa: [] }).eq('match_id', match)
    const base = (await admin.from('heroes').select('*').eq('id', hero).single()).data!
    const result = await admin.from('heroes').insert(Array.from({ length: 5 }, () => ({ warband_id: warband, name: 'Snake', is_hired_sword: true, hired_sword_rules_id: 'snake_charmer', stats: base.stats, flags: { hireGroupId: hero, hireCompanion: true }, status: 'active' })))
    expect(result.error).toBeNull(); expect((await hunt()).error?.message).toContain('five snakes')
  })
  it('removes surviving snakes if the failed hunt kills the Charmer', async () => {
    const stats = (await admin.from('heroes').select('stats').eq('id', hero).single()).data!.stats
    await admin.from('heroes').insert({ warband_id: warband, name: 'Snake', is_hired_sword: true, hired_sword_rules_id: 'snake_charmer', stats, flags: { hireGroupId: hero, hireCompanion: true }, status: 'active' })
    expect((await hunt({ p_die: 5, p_danger_die: 1, p_hit_outcome: 'lost', p_hit_rolls: 'Wound 4, no save, injury 6, recovery 1: lost.' })).error).toBeNull()
    expect((await admin.from('heroes').select('status').eq('id', hero).single()).data?.status).toBe('dead')
    expect((await admin.from('heroes').select('status').eq('warband_id', warband).neq('id', hero).single()).data?.status).toBe('left')
  })
})
