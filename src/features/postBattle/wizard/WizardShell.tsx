// The frame around every step: the step indicator at the top and the sticky Back / Next bar at
// the bottom, with "Continue later" and "Discard" tucked into the bar.

import type { ReactNode } from 'react'
import { Button, Notice } from '../../../ui'
import { STEP_IDS, STEP_TITLES } from '../model'

export interface StepIndicatorProps {
  step: number
  /** Steps the player may jump to directly (everything before the first incomplete one). */
  reachable: number
  onJump: (step: number) => void
}

export function StepIndicator({ step, reachable, onJump }: StepIndicatorProps) {
  return (
    <nav aria-label="Report steps" className="flex flex-col gap-1.5">
      <ol className="flex items-center gap-1.5">
        {STEP_IDS.map((id, i) => {
          const current = i === step
          const done = i < step
          const canJump = i <= reachable
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                aria-current={current ? 'step' : undefined}
                aria-label={`${i + 1}. ${STEP_TITLES[id]}`}
                disabled={!canJump}
                onClick={() => onJump(i)}
                className="flex min-h-11 w-full items-center disabled:cursor-default"
              >
                <span className={`h-1.5 w-full rounded-full transition-colors ${current ? 'bg-brass' : done ? 'bg-brass/50' : canJump ? 'bg-surface-high' : 'bg-surface-high/60'}`} />
              </button>
            </li>
          )
        })}
      </ol>
      <p className="text-xs uppercase tracking-[0.25em] text-ink-dim">
        Step {step + 1} of {STEP_IDS.length} · {STEP_TITLES[STEP_IDS[step]]}
      </p>
    </nav>
  )
}

export interface WizardBarProps {
  step: number
  /** Why Next is disabled, shown above the bar. */
  problems: string[]
  onBack: () => void
  onNext: () => void
  /** Last step: the primary action files the report instead of moving on. */
  onFile?: () => void
  filing?: boolean
  fileError?: string | null
  onContinueLater: () => void
  onDiscard: () => void
}

export function WizardBar({ step, problems, onBack, onNext, onFile, filing = false, fileError = null, onContinueLater, onDiscard }: WizardBarProps) {
  const last = step === STEP_IDS.length - 1
  const blocked = problems.length > 0
  return (
    <div className="sticky bottom-[calc(3rem+env(safe-area-inset-bottom))] z-10 -mx-5 -mb-6 mt-auto flex flex-col gap-2 border-t border-border bg-surface/95 px-5 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      {fileError ? (
        <Notice tone="error" title="The report was not filed">
          {fileError}
        </Notice>
      ) : null}
      {blocked && !fileError ? (
        <p role="status" className="text-xs text-warn">
          {problems[0]}
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onBack} disabled={step === 0 || filing}>
          Back
        </Button>
        <div className="flex flex-1 justify-center gap-3 text-xs">
          <button type="button" onClick={onContinueLater} disabled={filing} className="min-h-11 text-ink-dim underline-offset-4 hover:text-ink hover:underline">
            Continue later
          </button>
          <button type="button" onClick={onDiscard} disabled={filing} className="min-h-11 text-ink-dim underline-offset-4 hover:text-accent-strong hover:underline">
            Discard
          </button>
        </div>
        {last && onFile ? (
          <Button variant="primary" onClick={onFile} pending={filing} disabled={blocked}>
            File report
          </Button>
        ) : (
          <Button variant="primary" onClick={onNext} disabled={blocked}>
            Next
          </Button>
        )}
      </div>
    </div>
  )
}

export function StepBody({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-headline text-2xl leading-tight text-ink">{title}</h2>
      {children}
    </section>
  )
}
