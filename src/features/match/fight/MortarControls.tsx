import { physicalWeaponChoices } from './weaponLoss'
import type { ItemRow } from '../../../domain'
import { useState } from 'react'
import { beginMortarShot, physicalGunKey, sameGun, rollMortarStage, confirmMortarStage, declareMortarBlast, correctMortarShot, unresolvedMortarTargets, type MortarShot, type LineShotTarget, type BattleLiveState, type BattleEventRow } from '../../../domain'
import { Button, DieField, SelectField, Sheet, TextField } from '../../../ui'
import type { Combatant } from './combatants'

export function MortarControls({ items, attacker, defender, models, sheet, events, ownTurn, hitThreshold, requiresPermission, mayFire, readOnly, edit, onResolve, onSelfHit }: {
  items: readonly ItemRow[]; attacker: Combatant; defender?: Combatant; models: Combatant[]; sheet: BattleLiveState; events: BattleEventRow[]; ownTurn: number; hitThreshold: number | null;
  requiresPermission: boolean; mayFire: boolean; readOnly: boolean; edit?: (fn: (s: BattleLiveState) => BattleLiveState) => void;
  onResolve: (shot: MortarShot, target: LineShotTarget) => void; onSelfHit: (id: string) => void;
}) {
  const [selectedCopy,setSelectedCopy]=useState<string | null>(null)
  const [slot, setSlot] = useState(0)
  const [targetSlot, setTargetSlot] = useState(0)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [legal, setLegal] = useState(false)
  const [reason, setReason] = useState('')
  const count = attacker.kind === 'henchman' ? Math.max(1, attacker.groupSize ?? 1) : 1
  const copies=physicalWeaponChoices(items,events,attacker.warbandId,attacker.id,'hand_held_mortar')
  const held=copies.find(c=>c.key===selectedCopy)??copies[Math.min(slot,count-1)]??copies[0]
  const legacyWeaponKey = `mortar:${Math.min(slot, count - 1)}`
  const weaponKey = physicalGunKey(held?.snapshot,legacyWeaponKey)
  const shots = sheet.mortarShots.filter(s => s.warriorId === attacker.id && sameGun(s,weaponKey,legacyWeaponKey) && !s.correction)
  const active = shots.find(s => s.id === activeId)
  const pending = shots.find(s => !['complete', 'stopped'].includes(s.stage))
  const sameTurn = shots.some(s => s.ownTurn === ownTurn)
  const blockedShot = sheet.blackpowderShots.find(s => s.warriorId === attacker.id && sameGun(s,weaponKey,legacyWeaponKey) && !s.correction && (s.misfireDie === 1 || s.misfireDie === 2 || ownTurn < s.ownTurn + 2 + (s.misfireDie === 3 ? 1 : 0)))
  return <div className="flex flex-col gap-3 rounded border border-brass p-3 text-xs">
    <p className="font-semibold">Mortar launch and blast</p>
    <p>One shell, followed by a full own turn to reload. A miss scatters; a natural 1 must resolve a misfire first. Number group models consistently.</p>
    {copies.length>1?<SelectField label="Carried Mortar copy" value={held?.key??''} onChange={e=>setSelectedCopy(e.target.value)}>{copies.map(copy=><option key={copy.key} value={copy.key}>{copy.label}</option>)}</SelectField>:null}
    {count > 1 ? <SelectField label="Mortar firing model" value={String(slot)} onChange={e => setSlot(Number(e.target.value))}>{Array.from({ length: count }, (_, n) => <option key={n} value={n}>Model {n + 1}</option>)}</SelectField> : null}
    {defender?.kind === 'henchman' && (defender.groupSize ?? 1) > 1 ? <SelectField label="Mortar primary target model" value={String(Math.min(targetSlot, (defender.groupSize ?? 1) - 1))} onChange={e => setTargetSlot(Number(e.target.value))}>{Array.from({ length: defender.groupSize ?? 1 }, (_, n) => <option key={n} value={n}>Model {n + 1}</option>)}</SelectField> : null}
    <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={legal} onChange={e => setLegal(e.target.checked)} />Confirm the selected target is legal, including any Guardian interception.</label>
    <Button variant="secondary" disabled={!edit || readOnly || !defender || (!pending && (!mayFire || !legal || sameTurn || Boolean(blockedShot) || hitThreshold === null))} onClick={() => {
      if (pending) { setActiveId(pending.id); return }
      const id = crypto.randomUUID()
      edit?.(s => beginMortarShot(s, { id, warriorId: attacker.id, warbandId: attacker.warbandId, shooterName: attacker.name, weaponKey, legacyWeaponKey, ownTurn, heldWeapon:held?.snapshot, at: new Date().toISOString(), hitThreshold: hitThreshold!, permissionRequired: requiresPermission, primary: { key: `${defender!.warbandId}:${defender!.id}:${Math.min(targetSlot, Math.max(0, (defender!.groupSize ?? 1) - 1))}`, warriorId: defender!.id, warbandId: defender!.warbandId, name: defender!.name } }))
      setActiveId(id)
    }}>{pending ? 'Resume Mortar launch' : 'Launch Mortar'}</Button>
    {blockedShot ? <p>{blockedShot.misfireDie === 1 ? 'Mortar destroyed. Resolve its removal from the roster.' : blockedShot.misfireDie === 2 ? 'Mortar jammed for the rest of the battle.' : `Reloading: next fire in own turn ${blockedShot.ownTurn + 2 + (blockedShot.misfireDie === 3 ? 1 : 0)}.`}</p> : sameTurn ? <p>This gun has already attempted to fire this turn.</p> : null}
    {shots.map(s => <div key={s.id} className="flex flex-col gap-2 border-t border-border pt-2">
      <p>Own turn {s.ownTurn}: {s.stage === 'stopped' ? 'shot stopped' : s.stage === 'complete' ? `${unresolvedMortarTargets(s, events).length} blast victims left` : `${s.stage} pending`}.</p>
      {sheet.blackpowderShots.some(b => b.id === s.id && b.misfireDie === 1) ? <Button variant="secondary" disabled={readOnly || events.some(e => !e.reverted_at && e.payload.blackpowderSelfShotId === s.id)} onClick={() => onSelfHit(s.id)}>Resolve Mortar explosion self-hit</Button> : null}
      {unresolvedMortarTargets(s, events).map(t => <Button key={t.key} variant="secondary" disabled={readOnly || !models.some(m => m.id === t.warriorId && m.warbandId === t.warbandId)} onClick={() => onResolve(s, t)}>Resolve Mortar blast: {t.name}</Button>)}
    </div>)}
    {shots.length ? <><TextField label="Mortar correction reason" value={reason} onChange={e => setReason(e.target.value)} /><Button variant="ghost" disabled={!edit || readOnly || !reason.trim()} onClick={() => { edit?.(s => shots.reduce((v, shot) => correctMortarShot(v, shot.id, reason), s)); setReason('') }}>Correct this Mortar’s firing record</Button><p>Dice remain in the log. Revert any incorrect shared damage separately.</p></> : null}
    {active && edit && !readOnly && !['stopped', 'complete'].includes(active.stage) ? <MortarStageSheet key={`${active.id}:${active.stage}`} shot={active} models={models} edit={edit} close={() => setActiveId(null)} /> : null}
  </div>
}

