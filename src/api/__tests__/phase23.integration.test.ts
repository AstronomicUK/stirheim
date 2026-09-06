// Phase 23 against the LOCAL stack (SUPABASE_LOCAL=1): agreeing where the battle is fought.
// A match scheduled with the district left open is settled by the two sides — by landing on the
// same district, by one taking the other's, or by both calling a roll-off.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

const enabled = process.env.SUPABASE_LOCAL === '1'
const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const anonKey = process.env.SUPABASE_ANON_KEY ?? ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const PLAYER = { email: 'player@stirheim.test', password: 'stirheim-dev' }
const GM = { email: 'gm@stirheim.test', password: 'stirheim-dev' }
const CAMPAIGN = 'dddddddd-0000-4000-8000-000000000001'
// The GM owns the Reikland Watch; the player owns the Claws of Eshin.
const REIKLAND_WATCH = 'aaaaaaaa-0000-4000-8000-000000000001'
const CLAWS_OF_ESHIN = 'aaaaaaaa-0000-4000-8000-000000000002'

function client(): SupabaseClient {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

describe.skipIf(!enabled)('phase 23: agreeing the district', () => {
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

  afterEach(async () => {
    if (created.length) await admin.from('matches').delete().in('id', created.splice(0))
  })

  /** A match with the district left for the players to settle. */
  async function openMatch(): Promise<string> {
    const booked = await gm.rpc('schedule_match', { p_campaign_id: CAMPAIGN, p_warband_ids: [REIKLAND_WATCH, CLAWS_OF_ESHIN] })
    expect(booked.error).toBeNull()
    const id = booked.data as string
    created.push(id)
    return id
  }

  const district = async (matchId: string) => (await gm.from('matches').select('district_id, district_decided_by').eq('id', matchId).single()).data

  it('a district named at scheduling is recorded as chosen then, not agreed', async () => {
    const booked = await gm.rpc('schedule_match', { p_campaign_id: CAMPAIGN, p_warband_ids: [REIKLAND_WATCH, CLAWS_OF_ESHIN], p_district_id: 'west-gate' })
    const id = booked.data as string
    created.push(id)
    // schedule_match itself does not stamp it; setting one by hand does.
    await gm.rpc('set_match_district', { p_match_id: id, p_district_id: 'west-gate' })
    expect(await district(id)).toEqual({ district_id: 'west-gate', district_decided_by: 'scheduled' })
    // A settled district is closed to proposals.
    const late = await player.rpc('propose_match_district', { p_match_id: id, p_warband_id: CLAWS_OF_ESHIN, p_district_id: 'the-pit' })
    expect(late.error?.message).toMatch(/already has a district/)
  })

  it('one side proposing settles nothing until the other answers', async () => {
    const id = await openMatch()
    const proposed = await gm.rpc('propose_match_district', { p_match_id: id, p_warband_id: REIKLAND_WATCH, p_district_id: 'west-gate' })
    expect(proposed.error).toBeNull()
    expect(await district(id)).toEqual({ district_id: null, district_decided_by: null })

    // Both sides can see where the negotiation stands.
    const seen = await player.from('match_district_proposals').select('warband_id, district_id, stance').eq('match_id', id)
    expect(seen.data).toEqual([{ warband_id: REIKLAND_WATCH, district_id: 'west-gate', stance: 'proposed' }])
  })

  it('taking the other side\'s district settles it', async () => {
    const id = await openMatch()
    await gm.rpc('propose_match_district', { p_match_id: id, p_warband_id: REIKLAND_WATCH, p_district_id: 'west-gate' })
    const agreed = await player.rpc('agree_match_district', { p_match_id: id, p_warband_id: CLAWS_OF_ESHIN, p_district_id: 'west-gate' })
    expect(agreed.error).toBeNull()
    expect(await district(id)).toEqual({ district_id: 'west-gate', district_decided_by: 'agreed' })
  })

  it('both sides naming the same district settles it without anyone conceding', async () => {
    const id = await openMatch()
    await gm.rpc('propose_match_district', { p_match_id: id, p_warband_id: REIKLAND_WATCH, p_district_id: 'the-pit' })
    await player.rpc('propose_match_district', { p_match_id: id, p_warband_id: CLAWS_OF_ESHIN, p_district_id: 'the-pit' })
    expect(await district(id)).toEqual({ district_id: 'the-pit', district_decided_by: 'agreed' })
  })

  it('a roll-off waits for both sides, then picks one of the two proposed', async () => {
    const id = await openMatch()
    await gm.rpc('propose_match_district', { p_match_id: id, p_warband_id: REIKLAND_WATCH, p_district_id: 'west-gate' })
    await player.rpc('propose_match_district', { p_match_id: id, p_warband_id: CLAWS_OF_ESHIN, p_district_id: 'the-pit' })
    expect(await district(id)).toEqual({ district_id: null, district_decided_by: null })

    await gm.rpc('roll_off_match_district', { p_match_id: id, p_warband_id: REIKLAND_WATCH })
    expect(await district(id)).toEqual({ district_id: null, district_decided_by: null })

    const rolled = await player.rpc('roll_off_match_district', { p_match_id: id, p_warband_id: CLAWS_OF_ESHIN })
    expect(rolled.error).toBeNull()
    const settled = await district(id)
    expect(settled?.district_decided_by).toBe('roll_off')
    expect(['west-gate', 'the-pit']).toContain(settled?.district_id)
  })

  it('changing your mind replaces what you said, and can settle it', async () => {
    const id = await openMatch()
    await gm.rpc('propose_match_district', { p_match_id: id, p_warband_id: REIKLAND_WATCH, p_district_id: 'west-gate' })
    await player.rpc('propose_match_district', { p_match_id: id, p_warband_id: CLAWS_OF_ESHIN, p_district_id: 'the-pit' })
    await player.rpc('propose_match_district', { p_match_id: id, p_warband_id: CLAWS_OF_ESHIN, p_district_id: 'west-gate' })
    expect(await district(id)).toEqual({ district_id: 'west-gate', district_decided_by: 'agreed' })
  })

  it('refuses to answer for a warband you do not own, or to agree to nothing', async () => {
    const id = await openMatch()
    const notMine = await player.rpc('propose_match_district', { p_match_id: id, p_warband_id: REIKLAND_WATCH, p_district_id: 'west-gate' })
    expect(notMine.error?.message).toMatch(/own player/)

    const nothing = await player.rpc('propose_match_district', { p_match_id: id, p_warband_id: CLAWS_OF_ESHIN, p_district_id: '  ' })
    expect(nothing.error?.message).toMatch(/name a district/)

    const unproposed = await player.rpc('agree_match_district', { p_match_id: id, p_warband_id: CLAWS_OF_ESHIN, p_district_id: 'the-pit' })
    expect(unproposed.error?.message).toMatch(/nobody has proposed/)

    const early = await player.rpc('roll_off_match_district', { p_match_id: id, p_warband_id: CLAWS_OF_ESHIN })
    expect(early.error?.message).toMatch(/propose a district before/)
  })

  it('the GM reopening the question clears what the players had said', async () => {
    const id = await openMatch()
    await gm.rpc('propose_match_district', { p_match_id: id, p_warband_id: REIKLAND_WATCH, p_district_id: 'west-gate' })
    await player.rpc('agree_match_district', { p_match_id: id, p_warband_id: CLAWS_OF_ESHIN, p_district_id: 'west-gate' })
    expect((await district(id))?.district_id).toBe('west-gate')

    await gm.rpc('set_match_district', { p_match_id: id, p_district_id: null })
    expect(await district(id)).toEqual({ district_id: null, district_decided_by: null })
    const left = await gm.from('match_district_proposals').select('warband_id').eq('match_id', id)
    expect(left.data).toEqual([])
  })
})

describe.skipIf(!enabled)('phase 23: asking the other player to roll', () => {
  let player: SupabaseClient
  let gm: SupabaseClient
  let admin: SupabaseClient
  let matchId: string

  const ASKS = [
    { kind: 'save', label: 'Armour save', detail: 'Needs 5+', optional: false },
    { kind: 'stunSave', label: 'Helmet', detail: '4+ turns a stun into a knock-down', optional: false },
  ]

  beforeAll(async () => {
    player = client()
    gm = client()
    const a = await player.auth.signInWithPassword(PLAYER)
    const b = await gm.auth.signInWithPassword(GM)
    if (a.error || b.error) throw a.error ?? b.error
    admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

    const booked = await gm.rpc('schedule_match', { p_campaign_id: CAMPAIGN, p_warband_ids: [REIKLAND_WATCH, CLAWS_OF_ESHIN], p_district_id: 'west-gate' })
    matchId = booked.data as string
    await gm.rpc('start_match', { p_match_id: matchId })
  })

  afterAll(async () => {
    if (matchId) await admin.from('matches').delete().eq('id', matchId)
  })

  const ask = (asks: unknown[] = ASKS) =>
    gm.rpc('ask_battle_prompt', {
      p_match_id: matchId,
      p_attacker_warband_id: REIKLAND_WATCH,
      p_attacker_name: 'Captain Ulrich Brandt',
      p_target_warband_id: CLAWS_OF_ESHIN,
      p_target_id: 'bbbbbbbb-0000-4000-8000-000000000011',
      p_target_name: 'Skritch Nightblade',
      p_turn: 2,
      p_asks: asks,
    })

  it('the attacker asks and the defender answers, and only they may', async () => {
    const asked = await ask()
    expect(asked.error).toBeNull()
    const id = asked.data as string

    // The defender sees it waiting, with what is being asked.
    const seen = await player.from('battle_prompts').select('id, state, asks, attacker_name, target_name, turn').eq('id', id).single()
    expect(seen.data).toMatchObject({ state: 'waiting', attacker_name: 'Captain Ulrich Brandt', target_name: 'Skritch Nightblade', turn: 2 })
    expect(seen.data?.asks).toHaveLength(2)

    // Every question has to be answered.
    const short = await player.rpc('answer_battle_prompt', { p_prompt_id: id, p_answers: [{ roll: 5 }] })
    expect(short.error?.message).toMatch(/answer every question/)

    const answered = await player.rpc('answer_battle_prompt', { p_prompt_id: id, p_answers: [{ roll: 5 }, { declined: true }] })
    expect(answered.error).toBeNull()
    const done = await gm.from('battle_prompts').select('state, answers, answered_at').eq('id', id).single()
    expect(done.data?.state).toBe('answered')
    expect(done.data?.answers).toEqual([{ roll: 5 }, { declined: true }])
    expect(done.data?.answered_at).not.toBeNull()

    // Answered once is answered for good.
    const again = await player.rpc('answer_battle_prompt', { p_prompt_id: id, p_answers: [{ roll: 6 }, { roll: 6 }] })
    expect(again.error?.message).toMatch(/no longer open/)
  })

  it('asking again withdraws whatever the attacker left open', async () => {
    const first = (await ask()).data as string
    const second = (await ask()).data as string
    const rows = await gm.from('battle_prompts').select('id, state').in('id', [first, second])
    expect(rows.data?.find((r) => r.id === first)?.state).toBe('withdrawn')
    expect(rows.data?.find((r) => r.id === second)?.state).toBe('waiting')

    // A withdrawn question cannot be answered.
    const late = await player.rpc('answer_battle_prompt', { p_prompt_id: first, p_answers: [{ roll: 5 }, { roll: 5 }] })
    expect(late.error?.message).toMatch(/no longer open/)

    // The attacker may take it back and roll it themselves.
    const pulled = await gm.rpc('withdraw_battle_prompt', { p_prompt_id: second })
    expect(pulled.error).toBeNull()
    expect((await gm.from('battle_prompts').select('state').eq('id', second).single()).data?.state).toBe('withdrawn')
  })

  it('a player may not answer for a warband that is not theirs (the GM may, as they run the table)', async () => {
    // The player attacks this time, so the warband being asked is the GM's.
    const asked = await player.rpc('ask_battle_prompt', {
      p_match_id: matchId,
      p_attacker_warband_id: CLAWS_OF_ESHIN,
      p_attacker_name: 'Skritch Nightblade',
      p_target_warband_id: REIKLAND_WATCH,
      p_target_id: 'bbbbbbbb-0000-4000-8000-000000000001',
      p_target_name: 'Captain Ulrich Brandt',
      p_turn: 3,
      p_asks: [ASKS[0]],
    })
    expect(asked.error).toBeNull()
    const id = asked.data as string

    const notTheirs = await player.rpc('answer_battle_prompt', { p_prompt_id: id, p_answers: [{ roll: 5 }] })
    expect(notTheirs.error?.message).toMatch(/only the defending player/)

    const theirs = await gm.rpc('answer_battle_prompt', { p_prompt_id: id, p_answers: [{ roll: 5 }] })
    expect(theirs.error).toBeNull()
  })

  it('refuses an empty question, a warband outside the match, and the wrong asker', async () => {
    expect((await ask([])).error?.message).toMatch(/at least one roll/)

    const notMine = await player.rpc('ask_battle_prompt', {
      p_match_id: matchId,
      p_attacker_warband_id: REIKLAND_WATCH,
      p_attacker_name: 'Someone',
      p_target_warband_id: CLAWS_OF_ESHIN,
      p_target_id: 'x',
      p_target_name: 'Skritch',
      p_turn: 1,
      p_asks: ASKS,
    })
    expect(notMine.error?.message).toMatch(/only the attacking player/)

    const outsider = await gm.rpc('ask_battle_prompt', {
      p_match_id: matchId,
      p_attacker_warband_id: REIKLAND_WATCH,
      p_attacker_name: 'Captain',
      p_target_warband_id: '00000000-0000-4000-8000-000000000000',
      p_target_id: 'x',
      p_target_name: 'Nobody',
      p_turn: 1,
      p_asks: ASKS,
    })
    expect(outsider.error).not.toBeNull()
  })
})
