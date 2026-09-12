import { describe, expect, it } from 'vitest'
import { feedbackBoard, reportProblem } from './board'
import type { FeedbackIssue } from './types'
const issue = (id: number, patch: Partial<FeedbackIssue> = {}): FeedbackIssue => ({ id, kind: 'bug', title: 'A report', notes: 'Some details', priority: 'medium', status: 'reported', reported_by: 'Tom', created_at: '', updated_at: '', release_id: null, duplicate_of: null, ...patch })
describe('feedback board', () => {
  it('keeps every stage, orders priority first and excludes merged duplicates', () => {
    const board = feedbackBoard([issue(1, { priority: 'high' }), issue(2), issue(3, { duplicate_of: 1 }), issue(4, { kind: 'improvement' })], 'bug', '')
    expect(board).toHaveLength(5)
    expect(board[0].issues.map(x => x.id)).toEqual([1, 2])
    expect(feedbackBoard([issue(3, { duplicate_of: 1 })], 'bug', '3')[0].issues.map(x => x.id)).toEqual([3])
  })
  it('searches notes, reporter and preserved tracker numbers', () => {
    const issues = [issue(229, { notes: 'Awakening after death', reported_by: 'Astra' })]
    for (const term of ['awakening', 'ASTRA', '229']) expect(feedbackBoard(issues, 'bug', term)[0].issues).toHaveLength(1)
    expect(feedbackBoard(issues, 'bug', 'nothing')[0].issues).toHaveLength(0)
  })
  it('validates trimmed input before publication', () => {
    expect(reportProblem('    ', 'Enough detail here')).not.toBeNull()
    expect(reportProblem('Useful title', 'short')).not.toBeNull()
    expect(reportProblem(' Useful title ', ' A useful explanation ')).toBeNull()
  })
})
