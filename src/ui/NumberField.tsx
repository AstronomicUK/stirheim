import { useId, useState } from 'react'

export interface NumberFieldProps {
  label: string
  value: number | null
  /** Called with the parsed integer, or null when `allowEmpty` and the field is blank. */
  onChange: (value: number | null) => void
  hint?: string
  error?: string
  allowEmpty?: boolean
  /** Compact: smaller label and input, for stat grids. */
  compact?: boolean
  disabled?: boolean
  className?: string
}

function format(value: number | null): string {
  return value === null || Number.isNaN(value) ? '' : String(value)
}

/** "" -> null; anything else through Number(), so "-" and "abc" become NaN. */
function parse(text: string): number | null {
  const trimmed = text.trim()
  return trimmed === '' ? null : Number(trimmed)
}

/**
 * Integer input with a numeric keypad. Keeps its own text while the user types so "" and "-" do
 * not snap back to a number; the parent only hears whole numbers (or null when blank is allowed).
 */
export function NumberField({ label, value, onChange, hint, error, allowEmpty = false, compact = false, disabled = false, className = '' }: NumberFieldProps) {
  const id = useId()
  const [text, setText] = useState(format(value))
  const [seenValue, setSeenValue] = useState(value)

  // Follow external changes (a reset, a stepper) without fighting what the user is typing.
  if (!Object.is(value, seenValue)) {
    setSeenValue(value)
    if (!Object.is(parse(text), value) && !Number.isNaN(value)) setText(format(value))
  }

  function handle(next: string) {
    setText(next)
    const parsed = parse(next)
    // A blank required field is reported as NaN so the parent cannot save a stale number.
    onChange(parsed === null && !allowEmpty ? Number.NaN : parsed)
  }

  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  const invalid = Boolean(error) || (!allowEmpty && text.trim() === '') || Number.isNaN(parse(text))
  return (
    <div className={`flex flex-col ${compact ? 'gap-1' : 'gap-1.5'} ${className}`}>
      <label htmlFor={id} className={`${compact ? 'text-[10px] uppercase tracking-wide text-center' : 'text-sm'} font-medium text-ink-dim`}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="-?[0-9]*"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-md border bg-surface-low text-ink focus:border-brass focus:outline-none disabled:opacity-60 ${
          compact ? 'min-h-11 px-1 text-center font-mono text-base tabular-nums' : 'min-h-12 px-3.5 text-base'
        } ${invalid ? 'border-accent-strong' : 'border-border'}`}
        value={text}
        onChange={(e) => handle(e.target.value)}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-accent-strong">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-dim">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
