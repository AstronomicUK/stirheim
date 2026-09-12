import { useState } from 'react'
import type { BattleTurns } from '../../../api/battleTurns'
import { activeFires, pendingFireHits, recordFireRecovery, warbandTurnKey, type BattleEventRow, type BattleLiveState } from '../../../domain'
import type { RosterWarband } from '../../../rules/types/roster'
import type { WarbandTemplate } from '../../../rules/types'
import { Button, DieField, Notice, Sheet, TextField } from '../../../ui'
import { combatantsOf, type BattleBoosts } from '../fight/combatants'

export function FireRecovery({ roster, template, sheet, events, turns, boosts, edit }: {
  roster: RosterWarband; template?: WarbandTemplate; sheet: BattleLiveState; events: BattleEventRow[];
  turns?: BattleTurns | null; boosts: BattleBoosts; edit: (fn: (s: BattleLiveState) => BattleLiveState) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null)
  const turnKey = warbandTurnKey(roster.id, sheet.turn, turns)
  const warriors = combatantsOf(roster, template, roster.name, sheet, boosts).filter(w => !w.out)
  const fires = activeFires(sheet, events, roster.id)
  const recent = sheet.fireRecoveryTests.filter(t => t.turnKey === turnKey).map(t => t.warriorId)
  const subjects = warriors.filter(w => fires.some(e => e.payload.target_id === w.id) || recent.includes(w.id))
  const owed = pendingFireHits(sheet, events)
  const mine = !turns || turns.turn_order[turns.active_index] === roster.id
  const selected = subjects.find(w => w.id === picked)
  if ((!subjects.length && !owed.length) || turns?.finished) return null
  return <Notice title="On fire — Recovery" tone="warn"><div className="flex flex-col gap-3">
    <p>A burning warrior needs 4+ to extinguish the flames in Recovery. Failure causes one automatic Strength 4 hit. While burning, the warrior may only move. An ally in base contact may help on 4+.</p>
    {subjects.map(w => <div key={w.id} className="flex flex-wrap items-center justify-between gap-2">
      <span>{w.name} — {fires.some(e => e.payload.target_id === w.id) ? 'on fire' : 'extinguished'}</span>
      {(w.groupSize ?? 1) === 1 ? <Button variant="secondary" disabled={!mine} onClick={() => setPicked(w.id)}>Fire recovery: {w.name}</Button> : <p>Resolve the affected member separately at the table; this group contains several models.</p>}
    </div>)}
    {owed.length ? <p>{owed.length} failed Recovery {owed.length === 1 ? 'test needs' : 'tests need'} a Strength 4 hit resolved. Extinguishing the fire afterward does not cancel a hit already owed.</p> : null}
    {selected && mine ? <FireTest key={`${selected.id}:${turnKey}`} warriorId={selected.id} name={selected.name} warbandId={roster.id} turnKey={turnKey} sheet={sheet} events={events} helpers={warriors.filter(w => w.id !== selected.id && (w.groupSize ?? 1) === 1 && !fires.some(e => e.payload.target_id === w.id)).map(w => ({ id: w.id, name: w.name }))} edit={edit} close={() => setPicked(null)} /> : null}
  </div></Notice>
}
function FireTest({ warriorId, name, warbandId, turnKey, sheet, events, helpers, edit, close }: {
  warriorId: string; name: string; warbandId: string; turnKey: string; sheet: BattleLiveState; events: BattleEventRow[];
  helpers: { id: string; name: string }[]; edit: (fn: (s: BattleLiveState) => BattleLiveState) => void; close: () => void;
}) {
  const [actorId, setActorId] = useState(warriorId)
  const [contact, setContact] = useState(false)
  return <Sheet open title={`${name}: extinguish fire`} onClose={close}>
    <div className="flex flex-col gap-4 p-4">
      <label className="flex flex-col gap-2">Who is trying to extinguish the fire?
        <select className="rounded border border-border bg-surface-low p-2" value={actorId} onChange={e => { setActorId(e.target.value); setContact(false) }}>
          <option value={warriorId}>{name} (own Recovery test)</option>
          {helpers.map(h => <option key={h.id} value={h.id}>{h.name} (helping)</option>)}
        </select>
      </label>
      {actorId !== warriorId ? <label className="flex items-start gap-2"><input type="checkbox" checked={contact} onChange={e => setContact(e.target.checked)} />This ally is able to help and is in base contact.</label> : null}
      <FireRoll key={actorId} warriorId={warriorId} name={name} warbandId={warbandId} actorId={actorId} actorName={helpers.find(h => h.id === actorId)?.name ?? name} turnKey={turnKey} sheet={sheet} events={events} allowed={actorId === warriorId || contact} edit={edit} close={close} />
    </div>
  </Sheet>
}
function FireRoll({ warriorId, name, warbandId, actorId, actorName, turnKey, sheet, events, allowed, edit, close }: {
  warriorId: string; name: string; warbandId: string; actorId: string; actorName: string; turnKey: string;
  sheet: BattleLiveState; events: BattleEventRow[]; allowed: boolean; edit: (fn: (s: BattleLiveState) => BattleLiveState) => void; close: () => void;
}) {
  const previous = sheet.fireRecoveryTests.find(t => t.warriorId === warriorId && t.actorId === actorId && t.turnKey === turnKey)
  const [id] = useState(() => previous?.id ?? crypto.randomUUID())
  const [die, setDie] = useState<number | null>(previous?.die ?? null)
  const [original, setOriginal] = useState(previous?.originalDie)
  const [reason, setReason] = useState('')
  const hasFire = activeFires(sheet, events, warbandId).some(e => e.payload.target_id === warriorId)
  const ready = allowed && (hasFire || Boolean(previous)) && (!previous?.confirmed || Boolean(reason.trim()))
  const record = (value: number, originalDie: number | undefined, pending = false) => edit(s => recordFireRecovery(s, events, { id, warbandId, warriorId, warriorName: name, actorId, actorName, turnKey, die: value, originalDie, reason, pending }))
  return <>
    {previous?.confirmed && previous.die < 4 && events.some(e => !e.reverted_at && e.payload.fireRecoveryId === previous.id) ? <p>This failed test already has a damage result. If the correction changes that damage, revert its separate entry in the battle Log as well.</p> : null}
    {previous?.confirmed ? <TextField label="Reason for correcting fire recovery" value={reason} onChange={e => setReason(e.target.value)} /> : null}
    <DieField label="Extinguish fire D6" sides={6} value={die} onChange={setDie} />
    <Button variant="secondary" disabled={!ready || original !== undefined || previous?.confirmed} onClick={() => { const n = 1 + Math.floor(Math.random() * 6); setDie(n); setOriginal(n); record(n, n, true) }}>Roll extinguish D6</Button>
    {original !== undefined ? <p>App rolled {original}; changes keep the original result in the log.</p> : null}
    <Button block disabled={!ready || die === null} onClick={() => { record(die!, original); close() }}>Record fire recovery</Button>
  </>
}
