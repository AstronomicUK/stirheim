import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
const owner = '22222222-2222-4222-8222-222222222222'
const stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }
describe.skipIf(process.env.SUPABASE_LOCAL !== '1')('Direct scenario equipment transactions', () => {
  let admin: SupabaseClient, player: SupabaseClient, campaign: string, match: string, warbands: string[], heroes: string[], item: string
  beforeAll(async () => {
    admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    player = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
    const r = await player.auth.signInWithPassword({ email: 'player@stirheim.test', password: 'stirheim-dev' }); if (r.error) throw r.error
  })
  beforeEach(async () => {
    campaign = crypto.randomUUID(); match = crypto.randomUUID(); item = crypto.randomUUID(); warbands = [crypto.randomUUID(), crypto.randomUUID()]; heroes = [crypto.randomUUID(), crypto.randomUUID()]
    for (const r of [await admin.from('campaigns').insert({ id: campaign, name: 'Disposable scenario equipment QA', gm_id: owner }), await admin.from('warbands').insert(warbands.map(id => ({ id, owner_id: owner, name: 'Reward QA', type_rules_id: 'cult_of_the_possessed', gold: 100 }))), await admin.from('matches').insert({ id: match, campaign_id: campaign, created_by: owner, state: 'awaiting_reports' }), await admin.from('match_participants').insert(warbands.map(warband_id => ({ match_id: match, warband_id }))), await admin.from('heroes').insert(heroes.map((id, i) => ({ id, warband_id: warbands[i], name: 'Mutant', unit_type_rules_id: 'cult_of_the_possessed_mutants', stats, skills: ['dodge'], spells: [], notes: 'Before reward', is_hired_sword: false, status: 'active' }))), await admin.from('items').insert({ id: item, warband_id: warbands[0], holder_type: 'hero', holder_id: heroes[0], item_rules_id: 'sword', quantity: 1, notes: 'Original kit' })]) if (r.error) throw r.error
  })
  afterEach(async () => { await admin.from('campaigns').delete().eq('id', campaign); await admin.from('warbands').delete().in('id', warbands) })
  const award = () => ({ holder_type: 'hero', holder_id: heroes[0], item_rules_id: 'chaos_armour', custom_name: null, quantity: 1, notes: 'Kidnapped reward' })
  const file = (extra: object) => player.rpc('submit_battle_report', { p_match_id: match, p_warband_id: warbands[0], p_report: { result: 'lost', won: false, routed: false, applied: { warband: { gold_delta: 5, wyrdstone_delta: 0 }, ...extra } } })
  const withdraw = () => player.rpc('withdraw_battle_report', { p_match_id: match, p_warband_id: warbands[0] })
  it('saves warrior rewards and owned equipment, then restores them exactly on withdrawal', async () => {
    expect((await file({ heroes: [{ id: heroes[0], patch: { skills: [], spells: ['test-spell'], notes: 'Reward applied', stats: { ...stats, S: 4 } } }], awarded_items: [award()] })).error).toBeNull()
    expect((await admin.from('heroes').select('skills,spells,notes,stats').eq('id', heroes[0]).single()).data).toMatchObject({ skills: [], spells: ['test-spell'], notes: 'Reward applied', stats: { S: 4 } })
    expect((await admin.from('items').select('holder_id,notes').eq('warband_id', warbands[0]).eq('item_rules_id', 'chaos_armour').single()).data).toEqual({ holder_id: heroes[0], notes: 'Kidnapped reward' })
    expect((await withdraw()).error).toBeNull()
    expect((await admin.from('heroes').select('skills,spells,notes,stats').eq('id', heroes[0]).single()).data).toMatchObject({ skills: ['dodge'], spells: [], notes: 'Before reward', stats })
    expect((await admin.from('items').select('id').eq('warband_id', warbands[0])).data).toEqual([{ id: item }])
  })
  it('rejects a foreign recipient and rolls back every preceding change', async () => {
    const r = await file({ heroes: [{ id: heroes[0], patch: { skills: [] } }], awarded_items: [{ ...award(), holder_id: heroes[1] }] })
    expect(r.error?.message).toContain('not an active warrior in this warband')
    expect((await admin.from('warbands').select('gold').eq('id', warbands[0]).single()).data?.gold).toBe(100)
    expect((await admin.from('heroes').select('skills').eq('id', heroes[0]).single()).data?.skills).toEqual(['dodge'])
  })
  it('protects subsequently changed awards', async () => {
    expect((await file({ awarded_items: [award()] })).error).toBeNull()
    expect((await admin.from('items').update({ notes: 'Used in another battle' }).eq('warband_id', warbands[0]).eq('item_rules_id', 'chaos_armour')).error).toBeNull()
    expect((await withdraw()).error?.message).toContain('scenario equipment has changed')
    expect((await admin.from('warbands').select('gold').eq('id', warbands[0]).single()).data?.gold).toBe(105)
  })
  it('moves existing kit without duplicating it and restores the original holder', async () => {
    expect((await file({ item_patches: [{ id: item, holder_type: 'stash', holder_id: null }] })).error).toBeNull()
    expect((await admin.from('items').select('holder_type,holder_id').eq('id', item).single()).data).toEqual({ holder_type: 'stash', holder_id: null })
    expect((await withdraw()).error).toBeNull()
    expect((await admin.from('items').select('holder_type,holder_id').eq('id', item).single()).data).toEqual({ holder_type: 'hero', holder_id: heroes[0] })
  })
  it('withdraws newly recruited groups with their original report-awarded kit', async () => {
    const group=crypto.randomUUID()
    expect((await file({new_groups:[{id:group,name:'Crew',unit_type_rules_id:'pirates_crew',size:1,stats,xp:0,level_ups:0}],awarded_items:[{holder_type:'group',holder_id:group,item_rules_id:'dagger',custom_name:null,quantity:1}]})).error).toBeNull()
    expect((await withdraw()).error).toBeNull()
    expect((await admin.from('henchman_groups').select('id').eq('id',group)).data).toEqual([])
    expect((await admin.from('items').select('id').eq('warband_id',warbands[0]).eq('item_rules_id','dagger')).data).toEqual([])
  })
  it('restores a casualty stack exactly, but refuses to overwrite a later equipment edit', async () => {
    expect((await admin.from('items').update({quantity:3}).eq('id',item)).error).toBeNull()
    expect((await file({item_patches:[{id:item,quantity:2}]})).error).toBeNull()
    expect((await admin.from('items').update({quantity:4}).eq('id',item)).error).toBeNull()
    expect((await withdraw()).error?.message).toContain('report equipment has changed')
    expect((await admin.from('items').select('quantity').eq('id',item).single()).data?.quantity).toBe(4)
    expect((await admin.from('items').update({quantity:2}).eq('id',item)).error).toBeNull()
    expect((await withdraw()).error).toBeNull()
    expect((await admin.from('items').select('quantity').eq('id',item).single()).data?.quantity).toBe(3)
  })
  it('restores a completely lost equipment row on withdrawal', async () => {
    expect((await file({item_patches:[{id:item,quantity:0}]})).error).toBeNull()
    expect((await admin.from('items').select('id').eq('id',item)).data).toEqual([])
    expect((await withdraw()).error).toBeNull()
    expect((await admin.from('items').select('quantity').eq('id',item).single()).data?.quantity).toBe(1)
  })

  it('does not overwrite a henchman group edited after the report', async () => {
    const group=crypto.randomUUID()
    expect((await admin.from('henchman_groups').insert({id:group,warband_id:warbands[0],name:'Crew',unit_type_rules_id:'pirates_crew',size:2,stats})).error).toBeNull()
    expect((await file({groups:[{id:group,patch:{size:1}}]})).error).toBeNull()
    expect((await admin.from('henchman_groups').update({size:3}).eq('id',group)).error).toBeNull()
    expect((await withdraw()).error?.message).toContain('henchman group has changed')
    expect((await admin.from('henchman_groups').update({size:1}).eq('id',group)).error).toBeNull()
    expect((await withdraw()).error).toBeNull()
    expect((await admin.from('henchman_groups').select('size').eq('id',group).single()).data?.size).toBe(2)
  })

})
