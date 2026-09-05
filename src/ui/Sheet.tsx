import { useEffect, useId, useRef, type ReactNode } from 'react'

export interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  children: ReactNode
  /** Actions pinned under the scrolling body. */
  footer?: ReactNode
}

/**
 * Bottom sheet for phones: slides over the page, scrolls inside itself, closes on Escape, a backdrop
 * tap or the Close button. Content is only mounted while open.
 */
export function Sheet({ open, onClose, title, description, children, footer }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:justify-center">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
        className="relative mx-auto flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-xl border-t border-border bg-surface-low shadow-2xl focus:outline-none lg:max-w-lg lg:rounded-xl lg:border"
      >
        <header className="flex items-start justify-between gap-4 px-5 pb-2 pt-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-headline text-xl leading-tight text-ink">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-ink-dim">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md px-2 text-sm text-ink-dim hover:text-ink"
          >
            Close
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer ? (
          <div className="border-t border-border bg-surface-low px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}
