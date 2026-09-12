import { useState } from 'react'
import type { BattleLiveState } from '../../../domain'
import { withRollAttempt } from '../../../domain/battle'
import type { RosterWarband } from '../../../rules/types/roster'
import { Button, SelectField, TextField } from '../../../ui'
import { canUseRelic, passTableWithRelic, recordLeadershipTest, correctLeadershipDeclaration, correctableDeclarations, describeDeclaration } from './relicRules'

export function RelicLeadershipControl({ roster, warriorId, name, sheet, readOnly, edit }: {
  roster: RosterWarband; warriorId: string; name: string; sheet: BattleLiveState; readOnly: boolean;
  edit: (fn: (sheet: BattleLiveState) => BattleLiveState) => void;
}) {
  const [test, setTest] = useState('Fear')
  const [other, setOther] = useState('')
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const bearer = [...roster.heroes, ...roster.hiredSwords, ...roster.henchmenGroups.filter(group => group.size === 1)].find(w => w.id === warriorId)
  if (!bearer?.equipment.some(item => item.itemId === 'holy_unholy_relic' && item.quantity > 0)) return null
  const available = canUseRelic(roster, sheet, warriorId)
  const label = test === 'Other' ? other.trim() : test
  return <details className="rounded-md border border-border p-3 text-sm">
    <summary className="cursor-pointer">Holy (Unholy) Relic · {available ? 'first Leadership test' : 'benefit spent'}</summary>
    {available ? <div className="mt-2 flex flex-col gap-2">
      <p>Automatically pass the bearer’s first Leadership test this battle. Resolve movement and distances at the table.</p>
      <SelectField label={`${name}: relic Leadership test`} value={test} onChange={event => setTest(event.target.value)}><option>Fear</option><option>All Alone</option><option>Other</option></SelectField>
      {test === 'Other' ? <TextField label="Leadership test name" value={other} onChange={event => setOther(event.target.value)} /> : null}
      <label className="flex items-center gap-2"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />This is this warrior’s first Leadership test of the battle.</label>
      <Button variant="secondary" disabled={readOnly || !confirmed || !label} onClick={() => edit(state => passTableWithRelic(roster, state, warriorId, name, label, confirmed))}>Pass this test with the relic</Button>
      <Button variant="ghost" disabled={readOnly} onClick={() => {
        const id = crypto.randomUUID()
        edit(state => withRollAttempt(recordLeadershipTest(state, warriorId, 'table'), { id, at: new Date().toISOString(), turn: state.turn, kind: 'attack', status: 'complete', label: `${name}: earlier Leadership test confirmed`, rolls: ['Player confirmed an earlier test at the table. The relic cannot automatically pass a later Leadership test.'] }))
      }}>Already tested at the table</Button>
    </div> : <p className="mt-2">The first Leadership test has been recorded. Carrying another relic does not grant another automatic pass.</p>}
    {correctableDeclarations(sheet, warriorId).length > 0 ? <details className="mt-2"><summary className="cursor-pointer">Correct a Leadership declaration</summary>
      <p className="mt-1 text-xs text-ink-dim">Withdraws a declaration made in error — a relic pass that was not the first test, or the wrong warrior — with the reason on the record. Rolled tests and their outcomes are untouched.</p>
      <TextField label={`${name}: Leadership correction reason`} value={reason} onChange={event => setReason(event.target.value)} />
      {correctableDeclarations(sheet, warriorId).map(test => <Button key={test.id} variant="ghost" disabled={readOnly || !reason.trim()} onClick={() => { edit(state => correctLeadershipDeclaration(state, test.id!, reason)); setReason('') }}>Correct {describeDeclaration(test)}</Button>)}
    </details> : null}
  </details>
}
