// Local-only API/RPC coverage; the browser interaction itself still needs a live UI pass.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { randomUUID } from 'node:crypto'
import { generateMatchups } from '../../rules/resolve/matchmaking'
import { validateNewMatch } from '../../features/match/schedule/helpers'

const connection = vi.hoisted(() => ({ client: null as SupabaseClient | null }))
vi.mock('../supabase', () => ({ supabase: new Proxy({}, {
  get(_target, prop) {
    const value = Reflect.get(connection.client!, prop)
    return typeof value === 'function' ? value.bind(connection.client) : value
  },
}) }))
import { fetchMatchmakingHistory } from '../matchmaking'
import { scheduleMatch } from '../matches'

const enabled = process.env.SUPABASE_LOCAL === '1'
const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const GM = { email: 'gm@stirheim.test', password: 'stirheim-dev', id: '11111111-1111-4111-8111-111111111111' }
const PLAYER = { email: 'player@stirheim.test', password: 'stirheim-dev', id: '22222222-2222-4222-8222-222222222222' }

describe.skipIf(!enabled)('matchup maker against local Supabase', () => {
  let gm: SupabaseClient
  let player: SupabaseClient
  let admin: SupabaseClient
  let campaignId: string
  const warbandIds: string[] = []
  let savedIds: string[] = []
  let bye: string
  let roundId: string

  beforeAll(async () => {
    if (!['localhost', '127.0.0.1'].includes(new URL(url).hostname)) throw new Error('This suite only runs against local Supabase.')
    const options = { auth: { persistSession: false, autoRefreshToken: false } }
    gm = createClient(url, process.env.SUPABASE_ANON_KEY!, options)
    player = createClient(url, process.env.SUPABASE_ANON_KEY!, options)
    admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, options)
    for (const [client, credentials] of [[gm, GM], [player, PLAYER]] as const) {
      const result = await client.auth.signInWithPassword(credentials)
      if (result.error) throw result.error
    }
    connection.client = gm
    const campaign = await gm.from('campaigns').insert({ name: 'Matchmaking integration ' + randomUUID() }).select('id, invite_code').single()
    if (campaign.error) throw campaign.error
    campaignId = campaign.data.id
    for (let i = 0; i < 5; i++) {
      const client = i < 2 ? gm : player
      const wb = await client.from('warbands').insert({ name: 'Matchmaking test ' + i, type_rules_id: 'mercenaries_reikland' }).select('id').single()
      if (wb.error) throw wb.error
      warbandIds.push(wb.data.id)
      const joined = await client.rpc('join_campaign', { p_invite_code: campaign.data.invite_code, p_warband_id: wb.data.id })
      if (joined.error) throw joined.error
    }
  })

  afterAll(async () => {
    if (campaignId) await admin.from('campaigns').delete().eq('id', campaignId)
    if (warbandIds.length) await admin.from('warbands').delete().in('id', warbandIds)
    await gm?.auth.signOut()
    await player?.auth.signOut()
  })

  it('generates from real history and saves through form validation and schedule_match', async () => {
    const data = await fetchMatchmakingHistory(campaignId)
    expect(data.history).toEqual([])
    const proposal = generateMatchups({ ...data, refDate: '2026-09-12', random: () => 0.99,
      warbands: warbandIds.map((id, i) => ({ id, ownerId: i < 2 ? GM.id : PLAYER.id, active: true })),
      attendingPlayerIds: [GM.id, PLAYER.id],
    }, 2)
    expect(proposal.ok).toBe(true)
    if (!proposal.ok) return
    const round = proposal.rounds[0]
    bye = round.bye!
    roundId = randomUUID()
    savedIds = []
    for (const pair of round.pairs) {
      const validated = validateNewMatch({ campaignId, warbandIds: [...pair], scenario: { kind: 'builtin', id: 'skirmish' }, scheduledLocal: '2026-09-12', notes: 'Matchup integration', randomlyChosen: true }, { mode: 'gm', myWarbandIds: [] })
      expect(validated.ok).toBe(true)
      if (!validated.ok) continue
      savedIds.push(await scheduleMatch({ ...validated.input, matchmakingRoundId: roundId, matchmakingByeWarbandId: bye }))
    }
    const history = await fetchMatchmakingHistory(campaignId)
    expect(history.history).toHaveLength(2)
    expect(history.byeCounts).toEqual({ [bye]: 1 })
    const rows = await gm.from('matches').select('state, scenario_rules_id, scenario_randomly_chosen, match_participants(accepted_at)').in('id', savedIds)
    expect(rows.error).toBeNull()
    expect(rows.data).toHaveLength(2)
    for (const row of rows.data!) {
      expect(row).toMatchObject({ state: 'scheduled', scenario_rules_id: 'skirmish', scenario_randomly_chosen: true })
      expect(row.match_participants.every((p: { accepted_at: string | null }) => p.accepted_at)).toBe(true)
    }
  })

  it('rejects replayed/overlapping pairings and mismatched byes atomically', async () => {
    const parts = await gm.from('match_participants').select('warband_id').eq('match_id', savedIds[0])
    const ids = parts.data!.map((p) => p.warband_id)
    await expect(scheduleMatch({ campaignId, warbandIds: ids, matchmakingRoundId: roundId, matchmakingByeWarbandId: bye })).rejects.toThrow(/already scheduled/)
    await expect(scheduleMatch({ campaignId, warbandIds: ids, matchmakingRoundId: roundId })).rejects.toThrow(/different campaign or bye/)
    expect((await fetchMatchmakingHistory(campaignId)).history).toHaveLength(2)
  })

  it('rejects non-GM metadata, same-owner pairings and a participant as the bye', async () => {
    const args = { p_campaign_id: campaignId, p_warband_ids: [warbandIds[0], warbandIds[2]], p_matchmaking_round_id: randomUUID() }
    const notGm = await player.rpc('schedule_match', args)
    expect(notGm.error?.message).toMatch(/only the GM/)
    const sameOwner = await gm.rpc('schedule_match', { ...args, p_warband_ids: warbandIds.slice(0, 2) })
    expect(sameOwner.error?.message).toMatch(/different owners/)
    const participantBye = await gm.rpc('schedule_match', { ...args, p_matchmaking_bye_warband_id: warbandIds[0] })
    expect(participantBye.error?.message).toMatch(/another active/)
    const missingRound = await gm.rpc('schedule_match', { ...args, p_matchmaking_round_id: null, p_matchmaking_bye_warband_id: bye })
    expect(missingRound.error?.message).toMatch(/needs a matchmaking round/)
  })

  it('counts a saved round bye once until all its games are cancelled', async () => {
    expect((await gm.rpc('cancel_match', { p_match_id: savedIds[0] })).error).toBeNull()
    const partial = await fetchMatchmakingHistory(campaignId)
    expect(partial.history).toHaveLength(1)
    expect(partial.byeCounts).toEqual({ [bye]: 1 })
    expect((await gm.rpc('cancel_match', { p_match_id: savedIds[1] })).error).toBeNull()
    expect(await fetchMatchmakingHistory(campaignId)).toEqual({ history: [], byeCounts: {} })
  })

  it('preserves the original challenge flow when matchmaking metadata is absent', async () => {
    const challenge = await player.rpc('schedule_match', { p_campaign_id: campaignId, p_warband_ids: [warbandIds[0], warbandIds[2]] })
    expect(challenge.error).toBeNull()
    const row = await gm.from('matches').select('created_via, matchmaking_round_id, match_participants(accepted_at)').eq('id', challenge.data).single()
    expect(row.data?.created_via).toBe('challenge')
    expect(row.data?.matchmaking_round_id).toBeNull()
    expect(row.data?.match_participants.filter((p: { accepted_at: string | null }) => p.accepted_at === null)).toHaveLength(1)
    expect((await fetchMatchmakingHistory(campaignId)).history).toHaveLength(1)
  })
})
