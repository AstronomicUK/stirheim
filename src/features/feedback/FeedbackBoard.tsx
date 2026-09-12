import { feedbackBoard } from './board'
import { stageLabels, type FeedbackIssue, type FeedbackKind, type FeedbackPriority, type FeedbackStage } from './types'
import './feedback.css'

export function Priority({ value }: { value: FeedbackPriority }) {
  return <span className={`feedback-priority feedback-priority--${value}`}><span aria-hidden="true" />{value === 'high' ? 'High' : value === 'medium' ? 'Medium' : 'Low'} priority</span>
}
export function FeedbackBoard({ issues, kind, search, stage, onStage, onOpen }: {
  issues: FeedbackIssue[]; kind: FeedbackKind; search: string; stage: FeedbackStage
  onStage: (stage: FeedbackStage) => void; onOpen: (issue: FeedbackIssue) => void
}) {
  const columns = feedbackBoard(issues, kind, search)
  const total = columns.reduce((sum, column) => sum + column.issues.length, 0)
  return <>
    {search.trim() && <p className="text-sm text-ink-dim" role="status">{total} matching {total === 1 ? 'report' : 'reports'} across all stages.</p>}
    <div className="feedback-mobile-stage"><label htmlFor="feedback-stage">Stage</label><select id="feedback-stage" value={stage} onChange={e => onStage(e.target.value as FeedbackStage)}>{columns.map(column => <option key={column.stage} value={column.stage}>{stageLabels[column.stage]} · {column.issues.length}</option>)}</select></div>
    <div className="feedback-board">
      {columns.map(column => <section key={column.stage} className={`feedback-column ${stage === column.stage ? 'feedback-column--selected' : ''}`} aria-label={stageLabels[column.stage]}>
        <div className="feedback-column-heading"><h2>{stageLabels[column.stage]}</h2><span>{column.issues.length}</span></div>
        <div className="feedback-column-cards">{column.issues.length ? column.issues.map(issue => <button type="button" key={issue.id} className="feedback-card" onClick={() => onOpen(issue)}><Priority value={issue.priority} /><span className="feedback-card-title">{issue.title}</span><span className="sr-only">Open report {issue.id}</span></button>) : <p className="feedback-empty">{search ? 'No matching reports' : 'Nothing here yet'}</p>}</div>
      </section>)}
    </div>
  </>
}
