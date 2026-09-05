import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { WARBAND_TEMPLATES } from '../../rules/data/warbandTemplates'
import type { UnitTemplate, WarbandTemplate } from '../../rules/types'
import { Button, Notice, PageHeader, SegmentedControl, Sheet, TextField } from '../../ui'
import { useDraftStore } from './builder/draftStore'
import { compositionSummary, filterTemplates, gradeLabel, gradesPresent, type GradeFilter } from './builder/helpers'
import { SavedTemplates } from './SavedTemplates'
import { warbandTypeName } from './shared/names'

const GRADE_OPTIONS: { value: GradeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...gradesPresent(WARBAND_TEMPLATES).map((grade) => ({ value: grade, label: gradeLabel(grade) })),
]

export function NewWarbandPage() {
  const [query, setQuery] = useState('')
  const [grade, setGrade] = useState<GradeFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const results = useMemo(() => filterTemplates(WARBAND_TEMPLATES, query, grade), [query, grade])
  const selected = selectedId ? WARBAND_TEMPLATES.find((t) => t.id === selectedId) : undefined

  return (
    <>
      <PageHeader eyebrow="New warband" title="Choose a warband" description="Search the published lists, then name your warband and start spending." />

      <SavedTemplates />

      <div className="flex flex-col gap-3">
        <TextField
          label="Search"
          type="search"
          placeholder="Name, race or setting"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <SegmentedControl options={GRADE_OPTIONS} value={grade} onChange={setGrade} label="Filter by source" />
        <p className="text-xs text-ink-dim" aria-live="polite">
          {results.length} of {WARBAND_TEMPLATES.length} warbands
        </p>
      </div>

      {results.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-dim">Nothing matches. Try a shorter search.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
          {results.map((template) => (
            <li key={template.id}>
              <button
                type="button"
                onClick={() => setSelectedId(template.id)}
                className="flex min-h-11 w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-surface-high"
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium text-ink">{template.name}</span>
                  <span className="text-sm text-ink-dim">
                    {template.race} · {template.originalSetting}
                  </span>
                  <span className="text-xs tabular-nums text-ink-dim">{compositionSummary(template)}</span>
                </span>
                <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-ink-dim">
                  {gradeLabel(template.grade)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected ? <TemplateSheet key={selected.id} template={selected} onClose={() => setSelectedId(null)} /> : null}
    </>
  )
}

function TemplateSheet({ template, onClose }: { template: WarbandTemplate; onClose: () => void }) {
  const navigate = useNavigate()
  const draft = useDraftStore((s) => s.draft)
  const start = useDraftStore((s) => s.start)
  const [name, setName] = useState('')
  const [confirmReplace, setConfirmReplace] = useState(false)

  const trimmed = name.trim()
  const sameTemplateDraft = draft && draft.warbandTemplateId === template.id ? draft : null
  const otherDraft = draft && draft.warbandTemplateId !== template.id ? draft : null

  function begin() {
    start(template, trimmed)
    navigate(`/warbands/new/${template.id}`)
  }

  function onStart() {
    if (!trimmed) return
    if (draft && !confirmReplace) return setConfirmReplace(true)
    begin()
  }

  const draftLabel = (d: { name: string; warbandTemplateId: string }) => `${d.name.trim() || 'Unnamed warband'} (${warbandTypeName(d.warbandTemplateId)})`

  return (
    <Sheet
      open
      onClose={onClose}
      title={template.name}
      description={`${template.race} · ${template.originalSetting} · ${gradeLabel(template.grade)}`}
      footer={
        <div className="flex flex-col gap-3">
          {confirmReplace && draft ? (
            <>
              <Notice tone="warn" title="Replace your unfinished draft?">
                {otherDraft ? `Starting here discards ${draftLabel(otherDraft)}.` : `Starting again discards ${draftLabel(draft)}.`}
              </Notice>
              <div className="flex gap-3">
                <Button variant="danger" className="flex-1" onClick={begin}>
                  Replace and start
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setConfirmReplace(false)}>
                  Keep it
                </Button>
              </div>
            </>
          ) : (
            <>
              {sameTemplateDraft ? (
                <Button variant="secondary" block onClick={() => navigate(`/warbands/new/${template.id}`)}>
                  Continue {draftLabel(sameTemplateDraft)}
                </Button>
              ) : null}
              <Button block disabled={!trimmed} onClick={onStart}>
                {sameTemplateDraft ? 'Start a new one' : 'Start building'}
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-5 pb-2">
        <p className="text-sm tabular-nums text-ink-dim">{compositionSummary(template)}</p>

        <TextField
          label="Warband name"
          autoComplete="off"
          maxLength={80}
          placeholder="The Reikland Regulars"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onStart()
          }}
          hint="You can rename it while building."
        />

        {template.specialRules.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h3 className="text-xs uppercase tracking-wider text-ink-dim">Special rules</h3>
            <ul className="flex flex-wrap gap-1.5">
              {template.specialRules.map((rule) => (
                <li key={rule.name} className="rounded-full border border-border px-2.5 py-1 text-xs text-ink">
                  {rule.name}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <UnitList title="Heroes" units={template.heroTemplates} />
        <UnitList title="Henchmen" units={template.henchmanTemplates} />
      </div>
    </Sheet>
  )
}

function UnitList({ title, units }: { title: string; units: UnitTemplate[] }) {
  if (units.length === 0) return null
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs uppercase tracking-wider text-ink-dim">{title}</h3>
      <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
        {units.map((unit) => (
          <li key={unit.id} className="flex items-baseline justify-between gap-3 px-3 py-2">
            <span className="flex min-w-0 flex-col">
              <span className="text-sm text-ink">{unit.name}</span>
              <span className="text-xs text-ink-dim">Limit {unit.rosterLimit}</span>
            </span>
            <span className="shrink-0 text-sm tabular-nums text-ink-dim">{unit.cost === null ? 'no hire cost' : `${unit.cost} gc`}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
