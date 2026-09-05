import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useDeleteTemplate, useMyTemplates, type SavedTemplate } from '../../api/templates'
import { draftFromTemplate } from '../../rules/resolve/warbandTemplates'
import { Button, Notice, Sheet, TextField } from '../../ui'
import { newDraftId, useDraftStore } from './builder/draftStore'
import { warbandTypeName } from './shared/names'
import { Section } from './view/bits'

/** The player's saved templates on the new-warband screen: pick one, name the warband, start shopping. */
export function SavedTemplates() {
  const templates = useMyTemplates()
  const [picked, setPicked] = useState<SavedTemplate | null>(null)
  if (templates.isPending || templates.isError || !templates.data || templates.data.length === 0) return null
  return (
    <>
      <Section title="Your templates" aside={`${templates.data.length}`}>
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface-low">
          {templates.data.map((t) => (
            <li key={t.id}>
              <button type="button" onClick={() => setPicked(t)} className="flex min-h-11 w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-surface-high">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium text-ink">{t.name}</span>
                  <span className="text-sm text-ink-dim">
                    {warbandTypeName(t.type_rules_id)} · {t.payload.heroes.length} heroes, {t.payload.henchman_groups.reduce((n, g) => n + g.size, 0)} henchmen
                  </span>
                </span>
                <span className="shrink-0 text-xs text-ink-dim">{new Date(t.created_at).toLocaleDateString()}</span>
              </button>
            </li>
          ))}
        </ul>
      </Section>
      {picked ? <StartFromTemplate key={picked.id} template={picked} onClose={() => setPicked(null)} /> : null}
    </>
  )
}

function StartFromTemplate({ template, onClose }: { template: SavedTemplate; onClose: () => void }) {
  const navigate = useNavigate()
  const draft = useDraftStore((s) => s.draft)
  const load = useDraftStore((s) => s.load)
  const remove = useDeleteTemplate()
  const [name, setName] = useState('')
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const trimmed = name.trim()

  function begin() {
    try {
      const result = draftFromTemplate(template.type_rules_id, template.payload, trimmed, newDraftId)
      load(result.draft)
      navigate(`/warbands/new/${template.type_rules_id}`, { state: { skipped: result.skipped } })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start from this template.')
    }
  }

  function onStart() {
    if (!trimmed) return
    if (draft && !confirmReplace) return setConfirmReplace(true)
    begin()
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={template.name}
      description={`${warbandTypeName(template.type_rules_id)} · saved ${new Date(template.created_at).toLocaleDateString()}`}
      footer={
        <div className="flex flex-col gap-3">
          {confirmReplace && draft ? (
            <>
              <Notice tone="warn" title="Replace your unfinished draft?">
                Starting here discards {draft.name.trim() || 'the unnamed warband'} ({warbandTypeName(draft.warbandTemplateId)}).
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
            <Button block disabled={!trimmed} onClick={onStart}>
              Start from this template
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <TextField label="Warband name" value={name} maxLength={80} autoComplete="off" placeholder="Give the new warband a name" onChange={(e) => setName(e.target.value)} />
        <ul className="flex flex-col gap-1 text-sm text-ink-dim">
          {template.payload.heroes.map((h, i) => (
            <li key={`h-${i}`}>
              <span className="text-ink">{h.name}</span> · {h.equipment.length} kit {h.equipment.length === 1 ? 'line' : 'lines'}
            </li>
          ))}
          {template.payload.henchman_groups.map((g, i) => (
            <li key={`g-${i}`}>
              <span className="text-ink">{g.name}</span> · {g.size} {g.size === 1 ? 'model' : 'models'}
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-dim">Prices come from the rules data today, so the total may differ from the original warband. Experience, injuries and gold are not copied.</p>
        {error ? <Notice tone="error">{error}</Notice> : null}
        <Button
          variant="ghost"
          className="self-start px-0 text-accent"
          pending={remove.isPending}
          onClick={async () => {
            await remove.mutateAsync(template.id)
            onClose()
          }}
        >
          Delete this template
        </Button>
      </div>
    </Sheet>
  )
}