function MortarStageSheet({ shot, models, edit, close }: { shot: MortarShot; models: Combatant[]; edit: (fn: (s: BattleLiveState) => BattleLiveState) => void; close: () => void }) {
  const [dice, setDice] = useState<(number | null)[]>(shot.original ?? (shot.stage === 'scatter' ? [null, null, null] : [null]))
  const [original, setOriginal] = useState(shot.original)
  const [chosen, setChosen] = useState<string[]>(shot.onTarget ? [shot.primary.key] : [])
  const options = models.flatMap(m => Array.from({ length: m.kind === 'henchman' ? Math.max(1, m.groupSize ?? 1) : 1 }, (_, n) => ({ key: `${m.warbandId}:${m.id}:${n}`, warriorId: m.id, warbandId: m.warbandId, name: `${m.name}${(m.groupSize ?? 1) > 1 ? ` (model ${n + 1})` : ''} · ${m.warbandName}` })))
  if (shot.onTarget && !options.some(t => t.key === shot.primary.key)) options.unshift(shot.primary)
  const names = shot.stage === 'scatter' ? ['Mortar scatter distance die 1', 'Mortar scatter distance die 2', 'Mortar scatter direction (clockface)'] : [`Mortar ${shot.stage} D6`]
  return <Sheet open title={shot.stage === 'blast' ? 'Mortar blast victims' : `Mortar ${shot.stage}`} onClose={close} footer={<Button block disabled={shot.stage !== 'blast' && dice.some(d => d === null)} onClick={() => {
    if (shot.stage === 'blast') { edit(s => declareMortarBlast(s, shot.id, options.filter(t => chosen.includes(t.key)))); close() }
    else { edit(s => confirmMortarStage(s, shot.id, shot.stage, dice as number[])); if (shot.stage === 'permission' && dice[0]! < 4 || shot.stage === 'misfire' && dice[0]! < 6) close() }
  }}>{shot.stage === 'blast' ? 'Confirm Mortar blast victims' : `Confirm Mortar ${shot.stage}`}</Button>}>
    <div className="flex flex-col gap-4 p-4">
      {shot.stage === 'blast' ? <><p>Mark the landing point {shot.onTarget ? `on ${shot.primary.name}` : shot.scatter ? `${shot.scatter[0] + shot.scatter[1]} inches toward ${shot.scatter[2]} o’clock from ${shot.primary.name}` : 'on the table'}. Include every friend and enemy within 1½ inches. Each takes one Strength {shot.strength} hit.</p>{options.map(t => <label key={t.key} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={chosen.includes(t.key)} disabled={shot.onTarget && t.key === shot.primary.key} onChange={e => setChosen(v => e.target.checked ? [...v, t.key] : v.filter(k => k !== t.key))} />{t.name}</label>)}</> : <>
        <p>{shot.stage === 'hit' ? `Needs ${shot.hitThreshold}+ to hit ${shot.primary.name}. Natural 1 misfires; other misses scatter.` : shot.stage === 'permission' ? 'Blessing of the Lady: 4+ permits firing. Failure consumes no shell.' : shot.stage === 'misfire' ? 'Mandatory Experimental blackpowder misfire. Only a 6 sends the shell to the target, at +1 Strength; other results do not scatter.' : 'Roll 2D6 for inches and D12 for a clockface direction. 12 is directly away from the firer through the intended target; 3 is right, 6 back toward the firer.'}</p>
        {names.map((name, i) => i === 2 ? <SelectField key={name} label={name} value={dice[i] ?? ''} onChange={e => setDice(v => v.map((d, n) => n === i ? Number(e.target.value) : d))}><option value="" disabled>Choose direction</option>{Array.from({ length: 12 }, (_, n) => <option key={n} value={n + 1}>{n + 1} o’clock</option>)}</SelectField> : <DieField key={name} label={name} sides={6} value={dice[i]} onChange={d => setDice(v => v.map((old, n) => n === i ? d : old))} />)}
        <Button variant="secondary" disabled={Boolean(original)} onClick={() => { const values = names.map((_, i) => 1 + Math.floor(Math.random() * (i === 2 ? 12 : 6))); setDice(values); setOriginal(values); edit(s => rollMortarStage(s, shot.id, shot.stage, values)) }}>Roll Mortar {shot.stage}</Button>
        {original ? <p>App rolled {original.join(', ')}. Any changes retain these originals in the log.</p> : null}
      </>}
    </div>
  </Sheet>
}
