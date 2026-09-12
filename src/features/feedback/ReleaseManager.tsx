import { useState } from 'react'
import { publishRelease, saveReleaseDraft } from '../../api/feedback'
import { Button, Notice, TextArea, TextField } from '../../ui'
import type { FeedbackRelease } from './types'
export function ReleaseManager({ releases, onSaved }: { releases: FeedbackRelease[]; onSaved: () => Promise<void> }) {
  const [version, setVersion] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [confirm, setConfirm] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function run(work: () => Promise<void>) {
    setPending(true); setError('')
    try { await work(); await onSaved() } catch(error) { setError(error instanceof Error ? error.message : 'Could not save the release.') } finally { setPending(false) }
  }
  return <details className="rounded-md border border-border p-4"><summary className="cursor-pointer font-semibold">Manage release notes</summary><div className="mt-4 flex flex-col gap-4">
    <p className="text-sm text-ink-dim">Create a draft, then link its reports using Review this report. Publish only after the update is live. Publishing moves its Working on reports to Implemented and notifies their followers.</p>
    {releases.filter(release => !release.published_at).map(release => <div key={release.id} className="rounded-md border border-border p-3"><h3 className="font-semibold">{release.version} · {release.title}</h3><p className="my-3 whitespace-pre-wrap text-sm">{release.notes}</p>{confirm === release.id ? <><p className="mb-3 text-sm">Confirm this version is deployed and its changes are available to players. This will publish the notes and send notifications.</p><Button pending={pending} onClick={() => void run(async () => { await publishRelease(release.id); setConfirm(null) })}>The update is live — publish notes</Button><Button variant="secondary" onClick={() => setConfirm(null)} disabled={pending}>Cancel</Button></> : <Button variant="secondary" onClick={() => setConfirm(release.id)}>Review publication</Button>}</div>)}
    <form className="flex flex-col gap-3" onSubmit={e => { e.preventDefault(); void run(async () => { await saveReleaseDraft(version, title, notes); setVersion(''); setTitle(''); setNotes('') }) }}>
      <TextField label="Version" value={version} maxLength={40} required placeholder="e.g. 2026.09.13" onChange={e => setVersion(e.target.value)} />
      <TextField label="Release title" value={title} maxLength={140} required onChange={e => setTitle(e.target.value)} />
      <TextArea label="What changed?" value={notes} maxLength={12000} required rows={6} onChange={e => setNotes(e.target.value)} />
      <Button variant="secondary" type="submit" pending={pending}>Save private draft</Button>
    </form>{error && <Notice tone="error">{error}</Notice>}
  </div></details>
}
