import { useState } from 'react'
import { startLinePermission, finishLinePermission, type LinePermissionTest, correctLineShot, declareLineShot, lineShotBlock, unresolvedLineTargets, type BattleLiveState, type BattleEventRow, type LineShot, type LineShotTarget } from '../../../domain'
import { Button, DieField, SelectField, Sheet, TextField } from '../../../ui'
import type { Combatant } from './combatants'

export function LineShotControls({ attacker, weaponId, models, sheet, events, ownTurn, mayFire, readOnly, edit, onResolve, requiresPermission }: {
  attacker: Combatant; weaponId: LineShot['weaponId']; models: Combatant[]; sheet: BattleLiveState; events: BattleEventRow[];
  requiresPermission?: boolean; ownTurn: number; mayFire: boolean; readOnly: boolean; edit?: (fn: (s: BattleLiveState) => BattleLiveState) => void;
  onResolve: (shot: LineShot, target: LineShotTarget) => void;
}) {
  const [open, setOpen] = useState(false)
  const [permission, setPermission] = useState<LinePermissionTest | null>(null)
  const [slot, setSlot] = useState(0)
  const [chosen, setChosen] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const slots = attacker.kind === 'henchman' ? Math.max(1, attacker.groupSize ?? 1) : 1
  const shooterSlot = Math.min(slot, slots - 1)
  const targets = models.filter(m => !m.out).flatMap(m => Array.from({ length: m.kind === 'henchman' ? Math.max(1, m.groupSize ?? 1) : 1 }, (_, index) => ({ key: `${m.warbandId}:${m.id}:${index}`, warriorId: m.id, warbandId: m.warbandId, name: `${m.name}${(m.groupSize ?? 1) > 1 ? ` (model ${index + 1})` : ''} · ${m.warbandName}` }))).filter(t => !(t.warriorId === attacker.id && t.warbandId === attacker.warbandId && t.key.endsWith(`:${shooterSlot}`)))
  const shots = sheet.lineShots.filter(s => !s.cancelled && s.warriorId === attacker.id && s.weaponId === weaponId)
  const blocked = lineShotBlock(sheet, attacker.id, weaponId, ownTurn, shooterSlot)
  const tests = sheet.linePermissionTests.filter(t => t.warriorId === attacker.id && t.weaponId === weaponId && t.shooterSlot === shooterSlot && t.ownTurn === ownTurn)
  const pending = tests.find(t => t.die === undefined)
  const picked = targets.filter(t => chosen.includes(t.key))
  return <div className="flex flex-col gap-3 rounded border border-brass p-3 text-xs">
    <p className="font-semibold">Blunderbuss line</p>
    {slots > 1 ? <SelectField label="Firing model" value={String(shooterSlot)} onChange={e => setSlot(Number(e.target.value))}>{Array.from({ length: slots }, (_, index) => <option key={index} value={index}>Model {index + 1}</option>)}</SelectField> : null}
    <p>Assign group model numbers consistently at the table. Only select models still in play. Tracks one weapon of this type per model; use an explained correction for extra copies or table exceptions.</p>
    {blocked ? <p>{blocked}</p> : <Button variant="secondary" disabled={readOnly || !edit || !mayFire} onClick={() => { if (pending) setPermission(pending); else { setChosen([]); setOpen(true) } }}>{pending ? 'Resume the Blessing firing test' : 'Choose the models in the line'}</Button>}
    {tests.at(-1)?.die !== undefined && tests.at(-1)!.die! < 4 ? <p>The Lady’s blessing prevented this model from firing this turn. An additional attempt requires an explained correction or agreed exception.</p> : null}
    {shots.map(shot => {
      const remaining = unresolvedLineTargets(shot, events)
      return <div key={shot.id} className="flex flex-col gap-2 border-t border-border pt-2">
        <p>Model {shot.shooterSlot + 1} · own turn {shot.ownTurn}: {remaining.length} of {shot.targets.length} targets left.</p>
        {remaining.map(target => <Button key={target.key} variant="secondary" disabled={readOnly || !models.some(m => m.id === target.warriorId && m.warbandId === target.warbandId)} onClick={() => onResolve(shot, target)}>Resolve {target.name}</Button>)}
        <TextField label={`Correction reason for shot ${shot.ownTurn}, model ${shot.shooterSlot + 1}`} value={reason} onChange={e => setReason(e.target.value)} />
        <Button variant="ghost" disabled={readOnly || !edit || !reason.trim()} onClick={() => { edit?.(s => correctLineShot(s, shot.id, reason, sheet.turn)); setReason('') }}>Correct firing declaration</Button>
      </div>
    })}
    <Sheet open={open} onClose={() => setOpen(false)} title="Models in the Blunderbuss line" footer={<Button block disabled={!picked.length || !mayFire || Boolean(blocked) || readOnly || !edit} onClick={() => {
      if (requiresPermission) { setPermission({ id: crypto.randomUUID(), warriorId: attacker.id, weaponId, shooterSlot, ownTurn, targets: picked, at: new Date().toISOString(), reason: '' }); setOpen(false); return }
      edit?.(s => declareLineShot(s, { id: crypto.randomUUID(), warriorId: attacker.id, weaponId, shooterSlot, ownTurn, targets: picked }, attacker.name, sheet.turn)); setOpen(false)
    }}>Fire this line</Button>}>
      <div className="flex flex-col gap-3 p-4">
        <p>At the table, draw a straight line 16 inches long and 1 inch wide from the firer. Select every model in it, including friends, before resolving any hits.</p>
        {targets.map(target => <label key={target.key} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={chosen.includes(target.key)} onChange={e => setChosen(keys => e.target.checked ? [...keys, target.key] : keys.filter(k => k !== target.key))} />{target.name}</label>)}
      </div>
    </Sheet>
    {permission && edit && mayFire && !readOnly ? <LineBlessingTest key={permission.id} test={permission} previous={tests.some(t => t.id !== permission.id)} name={attacker.name} edit={edit} close={() => setPermission(null)} /> : null}
  </div>
}


