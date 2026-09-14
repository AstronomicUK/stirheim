import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
const enabled = process.env.SUPABASE_LOCAL === '1'
const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const ids: string[] = []
describe.skipIf(!enabled)('saved Marauder tribe', () => {
 let owner: SupabaseClient, other: SupabaseClient, admin: SupabaseClient
 beforeAll(async () => {
   if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url)) throw new Error('Local database only')
   const options = { auth: { persistSession: false, autoRefreshToken: false } }
   owner = createClient(url, process.env.SUPABASE_ANON_KEY!, options)
   other = createClient(url, process.env.SUPABASE_ANON_KEY!, options)
   admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, options)
   for (const [client, email] of [[owner, 'player@stirheim.test'], [other, 'gm@stirheim.test']] as const) {
     const result = await client.auth.signInWithPassword({ email, password: 'stirheim-dev' }); if (result.error) throw result.error
   }
 })
 afterAll(async () => { if (ids.length) await admin.from('warbands').delete().in('id', ids) })
 async function create(tribe?: string) {
   const result = await owner.rpc('create_warband', { payload: { name: `Tribe QA ${crypto.randomUUID().slice(0, 8)}`, type_rules_id: 'marauders_of_chaos', gold: 500, ...(tribe ? { marauder_tribe: tribe } : {}) } })
   expect(result.error).toBeNull(); ids.push(result.data); return result.data as string
 }
 it('preserves creation choice and unrelated edits, and records a correction', async () => {
   const id = await create('hung')
   expect((await owner.from('warbands').select('marauder_tribe').eq('id', id).single()).data?.marauder_tribe).toBe('hung')
   const updated = await owner.rpc('update_roster', { p_warband_id: id, p_reason: 'Test treasury correction', p_changes: [{ table: 'warbands', op: 'update', id, data: { gold: 490 } }] })
   expect(updated.error).toBeNull()
   expect((await owner.from('warbands').select('marauder_tribe').eq('id', id).single()).data?.marauder_tribe).toBe('hung')
   const corrected = await owner.rpc('update_roster', { p_warband_id: id, p_reason: 'Corrected mistaken tribe', p_changes: [{ table: 'warbands', op: 'update', id, data: { marauder_tribe: 'norse' } }] })
   expect(corrected.error).toBeNull()
   expect((await owner.from('warbands').select('marauder_tribe').eq('id', id).single()).data?.marauder_tribe).toBe('norse')
 })
 it('does not let an unrelated player change a tribe', async () => {
   const id = await create('kurgan')
   await other.rpc('update_roster', { p_warband_id: id, p_reason: 'Not my warband', p_changes: [{ table: 'warbands', op: 'update', id, data: { marauder_tribe: 'hung' } }] })
   expect((await admin.from('warbands').select('marauder_tribe').eq('id', id).single()).data?.marauder_tribe).toBe('kurgan')
 })
 it('preserves unknown legacy choices and rejects invalid values atomically', async () => {
   const id = await create()
   expect((await owner.from('warbands').select('marauder_tribe').eq('id', id).single()).data?.marauder_tribe).toBeNull()
   const invalid = await owner.rpc('update_roster', { p_warband_id: id, p_reason: 'Invalid tribe test', p_changes: [{ table: 'warbands', op: 'update', id, data: { gold: 1, marauder_tribe: 'invented' } }] })
   expect(invalid.error).not.toBeNull()
   expect((await owner.from('warbands').select('gold,marauder_tribe').eq('id', id).single()).data).toEqual({ gold: 500, marauder_tribe: null })
 })
})
