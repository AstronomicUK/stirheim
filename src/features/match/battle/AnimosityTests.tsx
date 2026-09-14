import { useState } from 'react'
import type { BattleTurns } from '../../../api/battleTurns'
import { beginAnimosity, currentAnimosity, saveAnimosityRoll, acceptAnimosityRoll, exemptAnimosity, correctAnimosity, resolveAnimosityAction, ANIMOSITY_OUTCOME_TEXT, warbandTurnKey, type BattleLiveState, type AnimosityTest } from '../../../domain'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterWarband } from '../../../rules/types/roster'
import { Button, DieField, Notice, Sheet, TextField } from '../../../ui'
import { combatantsOf, type BattleBoosts } from '../fight/combatants'
import { animosityApplies } from './animosityModels'

export function AnimosityTests({ roster, template, sheet, turns, boosts, edit }: {
  roster: RosterWarband; template?: WarbandTemplate; sheet: BattleLiveState; turns?: BattleTurns | null; boosts: BattleBoosts; edit: (fn: (state: BattleLiveState) => BattleLiveState) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null)
  const warriors = combatantsOf(roster, template, roster.name, sheet, boosts).filter(w => !w.out && animosityApplies(w, roster))
  if (!warriors.length || turns?.finished || (turns && turns.turn_order[turns.active_index] !== roster.id)) return null
  const turnKey = warbandTurnKey(roster.id, sheet.turn, turns)
  const models = warriors.flatMap(w => Array.from({ length: w.groupSize ?? 1 }, (_, index) => ({ key: `${w.id}:${index}`, warriorId: w.id, modelIndex: index, name: `${w.name}${(w.groupSize ?? 1) > 1 ? ` model ${index + 1}` : ''}`, pole: w.equipment.some(i => i.itemId === 'boss_pole' && i.quantity > 0) })))
  const selected = models.find(m => m.key === picked)
  const test = selected ? currentAnimosity(sheet, selected.warriorId, selected.modelIndex, turnKey) : undefined
  const pending = models.filter(m => currentAnimosity(sheet, m.warriorId, m.modelIndex, turnKey)?.stage !== 'done').length
  return <Notice tone="warn" title={`Start-of-turn Animosity${pending ? ` — ${pending} to check` : ' — recorded'}`}>
    <p className="text-sm">Check each model separately. Models already in combat do not test. Record Boss Pole range or other table exemptions explicitly.</p>
    <details className="mt-2" open={pending > 0 || undefined}><summary className="cursor-pointer text-sm">Animosity models</summary>
      <div className="mt-2 flex max-h-64 flex-col gap-2 overflow-y-auto">{models.map(model => {
        const result = currentAnimosity(sheet, model.warriorId, model.modelIndex, turnKey)
        return <Button key={model.key} variant="secondary" onClick={() => {
          if (!result) edit(s => beginAnimosity(s, { ...model, id: crypto.randomUUID(), turnKey, at: new Date().toISOString() }))
          setPicked(model.key)
        }}>{model.name} — {result?.outcome ?? 'test due'}</Button>
      })}</div>
    </details>
    {selected && test ? <Sheet open onClose={() => setPicked(null)} title={`${selected.name}: Animosity`}><AnimosityResult key={`${test.id}:${test.stage}`} test={test} pole={selected.pole} edit={edit} /></Sheet> : null}
  </Notice>
}
function AnimosityResult({ test, pole, edit }: { test: AnimosityTest; pole: boolean; edit: (fn: (state: BattleLiveState) => BattleLiveState) => void }) {
  const [value, setValue] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const die = value ?? test.original ?? null
  return <div className="flex flex-col gap-3">
    {test.stage !== 'done' ? <>
      <p>{test.stage === 'trigger' ? 'Roll one D6. A 1 triggers Animosity; 2–6 acts normally.' : 'Roll one D6: 1 fights a friend, 2–5 squabbles, 6 rushes towards the enemy.'}</p>
      <DieField label={test.stage === 'trigger' ? 'Animosity test D6' : 'Animosity result D6'} sides={6} value={die} onChange={setValue} />
      <div className="flex gap-2"><Button variant="secondary" disabled={test.original !== undefined} onClick={() => edit(s => saveAnimosityRoll(s, test.id, 1 + Math.floor(Math.random() * 6), test.stage))}>Roll D6</Button><Button disabled={die === null} onClick={() => edit(s => acceptAnimosityRoll(s, test.id, die!, test.stage))}>Confirm</Button></div>
      {test.original !== undefined ? <p className="text-xs text-ink-dim">App rolled {test.original}; any change is recorded.</p> : null}
      {test.stage === 'trigger' && test.original === undefined ? <>
        <Button variant="secondary" onClick={() => edit(s => exemptAnimosity(s, test.id, 'Already engaged in hand-to-hand combat at the start of this turn'))}>Already in combat — no test</Button>
        {pole ? <Button variant="secondary" onClick={() => edit(s => exemptAnimosity(s, test.id, 'Carrying a Boss Pole'))}>Boss Pole bearer — no test</Button> : null}
        <TextField label="Other exemption (for example, within 6 inches of a Boss Pole)" value={reason} onChange={e => setReason(e.target.value)} />
        <Button variant="secondary" disabled={!reason.trim()} onClick={() => edit(s => exemptAnimosity(s, test.id, reason))}>Record exemption</Button>
      </> : null}
    </> : <>
      <p>{test.outcome ? ANIMOSITY_OUTCOME_TEXT[test.outcome] : ''}</p>
      {test.exemption ? <p>{test.exemption}</p> : null}
      {test.outcome === 'rush' ? test.actionResolved ? <p>Required movement recorded.</p> : <Button variant="secondary" onClick={() => edit(s => resolveAnimosityAction(s, test.id, 'Required extra movement/charge resolved at the table.'))}>Required movement resolved at the table</Button> : null}
      {test.outcome === 'fight' ? <>
        <p>Goblins do not charge an Orc henchman; they may still shoot as the rule permits. Resolve any eligible friendly attack using the battle calculator, or record the table resolution below.</p>
        {test.actionResolved ? <p>Forced action recorded. No further normal actions this turn.</p> : <><TextField label="Table resolution or no eligible friendly target" value={reason} onChange={e => setReason(e.target.value)} /><Button variant="secondary" disabled={!reason.trim()} onClick={() => edit(s => resolveAnimosityAction(s, test.id, reason))}>Record table resolution</Button></>}
      </> : null}
      <details><summary className="cursor-pointer text-sm">Correct this test</summary><TextField label="Correction reason" value={reason} onChange={e => setReason(e.target.value)} /><Button variant="secondary" disabled={!reason.trim()} onClick={() => edit(s => correctAnimosity(s, test.id, reason))}>Record correction</Button></details>
    </>}
  </div>
}
