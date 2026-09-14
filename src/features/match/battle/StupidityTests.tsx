import { canUseRelic, passStupidityWithRelic, recordLeadershipTest } from './relicRules'
import { useState } from 'react'
import type { BattleTurns } from '../../../api/battleTurns'
import { recordStupidityTest, withRollAttempt, warbandTurnKey, combatPhaseKey, type BattleLiveState, type StupidityDraft } from '../../../domain'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterWarband } from '../../../rules/types/roster'
import { Button, DieField, Notice, NumberField, SelectField, Sheet, TextField } from '../../../ui'
import { combatantsOf, type BattleBoosts, type Combatant } from '../fight/combatants'

export function StupidityTests({ roster, template, sheet, turns, boosts, edit }: {
  roster: RosterWarband; template?: WarbandTemplate; sheet: BattleLiveState; turns?: BattleTurns | null;
  boosts: BattleBoosts; edit: (fn: (state: BattleLiveState) => BattleLiveState) => void;
}) {
  const [picked, setPicked] = useState<Combatant | null>(null)
  const warriors = combatantsOf(roster, template, roster.name, sheet, boosts, combatPhaseKey(sheet.turn, turns)).filter(w => !w.out && w.traitIds.includes('stupidity') && !w.traitIds.includes('deathwish'))
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
      {picked && individual.some(w => w.id === picked.id) ? <TestSheet roster={roster} sheet={sheet} key={`${key}:${picked.id}`} warrior={picked} correction={sheet.stupidityResults.some(r => r.warriorId === picked.id && r.turnKey === key)} turn={sheet.turn} turnKey={key} edit={edit} close={() => setPicked(null)} /> : null}
    </div>
  </Notice>
}

