import { Notice, DieField, NumberField, SelectField, TextField } from '../../../ui'
import type { CaravanDraft } from '../model/caravanRewards'
export function CaravanRewards({ state, archive, result, restricted, change }: { state: CaravanDraft; archive: boolean; result: 'won' | 'lost' | 'draw' | null; restricted?: boolean; change: (next: CaravanDraft) => void }) {
  return <div className="flex flex-col gap-3">
    <SelectField label="Caravan: your role" value={state.role ?? ''} onChange={e => change({ role: e.target.value as CaravanDraft['role'] })}><option value="">Choose…</option><option value="attacker">Attacker</option><option value="defender">Defender / caravan guard</option>{!archive ? <option value="traitor">Traitorous defender</option> : null}</SelectField>
    {restricted && state.role !== 'attacker' ? <Notice tone="warn">This warband previously betrayed a caravan and cannot escort another in this campaign. Choose attacker, or record an agreed exception below.</Notice> : null}
    {archive ? <>
      <DieField label="Original cargo D3 (from setup)" sides={3} value={state.cargoDie ?? null} onChange={cargoDie => change({ ...state, cargoDie, heldShards: null })} />
      <NumberField label="Cargo shards retained by your warband" allowEmpty value={state.heldShards ?? null} onChange={heldShards => change({ ...state, heldShards })} />
      <SelectField label="Did the merchant keep his cargo?" value={state.merchantKept === undefined ? '' : String(state.merchantKept)} onChange={e => change({ ...state, merchantKept: e.target.value === '' ? undefined : e.target.value === 'true', heldShards: null })}><option value="">Choose…</option><option value="true">Yes</option><option value="false">No</option></SelectField>
      {state.role === 'defender' ? <SelectField label="Was A Friend in the Business used?" value={state.friendVariant === undefined ? '' : String(state.friendVariant)} onChange={e => change({ ...state, friendVariant: e.target.value === '' ? undefined : e.target.value === 'true', rounding: undefined })}><option value="">Choose…</option><option value="false">No — standard equipment prices</option><option value="true">Yes — optional trading reputation</option></SelectField> : null}
      {state.role === 'defender' && state.friendVariant && result !== 'draw' ? <SelectField label="Agreed rounding for each equipment purchase" value={state.rounding ?? ''} onChange={e => change({ ...state, rounding: e.target.value as CaravanDraft['rounding'] })}><option value="">Choose…</option><option value="up">Round up to whole gold crowns</option><option value="down">Round down to whole gold crowns</option></SelectField> : null}
    </> : <>
      <NumberField label="Wagons that escaped" allowEmpty value={state.escaped ?? null} onChange={escaped => change({ ...state, escaped })} />
      <NumberField label="Wagons looted by your warband" allowEmpty value={state.looted ?? null} onChange={looted => change({ ...state, looted })} />
      {state.role === 'traitor' ? <DieField label="Rare-search penalty duration D6" sides={6} rollable value={state.penaltyDie ?? null} onChange={penaltyDie => change({ ...state, penaltyDie })} /> : null}
      <details><summary className="cursor-pointer text-sm">Agreed exception to the scenario outcome or escort restriction</summary><TextField label="Caravan exception reason" value={state.overrideReason ?? ''} onChange={e => change({ ...state, overrideReason: e.target.value })} /></details>
    </>}
  </div>
}
