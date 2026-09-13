import { useState } from 'react'
import { useEngineExplorationSources } from '../../../api/engineExploration'
import { usePlaceAnonymousPrisoners, type EnginePrisonerRow } from '../../../api/engineCustody'
import type { EngineInventoryRow } from '../../../api/engines'
import { Button, Notice, SelectField, Sheet, Stepper, TextField } from '../../../ui'
import { Section, Card } from './bits'

export function EngineExplorationPanel({ warbandId, engines, prisoners, canEdit }: { warbandId: string; engines: EngineInventoryRow[]; prisoners: EnginePrisonerRow[]; canEdit: boolean }) {
  const sources = useEngineExplorationSources(canEdit ? warbandId : undefined), place = usePlaceAnonymousPrisoners()
  const [selected, setSelected] = useState(''), [engineId, setEngineId] = useState(''), [count, setCount] = useState(1), [names, setNames] = useState<string[]>([])
  if (!canEdit) return null
  if (sources.error) return <Notice tone="error" title="Exploration captives could not load">{sources.error.message}<Button variant="ghost" onClick={() => void sources.refetch()}>Try again</Button></Notice>
  const available = (sources.data ?? []).map(source => ({ ...source, remaining: source.count - prisoners.filter(p => p.exploration_report_id === source.id && p.state !== 'reversed').length })).filter(source => source.remaining > 0)
  const source = available.find(s => s.id === selected)
  const choices = engines.map(engine => ({ ...engine, used: prisoners.filter(p => p.engine_id === engine.id && p.state === 'held').reduce((n,p) => n + p.places, 0) }))
  const chosen = choices.find(e => e.id === engineId && e.state === 'present' && e.used + count <= 6)
  const label = (index: number) => names[index]?.trim() || `${source?.exploration.locationId === 'straggler' ? 'Straggler' : 'Prisoner'} ${index + 1}`
  if (!available.length) return null
  return <Section title="Captives found during exploration">
    {available.map(s => <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div><p className="font-semibold">{s.exploration.locationName}</p><p className="mt-1 text-sm text-ink-dim">{s.remaining} {s.remaining === 1 ? 'captive awaiting placement' : 'captives awaiting placement'} · {new Date(s.at).toLocaleDateString('en-GB')}</p></div>
      <Button variant="secondary" onClick={() => { setSelected(s.id); setCount(1); setEngineId(''); setNames([]); place.reset() }}>Place captives</Button>
    </Card>)}
    {source ? <Sheet open title="Place exploration captives" description={`${source.exploration.locationName} · ${source.remaining} awaiting placement`} onClose={() => setSelected('')}
      footer={<Button block disabled={!chosen || count < 1 || count > source.remaining} pending={place.isPending} onClick={() => { if (chosen) place.mutate({ engineId: chosen.id, reportId: source.id, prisoners: Array.from({length:count},(_,i) => ({name:label(i)})), countRoll: source.exploration.locationId === 'prisoners' ? source.count : null }, { onSuccess: () => setSelected('') }) }}>Record placement</Button>}>
      <div className="flex flex-col gap-4 pt-3">
        <p className="text-sm text-ink-dim">The number found is saved in the battle report. Each captive uses one place. You can divide them between available engines.</p>
        {source.remaining > 1 ? <Stepper label="Captives to place in this engine" value={count} min={1} max={source.remaining} onChange={setCount}/> : null}
        <SelectField label="Engine" value={engineId} onChange={e => setEngineId(e.target.value)} disabled={place.isPending}>
          <option value="">Choose an engine</option>{choices.map(e => <option key={e.id} value={e.id} disabled={e.state !== 'present' || e.used + count > 6}>{e.name} — {e.state === 'away' ? 'away' : `${6-e.used} places free`}</option>)}
        </SelectField>
        {chosen ? <p className="rounded-md border border-border bg-surface p-3 text-sm">After placement: <strong>{chosen.used+count} of 6 places occupied</strong>.</p> : null}
        {Array.from({length:count},(_,i) => <TextField key={i} label={`Captive ${i+1} name (optional)`} value={names[i] ?? ''} maxLength={80} placeholder={label(i)} onChange={e => setNames(old => Array.from({length:count},(_,j) => j===i?e.target.value:old[j]??''))}/>)}
        {place.error ? <Notice tone="error">{place.error.message}</Notice> : null}
      </div>
    </Sheet> : null}
  </Section>
}
