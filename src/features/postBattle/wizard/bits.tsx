// Small pieces shared by the wizard steps: an on/off switch row, a D66 entry, and the step
// props every step receives. Non-component helpers live in ./names.ts.

import { useState, type ReactNode } from 'react'
import type { MatchParticipantView, MatchSummary } from '../../../api/matches'
import { rollDie } from '../../../rules/resolve/dice'
import { D66_SIDES } from '../../../rules/resolve/dice'
import { Button, DieField } from '../../../ui'
import type { DerivedReport, ReportContext, ReportDraft } from '../model'

export interface StepProps {
  draft: ReportDraft
  derived: DerivedReport
  ctx: ReportContext
  update: (edit: (draft: ReportDraft) => ReportDraft) => void
  match: MatchSummary
  mine: MatchParticipantView
  opponents: MatchParticipantView[]
  /** Set when the GM is amending a filed report: the note is required and shown in the change log. */
  amend?: { note: string; onNote: (note: string) => void }
}

export interface SwitchRowProps {
  label: string
  description?: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

/** A labelled on/off control, 44 px tall, for yes/no questions. */
export function SwitchRow({ label, description, checked, onChange, disabled = false }: SwitchRowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 w-full items-center justify-between gap-4 rounded-md border border-border bg-surface-low px-4 py-2.5 text-left disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="min-w-0">
        <span className="block text-sm text-ink">{label}</span>
        {description ? <span className="block text-xs text-ink-dim">{description}</span> : null}
      </span>
      <span
        aria-hidden
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${checked ? 'border-brass bg-brass/70' : 'border-border bg-surface-high'}`}
      >
        <span className={`inline-block h-5 w-5 rounded-full bg-ink transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </span>
    </button>
  )
}

export interface D66EntryProps {
  /** Called once with a valid 11-66 result. */
  onCommit: (d66: number) => void
  confirmLabel?: string
  disabled?: boolean
}

/** Two D6 as tens and units, confirmed explicitly, or rolled and committed in one tap. */
export function D66Entry({ onCommit, confirmLabel = 'Confirm roll', disabled = false }: D66EntryProps) {
  const [tens, setTens] = useState<number | null>(null)
  const [units, setUnits] = useState<number | null>(null)
  const [key, setKey] = useState(0)
  const ready = tens !== null && units !== null

  function commit(value: number) {
    onCommit(value)
    setTens(null)
    setUnits(null)
    setKey((k) => k + 1)
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <DieField key={`t${key}`} label="Tens" sides={6} value={tens} onChange={setTens} disabled={disabled} />
      <DieField key={`u${key}`} label="Units" sides={6} value={units} onChange={setUnits} disabled={disabled} />
      <div className="flex flex-1 flex-wrap justify-end gap-2">
        <Button variant="secondary" disabled={disabled} onClick={() => commit(rollDie(D66_SIDES))}>
          Roll for me
        </Button>
        <Button variant="primary" disabled={disabled || !ready} onClick={() => ready && commit(tens * 10 + units)}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  )
}

export function Intro({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-ink-dim">{children}</p>
}

export function Row({ label, value, dim = false }: { label: ReactNode; value: ReactNode; dim?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <span className={dim ? 'text-ink-dim' : 'text-ink'}>{label}</span>
      <span className="shrink-0 tabular-nums text-ink">{value}</span>
    </div>
  )
}
