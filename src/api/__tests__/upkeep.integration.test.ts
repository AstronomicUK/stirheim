import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
const enabled = process.env.SUPABASE_LOCAL === '1'
const playerId = '22222222-2222-4222-8222-222222222222'
const campaignId = 'dddddddd-0000-4000-8000-000000000001'
const stats = { M:4, WS:3, BS:3, S:3, T:3, W:1, I:3, A:1, Ld:7 }
describe.skipIf(!enabled)('battle-start upkeep (#219)', () => {
  let admin: SupabaseClient, player: SupabaseClient, anonymous: SupabaseClient
  let match: string, warbands: string[], parent: string, companion: string, paid: string
  beforeAll(async () => {
    const url = process.env.SUPABASE_URL!, key = process.env.SUPABASE_ANON_KEY!
    admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    player = createClient(url, key, { auth: { persistSession: false } })
    anonymous = createClient(url, key, { auth: { persistSession: false } })
    const login = await player.auth.signInWithPassword({ email:'player@stirheim.test', password:'stirheim-dev' })
    if (login.error) throw login.error
  })
  beforeEach(async () => {
    warbands = [crypto.randomUUID(), crypto.randomUUID()]; match = crypto.randomUUID()
    parent = crypto.randomUUID(); companion = crypto.randomUUID(); paid = crypto.randomUUID()
    const w = await admin.from('warbands').insert(warbands.map(id => ({ id, owner_id:playerId, name:'Disposable upkeep test', type_rules_id:'mercenaries_reikland', gold:100 })))
    if (w.error) throw w.error
    const m = await admin.from('matches').insert({ id:match, campaign_id:campaignId, created_by:playerId, state:'scheduled' })
    if (m.error) throw m.error
    const p = await admin.from('match_participants').insert(warbands.map(warband_id => ({match_id:match,warband_id,accepted_at:new Date().toISOString()})))
    if (p.error) throw p.error
    const h = await admin.from('heroes').insert([
      { id:parent, name:'Unpaid charmer', hired_sword_rules_id:'snake_charmer', flags:{upkeepOwedAfter:crypto.randomUUID(), hireGroupId:parent} },
      { id:companion, name:'Snake', hired_sword_rules_id:'snake_charmer', flags:{hireGroupId:parent,hireCompanion:true} },
      { id:paid, name:'Paid Ogre', hired_sword_rules_id:'ogre_bodyguard', flags:{} },
    ].map(h => ({...h,warband_id:warbands[0],is_hired_sword:true,stats,xp:0,status:'active'})))
    if (h.error) throw h.error
  })
  afterEach(async () => {
    if (match) await admin.from('matches').delete().eq('id',match)
    if (warbands?.length) await admin.from('warbands').delete().in('id',warbands)
  })
  it('previews companions without changing the roster; refuses unacknowledged dismissal', async () => {
    const preview = await player.rpc('unpaid_match_hires',{p_match_id:match})
    expect(preview.error).toBeNull()
    expect(preview.data.map((h: {id:string}) => h.id).sort()).toEqual([parent,companion].sort())
    const start = await player.rpc('start_match',{p_match_id:match})
    expect(start.error?.message).toContain('Review unpaid')
    expect((await admin.from('heroes').select('status').in('id',[parent,companion])).data?.every(h=>h.status==='active')).toBe(true)
    expect((await admin.from('matches').select('state').eq('id',match).single()).data?.state).toBe('scheduled')
  })
  it('dismisses acknowledged hires and companions atomically, keeping paid hires and histories', async () => {
    const start = await player.rpc('start_match',{p_match_id:match,p_unpaid_ids:[parent,companion]})
    expect(start.error).toBeNull(); expect(start.data).toBe('in_progress')
    const rows = (await admin.from('heroes').select('id,status,flags').in('id',[parent,companion,paid])).data!
    expect(rows.find(h=>h.id===parent)?.status).toBe('left')
    expect(rows.find(h=>h.id===companion)?.status).toBe('left')
    expect(rows.find(h=>h.id===paid)?.status).toBe('active')
    expect(rows.find(h=>h.id===parent)?.flags.upkeepOwedAfter).toBeUndefined()
    expect((await player.rpc('start_match',{p_match_id:match,p_unpaid_ids:[parent,companion]})).error).not.toBeNull()
    expect((await admin.from('warbands').select('gold').in('id',warbands)).data?.every(w=>w.gold===100)).toBe(true)
  })
  it('rechecks payment after preview, and keeps characters whose upkeep was settled', async () => {
    await admin.from('heroes').update({flags:{hireGroupId:parent}}).eq('id',parent)
    const start = await player.rpc('start_match',{p_match_id:match,p_unpaid_ids:[parent,companion]})
    expect(start.error).toBeNull()
    expect((await admin.from('heroes').select('status').in('id',[parent,companion])).data?.every(h=>h.status==='active')).toBe(true)
  })
  it('retains the selected Scout when unpaid Maglah leaves at battle start',async()=>{
    expect((await admin.from('heroes').update({hired_sword_rules_id:'maglah_khan_s_horde',flags:{upkeepOwedAfter:crypto.randomUUID(),retainedScoutId:paid}}).eq('id',parent)).error).toBeNull()
    expect((await admin.from('heroes').update({hired_sword_rules_id:'hobgoblin_scout',flags:{}}).in('id',[companion,paid])).error).toBeNull()
    const preview=await player.rpc('unpaid_match_hires',{p_match_id:match})
    expect(preview.error).toBeNull()
    expect(preview.data.map((h:{id:string})=>h.id).sort()).toEqual([parent,companion].sort())
    expect((await player.rpc('start_match',{p_match_id:match,p_unpaid_ids:[parent,companion]})).error).toBeNull()
    expect((await admin.from('heroes').select('status').eq('id',paid).single()).data?.status).toBe('active')
  })
  it('rejects an anonymous preview and start' , async () => {
    expect((await anonymous.rpc('unpaid_match_hires',{p_match_id:match})).error).not.toBeNull()
    expect((await anonymous.rpc('start_match',{p_match_id:match,p_unpaid_ids:[parent,companion]})).error).not.toBeNull()
  })
})
