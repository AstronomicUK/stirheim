import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
const uid = '22222222-2222-4222-8222-222222222222'
describe.skipIf(process.env.SUPABASE_LOCAL !== '1')('Recorded broken weapon settlement', () => {
  let admin: SupabaseClient, player: SupabaseClient, campaign: string, warband: string, hero: string, item: string, match: string, event: string
  let loss: Record<string, unknown>
  beforeAll(async () => {
    admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    player = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
    const r = await player.auth.signInWithPassword({ email: 'player@stirheim.test', password: 'stirheim-dev' }); if (r.error) throw r.error
  })
  beforeEach(async () => {
    campaign = crypto.randomUUID(); warband = crypto.randomUUID(); hero = crypto.randomUUID(); item = crypto.randomUUID(); match = crypto.randomUUID(); event = crypto.randomUUID()
    loss = { itemId: item, warbandId: warband, holderId: hero, holderType: 'hero', weaponId: 'sword', name: 'Sword', quantity: 1, copyIndex: 0, expected: { item_rules_id: 'sword', custom_name: null, quantity: 1, notes: 'Family heirloom' } }
    for (const result of [
      await admin.from('campaigns').insert({ id: campaign, name: 'Disposable weapon loss QA', gm_id: uid }),
      await admin.from('warbands').insert({ id: warband, name: 'Broken sword QA', owner_id: uid, type_rules_id: 'mercenaries_reikland', gold: 100 }),
      await admin.from('heroes').insert({ id: hero, warband_id: warband, name: 'Captain', unit_type_rules_id: 'mercenaries_reikland_captain', stats: { M: 4, WS: 4, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 8 } }),
      await admin.from('items').insert({ id: item, warband_id: warband, holder_type: 'hero', holder_id: hero, item_rules_id: 'sword', quantity: 1, notes: 'Family heirloom' }),
      await admin.from('matches').insert({ id: match, campaign_id: campaign, created_by: uid, state: 'awaiting_reports' }),
      await admin.from('match_participants').insert({ match_id: match, warband_id: warband, accepted_at: new Date().toISOString() }),
      await admin.from('battle_events').insert({ id: event, match_id: match, actor_id: uid, actor_warband_id: warband, kind: 'attack', summary: 'Sword broken', payload: { brokenWeapons: [loss] } }),
    ]) if (result.error) throw result.error
  })
  afterEach(async () => { await admin.from('campaigns').delete().eq('id', campaign); await admin.from('warbands').delete().eq('id', warband) })
  const file = (extra: Record<string, unknown> = {}) => player.rpc('submit_battle_report', { p_match_id: match, p_warband_id: warband, p_report: { won: false, result: 'lost', applied: { warband: { gold_delta: 0, wyrdstone_delta: 0 }, broken_weapons: [{ event_id: event, ...loss }], item_patches: [{ id: item, quantity: 0 }], ...extra } } })
  const withdraw = () => player.rpc('withdraw_battle_report', { p_match_id: match, p_warband_id: warband })
  it('removes the exact copy, guards source reversal, and restores the row on withdrawal', async () => {
    expect((await file()).error).toBeNull()
    expect((await admin.from('items').select('id').eq('id', item)).data).toEqual([])
    expect((await player.rpc('revert_battle_event', { p_event_id: event, p_note: 'Wrong break' })).error?.message).toContain('Withdraw')
    expect((await withdraw()).error).toBeNull()
    expect((await admin.from('items').select('quantity,notes,holder_id').eq('id', item).single()).data).toEqual({ quantity: 1, notes: 'Family heirloom', holder_id: hero })
    expect((await player.rpc('revert_battle_event', { p_event_id: event, p_note: 'Wrong break' })).error).toBeNull()
  })
  it('rejects a stale inventory without touching the changed stock', async () => {
    await admin.from('items').update({ quantity: 2 }).eq('id', item)
    expect((await file()).error?.message).toContain('equipment changed')
    expect((await admin.from('items').select('quantity').eq('id', item).single()).data?.quantity).toBe(2)
  })
  it('requires all breaks, matching metadata and removal of broken copies', async () => {
    expect((await file({ broken_weapons: [] })).error?.message).toContain('every recorded')
    expect((await file({ item_patches: [{ id: item, quantity: 1 }] })).error?.message).toContain('retains a broken')
    expect((await file({ broken_weapons: [{ event_id: event, ...loss, name: 'Another item' }] })).error?.message).toContain('changed or was reverted')
  })
  it('rejects the same copy broken twice', async () => {
    const second = crypto.randomUUID()
    await admin.from('battle_events').insert({ id: second, match_id: match, actor_id: uid, actor_warband_id: warband, kind: 'attack', summary: 'Duplicate break', payload: { brokenWeapons: [loss] } })
    expect((await file({ broken_weapons: [{ event_id: event, ...loss }, { event_id: second, ...loss }] })).error?.message).toContain('same weapon copy')
  })
  it('permits only the actual scenario non-campaign exception', async () => {
    expect((await file({ weapon_loss_non_campaign: true, broken_weapons: [], item_patches: [] })).error?.message).toContain('does not allow')
    await admin.from('matches').update({ scenario_rules_id: 'the_sword_of_the_herald' }).eq('id', match)
    expect((await file({ weapon_loss_non_campaign: true, broken_weapons: [], item_patches: [] })).error).toBeNull()
    expect((await admin.from('items').select('quantity').eq('id', item).single()).data?.quantity).toBe(1)
  })
})
