import { useState } from 'react'
import { useEngines } from '../../../api/engines'
import { prisonerOriginalKit, useEnginePrisoners, useReverseAnonymousPlacement } from '../../../api/engineCustody'
import { useCaptiveCases } from '../../../api/captives'
import { useCampaign } from '../../../api/campaigns'
import type { WarbandDetail } from '../../../api/warbands'
import { findItem } from '../../../rules/data/items'
import { Button, Notice, TextField } from '../../../ui'
import { CaptiveCaseCard } from './CaptiveCard'
import { EngineFleet } from './EngineFleet'
import { EnginePrisonerSheet } from './EnginePrisonerSheet'

export function EngineRosterSection({ detail, campaignId, userId }: { detail: WarbandDetail; campaignId?: string; userId?: string }) {
  const enabled = detail.roster.warbandTemplateId === 'black_dwarfs'
  const engines = useEngines(enabled ? detail.warband.id : undefined), prisoners = useEnginePrisoners(enabled ? detail.warband.id : undefined)
  const cases = useCaptiveCases(enabled ? detail.warband.id : undefined), campaign = useCampaign(campaignId)
  const reverse = useReverseAnonymousPlacement()
  const [selected, setSelected] = useState(''), [reason, setReason] = useState('')
  const gm = Boolean(userId && campaign.data?.campaign.gm_id === userId)
  const canEdit = gm || detail.warband.owner_id === userId
  if (!enabled) return null
  const error = engines.error ?? prisoners.error
  if (error) return <Notice tone="error" title="Engine records could not load">{error.message}<Button variant="ghost" onClick={() => { void engines.refetch(); void prisoners.refetch() }}>Try again</Button></Notice>
  if (engines.isPending || prisoners.isPending) return null
  const own = (prisoners.data ?? []).filter(p => p.holder_warband_id === detail.warband.id)
  const prisoner = own.find(p => p.id === selected)
  const engine = engines.data?.find(e => e.id === prisoner?.engine_id)
  const captive = cases.data?.find(c => c.id === prisoner?.case_id)
  const kit = prisoner ? prisonerOriginalKit(prisoner) : null
  const origin = (id: string | null) => id ? cases.data?.find(c => c.id === id)?.victim?.name ?? 'Captured from another warband' : 'Found during exploration'
  return <>
    <EngineFleet engines={engines.data ?? []} prisoners={own.map(p => ({ ...p, origin: origin(p.case_id) }))} canEdit={canEdit} onPrisoner={id => { setReason(''); setSelected(id) }}/>
    {prisoner && engine ? <EnginePrisonerSheet prisoner={{ name: prisoner.name, origin: origin(prisoner.case_id), engineName: engine.name, large: prisoner.large, state: prisoner.state, placedAt: prisoner.placed_at,
      equipmentKnown: Boolean(kit || !prisoner.case_id), equipment: (kit ?? []).map((item, index) => ({ id: item.id ?? String(index), name: (item.item_rules_id ? findItem(item.item_rules_id)?.name : undefined) ?? item.custom_name ?? item.item_rules_id ?? 'Item', quantity: item.quantity, notes: item.notes })),
      history: prisoner.history.flatMap(entry => {
        const text = entry.event === 'placed' ? `Imprisoned in ${engine.name}.` : entry.event === 'placement_reversed' ? `Placement reversed.${entry.reason ? ` ${entry.reason}` : ''}` : null
        return text ? [{ at: entry.at, text }] : []
      }),
    }} onClose={() => setSelected('')}>
      {captive ? <CaptiveCaseCard item={captive} detail={detail} campaign={campaign.data} canAct={canEdit} gm={gm} userId={userId}/> : prisoner.case_id && cases.error ? <Notice tone="error">The captive’s agreement could not load. {cases.error.message}</Notice> : null}
      {!prisoner.case_id && prisoner.state === 'held' && canEdit ? <div className="flex flex-col gap-3 border-t border-border pt-4">
        <p className="text-sm text-ink-dim">If this placement was recorded wrongly, reverse it to free the place.</p>
        <TextField label="Reason to reverse placement" value={reason} maxLength={2000} onChange={e => setReason(e.target.value)}/>
        <Button variant="danger" disabled={reason.trim().length < 5} pending={reverse.isPending} onClick={() => reverse.mutate({ prisonerId: prisoner.id, reason }, { onSuccess: () => setSelected('') })}>Reverse placement</Button>
        {reverse.error ? <Notice tone="error">{reverse.error.message}</Notice> : null}
      </div> : null}
    </EnginePrisonerSheet> : null}
  </>
}
