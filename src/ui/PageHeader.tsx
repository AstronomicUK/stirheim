import type { ReactNode } from 'react'

export interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: ReactNode
  /** Small control shown to the right of the title, such as a link. */
  aside?: ReactNode
}

export function PageHeader({ eyebrow, title, description, aside }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-end justify-between gap-4">
        <div>
          {eyebrow ? <p className="text-xs uppercase tracking-[0.25em] text-ink-dim">{eyebrow}</p> : null}
          <h1 className="font-headline text-3xl font-semibold leading-tight text-ink">{title}</h1>
        </div>
        {aside ? <div className="shrink-0 pb-1">{aside}</div> : null}
      </div>
      {description ? <p className="text-base leading-relaxed text-ink-dim">{description}</p> : null}
    </header>
  )
}
