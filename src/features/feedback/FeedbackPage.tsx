import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { feedbackKeys, followFeedback, readNotification, submitFeedback, useFeedback, useFeedbackMaintainer, useFeedbackNotifications, useFeedbackReleases, useFeedbackSubscriptions } from '../../api/feedback'
import { useSession } from '../../app/session'
import { Button, Notice, PageHeader, SegmentedControl, SelectField, Sheet, TextArea, TextField } from '../../ui'
import { usePageTitle } from '../onboarding/usePageTitle'
import { FeedbackBoard, Priority } from './FeedbackBoard'
import { ReleaseManager } from './ReleaseManager'
import { FeedbackEditor } from './FeedbackEditor'
import { reportProblem } from './board'
import { stageLabels, type FeedbackKind, type FeedbackStage } from './types'

type View = 'board' | 'releases' | 'notifications'
const date = (value: string) => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
export function FeedbackPage() {
  usePageTitle('Feedback & updates')
  const user = useSession(s => s.user)
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const view: View = params.get('view') === 'releases' ? 'releases' : params.get('view') === 'notifications' ? 'notifications' : 'board'
  const kind: FeedbackKind = params.get('type') === 'improvement' ? 'improvement' : 'bug'
  const [stage, setStage] = useState<FeedbackStage>('reported')
  const [search, setSearch] = useState('')
  const [reporting, setReporting] = useState(false)
  const [reportKind, setReportKind] = useState<FeedbackKind>('bug')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const issues = useFeedback()
  const releases = useFeedbackReleases()
  const maintainer = useFeedbackMaintainer(user?.id)
  const editableReleases = useFeedbackReleases(user?.id, !!maintainer.data)
  const subscriptions = useFeedbackSubscriptions(user?.id)
  const notifications = useFeedbackNotifications(user?.id)
  const selected = issues.data?.find(issue => String(issue.id) === params.get('issue'))
  const unread = notifications.data?.filter(n => !n.read_at).length ?? 0
  function updateParams(patch: Record<string, string | null>) {
    setParams(current => { const next = new URLSearchParams(current); for (const [key, value] of Object.entries(patch)) if (value === null) next.delete(key); else next.set(key, value); return next })
    setError('')
  }
  async function refresh() { await queryClient.invalidateQueries({ queryKey: feedbackKeys.all }) }
  async function action(work: () => Promise<unknown>) {
    setPending(true); setError('')
    try { await work(); await refresh() }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not save. Please try again.') }
    finally { setPending(false) }
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    const problem = reportProblem(title, notes)
    if (problem) return setError(problem)
    await action(async () => {
      const id = await submitFeedback(reportKind, title, notes)
      setReporting(false); setTitle(''); setNotes(''); updateParams({ issue: String(id), type: reportKind, view: 'board' }); setStage('reported')
    })
  }
  return <>
    <PageHeader eyebrow="The workshop" title="Feedback & updates" description="See what’s being improved, share an idea, or tell us what isn’t working." />
    <nav className="flex flex-wrap gap-5 border-b border-border pb-3 text-sm" aria-label="Feedback sections">
      {([['board', 'Tracker'], ['releases', 'What’s new'], ...(user ? [['notifications', `Your updates${unread ? ` (${unread})` : ''}`]] : [])] as [View, string][]).map(([value, label]) => <button key={value} type="button" aria-current={view === value ? 'page' : undefined} className={`min-h-11 border-b-2 px-1 ${view === value ? 'border-brass font-semibold text-ink' : 'border-transparent text-ink-dim'}`} onClick={() => updateParams({ view: value, issue: null })}>{label}</button>)}
    </nav>
    {view === 'board' && <>
      <div className="feedback-toolbar"><SegmentedControl label="Report type" value={kind} options={[{ value: 'bug', label: 'Bugs' }, { value: 'improvement', label: 'Improvements' }]} onChange={value => updateParams({ type: value })} />
        {user ? <Button variant="secondary" onClick={() => { setReporting(true); setReportKind(kind); setError('') }}>+ {kind === 'bug' ? 'Report a bug' : 'Suggest an improvement'}</Button> : <Link to="/sign-in">Sign in to report</Link>}
      </div>
      <label><span className="sr-only">Search reports</span><input type="search" className="feedback-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search titles, details or report numbers…" /></label>
      {issues.isPending ? <p role="status">Loading reports…</p> : issues.isError ? <Notice tone="error">The tracker couldn’t load. <button type="button" onClick={() => void issues.refetch()}>Try again</button></Notice> : <FeedbackBoard issues={issues.data ?? []} kind={kind} search={search} stage={stage} onStage={setStage} onOpen={issue => updateParams({ issue: String(issue.id) })} />}
      <p className="text-xs leading-relaxed text-ink-dim">Reported → Reviewed → Working on → Implemented → Confirmed. Implemented means available in the app; Confirmed means verified in the live version.</p>
    </>}
    {view === 'releases' && <div className="flex flex-col gap-4">
      {maintainer.data && <ReleaseManager releases={editableReleases.data ?? []} onSaved={refresh} />}
      {releases.isPending ? <p role="status">Loading releases…</p> : releases.isError ? <Notice tone="error">Release notes couldn’t load. <button onClick={() => void releases.refetch()}>Try again</button></Notice> : !releases.data?.length ? <p className="text-ink-dim">Release notes will appear here when the next update is published.</p> : releases.data.map(release => <article key={release.id} className="feedback-release"><p className="text-xs uppercase tracking-wider text-ink-dim">Version {release.version} · {date(release.published_at!)}</p><h2>{release.title}</h2><p className="whitespace-pre-wrap break-words leading-relaxed">{release.notes}</p><ul className="mt-4 flex flex-col gap-2">{issues.data?.filter(issue => issue.release_id === release.id && !issue.duplicate_of).map(issue => <li key={issue.id}><button className="text-left text-sm underline decoration-brass underline-offset-4" onClick={() => updateParams({ issue: String(issue.id) })}>#{issue.id} · {issue.title}</button></li>)}</ul></article>)}
    </div>}
    {view === 'notifications' && (user ? <div className="flex flex-col gap-3">{notifications.isPending ? <p role="status">Loading your updates…</p> : notifications.isError ? <Notice tone="error">Your updates couldn’t load. <button onClick={() => void notifications.refetch()}>Try again</button></Notice> : !notifications.data?.length ? <p className="text-ink-dim">Follow a report to hear when its fix is released. Reports you submit are followed automatically.</p> : notifications.data.map(notification => <article key={notification.id} className={`rounded-md border p-4 ${notification.read_at ? 'border-border' : 'border-brass bg-surface-low'}`}><p className="text-xs text-ink-dim">{date(notification.created_at)}{!notification.read_at && ' · New'}</p><h2 className="mt-1 font-semibold">{notification.title}</h2><p className="mt-2 text-sm">{notification.body}</p><div className="mt-3 flex flex-wrap gap-4"><Link to={notification.href.startsWith('/') && !notification.href.startsWith('//') ? notification.href : '/feedback'} onClick={() => { if (!notification.read_at) void action(() => readNotification(notification.id)) }}>View details</Link>{!notification.read_at && <button disabled={pending} className="text-sm text-ink-dim" onClick={() => void action(() => readNotification(notification.id))}>Mark as read</button>}</div></article>)}</div> : <Link to="/sign-in">Sign in to see your updates</Link>)}
    {error && !reporting && <Notice tone="error">{error}</Notice>}
    {params.has('issue') && !selected && issues.isSuccess && <Notice tone="error">This report could not be found. <button onClick={() => updateParams({ issue: null })}>Return to the tracker</button></Notice>}
    <Sheet open={!!selected} onClose={() => updateParams({ issue: null })} title={selected?.title ?? 'Report'} description={selected ? `#${selected.id} · ${stageLabels[selected.status]}` : undefined} size="full">
      {selected && <div className="flex flex-col gap-5"><div className="flex flex-wrap items-center justify-between gap-3"><Priority value={selected.priority} /><span className="text-sm text-ink-dim">Reported by {selected.reported_by}</span></div>
        <p className="whitespace-pre-wrap break-words leading-relaxed">{selected.notes}</p>
        {selected.duplicate_of && <Notice>This report has been merged into <button className="underline" onClick={() => updateParams({ issue: String(selected.duplicate_of) })}>#{selected.duplicate_of}</button>. Follow the main report for updates.</Notice>}
        {selected.release_id && <button className="text-left text-sm underline" onClick={() => updateParams({ view: 'releases', issue: null })}>View release notes</button>}
        <p className="text-xs text-ink-dim">Reported {date(selected.created_at)} · Updated {date(selected.updated_at)}</p>
        {user && !selected.duplicate_of && <Button variant="secondary" pending={pending} disabled={subscriptions.isPending || subscriptions.isError} onClick={() => void action(() => followFeedback(selected.id, !subscriptions.data?.includes(selected.id)))}>{subscriptions.data?.includes(selected.id) ? 'Following · stop updates' : 'Notify me when this is released'}</Button>}
        {error && <Notice tone="error">{error}</Notice>}
        {maintainer.data && !selected.duplicate_of && <FeedbackEditor key={`${selected.id}-${selected.updated_at}`} issue={selected} releases={editableReleases.data ?? []} onSaved={refresh} />}
      </div>}
    </Sheet>
    <Sheet open={reporting} onClose={() => { if (!pending) setReporting(false) }} title={reportKind === 'bug' ? 'Report a bug' : 'Suggest an improvement'} size="full">
      <form onSubmit={submit} className="flex flex-col gap-4"><p className="text-sm text-ink-dim">Your report and display name will be public. Please leave out passwords and private campaign details.</p>
        <SelectField label="Type" value={reportKind} onChange={e => setReportKind(e.target.value as FeedbackKind)}><option value="bug">Bug</option><option value="improvement">Improvement</option></SelectField>
        <TextField label="A short title" value={title} maxLength={140} required onChange={e => setTitle(e.target.value)} placeholder={reportKind === 'bug' ? 'What isn’t working?' : 'What would you like to improve?'} />
        <TextArea label="Details" value={notes} maxLength={12000} required rows={8} onChange={e => setNotes(e.target.value)} placeholder={reportKind === 'bug' ? 'What were you doing? What happened, and what did you expect? Include your device if relevant.' : 'Describe the idea and how it would help you.'} />
        <p className="text-sm text-ink-dim">We’ll review the priority. You’ll receive an update here when it is released.</p>{error && <Notice tone="error">{error}</Notice>}<Button type="submit" pending={pending}>Submit {reportKind === 'bug' ? 'report' : 'idea'}</Button>
      </form>
    </Sheet>
  </>
}
