import { useState } from 'react'
import type { BattleTurns } from '../../../api/battleTurns'
import { recordStupidityTest, withRollAttempt, warbandTurnKey, type BattleLiveState } from '../../../domain'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterWarband } from '../../../rules/types/roster'
import { Button, DieField, Notice, NumberField, SelectField, Sheet, TextField } from '../../../ui'
import { combatantsOf, type BattleBoosts, type Combatant } from '../fight/combatants'

export function StupidityTests({ roster, template, sheet, turns, boosts, edit }: {
  roster: RosterWarband; template?: WarbandTemplate; sheet: BattleLiveState; turns?: BattleTurns | null;
  boosts: BattleBoosts; edit: (fn: (state: BattleLiveState) => BattleLiveState) => void;
}) {
  const [picked, setPicked] = useState<Combatant | null>(null)
  const warriors = combatantsOf(roster, template, roster.name, sheet, boosts).filter(w => !w.out && w.traitIds.includes('stupidity') && !w.traitIds.includes('deathwish'))
  if (!warriors.length || turns?.finished || (turns && turns.turn_order[turns.active_index] !== roster.id)) return null
  const key = warbandTurnKey(roster.id, sheet.turn, turns)
  const individual = warriors.filter(w => w.kind !== 'henchman' || (w.groupSize ?? 1) <= 1)
  const grouped = warriors.filter(w => w.kind === 'henchman' && (w.groupSize ?? 1) > 1)
  return <Notice tone="warn" title="Start-of-turn Stupidity tests">
    <div className="flex flex-col gap-3">
      <p>Test each affected warrior before acting. Roll 2D6 against Leadership; use a nearby leader’s Leadership only when the table position allows it.</p>
      {individual.map(w => {
        const recorded = sheet.stupidityResults.find(r => r.warriorId === w.id && r.turnKey === key)
        return <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>{w.name}{recorded ? ` — ${recorded.failed ? 'failed' : 'passed'} recorded` : ' — test due'}</span>
          <Button variant="secondary" onClick={() => setPicked(w)}>{recorded ? 'Record another test' : `Test ${w.name}`}</Button>
        </div>
      })}
      {grouped.length ? <p className="text-sm">{grouped.map(w => w.name).join(', ')}: test each model separately at the table. The app cannot yet identify individual members of these groups.</p> : null}
      {picked && individual.some(w => w.id === picked.id) ? <TestSheet key={`${key}:${picked.id}`} warrior={picked} correction={sheet.stupidityResults.some(r => r.warriorId === picked.id && r.turnKey === key)} turn={sheet.turn} turnKey={key} edit={edit} close={() => setPicked(null)} /> : null}
    </div>
  </Notice>
}

function TestSheet({ warrior, correction, turn, turnKey, edit, close }: { warrior: Combatant; correction: boolean; turn: number; turnKey: string; edit: (fn: (state: BattleLiveState) => BattleLiveState) => void; close: () => void }) {
  const [attemptId] = useState(() => crypto.randomUUID())
  const [correctionReason, setCorrectionReason] = useState('')
  const [originalMovement, setOriginalMovement] = useState<number | undefined>()
  const [dice, setDice] = useState<(number | null)[]>([null, null])
  const [original, setOriginal] = useState<number[] | undefined>()
  const [leadership, setLeadership] = useState(warrior.stats.Ld)
  const [reason, setReason] = useState('')
  const [combat, setCombat] = useState('')
  const [movement, setMovement] = useState<number | null>(null)
  const ready = dice.every(d => d !== null && d >= 1 && d <= 6)
  const validLeadership = Number.isInteger(leadership) && leadership >= 0 && leadership <= 20
  const failed = ready && (dice[0]! + dice[1]!) > leadership
  const changedLd = leadership !== warrior.stats.Ld
  const canSave = ready && validLeadership && (!correction || correctionReason.trim()) && (!changedLd || reason.trim()) && (!failed || combat === 'yes' || (combat === 'no' && movement !== null))
  function pending(rolls: string[]) {
    edit(state => withRollAttempt(state, { id: attemptId, at: new Date().toISOString(), turn, kind: 'attack', status: 'incomplete', label: `${warrior.name}: Stupidity test in progress`, rolls }))
  }
  return <Sheet open onClose={close} title={`${warrior.name}: Stupidity`} footer={<Button block disabled={!canSave} onClick={() => {
    const roll = { attemptId, correctionReason, originalMovementDie: originalMovement, dice: dice as number[], originalDice: original, leadership, baseLeadership: warrior.stats.Ld, leadershipReason: reason, inCombat: combat === 'yes', movementDie: movement ?? undefined }
    edit(state => recordStupidityTest(state, warrior.id, turnKey, warrior.name, roll, turn))
    close()
  }}>Record test</Button>}>
    <div className="flex flex-col gap-4 p-4">
      <NumberField label="Leadership for this test" value={leadership} onChange={value => setLeadership(value ?? Number.NaN)} allowEmpty />
      {correction ? <TextField label="Why another test is needed" value={correctionReason} onChange={e => setCorrectionReason(e.target.value)} /> : null}
      {changedLd ? <TextField label="Why this Leadership applies" value={reason} onChange={e => setReason(e.target.value)} placeholder="Within 6 inches of the leader…" /> : null}
      <div className="grid grid-cols-2 gap-3">{dice.map((die, i) => <DieField key={i} label={i === 0 ? 'First D6' : 'Second D6'} sides={6} value={die} onChange={value => setDice(ds => ds.map((d, j) => j === i ? value : d))} />)}</div>
      <Button variant="secondary" disabled={Boolean(original) || !validLeadership || (changedLd && !reason.trim()) || (correction && !correctionReason.trim())} onClick={() => { const rolled = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]; setDice(rolled); setOriginal(rolled); setMovement(null); pending([`App rolled ${rolled.join(' + ')} for Stupidity. Result awaiting confirmation.`]) }}>Roll 2D6</Button>
      {original ? <p className="text-sm text-ink-dim">App rolled {original.join(' + ')}. Any changes above will be recorded with the original roll.</p> : null}
      {ready && validLeadership ? <p className="font-semibold">{dice[0]! + dice[1]!} against Leadership {leadership}: {failed ? 'failed' : 'passed'}.</p> : null}
      {failed ? <>
        <SelectField label="In hand-to-hand combat?" value={combat} onChange={e => setCombat(e.target.value)}><option value="">Choose the situation</option><option value="yes">Yes</option><option value="no">No</option></SelectField>
        {combat === 'no' ? <>
          <DieField label="Stupidity movement D6" sides={6} value={movement} onChange={setMovement} />
          <Button variant="secondary" disabled={originalMovement !== undefined} onClick={() => { const die = 1 + Math.floor(Math.random() * 6); setMovement(die); setOriginalMovement(die); pending([original ? `App originally rolled ${original.join(' + ')} for Stupidity; current faces ${dice.join(' + ')}.` : `Player entered ${dice.join(' + ')} for Stupidity.`, `App rolled movement D6: ${die}. Result awaiting confirmation.`]) }}>Roll movement D6</Button>
          {originalMovement !== undefined ? <p className="text-sm text-ink-dim">App rolled movement {originalMovement}; any edit is recorded.</p> : null}
        </> : null}
        <p className="text-sm">No attacks or spells until the next own turn. Outside combat, a movement roll of 1–3 means straight ahead at half speed (no charge); 4–6 means standing inactive. Apply positioning and falls at the table.</p>
      </> : null}
    </div>
  </Sheet>
}
