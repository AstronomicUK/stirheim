export interface StepperProps {
  value: number
  onChange: (value: number) => void
  /** Name of the thing being counted, for screen readers ("Group size"). */
  label: string
  min?: number
  /** Null or undefined = no upper bound. */
  max?: number | null
  disabled?: boolean
}

/** Minus / value / plus with 44 px buttons. Never calls onChange outside [min, max]. */
export function Stepper({ value, onChange, label, min = 0, max = null, disabled = false }: StepperProps) {
  const canDecrease = !disabled && value > min
  const canIncrease = !disabled && (max === null || value < max)
  const button =
    'inline-flex h-11 w-11 items-center justify-center text-lg text-ink transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-surface-high'
  return (
    <div className="inline-flex items-center rounded-md border border-border bg-surface" role="group" aria-label={label}>
      <button type="button" className={button} aria-label={`Fewer ${label}`} disabled={!canDecrease} onClick={() => onChange(value - 1)}>
        &minus;
      </button>
      <span className="min-w-8 text-center text-base tabular-nums text-ink" aria-live="polite">
        {value}
      </span>
      <button type="button" className={button} aria-label={`More ${label}`} disabled={!canIncrease} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  )
}
