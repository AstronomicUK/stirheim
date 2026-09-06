// Phase 16 against the LOCAL stack (SUPABASE_LOCAL=1): a report's item patches use consumables up
// and note spent maps, and withdrawing the report puts them back; the campaign settings default
// carries the bans lists.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const enabled = process.env.SUPABASE_LOCAL === '1'
const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const anonKey = process.env.SUPABASE_ANON_KEY ?? ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const PLAYER = { email: 'player@stirheim.test', password: 'stirheim-dev' }
const GM = { email: 'gm@stirheim.test', password: 'stirheim-dev' }
const CAMPAIGN = 'dddddddd-0000-4000-8000-000000000001'
const REIKLAND_WATCH = 'aaaaaaaa-0000-4000-8000-000000000001'
const CLAWS_OF_ESHIN = 'aaaaaaaa-0000-4000-8000-000000000002'
const SKRITCH = 'bbbbbbbb-0000-4000-8000-000000000011'

function client(): SupabaseClient {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

describe.skipIf(!enabled)('phase 16: item patches and bans', () => {
  let player: SupabaseClient
  let gm: SupabaseClient
  let admin: SupabaseClient
  let matchId: string
  let venomId: string
  let mapId: string

  beforeAll(async () => {
    player = client()
    gm = client()
    const a = await player.auth.signInWithPassword(PLAYER)
    const b = await gm.auth.signInWithPassword(GM)
    if (a.error || b.error) throw a.error ?? b.error
    admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const venom = await admin.from('items').insert({ warband_id: CLAWS_OF_ESHIN, holder_type: 'hero', holder_id: SKRITCH, item_rules_id: 'dark_venom', quantity: 2 }).select('id').single()
    const map = await admin.from('items').insert({ warband_id: CLAWS_OF_ESHIN, holder_type: 'hero', holder_id: SKRITCH, item_rules_id: 'mordheim_map', quantity: 1, notes: 'Map D6 5: Accurate' }).select('id').single()
    venomId = venom.data!.id
    mapId = map.data!.id
    const m = await gm.rpc('schedule_match', { p_campaign_id: CAMPAIGN, p_warband_ids: [REIKLAND_WATCH, CLAWS_OF_ESHIN], p_scenario_rules_id: 'skirmish' })
    matchId = m.data as string
    await gm.rpc('start_match', { p_match_id: matchId })
    await gm.rpc('end_match', { p_match_id: matchId })
  })

  afterAll(async () => {
    if (matchId) await admin.from('matches').delete().eq('id', matchId)
    await admin.from('items').delete().in('id', [venomId, mapId])
  })

  const report = (patches: { id: string; quantity?: number; notes?: string }[]) => ({
    version: 1,
    won: false,
    result: 'lost',
    routed: true,
    xp_log: [],
    ooa: [],
    injuries: [],
    exploration: null,
    veteran_pool_roll: null,
    applied: { heroes: [], groups: [], warband: { wyrdstone_delta: 0, gold_delta: 0, veteran_pool: null }, pending_advances: [], remove_item_ids: [], stash_items: [], item_patches: patches },
  })

  it('uses a consumable up and notes a spent map; withdrawing restores both', async () => {
    const filed = await player.rpc('submit_battle_report', {
      p_match_id: matchId,
      p_warband_id: CLAWS_OF_ESHIN,
      p_report: report([
        { id: venomId, quantity: 1 },
        { id: mapId, notes: 'Map D6 5: Accurate · spent' },
      ]),
    })
    expect(filed.error).toBeNull()
    const after = await gm.from('items').select('id, quantity, notes').in('id', [venomId, mapId])
    expect(after.data?.find((r) => r.id === venomId)).toMatchObject({ quantity: 1 })
    expect(after.data?.find((r) => r.id === mapId)?.notes).toMatch(/spent$/)

    const withdrawn = await gm.rpc('withdraw_battle_report', { p_match_id: matchId, p_warband_id: CLAWS_OF_ESHIN })
    expect(withdrawn.error).toBeNull()
    const restored = await gm.from('items').select('id, quantity, notes').in('id', [venomId, mapId])
    expect(restored.data?.find((r) => r.id === venomId)).toMatchObject({ quantity: 1 + 1 })
    expect(restored.data?.find((r) => r.id === mapId)?.notes).toBe('Map D6 5: Accurate')
  })

  it('a patch to zero removes the row, and the row comes back on withdrawal', async () => {
    const filed = await player.rpc('submit_battle_report', { p_match_id: matchId, p_warband_id: CLAWS_OF_ESHIN, p_report: report([{ id: venomId, quantity: 0 }]) })
    expect(filed.error).toBeNull()
    const gone = await gm.from('items').select('id').eq('id', venomId)
    expect(gone.data).toEqual([])
    const withdrawn = await gm.rpc('withdraw_battle_report', { p_match_id: matchId, p_warband_id: CLAWS_OF_ESHIN })
    expect(withdrawn.error).toBeNull()
    const back = await gm.from('items').select('id, quantity, holder_id').eq('id', venomId).single()
    expect(back.data).toMatchObject({ quantity: 2, holder_id: SKRITCH })
  })

  it('the settings column default carries empty bans', async () => {
    const created = await gm.from('campaigns').insert({ name: 'Bans default check' }).select('id, settings').single()
    expect(created.error).toBeNull()
    const settings = created.data!.settings as { houseRules: { bans: Record<string, string[]> } }
    expect(settings.houseRules.bans).toEqual({ items: [], spells: [], hiredSwords: [], characters: [], skills: [] })
    await admin.from('campaigns').delete().eq('id', created.data!.id)
  })
})
