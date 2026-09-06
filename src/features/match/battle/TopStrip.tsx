import { Icon, Stepper, type IconName } from '../../../ui'
import type { RoutStatus, SheetTotals } from './sheet'

export interface TopStripProps {
  scenario: string
  opponents: string
  turn: number
  onTurn: (turn: number) => void
  totals: SheetTotals
  /** Models the other warbands put on the table, when their rosters have loaded. */
  enemyModels: number | null
  rout: RoutStatus
  onRouted: (routed: boolean) => void
  readOnly: boolean
}

function Tile({ icon, label, value, sub, tone = 'plain' }: { icon: IconName; label: string; value: string; sub?: string; tone?: 'plain' | 'warn' }) {
  return (
    <div className={`flex flex-col items-center gap-0.5 rounded-md px-2 py-1.5 ${tone === 'warn' ? 'bg-brass/15' : 'bg-surface-low'}`}>
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-dim">
        <Icon name={icon} size={12} className={tone === 'warn' ? 'text-brass' : 'text-ink-dim'} />
        {label}
      </span>
      <span className="text-base tabular-nums text-ink">{value}</span>
      {sub ? <span className={`text-[10px] leading-tight ${tone === 'warn' ? 'text-brass' : 'text-ink-dim'}`}>{sub}</span> : null}
    </div>
  )
}

/** Pinned to the top while the game runs: scenario, turn, the three numbers that matter, and the rout state. */
export function TopStrip({ scenario, opponents, turn, onTurn, totals, enemyModels, rout, onRouted, readOnly }: TopStripProps) {
  // How many more of mine have to go down before a rout test is due.
  const toRout = Math.max(0, totals.routAt - totals.ownOutOfAction)
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
        <Tile icon="enemy" label="Enemies out" value={enemyModels !== null ? `${totals.enemiesOutOfAction}/${enemyModels}` : String(totals.enemiesOutOfAction)} />
        <Tile
          icon="models"
          label="Own out"
          value={`${totals.ownOutOfAction}/${totals.startingModels}`}
          sub={rout === 'routed' ? 'routed' : toRout === 0 ? 'rout test due' : toRout === 1 ? '1 more to test' : `${toRout} more to test`}
          tone={rout === 'none' ? 'plain' : 'warn'}
        />
        <Tile icon="wyrdstone" label="Wyrdstone" value={String(totals.wyrdstoneFound)} />
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
