import { useState } from 'react'
import { Button, DieField, TextField } from '../../../ui'
import { acceptPowderKegDie, savePowderKegDie, setPowderKegVictims, correctPowderKeg, pendingPowderKegVictims, type BattleLiveState, type BattleEventRow, type PowderKegAttempt } from '../../../domain'
import type { Combatant } from './combatants'

/** Blast follow-up is separate from the weapon shot: it never spends ammunition again. */
export function PowderKegControls({ sheet, events, models, edit, readOnly, onResolve }: {
  sheet: BattleLiveState; events: BattleEventRow[]; models: Combatant[];
  edit?: (fn: (s: BattleLiveState) => BattleLiveState) => void; readOnly: boolean;
  onResolve: (attempt: PowderKegAttempt, target: PowderKegAttempt['targets'][number]) => void;
}) {
  return <>{sheet.powderKegAttempts.filter(a => !a.correction).map(attempt => <PowderKegResult key={attempt.id} {...{ attempt, sheet, events, models, edit, readOnly, onResolve }} />)}</>
}
function PowderKegResult({ attempt, events, models, edit, readOnly, onResolve }: Parameters<typeof PowderKegControls>[0] & { attempt: PowderKegAttempt }) {
  const [value, setValue] = useState<number | null>(null)
  const [chosen, setChosen] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const options = models.filter(model => !model.out).flatMap(model => Array.from({ length: model.groupSize ?? 1 }, (_, i) => ({ key: `${model.warbandId}:${model.id}:${i}`, warriorId: model.id, warbandId: model.warbandId, name: `${model.name}${(model.groupSize ?? 1) > 1 ? ` model ${i + 1}` : ''} (${model.warbandName})` })))
  const label = attempt.stage === 'explosion' ? 'Explosion: 4+' : attempt.stage === 'radius' ? 'Blast radius: D6 + 3 inches' : 'Tunnel cave-in: 4+'
  const die = value ?? attempt.original ?? null
  return <section className="flex flex-col gap-3 rounded-md border border-brass p-3 text-sm">
    <p className="font-semibold">{attempt.kegName}</p>
    <p>{attempt.stage === 'stopped' ? 'The keg did not explode.' : attempt.radius ? `Keg destroyed. Blast radius: ${attempt.radius} inches.` : attempt.stage === 'explosion' ? 'The keg was hit and wounded. Check whether it explodes.' : 'The keg explodes. Remove it from the table.'}</p>
    {['explosion', 'radius', 'caveIn'].includes(attempt.stage) ? <>
      <DieField label={label} sides={6} value={die} onChange={setValue} />
      <div className="flex gap-2">
        <Button variant="secondary" disabled={readOnly || !edit || attempt.original !== undefined} onClick={() => edit?.(s => savePowderKegDie(s, attempt.id, 1 + Math.floor(Math.random() * 6), attempt.stage))}>Roll D6</Button>
        <Button disabled={readOnly || !edit || die === null} onClick={() => { edit?.(s => acceptPowderKegDie(s, attempt.id, die!, attempt.stage)); setValue(null) }}>Confirm</Button>
      </div>
      {attempt.original !== undefined ? <p className="text-xs text-ink-dim">App rolled {attempt.original}. Any change is recorded in the log.</p> : null}
    </> : null}
    {attempt.caveIn ? <p>Place a Tunnel Collapse marker where the keg stood.</p> : null}
    {attempt.stage === 'targets' ? <>
      <p>Select every model within {attempt.radius} inches, including friends. Each takes one automatic Strength 6 hit.</p>
      <div className="max-h-64 overflow-y-auto">
        {options.map(target => <label key={target.key} className="flex min-h-11 items-center gap-2"><input type="checkbox" disabled={readOnly} checked={chosen.includes(target.key)} onChange={e => setChosen(old => e.target.checked ? [...old, target.key] : old.filter(k => k !== target.key))} />{target.name}</label>)}
      </div>
      <Button disabled={readOnly || !edit} onClick={() => edit?.(s => setPowderKegVictims(s, attempt.id, options.filter(t => chosen.includes(t.key))))}>{chosen.length ? 'Confirm blast victims' : 'Confirm nobody is in range'}</Button>
    </> : null}
    {pendingPowderKegVictims(attempt, events).map(target => <Button key={target.key} variant="secondary" disabled={readOnly || !models.some(m => m.id === target.warriorId && m.warbandId === target.warbandId)} onClick={() => onResolve(attempt, target)}>Resolve blast: {target.name}</Button>)}
    {attempt.stage === 'complete' && !pendingPowderKegVictims(attempt, events).length ? <p>Blast resolved.</p> : null}
    <details><summary className="cursor-pointer text-xs">Correct this attempt</summary><TextField label="Correction reason" value={reason} onChange={e => setReason(e.target.value)} /><Button variant="secondary" disabled={readOnly || !edit || !reason.trim()} onClick={() => edit?.(s => correctPowderKeg(s, attempt.id, reason))}>Record correction</Button></details>
  </section>
}
