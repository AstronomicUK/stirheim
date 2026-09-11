import { useState } from 'react'
import type { RosterHero } from '../../../rules/types/roster'
import { Button } from '../../../ui'
import type { ReportDraft } from '../model/state'
import { canUseExtraTough, hasExtraTough, applyExtraToughReroll } from '../model/extraTough'
import { D66Entry } from './bits'

export function ExtraTough({ hero, draft, update }: { hero: Pick<RosterHero, 'id' | 'skillIds'>; draft: ReportDraft; update: (fn: (draft: ReportDraft) => ReportDraft) => void }) {
  const [rolling, setRolling] = useState(false)
  const flow = draft.heroInjuries[hero.id]
  if (!hasExtraTough(hero)) return null
  if (flow?.extraToughUsed) return <p className="text-xs text-ink-dim">Extra Tough reroll used. The replacement result stands; the original is retained in the report’s dice history.</p>
  if (!canUseExtraTough(hero, flow)) return null
  return <div className="flex flex-col gap-2 rounded border border-brass p-3">
    <p className="text-sm">Extra Tough: you may reroll D66 {flow.rolls[0].d66} once. Decide before rolling any follow-up dice. The second result stands, even if worse.</p>
    {rolling ? <D66Entry confirmLabel="Use Extra Tough result" onCommit={(die, source) => update(draft => applyExtraToughReroll(draft, hero, die, source))} /> : <Button variant="secondary" onClick={() => setRolling(true)}>Use Extra Tough reroll</Button>}
  </div>
}
