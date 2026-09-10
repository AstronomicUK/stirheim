import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
const owner = '22222222-2222-4222-8222-222222222222'
describe.skipIf(process.env.SUPABASE_LOCAL !== '1')('Pirate mixed-crew upkeep transactions', () => {
  let admin: SupabaseClient, player: SupabaseClient, warband: string, other: string, campaign: string, previous: string, match: string, dwarf: string, elf: string
  const check = (r: { error: unknown }) => { if (r.error) throw r.error }
  beforeAll(async () => {
    admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    player = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
    check(await player.auth.signInWithPassword({ email: 'player@stirheim.test', password: 'stirheim-dev' }))
  })
  beforeEach(async () => {
    warband = crypto.randomUUID(); other = crypto.randomUUID(); campaign = crypto.randomUUID(); previous = crypto.randomUUID(); match = crypto.randomUUID(); dwarf = crypto.randomUUID(); elf = crypto.randomUUID()
    check(await admin.from('warbands').insert([warband, other].map(id => ({ id, name: 'Disposable Pirate QA', owner_id: owner, type_rules_id: 'pirates', gold: 100 }))))
    check(await admin.from('campaigns').insert({ id: campaign, name: 'Pirate QA', gm_id: owner }))
    check(await admin.from('matches').insert([{ id: previous, campaign_id: campaign, created_by: owner, state: 'completed' }, { id: match, campaign_id: campaign, created_by: owner, state: 'scheduled' }]))
    check(await admin.from('match_participants').insert([previous, match].flatMap(match_id => [warband, other].map(warband_id => ({ match_id, warband_id, accepted_at: new Date().toISOString() })))))
    check(await admin.from('heroes').insert([[dwarf, 'dwarf_troll_slayer'], [elf, 'elf_ranger']].map(([id, hired_sword_rules_id]) => ({ id, warband_id: warband, name: hired_sword_rules_id, is_hired_sword: true, hired_sword_rules_id, status: 'active', flags: {}, stats: { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 } }))))
    check(await admin.from('match_reports').insert({ match_id: previous, warband_id: warband, submitted_by: owner, status: 'applied', applied: { pirate_mixed_upkeep_due: true }, undo: {}, notes: '' }))
  })
  afterEach(async () => { await admin.from('campaigns').delete().eq('id', campaign); await admin.from('warbands').delete().in('id', [warband, other]) })
  const status = () => player.rpc('pirate_upkeep_status', { p_warband_id: warband })
  const pay = (extra = {}) => player.rpc('pay_pirate_upkeep', { p_warband_id: warband, ...extra })
  it('charges exactly once across simultaneous payments and keeps individual paid contracts intact', async () => {
    expect((await status()).data).toMatchObject({ due: true, amount: 20 })
    const results = await Promise.all([pay(), pay()]); expect(results.filter(r => !r.error)).toHaveLength(1)
    expect((await admin.from('warbands').select('gold').eq('id', warband).single()).data?.gold).toBe(80)
    expect((await status()).data).toMatchObject({ due: false })
    expect((await player.rpc('unpaid_match_hires', { p_match_id: match })).data).toEqual([])
    expect((await admin.from('match_reports').select('notes').eq('match_id', previous).single()).data?.notes).toContain('once for the warband')
    expect((await player.rpc('withdraw_battle_report', { p_match_id: previous, p_warband_id: warband })).error?.message).toContain('Pirate upkeep was paid')
  })
  it('requires funds or a reasoned override without partial payment', async () => {
    check(await admin.from('warbands').update({ gold: 15 }).eq('id', warband))
    expect((await pay()).error?.message).toContain('not enough gold')
    expect((await pay({ p_amount: 10 })).error?.message).toContain('agreed reason')
    expect((await admin.from('warbands').select('gold').eq('id', warband).single()).data?.gold).toBe(15)
    expect((await pay({ p_amount: 10, p_reason: 'Table agreed a reduced shared fee' })).error).toBeNull()
    expect((await admin.from('warbands').select('gold').eq('id', warband).single()).data?.gold).toBe(5)
  })
  it('warns before starting and removes the mixed hired crew only after acknowledgement', async () => {
    const preview = await player.rpc('unpaid_match_hires', { p_match_id: match })
    expect(preview.data?.map((h: { id: string }) => h.id).sort()).toEqual([dwarf, elf].sort())
    expect((await player.rpc('start_match', { p_match_id: match })).error?.message).toContain('Review unpaid')
    expect((await admin.from('heroes').select('status').eq('id', elf).single()).data?.status).toBe('active')
    expect((await player.rpc('start_match', { p_match_id: match, p_unpaid_ids: [dwarf, elf] })).error).toBeNull()
    expect((await admin.from('heroes').select('status').eq('warband_id', warband)).data?.every(h => h.status === 'left')).toBe(true)
    expect((await admin.from('warbands').select('gold').eq('id', warband).single()).data?.gold).toBe(100)
  })
  it('waives the extra charge if one race is dismissed before retaining the next crew', async () => {
    check(await admin.from('heroes').update({ status: 'left' }).eq('id', dwarf))
    expect((await status()).data).toMatchObject({ due: false })
    expect((await player.rpc('start_match', { p_match_id: match })).error).toBeNull()
    expect((await admin.from('heroes').select('status').eq('id', elf).single()).data?.status).toBe('active')
  })
})
