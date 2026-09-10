import { Button, DieField, SelectField, TextField } from '../../../ui'
import { Card } from '../../roster/view/bits'
import { BRIGAND_OUTLAWS, type BrigandsDraft } from '../model/brigandsRewards'
export function BrigandsRewards({ state, won, campaign, change }: { state: BrigandsDraft; won: boolean; campaign: boolean; change: (value: BrigandsDraft) => void }) {
  return <Card className="flex flex-col gap-3 px-4 py-3">
    <p className="text-sm">Only the winner receives the scenario reward. Borrowed battle-only hirelings and equipment are not added permanently.</p>
    {won && state.role === 'attacker' ? <>
      {(state.henchmen ?? []).map((v, i) => <div key={i} className="flex items-end gap-2"><DieField label={`Henchman bounty ${i + 1} D6`} sides={6} rollable value={v} onChange={v => change({ ...state, henchmen: state.henchmen!.map((d, j) => i === j ? v : d) })} /><Button variant="secondary" onClick={() => change({ ...state, henchmen: state.henchmen!.filter((_, j) => i !== j) })}>Remove</Button></div>)}
      <Button variant="secondary" onClick={() => change({ ...state, henchmen: [...(state.henchmen ?? []), null] })}>Add enemy henchman taken out</Button>
      {(state.heroes ?? []).map((h, i) => {
        const edit = (patch: Partial<typeof h>) => change({ ...state, heroes: state.heroes!.map((h, j) => i === j ? { ...h, ...patch } : h) })
        return <div key={i} className="flex flex-col gap-2 border-t border-border pt-3">
          <TextField label={`Enemy Hero ${i + 1} name`} value={h.name} onChange={e => edit({ name: e.target.value })} />
          <DieField label={`Hero ${i + 1} bounty D6 × 5`} sides={6} rollable value={h.die} onChange={die => edit({ die })} />
          {campaign ? <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={h.captured ?? false} onChange={e => edit({ captured: e.target.checked, captureDie: null })} />This Hero actually rolled Captured on the injury chart</label> : null}
          {h.captured && campaign ? <DieField label={`Hero ${i + 1} Captured bonus D6 × 10`} sides={6} rollable value={h.captureDie ?? null} onChange={captureDie => edit({ captureDie })} /> : null}
          <Button variant="secondary" onClick={() => change({ ...state, heroes: state.heroes!.filter((_, j) => i !== j) })}>Remove Hero bounty</Button>
        </div>
      })}
      <Button variant="secondary" onClick={() => change({ ...state, heroes: [...(state.heroes ?? []), { name: '', die: null }] })}>Add enemy Hero taken out</Button>
    </> : won && state.role === 'defender' ? <>
      <SelectField label="Outlaw offered a free place" value={state.outlaw ?? ''} onChange={e => change({ ...state, outlaw: e.target.value, standing: false })}><option value="">Choose…</option><option value="none">Decline / none still standing</option>{BRIGAND_OUTLAWS.map(id => <option key={id} value={id}>{id.replaceAll('_', ' ')}</option>)}</SelectField>
      {state.outlaw && state.outlaw !== 'none' ? <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={state.standing ?? false} onChange={e => change({ ...state, standing: e.target.checked })} />This outlaw was still standing at the end</label> : null}
      <p className="text-sm">After filing, complete this free hire under Recruit. The normal warband restriction is waived; ordinary upkeep remains payable.</p>
    </> : null}
  </Card>
}
