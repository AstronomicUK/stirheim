import { useState } from 'react'
import type { BattleLiveState, ItemRow } from '../../../domain'
import type { RosterWarband } from '../../../rules/types/roster'
import { Button, Notice, SelectField, TextField } from '../../../ui'
import { Card } from '../../roster/view/bits'
import { aleBarrels, aleDrunk, correctBugmansAle, drinkElvenWine } from './bugmansAle'

export function ElvenWineControl({ roster, items, sheet, readOnly, edit }: {
  roster: RosterWarband; items: readonly ItemRow[]; sheet: BattleLiveState; readOnly: boolean;
  edit: (fn: (sheet: BattleLiveState) => BattleLiveState) => void;
}) {
  const [rowId, setRowId] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const stock = aleBarrels(items, roster, 'elven_wine')
  const drunk = aleDrunk(sheet, 'elven_wine')
  if (!stock.length && !sheet.warbandConsumables.some(use => use.itemRulesId === 'elven_wine')) return null
  return <Card><div className="flex flex-col gap-3 p-4 text-sm">
    <h3 className="font-semibold">Elven Wine</h3>
    {drunk ? <>
      <p>The whole warband is immune to fear for this battle. One supply of wine will be deducted in the post-battle report.</p>
      <details><summary className="cursor-pointer">Correct this — the warband did not drink it</summary>
        <TextField label="Reason for correcting the wine" value={reason} onChange={e => setReason(e.target.value)} />
        <Button variant="ghost" disabled={readOnly || !reason.trim()} onClick={() => edit(s => correctBugmansAle(s, drunk.id, reason))}>Withdraw Elven Wine</Button>
      </details>
    </> : roster.warbandTemplateId !== 'shadow_warriors' ? <p>Only Shadow Warrior warbands may use Elven Wine.</p> : <>
      <p>Drink before the battle to make the whole warband immune to fear for this battle.</p>
      <SelectField label="Wine supply" value={rowId || stock[0]?.id || ''} disabled={readOnly} onChange={e => setRowId(e.target.value)}>
        {stock.map(row => <option key={row.id} value={row.id}>{row.holder_type === 'stash' ? 'Stash' : [...roster.heroes, ...roster.hiredSwords].find(w => w.id === row.holder_id)?.name ?? 'Warrior'} — {row.quantity} available</option>)}
      </SelectField>
      <label className="flex items-start gap-2"><input type="checkbox" checked={confirmed} disabled={readOnly} onChange={e => setConfirmed(e.target.checked)} />The warband drank the wine before the battle began.</label>
      <Button variant="secondary" disabled={readOnly || !confirmed || !stock.length} onClick={() => {
        const options = { id: crypto.randomUUID(), itemRowId: rowId || stock[0]?.id || '', confirmedBeforeBattle: confirmed }
        try { drinkElvenWine(sheet, roster, items, options); edit(s => drinkElvenWine(s, roster, items, options)); setError(''); setConfirmed(false) }
        catch (e) { setError(e instanceof Error ? e.message : 'Could not record the wine.') }
      }}>Record Elven Wine</Button>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </>}
  </div></Card>
}
