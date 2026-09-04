import { useId, type TextareaHTMLAttributes } from 'react'

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
  hint?: string
  error?: string
}

/** Multi-line text with a label above and hint or error below. */
export function TextArea({ label, hint, error, className = '', rows = 3, ...rest }: TextAreaProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink-dim">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-md border bg-surface-low px-3.5 py-2.5 text-base leading-relaxed text-ink placeholder:text-ink-dim/60 focus:border-brass focus:outline-none ${
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
