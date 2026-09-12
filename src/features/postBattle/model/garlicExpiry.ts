import type { ReportContext } from './derive'
import type { ReportDraft } from './state'
import { participantsOf } from './participants'

/** Core equipment: garlic carried into a battle expires even if no Vampire charges. */
export function garlicExpiry(ctx: ReportContext, draft: ReportDraft) {
  if (!ctx.roster || (ctx.scenarioId === 'the_sword_of_the_herald' && draft.scenarioNonCampaign)) return []
  const participating = participantsOf(ctx.roster, ctx.template)
  const heroes = [...participating.heroes, ...participating.hiredSwords]
  return ctx.items.filter(item => item.item_rules_id === 'garlic' && item.holder_type !== 'stash').flatMap(item => {
    const hero = heroes.find(h => h.id === item.holder_id)
    if (hero && ctx.preBattle?.[`oldWound:${hero.id}`]?.startsWith('flares up')) return []
    const group = participating.groups.find(g => g.id === item.holder_id)
    if (!hero && !group) return []
    const originalSize = group ? ctx.roster.henchmenGroups.find(g => g.id === group.id)!.size : 1
    const partial = Boolean(group && group.size < originalSize)
    const uncertain = partial && item.quantity % originalSize !== 0
    const key = `${item.id}:${item.quantity}:${group?.size ?? 1}:${originalSize}`
    const count = uncertain ? draft.garlicCarried?.[key] ?? null : partial ? item.quantity / originalSize * group!.size : item.quantity
    const valid = count !== null && Number.isInteger(count) && count >= 0 && count <= item.quantity
    return [{ id: item.id, key, name: hero?.name ?? group!.name, quantity: item.quantity, count, valid, uncertain }]
  })
}
