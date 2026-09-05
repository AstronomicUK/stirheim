import type { DraftCosts } from '../../../rules/resolve/builder'

export interface SummaryBarProps {
  costs: DraftCosts
  startingGold: number
  models: number
  maxModels: number | null
  heroes: number
  heroCapacity: number | null
  rating: number
}

/** The four numbers a player keeps glancing at while shopping. Sticks to the top of the builder. */
export function SummaryBar({ costs, startingGold, models, maxModels, heroes, heroCapacity, rating }: SummaryBarProps) {
  const overspent = costs.remaining < 0
  const overModels = maxModels !== null && models > maxModels
  const overHeroes = heroCapacity !== null && heroes > heroCapacity
  return (
    <div className="sticky top-0 z-10 -mx-5 border-b border-border bg-surface/95 px-5 py-2 backdrop-blur lg:-mx-10 lg:-mt-8 lg:px-10 lg:pt-6">
      <dl className="grid grid-cols-4 gap-2 text-sm tabular-nums">
        <Cell label="Gold left" warn={overspent} value={`${costs.remaining}`} suffix={`/ ${startingGold}`} />
        <Cell label="Models" warn={overModels} value={`${models}`} suffix={maxModels !== null ? `/ ${maxModels}` : undefined} />
        <Cell label="Heroes" warn={overHeroes} value={`${heroes}`} suffix={heroCapacity !== null ? `/ ${heroCapacity}` : undefined} />
        <Cell label="Rating" value={`${rating}`} />
      </dl>
      {costs.unknownLines > 0 ? (
        <p className="mt-1 text-xs text-warn">
          {costs.unknownLines} equipment {costs.unknownLines === 1 ? 'line has' : 'lines have'} no price yet; the total is incomplete.
        </p>
      ) : null}
    </div>
  )
}

function Cell({ label, value, suffix, warn = false }: { label: string; value: string; suffix?: string; warn?: boolean }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[10px] uppercase tracking-wider text-ink-dim">{label}</dt>
      <dd className={`leading-tight ${warn ? 'text-accent-strong' : 'text-ink'}`}>
        {value}
        {suffix ? <span className="ml-1 text-xs text-ink-dim">{suffix}</span> : null}
      </dd>
    </div>
  )
}
