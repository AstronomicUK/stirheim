import { useState } from 'react'
import { Button, Notice, SelectField, TextArea, TextField } from '../../ui'
import { mergeFeedback, reviewFeedback } from '../../api/feedback'
import { stages, stageLabels, type FeedbackIssue, type FeedbackRelease } from './types'
import { reportProblem } from './board'
export function FeedbackEditor({ issue, releases, onSaved }: { issue: FeedbackIssue; releases: FeedbackRelease[]; onSaved: () => Promise<void> }) {
  const [draft, setDraft] = useState(issue)
  const [target, setTarget] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [mergeConfirm, setMergeConfirm] = useState(false)
  async function save(merge = false) {
    const problem = merge ? (!/^\d+$/.test(target) || Number(target) === issue.id ? 'Choose another report number.' : null) : reportProblem(draft.title, draft.notes)
    if (problem) return setError(problem)
    setPending(true); setError('')
    try { if (merge) await mergeFeedback(issue.id, Number(target)); else await reviewFeedback(draft, issue.updated_at); await onSaved() }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not save. Refresh and try again.') }
    finally { setPending(false) }
  }
  return <details className="rounded-md border border-border p-4"><summary className="cursor-pointer font-semibold">Review this report</summary><div className="mt-4 flex flex-col gap-4">
    <TextField label="Title" value={draft.title} maxLength={140} onChange={e => setDraft({ ...draft, title: e.target.value })} />
    <TextArea label="Public notes" value={draft.notes} maxLength={12000} rows={7} onChange={e => setDraft({ ...draft, notes: e.target.value })} />
    <SelectField label="Type" value={draft.kind} onChange={e => setDraft({ ...draft, kind: e.target.value as FeedbackIssue['kind'] })}><option value="bug">Bug</option><option value="improvement">Improvement</option></SelectField>
    <SelectField label="Priority" value={draft.priority} onChange={e => setDraft({ ...draft, priority: e.target.value as FeedbackIssue['priority'] })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></SelectField>
    <SelectField label="Stage" value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as FeedbackIssue['status'] })}>{stages.map(stage => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}</SelectField>
    <SelectField label="Release" value={draft.release_id ?? ''} onChange={e => setDraft({ ...draft, release_id: e.target.value || null })}><option value="">Not released yet</option>{releases.map(release => <option key={release.id} value={release.id}>{release.version}{release.published_at ? '' : ' (draft)'} · {release.title}</option>)}</SelectField>
    <p className="text-sm text-ink-dim">Implemented and Confirmed require a published release. Reopen a problem by moving it back to Reviewed.</p>
    <Button pending={pending} onClick={() => void save()}>Save review</Button>
    <div className="border-t border-border pt-4"><TextField label="Merge duplicate into report number" inputMode="numeric" value={target} onChange={e => { setTarget(e.target.value); setMergeConfirm(false) }} />
      {mergeConfirm ? <div className="mt-3 flex flex-col gap-3"><p className="text-sm">Keep #{target} as the main report and move this report’s followers there? This report will remain available as a duplicate.</p><Button variant="secondary" pending={pending} onClick={() => void save(true)}>Confirm merge into #{target}</Button></div> : <Button className="mt-3" variant="secondary" disabled={!target || pending} onClick={() => setMergeConfirm(true)}>Review merge</Button>}
    </div>
    {error && <Notice tone="error">{error}</Notice>}
  </div></details>
}
