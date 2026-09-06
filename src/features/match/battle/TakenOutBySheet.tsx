// "Who took X out of action?" Asked whenever a warrior is marked out on the sheet, whichever way the
// table is scoring: the enemy models fit to fight, or a fall, a spell, terrain. The answer feeds the
// report's key events. The calculator's own logged kills answer it without asking.

import type { TakenOutBy } from '../../../domain'
import { Button, Sheet } from '../../../ui'
import type { EnemyWarband } from '../fight/useEnemyRosters'
import { splitWarriors, fightingGroups } from './sheet'

export interface TakenOutBySheetProps {
  open: boolean
  /** The warrior (or group) just marked out, for the title. */
  subjectName: string
  enemies: EnemyWarband[]
  enemiesPending: boolean
  turn: number
  onPick: (by: TakenOutBy) => void
  onClose: () => void
}

export function TakenOutBySheet({ open, subjectName, enemies, enemiesPending, turn, onPick, onClose }: TakenOutBySheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={`Who took ${subjectName} out?`} description="Goes on the report as a key event. Skip if nobody knows.">
      <div className="flex flex-col gap-4 py-2">
        {enemiesPending ? <p className="text-sm text-ink-dim">Loading the other warbands…</p> : null}
        {enemies.map((w) => {
          const fighting = splitWarriors(w.roster).fighting
          const groups = fightingGroups(w.roster)
          return (
            <section key={w.participant.warband_id} className="flex flex-col gap-1.5">
              <h3 className="text-xs uppercase tracking-wider text-ink-dim">{w.participant.warband_name}</h3>
              <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
                {fighting.map(({ warrior }) => (
                  <li key={warrior.id}>
                    <button
                      type="button"
                      className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-surface-high"
                      onClick={() => onPick({ warbandId: w.participant.warband_id, modelId: warrior.id, name: `${warrior.name} (${w.participant.warband_name})`, turn })}
                    >
                      <span className="text-sm text-ink">{warrior.name}</span>
                    </button>
                  </li>
                ))}
                {groups.map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-surface-high"
                      onClick={() => onPick({ warbandId: w.participant.warband_id, modelId: g.id, name: `one of the ${g.name} (${w.participant.warband_name})`, turn })}
                    >
                      <span className="text-sm text-ink">{g.name}</span>
                      <span className="text-xs text-ink-dim">
                        {g.size} {g.size === 1 ? 'model' : 'models'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
        <div className="flex flex-col gap-2">
          <Button variant="secondary" block onClick={() => onPick({ warbandId: null, modelId: null, name: 'a fall, terrain or a spell', turn })}>
            A fall, terrain or a spell
          </Button>
          <Button variant="ghost" block onClick={onClose}>
            Not sure, skip
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