export function TestSheet({ roster, sheet, warrior, correction, turn, turnKey, edit, close }: { roster: RosterWarband; sheet: BattleLiveState; warrior: Combatant; correction: boolean; turn: number; turnKey: string; edit: (fn: (state: BattleLiveState) => BattleLiveState) => void; close: () => void }) {
  const [firstTest, setFirstTest] = useState(false)
  const [resumed] = useState(() => sheet.rollAttempts.findLast(attempt => attempt.status === 'incomplete' && attempt.stupidity?.warriorId === warrior.id && attempt.stupidity.turnKey === turnKey))
  const [attemptId] = useState(() => resumed?.id ?? crypto.randomUUID())
  const [draft, setDraft] = useState<StupidityDraft>(() => resumed?.stupidity ?? { warriorId: warrior.id, turnKey, dice: [null, null], leadership: warrior.stats.Ld, leadershipReason: '', correctionReason: '', combat: '', movementDie: null })
  const { dice, originalDice: original, leadership: savedLeadership, leadershipReason: reason, correctionReason, combat, movementDie: movement, originalMovementDie: originalMovement, rerolledFrom } = draft
  const leadership = savedLeadership ?? Number.NaN
  const ready = dice.every(d => d !== null && d >= 1 && d <= 6)
  const validLeadership = Number.isInteger(leadership) && leadership >= 0 && leadership <= 20
  const failed = ready && (dice[0]! + dice[1]!) > leadership
  const changedLd = leadership !== warrior.stats.Ld
  const canSave = ready && validLeadership && (!correction || correctionReason.trim()) && (!changedLd || reason.trim()) && (!failed || combat === 'yes' || (combat === 'no' && movement !== null))
  const sashimono = warrior.equipment.some(item => item.itemId === 'sashimono' && item.quantity > 0)
  function update(patch: Partial<StupidityDraft>, leadershipRolled = false) {
    const next = { ...draft, ...patch, testStarted: draft.testStarted || leadershipRolled || Boolean(patch.dice?.some(die => die !== null)) }
    setDraft(next)
    const rolls = [
      ...(next.rerolledFrom ? [`First test ${next.rerolledFrom.dice.join(' + ')} rerolled using ${next.rerolledFrom.reason}; second result awaiting confirmation.`] : []),
      next.originalDice ? `App rolled ${next.originalDice.join(' + ')}; current faces ${next.dice.map(d => d ?? '—').join(' + ')}.` : `Player-entered faces: ${next.dice.map(d => d ?? '—').join(' + ')}.`,
      ...(next.originalMovementDie !== undefined ? [`App rolled movement ${next.originalMovementDie}; current face ${next.movementDie ?? '—'}.`] : []),
    ]
    edit(state => withRollAttempt(!draft.testStarted && next.testStarted ? recordLeadershipTest(state, warrior.id, 'stupidity') : state, { id: attemptId, at: new Date().toISOString(), turn, kind: 'attack', status: 'incomplete', label: `${warrior.name}: Stupidity test in progress`, rolls, stupidity: next }))
  }
  return <Sheet open onClose={close} title={`${warrior.name}: Stupidity`} footer={<Button block disabled={!canSave} onClick={() => {
    const roll = { rerolledFrom, attemptId, correctionReason, originalMovementDie: originalMovement, dice: dice as number[], originalDice: original, leadership, baseLeadership: warrior.stats.Ld, leadershipReason: reason, inCombat: combat === 'yes', movementDie: movement ?? undefined }
    edit(state => recordStupidityTest(state, warrior.id, turnKey, warrior.name, roll, turn))
    close()
  }}>Record test</Button>}>
    <div className="flex flex-col gap-4 p-4">
      {!rerolledFrom && !original && dice.every(d => d === null) && canUseRelic(roster, sheet, warrior.id) ? <Notice title="Holy (Unholy) Relic">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={firstTest} onChange={e => setFirstTest(e.target.checked)} />This is this warrior’s first Leadership test of the battle, including tests at the table.</label>
        <Button variant="secondary" disabled={!firstTest} onClick={() => {
          edit(state => {
            const passed = passStupidityWithRelic(roster, state, warrior.id, warrior.name, turnKey, firstTest)
            return passed === state ? state : { ...passed, rollAttempts: passed.rollAttempts.map(attempt => attempt.id === attemptId && attempt.status === 'incomplete' ? { ...attempt, status: 'restarted' as const, label: `${warrior.name}: unrolled test replaced by Relic pass` } : attempt) }
          })
          close()
        }}>Pass automatically with the relic</Button>
      </Notice> : null}
      <NumberField label="Leadership for this test" value={leadership} onChange={value => update({ leadership: value })} allowEmpty />
      {correction ? <TextField label="Why another test is needed" value={correctionReason} onChange={e => update({ correctionReason: e.target.value })} /> : null}
      {changedLd ? <TextField label="Why this Leadership applies" value={reason} onChange={e => update({ leadershipReason: e.target.value })} placeholder="Within 6 inches of the leader…" /> : null}
      <div className="grid grid-cols-2 gap-3">{dice.map((die, i) => <DieField key={i} label={i === 0 ? 'First D6' : 'Second D6'} sides={6} value={die} onChange={value => update({ dice: dice.map((d, j) => j === i ? value : d) })} />)}</div>
      <Button variant="secondary" disabled={Boolean(original) || !validLeadership || (changedLd && !reason.trim()) || (correction && !correctionReason.trim())} onClick={() => { const rolled = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]; update({ dice: rolled, originalDice: rolled, movementDie: null }, true) }}>Roll 2D6</Button>
      {original ? <p className="text-sm text-ink-dim">App rolled {original.join(' + ')}. Any changes above will be recorded with the original roll.</p> : null}
      {ready && validLeadership ? <p className="font-semibold">{dice[0]! + dice[1]!} against Leadership {leadership}: {failed ? 'failed' : 'passed'}.</p> : null}
      {rerolledFrom ? <Notice title="Sashimono reroll">First test: {rerolledFrom.dice.join(' + ')}. This is the second test and its result stands; any manual changes are recorded.</Notice> : sashimono && ready && validLeadership ? <Button variant="secondary" disabled={Boolean(changedLd && !reason.trim()) || Boolean(correction && !correctionReason.trim())} onClick={() => update({ rerolledFrom: { leadership, movementDie: movement, originalMovementDie: originalMovement, dice: dice as number[], originalDice: original, reason: 'Sashimono' }, dice: [null, null], originalDice: undefined, movementDie: null, originalMovementDie: undefined })}>Use Sashimono reroll</Button> : null}
      {failed ? <>
        <SelectField label="In hand-to-hand combat?" value={combat} onChange={e => update({ combat: e.target.value })}><option value="">Choose the situation</option><option value="yes">Yes</option><option value="no">No</option></SelectField>
        {combat === 'no' ? <>
          <DieField label="Stupidity movement D6" sides={6} value={movement} onChange={value => update({ movementDie: value })} />
          <Button variant="secondary" disabled={originalMovement !== undefined} onClick={() => { const die = 1 + Math.floor(Math.random() * 6); update({ movementDie: die, originalMovementDie: die }) }}>Roll movement D6</Button>
          {originalMovement !== undefined ? <p className="text-sm text-ink-dim">App rolled movement {originalMovement}; any edit is recorded.</p> : null}
        </> : null}
        <p className="text-sm">No attacks or spells until the next own turn. Outside combat, a movement roll of 1–3 means straight ahead at half speed (no charge); 4–6 means standing inactive. Apply positioning and falls at the table.</p>
      </> : null}
    </div>
  </Sheet>
}
