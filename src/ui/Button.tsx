import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './Spinner'

import { BUTTON_BASE, BUTTON_VARIANTS, type ButtonVariant } from './buttonStyles'

type Variant = ButtonVariant

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  /** Shows a spinner and disables the button. */
  pending?: boolean
  block?: boolean
  children: ReactNode
}

export function Button({ variant = 'primary', pending = false, block = false, className = '', children, disabled, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {pending ? <Spinner size="sm" /> : null}
      {children}
    </button>
  )
}
