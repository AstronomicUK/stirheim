// Turns audit_log rows into the one-line entries the campaign dashboard shows: "Ana edited Claws
// of Eshin by hand (gold 25 -> 30)". Pure; the table/action/reason/before/after shape comes from
// the audit_row() trigger in supabase/migrations/20260904000003_audit.sql.

import type { CampaignActivity } from '../../api/campaigns'
import type { Json } from '../../api/database.types'

type Row = Record<string, Json | undefined>

function asRow(json: Json | null | undefined): Row | null {
  return json && typeof json === 'object' && !Array.isArray(json) ? (json as Row) : null
}

function str(row: Row | null, key: string): string | null {
  const v = row?.[key]
  return typeof v === 'string' && v.trim() ? v : null
}

function num(row: Row | null, key: string): number | null {
  const v = row?.[key]
  return typeof v === 'number' ? v : null
}

function actorName(entry: CampaignActivity): string {
  return entry.actor_display_name?.trim() || 'Someone'
}

/** The warband a row concerns, by name: the row itself for warbands, else the looked-up name. */
function warbandName(entry: CampaignActivity, after: Row | null, before: Row | null): string {
  if (entry.table_name === 'warbands') return str(after, 'name') ?? str(before, 'name') ?? entry.warband_name ?? 'a warband'
  return entry.warband_name ?? 'a warband'
}

/** "gold 25 -> 30, wyrdstone 0 -> 2" for the plain columns of a warband row that moved. */
export function describeWarbandChanges(before: Row | null, after: Row | null): string[] {
  if (!before || !after) return []
  const out: string[] = []
  for (const [key, label] of [
    ['gold', 'gold'],
    ['wyrdstone', 'wyrdstone'],
    ['veteran_pool', 'veteran pool'],
  ] as const) {
    const a = num(before, key)
    const b = num(after, key)
    if (a !== b && (a !== null || b !== null)) out.push(`${label} ${a ?? 'none'} -> ${b ?? 'none'}`)
  }
  const nameBefore = str(before, 'name')
  const nameAfter = str(after, 'name')
  if (nameBefore && nameAfter && nameBefore !== nameAfter) out.push(`renamed from ${nameBefore}`)
  if (before.archived !== after.archived && typeof after.archived === 'boolean') out.push(after.archived ? 'archived' : 'unarchived')
  if (before.notes !== after.notes) out.push('notes changed')
  return out
}

function withChanges(text: string, changes: string[]): string {
  return changes.length ? `${text} (${changes.join(', ')})` : text
}

function describeWarband(entry: CampaignActivity, before: Row | null, after: Row | null): string {
  const actor = actorName(entry)
  const name = warbandName(entry, after, before)
  if (entry.action === 'insert') return `${actor} created ${name}`
  if (entry.action === 'delete') return `${actor} deleted ${name}`
  const changes = describeWarbandChanges(before, after)
  switch (entry.reason) {
    case 'manual_edit':
      return withChanges(`${actor} edited ${name} by hand`, changes)
    case 'trading':
      return withChanges(`${actor} visited the trading post with ${name}`, changes)
    case 'recruitment':
      return withChanges(`${actor} recruited for ${name}`, changes)
    case 'post_battle':
      return withChanges(`${actor} recorded a post-battle sequence for ${name}`, changes)
    case 'advancement':
      return withChanges(`${actor} rolled advances for ${name}`, changes)
    case 'archive':
      return after?.archived === true ? `${actor} archived ${name}` : `${actor} unarchived ${name}`
    default:
      return withChanges(`${actor} updated ${name}`, changes)
  }
}

function describeWarrior(entry: CampaignActivity, before: Row | null, after: Row | null, kind: 'hero' | 'group'): string {
  const actor = actorName(entry)
  const warband = warbandName(entry, after, before)
  const who = str(after, 'name') ?? str(before, 'name') ?? (kind === 'hero' ? 'a hero' : 'a henchman group')
  const hired = after?.is_hired_sword === true || before?.is_hired_sword === true
  const byHand = entry.reason === 'manual_edit' ? ' by hand' : ''
  if (entry.action === 'insert') return hired ? `${actor} hired ${who} for ${warband}` : `${actor} added ${who} to ${warband}${byHand}`
  if (entry.action === 'delete') return `${actor} removed ${who} from ${warband}${byHand}`
  const statusBefore = str(before, 'status')
  const statusAfter = str(after, 'status')
  if (statusBefore && statusAfter && statusBefore !== statusAfter) return `${actor} marked ${who} (${warband}) ${statusAfter.replace(/_/g, ' ')}`
  if (kind === 'group') {
    const a = num(before, 'size')
    const b = num(after, 'size')
    if (a !== null && b !== null && a !== b) return `${actor} changed ${who} (${warband}) from ${a} to ${b} models${byHand}`
  }
  return `${actor} edited ${who} (${warband})${byHand}`
}

function describeItem(entry: CampaignActivity, before: Row | null, after: Row | null): string {
  const actor = actorName(entry)
  const warband = warbandName(entry, after, before)
  if (entry.action === 'insert') return `${actor} added equipment to ${warband}`
  if (entry.action === 'delete') return `${actor} removed equipment from ${warband}`
  return `${actor} changed equipment on ${warband}`
}

