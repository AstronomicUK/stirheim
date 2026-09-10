import { DieField, NumberField, SelectField } from '../../../ui'
import { Card } from '../../roster/view/bits'
import { docksRewards, type DocksDraft } from '../model/docksRewards'
export function DocksRewards({ state, participantCount, change }: { state: DocksDraft; participantCount?: number; change: (next: DocksDraft) => void }) {
  const derived = docksRewards(state, participantCount)
  const setDie = (key: string, index: number, count: number, value: number | null) => {
    const rolls = { ...state.rolls }
    const prefix = key.split(':')[0] + ':'
    // Changed cargo or discovery rolls invalidate all dependent choices in this crate.
    if (key.endsWith(':cargo')) for (const k of Object.keys(rolls)) if (k.startsWith(prefix) && k !== key) delete rolls[k]
    if (key.endsWith(':drug-find')) delete rolls[`${prefix}drug`]
    rolls[key] = Array.from({ length: count }, (_, i) => i === index ? value : rolls[key]?.[i] ?? null)
    const crate = key.split(':')[0]
    change({ ...state, rolls, ...(key.endsWith(':cargo') ? { medicine: { ...state.medicine, [crate]: undefined }, gems: { ...state.gems, [crate]: undefined } } : {}) })
  }
  return <div className="flex flex-col gap-4">
    <SelectField label="Down at the Docks: your role" value={state.role ?? ''} onChange={e => change({ role: e.target.value as DocksDraft['role'] })}><option value="">Choose…</option><option value="raider">Raiding warband — open retained crates</option>{(participantCount ?? 0) > 2 ? <option value="defender">Defending warband — payment for remaining crates</option> : null}</SelectField>
    <NumberField label={state.role === 'defender' ? 'Crates remaining on the battlefield' : 'Crates your warband retained'} hint={`${participantCount === 2 ? 7 : 10} crates were supplied in this game.`} allowEmpty value={state.crates ?? null} onChange={crates => change({ role: state.role, crates })} />
    {state.role === 'raider' && Number.isInteger(state.crates) && state.crates! >= 0 && state.crates! <= 10 ? Array.from({ length: state.crates! }, (_, i) => <Card key={i} className="flex flex-col gap-3 px-4 py-3">
      <h3 className="font-medium">Crate {i + 1}</h3>
      {derived.prompts.filter(p => p.key.startsWith(`${i}:`)).map(prompt => <div key={prompt.key} className="flex flex-wrap gap-3">{Array.from({ length: prompt.count }, (_, n) => <DieField key={n} label={`${prompt.label}: D${prompt.sides} ${n + 1}`} sides={prompt.sides} rollable value={state.rolls?.[prompt.key]?.[n] ?? null} onChange={value => setDie(prompt.key, n, prompt.count, value)} />)}</div>)}
      {derived.gems.includes(String(i)) ? <SelectField label={`Crate ${i + 1}: gems`} value={state.gems?.[i] ?? ''} onChange={e => change({ ...state, gems: { ...state.gems, [i]: e.target.value as 'keep' | 'sell' } })}><option value="">Choose…</option><option value="keep">Keep gems — +1 rarity finds when worn</option><option value="sell">Fence gems — 40 gc</option></SelectField> : null}
      {derived.medicine.includes(String(i)) ? <SelectField label={`Crate ${i + 1}: medicine`} value={state.medicine?.[i] ?? ''} onChange={e => change({ ...state, medicine: { ...state.medicine, [i]: e.target.value as 'chest' | 'herbs' }, rolls: { ...state.rolls, [`${i}:herbs`]: [] } })}><option value="">Choose…</option><option value="chest">Keep chest — one later injury reroll</option><option value="herbs">Take D6 doses of Healing Herbs</option></SelectField> : null}
    </Card>) : null}
    {derived.garlic ? <NumberField label="Warband members receiving garlic from each food crate" allowEmpty value={state.garlicMembers ?? null} onChange={garlicMembers => change({ ...state, garlicMembers })} /> : null}
  </div>
}
