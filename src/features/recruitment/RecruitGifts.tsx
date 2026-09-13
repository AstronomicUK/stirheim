import { recruitGiftItems, recruitGiftLimit, recruitGiftProblem, recruitPurchaseOptions, recruitPurchasesTotal } from '../../rules/resolve/recruitPurchases'
import type { CampaignBans } from '../../rules/types/roster'
import { isBanned } from '../../rules/resolve/houseRules'
import { Stepper } from '../../ui'

/** Shared purchase controls for creation and later recruitment; quantities preserve repeated mutations. */
export function RecruitGifts({ warbandId, unitId, ids, onChange, bans }: { warbandId: string; unitId: string; ids: string[]; onChange: (ids: string[]) => void; bans?: CampaignBans }) {
  const options = recruitPurchaseOptions(warbandId, unitId)
  if (!options.length) return null
  const { min, max } = recruitGiftLimit(unitId)
  const quote = recruitPurchasesTotal(recruitGiftItems(ids))
  const problem = recruitGiftProblem(warbandId, unitId, ids)
  return <fieldset className="flex flex-col gap-3 rounded-md border border-border p-3">
    <legend className="px-1 text-xs uppercase tracking-wider text-ink-dim">Mutations and Blessings</legend>
    <p className="text-xs text-ink-dim">Bought with this recruit, per model. {max === 1 ? 'Choose one at its listed price.' : 'The first costs its listed price; additional purchases cost double.'}{min ? ' A choice is required.' : ''} Profile changes are applied automatically.</p>
    {options.map(item => {
      const count = ids.filter(id => id === item.id).length
      const label = item.name.replace(/^(Mutation|Blessing of Nurgle): /, '')
      return <div key={item.id} className="flex flex-col gap-1 border-t border-border pt-2">
        <div className="flex items-center justify-between gap-2"><span className="text-sm">{label}<span className="block text-xs text-ink-dim">Listed: {item.price.base} gc{isBanned(bans, 'items', item.id) ? ' · Banned in this campaign' : ''}</span></span>
          <Stepper label={label} value={count} max={max === null ? null : count + Math.max(0, max - ids.length)} disabled={isBanned(bans, 'items', item.id) && count === 0} onChange={n => onChange(n > count ? [...ids, item.id] : ids.filter((id, i) => id !== item.id || i !== ids.lastIndexOf(item.id)))} />
        </div>
        <p className="text-xs text-ink-dim">{item.specialRules[0]?.text ?? item.description}</p>
      </div>
    })}
    <p className="text-sm">Gifts: {quote.total} gc per model</p>
    {problem ? <p className="text-xs text-accent-strong">{problem}</p> : null}
  </fieldset>
}
