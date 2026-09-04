import { useId, type InputHTMLAttributes } from 'react'

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hint?: string
  error?: string
}

/** Single-column text input with a label above and hint or error below. Min 48px tall for thumbs. */
export function TextField({ label, hint, error, className = '', ...rest }: TextFieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-dim">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-12 w-full rounded-md border bg-surface-low px-3.5 text-base text-ink placeholder:text-ink-dim/60 focus:border-brass focus:outline-none ${
          error ? 'border-accent-strong' : 'border-border'
        } ${className}`}
        {...rest}
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
