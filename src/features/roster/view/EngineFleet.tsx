import type { EngineJourneyStatus } from '../../../api/engineJourneys'
import { useState } from 'react'
import type { EngineInventoryRow } from '../../../api/engines'
import { EnginePrisonCard } from './EnginePrisonCard'
import { EngineHistorySheet } from './EngineHistorySheet'
import { Section } from './bits'

export interface FleetPrisoner { id: string; engine_id: string; name: string; large: boolean; state: string; origin: string }

/** Uses authoritative custody rows; each physical engine keeps its own occupancy. */
export function EngineFleet({ engines, prisoners, canEdit, onPrisoner, journeys = [], onDispatch, onJourney, onReturn }: {
  journeys?: EngineJourneyStatus[]
  onDispatch?: (engineId:string) => void
  onJourney?: (journeyId:string) => void
  onReturn?: (journeyId:string) => void
  engines: EngineInventoryRow[]
  prisoners: FleetPrisoner[]
  canEdit: boolean
  onPrisoner: (id: string) => void
}) {
  const [historyId, setHistoryId] = useState<string | null>(null)
  const historyEngine = engines.find(engine => engine.id === historyId)
  const held = prisoners.filter(prisoner => prisoner.state === 'held')
  if (!engines.length) return null
  return <Section title="Engines of Chaos">
    <div className="grid items-start gap-4 lg:grid-cols-2">{engines.filter(engine => engine.state !== 'retired').map((engine, index) => {
      const journey = journeys.find(s => s.journey.engine_id === engine.id && ['pending','away'].includes(s.journey.state))
      return <div key={engine.id}><EnginePrisonCard key={engine.id}
      engine={{ id: engine.id, name: engine.name, number: index + 1, journey: journey?.journey.state === 'away' ? {escortName:journey.journey.escort_name,captiveCount:journey.journey.captive_count,rewardLabel:journey.journey.plan.label ?? 'Hashut’s Reward',readyToReturn:journey.ready_to_return,missedBattleName:journey.missed_match_label ?? undefined} : undefined, state: engine.state === 'away' ? 'away' : 'present', prisoners: held.filter(prisoner => prisoner.engine_id === engine.id) }}
      onPrisoner={onPrisoner} onHistory={() => setHistoryId(engine.id)} onDispatch={canEdit && onDispatch && !journey ? () => onDispatch(engine.id) : undefined} onJourney={journey && onJourney ? () => onJourney(journey.journey.id) : undefined} onReturn={canEdit && journey && onReturn ? () => onReturn(journey.journey.id) : undefined}/>
      {journey?.journey.state === 'pending' ? <button type="button" className="mt-2 min-h-11 w-full rounded-md border border-brass/40 bg-brass/5 px-3 py-2 text-sm text-brass" onClick={() => onJourney?.(journey.journey.id)}>Journey awaiting agreements · View</button> : null}</div>})}</div>
    {historyEngine ? <EngineHistorySheet key={historyEngine.id} engine={historyEngine} occupied={held.some(prisoner => prisoner.engine_id === historyEngine.id)} canEdit={canEdit} onClose={() => setHistoryId(null)}/> : null}
  </Section>
}
