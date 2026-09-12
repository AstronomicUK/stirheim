/** Reviewed historical import. Dry-run by default; never overwrites an existing public report. */
import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
const path = new URL('../../docs/FEEDBACK-PUBLIC-IMPORT-2026-09-12.json', import.meta.url)
const entries = JSON.parse(await readFile(path, 'utf8'))
const ids = new Set()
for (const entry of entries) {
  if (!Number.isInteger(entry.id) || entry.id < 1 || entry.id > 231 || ids.has(entry.id)) throw Error('Invalid or duplicate historical ID')
  ids.add(entry.id)
  if (!entry.reviewed || !entry.evidence?.trim()) throw Error(`#${entry.id} still needs evidence-backed review`)
  if (!entry.include) continue
  if (!['bug','improvement'].includes(entry.kind) || !['high','medium','low'].includes(entry.priority) || !['reported','reviewed','working_on','implemented','confirmed'].includes(entry.status)) throw Error(`#${entry.id}: invalid board values`)
  if (entry.title.trim().length < 5 || entry.title.length > 140 || entry.notes.trim().length < 10 || entry.notes.length > 12000) throw Error(`#${entry.id}: invalid public text length`)
  if (['implemented','confirmed'].includes(entry.status) && entry.release_version !== '2026.09.12') throw Error(`#${entry.id}: missing verified baseline release`)
  if (/\/Users\/|\/tmp\/|service.role|password\s*[:=]/i.test(entry.notes)) throw Error(`#${entry.id}: internal/private content needs review`)
}
if (ids.size !== 231) throw Error('All 231 historical entries must be accounted for, including exclusions')
const included = entries.filter(entry => entry.include)
console.log(`Reviewed: ${entries.length}. Include: ${included.length}. Exclude: ${entries.length-included.length}.`)
if (!process.argv.includes('--apply')) { console.log('Dry run only. No database connection or changes.'); process.exit(0) }
const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw Error('Provide SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
const hostname = new URL(url).hostname
if (!['127.0.0.1','localhost'].includes(hostname) && !process.argv.includes(`--confirm-host=${hostname}`)) throw Error('Remote import requires an explicit matching --confirm-host argument after release approval')
const db = createClient(url, key, { auth: { persistSession: false } })
const check = result => { if (result.error) throw Error(result.error.message); return result.data }
let release = check(await db.from('feedback_releases').select('id').eq('version','2026.09.12').maybeSingle())
if (!release) release = check(await db.from('feedback_releases').insert({ version: '2026.09.12', title: 'The starting point for our public changelog', notes: 'This baseline records the improvements already available when the public tracker was introduced, including the completed core rulebook batch. Older resolved reports link here for reference; they were delivered across earlier updates, not all in one release.', published_at: '2026-09-12T16:00:00Z' }).select('id').single())
const existing = check(await db.from('feedback_issues').select('id').lte('id',231))
const existingIds = new Set(existing.map(row => row.id))
const rows = included.filter(entry => !existingIds.has(entry.id)).map(entry => ({ id: entry.id, kind: entry.kind, title: entry.title.trim(), notes: entry.notes.trim(), priority: entry.priority, status: entry.status, reported_by: entry.reported_by, release_id: entry.release_version ? release.id : null }))
if (rows.length) check(await db.from('feedback_issues').insert(rows))
console.log(`Inserted ${rows.length} historical reports; preserved ${existingIds.size} existing reports without overwriting changes.`)
