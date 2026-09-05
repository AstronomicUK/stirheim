import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon, type IconName } from './icons'

export interface ActionTileProps {
  to: string
  icon: IconName
  title: string
  /** One line of context: "5 gc to spend", "1 hero has an advance to roll". */
  detail?: ReactNode
  /** A count to draw the eye: shown as an oxblood badge. */
  count?: number | null
  /** Brass border when the tile needs attention (something owed). */
  highlight?: boolean
}

/**
 * A raised tile with an icon, a name and a line of context. Replaces the plain-text buttons the
 * between-battles actions used to be, so the three things a player does after a game read as
 * destinations rather than form controls.
 */
export function ActionTile({ to, icon, title, detail, count = null, highlight = false }: ActionTileProps) {
  return (
    <Link
      to={to}
      className={`relative flex min-h-20 flex-col gap-1.5 rounded-md border bg-surface-low px-3 pb-2.5 pt-3 no-underline transition-colors hover:bg-surface-high ${
        highlight ? 'border-brass shadow-[inset_0_0_0_1px_var(--color-brass)]' : 'border-border'
      }`}
    >
      <Icon name={icon} size={22} className="text-brass" />
      <span className="text-sm font-semibold leading-tight text-ink">{title}</span>
      {detail ? <span className="text-xs leading-snug text-ink-dim">{detail}</span> : null}
      {count !== null && count > 0 ? (
        <span className="absolute right-2 top-2 rounded-full bg-accent px-1.5 py-px text-[11px] font-bold leading-4 text-surface-low">{count}</span>
      ) : null}
    </Link>
  )
}
