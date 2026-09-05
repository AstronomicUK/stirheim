import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon, type IconName } from '../../ui/icons'

export interface FormPageProps {
  title: string
  description?: ReactNode
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  /** Field stack. */
  children: ReactNode
  /** Primary action, rendered at the foot of the card. */
  action: ReactNode
  /** Quiet links under the action (switch to sign-up, forgot password, ...). */
  footer?: ReactNode
  /** Show the three one-line promises beneath the card (the doorway screens). */
  promises?: boolean
}

const PROMISES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'warbands', title: 'Build a legal warband', text: 'from any published list and keep it up to date between games.' },
  { icon: 'battle', title: 'Run the battle', text: 'with optional full calculations and tracking of wounds, kills and OOA models.' },
  { icon: 'records', title: 'File the report', text: 'and let the wizard take you through a seamless post-battle sequence.' },
]

/**
 * Shared frame for the auth screens, the "Card" layout: the logo across the top, a raised card
 * holding the title, fields and action, and the three promises centred beneath it. One column at
 * every width; the card simply gets more air on a desktop.
 */
export function FormPage({ title, description, onSubmit, children, action, footer, promises = false }: FormPageProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-7 pt-4 md:pt-10">
      <Link to="/sign-in" className="block w-[min(100%,440px)] px-2 no-underline" aria-label="Stirheim">
        <img src="/brand/stirheim-logo-tight.png" alt="Stirheim" width={740} height={250} className="h-auto w-full drop-shadow-[0_6px_14px_rgba(36,31,26,0.22)]" />
        <span className="mt-2 block text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-dim">Campaign ledger for Mordheim</span>
      </Link>

      <form
        onSubmit={onSubmit}
        noValidate
        className="flex w-full max-w-md flex-col gap-5 rounded-xl border border-border bg-surface-low px-5 py-6 shadow-[0_12px_30px_rgba(36,31,26,0.10)] md:px-8 md:py-8"
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="font-headline text-3xl leading-none text-ink">{title}</h1>
          {description ? <p className="text-sm leading-relaxed text-ink-dim">{description}</p> : null}
        </div>
        <div className="flex flex-col gap-4">{children}</div>
        <div className="flex flex-col gap-4">
          {action}
          {footer ? <div className="flex flex-col items-start gap-2 border-t border-border pt-4 text-sm text-ink-dim">{footer}</div> : null}
        </div>
      </form>

      {promises ? (
        <ul className="grid w-full max-w-md grid-cols-3 gap-4 px-1 pb-4 text-center">
          {PROMISES.map((p) => (
            <li key={p.title} className="flex flex-col items-center gap-1.5 text-xs leading-snug text-ink-dim">
              <Icon name={p.icon} size={22} className="text-brass" />
              <span>
                <span className="block font-semibold text-ink">{p.title}</span>
                {p.text}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
