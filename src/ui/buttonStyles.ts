// Class strings shared by <Button> and the few links styled as buttons.

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

/**
 * The button ladder: one oxblood primary per screen, an ink outline for everything else, a plain
 * link-coloured ghost, and an oxblood outline for the destructive one. Every variant contrasts with
 * paper and with a raised card.
 */
export const BUTTON_BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-surface-low shadow-sm hover:bg-accent-strong active:bg-accent-strong',
  secondary: 'border border-ink/70 bg-transparent text-ink hover:bg-surface-high active:bg-surface-high',
  ghost: 'text-link hover:text-ink hover:underline underline-offset-4',
  danger: 'border border-accent text-accent hover:bg-accent/10',
}
