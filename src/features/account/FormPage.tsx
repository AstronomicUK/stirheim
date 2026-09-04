import type { FormEvent, ReactNode } from 'react'
import { Wordmark } from '../../ui'

export interface FormPageProps {
  title: string
  description?: ReactNode
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  /** Field stack. */
  children: ReactNode
  /** Primary action; rendered in a bar that sticks to the bottom of the phone screen. */
  action: ReactNode
  /** Quiet links under the action (switch to sign-up, forgot password, ...). */
  footer?: ReactNode
}

/** Shared frame for the auth screens: large wordmark, title, one column of fields, sticky action. */
export function FormPage({ title, description, onSubmit, children, action, footer }: FormPageProps) {
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-6 pt-6">
        <Wordmark size="lg" to="/sign-in" />
        <div className="flex flex-col gap-2">
          <h1 className="font-headline text-3xl font-semibold text-ink">{title}</h1>
          {description ? <p className="leading-relaxed text-ink-dim">{description}</p> : null}
        </div>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
      <div className="mt-auto flex flex-col gap-4">
        <div className="sticky bottom-0 -mx-5 bg-surface px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{action}</div>
        {footer ? <div className="flex flex-col items-start gap-3 text-sm text-ink-dim">{footer}</div> : null}
      </div>
    </form>
  )
}
