import { useState } from 'react'
import { startPigeonPermission, confirmPigeonPermission, startPigeonLaunch, confirmPigeonLaunch, declarePigeonBlast, pigeonBlastCentre, unresolvedPigeonVictims, type PigeonLaunch, type LineShotTarget, type BattleLiveState, type BattleEventRow } from '../../../domain'
import { Button, DieField, SelectField, Sheet, TextField } from '../../../ui'
import type { Combatant } from './combatants'

export function PigeonLaunchControls({ attacker, models, sheet, events, ownTurn, mayLaunch, readOnly, requiresPermission, edit, onResolve }: {
  attacker: Combatant; models: Combatant[]; sheet: BattleLiveState; events: BattleEventRow[]; ownTurn: number;
  mayLaunch: boolean; readOnly: boolean; requiresPermission: boolean; edit?: (fn: (s: BattleLiveState) => BattleLiveState) => void;
  onResolve: (launch: PigeonLaunch, target: LineShotTarget) => void;
}) {
  const [test, setTest] = useState<PigeonLaunch | null>(null)
  const [blast, setBlast] = useState<string | null>(null)
  const [chosen, setChosen] = useState<string[]>([])
  const [targetKey, setTargetKey] = useState('')
  const targets = models.filter(m => !m.out).flatMap(m => Array.from({ length: m.kind === 'henchman' ? Math.max(1, m.groupSize ?? 1) : 1 }, (_, n) => ({ key: `${m.warbandId}:${m.id}:${n}`, warbandId: m.warbandId, warriorId: m.id, name: `${m.name}${(m.groupSize ?? 1) > 1 ? ` (model ${n + 1})` : ''} · ${m.warbandName}` })))
  const opponents = targets.filter(t => t.warbandId !== attacker.warbandId)
  const selected = opponents.find(t => t.key === targetKey) ?? opponents[0]
  const launches = sheet.pigeonLaunches.filter(l => l.warriorId === attacker.id)
  const pending = launches.find(l => l.ownTurn === ownTurn && l.die === undefined && !(l.permissionRequired && l.permissionDie !== undefined && l.permissionDie < 4))
  const activeBlast = launches.find(l => l.id === blast)
  const centre = activeBlast ? pigeonBlastCentre(activeBlast) : null
  const blastOptions = centre ? [centre, ...targets.filter(t => t.key !== centre.key)] : []
  return <div className="flex flex-col gap-3 rounded border border-brass p-3 text-xs">
    <p className="font-semibold">Pigeon Bomb launch and blast</p>
    <p>Choose the legal target at the table, including any Guardian interception. After the launch, select everyone within 1½ inches of the explosion. Keep group model numbers consistent.</p>
    <SelectField label="Pigeon Bomb intended target" value={selected?.key ?? ''} onChange={e => setTargetKey(e.target.value)}>{opponents.map(t => <option key={t.key} value={t.key}>{t.name}</option>)}</SelectField>
    <Button variant="secondary" disabled={!edit || readOnly || !mayLaunch || !selected || attacker.kind === 'henchman'} onClick={() => setTest(pending ?? { id: crypto.randomUUID(), warriorId: attacker.id, warbandId: attacker.warbandId, shooterName: attacker.name, permissionRequired: requiresPermission, ownTurn, at: new Date().toISOString(), reason: '', intendedTarget: selected })}>{pending ? 'Resume Pigeon launch' : 'Launch Pigeon Bomb'}</Button>
    {attacker.kind === 'henchman' ? <p>Pigeon Bombs are a Hero weapon; resolve any agreed group exception at the table.</p> : null}
    {launches.length ? <p>For a completed launch correction, revert any incorrect shared victim results before recording an explained replacement launch. Original dice and results remain in the history.</p> : null}
    {launches.map(l => <div key={l.id} className="flex flex-col gap-2 border-t border-border pt-2">
      <p>Own turn {l.ownTurn}: {l.permissionRequired && l.permissionDie !== undefined && l.permissionDie < 4 ? 'the Blessing prevented firing' : l.die === undefined ? 'launch awaiting confirmation' : l.die === 1 ? 'backfire at the firer' : l.die >= 5 ? `landed on ${l.intendedTarget.name}` : 'exploded harmlessly'}.</p>
      {pigeonBlastCentre(l) && l.targets === undefined ? <Button variant="secondary" disabled={readOnly || !edit} onClick={() => { setBlast(l.id); setChosen([pigeonBlastCentre(l)!.key]) }}>Choose blast victims</Button> : null}
      {unresolvedPigeonVictims(l, events).map(t => <Button key={t.key} variant="secondary" disabled={readOnly || !models.some(m => m.id === t.warriorId && m.warbandId === t.warbandId)} onClick={() => onResolve(l, t)}>Resolve blast: {t.name}</Button>)}
      {l.targets ? <p>{unresolvedPigeonVictims(l, events).length} of {l.targets.length} blast victims left.</p> : null}
    </div>)}
    {test && edit && mayLaunch && !readOnly ? <LaunchTest key={test.id} test={test} previous={launches.some(l => l.ownTurn === ownTurn && l.id !== test.id)} edit={edit} close={() => setTest(null)} /> : null}
    <Sheet open={Boolean(activeBlast)} title="Pigeon Bomb blast victims" onClose={() => setBlast(null)} footer={<Button block disabled={!edit || readOnly || !centre} onClick={() => { edit?.(s => declarePigeonBlast(s, activeBlast!.id, blastOptions.filter(t => chosen.includes(t.key)))); setBlast(null) }}>Confirm blast victims</Button>}>
      <div className="flex flex-col gap-3 p-4"><p>The central model must be hit. Add every friend and enemy within 1½ inches, using their positions at the time of the explosion.</p>{blastOptions.map(t => <label key={t.key} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" disabled={t.key === centre?.key} checked={chosen.includes(t.key)} onChange={e => setChosen(old => e.target.checked ? [...old, t.key] : old.filter(k => k !== t.key))} />{t.name}</label>)}</div>
    </Sheet>
  </div>
}

function LaunchTest({ test, previous, edit, close }: { test: PigeonLaunch; previous: boolean; edit: (fn: (s: BattleLiveState) => BattleLiveState) => void; close: () => void }) {
  const [original, setOriginal] = useState(test.original)
  const [die, setDie] = useState<number | null>(test.original ?? null)
  const [reason, setReason] = useState(test.reason)
  const [permissionOriginal, setPermissionOriginal] = useState(test.permissionOriginal)
  const [permissionDie, setPermissionDie] = useState<number | null>(test.permissionOriginal ?? null)
  const [permissionPassed, setPermissionPassed] = useState(!test.permissionRequired || (test.permissionDie ?? 0) >= 4)
  const allowed = !previous || Boolean(reason.trim())
  const save = { ...test, original, reason }
  return <Sheet open title="Launch Pigeon Bomb" onClose={close} footer={permissionPassed ? <Button block disabled={!allowed || die === null} onClick={() => { edit(s => confirmPigeonLaunch(startPigeonLaunch(s, save), test.id, die!)); close() }}>Confirm Pigeon launch</Button> : <Button block disabled={!allowed || permissionDie === null} onClick={() => {
    edit(s => confirmPigeonPermission(startPigeonPermission(s, save, permissionOriginal), test.id, permissionDie!))
    if (permissionDie! >= 4) setPermissionPassed(true); else close()
  }}>Confirm firing permission</Button>}>
    <div className="flex flex-col gap-4 p-4">
      <p>Target: {test.intendedTarget.name}. Roll 5–6 to land on target, 2–4 for a harmless explosion, or 1 for a blast at the firer.</p>
      {previous ? <TextField label="Reason for another Pigeon launch" value={reason} disabled={original !== undefined || permissionOriginal !== undefined} onChange={e => setReason(e.target.value)} /> : null}
      {!permissionPassed ? <>
        <p>Blessing of the Lady: first roll 4+ to fire. Failure ends this attempt without launching a bomb.</p>
        <DieField label="Pigeon firing permission D6" sides={6} value={permissionDie} onChange={setPermissionDie} />
        <Button variant="secondary" disabled={!allowed || permissionOriginal !== undefined} onClick={() => { const n = 1 + Math.floor(Math.random() * 6); setPermissionOriginal(n); setPermissionDie(n); edit(s => startPigeonPermission(s, save, n)) }}>Roll firing permission</Button>
        {permissionOriginal !== undefined ? <p>App rolled {permissionOriginal} for permission. Any change is recorded with the original.</p> : null}
      </> : <>
        <DieField label="Pigeon launch D6" sides={6} value={die} onChange={setDie} />
        <Button variant="secondary" disabled={!allowed || original !== undefined} onClick={() => { const n = 1 + Math.floor(Math.random() * 6); setOriginal(n); setDie(n); edit(s => startPigeonLaunch(s, { ...save, original: n })) }}>Roll Pigeon launch</Button>
        {original !== undefined ? <p>App rolled {original}. Any change is recorded with the original die.</p> : null}
      </>}
    </div>
  </Sheet>
}
