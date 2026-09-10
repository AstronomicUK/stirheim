import { Button, DieField } from '../../../ui'
import { rollDie } from '../../../rules/resolve/dice'
import { Card, Section } from '../../roster/view/bits'
import { towerTreasure, type TowerChest } from '../model/scenarioTreasure'
import type { StepProps } from './bits'

export function TowerRewards({ draft, update }: Pick<StepProps, 'draft' | 'update'>) {
  const chests = draft.towerChests ?? []
  const treasure = towerTreasure(chests)
  function change(index: number, fn: (chest: TowerChest) => TowerChest) {
    update(d => ({ ...d, towerChests: (d.towerChests ?? []).map((chest, i) => i === index ? fn(chest) : chest) }))
  }
  function result(index: number, value: number | null) {
    change(index, () => ({ result: value, goldDice: Array(value === null || value <= 2 ? 0 : value === 6 ? 6 : 3).fill(null) }))
  }
  return <Section title="Recovered chests">
    <p className="text-sm text-ink-dim">Add each chest your warband took off the table. Both warbands resolve their own chests; winning is not required. There is no exploration after this scenario.</p>
    {chests.map((chest, index) => <Card key={index} className="flex flex-col gap-3 px-4 py-3">
      <div className="flex items-center justify-between gap-2"><strong>Chest {index + 1}</strong><Button variant="ghost" onClick={() => update(d => ({ ...d, towerChests: d.towerChests?.filter((_, i) => i !== index) }))}>Remove</Button></div>
      <div className="flex flex-wrap items-end gap-3"><DieField label="Treasure D6" sides={6} value={chest.result} onChange={value => result(index, value)} /><Button variant="secondary" onClick={() => result(index, rollDie(6))}>Roll for me</Button></div>
      {chest.result !== null && chest.result <= 2 ? <p className="text-sm text-ink-dim">Illusions: the treasure vanishes. No gold from this chest.</p> : null}
      {chest.goldDice.length > 0 ? <><p className="text-sm">{chest.result === 6 ? 'Gold, Gold, GOLD! — 6D6 gc' : 'Valuables — 3D6 gc'}</p><div className="flex flex-wrap items-end gap-3">{chest.goldDice.map((die, i) => <DieField key={i} label={`Gold D6 ${i + 1}`} sides={6} value={die} onChange={value => change(index, c => ({ ...c, goldDice: c.goldDice.map((v, j) => i === j ? value : v) }))} />)}<Button variant="secondary" onClick={() => change(index, c => ({ ...c, goldDice: c.goldDice.map(() => rollDie(6)) }))}>Roll gold</Button></div></> : null}
    </Card>)}
    <Button variant="secondary" onClick={() => update(d => ({ ...d, towerChests: [...(d.towerChests ?? []), { result: null, goldDice: [] }] }))}>Add recovered chest</Button>
    <p className="text-sm">{chests.length === 0 ? 'No recovered chests recorded.' : `Resolved chest rewards: ${treasure.gold} gc. Each chest and its dice will appear in the battle report.`}</p>
  </Section>
}
