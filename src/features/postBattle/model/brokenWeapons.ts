import type { ReportApplied } from '../../../domain'
import type { ReportContext } from './derive'
import type { ReportDraft } from './state'

/** Reconcile battle breaks with casualty losses, asking only where their overlap is unknown. */
export function brokenWeaponSettlement(ctx: ReportContext, draft: ReportDraft, applied: ReportApplied, enabled = true) {
  const out = { patches: [] as ReportApplied['item_patches'], entries: [] as NonNullable<ReportApplied['broken_weapons']>, problems: [] as string[], notes: [] as string[], rows: [] as { key: string; name: string; broken: number; otherLost: number; min: number; max: number; total: number | null }[] }
  if (!enabled) return out
  const recorded = (ctx.battleEvents ?? []).filter(e => !e.reverted_at).flatMap(e => (e.payload.brokenWeapons ?? []).filter(loss => loss.warbandId === ctx.roster.id).map(loss => ({ event_id: e.id, ...loss })))
  for (const id of new Set(recorded.map(loss => loss.itemId))) {
    const losses = recorded.filter(loss => loss.itemId === id)
    const item = ctx.items.find(row => row.id === id)
    const name = losses[0].name
    if (!item || losses.some(loss => item.holder_id !== loss.holderId || item.holder_type !== loss.holderType || item.item_rules_id !== loss.expected.item_rules_id || item.custom_name !== loss.expected.custom_name || item.quantity !== loss.expected.quantity || (item.notes ?? '') !== (loss.expected.notes ?? ''))) {
      out.problems.push(`${name}: the carried equipment changed after the break was recorded. Review the original battle entry and equipment before filing.`)
      continue
    }
    const copies = losses.flatMap(loss => Array.from({ length: loss.quantity }, (_, n) => loss.copyIndex + n))
    if (new Set(copies).size !== copies.length || copies.some(copy => copy < 0 || copy >= item.quantity)) {
      out.problems.push(`${name}: the battle log breaks the same copy more than once or exceeds the carried quantity. Correct the duplicate entry.`)
      continue
    }
    const broken = copies.length
    const otherRemaining = applied.remove_item_ids.includes(id) ? 0 : applied.item_patches.find(p => p.id === id)?.quantity ?? item.quantity
    const otherLost = item.quantity - otherRemaining
    const min = Math.max(broken, otherLost)
    const max = Math.min(item.quantity, broken + otherLost)
    const key = `${id}:${broken}:${otherLost}:${item.quantity}:${losses.map(loss => `${loss.event_id}:${loss.copyIndex}:${loss.quantity}`).sort().join('|')}`
    const total = min === max ? min : draft.brokenWeaponTotals?.[key] ?? null
    out.rows.push({ key, name, broken, otherLost, min, max, total })
    if (total === null || !Number.isInteger(total) || total < min || total > max) {
      out.problems.push(`${name}: record the total copies lost or broken (${min}–${max}), counting each copy only once.`)
      continue
    }
    out.entries.push(...losses)
    if (!applied.remove_item_ids.includes(id)) out.patches.push({ id, quantity: item.quantity - total })
    out.notes.push(`${name}: ${broken} broken in battle; ${total} copies lost or broken in total, ${item.quantity - total} retained${min !== max ? ' (player confirmed overlap with other equipment losses)' : ''}.`)
  }
  return out
}
