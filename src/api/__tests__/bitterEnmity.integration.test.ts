// Bitter Enmity (#96) against the LOCAL stack (SUPABASE_LOCAL=1): a filed report stores the structured
// target on the hero, the client schema reads it back, the roster tag names the culprit, and
// withdrawing the report restores the flags. Disposable warbands, match and rows only.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { warriorFlagsSchema } from '../../domain/json'
import { flagTags } from '../../features/roster/view/lookups'
const enabled = process.env.SUPABASE_LOCAL === '1'
const playerId = '22222222-2222-4222-8222-222222222222'
const campaignId = 'dddddddd-0000-4000-8000-000000000001'
const stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }

describe.skipIf(!enabled)('Bitter Enmity filing and withdrawal (#96)', () => {
  let admin: SupabaseClient, player: SupabaseClient, gm: SupabaseClient
  let match: string, mine: string, foe: string, hero: string, culprit: string
  beforeAll(async () => {
    const url = process.env.SUPABASE_URL!, key = process.env.SUPABASE_ANON_KEY!
    admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    player = createClient(url, key, { auth: { persistSession: false } })
    gm = createClient(url, key, { auth: { persistSession: false } })
    const a = await player.auth.signInWithPassword({ email: 'player@stirheim.test', password: 'stirheim-dev' })
    const b = await gm.auth.signInWithPassword({ email: 'gm@stirheim.test', password: 'stirheim-dev' })
    if (a.error || b.error) throw a.error ?? b.error
  })
  beforeEach(async () => {
    mine = crypto.randomUUID(); foe = crypto.randomUUID(); match = crypto.randomUUID(); hero = crypto.randomUUID(); culprit = crypto.randomUUID()
    expect((await admin.from('warbands').insert([
      { id: mine, owner_id: playerId, name: 'Disposable enmity test', type_rules_id: 'mercenaries_reikland', gold: 100 },
      { id: foe, owner_id: playerId, name: 'Disposable foes', type_rules_id: 'cult_of_the_possessed', gold: 100 },
    ])).error).toBeNull()
    expect((await admin.from('heroes').insert([
      { id: hero, warband_id: mine, name: 'Kurt', unit_type_rules_id: 'mercenaries_reikland_champions', is_hired_sword: false, stats, xp: 0, status: 'active', flags: { oldBattleWound: true } },
      { id: culprit, warband_id: foe, name: 'Magister', unit_type_rules_id: 'cult_of_the_possessed_magister', is_hired_sword: false, stats, xp: 0, status: 'active', flags: {} },
    ])).error).toBeNull()
    expect((await admin.from('matches').insert({ id: match, campaign_id: campaignId, created_by: playerId, state: 'awaiting_reports', started_at: new Date().toISOString() })).error).toBeNull()
    expect((await admin.from('match_participants').insert([mine, foe].map((warband_id) => ({ match_id: match, warband_id, accepted_at: new Date().toISOString() })))).error).toBeNull()
  })
  afterEach(async () => {
    if (match) await admin.from('matches').delete().eq('id', match)
    await admin.from('warbands').delete().in('id', [mine, foe])
  })

  const target = { scope: 'individual', roll: 2, text: 'The individual who caused the injury. If it was a Henchman, he hates the enemy leader instead.', source: 'attribution', matchId: '', warriorId: '', warriorName: 'Magister', warbandId: '', warbandName: 'Disposable foes' }
  const report = (flags: Record<string, unknown>) => ({
    version: 1, won: false, result: 'lost', routed: true, xp_log: [], ooa: [], injuries: [], exploration: null, veteran_pool_roll: null,
    applied: { heroes: [{ id: hero, patch: { flags, injuries: [{ injuryCode: 'bitter_enmity', name: 'Bitter Enmity', rolled: { d66: 56, subRoll: 2 }, effect: `Hates: ${target.text}` }] } }], groups: [], warband: { wyrdstone_delta: 0, gold_delta: 0, veteran_pool: null }, pending_advances: [], remove_item_ids: [], stash_items: [], item_patches: [] },
  })

  it('files the structured target, reads it back through the client schema and the roster tag, and withdrawal restores the old flags', async () => {
    const t = { ...target, matchId: match, warriorId: culprit, warbandId: foe }
    const filed = await player.rpc('submit_battle_report', { p_match_id: match, p_warband_id: mine, p_report: report({ oldBattleWound: true, hates: t.text, bitterEnmity: t }) })
    expect(filed.error).toBeNull()
    const row = (await admin.from('heroes').select('flags, injuries').eq('id', hero).single()).data!
    const flags = warriorFlagsSchema.parse(row.flags)
    expect(flags.bitterEnmity).toEqual(t)
    expect(flags.oldBattleWound).toBe(true)
    expect(flagTags(flags)).toContain('Hates Magister (Disposable foes)')
    // Reload semantics: what the client reads is exactly what it wrote, nothing inferred server-side.
    expect(row.injuries).toHaveLength(1)
    const withdrawn = await gm.rpc('withdraw_battle_report', { p_match_id: match, p_warband_id: mine })
    expect(withdrawn.error).toBeNull()
    const restored = warriorFlagsSchema.parse((await admin.from('heroes').select('flags').eq('id', hero).single()).data!.flags)
    expect(restored.bitterEnmity).toBeUndefined()
    expect(restored.hates).toBeUndefined()
    expect(restored.oldBattleWound).toBe(true)
  })

  it('a legacy prose-only record still parses and tags, with no structured claim', async () => {
    expect((await admin.from('heroes').update({ flags: { hates: 'The entire warband of the warrior responsible for the injury.' } }).eq('id', hero)).error).toBeNull()
    const flags = warriorFlagsSchema.parse((await admin.from('heroes').select('flags').eq('id', hero).single()).data!.flags)
    expect(flags.bitterEnmity).toBeUndefined()
    expect(flagTags(flags)).toContain('Hates The entire warband of the warrior responsible for the injury.')
  })
})
