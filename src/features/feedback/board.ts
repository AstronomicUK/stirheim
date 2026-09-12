import { stages, type FeedbackIssue, type FeedbackKind } from './types'
const priorityOrder = { high: 0, medium: 1, low: 2 }
export function feedbackBoard(issues: FeedbackIssue[], kind: FeedbackKind, search: string) {
  const term = search.trim().toLocaleLowerCase()
  const visible = issues.filter(issue => issue.kind === kind && issue.duplicate_of === null && (!term || `${issue.id} ${issue.title} ${issue.notes} ${issue.reported_by}`.toLocaleLowerCase().includes(term)))
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || b.id - a.id)
  return stages.map(stage => ({ stage, issues: visible.filter(issue => issue.status === stage) }))
}
export function reportProblem(title: string, notes: string): string | null {
  if (title.trim().length < 5 || title.trim().length > 140) return 'Use a title between 5 and 140 characters.'
  if (notes.trim().length < 10 || notes.trim().length > 12000) return 'Add between 10 and 12,000 characters of detail.'
  return null
}
