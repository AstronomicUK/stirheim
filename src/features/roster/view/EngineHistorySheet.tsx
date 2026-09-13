import { useState } from 'react'
import { useRemoveEngineCopy, useRenameEngine, type EngineInventoryRow } from '../../../api/engines'
import { Button, Notice, Sheet, TextField } from '../../../ui'

function historyText(entry: EngineInventoryRow['history'][number]) {
  switch (entry.event) {
    case 'added': return 'Added to the warband’s inventory.'
    case 'existing_inventory': return 'Engine already in the warband’s inventory.'
    case 'renamed': return `Renamed from “${entry.from ?? 'Engine of Chaos'}” to “${entry.to ?? 'Engine of Chaos'}”.`
    case 'retired': return `Removed from the inventory.${entry.reason ? ` ${entry.reason}` : ''}`
    case 'prisoners_placed_from_exploration': return `${entry.count ?? 'Some'} exploration ${entry.count === 1 ? 'captive' : 'captives'} imprisoned.`
    case 'prisoner_placed': return `${entry.name ?? 'A prisoner'} imprisoned${entry.places ? `, using ${entry.places} ${entry.places === 1 ? 'place' : 'places'}` : ''}.`
    case 'placement_reversed': return `Prisoner placement reversed.${entry.reason ? ` ${entry.reason}` : ''}`
    default: return null
  }
}

export function EngineHistorySheet({ engine, canEdit, occupied, onClose }: { engine: EngineInventoryRow; canEdit: boolean; occupied: boolean; onClose: () => void }) {
  const [name, setName] = useState(engine.name), [removing, setRemoving] = useState(false), [reason, setReason] = useState('')
  const [original] = useState(engine)
  const rename = useRenameEngine(), remove = useRemoveEngineCopy()
  const pending = rename.isPending || remove.isPending
  const error = rename.error ?? remove.error
  const history = [...engine.history].reverse().flatMap(entry => { const text = historyText(entry); return text ? [{ ...entry, text }] : [] })
  return <Sheet open title={engine.name} description="Engine history" onClose={onClose}>
    <div className="flex flex-col gap-5">
      {canEdit ? <div className="flex flex-col gap-3">
        <TextField label="Engine name" value={name} maxLength={80} onChange={event => setName(event.target.value)} disabled={pending}/>
        <Button variant="secondary" disabled={!name.trim() || name.trim() === engine.name || pending} pending={rename.isPending} onClick={() => rename.mutate({ engine: original, name }, { onSuccess: onClose })}>Save name</Button>
      </div> : null}
      <ol className="divide-y divide-border border-y border-border">{history.map((entry, index) => <li key={`${entry.at}:${index}`} className="py-3"><p className="text-sm leading-relaxed">{entry.text}</p>{Number.isFinite(Date.parse(entry.at)) ? <time dateTime={entry.at} className="mt-1 block text-xs text-ink-dim">{new Date(entry.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time> : null}</li>)}</ol>
      {canEdit && engine.state === 'present' && !occupied ? removing ? <div className="flex flex-col gap-3">
        <p className="text-sm">Remove this empty engine from the warband? This does not add any gold.</p>
        <TextField label="Reason for removing the engine" value={reason} maxLength={2000} onChange={event => setReason(event.target.value)}/>
        <div className="flex flex-wrap gap-2"><Button variant="danger" disabled={reason.trim().length < 5 || pending} pending={remove.isPending} onClick={() => remove.mutate({ engine: original, reason }, { onSuccess: onClose })}>Remove this engine</Button><Button variant="ghost" disabled={pending} onClick={() => setRemoving(false)}>Keep engine</Button></div>
      </div> : <Button variant="ghost" onClick={() => setRemoving(true)}>Remove this empty engine</Button> : null}
      {error ? <Notice tone="error" title="Could not update the engine">{error.message}</Notice> : null}
    </div>
  </Sheet>
}
