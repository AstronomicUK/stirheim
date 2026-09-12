import { useId, useState } from 'react'
import { enginePrisonLoad, type EnginePrisoner } from '../../../rules/resolve/engineOfChaos'
import { Button, Notice, Sheet } from '../../../ui'

export interface EnginePlacementOption {
  id: string
  name: string
  state: 'present' | 'away'
  prisoners: EnginePrisoner[]
}
export interface EnginePlacementVictim {
  name: string
  warbandName: string
  large: boolean
  equipment: { id: string; name: string; quantity: number; notes?: string }[]
}

/** Consent preview only: the caller must use the atomic, capacity-checked proposal API. */
export function EnginePlacementSheet({ engines, victim, captorName, pending, error, requiresAgreement = true, onClose, onPropose }: {
  engines: EnginePlacementOption[]
  victim: EnginePlacementVictim
  captorName: string
  pending: boolean
  error?: string
  requiresAgreement?: boolean
  onClose: () => void
  onPropose: (engineId: string) => void
}) {
  const [picked, setPicked] = useState('')
  const radioName = useId()
  const needed = victim.large ? 2 : 1
  const options = engines.map(engine => ({ ...engine, load: enginePrisonLoad(engine.prisoners) }))
  const selected = options.find(engine => engine.id === picked && engine.state === 'present' && engine.load.free >= needed && !engine.load.overCapacity)
  return <Sheet open title={`Imprison ${victim.name}`} description={`${victim.warbandName} · ${needed === 2 ? 'Large captive · two places' : 'one place'}`} onClose={onClose}
    footer={<Button block pending={pending} disabled={!selected} onClick={() => { if (selected) onPropose(selected.id) }}>{requiresAgreement ? 'Propose imprisonment' : 'Record imprisonment'}</Button>}>
    <div className="flex flex-col gap-5">
      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">Choose an engine</legend>
        {options.map(engine => {
          const disabled = pending || engine.state === 'away' || engine.load.free < needed || engine.load.overCapacity
          const chosen = selected?.id === engine.id
          return <label key={engine.id} className={`flex min-h-20 items-center gap-3 rounded-lg border px-3 py-3 transition-colors ${chosen ? 'border-brass bg-brass/10 ring-1 ring-brass/30' : 'border-border bg-surface'} ${disabled ? 'cursor-default opacity-60' : 'cursor-pointer'}`}>
            <input type="radio" name={radioName} value={engine.id} checked={chosen} disabled={disabled} onChange={() => setPicked(engine.id)} className="h-4 w-4 shrink-0 accent-[#8b713e]"/>
            <span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold">{engine.name}</span><span className="mt-1 block text-xs text-ink-dim">{engine.state === 'away' ? 'Away with its escort' : engine.load.overCapacity ? 'Custody record needs review' : engine.load.free < needed ? `${engine.load.free} ${engine.load.free === 1 ? 'place' : 'places'} free — needs ${needed}` : `${engine.load.free} ${engine.load.free === 1 ? 'place' : 'places'} free`}</span></span>
            <span className="text-right text-xs text-ink-dim"><strong className="block text-lg font-medium text-ink">{engine.load.used}<span className="text-xs text-ink-dim"> / 6</span></strong>occupied</span>
          </label>
        })}
        {!options.length ? <p className="text-sm text-ink-dim">This warband has no Engine of Chaos in its inventory.</p> : null}
      </fieldset>
      {selected ? <div className="rounded-lg border border-border bg-surface px-4 py-3"><p className="text-xs text-ink-dim">After this placement</p><p className="mt-1 text-sm"><strong>{selected.name}</strong>: {selected.load.used + needed} of 6 places occupied.</p></div> : null}
      <section>
        <h3 className="text-sm font-semibold">Equipment to be confiscated</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-dim">This equipment moves to {captorName}’s stash {requiresAgreement ? 'when the proposal is accepted' : 'when this placement is recorded'}.</p>
        {victim.equipment.length ? <ul className="mt-3 divide-y divide-border border-y border-border">{victim.equipment.map(item => <li key={item.id} className="py-2 text-sm"><span>{item.quantity > 1 ? `${item.quantity} × ` : ''}{item.name}</span>{item.notes ? <p className="mt-1 whitespace-pre-wrap break-words text-xs text-ink-dim">{item.notes}</p> : null}</li>)}</ul> : <p className="mt-2 text-sm text-ink-dim">No equipment to transfer.</p>}
      </section>
      <Notice tone="info">{victim.name} remains a captive. This does not release, sell or permanently remove them. {requiresAgreement ? 'The other player reviews this proposal before it takes effect.' : 'Recording this placement transfers the listed equipment immediately.'}</Notice>
      {error ? <Notice tone="error" title="Could not propose imprisonment">{error}</Notice> : null}
    </div>
  </Sheet>
}
