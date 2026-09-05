// create_warband / update_roster SQL functions against the LOCAL stack (SUPABASE_LOCAL=1).

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const enabled = process.env.SUPABASE_LOCAL === '1'
const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const anonKey = process.env.SUPABASE_ANON_KEY ?? ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

const PLAYER = { email: 'player@stirheim.test', password: 'stirheim-dev', id: '22222222-2222-4222-8222-222222222222' }
const GM = { email: 'gm@stirheim.test', password: 'stirheim-dev', id: '11111111-1111-4111-8111-111111111111' }
const REIKLAND_WATCH = 'aaaaaaaa-0000-4000-8000-000000000001'
const STATS = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }

function client(): SupabaseClient {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

describe.skipIf(!enabled)('roster functions', () => {
  let player: SupabaseClient
  let gm: SupabaseClient
  let admin: SupabaseClient
  const created: string[] = []

  beforeAll(async () => {
    player = client()
    gm = client()
    const a = await player.auth.signInWithPassword(PLAYER)
    const b = await gm.auth.signInWithPassword(GM)
    if (a.error || b.error) throw a.error ?? b.error
    admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  })

  afterAll(async () => {
    if (created.length) await admin.from('warbands').delete().in('id', created)
  })

  const payload = {
    name: 'Ostermark Levy',
    type_rules_id: 'mercenaries_ostermark',
    gold: 12,
    notes: 'made by test',
    heroes: [
      {
        name: 'Captain Test',
        unit_type_rules_id: 'mercenaries_ostermark_captain',
        stats: STATS,
        xp: 20,
        skill_tables: ['combat', 'shooting'],
        is_large: false,
        sort_order: 0,
        equipment: [
          { item_rules_id: 'sword', custom_name: null, quantity: 1 },
          { item_rules_id: 'dagger', custom_name: null, quantity: 1 },
        ],
      },
    ],
    henchman_groups: [
      {
        name: 'Levy',
        unit_type_rules_id: 'mercenaries_ostermark_warriors',
        size: 3,
        stats: STATS,
        xp: 0,
        is_large: false,
        sort_order: 0,
        equipment: [{ item_rules_id: 'dagger', custom_name: null, quantity: 3 }],
      },
    ],
    stash: [{ item_rules_id: null, custom_name: 'Lucky charm', quantity: 1 }],
  }

  it('create_warband writes the whole roster atomically and audits it as create_warband', async () => {
    const { data: id, error } = await player.rpc('create_warband', { payload })
    expect(error).toBeNull()
    expect(typeof id).toBe('string')
    created.push(id as string)

    const wb = await player.from('warbands').select('owner_id, gold, name').eq('id', id).single()
    expect(wb.data).toEqual({ owner_id: PLAYER.id, gold: 12, name: 'Ostermark Levy' })
    const heroes = await player.from('heroes').select('name, xp, skill_tables').eq('warband_id', id)
    expect(heroes.data).toEqual([{ name: 'Captain Test', xp: 20, skill_tables: ['combat', 'shooting'] }])
    const groups = await player.from('henchman_groups').select('name, size').eq('warband_id', id)
    expect(groups.data).toEqual([{ name: 'Levy', size: 3 }])
    const items = await player.from('items').select('holder_type, item_rules_id, custom_name, quantity').eq('warband_id', id).order('holder_type')
    expect(items.data).toHaveLength(4)
    expect(items.data?.filter((i) => i.holder_type === 'stash')).toEqual([
      { holder_type: 'stash', item_rules_id: null, custom_name: 'Lucky charm', quantity: 1 },
    ])

    const log = await player.from('audit_log').select('reason, table_name').eq('warband_id', id)
    expect(log.data?.every((l) => l.reason === 'create_warband')).toBe(true)
    expect(log.data?.map((l) => l.table_name).sort()).toEqual(['henchman_groups', 'heroes', 'items', 'items', 'items', 'items', 'warbands'])
  })

  it('create_warband rolls back entirely when one row is invalid', async () => {
    const bad = { ...payload, name: 'Broken', heroes: [{ ...payload.heroes[0], stats: { M: 4 } }] }
    const { error } = await player.rpc('create_warband', { payload: bad })
    expect(error).not.toBeNull()
    const leftovers = await admin.from('warbands').select('id').eq('name', 'Broken')
    expect(leftovers.data).toEqual([])
  })

  it('update_roster applies a labelled batch and refuses rows of other warbands', async () => {
    const id = created[0]!
    const hero = await player.from('heroes').select('id').eq('warband_id', id).single()
    const changes = [
      { table: 'warbands', op: 'update', data: { gold: 40, notes: 'edited' } },
      { table: 'heroes', op: 'update', id: hero.data!.id, data: { xp: 22, skills: ['combat_master'] } },
      { table: 'items', op: 'insert', data: { holder_type: 'hero', holder_id: hero.data!.id, item_rules_id: 'light_armour', quantity: 1 } },
    ]
    const { data: count, error } = await player.rpc('update_roster', { p_warband_id: id, p_reason: 'manual_edit', p_changes: changes })
    expect(error).toBeNull()
    expect(count).toBe(3)

    const wb = await player.from('warbands').select('gold, notes').eq('id', id).single()
    expect(wb.data).toEqual({ gold: 40, notes: 'edited' })
    const h = await player.from('heroes').select('xp, skills').eq('id', hero.data!.id).single()
    expect(h.data).toEqual({ xp: 22, skills: ['combat_master'] })
    const log = await player.from('audit_log').select('reason').eq('warband_id', id).eq('reason', 'manual_edit')
    expect(log.data).toHaveLength(3)

    // A hero id from someone else's warband is not "of this warband": the whole batch fails.
    const foreign = await admin.from('heroes').select('id').eq('warband_id', REIKLAND_WATCH).limit(1).single()
    const res = await player.rpc('update_roster', {
      p_warband_id: id,
      p_reason: 'manual_edit',
      p_changes: [
        { table: 'warbands', op: 'update', data: { gold: 1 } },
        { table: 'heroes', op: 'update', id: foreign.data!.id, data: { xp: 99 } },
      ],
    })
    expect(res.error?.message).toMatch(/matched no row/)
    const after = await player.from('warbands').select('gold').eq('id', id).single()
    expect(after.data?.gold).toBe(40)
  })

  it('transfer_warband hands a warband to another account; only the owner or a campaign GM may', async () => {
    const made = await player.rpc('create_warband', { payload: { ...payload, name: 'Handed Over' } })
    expect(made.error).toBeNull()
    const id = made.data as string
    created.push(id)

    // Reikland's GM is not the GM of a campaign this new warband is in, so they cannot take it.
    const grab = await gm.rpc('transfer_warband', { p_warband_id: id, p_new_owner: GM.id })
    expect(grab.error?.message).toMatch(/only the owner/)

    const nobody = await player.rpc('transfer_warband', { p_warband_id: id, p_new_owner: '00000000-0000-4000-8000-000000000000' })
    expect(nobody.error?.message).toMatch(/no account/)

    const handed = await player.rpc('transfer_warband', { p_warband_id: id, p_new_owner: GM.id })
    expect(handed.error).toBeNull()
    const row = await gm.from('warbands').select('owner_id').eq('id', id).single()
    expect(row.data?.owner_id).toBe(GM.id)
    // The previous owner no longer sees it as theirs.
    const mine = await player.from('warbands').select('id').eq('id', id).eq('owner_id', PLAYER.id)
    expect(mine.data).toEqual([])
  })

  it('update_roster on a warband you cannot edit reports not found; the GM of its campaign may edit it', async () => {
    const id = created[0]!
    const asGm = await gm.rpc('update_roster', { p_warband_id: id, p_reason: 'manual_edit', p_changes: [{ table: 'warbands', op: 'update', data: { gold: 5 } }] })
    expect(asGm.error?.message).toMatch(/not found/) // not in a campaign the GM runs

    const gmEdit = await gm.rpc('update_roster', {
      p_warband_id: REIKLAND_WATCH, // GM owns this one
      p_reason: 'manual_edit',
      p_changes: [{ table: 'warbands', op: 'update', data: { notes: 'gm touched' } }],
    })
    expect(gmEdit.error).toBeNull()
    await admin.from('warbands').update({ notes: 'Seed warband. Fresh from Altdorf.' }).eq('id', REIKLAND_WATCH)
  })
})
