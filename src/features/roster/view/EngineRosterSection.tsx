import { useCampaignMatches } from '../../../api/matches'
import { useEngineJourneys } from '../../../api/engineJourneys'
import { EngineDispatchSheet } from './EngineDispatchSheet'
import { EngineReturnSheet } from './EngineReturnSheet'
import { EngineJourneySheet } from './EngineJourneySheet'
import { EngineExplorationPanel } from './EngineExplorationPanel'
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
  const matches = useCampaignMatches(enabled ? campaignId : undefined, userId)
  const journeys = useEngineJourneys(enabled ? detail.warband.id : undefined)
  const [dispatchId,setDispatchId] = useState(''), [journeyId,setJourneyId] = useState(''), [returnId,setReturnId] = useState('')
  const cases = useCaptiveCases(enabled ? detail.warband.id : undefined), campaign = useCampaign(campaignId)
  const reverse = useReverseAnonymousPlacement()
  const [selected, setSelected] = useState(''), [reason, setReason] = useState('')
  const gm = Boolean(userId && campaign.data?.campaign.gm_id === userId)
  const canEdit = gm || detail.warband.owner_id === userId
  const fighting = matches.data?.some(m => m.state === 'in_progress' && m.participants.some(p => p.warband_id === detail.warband.id)) ?? false
  const betweenBattles = !campaignId || matches.isSuccess && !fighting
  if (!enabled) return null
  const error = engines.error ?? prisoners.error ?? journeys.error
  if (error) return <Notice tone="error" title="Engine records could not load">{error.message}<Button variant="ghost" onClick={() => { void engines.refetch(); void prisoners.refetch(); void journeys.refetch() }}>Try again</Button></Notice>
  if (engines.isPending || prisoners.isPending || journeys.isPending) return null
  const own = (prisoners.data ?? []).filter(p => p.holder_warband_id === detail.warband.id)
  const prisoner = own.find(p => p.id === selected)
  const engine = engines.data?.find(e => e.id === prisoner?.engine_id)
  const captive = cases.data?.find(c => c.id === prisoner?.case_id)
  const kit = prisoner ? prisonerOriginalKit(prisoner) : null
  const origin = (id: string | null) => id ? cases.data?.find(c => c.id === id)?.victim?.name ?? 'Captured from another warband' : 'Found during exploration'
  const dispatchEngine = engines.data?.find(e => e.id === dispatchId)
  const selectedJourney = journeys.data?.find(j => j.journey.id === journeyId)
  const returnJourney = journeys.data?.find(j => j.journey.id === returnId && j.journey.state === 'away')
  const pastJourneys = journeys.data?.filter(j => ['returned','cancelled'].includes(j.journey.state)) ?? []
  return <>
    {canEdit && (engines.data?.length ?? 0) > 0 && !betweenBattles ? <Notice tone={matches.error ? 'error' : 'info'}>{matches.error ? 'Battle status could not load. Refresh before arranging an Engine journey.' : fighting ? 'This warband is fighting a battle. Arrange or complete its Engine journey between battles.' : 'Checking battle status before arranging an Engine journey…'}</Notice> : null}
    <EngineFleet engines={engines.data ?? []} prisoners={own.map(p => ({ ...p, origin: origin(p.case_id) }))} canEdit={canEdit} journeys={journeys.data} onDispatch={betweenBattles ? setDispatchId : undefined} onJourney={setJourneyId} onReturn={betweenBattles ? setReturnId : undefined} onPrisoner={id => { setReason(''); setSelected(id) }}/>
    {dispatchEngine && betweenBattles ? <EngineDispatchSheet engine={dispatchEngine} prisoners={own.filter(p => !p.journey_id)} heroes={detail.roster.heroes.filter(h => !journeys.data?.some(j => ['pending','away'].includes(j.journey.state) && j.journey.escort_hero_id === h.id))} onClose={() => setDispatchId('')}/> : null}
    {selectedJourney ? <EngineJourneySheet heroes={detail.roster.heroes} status={selectedJourney} prisoners={own} engineName={engines.data?.find(e => e.id === selectedJourney.journey.engine_id)?.name ?? 'Engine of Chaos'} canEdit={canEdit && betweenBattles} gm={gm && betweenBattles} onClose={() => setJourneyId('')} onReturn={() => {setJourneyId('');setReturnId(selectedJourney.journey.id)}}/> : null}
    {returnJourney && betweenBattles ? <EngineReturnSheet status={returnJourney} roster={detail.roster} onClose={() => setReturnId('')}/> : null}
    {pastJourneys.length ? <details className="rounded-md border border-border bg-surface-low p-4"><summary className="cursor-pointer text-sm font-semibold">Past engine journeys ({pastJourneys.length})</summary><div className="mt-2 flex flex-col">{pastJourneys.map(j => <Button key={j.journey.id} variant="ghost" onClick={() => setJourneyId(j.journey.id)}>{j.journey.escort_name} · {j.journey.state === 'returned' ? 'Returned' : 'Cancelled'} · {new Date(j.journey.dispatched_at).toLocaleDateString('en-GB')}</Button>)}</div></details> : null}
    <EngineExplorationPanel warbandId={detail.warband.id} engines={engines.data ?? []} prisoners={own} canEdit={canEdit}/>
    {prisoner && engine ? <EnginePrisonerSheet prisoner={{ name: prisoner.name, origin: origin(prisoner.case_id), engineName: engine.name, large: prisoner.large, state: prisoner.state, placedAt: prisoner.placed_at,
      equipmentKnown: Boolean(kit || !prisoner.case_id), equipment: (kit ?? []).map((item, index) => ({ id: item.id ?? String(index), name: (item.item_rules_id ? findItem(item.item_rules_id)?.name : undefined) ?? item.custom_name ?? item.item_rules_id ?? 'Item', quantity: item.quantity, notes: item.notes })),
      history: prisoner.history.flatMap(entry => {
        const text = ['placed','placed_from_exploration'].includes(entry.event) ? `Imprisoned in ${engine.name}.` : entry.event === 'exploration_count' ? prisoner.snapshot.location === 'straggler' ? 'One Straggler found.' : `Prisoners found: ${entry.count}. ${entry.maximum_finds ? 'Maximum find applied.' : entry.original_roll == null ? `Tabletop D3 result ${entry.count}.` : `App rolled ${entry.original_roll}${entry.original_roll !== entry.count ? `; player changed it to ${entry.count}` : ''}.`}` : entry.event === 'placement_reversed' ? `Placement reversed.${entry.reason ? ` ${entry.reason}` : ''}` : null
        return text ? [{ at: entry.at, text }] : []
      }),
    }} onClose={() => setSelected('')}>
      {captive ? <CaptiveCaseCard embedded item={captive} detail={detail} campaign={campaign.data} canAct={canEdit} gm={gm} userId={userId}/> : prisoner.case_id && cases.error ? <Notice tone="error">The captive’s agreement could not load. {cases.error.message}</Notice> : null}
      {!prisoner.case_id && prisoner.state === 'held' && canEdit ? <div className="flex flex-col gap-3 border-t border-border pt-4">
        <p className="text-sm text-ink-dim">If this placement was recorded wrongly, reverse it to free the place.</p>
        <TextField label="Reason to reverse placement" value={reason} maxLength={2000} onChange={e => setReason(e.target.value)}/>
        <Button variant="danger" disabled={reason.trim().length < 5} pending={reverse.isPending} onClick={() => reverse.mutate({ prisonerId: prisoner.id, reason }, { onSuccess: () => setSelected('') })}>Reverse placement</Button>
        {reverse.error ? <Notice tone="error">{reverse.error.message}</Notice> : null}
      </div> : null}
    </EnginePrisonerSheet> : null}
  </>
}
