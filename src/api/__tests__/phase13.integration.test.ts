// Phase 13 schema against the LOCAL stack (SUPABASE_LOCAL=1): per-campaign aliases, private
// warband templates, henchman model names through update_roster, and imported records that carry
// shards, gold and the veteran pool.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const enabled = process.env.SUPABASE_LOCAL === '1'
const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const anonKey = process.env.SUPABASE_ANON_KEY ?? ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const PLAYER = { email: 'player@stirheim.test', password: 'stirheim-dev', id: '22222222-2222-4222-8222-222222222222' }
const GM = { email: 'gm@stirheim.test', password: 'stirheim-dev', id: '11111111-1111-4111-8111-111111111111' }
const CAMPAIGN = 'dddddddd-0000-4000-8000-000000000001'
const REIKLAND_WATCH = 'aaaaaaaa-0000-4000-8000-000000000001'
const CLAWS_OF_ESHIN = 'aaaaaaaa-0000-4000-8000-000000000002'
const VERMINKIN = 'cccccccc-0000-4000-8000-000000000011'

function client(): SupabaseClient {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

describe.skipIf(!enabled)('phase 13 schema', () => {
  let player: SupabaseClient
  let gm: SupabaseClient
  let admin: SupabaseClient
  let templateId: string | null = null
  let importedMatchId: string | null = null

  beforeAll(async () => {
    player = client()
    gm = client()
    const a = await player.auth.signInWithPassword(PLAYER)
    const b = await gm.auth.signInWithPassword(GM)
    if (a.error || b.error) throw a.error ?? b.error
    admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  })

  afterAll(async () => {
    await admin.from('campaign_aliases').delete().eq('campaign_id', CAMPAIGN)
    if (templateId) await admin.from('warband_templates').delete().eq('id', templateId)
    await admin.from('henchman_groups').update({ model_names: [] }).eq('id', VERMINKIN)
    if (importedMatchId) await admin.from('matches').delete().eq('id', importedMatchId)
  })

  describe('campaign aliases', () => {
    it('a member sets their own alias and every member can read it', async () => {
      const set = await player.rpc('set_campaign_alias', { p_campaign_id: CAMPAIGN, p_user_id: PLAYER.id, p_alias: '  Ana the Grey  ' })
      expect(set.error).toBeNull()
      const seen = await gm.from('campaign_aliases').select('user_id, alias').eq('campaign_id', CAMPAIGN)
      expect(seen.data).toEqual([{ user_id: PLAYER.id, alias: 'Ana the Grey' }])
    })

    it('a member cannot rename someone else; the GM can rename anyone', async () => {
      const bad = await player.rpc('set_campaign_alias', { p_campaign_id: CAMPAIGN, p_user_id: GM.id, p_alias: 'Nope' })
      expect(bad.error?.message).toMatch(/only the member or the GM/)
      const ok = await gm.rpc('set_campaign_alias', { p_campaign_id: CAMPAIGN, p_user_id: PLAYER.id, p_alias: 'Ana of Eshin' })
      expect(ok.error).toBeNull()
      const row = await gm.from('campaign_aliases').select('alias').eq('campaign_id', CAMPAIGN).eq('user_id', PLAYER.id).single()
      expect(row.data?.alias).toBe('Ana of Eshin')
    })

    it('a blank alias removes the row, and direct writes are refused', async () => {
      const clear = await player.rpc('set_campaign_alias', { p_campaign_id: CAMPAIGN, p_user_id: PLAYER.id, p_alias: '' })
      expect(clear.error).toBeNull()
      const rows = await player.from('campaign_aliases').select('alias').eq('campaign_id', CAMPAIGN)
      expect(rows.data).toEqual([])
      const direct = await player.from('campaign_aliases').insert({ campaign_id: CAMPAIGN, user_id: PLAYER.id, alias: 'Sneaky' })
      expect(direct.error).not.toBeNull()
    })
  })

  describe('warband templates', () => {
    it('are private to their owner', async () => {
      const ins = await player
        .from('warband_templates')
        .insert({ owner_id: PLAYER.id, name: 'Eshin standard', type_rules_id: 'skaven_eshin', payload: { version: 1, heroes: [], henchman_groups: [] } })
        .select('id')
        .single()
      expect(ins.error).toBeNull()
      templateId = ins.data!.id
      const mine = await player.from('warband_templates').select('id').eq('id', templateId)
      expect(mine.data).toHaveLength(1)
      const theirs = await gm.from('warband_templates').select('id').eq('id', templateId)
      expect(theirs.data).toEqual([])
      const forged = await gm.from('warband_templates').insert({ owner_id: PLAYER.id, name: 'Not mine', type_rules_id: 'x', payload: {} })
      expect(forged.error).not.toBeNull()
    })
  })

  describe('henchman model names', () => {
    it('round-trip through update_roster', async () => {
      const upd = await player.rpc('update_roster', {
        p_warband_id: CLAWS_OF_ESHIN,
        p_reason: 'manual',
        p_changes: [{ table: 'henchman_groups', op: 'update', id: VERMINKIN, data: { model_names: ['Skit', 'Kreek', '  ', 'Nibbles'] } }],
      })
      expect(upd.error).toBeNull()
      const row = await player.from('henchman_groups').select('model_names').eq('id', VERMINKIN).single()
      expect(row.data?.model_names).toEqual(['Skit', 'Kreek', 'Nibbles'])
      // Other columns untouched, names untouched when absent from a later patch.
      const again = await player.rpc('update_roster', {
        p_warband_id: CLAWS_OF_ESHIN,
        p_reason: 'manual',
        p_changes: [{ table: 'henchman_groups', op: 'update', id: VERMINKIN, data: { notes: 'Chittering' } }],
      })
      expect(again.error).toBeNull()
      const after = await player.from('henchman_groups').select('model_names, notes').eq('id', VERMINKIN).single()
      expect(after.data).toEqual({ model_names: ['Skit', 'Kreek', 'Nibbles'], notes: 'Chittering' })
      await admin.from('henchman_groups').update({ notes: '' }).eq('id', VERMINKIN)
    })
  })

  describe('imported records', () => {
    it('carry shards, gold and the veteran pool into the report', async () => {
      const res = await gm.rpc('import_battle_records', {
        p_campaign_id: CAMPAIGN,
        p_matches: [
          {
            played_at: '2026-07-01T10:00:00Z',
            scenario_rules_id: 'skirmish',
            notes: '',
            participants: [
              { warband_id: REIKLAND_WATCH, result: 'won', xp_gained: 5, casualties: 0, shards: 3, gold: 15, veteran_pool: 7, notes: '' },
              { warband_id: CLAWS_OF_ESHIN, result: 'lost', xp_gained: 2, casualties: 1, shards: 1, gold: null, veteran_pool: 13, notes: '' },
            ],
          },
        ],
      })
      expect(res.error).toBeNull()
      expect(res.data).toBe(1)
      const match = await admin.from('matches').select('id').eq('campaign_id', CAMPAIGN).eq('created_via', 'import').eq('started_at', '2026-07-01T10:00:00+00:00').single()
      importedMatchId = match.data!.id
      const reports = await gm.from('match_reports').select('warband_id, exploration, veteran_pool_roll').eq('match_id', importedMatchId).order('warband_id')
      const watch = reports.data!.find((r) => r.warband_id === REIKLAND_WATCH)!
      const eshin = reports.data!.find((r) => r.warband_id === CLAWS_OF_ESHIN)!
      expect(watch.exploration).toMatchObject({ shards: 3, goldFound: 15, diceAllowed: 0, itemsFound: [] })
      expect(watch.veteran_pool_roll).toBe(7)
      expect(eshin.exploration).toMatchObject({ shards: 1, goldFound: 0 })
      // 13 is not a 2D6 result, so it is dropped rather than rejected.
      expect(eshin.veteran_pool_roll).toBeNull()
    })
  })
})
