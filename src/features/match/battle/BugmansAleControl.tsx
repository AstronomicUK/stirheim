import { useState } from 'react'
import type { BattleLiveState, ItemRow } from '../../../domain'
import type { WarbandTemplate } from '../../../rules/types'
import type { RosterWarband } from '../../../rules/types/roster'
import { Button, Notice, SelectField, TextField } from '../../../ui'
import { Card } from '../../roster/view/bits'
import { aleBarrels, aleDrunk, correctBugmansAle, describeBarrel, drinkBugmansAle, isElvenWarband, warbandConsumables } from './bugmansAle'

/**
 * Bugman's Ale is drunk by the warband, not a warrior, so it lives at the top of My Warband rather than
 * on a card: where the barrel is, one confirmation, the drink, then the status and a reasoned correction.
 */
export function BugmansAleControl({ roster, template, items, sheet, readOnly, edit }: {
  roster: RosterWarband; template: WarbandTemplate | undefined; items: readonly ItemRow[]; sheet: BattleLiveState; readOnly: boolean;
  edit: (fn: (sheet: BattleLiveState) => BattleLiveState) => void
}) {
  const [confirmed, setConfirmed] = useState(false)
  const [barrelRowId, setBarrelRowId] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const barrels = aleBarrels(items, roster)
  const drunk = aleDrunk(sheet)
  const history = warbandConsumables(sheet).filter(c => c.itemRulesId === 'bugmans_ale')
  if (!barrels.length && !history.length) return null
  const elven = isElvenWarband(template)
  return (
    <Card>
      <details className="p-4 text-sm" open={!drunk || undefined}>
        <summary className="cursor-pointer font-semibold text-ink">Bugman’s Ale · {drunk ? 'drunk this battle — immune to fear' : elven ? 'Elves may not drink it' : barrels.length ? `barrel ${describeBarrel(barrels[0], roster)}` : 'no barrel left'}</summary>
        <div className="mt-2 flex flex-col gap-2">
          {drunk ? (
            <>
              <p>The whole warband is immune to fear for this battle (Elves excepted). One barrel will be deducted in the post-battle report.</p>
              <details>
                <summary className="cursor-pointer text-ink-dim">Correct this — the warband did not drink it</summary>
                <TextField label="Reason for correcting the ale" value={reason} onChange={e => setReason(e.target.value)} />
                <Button variant="ghost" disabled={readOnly || !reason.trim()} onClick={() => { edit(s => correctBugmansAle(s, drunk.id, reason)); setReason('') }}>Withdraw the Bugman’s Ale</Button>
              </details>
            </>
          ) : elven ? (
            <p>Elves are far too delicate to cope with its effects; the barrel stays in the stash.</p>
          ) : barrels.length ? (
            <>
              <p>A warband that drinks a barrel before a battle is immune to fear for the whole battle. One barrel supplies one battle.</p>
              {barrels.length > 1 ? (
                <SelectField label="Which barrel" value={barrelRowId || barrels[0].id} onChange={e => setBarrelRowId(e.target.value)}>
                  {barrels.map(b => <option key={b.id} value={b.id}>{describeBarrel(b, roster)}</option>)}
                </SelectField>
              ) : null}
              <label className="flex items-start gap-2"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />The warband drank the barrel before the battle began.</label>
              <Button variant="secondary" disabled={readOnly || !confirmed} onClick={() => {
                const id = crypto.randomUUID()
                try {
                  drinkBugmansAle(sheet, roster, template, items, { id, barrelRowId: barrelRowId || undefined, confirmedBeforeBattle: confirmed })
                  edit(s => { try { return drinkBugmansAle(s, roster, template, items, { id, barrelRowId: barrelRowId || undefined, confirmedBeforeBattle: confirmed }) } catch { return s } })
                  setConfirmed(false); setError(null)
                } catch (e) { setError(e instanceof Error ? e.message : 'Could not record the ale.') }
              }}>The warband drinks the ale</Button>
              {error ? <Notice tone="error">{error}</Notice> : null}
            </>
          ) : (
            <p>The barrel drunk earlier was withdrawn and no other barrel remains.</p>
          )}
        </div>
      </details>
    </Card>
  )
}
