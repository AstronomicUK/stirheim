// Small presentational pieces for the campaign screens: cards, section headings, tags, link
// buttons and the toggle row the settings form uses. Same shapes as the roster's view/bits so the
// two areas read alike.

import type { ReactNode } from 'react'
import { Link } from 'react-router'

type TagTone = 'neutral' | 'warn' | 'brass'

const tagTones: Record<TagTone, string> = {
  neutral: 'border-border text-ink-dim',
  warn: 'border-warn/60 text-warn',
  brass: 'border-brass/60 text-brass',
}

export function Tag({ tone = 'neutral', children }: { tone?: TagTone; children: ReactNode }) {
  return <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs leading-5 ${tagTones[tone]}`}>{children}</span>
}

export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xs uppercase tracking-[0.25em] text-ink-dim">{title}</h2>
        {aside ? <span className="text-xs text-ink-dim">{aside}</span> : null}
      </div>
      {children}
    </section>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-md border border-border bg-surface-low ${className}`}>{children}</div>
}

export function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-ink-dim">{label}</span>
      <span className="font-mono text-base tabular-nums text-ink">{value}</span>
    </div>
  )
}

/** A router link dressed as a button (a button inside an anchor is not valid HTML). */
export function LinkButton({ to, variant = 'primary', children }: { to: string; variant?: 'primary' | 'secondary'; children: ReactNode }) {
  const look =
    variant === 'primary'
      ? 'bg-accent text-ink hover:bg-accent-strong'
      : 'border border-border bg-surface-high text-ink hover:border-ink-dim'
  return (
    <Link to={to} className={`inline-flex min-h-11 w-full items-center justify-center rounded-md px-4 text-base font-medium no-underline transition-colors ${look}`}>
      {children}
    </Link>
  )
}

/** Quiet inline link in brass, for header asides and "back" lines. */
export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex min-h-11 items-center text-sm text-brass underline-offset-4 hover:underline">
      {children}
    </Link>
  )
}

export interface ToggleRowProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

/** A labelled switch with its one-line explanation; the whole row is the tap target. */
export function ToggleRow({ label, description, checked, onChange, disabled = false }: ToggleRowProps) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-start gap-3 py-2 ${disabled ? 'opacity-60' : ''}`}>
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        className="mt-0.5 h-5 w-5 shrink-0 accent-brass"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base text-ink">{label}</span>
        {description ? <span className="text-sm leading-relaxed text-ink-dim">{description}</span> : null}
      </span>
    </label>
  )
}

/** Expand/collapse control for a secondary list ("Show archived (2)"). */
export function Disclosure({ open, onToggle, label, count }: { open: boolean; onToggle: () => void; label: string; count: number }) {
  return (
    <button type="button" aria-expanded={open} onClick={onToggle} className="inline-flex min-h-11 items-center self-start text-sm text-ink-dim hover:text-ink">
      {open ? `Hide ${label}` : `Show ${label}`} ({count})
    </button>
  )
}
