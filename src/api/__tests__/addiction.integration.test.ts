// Crimson Shade addiction supply at battle start (#139/#140), against the LOCAL stack (SUPABASE_LOCAL=1):
// one dose per addicted hero, own kit first then the stash, used up and recorded in a per-match
// ledger; an addict with no dose leaves once the client has acknowledged exactly who.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
const enabled = process.env.SUPABASE_LOCAL === '1'
const playerId = '22222222-2222-4222-8222-222222222222'
const campaignId = 'dddddddd-0000-4000-8000-000000000001'
const stats = { M: 4, WS: 3, BS: 3, S: 3, T: 3, W: 1, I: 3, A: 1, Ld: 7 }
const SHADE = 'crimson_shade'
type Line = { hero_id: string; hero_name: string; source: 'kit' | 'stash' | null; item_row_id: string | null; quantity_before: number | null }

describe.skipIf(!enabled)('battle-start addiction supply (#139/#140)', () => {
  let admin: SupabaseClient, player: SupabaseClient, anonymous: SupabaseClient
  let match: string, warbands: string[], kurt: string, otto: string, pip: string, clean: string, stashRow: string, pipRow: string
  beforeAll(async () => {
    const url = process.env.SUPABASE_URL!, key = process.env.SUPABASE_ANON_KEY!
    admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    player = createClient(url, key, { auth: { persistSession: false } })
    anonymous = createClient(url, key, { auth: { persistSession: false } })
    const login = await player.auth.signInWithPassword({ email: 'player@stirheim.test', password: 'stirheim-dev' })
    if (login.error) throw login.error
  })
  beforeEach(async () => {
    warbands = [crypto.randomUUID(), crypto.randomUUID()]; match = crypto.randomUUID()
    kurt = crypto.randomUUID(); otto = crypto.randomUUID(); pip = crypto.randomUUID(); clean = crypto.randomUUID()
    stashRow = crypto.randomUUID(); pipRow = crypto.randomUUID()
    const w = await admin.from('warbands').insert(warbands.map((id) => ({ id, owner_id: playerId, name: 'Disposable addiction test', type_rules_id: 'mercenaries_reikland', gold: 100 })))
    if (w.error) throw w.error
    const m = await admin.from('matches').insert({ id: match, campaign_id: campaignId, created_by: playerId, state: 'scheduled' })
    if (m.error) throw m.error
    const p = await admin.from('match_participants').insert(warbands.map((warband_id) => ({ match_id: match, warband_id, accepted_at: new Date().toISOString() })))
    if (p.error) throw p.error
    // Roster order: kurt (0), otto (1), pip (2), clean (3). Kurt and otto have no dose of their own; pip carries one.
    const h = await admin.from('heroes').insert([
      { id: kurt, name: 'Kurt', sort_order: 0, flags: { addictedTo: [SHADE] } },
      { id: otto, name: 'Otto', sort_order: 1, flags: { addictedTo: [SHADE] } },
      { id: pip, name: 'Pip', sort_order: 2, flags: { addictedTo: [SHADE] } },
      { id: clean, name: 'Clean', sort_order: 3, flags: {} },
    ].map((x) => ({ ...x, warband_id: warbands[0], unit_type_rules_id: 'mercenaries_reikland_champions', is_hired_sword: false, stats, xp: 0, status: 'active' })))
    if (h.error) throw h.error
    const i = await admin.from('items').insert([
      { id: stashRow, warband_id: warbands[0], holder_type: 'stash', holder_id: null, item_rules_id: SHADE, quantity: 1 },
      { id: pipRow, warband_id: warbands[0], holder_type: 'hero', holder_id: pip, item_rules_id: SHADE, quantity: 1 },
    ])
    if (i.error) throw i.error
  })
  afterEach(async () => {
    if (match) await admin.from('matches').delete().eq('id', match)
    if (warbands?.length) await admin.from('warbands').delete().in('id', warbands)
  })
  const preview = async () => {
    const r = await player.rpc('addiction_supply', { p_match_id: match })
    expect(r.error).toBeNull()
    return (r.data as Line[]).sort((a, b) => a.hero_name.localeCompare(b.hero_name))
  }
  const heroRows = async (ids: string[]) => (await admin.from('heroes').select('id,status,flags').in('id', ids)).data!
  /** Quantity left on a stock row, or null once its last copy is gone (items.quantity must stay > 0, so the row is deleted). */
  const qty = async (id: string) => ((await admin.from('items').select('quantity').eq('id', id).maybeSingle()).data?.quantity as number | undefined) ?? null

  it('previews one dose per addict — own kit first, then the stash while it lasts — and changes nothing', async () => {
    const lines = await preview()
    expect(lines.map((l) => [l.hero_name, l.source])).toEqual([['Kurt', 'stash'], ['Otto', null], ['Pip', 'kit']])
    expect(lines.find((l) => l.hero_name === 'Kurt')).toMatchObject({ item_row_id: stashRow, quantity_before: 1 })
    expect(lines.find((l) => l.hero_name === 'Pip')).toMatchObject({ item_row_id: pipRow, quantity_before: 1 })
    expect(await qty(stashRow)).toBe(1); expect(await qty(pipRow)).toBe(1)
    expect((await heroRows([kurt, otto, pip, clean])).every((h) => h.status === 'active')).toBe(true)
    expect((await admin.from('addiction_supplies').select('id').eq('match_id', match)).data).toEqual([])
  })

  it('refuses to start until the unsupplied addicts are acknowledged, and nothing changes', async () => {
    const start = await player.rpc('start_match', { p_match_id: match })
    expect(start.error?.message).toContain('Review addicted heroes')
    expect((await admin.from('matches').select('state').eq('id', match).single()).data?.state).toBe('scheduled')
    expect(await qty(stashRow)).toBe(1)
    expect((await heroRows([otto])).every((h) => h.status === 'active')).toBe(true)
    expect((await player.rpc('start_match', { p_match_id: match, p_unsupplied_ids: [kurt] })).error?.message).toContain('Review addicted heroes')
  })

  it('uses up each supplied dose exactly once, records the ledger, and the acknowledged addict leaves keeping his addiction', async () => {
    const start = await player.rpc('start_match', { p_match_id: match, p_unsupplied_ids: [otto] })
    expect(start.error).toBeNull(); expect(start.data).toBe('in_progress')
    // Both were last copies: the rows are gone, not left at zero.
    expect(await qty(stashRow)).toBeNull(); expect(await qty(pipRow)).toBeNull()
    const rows = await heroRows([kurt, otto, pip, clean])
    expect(rows.find((h) => h.id === otto)).toMatchObject({ status: 'left', flags: { addictedTo: [SHADE] } })
    expect(rows.filter((h) => h.id !== otto).every((h) => h.status === 'active')).toBe(true)
    // The ledger keeps where each dose came from and how many that row held; the row id is nulled with the row.
    const ledger = (await admin.from('addiction_supplies').select('hero_id,source,item_row_id,quantity_before').eq('match_id', match)).data!
    expect(ledger.map((l) => [l.hero_id, l.source, l.item_row_id, l.quantity_before]).sort()).toEqual([[kurt, 'stash', null, 1], [pip, 'kit', null, 1]].sort())
    // The player can read his own ledger; the same dose cannot be recorded twice.
    const mine = await player.from('addiction_supplies').select('hero_id').eq('match_id', match)
    expect(mine.error).toBeNull(); expect(mine.data?.length).toBe(2)
    expect((await admin.from('addiction_supplies').insert({ match_id: match, hero_id: kurt, warband_id: warbands[0], item_rules_id: SHADE, source: 'kit', quantity_before: 1 })).error).not.toBeNull()
    expect((await player.rpc('start_match', { p_match_id: match, p_unsupplied_ids: [otto] })).error).not.toBeNull()
  })

  it('rechecks supply after the preview: a dose bought in between keeps him, and the stale acknowledgement is refused', async () => {
    expect((await preview()).find((l) => l.hero_name === 'Otto')?.source).toBeNull()
    expect((await admin.from('items').update({ quantity: 2 }).eq('id', stashRow)).error).toBeNull()
    expect((await player.rpc('start_match', { p_match_id: match, p_unsupplied_ids: [otto] })).error?.message).toContain('Review addicted heroes')
    const start = await player.rpc('start_match', { p_match_id: match, p_unsupplied_ids: [] })
    expect(start.error).toBeNull()
    // Two doses in the stash, two addicts drawing on it: the row is used up and gone; Pip used his own.
    expect(await qty(stashRow)).toBeNull()
    expect((await heroRows([kurt, otto, pip])).every((h) => h.status === 'active')).toBe(true)
    const ledger = (await admin.from('addiction_supplies').select('hero_id,source,quantity_before').eq('match_id', match)).data!
    expect(ledger.map((l) => [l.hero_id, l.source, l.quantity_before]).sort()).toEqual([[kurt, 'stash', 2], [otto, 'stash', 1], [pip, 'kit', 1]].sort())
  })

  it("keeps an earlier battle's ledger intact when the next battle allocates again", async () => {
    expect((await player.rpc('start_match', { p_match_id: match, p_unsupplied_ids: [otto] })).error).toBeNull()
    const match2 = crypto.randomUUID()
    try {
      expect((await admin.from('matches').insert({ id: match2, campaign_id: campaignId, created_by: playerId, state: 'scheduled' })).error).toBeNull()
      expect((await admin.from('match_participants').insert(warbands.map((warband_id) => ({ match_id: match2, warband_id, accepted_at: new Date().toISOString() })))).error).toBeNull()
      // Restock the stash (the first battle used the old row up); Kurt is supplied again, Pip has nothing left and leaves this time.
      expect((await admin.from('items').insert({ warband_id: warbands[0], holder_type: 'stash', holder_id: null, item_rules_id: SHADE, quantity: 1 })).error).toBeNull()
      expect((await player.rpc('start_match', { p_match_id: match2, p_unsupplied_ids: [pip] })).error).toBeNull()
      const first = (await admin.from('addiction_supplies').select('hero_id,source,quantity_before').eq('match_id', match)).data!
      expect(first.map((l) => [l.hero_id, l.source, l.quantity_before]).sort()).toEqual([[kurt, 'stash', 1], [pip, 'kit', 1]].sort())
      const second = (await admin.from('addiction_supplies').select('hero_id,source').eq('match_id', match2)).data!
      expect(second).toEqual([{ hero_id: kurt, source: 'stash' }])
      expect((await heroRows([pip]))[0].status).toBe('left')
    } finally {
      await admin.from('matches').delete().eq('id', match2)
    }
  })

  it('rejects an anonymous preview', async () => {
    const r = await anonymous.rpc('addiction_supply', { p_match_id: match })
    expect(r.error).not.toBeNull()
  })
})
