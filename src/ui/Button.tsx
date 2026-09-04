import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  /** Shows a spinner and disables the button. */
  pending?: boolean
  block?: boolean
  children: ReactNode
}

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-base font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-ink hover:bg-accent-strong active:bg-accent-strong',
  secondary: 'border border-border bg-surface-high text-ink hover:border-ink-dim',
  ghost: 'text-ink-dim hover:text-ink',
  danger: 'border border-border text-accent-strong hover:border-accent-strong',
}

export function Button({ variant = 'primary', pending = false, block = false, className = '', children, disabled, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`${base} ${variants[variant]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {pending ? <Spinner size="sm" /> : null}
      {children}
    </button>
  )
}
