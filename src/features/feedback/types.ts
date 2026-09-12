export const stages = ['reported', 'reviewed', 'working_on', 'implemented', 'confirmed'] as const
export type FeedbackStage = typeof stages[number]
export type FeedbackKind = 'bug' | 'improvement'
export type FeedbackPriority = 'high' | 'medium' | 'low'
export const stageLabels: Record<FeedbackStage, string> = { reported: 'Reported', reviewed: 'Reviewed', working_on: 'Working on', implemented: 'Implemented', confirmed: 'Confirmed' }
export interface FeedbackIssue {
  id: number
  kind: FeedbackKind
  title: string
  notes: string
  priority: FeedbackPriority
  status: FeedbackStage
  reported_by: string
  created_at: string
  updated_at: string
  release_id: string | null
  duplicate_of: number | null
}
export interface FeedbackRelease {
  id: string
  version: string
  title: string
  notes: string
  published_at: string | null
}
export interface FeedbackNotification {
  id: string
  title: string
  body: string
  href: string
  created_at: string
  read_at: string | null
}
