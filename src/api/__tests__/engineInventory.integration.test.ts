import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const check = (r: { data: unknown; error: { message: string } | null }): any => { if (r.error) throw Error(r.error.message); return r.data }
describe.skipIf(process.env.SUPABASE_LOCAL !== '1')('Physical Engine inventory', () => {
  let admin: SupabaseClient, owner: SupabaseClient, stranger: SupabaseClient, warband: string, item: string
  const users: string[] = []
  beforeAll(async () => {
    admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const clients: SupabaseClient[] = []
    for (let n = 0; n < 2; n++) {
      const email = `engine-${crypto.randomUUID()}@stirheim.test`, password = crypto.randomUUID()
      const { user } = check(await admin.auth.admin.createUser({ email, password, email_confirm: true })); users.push(user.id)
      const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
      check(await client.auth.signInWithPassword({ email, password })); clients.push(client)
    }
    ;[owner, stranger] = clients
  })
  beforeEach(async () => {
    warband = check(await admin.from('warbands').insert({ owner_id: users[0], name: 'Disposable engines', type_rules_id: 'black_dwarfs', gold: 100 }).select('id').single()).id
    item = check(await admin.from('items').insert({ warband_id: warband, holder_type: 'stash', item_rules_id: 'engine_of_chaos', quantity: 2 }).select('id').single()).id
  })
  afterEach(async () => { check(await admin.from('warbands').delete().eq('id', warband)) })
  afterAll(async () => { for (const id of users) await admin.auth.admin.deleteUser(id) })
  const units = async () => check(await admin.from('engine_of_chaos_units').select('*').eq('warband_id', warband).neq('state', 'retired').order('stock_index'))
  const remove = (u: { id: string; updated_at: string }, client = owner) => client.rpc('remove_engine_copy', { p_engine_id: u.id, p_reason: 'Removed during inventory test', p_expected_updated_at: u.updated_at })
  it('preserves physical identities when quantities grow and never reuses a retired identity', async () => {
    const original = await units()
    check(await owner.from('items').update({ quantity: 3 }).eq('id', item))
    const grown = await units()
    expect(grown.slice(0, 2).map((u: { id: string }) => u.id)).toEqual(original.map((u: { id: string }) => u.id))
    check(await owner.from('items').update({ quantity: 2 }).eq('id', item))
    expect(check(await admin.from('engine_of_chaos_units').select('state,inventory_item_id').eq('id', grown[2].id).single())).toEqual({ state: 'retired', inventory_item_id: null })
    check(await owner.from('items').update({ quantity: 3 }).eq('id', item))
    expect((await units())[2].id).not.toBe(grown[2].id)
  })
  it('checks ownership, stale edits and name bounds without permitting direct ledger writes', async () => {
    const [u] = await units()
    const rename = (client: SupabaseClient, name: string) => client.rpc('rename_engine', { p_engine_id: u.id, p_name: name, p_expected_updated_at: u.updated_at })
    expect((await rename(stranger, 'Stolen')).error?.code).toBe('42501')
    expect((await rename(owner, ' ')).error?.message).toContain('1 to 80')
    expect((await owner.from('engine_of_chaos_units').update({ name: 'Bypassed' }).eq('id', u.id)).error).not.toBeNull()
    check(await rename(owner, '  Iron Crown  '))
    expect((await units())[0].name).toBe('Iron Crown')
    expect((await rename(owner, 'Stale')).error?.code).toBe('40001')
    expect((await remove(u, stranger)).error?.code).toBe('42501')
  })
  it('blocks removing travelling stock, while allowing an earlier empty copy to be removed safely', async () => {
    const [first, second] = await units()
    check(await admin.from('engine_of_chaos_units').update({ state: 'away', name: 'Travelling engine' }).eq('id', second.id))
    for (const edit of [{ quantity: 1 }, { item_rules_id: 'sword' }]) {
      expect((await owner.from('items').update(edit).eq('id', item)).error?.message).toContain('unresolved custody')
    }
    expect((await owner.from('items').delete().eq('id', item)).error?.message).toContain('unresolved custody')
    check(await remove(first))
    const remaining = await units()
    expect(remaining).toHaveLength(1)
    expect(remaining[0]).toMatchObject({ id: second.id, stock_index: 0, name: 'Travelling engine', state: 'away' })
    expect((await remove(remaining[0])).error?.message).toContain('unresolved custody')
    expect(check(await admin.from('warbands').select('gold').eq('id', warband).single()).gold).toBe(100)
  })
  it('removes the last empty copy and its stock row, retaining retirement history', async () => {
    check(await remove((await units())[0]))
    const [last] = await units()
    check(await remove(last))
    expect(await units()).toEqual([])
    expect(check(await admin.from('items').select('id').eq('id', item))).toEqual([])
    const record = check(await admin.from('engine_of_chaos_units').select('state,history').eq('id', last.id).single())
    expect(record.state).toBe('retired')
    expect(record.history.at(-1).reason).toBe('Removed during inventory test')
  })
  it('keeps the inventory private and leaves ordinary stock alone', async () => {
    expect(check(await stranger.from('engine_of_chaos_units').select('id').eq('warband_id', warband))).toEqual([])
    expect(check(await owner.from('engine_of_chaos_units').select('id').eq('warband_id', warband))).toHaveLength(2)
    const sword = check(await owner.from('items').insert({ warband_id: warband, holder_type: 'stash', item_rules_id: 'sword', quantity: 2 }).select('id').single())
    check(await owner.from('items').update({ quantity: 1 }).eq('id', sword.id))
    check(await owner.from('items').delete().eq('id', sword.id))
    expect(await units()).toHaveLength(2)
  })
})