function describeCampaign(entry: CampaignActivity, before: Row | null, after: Row | null): string {
  const actor = actorName(entry)
  if (entry.action === 'insert') return `${actor} created the campaign`
  if (entry.action === 'delete') return `${actor} deleted the campaign`
  const parts: string[] = []
  const nameAfter = str(after, 'name')
  if (before && after && str(before, 'name') !== nameAfter && nameAfter) parts.push(`renamed the campaign to ${nameAfter}`)
  if (before && after && before.archived !== after.archived) parts.push(after.archived === true ? 'archived the campaign' : 'unarchived the campaign')
  if (before && after && before.invite_code !== after.invite_code) parts.push('issued a new invite code')
  if (before && after && JSON.stringify(before.settings) !== JSON.stringify(after.settings)) parts.push('changed the campaign settings')
  if (before && after && before.rules_markdown !== after.rules_markdown) parts.push('updated the campaign rules')
  if (!parts.length) return `${actor} updated the campaign`
  return `${actor} ${joinNatural(parts)}`
}

function describeMembership(entry: CampaignActivity, before: Row | null, after: Row | null): string {
  const actor = actorName(entry)
  const warband = warbandName(entry, after, before)
  if (entry.action === 'insert') return `${actor} joined with ${warband}`
  if (entry.action === 'delete') return `${warband} was removed from the campaign`
  const leftBefore = str(before, 'left_at')
  const leftAfter = str(after, 'left_at')
  if (!leftBefore && leftAfter) {
    const owner = str(after, 'user_id')
    return owner && entry.actor_id && owner !== entry.actor_id ? `${actor} removed ${warband} from the campaign` : `${actor} left with ${warband}`
  }
  if (leftBefore && !leftAfter) return `${actor} rejoined with ${warband}`
  return `${actor} updated the membership of ${warband}`
}

function joinNatural(parts: string[]): string {
  if (parts.length <= 1) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

/** One plain-English line for an audit entry. Never throws on odd data; falls back to a generic line. */
export function describeActivity(entry: CampaignActivity): string {
  const before = asRow(entry.before)
  const after = asRow(entry.after)
  switch (entry.table_name) {
    case 'warbands':
      return describeWarband(entry, before, after)
    case 'heroes':
      return describeWarrior(entry, before, after, 'hero')
    case 'henchman_groups':
      return describeWarrior(entry, before, after, 'group')
    case 'items':
      return describeItem(entry, before, after)
    case 'campaigns':
      return describeCampaign(entry, before, after)
    case 'campaign_members':
      return describeMembership(entry, before, after)
    default: {
      const what = entry.table_name.replace(/_/g, ' ')
      const verb = entry.action === 'insert' ? 'added' : entry.action === 'delete' ? 'removed' : 'changed'
      const where = entry.warband_name ? ` for ${entry.warband_name}` : ''
      return `${actorName(entry)} ${verb} a ${singular(what)} record${where}`
    }
  }
}

function singular(words: string): string {
  return words.endsWith('es') && !words.endsWith('ses') ? words.slice(0, -2) : words.endsWith('s') ? words.slice(0, -1) : words
}

export interface ActivityLine {
  /** Id of the headline entry. */
  id: number
  at: string
  text: string
  /** How many audit rows this line stands for. */
  count: number
}

/** Rows of the same batch, in the order we prefer to headline them. */
const HEADLINE_ORDER = ['warbands', 'campaign_members', 'campaigns', 'heroes', 'henchman_groups', 'items']

function headlineRank(table: string): number {
  const i = HEADLINE_ORDER.indexOf(table)
  return i === -1 ? HEADLINE_ORDER.length : i
}

/** Rows the trigger writes as a side effect of another row we already describe. */
function isNoise(entry: CampaignActivity): boolean {
  return entry.reason === 'create_warband' && entry.table_name !== 'warbands'
}

/**
 * Collapse one save into one line. A roster edit writes a row per table touched, all with the
 * same actor, warband and reason within the same transaction; we keep the most telling of them.
 * Expects entries newest first, as the API returns them.
 */
export function activityLines(entries: CampaignActivity[], windowMs = 3000): ActivityLine[] {
  const lines: ActivityLine[] = []
  let group: CampaignActivity[] = []

  const flush = () => {
    if (!group.length) return
    const headline = [...group].sort((a, b) => headlineRank(a.table_name) - headlineRank(b.table_name))[0]
    lines.push({ id: headline.id, at: group[0].at, text: describeActivity(headline), count: group.length })
    group = []
  }

  for (const entry of entries) {
    if (isNoise(entry)) continue
    const first = group[0]
    const sameBatch =
      first &&
      first.actor_id === entry.actor_id &&
      first.warband_id === entry.warband_id &&
      first.reason !== null &&
      first.reason === entry.reason &&
      first.table_name !== 'campaign_members' &&
      Math.abs(Date.parse(first.at) - Date.parse(entry.at)) <= windowMs
    if (!sameBatch) flush()
    group.push(entry)
  }
  flush()
  return lines
}

/** "just now", "5 min ago", "3 h ago", "yesterday", "4 days ago", then a short date. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return ''
  const seconds = Math.max(0, Math.round((now - then) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 14) return `${days} days ago`
  return new Date(then).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
