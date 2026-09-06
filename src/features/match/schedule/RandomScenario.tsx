// Rolling for the scenario. The rulebook has you roll on a table; this does the same thing where
// you can see it — the list runs past, slows, and stops on one — and drops the result into the
// form. It is a presentation of a random pick, not a substitute for one: the choice is made first
// and the animation walks to it, so what is shown is always what is used.

import { useEffect, useRef, useState } from 'react'
import { rollDie } from '../../../rules/resolve/dice'
import { Button, Sheet } from '../../../ui'

export interface RandomOption {
  id: string
  title: string
  subtitle?: string
}

export interface RandomScenarioProps {
  options: RandomOption[]
  /** Called with the chosen option once the player accepts it. */
  onPick: (option: RandomOption) => void
  disabled?: boolean
  /** "Roll for a scenario" / "Roll for a district". */
  label?: string
  /** Heading inside the sheet. */
  title?: string
}

/** Uniform over the list, using the same dice source as everything else in the app. */
function pickIndex(count: number): number {
  if (count <= 1) return 0
  // Rejection-free enough for a list this size: combine dice until the range covers it.
  let n = 0
  let range = 1
  while (range < count) {
    n = n * 6 + (rollDie(6) - 1)
    range *= 6
  }
  return n % count
}

const TICK_START = 60
const TICK_END = 260
const TICKS = 18

export function RandomScenario({ options, onPick, disabled = false, label = 'Roll for a scenario', title = 'Rolling for a scenario' }: RandomScenarioProps) {
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const [landed, setLanded] = useState<RandomOption | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const held = timers
    return () => {
      for (const t of held.current) window.clearTimeout(t)
      held.current = []
    }
  }, [])

  function clearTimers() {
    for (const t of timers.current) window.clearTimeout(t)
    timers.current = []
  }

  function roll() {
    if (options.length === 0) return
    clearTimers()
    setLanded(null)
    const chosen = pickIndex(options.length)
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (reduced) {
      setCursor(chosen)
      setLanded(options[chosen])
      return
    }
    // Walk forward to the chosen row, slowing as it goes, ending exactly on it.
    let at = 0
    for (let i = 0; i < TICKS; i++) {
      const eased = TICK_START + (TICK_END - TICK_START) * (i / (TICKS - 1)) ** 2
      at += eased
      const index = i === TICKS - 1 ? chosen : (chosen + TICKS - 1 - i) % options.length
      timers.current.push(
        window.setTimeout(() => {
          setCursor(index)
          if (i === TICKS - 1) setLanded(options[chosen])
        }, at),
      )
    }
  }

  function start() {
    setOpen(true)
    setLanded(null)
    setCursor(0)
    window.setTimeout(roll, 200)
  }

  return (
    <>
      <Button variant="secondary" disabled={disabled || options.length === 0} onClick={start}>
        {label}
      </Button>
      <Sheet
        open={open}
        onClose={() => {
          clearTimers()
          setOpen(false)
        }}
        title={title}
        description={landed ? 'The table has spoken. Take it, or roll again.' : 'Rolling…'}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={roll} disabled={landed === null}>
              Roll again
            </Button>
            <Button
              className="flex-1"
              disabled={landed === null}
              onClick={() => {
                if (!landed) return
                onPick(landed)
                setOpen(false)
              }}
            >
              Take it
            </Button>
          </div>
        }
      >
        <ul className="flex max-h-[50vh] flex-col divide-y divide-border overflow-y-auto rounded-md border border-border" aria-live="polite">
          {options.map((option, i) => {
            const on = i === cursor
            const settled = landed !== null && on
            return (
              <li
                key={option.id}
                ref={(node) => {
                  if (on) node?.scrollIntoView({ block: 'nearest' })
                }}
                className={`flex min-h-11 flex-col justify-center px-3 py-2 transition-colors ${
                  settled ? 'bg-brass text-surface-low' : on ? 'bg-surface-high text-ink' : 'text-ink-dim'
                }`}
              >
                <span className={`text-sm ${settled ? 'font-semibold' : ''}`}>{option.title}</span>
                {option.subtitle ? <span className={`truncate text-xs ${settled ? 'text-surface-low/80' : 'text-ink-dim'}`}>{option.subtitle}</span> : null}
              </li>
            )
          })}
        </ul>
      </Sheet>
    </>
  )
}
