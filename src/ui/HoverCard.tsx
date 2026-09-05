// A term with its rules text one gesture away: hover (or keyboard focus) on a device with a
// pointer, a tap on a touch screen. The card is rendered inline in the DOM, positioned below the
// term, and never wider than the viewport.

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

export interface HoverCardProps {
  /** The term as shown in running text; rendered as a button with a dotted underline. */
  label: ReactNode
  /** The rules text. */
  children: ReactNode
  /** Optional heading inside the card (defaults to no heading). */
  title?: string
  className?: string
}

export function HoverCard({ label, children, title, className = '' }: HoverCardProps) {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)
  const id = useId()
  const wrapRef = useRef<HTMLSpanElement>(null)

  // Tap elsewhere or press Escape to close a card that was opened by tap.
  useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const shown = open || hover
  return (
    <span ref={wrapRef} className={`relative inline-block ${className}`} onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)} onPointerLeave={() => setHover(false)}>
      <button
        type="button"
        aria-expanded={shown}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        className="inline cursor-help rounded-sm text-left underline decoration-ink-dim/70 decoration-dotted underline-offset-[3px] hover:decoration-ink"
      >
        {label}
      </button>
      {shown ? (
        <span
          id={id}
          role="tooltip"
          className="absolute left-0 top-full z-30 mt-1.5 block w-72 max-w-[calc(100vw-2.5rem)] rounded-md border border-border bg-surface-low px-3.5 py-3 text-left text-xs leading-relaxed text-ink shadow-lg"
        >
          {title ? <span className="mb-1 block font-semibold text-ink">{title}</span> : null}
          {children}
        </span>
      ) : null}
    </span>
  )
}
