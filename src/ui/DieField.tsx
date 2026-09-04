import { useId, useState } from 'react'
import { rollDie } from '../rules/resolve/dice'

export interface DieFieldProps {
  label: string
  /** Faces: 3 or 6 (a D66 is two DieFields). */
  sides: number
  value: number | null
  /** A whole number in 1..sides, or null while the field is blank or out of range. */
  onChange: (value: number | null) => void
  /** Show a Roll button that fills the field with a random result. */
  rollable?: boolean
  /** Visually hide the label (still read by screen readers), for rows of dice. */
  hideLabel?: boolean
  disabled?: boolean
  className?: string
}

function parse(text: string): number | null {
  const trimmed = text.trim()
  if (trimmed === '') return null
  return /^\d+$/.test(trimmed) ? Number(trimmed) : Number.NaN
}

/**
 * One die the player rolled: a numeric keypad input that only reports whole numbers in range,
 * with an optional "Roll" that does it for them (docs/PLANNING.md, dice policy). Keeps its own
 * text while typing so an out-of-range digit shows as an error instead of vanishing.
 */
export function DieField({ label, sides, value, onChange, rollable = false, hideLabel = false, disabled = false, className = '' }: DieFieldProps) {
  const id = useId()
  const [text, setText] = useState(value === null ? '' : String(value))
  const [seen, setSeen] = useState(value)

  const valid = (n: number | null): n is number => n !== null && Number.isInteger(n) && n >= 1 && n <= sides

  // Follow external changes (a roll, a reset) without clobbering an invalid entry we just reported as null.
  if (!Object.is(value, seen)) {
    setSeen(value)
    const parsed = parse(text)
    if (value === null) {
      if (valid(parsed)) setText('')
    } else if (parsed !== value) {
      setText(String(value))
    }
  }

  function handle(next: string) {
    setText(next)
    const parsed = parse(next)
    onChange(valid(parsed) ? parsed : null)
  }

  function roll() {
    const result = rollDie(sides)
    setText(String(result))
    onChange(result)
  }

  const parsed = parse(text)
  const invalid = text.trim() !== '' && !valid(parsed)
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'text-[10px] uppercase tracking-wide text-ink-dim'}>
        {label}
      </label>
      <div className="flex items-stretch gap-1.5">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-error` : undefined}
          placeholder={`1-${sides}`}
          className={`min-h-11 w-14 rounded-md border bg-surface-low text-center font-mono text-base tabular-nums text-ink placeholder:text-ink-dim/50 focus:border-brass focus:outline-none disabled:opacity-60 ${
            invalid ? 'border-accent-strong' : 'border-border'
          }`}
          value={text}
          onChange={(e) => handle(e.target.value)}
        />
        {rollable ? (
          <button
            type="button"
            disabled={disabled}
            onClick={roll}
            aria-label={`Roll ${label} for me`}
            className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm text-ink-dim transition-colors hover:border-brass hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            Roll
          </button>
        ) : null}
      </div>
      {invalid ? (
        <p id={`${id}-error`} className="text-xs text-accent-strong">
          1 to {sides}
        </p>
      ) : null}
    </div>
  )
}
