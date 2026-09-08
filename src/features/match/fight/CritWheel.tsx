// The critical hit chart, rolled where you can see it. The rows light one at a time, running down
// the table and back to the top, slowing until they stop on the one the die gave. The die is thrown
// first and the highlight walks to it, so what you watch land is the result the engine uses.

import { useEffect, useRef, useState } from 'react'
import { critRows, describeCrit, type CritTableKey } from '../../../rules/engine/crit'
import { rollDie } from '../../../rules/resolve/dice'
import { Button, DieFace } from '../../../ui'
import { tickDelay } from './critWheelTiming'

export interface CritWheelProps {
  table: CritTableKey
  /** Web of Steel and the like shift which row a face reaches. */
  rollModifier: number
  /** The face the chart was rolled on, once it settles. */
  onSettled: (face: number) => void
  /** Names the table in the heading ("Bladed weapons"). */
  tableName: string
  disabled?: boolean
}

const SPINS = 2
/** The landed row is held and flashed before the step moves on, so the result is read. */
const SETTLE_MS = 1100

export function CritWheel({ table, rollModifier, onSettled, tableName, disabled = false }: CritWheelProps) {
  const rows = critRows(table)
  const [cursor, setCursor] = useState<number | null>(null)
  const [face, setFace] = useState<number | null>(null)
  const [spinning, setSpinning] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const held = timers
    return () => {
      for (const t of held.current) window.clearTimeout(t)
      held.current = []
    }
  }, [])

  /** Which printed row a face lands on once the modifier is applied. */
  function rowFor(value: number): number {
    const modified = value + rollModifier
    const index = rows.findIndex((r) => modified <= r.to)
    return index === -1 ? rows.length - 1 : index
  }

  function spin(value: number) {
    const target = rowFor(value)
    setFace(value)
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (reduced) {
      setCursor(target)
      timers.current.push(window.setTimeout(() => onSettled(value), 400))
      return
    }
    setSpinning(true)
    const steps = rows.length * SPINS + target + 1
    let at = 0
    for (let i = 0; i < steps; i++) {
      const eased = tickDelay(i, steps)
      at += eased
      const index = i % rows.length
      const last = i === steps - 1
      timers.current.push(
        window.setTimeout(() => {
          setCursor(last ? target : index)
          if (last) setSpinning(false)
        }, at),
      )
    }
    // Hold on the answer before handing back, so the row that came up is actually read.
    timers.current.push(window.setTimeout(() => onSettled(value), at + SETTLE_MS))
  }

  const settled = !spinning && cursor !== null
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-ink">{tableName}</p>
        {rollModifier !== 0 ? (
          <span className="text-xs text-ink-dim">
            {rollModifier > 0 ? '+' : ''}
            {rollModifier} to the roll
          </span>
        ) : null}
      </div>

      <ol className="flex flex-col divide-y divide-border overflow-hidden rounded-md border border-border">
        {rows.map((row, i) => {
          const on = cursor === i
          const done = settled && on
          return (
            <li
              key={row.faces}
              className={`flex items-start gap-3 px-3 py-2 transition-colors ${done ? 'stirheim-land-row bg-accent text-surface-low' : on ? 'bg-brass/25 text-ink' : 'text-ink-dim'}`}
            >
              <span className={`w-9 shrink-0 text-xs tabular-nums ${done ? 'text-surface-low/80' : 'text-ink-dim'}`}>{row.faces}</span>
              <span className="min-w-0">
                <span className={`text-sm ${done || on ? 'font-semibold' : ''}`}>{row.result.label}</span>
                <span className={`block text-xs leading-relaxed ${done ? 'text-surface-low/85' : 'text-ink-dim'}`}>{describeCrit(row.result)}</span>
              </span>
            </li>
          )
        })}
      </ol>

      {settled && face !== null ? (
        <div className="flex items-center gap-3 rounded-md border border-accent/60 bg-accent/5 px-3 py-2.5" role="status">
          <span className="stirheim-land inline-flex">
            <DieFace value={face} size={34} tone="bad" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">{rows[cursor]?.result.label}</span>
            <span className="block text-xs leading-relaxed text-ink-dim">{rows[cursor] ? describeCrit(rows[cursor].result) : ''}</span>
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" disabled={disabled || spinning} onClick={() => spin(rollDie(6))}>
            {spinning ? 'Rolling…' : 'Roll on the chart'}
          </Button>
          <span className="text-xs text-ink-dim">or tap the face you rolled</span>
          <span className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((value) => (
              <button
                key={value}
                type="button"
                disabled={disabled || spinning}
                aria-label={`Critical hit chart: ${value}`}
                onClick={() => spin(value)}
                className="rounded-[22%] opacity-60 transition-transform hover:opacity-100 disabled:cursor-default"
              >
                <DieFace value={value} size={34} />
              </button>
            ))}
          </span>
        </div>
      )}
    </div>
  )
}
