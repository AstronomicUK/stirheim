import { useId, type SelectHTMLAttributes } from 'react'

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  hint?: string
  error?: string
  /** Visually hide the label (still read by screen readers), for dense rows. */
  hideLabel?: boolean
}

/** Native select styled like TextField. Options (and optgroups) are passed as children. */
export function SelectField({ label, hint, error, hideLabel = false, className = '', children, ...rest }: SelectFieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'text-sm font-medium text-ink-dim'}>
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-12 w-full min-w-0 appearance-none rounded-md border bg-surface-low px-3.5 text-base text-ink focus:border-brass focus:outline-none ${
          error ? 'border-accent-strong' : 'border-border'
        } ${className}`}
        {...rest}
      >
        {children}
      </select>
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
