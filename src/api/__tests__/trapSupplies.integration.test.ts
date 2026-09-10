import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
const owner = '22222222-2222-4222-8222-222222222222'
describe.skipIf(process.env.SUPABASE_LOCAL !== '1')('Trapmaster supply transactions', () => {
  let admin: SupabaseClient, player: SupabaseClient, campaign: string, match: string, warbands: string[], hero: string
  beforeAll(async () => {
    admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    player = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
    const r = await player.auth.signInWithPassword({ email: 'player@stirheim.test', password: 'stirheim-dev' }); if (r.error) throw r.error
  })
  beforeEach(async () => {
    campaign = crypto.randomUUID(); match = crypto.randomUUID(); hero = crypto.randomUUID(); warbands = [crypto.randomUUID(), crypto.randomUUID()]
    for (const r of [await admin.from('campaigns').insert({ id: campaign, name: 'Disposable traps QA', gm_id: owner }), await admin.from('warbands').insert(warbands.map(id => ({ id, owner_id: owner, name: 'Trap QA', type_rules_id: 'lustrian_reavers', gold: 100 }))), await admin.from('matches').insert({ id: match, campaign_id: campaign, created_by: owner, state: 'scheduled' }), await admin.from('match_participants').insert(warbands.map(warband_id => ({ match_id: match, warband_id, accepted_at: new Date().toISOString() }))), await admin.from('heroes').insert({ id: hero, warband_id: warbands[0], name: 'Trapmaster', unit_type_rules_id: 'lustrian_reavers_trapmaster', stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 }, is_hired_sword: false, status: 'active', flags: {} })]) if (r.error) throw r.error
  })
  afterEach(async () => { await admin.from('campaigns').delete().eq('id', campaign); await admin.from('warbands').delete().in('id', warbands) })
  const order = (n: number) => player.rpc('set_trap_order', { p_match_id: match, p_hero_id: hero, p_extra: n })
  const start = () => player.rpc('start_match', { p_match_id: match })
  it('reserves without payment, charges once at start and atomically consumes the limited supply', async () => {
    expect((await order(2)).error).toBeNull()
    expect((await admin.from('warbands').select('gold').eq('id', warbands[0]).single()).data?.gold).toBe(100)
    expect((await start()).error).toBeNull()
    expect((await admin.from('warbands').select('gold').eq('id', warbands[0]).single()).data?.gold).toBe(90)
    expect((await admin.from('heroes').select('flags').eq('id', hero).single()).data?.flags).toMatchObject({ trapSupplyBought: 2, trapSupplyRemaining: 3, trapSupplyMatch: match })
    expect((await start()).error?.message).toContain('already')
    const used = await Promise.all(Array.from({ length: 4 }, () => player.rpc('use_trap_supply', { p_match_id: match, p_hero_id: hero })))
    expect(used.filter(r => !r.error)).toHaveLength(3)
    expect(used.find(r => r.error)?.error?.message).toContain('No traps remain')
  })
  it('rejects excess orders and rolls an unaffordable start back completely', async () => {
    expect((await order(6)).error?.message).toContain('zero to five')
    expect((await order(5)).error).toBeNull()
    await admin.from('warbands').update({ gold: 10 }).eq('id', warbands[0])
    expect((await start()).error?.message).toContain('25 gc')
    expect((await admin.from('matches').select('state').eq('id', match).single()).data?.state).toBe('scheduled')
    expect((await admin.from('warbands').select('gold').eq('id', warbands[0]).single()).data?.gold).toBe(10)
    expect((await admin.from('heroes').select('flags').eq('id', hero).single()).data?.flags.trapSupplyMatch).toBeUndefined()
    expect((await order(1)).error).toBeNull(); expect((await start()).error).toBeNull()
  })
  it('grants one free trap by default, and rejects orders after starting', async () => {
    expect((await start()).error).toBeNull()
    expect((await admin.from('heroes').select('flags').eq('id', hero).single()).data?.flags.trapSupplyRemaining).toBe(1)
    expect((await admin.from('warbands').select('gold').eq('id', warbands[0]).single()).data?.gold).toBe(100)
    expect((await order(1)).error?.message).toContain('before the battle starts')
  })
})
