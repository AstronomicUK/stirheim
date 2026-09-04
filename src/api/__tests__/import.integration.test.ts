// import_battle_records against the LOCAL stack (SUPABASE_LOCAL=1): the GM imports historical
// matches (supabase/migrations/20260904000010_import.sql); a member and an outsider are refused;
// an unknown participant rolls the whole import back.

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
const OUTSIDER_WARBAND = 'f9f9f9f9-0000-4000-8000-000000000001'

function client(): SupabaseClient {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

const TWO_MATCHES = [
  {
    scenario_rules_id: 'skirmish',
    scenario_name: 'Skirmish',
    played_at: '2026-08-31T09:28:00.000Z',
    notes: '',
    participants: [
      { warband_id: REIKLAND_WATCH, won: true, result: 'won', xp_gained: 6, casualties: 1, notes: 'Held the bridge' },
      { warband_id: CLAWS_OF_ESHIN, won: false, result: 'lost', xp_gained: 4, casualties: 2, notes: '' },
    ],
  },
  {
    scenario_rules_id: null,
    scenario_name: 'The Cursed Well',
    played_at: '2026-09-02T20:00:00.000Z',
    notes: 'House scenario',
    participants: [
      { warband_id: REIKLAND_WATCH, won: false, result: 'draw', xp_gained: 2, casualties: 0 },
      { warband_id: CLAWS_OF_ESHIN, won: false, result: 'draw', xp_gained: null, casualties: null },
    ],
  },
]

describe.skipIf(!enabled)('import_battle_records', () => {
  let player: SupabaseClient
  let gm: SupabaseClient
  let admin: SupabaseClient

  beforeAll(async () => {
    admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    player = client()
    gm = client()
    const a = await player.auth.signInWithPassword(PLAYER)
    const b = await gm.auth.signInWithPassword(GM)
    if (a.error || b.error) throw a.error ?? b.error
    // A warband of the GM's that is NOT enrolled in the campaign.
    const wb = await admin.from('warbands').insert({ id: OUTSIDER_WARBAND, owner_id: GM.id, name: 'Outsiders', type_rules_id: 'mercenaries_reikland' })
    if (wb.error) throw wb.error
  })

  afterAll(async () => {
    await admin.from('matches').delete().eq('campaign_id', CAMPAIGN).eq('created_via', 'import')
    await admin.from('warbands').delete().eq('id', OUTSIDER_WARBAND)
  })

  it('refuses a member who is not the GM, writing nothing', async () => {
    const before = await admin.from('matches').select('id', { count: 'exact', head: true }).eq('campaign_id', CAMPAIGN)
    const res = await player.rpc('import_battle_records', { p_campaign_id: CAMPAIGN, p_matches: TWO_MATCHES })
    expect(res.error?.code).toBe('42501')
    expect(res.error?.message).toMatch(/only the GM can import/)
    const after = await admin.from('matches').select('id', { count: 'exact', head: true }).eq('campaign_id', CAMPAIGN)
    expect(after.count).toBe(before.count)
  })

  it('refuses a participant that is not in the campaign and inserts nothing', async () => {
    const before = await admin.from('matches').select('id', { count: 'exact', head: true }).eq('campaign_id', CAMPAIGN)
    const res = await gm.rpc('import_battle_records', {
      p_campaign_id: CAMPAIGN,
      p_matches: [
        TWO_MATCHES[0],
        { played_at: '2026-09-03T20:00:00.000Z', participants: [{ warband_id: REIKLAND_WATCH, result: 'won' }, { warband_id: OUTSIDER_WARBAND, result: 'lost' }] },
      ],
    })
    expect(res.error?.code).toBe('22023')
    expect(res.error?.message).toMatch(new RegExp(`warband ${OUTSIDER_WARBAND} is not an active member`))
    const after = await admin.from('matches').select('id', { count: 'exact', head: true }).eq('campaign_id', CAMPAIGN)
    expect(after.count).toBe(before.count)
    const reports = await admin.from('match_reports').select('id').eq('warband_id', OUTSIDER_WARBAND)
    expect(reports.data).toEqual([])
  })

  it('validates the payload shape', async () => {
    const notArray = await gm.rpc('import_battle_records', { p_campaign_id: CAMPAIGN, p_matches: { nope: true } })
    expect(notArray.error?.message).toMatch(/must be an array/)
    const noParticipants = await gm.rpc('import_battle_records', { p_campaign_id: CAMPAIGN, p_matches: [{ played_at: '2026-09-01T00:00:00Z', participants: [] }] })
    expect(noParticipants.error?.message).toMatch(/at least one participant/)
    const badDate = await gm.rpc('import_battle_records', { p_campaign_id: CAMPAIGN, p_matches: [{ played_at: 'soon', participants: [{ warband_id: REIKLAND_WATCH, result: 'won' }] }] })
    expect(badDate.error?.message).toMatch(/unreadable date/)
    const badResult = await gm.rpc('import_battle_records', { p_campaign_id: CAMPAIGN, p_matches: [{ played_at: '2026-09-01T00:00:00Z', participants: [{ warband_id: REIKLAND_WATCH, result: 'smashed' }] }] })
    expect(badResult.error?.message).toMatch(/result must be won, lost or draw/)
    const twice = await gm.rpc('import_battle_records', {
      p_campaign_id: CAMPAIGN,
      p_matches: [{ played_at: '2026-09-01T00:00:00Z', participants: [{ warband_id: REIKLAND_WATCH, result: 'won' }, { warband_id: REIKLAND_WATCH, result: 'lost' }] }],
    })
    expect(twice.error?.message).toMatch(/listed twice/)
  })

  it('lets the GM import two matches that land as completed imports readable by every member', async () => {
    const res = await gm.rpc('import_battle_records', { p_campaign_id: CAMPAIGN, p_matches: TWO_MATCHES })
    expect(res.error).toBeNull()
    expect(res.data).toBe(2)

    const matches = await gm
      .from('matches')
      .select('id, state, created_via, created_by, scenario_rules_id, scheduled_for, started_at, completed_at, notes, match_participants(warband_id, accepted_at)')
      .eq('campaign_id', CAMPAIGN)
      .eq('created_via', 'import')
      .order('completed_at')
    expect(matches.error).toBeNull()
    expect(matches.data).toHaveLength(2)
    const [skirmish, custom] = matches.data!
    expect(skirmish).toMatchObject({ state: 'completed', created_via: 'import', created_by: GM.id, scenario_rules_id: 'skirmish', notes: '' })
    expect(new Date(skirmish!.completed_at as string).toISOString()).toBe('2026-08-31T09:28:00.000Z')
    expect(skirmish!.scheduled_for).toBe(skirmish!.started_at)
    expect(skirmish!.started_at).toBe(skirmish!.completed_at)
    expect(skirmish!.match_participants.map((p: { warband_id: string; accepted_at: string | null }) => p.accepted_at !== null)).toEqual([true, true])
    expect(custom).toMatchObject({ state: 'completed', scenario_rules_id: null, notes: 'Scenario: The Cursed Well\nHouse scenario' })

    // The player (a member, not the GM) reads both matches and all four reports.
    const asPlayer = await player.from('match_reports').select('match_id, warband_id, submitted_by, won, result, xp_log, ooa, notes, submitted_at').in('match_id', [skirmish!.id, custom!.id]).order('submitted_at')
    expect(asPlayer.error).toBeNull()
    expect(asPlayer.data).toHaveLength(4)
    const watch = asPlayer.data!.find((r) => r.match_id === skirmish!.id && r.warband_id === REIKLAND_WATCH)!
    expect(watch).toMatchObject({ submitted_by: GM.id, won: true, result: 'won', notes: 'Held the bridge' })
    expect(new Date(watch.submitted_at as string).toISOString()).toBe('2026-08-31T09:28:00.000Z')
    expect(watch.xp_log).toEqual([
      { subjectType: 'group', subjectId: 'import', subjectName: 'Warband total (imported)', amount: 6, reasons: ['Imported battle record'], xpBefore: 0, xpAfter: 6, advancesEarned: 0 },
    ])
    expect(watch.ooa).toEqual([{ subjectType: 'group', subjectId: 'import', subjectName: 'Casualties (imported)', count: 1 }])
    const eshinDraw = asPlayer.data!.find((r) => r.match_id === custom!.id && r.warband_id === CLAWS_OF_ESHIN)!
    expect(eshinDraw).toMatchObject({ won: false, result: 'draw', xp_log: [], ooa: [], notes: '' })
    const watchDraw = asPlayer.data!.find((r) => r.match_id === custom!.id && r.warband_id === REIKLAND_WATCH)!
    expect(watchDraw.ooa).toEqual([])
    expect((watchDraw.xp_log as { amount: number }[])[0]!.amount).toBe(2)

    // Rosters untouched, audit labelled.
    const wb = await admin.from('warbands').select('gold, wyrdstone').eq('id', CLAWS_OF_ESHIN).single()
    expect(wb.data).toEqual({ gold: 20, wyrdstone: 2 })
    const pending = await admin.from('pending_advances').select('id').in('warband_id', [REIKLAND_WATCH, CLAWS_OF_ESHIN])
    expect(pending.data).toEqual([])
    const audit = await gm.from('audit_log').select('reason').eq('row_id', skirmish!.id).eq('table_name', 'matches')
    expect(audit.data?.length).toBeGreaterThan(0)
    expect(audit.data?.every((a) => a.reason === 'import')).toBe(true)
  })
})
