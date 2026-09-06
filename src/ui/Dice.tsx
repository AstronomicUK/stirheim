// Dice you can see. A face is a real die drawn with pips, big enough to tap on a phone; a row of
// them is how the app asks for a roll, replacing the old type-a-number field. "Roll" tumbles the
// faces for a moment and settles on a result, so a rolled die and a tapped one look the same
// afterwards. Everything respects prefers-reduced-motion: the tumble is skipped, the result is not.

import { useEffect, useRef, useState } from 'react'
import { rollDie } from '../rules/resolve/dice'

/** Pip layout per face, as fractions of the die's box. */
const PIPS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [
    [0.28, 0.28],
    [0.72, 0.72],
  ],
  3: [
    [0.26, 0.26],
    [0.5, 0.5],
    [0.74, 0.74],
  ],
  4: [
    [0.28, 0.28],
    [0.72, 0.28],
    [0.28, 0.72],
    [0.72, 0.72],
  ],
  5: [
    [0.27, 0.27],
    [0.73, 0.27],
    [0.5, 0.5],
    [0.27, 0.73],
    [0.73, 0.73],
  ],
  6: [
    [0.28, 0.24],
    [0.72, 0.24],
    [0.28, 0.5],
    [0.72, 0.5],
    [0.28, 0.76],
    [0.72, 0.76],
  ],
}

export type DieTone = 'plain' | 'good' | 'bad' | 'brass'

const TONE: Record<DieTone, string> = {
  plain: 'border-border bg-surface-low text-ink',
  good: 'border-ok bg-ok/10 text-ok',
  bad: 'border-accent bg-accent/10 text-accent',
  brass: 'border-brass bg-brass/15 text-brass',
}

export interface DieFaceProps {
  value: number
  size?: number
  tone?: DieTone
  /** Mid-tumble: the face is drawn dimmer so the settled result reads as the answer. */
  rolling?: boolean
  className?: string
}

