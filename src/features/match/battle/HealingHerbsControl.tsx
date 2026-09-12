import { useState } from 'react'
import type { BattleLiveState, BattleEventRow, ItemRow } from '../../../domain'
import type { RosterWarband } from '../../../rules/types/roster'
import { Button, Notice, Sheet, TextField } from '../../../ui'
import { correctHealingHerbs, herbsRemaining, applyHealingHerbs } from './healingHerbs'

export function HealingHerbsControl({ warriorId, roster, items, sheet, rawSheet, events, singleUse, readOnly, edit }: { warriorId: string; roster: RosterWarband; items: readonly ItemRow[]; sheet: BattleLiveState; rawSheet: BattleLiveState; events: readonly BattleEventRow[]; singleUse: boolean; readOnly: boolean; edit: (fn: (s: BattleLiveState) => BattleLiveState) => void }) {
  const [useId, setUseId] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const carried = items.filter(item => item.holder_type === 'hero' && item.holder_id === warriorId && item.item_rules_id === 'healing_herbs')
  const available = carried.find(item => herbsRemaining(sheet, item) > 0)
  const previous = sheet.healingHerbUses.filter(use => use.warriorId === warriorId && !use.correction).at(-1)
  if (!carried.length && !previous) return null
  function confirmUse() {
    if (!useId || !available) return
    try {
      const options = { id: useId, singleUse, recoveryConfirmed: confirmed, outsideCombatConfirmed: confirmed }
      applyHealingHerbs(rawSheet, roster, events, available, options)
      edit(raw => { try { return applyHealingHerbs(raw, roster, events, available, options) } catch { return raw } })
      setUseId(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not use Healing Herbs.') }
  }
  return <div className="flex flex-col gap-2 px-4 pb-3">
    <Button variant="secondary" disabled={readOnly || !available} onClick={() => { setUseId(crypto.randomUUID()); setConfirmed(false); setError(null) }}>Use Healing Herbs</Button>
    {!available ? <p className="text-sm text-ink-dim">No unspent dose remains this battle.</p> : null}
    {previous ? <details className="text-sm"><summary className="cursor-pointer text-ink-dim">Correct the last Healing Herbs use</summary><TextField label="Reason for correcting the healing" value={reason} onChange={e => setReason(e.target.value)} /><Button variant="secondary" disabled={readOnly || !reason.trim()} onClick={() => { try { correctHealingHerbs(rawSheet, previous.id, reason); edit(raw => { try { return correctHealingHerbs(raw, previous.id, reason) } catch { return raw } }); setReason(''); setError(null) } catch (e) { setError(e instanceof Error ? e.message : 'Could not correct healing.') } }}>Undo healing{previous.singleUse ? ' and restore dose' : ''}</Button></details> : null}
    {error && !useId ? <Notice tone="error">{error}</Notice> : null}
    <Sheet open={useId !== null} onClose={() => setUseId(null)} title="Use Healing Herbs" footer={<Button block disabled={readOnly || !confirmed || !available} onClick={confirmUse}>Restore lost Wounds{singleUse ? ' and spend one dose' : ''}</Button>}>
      <p>Restore all Wounds this Hero has lost. This cannot bring an out-of-action Hero back into battle.</p>
      <p>{singleUse ? 'The campaign’s single-use house rule spends one dose. It will be deducted in the post-battle report.' : 'These herbs are reusable. No inventory is consumed.'}</p>
      <label className="flex items-start gap-2 py-3"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />It is the start of this Hero’s recovery phase, and they are not in hand-to-hand combat.</label>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </Sheet>
  </div>
}
