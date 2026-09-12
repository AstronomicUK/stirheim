import { useState } from 'react'
import type { BattleLiveState } from '../../../domain'
import { Button, SelectField, TextField } from '../../../ui'
import { correctItemRoll } from './sheet'

export function ItemRollCorrection({ warriorId, warriorName, sheet, readOnly, edit }: {
  warriorId: string; warriorName: string; sheet: BattleLiveState; readOnly: boolean;
  edit: (fn: (state: BattleLiveState) => BattleLiveState) => void;
}) {
  const [reason, setReason] = useState('')
  const [value, setValue] = useState('')
  const current = sheet.preBattle[`itemRoll:${warriorId}:crimson_shade`]
  const selected = value || String(Number.parseInt(current, 10))
  return <details className="text-xs">
    <summary className="cursor-pointer py-2">Correct Crimson Shade Initiative</summary>
    <div className="flex flex-col gap-2">
      <p>The original roll stays in the record. This changes future calculations; correct earlier affected attacks separately in the combat log.</p>
      <SelectField label="Corrected Initiative bonus" value={selected} disabled={readOnly} onChange={event => setValue(event.target.value)}>
        {[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
      </SelectField>
      <TextField label="Reason for Initiative correction" value={reason} disabled={readOnly} onChange={event => setReason(event.target.value)} />
      <Button variant="secondary" disabled={readOnly || !reason.trim() || Number(selected) === Number.parseInt(current, 10)} onClick={() => {
        edit(state => correctItemRoll(state, warriorId, Number(selected), reason, warriorName, current))
        setReason('')
      }}>Record Initiative correction</Button>
    </div>
  </details>
}
