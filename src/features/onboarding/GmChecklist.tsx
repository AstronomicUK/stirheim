// The GM's first-steps card on a campaign dashboard. Dismissal is remembered per campaign in
// localStorage (stirheim.gmChecklist.<id>); once dismissed it folds to a single line with a way back.

import { useState } from 'react'
import { Link } from 'react-router'
import { Card, Section } from '../campaign/bits'
import { gmChecklistSteps, isGmChecklistDismissed, setGmChecklistDismissed, type GmChecklistStep } from './checklist'

export interface GmChecklistProps {
  campaignId: string
  memberCount: number
  matchCount: number
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function GmChecklist({ campaignId, memberCount, matchCount }: GmChecklistProps) {
  const [dismissed, setDismissed] = useState(() => isGmChecklistDismissed(storage(), campaignId))
  const steps = gmChecklistSteps({ campaignId, memberCount, matchCount })

  function toggle(next: boolean) {
    setGmChecklistDismissed(storage(), campaignId, next)
    setDismissed(next)
  }

  if (dismissed) {
    return (
      <div className="flex items-center justify-between gap-3 text-sm text-ink-dim">
        <span>GM checklist hidden.</span>
        <button type="button" onClick={() => toggle(false)} className="inline-flex min-h-11 items-center text-brass underline-offset-4 hover:underline">
          Show it
        </button>
      </div>
    )
  }

  return (
    <Section
      title="GM checklist"
      aside={
        <button type="button" onClick={() => toggle(true)} className="inline-flex min-h-11 items-center text-brass underline-offset-4 hover:underline">
          Dismiss
        </button>
      }
    >
      <Card className="px-4 py-3">
        <ol className="flex flex-col divide-y divide-border">
          {steps.map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </ol>
      </Card>
    </Section>
  )
}

function StepRow({ step }: { step: GmChecklistStep }) {
  const done = step.done === true
  const mark = (
    <span
      aria-hidden
      className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
        done ? 'border-ok/70 bg-ok/20 text-ok' : 'border-border text-transparent'
      }`}
    >
      ✓
    </span>
  )
  const text = <span className={`text-sm leading-relaxed ${done ? 'text-ink-dim line-through decoration-ink-dim/60' : 'text-ink'}`}>{step.label}</span>
  const status = done ? <span className="sr-only">Done.</span> : null

  if (step.to) {
    return (
      <li>
        <Link to={step.to} className="flex min-h-11 items-start gap-3 py-2 no-underline hover:text-brass">
          {mark}
          <span className="flex min-w-0 flex-1 items-start justify-between gap-3">
            <span>
              {text}
              {status}
            </span>
            <span aria-hidden className="shrink-0 text-ink-dim">
              ›
            </span>
          </span>
        </Link>
      </li>
    )
  }
  return (
    <li className="flex min-h-11 items-start gap-3 py-2">
      {mark}
      <span>
        {text}
        {status}
      </span>
    </li>
  )
}
