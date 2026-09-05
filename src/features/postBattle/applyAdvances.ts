// After the report is filed, the advances the player rolled in the wizard are applied one by one
// through the same functions the Bestow Advancements screen uses: resolve_pending_advance for a
// finished advance, or the roll kept on the row for "pick later". Each is recomputed against the
// freshly loaded roster (the report has just changed it), so the diff is exact. A failure leaves
// that advance pending, where the Bestow Advancements screen picks it up; nothing is lost.

import { fetchPendingAdvances, recordAdvanceRoll, resolvePendingAdvance, type PendingAdvanceRow } from '../../api/advances'
import { fetchWarband } from '../../api/warbands'
import { diffRoster } from '../../domain'
import type { WarbandTemplate } from '../../rules/types'
import { findSubject, planGroup, planHero, rolledFromDraft } from '../advances/model'
import { skillTableName } from '../roster/view/lookups'
import type { WizardAdvance } from './model'

export interface ApplyAdvancesOutcome {
  resolved: number
  deferred: number
  /** Advances left pending because applying them failed, with the reason. */
  failed: { name: string; reason: string }[]
}

export async function applyWizardAdvances(warbandId: string, items: WizardAdvance[], template: WarbandTemplate | undefined): Promise<ApplyAdvancesOutcome> {
  const outcome: ApplyAdvancesOutcome = { resolved: 0, deferred: 0, failed: [] }
  const todo = items.filter((i) => i.subject !== null && i.complete && ((i.mode === 'now' && i.plan?.result) || i.mode === 'pickLater'))
  if (todo.length === 0) return outcome

  const used = new Set<string>()
  let rows: PendingAdvanceRow[] = await fetchPendingAdvances(warbandId)
  const rowFor = (item: WizardAdvance) => rows.find((r) => !used.has(r.id) && r.resolved_at === null && r.rolled === null && r.subject_id === item.request.subject_id && r.threshold_xp === item.request.threshold_xp)

  for (const item of todo) {
    const row = rowFor(item)
    if (!row) {
      outcome.failed.push({ name: item.name, reason: 'the pending advance was not found after filing' })
      continue
    }
    used.add(row.id)
    try {
      const detail = await fetchWarband(warbandId)
      const subject = findSubject(detail.roster, item.request.subject_type, item.request.subject_id)
      if (!subject) throw new Error('warrior not found on the roster')
      const ctx = { roster: detail.roster, template, thresholdXp: item.request.threshold_xp }
      const plan = subject.kind === 'group' ? planGroup(item.draft, subject.group, ctx, skillTableName) : planHero(item.draft, subject, ctx)
      if (item.mode === 'pickLater') {
        if (!plan.roll) throw new Error('the advance was not rolled')
        const rolled = rolledFromDraft(item.draft, plan.roll.text)
        if (!rolled) throw new Error('the advance was not rolled')
        await recordAdvanceRoll(row.id, { ...rolled })
        outcome.deferred += 1
        continue
      }
      if (!plan.result) throw new Error(plan.error ?? 'the advance is not complete')
      const changes = diffRoster({ warband: detail.warband, heroes: detail.heroes, groups: detail.groups, items: detail.items }, plan.result.next)
      await resolvePendingAdvance({ advanceId: row.id, resolution: { ...plan.result.resolution }, changes })
      outcome.resolved += 1
      // A promotion queues follow-up rows; refresh so a later item cannot pick one of those by mistake.
      rows = await fetchPendingAdvances(warbandId)
    } catch (e) {
      outcome.failed.push({ name: item.name, reason: e instanceof Error ? e.message : 'could not be applied' })
    }
  }
  return outcome
}
