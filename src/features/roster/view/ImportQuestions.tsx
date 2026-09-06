// What the import could not decide, asked once when the roster is opened: a written-in item the
// catalogue can now name, a skill or spell that never matched, a hired sword the warband's own list
// carries as a unit, a henchman group with no type. One tap answers each; the answer is saved as a
// logged edit. "Not now" closes it, "Stop asking" remembers the skip on this device.

import { useMemo, useState } from 'react'
import { useUpdateRoster, type WarbandDetail } from '../../../api/warbands'
import { Button, Notice, Sheet } from '../../../ui'
import { describeQuestions, importQuestions, type ImportQuestion, type ImportQuestionOption } from '../../importer/questions'
import { Card, Section } from './bits'

const KEY = (warbandId: string) => `stirheim.import-questions.${warbandId}`

function readSkipped(warbandId: string): string[] {
  try {
    const raw = localStorage.getItem(KEY(warbandId))
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function writeSkipped(warbandId: string, ids: string[]): void {
  try {
    localStorage.setItem(KEY(warbandId), JSON.stringify(ids))
  } catch {
    // A private window: the questions come back next time, which is no worse than asking again.
  }
}

export function ImportQuestions({ detail, canEdit }: { detail: WarbandDetail; canEdit: boolean }) {
  const update = useUpdateRoster(detail.warband.id)
  const [skipped, setSkipped] = useState<string[]>(() => readSkipped(detail.warband.id))
  const [error, setError] = useState<string | null>(null)
  const all = useMemo(
    () => importQuestions({ warbandId: detail.warband.id, typeRulesId: detail.warband.type_rules_id, heroes: detail.heroes, groups: detail.groups, items: detail.items }),
    [detail],
  )
  const open = useMemo(() => all.filter((q) => !skipped.includes(q.id)), [all, skipped])
  // Asked on the first open of a roster that has questions; closing does not lose them.
  const [showing, setShowing] = useState(true)

  if (!canEdit || open.length === 0) return null

  async function answer(question: ImportQuestion, option: ImportQuestionOption) {
    setError(null)
    if (option.changes.length === 0) {
      setSkipped((s) => {
        const next = [...s, question.id]
        writeSkipped(detail.warband.id, next)
        return next
      })
      return
    }
    try {
      await update.mutateAsync({ reason: 'import_fixup', changes: option.changes })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That answer could not be saved.')
    }
  }

  function stopAsking() {
    const next = all.map((q) => q.id)
    writeSkipped(detail.warband.id, next)
    setSkipped(next)
    setShowing(false)
  }

  if (!showing) {
    return (
      <Section title="From the import">
        <Card className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-ink-dim">{describeQuestions(open)} still to answer.</p>
          <Button variant="secondary" onClick={() => setShowing(true)}>
            Answer them
          </Button>
        </Card>
      </Section>
    )
  }

  return (
    <Sheet
      open
      onClose={() => setShowing(false)}
      title="Questions from the import"
      description={`${describeQuestions(open)} for ${detail.warband.name}. Nothing changes until you choose.`}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setShowing(false)}>
            Not now
          </Button>
          <Button variant="ghost" className="flex-1" onClick={stopAsking}>
            Stop asking
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        {error ? <Notice tone="error">{error}</Notice> : null}
        {open.map((question) => (
          <section key={question.id} className="flex flex-col gap-2 rounded-md border border-border bg-surface-low px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <p className="text-base text-ink">{question.title}</p>
              <p className="text-sm leading-relaxed text-ink-dim">{question.detail}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {question.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={update.isPending}
                  onClick={() => void answer(question, option)}
                  className="flex flex-col gap-0.5 rounded-md border border-border bg-surface px-3 py-2 text-left hover:border-ink-dim disabled:opacity-60"
                >
                  <span className="text-sm text-ink">{option.label}</span>
                  {option.hint ? <span className="text-xs leading-relaxed text-ink-dim">{option.hint}</span> : null}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Sheet>
  )
}
