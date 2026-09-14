import { useState } from 'react'
import { useUpdateRoster, type WarbandDetail } from '../../../api/warbands'
import type { MarauderTribe } from '../../../rules/types/roster'
import { MARAUDER_TRIBES } from '../../../rules/resolve/marauderTribe'
import { Button, Notice, SelectField, TextField } from '../../../ui'

export function MarauderTribePicker({ value, onChange, disabled = false }: { value?: MarauderTribe; onChange: (tribe: MarauderTribe) => void; disabled?: boolean }) {
  return <div className="flex flex-col gap-2">
    <SelectField label="Marauder tribe" value={value ?? ''} disabled={disabled} onChange={event => { const choice = MARAUDER_TRIBES.find(t => t.id === event.target.value); if (choice) onChange(choice.id) }}>
      <option value="" disabled>Choose the warband’s tribe</option>
      {MARAUDER_TRIBES.map(tribe => <option key={tribe.id} value={tribe.id}>{tribe.name}</option>)}
    </SelectField>
    {value ? <p className="text-sm text-ink-dim">{MARAUDER_TRIBES.find(t => t.id === value)?.text}</p> : <p className="text-sm text-ink-dim">This choice applies to the whole warband, including future leaders.</p>}
  </div>
}
export function MarauderTribeCard({ detail, canEdit }: { detail: WarbandDetail; canEdit: boolean }) {
  const update = useUpdateRoster(detail.warband.id)
  const [choice, setChoice] = useState<MarauderTribe | undefined>()
  const [reason, setReason] = useState('')
  if (detail.roster.warbandTemplateId !== 'marauders_of_chaos') return null
  const saved = detail.roster.marauderTribe
  const value = choice ?? saved
  const changed = value && value !== saved
  return <Notice title="Marauder tribe" tone={saved ? 'info' : 'warn'}>
    <div className="flex flex-col gap-3">
      <MarauderTribePicker value={value} onChange={setChoice} disabled={!canEdit || update.isPending} />
      {changed && saved ? <TextField label="Reason for correcting the tribe" value={reason} onChange={event => setReason(event.target.value)} /> : null}
      {canEdit && changed ? <Button pending={update.isPending} disabled={Boolean(saved && !reason.trim())} onClick={() => update.mutate({ reason: saved ? `Corrected Marauder tribe from ${saved} to ${value}: ${reason.trim()}` : `Recorded Marauder tribe: ${value}`, changes: [{ table: 'warbands', op: 'update', id: detail.warband.id, data: { marauder_tribe: value } }] })}>Save tribe</Button> : null}
      {update.error ? <p className="text-sm">{update.error.message}</p> : null}
    </div>
  </Notice>
}
