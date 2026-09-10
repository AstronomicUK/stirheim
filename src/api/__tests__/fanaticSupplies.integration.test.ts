import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
const owner = '22222222-2222-4222-8222-222222222222'
describe.skipIf(process.env.SUPABASE_LOCAL !== '1')('Fanatic supply transactions', () => {
  let admin: SupabaseClient, player: SupabaseClient, campaign: string, match: string, warbands: string[], hero: string
  beforeAll(async () => {
    admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    player = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
    const r = await player.auth.signInWithPassword({ email: 'player@stirheim.test', password: 'stirheim-dev' }); if (r.error) throw r.error
  })
  beforeEach(async () => {
    campaign = crypto.randomUUID(); match = crypto.randomUUID(); hero = crypto.randomUUID(); warbands = [crypto.randomUUID(), crypto.randomUUID()]
    for (const r of [await admin.from('campaigns').insert({ id: campaign, name: 'Disposable traps QA', gm_id: owner }), await admin.from('warbands').insert(warbands.map(id => ({ id, owner_id: owner, name: 'Trap QA', type_rules_id: 'night_goblins', gold: 100 }))), await admin.from('matches').insert({ id: match, campaign_id: campaign, created_by: owner, state: 'scheduled' }), await admin.from('match_participants').insert(warbands.map(warband_id => ({ match_id: match, warband_id, accepted_at: new Date().toISOString() }))), await admin.from('heroes').insert({ id: hero, warband_id: warbands[0], name: 'Trapmaster', unit_type_rules_id: 'lustrian_reavers_trapmaster', stats: { M: 4, WS: 4, BS: 4, S: 3, T: 3, W: 1, I: 4, A: 1, Ld: 8 }, is_hired_sword: false, status: 'active', flags: {} })]) if (r.error) throw r.error
  })
  afterEach(async () => { await admin.from('campaigns').delete().eq('id', campaign); await admin.from('warbands').delete().in('id', warbands) })
  const start = () => player.rpc('start_match', { p_match_id: match })
  async function seed(doses: number, weapons = 2) {
    const id = crypto.randomUUID()
    const rows = [await admin.from('henchman_groups').insert({ id, warband_id: warbands[0], name: 'Fanatics', unit_type_rules_id: 'night_goblins_fanatics', size: 2, stats: { M: 4, WS: 2, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 5 }, xp: 0 }), await admin.from('items').insert({ warband_id: warbands[0], holder_type: 'group', holder_id: id, item_rules_id: 'ball_and_chain', quantity: weapons })]
    if (doses) rows.push(await admin.from('items').insert({ warband_id: warbands[0], holder_type: 'stash', item_rules_id: 'mad_cap_mushrooms', quantity: doses }))
    for (const r of rows) if (r.error) throw r.error
    return id
  }
  it('splits identical kit and feeds just one model from one dose', async () => {
    await seed(1)
    expect((await start()).error).toBeNull()
    const groups = (await admin.from('henchman_groups').select('*').eq('warband_id', warbands[0])).data!
    expect(groups).toHaveLength(2)
    expect(groups.every(g => g.size === 1)).toBe(true)
    expect(groups.filter(g => !g.campaign_state.fanaticSittingOut)).toHaveLength(1)
    const items = (await admin.from('items').select('*').eq('warband_id', warbands[0])).data!
    expect(items.filter(i => i.item_rules_id === 'ball_and_chain').map(i => i.quantity)).toEqual([1, 1])
    expect(items.some(i => i.item_rules_id === 'mad_cap_mushrooms')).toBe(false)
    expect((await start()).error?.message).toContain('already')
  })
  it('sits everyone out without doses', async () => {
    await seed(0)
    expect((await start()).error).toBeNull()
    const groups = (await admin.from('henchman_groups').select('campaign_state').eq('warband_id', warbands[0])).data!
    expect(groups.every(g => g.campaign_state.fanaticSittingOut)).toBe(true)
  })
  it('does not partly split a group or start a battle when its kit cannot be divided', async () => {
    const id = await seed(2, 1)
    expect((await start()).error?.message).toContain('equip the Fanatics alike')
    expect((await admin.from('matches').select('state').eq('id', match).single()).data?.state).toBe('scheduled')
    expect((await admin.from('henchman_groups').select('size').eq('id', id).single()).data?.size).toBe(2)
    expect((await admin.from('items').select('quantity').eq('warband_id', warbands[0]).eq('item_rules_id', 'mad_cap_mushrooms').single()).data?.quantity).toBe(2)
  })
})
