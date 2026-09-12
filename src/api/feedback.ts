import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { FeedbackIssue, FeedbackKind, FeedbackNotification, FeedbackRelease } from '../features/feedback/types'

export const feedbackKeys = { all: ['feedback'] as const }
// Explicit pagination avoids silently hiding reports at the server's default row limit.
export async function fetchFeedback(): Promise<FeedbackIssue[]> {
  const issues: FeedbackIssue[] = []
  for (let offset = 0; ; offset += 200) {
    const { data, error } = await supabase.from('feedback_issues').select('*').order('id').range(offset, offset + 199)
    if (error) throw new Error(error.message)
    issues.push(...data as FeedbackIssue[])
    if (data.length < 200) return issues
  }
}
export function useFeedback() { return useQuery({ queryKey: [...feedbackKeys.all, 'issues'], queryFn: fetchFeedback }) }
export function useFeedbackReleases(userId?: string, includeDrafts = false) {
  return useQuery({ queryKey: [...feedbackKeys.all, 'releases', includeDrafts ? userId : 'public'], queryFn: async () => {
    const releases:FeedbackRelease[]=[]
    for(let offset=0;;offset+=200){
      let query=supabase.from('feedback_releases').select('*').order('created_at',{ascending:false}).order('id').range(offset,offset+199)
      if(!includeDrafts)query=query.not('published_at','is',null)
      const {data,error}=await query
      if(error)throw new Error(error.message)
      releases.push(...data as FeedbackRelease[])
      if(data.length<200)return [...new Map(releases.map(row=>[row.id,row])).values()]
    }
  } })
}
export function useFeedbackMaintainer(userId?: string) {
  return useQuery({ queryKey: [...feedbackKeys.all, 'maintainer', userId], enabled: !!userId, queryFn: async () => {
    const { data, error } = await supabase.rpc('is_feedback_maintainer')
    if (error) throw new Error(error.message)
    return data === true
  } })
}
export function useFeedbackSubscriptions(userId?: string) {
  return useQuery({ queryKey: [...feedbackKeys.all, 'subscriptions', userId], enabled: !!userId, queryFn: async () => {
    const ids:number[]=[]
    for(let offset=0;;offset+=200){
      const {data,error}=await supabase.from('feedback_subscriptions').select('issue_id').eq('user_id',userId!).order('issue_id').range(offset,offset+199)
      if(error)throw new Error(error.message)
      ids.push(...data.map(row=>row.issue_id))
      if(data.length<200)return [...new Set(ids)]
    }
  } })
}
export function useFeedbackNotifications(userId?: string) {
  return useQuery({ queryKey: [...feedbackKeys.all, 'notifications', userId], enabled: !!userId, refetchInterval: 60_000, queryFn: async () => {
    const notifications:FeedbackNotification[]=[]
    const snapshotTime=new Date().toISOString()
    for(let offset=0;;offset+=200){
      const {data,error}=await supabase.from('app_notifications').select('id,title,body,href,created_at,read_at').eq('user_id',userId!).lte('created_at',snapshotTime).order('created_at',{ascending:false}).order('id').range(offset,offset+199)
      if(error)throw new Error(error.message)
      notifications.push(...data as FeedbackNotification[])
      if(data.length<200)return [...new Map(notifications.map(row=>[row.id,row])).values()]
    }
  } })
}
export async function submitFeedback(kind: FeedbackKind, title: string, notes: string): Promise<number> {
  const { data, error } = await supabase.rpc('submit_feedback', { p_kind: kind, p_title: title.trim(), p_notes: notes.trim() })
  if (error) throw new Error(error.message)
  return data as number
}
export async function followFeedback(id: number, follow: boolean) {
  const { error } = await supabase.rpc('follow_feedback', { p_issue_id: id, p_follow: follow })
  if (error) throw new Error(error.message)
}
export async function reviewFeedback(issue: FeedbackIssue, expectedUpdatedAt: string) {
  const { error } = await supabase.rpc('review_feedback', { p_issue_id: issue.id, p_title: issue.title, p_notes: issue.notes, p_kind: issue.kind, p_priority: issue.priority, p_status: issue.status, p_release_id: issue.release_id ?? undefined, p_expected_updated_at: expectedUpdatedAt })
  if (error) throw new Error(error.message)
}
export async function mergeFeedback(id: number, target: number) {
  const { error } = await supabase.rpc('merge_feedback', { p_issue_id: id, p_target_id: target })
  if (error) throw new Error(error.message)
}
export async function readNotification(id: string) {
  const { error } = await supabase.rpc('mark_notification_read', { p_id: id })
  if (error) throw new Error(error.message)
}

export async function saveReleaseDraft(version: string, title: string, notes: string) {
  const { error } = await supabase.from('feedback_releases').insert({ version: version.trim(), title: title.trim(), notes: notes.trim() })
  if (error) throw new Error(error.message)
}
export async function publishRelease(id: string) {
  const { error } = await supabase.rpc('publish_feedback_release', { p_release_id: id })
  if (error) throw new Error(error.message)
}
