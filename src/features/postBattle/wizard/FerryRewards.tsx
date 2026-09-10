import { DieField, NumberField, SelectField, TextField } from '../../../ui'
import type { FerryRewardDraft } from '../model/ferryRewards'
export function FerryRewards({ state, won, change }: { state: FerryRewardDraft; won: boolean; change: (s: FerryRewardDraft) => void }) {
  const defending = state.side && state.side !== 'attacker'
  const paidDefense = defending && won && state.roughedUp === false
  const dice = (key: 'paymentDice' | 'bonusDice' | 'feeDice', count: number, label: string) => <div className="flex flex-wrap gap-3">{Array.from({ length: count }, (_, i) => <DieField key={i} sides={6} rollable label={`${label}: D6 ${i + 1}`} value={state[key]?.[i] ?? null} onChange={v => change({ ...state, ownShare: null, [key]: Array.from({ length: count }, (_, j) => i === j ? v : state[key]?.[j] ?? null) })} />)}</div>
  return <div className="flex flex-col gap-4">
    <SelectField label="Your part in the ferry battle" value={state.side ?? ''} onChange={e => change({ side: e.target.value as FerryRewardDraft['side'] || undefined })}><option value="">Choose…</option><option value="attacker">Attacker</option><option value="defender">Defender</option><option value="defenders-ally">Joined the defender to share victory</option></SelectField>
    {state.side ? <SelectField label={defending ? 'Were the Hornsbys roughed up?' : 'Did your own warriors help rough up the Hornsbys?'} value={state.roughedUp === undefined ? '' : String(state.roughedUp)} onChange={e => change({ side: state.side, roughedUp: e.target.value === '' ? undefined : e.target.value === 'true' })}><option value="">Choose…</option><option value="true">Yes</option><option value="false">No</option></SelectField> : null}
    {state.side === 'attacker' && won ? dice('paymentDice', 3, 'Attacker contract') : null}
    {state.side === 'attacker' && state.roughedUp ? dice('bonusDice', 2, 'Roughing-up bonus') : null}
    {paidDefense ? <>
      {dice('paymentDice', 5, 'Defensive payment')}
      <SelectField label="Did the patrol end the battle at the turn limit?" value={state.patrol === undefined ? '' : String(state.patrol)} onChange={e => change({ ...state, patrol: e.target.value === '' ? undefined : e.target.value === 'true', feeDice: [], ownShare: null })}><option value="">Choose…</option><option value="true">Yes — deduct patrol fees</option><option value="false">No</option></SelectField>
      {state.patrol ? dice('feeDice', 2, 'Patrol fees') : null}
      <SelectField label="Is this defensive payment shared?" value={state.shared === undefined ? '' : String(state.shared)} onChange={e => change({ ...state, shared: e.target.value === '' ? undefined : e.target.value === 'true', ownShare: null, allocation: '' })}><option value="">Choose…</option><option value="false">No — keep the whole payment</option><option value="true">Yes — record only our share</option></SelectField>
      {state.shared ? <><NumberField label="Gold allocated to your warband" allowEmpty value={state.ownShare ?? null} onChange={ownShare => change({ ...state, ownShare })} /><TextField label="Agreed allocation between named warbands" value={state.allocation ?? ''} onChange={e => change({ ...state, allocation: e.target.value })} /><p className="text-sm text-ink-dim">Each warband records only its own share in its report. This entry does not pay the allies again.</p></> : null}
    </> : null}
  </div>
}
