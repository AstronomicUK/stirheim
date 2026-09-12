// #230 feedback boards backend against the LOCAL stack (SUPABASE_LOCAL=1): public reads, attributed
// submissions with validation and a rate limit, maintainer-only review/merge/publish, follows that
// survive merges, private notifications sent exactly once per issue and release, and stale-edit
// rejection. Everything created here is deleted afterwards; the seeded GM is made a maintainer for
// the duration of the file and removed again.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
const enabled = process.env.SUPABASE_LOCAL === '1'
const gmId = '11111111-1111-4111-8111-111111111111'
const playerId = '22222222-2222-4222-8222-222222222222'
const TAG = `[itest ${crypto.randomUUID().slice(0, 8)}]`
const notes = (s = '') => `${TAG} Disposable feedback integration test notes. ${s}`.trim()

describe.skipIf(!enabled)('feedback boards backend (#230)', () => {
  let admin: SupabaseClient, gm: SupabaseClient, player: SupabaseClient, anonymous: SupabaseClient
  const issues: number[] = []
  const releases: string[] = []
  beforeAll(async () => {
    const url = process.env.SUPABASE_URL!, key = process.env.SUPABASE_ANON_KEY!
    admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    gm = createClient(url, key, { auth: { persistSession: false } })
    player = createClient(url, key, { auth: { persistSession: false } })
    anonymous = createClient(url, key, { auth: { persistSession: false } })
    for (const [client, email] of [[gm, 'gm@stirheim.test'], [player, 'player@stirheim.test']] as const) {
      const login = await client.auth.signInWithPassword({ email, password: 'stirheim-dev' })
      if (login.error) throw login.error
    }
    await admin.from('feedback_maintainers').delete().eq('user_id', gmId)
  })
  afterAll(async () => {
    if (issues.length) {
      await admin.from('app_notifications').delete().in('href', issues.map((id) => `/feedback/${id}`))
      await admin.from('feedback_issues').delete().in('id', issues)
    }
    if (releases.length) await admin.from('feedback_releases').delete().in('id', releases)
    await admin.from('feedback_maintainers').delete().eq('user_id', gmId)
  })
  const submit = async (client: SupabaseClient, title: string, kind = 'bug', body = notes()) => {
    const r = await client.rpc('submit_feedback', { p_kind: kind, p_title: title, p_notes: body })
    if (!r.error) issues.push(r.data as number)
    return r
  }
  const issue = async (id: number) => (await admin.from('feedback_issues').select('*').eq('id', id).single()).data!
  const makeMaintainer = async () => { const r = await admin.from('feedback_maintainers').upsert({ user_id: gmId }); if (r.error) throw r.error }
  const draftRelease = async (version: string) => {
    const r = await admin.from('feedback_releases').insert({ version, title: `${TAG} release ${version}`, notes: 'Disposable.' }).select('id').single()
    if (r.error) throw r.error
    releases.push(r.data.id as string)
    return r.data.id as string
  }

  it('anyone can read the board, but only a signed-in user can report, and the report is attributed to their display name', async () => {
    const r = await submit(player, `${TAG} Dice popup clips on a phone`)
    expect(r.error).toBeNull()
    const id = r.data as number
    expect(id).toBeGreaterThanOrEqual(232)
    const row = await issue(id)
    expect(row).toMatchObject({ kind: 'bug', status: 'reported', priority: 'medium', reported_by: 'Ana', release_id: null, duplicate_of: null })
    expect(Object.keys(row).sort()).toEqual(['created_at', 'duplicate_of', 'id', 'kind', 'notes', 'priority', 'release_id', 'reported_by', 'status', 'title', 'updated_at'])
    const publicRead = await anonymous.from('feedback_issues').select('id,title,reported_by').eq('id', id).single()
    expect(publicRead.error).toBeNull()
    expect(publicRead.data?.reported_by).toBe('Ana')
    const anonSubmit = await anonymous.rpc('submit_feedback', { p_kind: 'bug', p_title: `${TAG} anon`, p_notes: notes() })
    expect(anonSubmit.error?.message).toMatch(/sign in/i)
    // No client can write the table directly.
    expect((await player.from('feedback_issues').insert({ kind: 'bug', title: `${TAG} direct`, notes: notes(), reported_by: 'X' })).error).not.toBeNull()
    expect((await player.from('feedback_issues').update({ title: 'hacked' }).eq('id', id)).error ?? { message: 'no rows' }).toBeTruthy()
    expect((await issue(id)).title).toContain('Dice popup clips')
    // The reporter follows automatically and can see only their own follows.
    const follows = await player.from('feedback_subscriptions').select('issue_id').eq('issue_id', id)
    expect(follows.data).toHaveLength(1)
    expect((await gm.from('feedback_subscriptions').select('issue_id').eq('issue_id', id)).data).toHaveLength(0)
  })

  it('validates kind and lengths after trimming', async () => {
    expect((await submit(player, `${TAG} ok`, 'wish')).error?.message).toMatch(/Bug or Improvement/)
    expect((await submit(player, '  ab  ')).error?.message).toMatch(/5 to 140/)
    expect((await submit(player, `${TAG} fine title`, 'improvement', '   short   ')).error?.message).toMatch(/10 to 12000/)
    expect((await submit(player, 'x'.repeat(141))).error?.message).toMatch(/5 to 140/)
    const ok = await submit(player, `  ${TAG} Trimmed title  `, 'improvement', `   ${notes('trimmed')}   `)
    expect(ok.error).toBeNull()
    const row = await issue(ok.data as number)
    expect(row.title).toBe(`${TAG} Trimmed title`)
    expect(row.kind).toBe('improvement')
  })

  it('rate-limits a user to ten submissions an hour', async () => {
    const before = (await admin.from('feedback_submissions').select('issue_id', { count: 'exact', head: true }).eq('user_id', gmId).gt('created_at', new Date(Date.now() - 3600_000).toISOString())).count ?? 0
    expect(before).toBe(0)
    for (let i = 0; i < 10; i++) expect((await submit(gm, `${TAG} GM report ${i + 1}`)).error).toBeNull()
    const eleventh = await submit(gm, `${TAG} GM report 11`)
    expect(eleventh.error?.message).toMatch(/ten reports in the last hour/)
    // Another user is not affected.
    expect((await submit(player, `${TAG} Player still fine`)).error).toBeNull()
  })

  it('maintainers are service-role managed; review is maintainer-only and rejects stale edits', async () => {
    expect((await player.rpc('is_feedback_maintainer')).data).toBe(false)
    expect((await anonymous.rpc('is_feedback_maintainer')).data).toBe(false)
    expect((await player.from('feedback_maintainers').insert({ user_id: playerId })).error).not.toBeNull()
    expect((await player.from('feedback_maintainers').select('user_id')).data).toEqual([])
    const id = (await submit(player, `${TAG} Needs review`)).data as number
    const row = await issue(id)
    const args = { p_issue_id: id, p_title: row.title, p_notes: row.notes, p_priority: 'high', p_status: 'reviewed', p_kind: 'bug', p_expected_updated_at: row.updated_at }
    expect((await player.rpc('review_feedback', args)).error?.message).toMatch(/maintainer/)
    await makeMaintainer()
    expect((await gm.rpc('is_feedback_maintainer')).data).toBe(true)
    expect((await gm.rpc('review_feedback', { ...args, p_expected_updated_at: '2020-01-01T00:00:00Z' })).error?.message).toMatch(/changed since you opened it/)
    expect((await gm.rpc('review_feedback', args)).error).toBeNull()
    const after = await issue(id)
    expect(after).toMatchObject({ priority: 'high', status: 'reviewed' })
    expect(after.updated_at).not.toBe(row.updated_at)
    // The first editor's stale timestamp is now refused.
    expect((await gm.rpc('review_feedback', { ...args, p_status: 'working_on' })).error?.message).toMatch(/changed since/)
    // Implemented needs a published release.
    expect((await gm.rpc('review_feedback', { ...args, p_expected_updated_at: after.updated_at, p_status: 'implemented' })).error?.message).toMatch(/need the release/)
    const draft = await draftRelease(`${TAG} 0.0.1`)
    expect((await gm.rpc('review_feedback', { ...args, p_expected_updated_at: after.updated_at, p_status: 'implemented', p_release_id: draft })).error?.message).toMatch(/not published yet/)
    expect((await gm.rpc('review_feedback', { ...args, p_expected_updated_at: after.updated_at, p_status: 'working_on', p_release_id: draft })).error).toBeNull()
    expect(await issue(id)).toMatchObject({ status: 'working_on', release_id: draft })
  })

  it('drafts are visible to maintainers only; publishing advances Working on to Implemented and notifies followers exactly once', async () => {
    await makeMaintainer()
    const release = await draftRelease(`${TAG} 0.0.2`)
    expect((await anonymous.from('feedback_releases').select('id').eq('id', release)).data).toEqual([])
    expect((await player.from('feedback_releases').select('id').eq('id', release)).data).toEqual([])
    expect((await gm.from('feedback_releases').select('id').eq('id', release)).data).toHaveLength(1)
    // Three linked issues: working_on (advances), reviewed (left alone), already implemented (notified once).
    const ids = await Promise.all(['A', 'B', 'C'].map(async (s) => (await submit(player, `${TAG} Publish case ${s}`)).data as number))
    const setStatus = async (id: number, status: string, release_id: string | null) => {
      const r = await admin.from('feedback_issues').update({ status, release_id }).eq('id', id)
      if (r.error) throw r.error
    }
    await setStatus(ids[0], 'working_on', release)
    await setStatus(ids[1], 'reviewed', release)
    // "implemented" cannot exist before publishing; the constraint is enforced in review_feedback, so seed it directly to prove idempotent handling.
    await setStatus(ids[2], 'implemented', release)
    // The GM follows issue A too, so two people are told about it.
    expect((await gm.rpc('follow_feedback', { p_issue_id: ids[0], p_follow: true })).error).toBeNull()
    expect((await player.rpc('publish_feedback_release', { p_release_id: release })).error?.message).toMatch(/maintainer/)
    expect((await gm.rpc('publish_feedback_release', { p_release_id: release })).error).toBeNull()
    expect((await admin.from('feedback_releases').select('published_at').eq('id', release).single()).data?.published_at).not.toBeNull()
    expect((await issue(ids[0])).status).toBe('implemented')
    expect((await issue(ids[1])).status).toBe('reviewed')
    expect((await issue(ids[2])).status).toBe('implemented')
    expect((await anonymous.from('feedback_releases').select('id').eq('id', release)).data).toHaveLength(1)
    const mine = await player.from('app_notifications').select('id,title,body,href,read_at').in('href', ids.map((id) => `/feedback/${id}`)).order('href')
    expect(mine.data?.map((n) => n.href)).toEqual([`/feedback/${ids[0]}`, `/feedback/${ids[2]}`])
    expect(mine.data?.[0].title).toContain(`#${ids[0]} is in release`)
    expect(mine.data?.[0].body).toContain('now implemented')
    expect(mine.data?.every((n) => n.read_at === null)).toBe(true)
    const gms = await gm.from('app_notifications').select('href').in('href', ids.map((id) => `/feedback/${id}`))
    expect(gms.data?.map((n) => n.href)).toEqual([`/feedback/${ids[0]}`])
    // Publishing again (maintainer, then service role) sends nothing new and changes nothing.
    expect((await gm.rpc('publish_feedback_release', { p_release_id: release })).error).toBeNull()
    expect((await admin.rpc('publish_feedback_release', { p_release_id: release })).error).toBeNull()
    const total = await admin.from('app_notifications').select('id', { count: 'exact', head: true }).in('href', ids.map((id) => `/feedback/${id}`))
    expect(total.count).toBe(3)
    // Owners mark their own read; nobody else can touch them; nobody reads another's inbox.
    const first = mine.data![0].id
    expect((await gm.rpc('mark_notification_read', { p_id: first })).error?.message).toMatch(/not found/)
    expect((await player.rpc('mark_notification_read', { p_id: first })).error).toBeNull()
    expect((await player.from('app_notifications').select('read_at').eq('id', first).single()).data?.read_at).not.toBeNull()
    expect((await gm.from('app_notifications').select('id').eq('id', first)).data).toEqual([])
    expect((await player.from('app_notifications').insert({ user_id: gmId, title: 'spam' })).error).not.toBeNull()
    // Confirmed afterwards keeps the published link and needs no second notification.
    const c = await issue(ids[2])
    expect((await gm.rpc('review_feedback', { p_issue_id: ids[2], p_title: c.title, p_notes: c.notes, p_priority: c.priority, p_status: 'confirmed', p_kind: c.kind, p_expected_updated_at: c.updated_at, p_release_id: release })).error).toBeNull()
    expect((await gm.rpc('publish_feedback_release', { p_release_id: release })).error).toBeNull()
    expect((await admin.from('app_notifications').select('id', { count: 'exact', head: true }).in('href', ids.map((id) => `/feedback/${id}`))).count).toBe(3)
  })

  it('follow and unfollow, following a duplicate lands on its canonical issue, and merges move followers without notifying anyone', async () => {
    await makeMaintainer()
    const a = (await submit(player, `${TAG} Merge A`)).data as number
    const b = (await submit(player, `${TAG} Merge B`)).data as number
    const c = (await submit(player, `${TAG} Merge C`)).data as number
    expect((await gm.rpc('follow_feedback', { p_issue_id: a, p_follow: true })).error).toBeNull()
    expect((await gm.rpc('follow_feedback', { p_issue_id: a, p_follow: true })).error).toBeNull() // idempotent
    expect((await gm.from('feedback_subscriptions').select('issue_id').eq('issue_id', a)).data).toHaveLength(1)
    expect((await player.rpc('merge_feedback', { p_issue_id: a, p_target_id: b })).error?.message).toMatch(/maintainer/)
    expect((await gm.rpc('merge_feedback', { p_issue_id: a, p_target_id: a })).error?.message).toMatch(/itself/)
    expect((await gm.rpc('merge_feedback', { p_issue_id: a, p_target_id: b })).error).toBeNull()
    expect((await issue(a)).duplicate_of).toBe(b)
    expect((await issue(a)).notes).toContain('Disposable feedback integration test notes')
    // Followers of A (player as reporter, GM by choice) now follow B; A has none.
    expect((await admin.from('feedback_subscriptions').select('user_id').eq('issue_id', a)).data).toEqual([])
    expect((await admin.from('feedback_subscriptions').select('user_id').eq('issue_id', b)).data?.map((r) => r.user_id).sort()).toEqual([gmId, playerId].sort())
    // Cycles and re-merges are refused; merging into a duplicate resolves to its canonical issue.
    expect((await gm.rpc('merge_feedback', { p_issue_id: b, p_target_id: a })).error?.message).toMatch(/duplicates of each other/)
    expect((await gm.rpc('merge_feedback', { p_issue_id: a, p_target_id: c })).error?.message).toMatch(/already recorded as a duplicate/)
    expect((await gm.rpc('merge_feedback', { p_issue_id: c, p_target_id: a })).error).toBeNull()
    expect((await issue(c)).duplicate_of).toBe(b)
    // Following the duplicate follows the canonical issue; unfollowing through the duplicate clears it.
    expect((await gm.rpc('follow_feedback', { p_issue_id: c, p_follow: true })).error).toBeNull()
    expect((await gm.from('feedback_subscriptions').select('issue_id').eq('issue_id', c)).data).toEqual([])
    expect((await gm.rpc('follow_feedback', { p_issue_id: c, p_follow: false })).error).toBeNull()
    expect((await gm.from('feedback_subscriptions').select('issue_id').eq('issue_id', b)).data).toEqual([])
    // Nobody was told anything was fixed.
    expect((await admin.from('app_notifications').select('id', { count: 'exact', head: true }).in('href', [a, b, c].map((id) => `/feedback/${id}`))).count).toBe(0)
    expect((await anonymous.rpc('follow_feedback', { p_issue_id: b, p_follow: true })).error?.message).toMatch(/sign in/i)
  })
})
