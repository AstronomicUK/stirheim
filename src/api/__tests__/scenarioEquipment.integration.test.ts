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
  it('validates a Brigands survivor, logs its actual hire and protects the claimed report', async () => {
    expect((await file({scenario_free_hire:{choices:['warlock']}})).error).toBeNull()
    const report=(await admin.from('match_reports').select('id').eq('match_id',match).single()).data!
    const hire={warband_id:warbands[0],name:'Earned outlaw',is_hired_sword:true,status:'active',hired_sword_rules_id:'warlock',stats,flags:{returningFavourReportId:`${report.id}:brigands`}}
    expect((await admin.from('heroes').insert({...hire,hired_sword_rules_id:'highwayman'})).error?.message).toContain('not available')
    expect((await admin.from('heroes').insert(hire)).error).toBeNull()
    expect((await admin.from('match_reports').select('notes').eq('id',report.id).single()).data?.notes).toContain('Earned outlaw')
    expect((await admin.from('heroes').insert(hire)).error).not.toBeNull()
    expect((await withdraw()).error?.message).toContain('free hire')
  })
  async function transferFixture(quantity=2){
    expect((await admin.from('matches').update({scenario_rules_id:'stop_thief'}).eq('id',match)).error).toBeNull()
    const source=(await admin.from('items').insert({warband_id:warbands[1],holder_type:'hero',holder_id:heroes[1],item_rules_id:'sword',quantity,notes:'Original named blade'}).select('*').single()).data!
    return {item_id:source.id,from_warband_id:warbands[1],quantity:1,expected:source,reason:'Recovered the stolen blade'}
  }
  it('transfers one existing copy, logs it, and restores both rosters on withdrawal',async()=>{
    const t=await transferFixture()
    expect((await file({scenario_item_transfers:[t]})).error).toBeNull()
    expect((await admin.from('items').select('quantity').eq('id',t.item_id).single()).data?.quantity).toBe(1)
    expect((await admin.from('items').select('quantity,notes').eq('warband_id',warbands[0]).eq('holder_type','stash')).data).toEqual([{quantity:1,notes:'Original named blade'}])
    expect((await withdraw()).error).toBeNull()
    expect((await admin.from('items').select('quantity,holder_id').eq('id',t.item_id).single()).data).toEqual({quantity:2,holder_id:heroes[1]})
    expect((await admin.from('items').select('id').eq('warband_id',warbands[0]).eq('holder_type','stash')).data).toEqual([])
  })
  it('restores a completely transferred source stack with the original identity',async()=>{
    const t=await transferFixture(1)
    expect((await file({scenario_item_transfers:[t]})).error).toBeNull()
    expect((await admin.from('items').select('id').eq('id',t.item_id)).data).toEqual([])
    expect((await withdraw()).error).toBeNull()
    expect((await admin.from('items').select('id,quantity').eq('id',t.item_id).single()).data).toEqual({id:t.item_id,quantity:1})
  })
  it('rejects stale source snapshots and duplicate claims without changing either roster',async()=>{
    const t=await transferFixture()
    expect((await file({scenario_item_transfers:[t,t]})).error?.message).toContain('only once')
    await admin.from('items').update({notes:'Later change'}).eq('id',t.item_id)
    expect((await file({scenario_item_transfers:[t]})).error?.message).toContain('source equipment changed')
    expect((await admin.from('items').select('quantity').eq('id',t.item_id).single()).data?.quantity).toBe(2)
    expect((await admin.from('warbands').select('gold').eq('id',warbands[0]).single()).data?.gold).toBe(100)
  })
  it('protects later source and destination changes before undoing a transfer',async()=>{
    const t=await transferFixture()
    expect((await file({scenario_item_transfers:[t]})).error).toBeNull()
    await admin.from('items').update({quantity:3}).eq('id',t.item_id)
    expect((await withdraw()).error?.message).toContain('source equipment changed')
    await admin.from('items').update({quantity:1}).eq('id',t.item_id)
    await admin.from('items').update({notes:'Later recipient edit'}).eq('warband_id',warbands[0]).eq('holder_type','stash')
    expect((await withdraw()).error?.message).toContain('scenario equipment has changed')
    expect((await admin.from('items').select('quantity').eq('id',t.item_id).single()).data?.quantity).toBe(1)
  })
  it('does not allow transfers in unrelated scenarios',async()=>{
    const t=await transferFixture();await admin.from('matches').update({scenario_rules_id:'skirmish'}).eq('id',match)
    expect((await file({scenario_item_transfers:[t]})).error?.message).toContain('does not permit')
  })
  it('checks shared Forbidden Square setup and combined scores across reports',async()=>{
    await admin.from('matches').update({scenario_rules_id:'the_forbidden_square'}).eq('id',match)
    expect((await file({scenario_counter_score:{placed:14,scored:11,role:'infiltrator'}})).error).toBeNull()
    const other=(placed:number,scored:number)=>player.rpc('submit_battle_report',{p_match_id:match,p_warband_id:warbands[1],p_report:{result:'won',won:true,routed:false,applied:{heroes:[],groups:[],warband:{gold_delta:0,wyrdstone_delta:0},scenario_counter_score:{placed,scored,role:'cultist'}}}})
    expect((await other(15,3)).error?.message).toContain('disagree')
    expect((await other(14,4)).error?.message).toContain('Combined counter')
    expect((await other(14,3)).error).toBeNull()
  })
  it('captures the full camp stash, detects new omitted stacks, and restores it on withdrawal',async()=>{
    await admin.from('matches').update({scenario_rules_id:'encampment_raid'}).eq('id',match)
    const source=(await admin.from('items').insert({warband_id:warbands[1],holder_type:'stash',item_rules_id:'sword',quantity:3,notes:'Defender stash'}).select('*').single()).data!
    const capture={defender_id:warbands[1],camp:'Sigmarhaven hut',treatment:'occupy',eligible:true}
    const transfer={item_id:source.id,from_warband_id:warbands[1],quantity:3,expected:source,reason:'Camp captured'}
    const submit=(transfers:object[],claimed=capture)=>player.rpc('submit_battle_report',{p_match_id:match,p_warband_id:warbands[0],p_report:{result:'won',won:true,routed:false,applied:{warband:{gold_delta:0,wyrdstone_delta:0},encampment_capture:claimed,scenario_item_transfers:transfers}}})
    expect((await submit([transfer],{...capture,eligible:false})).error?.message).toContain('eligibility')
    const added=(await admin.from('items').insert({warband_id:warbands[1],holder_type:'stash',item_rules_id:'helmet',quantity:1}).select('*').single()).data!
    expect((await submit([transfer])).error?.message).toContain('complete defender stash changed')
    expect((await admin.from('items').select('quantity').eq('id',source.id).single()).data?.quantity).toBe(3)
    const second={item_id:added.id,from_warband_id:warbands[1],quantity:1,expected:added,reason:'Camp captured'}
    expect((await submit([transfer,second])).error).toBeNull()
    expect((await admin.from('items').select('id').eq('warband_id',warbands[1]).eq('holder_type','stash')).data).toEqual([])
    expect((await admin.from('items').select('item_rules_id').eq('warband_id',warbands[0]).eq('holder_type','stash')).data).toHaveLength(2)
    expect((await withdraw()).error).toBeNull()
    expect((await admin.from('items').select('quantity').eq('id',source.id).single()).data?.quantity).toBe(3)
    expect((await admin.from('items').select('quantity').eq('id',added.id).single()).data?.quantity).toBe(1)
  })
  it('protects an empty captured stash from a second claim in the same battle',async()=>{
    await admin.from('matches').update({scenario_rules_id:'encampment_raid'}).eq('id',match)
    const report={result:'won',won:true,routed:false,applied:{warband:{gold_delta:0,wyrdstone_delta:0},encampment_capture:{defender_id:warbands[1],camp:'Empty camp',treatment:'destroy',eligible:false},scenario_item_transfers:[]}}
    expect((await player.rpc('submit_battle_report',{p_match_id:match,p_warband_id:warbands[0],p_report:report})).error).toBeNull()
    expect((await player.rpc('submit_battle_report',{p_match_id:match,p_warband_id:warbands[1],p_report:{...report,applied:{...report.applied,encampment_capture:{...report.applied.encampment_capture,defender_id:warbands[0]}}}})).error?.message).toContain('already been claimed')
  })
  it('allows only one winning Rock tome reward, releasing the claim on withdrawal',async()=>{
    await admin.from('matches').update({scenario_rules_id:'assault_on_the_rock'}).eq('id',match)
    const report={result:'won',won:true,routed:false,applied:{warband:{gold_delta:0,wyrdstone_delta:0},rock_tome_claim:true,stash_items:[{item_rules_id:'scenario_rock_tome',custom_name:null,quantity:1}]}}
    const submit=(warband:string)=>player.rpc('submit_battle_report',{p_match_id:match,p_warband_id:warband,p_report:report})
    expect((await submit(warbands[0])).error).toBeNull()
    expect((await submit(warbands[1])).error?.message).toContain('already been claimed')
    expect((await withdraw()).error).toBeNull()
    expect((await submit(warbands[1])).error).toBeNull()
  })
  it('protects stash rewards after later use and still withdraws unchanged rewards',async()=>{
    expect((await file({stash_items:[{item_rules_id:'scenario_rock_tome',custom_name:null,quantity:1}]})).error).toBeNull()
    const book=(await admin.from('items').select('*').eq('warband_id',warbands[0]).eq('item_rules_id','scenario_rock_tome').single()).data!
    expect((await admin.from('items').update({item_rules_id:'scenario_rock_tome_read',holder_type:'hero',holder_id:heroes[0],notes:'Read both spells'}).eq('id',book.id)).error).toBeNull()
    expect((await withdraw()).error?.message).toContain('scenario equipment has changed')
    expect((await admin.from('warbands').select('gold').eq('id',warbands[0]).single()).data?.gold).toBe(105)
    expect((await admin.from('items').update({item_rules_id:book.item_rules_id,holder_type:book.holder_type,holder_id:book.holder_id,notes:book.notes}).eq('id',book.id)).error).toBeNull()
    expect((await withdraw()).error).toBeNull()
    expect((await admin.from('items').select('id').eq('id',book.id)).data).toEqual([])
  })
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
