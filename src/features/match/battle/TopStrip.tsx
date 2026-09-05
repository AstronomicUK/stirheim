import { Stepper } from '../../../ui'
import type { RoutStatus, SheetTotals } from './sheet'

export interface TopStripProps {
  scenario: string
  opponents: string
  turn: number
  onTurn: (turn: number) => void
  totals: SheetTotals
  rout: RoutStatus
  onRouted: (routed: boolean) => void
  readOnly: boolean
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-md bg-surface-low px-2 py-1.5">
      <span className="text-[10px] uppercase tracking-wider text-ink-dim">{label}</span>
      <span className="text-base tabular-nums text-ink">{value}</span>
    </div>
  )
}

/** Pinned to the top while the game runs: scenario, turn, the three numbers that matter, and the rout state. */
export function TopStrip({ scenario, opponents, turn, onTurn, totals, rout, onRouted, readOnly }: TopStripProps) {
  return (
    <div className="sticky top-0 z-10 -mx-5 -mt-4 flex flex-col gap-2 border-b border-border bg-surface/95 px-5 pb-3 pt-3 backdrop-blur supports-[backdrop-filter]:bg-surface/85 lg:-mx-10 lg:-mt-8 lg:px-10 lg:pt-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-headline text-lg leading-tight text-ink">{scenario}</p>
          <p className="truncate text-sm text-ink-dim">{opponents}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-ink-dim">Turn</span>
          <Stepper value={turn} onChange={onTurn} label="turn" disabled={readOnly} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5 lg:max-w-2xl">
        <Tile label="Enemies out" value={String(totals.enemiesOutOfAction)} />
        <Tile label="Own out" value={`${totals.ownOutOfAction}/${totals.startingModels}`} />
        <Tile label="Wyrdstone" value={String(totals.wyrdstoneFound)} />
        <button
          type="button"
          aria-pressed={rout === 'routed'}
          disabled={readOnly}
          onClick={() => onRouted(rout !== 'routed')}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-md border px-2 py-1.5 text-[10px] uppercase tracking-wider transition-colors disabled:cursor-not-allowed ${
            rout === 'routed' ? 'border-accent-strong bg-accent/20 text-accent-strong' : 'border-border text-ink-dim hover:text-ink'
          }`}
        >
          <span>Routed</span>
          <span className="text-base normal-case tracking-normal">{rout === 'routed' ? 'Yes' : 'No'}</span>
        </button>
      </div>
      {rout === 'routed' ? (
        <p role="status" className="text-sm text-ink-dim">
          Your warband has routed. The battle is over for you; keep the sheet for the report.
        </p>
      ) : null}
    </div>
  )
}