function LineBlessingTest({ test, previous, name, edit, close }: {
  test: LinePermissionTest; previous: boolean; name: string;
  edit: (fn: (s: BattleLiveState) => BattleLiveState) => void; close: () => void;
}) {
  const [original, setOriginal] = useState(test.original)
  const [die, setDie] = useState<number | null>(test.original ?? null)
  const [reason, setReason] = useState(test.reason)
  const allowed = !previous || Boolean(reason.trim())
  return <Sheet open title="Blessing of the Lady: firing line" onClose={close} footer={<Button block disabled={die === null || !allowed} onClick={() => {
    edit(s => finishLinePermission(startLinePermission(s, { ...test, original, reason }, name), test.id, die!, name)); close()
  }}>Confirm firing test</Button>}>
    <div className="flex flex-col gap-4 p-4">
      <p>Roll 4+ once to fire this entire line. A failed test means no shot this turn; the weapon is not spent and does not start reloading.</p>
      <p>Declared targets: {test.targets.map(t => t.name).join(', ')}.</p>
      {previous ? <TextField label="Reason for another firing attempt" value={reason} disabled={original !== undefined} onChange={e => setReason(e.target.value)} /> : null}
      <DieField label="Blessing firing D6" sides={6} value={die} onChange={setDie} />
      <Button variant="secondary" disabled={!allowed || original !== undefined} onClick={() => {
        const value = 1 + Math.floor(Math.random() * 6)
        setOriginal(value); setDie(value)
        edit(s => startLinePermission(s, { ...test, original: value, reason }, name))
      }}>Roll firing D6</Button>
      {original !== undefined ? <p>App rolled {original}. Any change is recorded alongside the original roll.</p> : null}
      {die !== null ? <p>{die >= 4 ? 'May fire: each declared target receives one hit.' : 'Unable to fire this turn.'}</p> : null}
    </div>
  </Sheet>
}
