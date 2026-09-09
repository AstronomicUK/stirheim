import { Button, Icon, Stepper, type IconName } from '../../../ui'
import type { RoutStatus, SheetTotals } from './sheet'

/** What the other side has lost, and how close they are to testing, when their sheets say. */
export interface EnemyStanding {
  outOfAction: number
  models: number
  routAt: number
}

export interface TopStripProps {
  scenario: string
  /** The warbands at the table, the reader's own first. */
  warbands: { name: string; mine: boolean }[]
  turn: number
  onTurn: (turn: number) => void
  totals: SheetTotals
  /** The other warbands taken together; null until their rosters and sheets have loaded. */
  enemy: EnemyStanding | null
  rout: RoutStatus
  onRouted: (routed: boolean) => void
  readOnly: boolean
  turnLocked?: boolean
}

/** How many more have to fall before a rout test is due, in words. */
function toTest(out: number, routAt: number): string {
  const left = Math.max(0, routAt - out)
  return left === 0 ? 'rout test due' : left === 1 ? '1 more to test' : `${left} more to test`
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

/**
 * Pinned to the top while the game runs: the scenario, the turn, and the three numbers that
 * matter. Routing is not one of them — the rout check announces itself further down the sheet, and
 * a warband that has routed says so here in a line rather than a tile that reads "No" all game.
 */
export function TopStrip({ scenario, warbands, turn, onTurn, totals, enemy, rout, onRouted, readOnly, turnLocked = false }: TopStripProps) {
  return (
    <div className="sticky top-0 z-10 -mx-5 -mt-4 flex flex-col gap-2 border-b border-border bg-surface/95 px-5 pb-3 pt-3 backdrop-blur supports-[backdrop-filter]:bg-surface/85 lg:-mx-10 lg:-mt-8 lg:px-10 lg:pt-6">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate font-headline text-lg leading-tight text-ink">{scenario}</p>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-ink-dim">Turn</span>
          <Stepper value={turn} onChange={onTurn} label="turn" disabled={readOnly || turnLocked} />
        </div>
      </div>
      {/* One tag per warband rather than a sentence that runs off the side of a phone. */}
      <ul className="flex flex-wrap gap-1.5">
        {warbands.map((w) => (
          <li
            key={w.name}
            className={`min-w-0 truncate rounded-full border px-2.5 py-0.5 text-xs ${w.mine ? 'border-brass bg-brass/15 text-ink' : 'border-accent/50 bg-accent/5 text-ink-dim'}`}
          >
            {w.name}
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-3 gap-1.5 lg:max-w-xl">
        <Tile
          icon="models"
          label="Warband OOA"
          value={`${totals.ownOutOfAction}/${totals.startingModels}`}
          sub={rout === 'routed' ? 'routed' : toTest(totals.ownOutOfAction, totals.routAt)}
          tone={rout === 'none' ? 'plain' : 'warn'}
        />
        <Tile
          icon="enemy"
          label="Enemies OOA"
          value={enemy ? `${enemy.outOfAction}/${enemy.models}` : String(totals.enemiesOutOfAction)}
          sub={enemy ? toTest(enemy.outOfAction, enemy.routAt) : undefined}
        />
        <Tile icon="wyrdstone" label="Wyrdstone" value={String(totals.wyrdstoneFound)} />
      </div>
      {rout === 'routed' ? (
        <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-accent-strong bg-accent/15 px-3 py-2">
          <p className="text-sm text-ink">Your warband has routed. The battle is over for you; keep the sheet for the report.</p>
          {readOnly ? null : (
            <Button variant="ghost" onClick={() => onRouted(false)}>
              Undo
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}
