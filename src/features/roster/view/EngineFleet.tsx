import { useState } from 'react'
import type { EngineInventoryRow } from '../../../api/engines'
import { EnginePrisonCard } from './EnginePrisonCard'
import { EngineHistorySheet } from './EngineHistorySheet'
import { Section } from './bits'

export interface FleetPrisoner { id: string; engine_id: string; name: string; large: boolean; state: string; origin: string }

/** Uses authoritative custody rows; each physical engine keeps its own occupancy. */
export function EngineFleet({ engines, prisoners, canEdit, onPrisoner }: {
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
    <div className="grid items-start gap-4 lg:grid-cols-2">{engines.filter(engine => engine.state !== 'retired').map((engine, index) => <EnginePrisonCard key={engine.id}
      engine={{ id: engine.id, name: engine.name, number: index + 1, state: engine.state === 'away' ? 'away' : 'present', prisoners: held.filter(prisoner => prisoner.engine_id === engine.id) }}
      onPrisoner={onPrisoner} onHistory={() => setHistoryId(engine.id)}/>)}</div>
    {historyEngine ? <EngineHistorySheet key={historyEngine.id} engine={historyEngine} occupied={held.some(prisoner => prisoner.engine_id === historyEngine.id)} canEdit={canEdit} onClose={() => setHistoryId(null)}/> : null}
  </Section>
}
