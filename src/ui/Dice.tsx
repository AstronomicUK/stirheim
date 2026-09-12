// Dice you can see. A face is a real die drawn with pips — ivory and brass, softly bevelled, big
// enough to tap on a phone. "Roll" throws one genuine 3D cube per die across a tray: six fixed
// faces, an edge-over-edge tumble, a small rebound, and the very same cube stays put at rest showing
// the result (Tom's approved v3 design, docs/design-drafts/dice-2026-09-12). The outcome is rolled
// once by the rules RNG before the cube is mounted; the animation only ever decorates it. Tapping a
// face is still how a tabletop die is entered. Reduced motion skips the tumble, never the result.

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { rollDie } from '../rules/resolve/dice'
import { cubeFaces, SETTLE_MS, TUMBLE_MS } from './diceCube'

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

/** Brass marks a chosen die; good/bad tint the edge and pips with the existing status colours, no more. */
export type DieTone = 'plain' | 'good' | 'bad' | 'brass'

export interface DieFaceProps {
  value: number
  size?: number
  tone?: DieTone
  /** Kept for callers that dim a face mid-roll; the 3D cube no longer needs it. */
  rolling?: boolean
  /** The chosen one of a row: brass outline, a lift and a tick, with the state also exposed by the button around it. */
  selected?: boolean
  className?: string
}

