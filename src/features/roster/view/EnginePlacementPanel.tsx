import { useState } from 'react'
import { useEngines } from '../../../api/engines'
import { buildEnginePlacementProposal, useEnginePrisoners } from '../../../api/engineCustody'
import { useProposeCaptiveOutcome, type CaptiveCase } from '../../../api/captives'
import type { WarbandDetail } from '../../../api/warbands'
import { findItem } from '../../../rules/data/items'
import { Button, Notice } from '../../../ui'
import { EnginePlacementSheet } from './EnginePlacementSheet'

export function EnginePlacementPanel({ item, owner, captor, requiresAgreement }: {
  item: CaptiveCase; owner: WarbandDetail; captor: WarbandDetail; requiresAgreement: boolean
}) {
  const engines = useEngines(captor.warband.id), prisoners = useEnginePrisoners(captor.warband.id)
  const propose = useProposeCaptiveOutcome()
  const [open, setOpen] = useState(false), [error, setError] = useState('')
  let preview: ReturnType<typeof buildEnginePlacementProposal> | undefined
  let previewError = ''
  try { preview = buildEnginePlacementProposal({ item, owner, captor, engineId: engines.data?.[0]?.id ?? 'preview' }) }
  catch (e) { previewError = e instanceof Error ? e.message : 'The prisoner’s equipment could not be loaded.' }
  const loadError = engines.error ?? prisoners.error
  if (loadError) return <Notice tone="error" title="Could not load the engines">{loadError.message}<Button variant="ghost" onClick={() => { void engines.refetch(); void prisoners.refetch() }}>Try again</Button></Notice>
  if (engines.isPending || prisoners.isPending) return <p className="text-sm text-ink-dim">Checking the engines and their prisoners…</p>
  if (!preview) return <Notice tone="error">{previewError}</Notice>
  return <>
    <p className="text-sm text-ink-dim">The captive is imprisoned in an Engine of Chaos. Review the available places and equipment before recording the placement.</p>
    <Button variant="secondary" onClick={() => setOpen(true)}>Choose an engine</Button>
    {open ? <EnginePlacementSheet engines={(engines.data ?? []).map(engine => ({ id: engine.id, name: engine.name, state: engine.state === 'away' ? 'away' : 'present', prisoners: (prisoners.data ?? []).filter(p => p.engine_id === engine.id && p.state === 'held') }))}
      victim={{ name: item.hero_name, warbandName: owner.warband.name, large: preview.large, equipment: preview.kit.map((kit, index) => ({ id: String(index), name: (kit.itemId ? findItem(kit.itemId)?.name : undefined) ?? kit.customName ?? kit.itemId ?? 'Item', quantity: kit.quantity, notes: kit.notes })) }}
      captorName={captor.warband.name} pending={propose.isPending} error={error || propose.error?.message} requiresAgreement={requiresAgreement} onClose={() => setOpen(false)} onPropose={async engineId => {
        setError('')
        try {
          const next = buildEnginePlacementProposal({ item, owner, captor, engineId })
          await propose.mutateAsync({ caseId: item.id, owner, captor, choice: next.choice, nextOwner: next.nextOwner, nextCaptor: next.nextCaptor, message: next.message })
          setOpen(false)
        } catch (e) { setError(e instanceof Error ? e.message : 'Could not record imprisonment.') }
      }}/>: null}
  </>
}