/** One die, drawn. Faces above six fall back to the number itself (a D66 tens die, say). */
export function DieFace({ value, size = 40, tone = 'plain', rolling = false, className = '' }: DieFaceProps) {
  const pips = PIPS[value]
  return (
    <span
      aria-hidden
      className={`inline-grid shrink-0 place-items-center rounded-[22%] border-2 ${TONE[tone]} ${rolling ? 'opacity-70' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      {pips ? (
        <svg viewBox="0 0 100 100" width={size * 0.82} height={size * 0.82} className="block">
          {pips.map(([x, y], i) => (
            <circle key={i} cx={x * 100} cy={y * 100} r={9.5} fill="currentColor" />
          ))}
        </svg>
      ) : (
        <span className="text-base font-semibold tabular-nums">{value}</span>
      )}
    </span>
  )
}

export interface DicePickerProps {
  /** How many dice this roll wants: 1 for a D6, 2 for a 2D6. */
  count?: number
  sides?: number
  /** Fires once every die has a face. */
  onComplete: (values: number[]) => void
  /** Screen-reader name for the whole group ("To hit", "Cast the spell"). */
  label: string
  disabled?: boolean
  /** Hide the Roll button when the player is expected to enter their own dice. */
  rollable?: boolean
  /** Reset the picker when this changes (a new step of the same shape). */
  resetKey?: string | number
  className?: string
}

const TUMBLE_MS = 620
const TICK_MS = 70

/**
 * Ask for a roll. Each die is a row of six tappable faces, or the player hits Roll and watches it
 * tumble. Once every die is set the values go up in one call, so the caller sees a 2D6 as a pair.
 */
export function DicePicker({ count = 1, sides = 6, onComplete, label, disabled = false, rollable = true, resetKey, className = '' }: DicePickerProps) {
  const [values, setValues] = useState<(number | null)[]>(() => Array<number | null>(count).fill(null))
  const [tumbling, setTumbling] = useState<number[] | null>(null)
  const timers = useRef<number[]>([])

  // A new step reuses this component; clear what the last one left behind, during the render that
  // brings the new step in rather than in an effect afterwards.
  const [seenStep, setSeenStep] = useState<unknown>(resetKey)
  if (!Object.is(seenStep, resetKey)) {
    setSeenStep(resetKey)
    setValues(Array<number | null>(count).fill(null))
    setTumbling(null)
  }

  useEffect(() => {
    const held = timers
    return () => {
      for (const t of held.current) window.clearTimeout(t)
      held.current = []
    }
  }, [])

  function settle(next: (number | null)[]) {
    setValues(next)
    if (next.every((v) => v !== null)) onComplete(next as number[])
  }

  function set(index: number, value: number) {
    if (disabled) return
    const next = [...values]
    next[index] = value
    settle(next)
  }

  function rollAll() {
    if (disabled) return
    const result = Array.from({ length: count }, () => rollDie(sides))
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (reduced) {
      settle(result)
      return
    }
    const ticks = Math.round(TUMBLE_MS / TICK_MS)
    for (let i = 0; i < ticks; i++) {
      timers.current.push(
        window.setTimeout(() => {
          setTumbling(Array.from({ length: count }, () => rollDie(sides)))
        }, i * TICK_MS),
      )
    }
    timers.current.push(
      window.setTimeout(() => {
        setTumbling(null)
        settle(result)
      }, TUMBLE_MS),
    )
  }

  const faces = Array.from({ length: sides }, (_, i) => i + 1)
  return (
    <div className={`flex flex-col gap-2 ${className}`} role="group" aria-label={label}>
      {Array.from({ length: count }, (_, die) => {
        const chosen = tumbling ? tumbling[die] : values[die]
        return (
          <div key={die} className="flex flex-wrap items-center gap-1.5">
            {count > 1 ? <span className="w-10 text-[10px] uppercase tracking-wide text-ink-dim">Die {die + 1}</span> : null}
            {faces.map((face) => {
              const active = chosen === face
              return (
                <button
                  key={face}
                  type="button"
                  disabled={disabled || tumbling !== null}
                  aria-label={`${label}: ${face}`}
                  aria-pressed={active}
                  onClick={() => set(die, face)}
                  className={`rounded-[22%] transition-transform disabled:cursor-default ${active ? 'scale-105' : 'opacity-60 hover:opacity-100'}`}
                >
                  <DieFace value={face} size={38} tone={active ? 'brass' : 'plain'} rolling={tumbling !== null} />
                </button>
              )
            })}
          </div>
        )
      })}
      {rollable ? (
        <div>
          <button
            type="button"
            disabled={disabled || tumbling !== null}
            onClick={rollAll}
            className="min-h-9 rounded-md border border-brass bg-brass/10 px-3 text-sm font-semibold text-brass hover:bg-brass/20 disabled:opacity-60"
          >
            {tumbling ? 'Rolling…' : count > 1 ? `Roll ${count}D${sides}` : `Roll D${sides}`}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export interface RollResultProps {
  /** The faces that came up. */
  dice: number[]
  /** "9 against 10+" — what the roll has to beat. */
  headline: string
  detail?: string
  tone: 'good' | 'bad' | 'neutral'
}

/**
 * The confirmation after a roll: the faces themselves, large, with what they mean. Shown in place
 * of a line of log text so a result registers before the next step is asked for.
 */
export function RollResult({ dice, headline, detail, tone }: RollResultProps) {
  const dieTone: DieTone = tone === 'good' ? 'good' : tone === 'bad' ? 'bad' : 'plain'
  const ring = tone === 'good' ? 'border-ok/60 bg-ok/5' : tone === 'bad' ? 'border-accent/60 bg-accent/5' : 'border-border bg-surface-low'
  return (
    <div role="status" className={`flex items-center gap-3 rounded-md border px-3 py-2.5 ${ring}`}>
      <span className="flex gap-1.5">
        {dice.map((d, i) => (
          <DieFace key={i} value={d} size={34} tone={dieTone} />
        ))}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{headline}</span>
        {detail ? <span className="block text-xs leading-relaxed text-ink-dim">{detail}</span> : null}
      </span>
    </div>
  )
}