/** One die, drawn. Faces above six fall back to the number itself (a D66 tens die, say). */
export function DieFace({ value, size = 40, tone = 'plain', rolling = false, selected = false, className = '' }: DieFaceProps) {
  const pips = PIPS[value]
  return (
    <span
      aria-hidden
      data-tone={tone}
      className={`stirheim-die ${size < 44 ? 'stirheim-die-small' : ''} ${selected ? 'stirheim-die-selected' : ''} ${rolling ? 'opacity-70' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      {pips ? (
        <svg viewBox="0 0 100 100" width={size * 0.78} height={size * 0.78} className="block">
          {pips.map(([x, y], i) => (
            <circle key={i} cx={x * 100} cy={y * 100} r={9} fill="currentColor" />
          ))}
        </svg>
      ) : (
        <span className="font-semibold tabular-nums" style={{ fontSize: Math.round(size * 0.42) }}>
          {value}
        </span>
      )}
      {selected ? <span className="stirheim-die-tick">✓</span> : null}
    </span>
  )
}

export interface TumblingDieProps {
  value: number
  sides?: number
  size?: number
  tone?: DieTone
  /** False under reduced motion: the cube is mounted already at rest. */
  animate?: boolean
}

/** One real cube, thrown across the tray and left at rest on `value`. Decorative: the value is decided before it mounts. */
export function TumblingDie({ value, sides = 6, size = 64, tone = 'plain', animate = true }: TumblingDieProps) {
  const faces = cubeFaces(value, sides)
  return (
    <span aria-hidden className={`stirheim-roll-path ${animate ? 'stirheim-roll-path-go' : ''}`} style={{ '--die-size': `${size}px` } as CSSProperties}>
      <span className={`stirheim-cube ${animate ? 'stirheim-cube-go' : ''}`}>
        {faces.map((face, i) => (
          <span key={i} className={`stirheim-cube-face stirheim-cube-side-${i}`}>
            <DieFace value={face} size={size} tone={tone} />
          </span>
        ))}
      </span>
    </span>
  )
}

export interface DicePickerProps {
  /** How many dice this roll wants: 1 for a D6, 2 for a 2D6. */
  count?: number
  sides?: number
  /** Fires once every die has a face. `manual` is false once any die in this roll used the Roll button. */
  onComplete: (values: number[], manual: boolean) => void
  /** Screen-reader name for the whole group ("To hit", "Cast the spell"). */
  label: string
  disabled?: boolean
  /** Hide the Roll button when the player is expected to enter their own dice; the faces then start open. */
  rollable?: boolean
  /** Reset the picker when this changes (a new step of the same shape). */
  resetKey?: string | number
  className?: string
}

/**
 * Ask for a roll. The tray shows one die per result; Roll throws real cubes into it, or the player
 * opens "Enter tabletop dice instead" and taps the face each die showed. Once every die is set the
 * values go up in one call, so the caller sees a 2D6 as a pair.
 *
 * `resetKey` remounts the picker, which is how a new step of the same shape starts empty.
 */
export function DicePicker({ resetKey, ...rest }: DicePickerProps) {
  return <OneRoll key={String(resetKey ?? '')} {...rest} />
}

const RESULT_SIZE = 64
const CHOICE_SIZE = 36

function OneRoll({ count = 1, sides = 6, onComplete, label, disabled = false, rollable = true, className = '' }: Omit<DicePickerProps, 'resetKey'>) {
  const [values, setValues] = useState<(number | null)[]>(() => Array<number | null>(count).fill(null))
  // The cubes on the tray after Roll: mounted once with the real result and left there at rest.
  const [cubes, setCubes] = useState<{ faces: number[]; animate: boolean } | null>(null)
  const [phase, setPhase] = useState<'idle' | 'rolling' | 'landed' | 'done'>('idle')
  // Every face each die has shown while this roll is still in progress (#20) — with more than one
  // die, a player can keep re-tapping one die's face while the other sits blank, with the old face
  // otherwise vanishing the moment a new one is tapped. Visible so that can't happen out of sight.
  const [attemptsByDie, setAttemptsByDie] = useState<number[][]>(() => Array.from({ length: count }, () => []))
  const timers = useRef<number[]>([])
  // Mirrors `values` so two taps landing in the same frame do not both read the pre-tap array.
  const latest = useRef<(number | null)[]>(Array<number | null>(count).fill(null))
  // The Roll button overwrites every die at once, so one flag for the whole picker is enough.
  const rolledViaButton = useRef(false)
  // Set the instant Roll is tapped, before React re-renders, so a second tap cannot schedule twice.
  const busy = useRef(false)

  useEffect(() => {
    const held = timers
    return () => {
      for (const t of held.current) window.clearTimeout(t)
      held.current = []
    }
  }, [])

  function settle(next: (number | null)[]) {
    latest.current = next
    setValues(next)
    if (next.every((v) => v !== null)) onComplete(next as number[], !rolledViaButton.current)
  }

  function set(index: number, value: number) {
    if (disabled || busy.current) return
    const next = [...latest.current]
    next[index] = value
    setAttemptsByDie((prev) => {
      const mine = prev[index]
      if (mine[mine.length - 1] === value) return prev
      const copy = [...prev]
      copy[index] = [...mine, value]
      return copy
    })
    settle(next)
  }

  function rollAll() {
    if (disabled || busy.current) return
    busy.current = true
    rolledViaButton.current = true
    const result = Array.from({ length: count }, () => rollDie(sides))
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    setCubes({ faces: result, animate: !reduced })
    if (reduced) {
      setPhase('done')
      settle(result)
      return
    }
    setPhase('rolling')
    timers.current.push(window.setTimeout(() => setPhase('landed'), TUMBLE_MS))
    timers.current.push(
      window.setTimeout(() => {
        setPhase('done')
        settle(result)
      }, TUMBLE_MS + SETTLE_MS),
    )
  }

  const inFlight = phase === 'rolling' || phase === 'landed'
  const locked = disabled || inFlight
  const faces = Array.from({ length: sides }, (_, i) => i + 1)
  return (
    <div className={`flex flex-col gap-3 ${className}`} role="group" aria-label={label}>
      <div className="stirheim-tray" style={{ '--die-size': `${RESULT_SIZE}px` } as CSSProperties}>
        {Array.from({ length: count }, (_, die) => {
          const value = values[die]
          return (
            <span key={die} className="flex flex-col items-center gap-1.5">
              {cubes ? (
                <TumblingDie value={cubes.faces[die]} sides={sides} size={RESULT_SIZE} animate={cubes.animate} />
              ) : value !== null ? (
                <DieFace value={value} size={RESULT_SIZE} />
              ) : (
                <span className="stirheim-die-slot" aria-hidden />
              )}
              {count > 1 ? <span className="text-[10px] uppercase tracking-wide text-ink-dim">Die {die + 1}</span> : null}
            </span>
          )
        })}
      </div>
      <p className="sr-only" aria-live="polite">
        {phase === 'rolling' ? 'Rolling…' : cubes ? `Rolled ${cubes.faces.join(' and ')}` : ''}
      </p>
      {rollable ? (
        <button type="button" disabled={locked || phase === 'done'} onClick={rollAll} className="stirheim-roll-button">
          {phase === 'rolling' ? 'Rolling…' : phase === 'landed' || phase === 'done' ? 'Rolled!' : count > 1 ? `Roll ${count}D${sides}` : `Roll D${sides}`}
        </button>
      ) : null}
      <details className="stirheim-manual" open={!rollable || undefined}>
        <summary className="cursor-pointer select-none text-sm text-ink-dim">{rollable ? 'Enter tabletop dice instead' : 'Tap the face your die showed'}</summary>
        <div className="flex flex-col gap-2 pt-2">
          {Array.from({ length: count }, (_, die) => {
            const chosen = values[die]
            const attempts = attemptsByDie[die] ?? []
            return (
              <div key={die} className="flex flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-1">
                  {count > 1 ? <span className="w-10 text-[10px] uppercase tracking-wide text-ink-dim">Die {die + 1}</span> : null}
                  {faces.map((face) => {
                    const active = chosen === face && !cubes
                    return (
                      <button
                        key={face}
                        type="button"
                        disabled={locked || cubes !== null}
                        aria-label={count > 1 ? `${label}: die ${die + 1}, ${face}` : `${label}: ${face}`}
                        aria-pressed={active}
                        onClick={() => set(die, face)}
                        className="stirheim-choice"
                      >
                        <DieFace value={face} size={CHOICE_SIZE} selected={active} className={active ? 'stirheim-pick' : ''} />
                      </button>
                    )
                  })}
                </div>
                {attempts.length > 1 ? (
                  <p className="pl-1 text-[10px] text-ink-dim" title="Every face this die has shown for this roll, in order — visible so a re-tap can't happen out of sight.">
                    Tried {attempts.join(' → ')}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>
      </details>
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
  /** Whether the app rolled this (the Roll button) or a face was tapped in by hand; omitted when unknown. */
  manual?: boolean
}

/**
 * The confirmation after a roll: the faces themselves, large, with what they mean. Shown in place
 * of a line of log text so a result registers before the next step is asked for.
 */
export function RollResult({ dice, headline, detail, tone, manual }: RollResultProps) {
  const dieTone: DieTone = tone === 'good' ? 'good' : tone === 'bad' ? 'bad' : 'plain'
  const ring = tone === 'good' ? 'border-ok/60 bg-ok/5' : tone === 'bad' ? 'border-accent/60 bg-accent/5' : 'border-border bg-surface-low'
  return (
    <div role="status" className={`flex items-center gap-4 rounded-md border px-3 py-3 ${ring}`}>
      <span className="flex gap-3 py-1 pl-1">
        {dice.map((d, i) => (
          <DieFace key={i} value={d} size={56} tone={dieTone} />
        ))}
      </span>
      <span className="min-w-0">
        <span className="block font-headline text-2xl leading-tight text-ink">{headline}</span>
        {detail ? <span className="block text-sm leading-relaxed text-ink-dim">{detail}</span> : null}
        {manual !== undefined ? <span className="block text-[10px] uppercase tracking-wide text-ink-dim">{manual ? 'Entered by hand' : 'Rolled by the app'}</span> : null}
      </span>
    </div>
  )
}
