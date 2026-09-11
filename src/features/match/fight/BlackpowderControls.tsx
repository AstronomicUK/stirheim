import { useState } from 'react'
import { correctBlackpowderShot, recordMisfireDie, type BattleLiveState, type BlackpowderShot, type BattleEventRow } from '../../../domain'
import { Button, DieField, SelectField, TextField } from '../../../ui'
export function BlackpowderControls({ sheet, warriorId, weaponKey, slots, slot, setSlot, blocked, readOnly, edit, events, onSelfHit }: {
  sheet: BattleLiveState; warriorId: string; weaponKey: string; slots: number; slot: number; setSlot: (n: number) => void; blocked: string | null;
  events: BattleEventRow[]; onSelfHit: (shotId: string) => void;
  readOnly: boolean; edit?: (fn: (s: BattleLiveState) => BattleLiveState) => void;
}) {
  const [reason, setReason] = useState('')
  const shots = sheet.blackpowderShots.filter(s => s.warriorId === warriorId && s.weaponKey === weaponKey && !s.correction)
  return <div className="flex flex-col gap-3 rounded border border-brass p-3 text-xs">
    <p className="font-semibold">Swivel Gun firing record</p>
    {slots > 1 ? <SelectField label="Swivel Gun firing model" value={String(slot)} onChange={e => setSlot(Number(e.target.value))}>{Array.from({ length: slots }, (_, n) => <option key={n} value={n}>Model {n + 1}</option>)}</SelectField> : null}
    <p>One physical gun per numbered model, shared across its ammunition choices. Keep group model numbers consistent. Extra copies or table exceptions use an explained correction.</p>
    {blocked ? <p>{blocked}</p> : <p>Ready to fire. A full own turn is required between shots.</p>}
    {shots.filter(s => s.misfireDie === 1).map(shot => {
      const done = events.some(e => !e.reverted_at && e.payload.blackpowderSelfShotId === shot.id && e.payload.target_id === warriorId && e.payload.attacker_id === warriorId)
      return <Button key={`self:${shot.id}`} variant="secondary" disabled={readOnly || done} onClick={() => onSelfHit(shot.id)}>{done ? 'Explosion self-hit recorded' : 'Resolve explosion self-hit'}</Button>
    })}
    {shots.filter(s => s.misfirePending).map(s => <PendingMisfire key={s.id} shot={s} readOnly={readOnly} edit={edit} />)}
    {shots.length ? <><TextField label="Swivel firing correction reason" value={reason} onChange={e => setReason(e.target.value)} /><Button variant="ghost" disabled={readOnly || !edit || !reason.trim()} onClick={() => { edit?.(s => shots.reduce((state, shot) => correctBlackpowderShot(state, shot.id, reason), s)); setReason('') }}>Correct this gun’s firing record</Button><p>Corrections preserve dice history. Any logged damage or destroyed item must be corrected separately.</p></> : null}
  </div>
}
function PendingMisfire({ shot, readOnly, edit }: { shot: BlackpowderShot; readOnly: boolean; edit?: (fn: (s: BattleLiveState) => BattleLiveState) => void }) {
  const [die, setDie] = useState<number | null>(shot.misfireOriginal ?? null)
  return <div className="flex flex-col gap-2">
    <p>Finish the saved misfire after closing or reloading the roller. A KA-BOOM hit from this recovery control must be resolved at the table; a BOOM result offers a separate self-hit action.</p>
    <DieField label="Saved Swivel misfire D6" sides={6} value={die} onChange={setDie} />
    <Button variant="secondary" disabled={readOnly || !edit || shot.misfireOriginal !== undefined} onClick={() => { const n = 1 + Math.floor(Math.random() * 6); setDie(n); edit?.(s => recordMisfireDie(s, shot.id, n, n, false)) }}>Roll saved misfire</Button>
    {shot.misfireOriginal !== undefined ? <p>App originally rolled {shot.misfireOriginal}. Any edit is recorded.</p> : null}
    <Button disabled={readOnly || !edit || die === null} onClick={() => edit?.(s => recordMisfireDie(s, shot.id, die!))}>Confirm saved misfire</Button>
  </div>
}
