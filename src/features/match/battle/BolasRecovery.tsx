import { useState } from 'react'
import type { BattleTurns } from '../../../api/battleTurns'
import { activeBolasEntanglements, resolveBolasRecovery, warbandTurnKey, withRollAttempt, type BattleLiveState, type BattleEventRow } from '../../../domain'
import { Button, DieField, Notice, Sheet, TextField } from '../../../ui'

export function BolasRecovery({ sheet, events, warbandId, turns, edit }: {
  sheet: BattleLiveState; events: BattleEventRow[]; warbandId: string; turns?: BattleTurns | null;
  edit: (fn: (s: BattleLiveState) => BattleLiveState) => void;
}) {
  const active = activeBolasEntanglements(events, warbandId, sheet.bolasRecoveredEventIds).filter(e => !sheet.tallies.some(t => t.id === e.payload.target_id && t.outOfAction > 0))
  const [picked, setPicked] = useState<string | null>(null)
  const mine = !turns || (!turns.finished && turns.turn_order[turns.active_index] === warbandId)
  const turnKey = warbandTurnKey(warbandId, sheet.turn, turns)
  const warriors = [...new Map(active.map(e => [e.payload.target_id, e.payload.target_name])).entries()]
  if (!active.length) return null
  return <Notice tone="warn" title="Entangled in Bolas">
    <div className="flex flex-col gap-3">
      <p>No movement or charging; Weapon Skill is reduced by 2 in combat. Shooting is unaffected. Roll 4+ in your Recovery phase to escape.</p>
      {warriors.map(([id, name]) => <div key={id} className="flex flex-wrap items-center justify-between gap-2"><span>{name}</span><Button variant="secondary" disabled={!mine} onClick={() => setPicked(id)}>Recover {name}</Button></div>)}
      {picked && warriors.some(([id]) => id === picked) && mine ? <RecoveryTest key={`${picked}:${turnKey}`} warriorId={picked} name={warriors.find(([id]) => id === picked)![1]} active={active} turnKey={turnKey} turn={sheet.turn} previous={sheet.bolasRecoveryTests.some(test => test.warriorId === picked && test.turnKey === turnKey)} edit={edit} close={() => setPicked(null)} /> : null}
    </div>
  </Notice>
}

function RecoveryTest({ warriorId, name, active, turnKey, turn, previous, edit, close }: {
  warriorId: string; name: string; active: BattleEventRow[]; turnKey: string; turn: number; previous: boolean;
  edit: (fn: (s: BattleLiveState) => BattleLiveState) => void; close: () => void;
}) {
  const [attemptId] = useState(() => crypto.randomUUID())
  const [needsReason] = useState(previous)
  const [reason, setReason] = useState('')
  const [die, setDie] = useState<number | null>(null)
  const [original, setOriginal] = useState<number | undefined>()
  const allowed = !needsReason || Boolean(reason.trim())
  return <Sheet open title={`${name}: escape Bolas`} onClose={close} footer={<Button block disabled={die === null || !allowed} onClick={() => { edit(s => resolveBolasRecovery(s, active, warriorId, name, die!, original, turn, { turnKey, attemptId, reason })); close() }}>Record Recovery</Button>}>
    <div className="flex flex-col gap-4 p-4">
      <p>Roll a D6 in Recovery. On 4+ the warrior is freed; otherwise they remain entangled.</p>
      {needsReason ? <TextField label="Reason for another Recovery test" value={reason} onChange={e => setReason(e.target.value)} hint="A test has already been started this turn. Explain the correction or agreed exception." /> : null}
      <DieField label="Bolas Recovery D6" sides={6} value={die} onChange={setDie} />
      <Button variant="secondary" disabled={!allowed || original !== undefined} onClick={() => {
        const value = 1 + Math.floor(Math.random() * 6)
        setDie(value); setOriginal(value)
        edit(s => withRollAttempt({ ...s, bolasRecoveryTests: [...s.bolasRecoveryTests.filter(test => test.warriorId !== warriorId || test.turnKey !== turnKey), { warriorId, turnKey, attemptId }] }, {
          id: attemptId, at: new Date().toISOString(), turn, kind: 'attack', status: 'incomplete', label: `${name}: Bolas Recovery in progress`,
          rolls: [...(reason.trim() ? [`Additional Recovery test: ${reason.trim()}.`] : []), `App rolled ${value}. Awaiting confirmation; any player edit will be recorded.`],
        }))
      }}>Roll Recovery D6</Button>
      {original !== undefined ? <p className="text-sm text-ink-dim">App rolled {original}. Any edit above is recorded with the original.</p> : null}
      {die !== null ? <p className="font-semibold">{die >= 4 ? 'Freed from the Bolas.' : 'Still entangled.'}</p> : null}
    </div>
  </Sheet>
}
