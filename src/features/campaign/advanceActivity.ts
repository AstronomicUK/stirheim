import type { CampaignActivity } from '../../api/campaigns'
import type { Json } from '../../api/database.types'
import type { FieldChange } from './activity'

type Row = Record<string, Json | undefined>
const row = (v: Json | undefined | null): Row => v && typeof v === 'object' && !Array.isArray(v) ? v : {}
const history = (r: Row): string[] => Array.isArray(r.rollHistory) ? r.rollHistory.filter((v): v is string => typeof v === 'string') : []

/** Advancement events have a sequence, not a collection of database fields. */
export function advanceActivityChanges(entry: CampaignActivity): FieldChange[] {
  const before = row(entry.before), after = entry.action === 'delete' ? {} : row(entry.after)
  const out: FieldChange[] = []
  const add = (sentence: string) => out.push({ label: 'Advancement', before: '', after: '', sentence })
  if (entry.action === 'delete') {
    add('Removed the pending advancement.')
    return out
  }
  const resolved = row(after.resolution), rolled = row(after.rolled)
  const old = row(before.resolution ?? before.rolled)
  const current = after.resolution ? resolved : rolled
  const name = typeof current.subjectName === 'string' ? `${current.subjectName}: ` : ''
  const events = history(current), previous = history(old)
  // Only omit an established common prefix: repeated dice results can be separate rolls.
  let shared = 0
  while (shared < previous.length && shared < events.length && previous[shared] === events[shared]) shared++
  events.slice(shared).forEach(event => add(`${name}${event}`))
  if (current.rollChangeReason && current.rollChangeReason !== old.rollChangeReason) add(`${name}Reason for changing the dice: ${current.rollChangeReason}`)
  if (after.resolution && JSON.stringify(before.resolution) !== JSON.stringify(after.resolution)) {
    // Stored summaries include the outcome; history above already explains how it was rolled.
    const summary = typeof resolved.text === 'string' ? resolved.text.split(' Dice history:')[0].replace(/^Rolled \d+(?: \(then \d+\))?:\s*/, '') : 'Advancement completed.'
    add(`${name}${summary}`)
  } else if (after.rolled && JSON.stringify(before.rolled) !== JSON.stringify(after.rolled) && !events.length) {
    // Legacy records retain a final result, not evidence of who rolled or changed it.
    const total = Array.isArray(rolled.dice) && rolled.dice.every(v => typeof v === 'number') ? rolled.dice.reduce<number>((sum, v) => sum + Number(v), 0) : null
    add(`${name}Recorded advancement${total !== null ? ` total: ${total}` : ' result'}. The original dice history was not recorded.`)
  } else if (entry.action === 'insert' && !after.rolled && !after.resolution) {
    add(`An advancement is ready${typeof after.threshold_xp === 'number' ? ` at ${after.threshold_xp} XP` : ''}.`)
  }
  return out
}
