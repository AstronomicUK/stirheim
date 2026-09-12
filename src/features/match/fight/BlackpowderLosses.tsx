import { useState } from 'react'
import { attackEventPayloadSchema, pendingBlackpowderLosses, type AttackEventPayload, type BattleEventRow, type BattleLiveState } from '../../../domain'
import { Button, Notice } from '../../../ui'

export function BlackpowderLosses({ sheet, events, names, readOnly, onLog }: {
  sheet: BattleLiveState; events: BattleEventRow[]; names: Record<string,string>; readOnly: boolean;
  onLog: (payload: AttackEventPayload) => Promise<void>;
}) {
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState<string|null>(null)
  const pending=pendingBlackpowderLosses(sheet,events)
  if (!pending.length) return null
  return <Notice tone="warn" title="Destroyed equipment"><div className="flex flex-col gap-2">
    <p>Record the destroyed gun so its removal is included in the post-battle report. The explosion’s hit is resolved separately.</p>
    {pending.map(shot=><Button key={shot.id} variant="secondary" disabled={readOnly||busy} onClick={async()=>{
      if (busy) return
      setBusy(true);setError(null)
      const loss=shot.heldWeapon!,name=names[shot.warriorId]??shot.weaponName
      try {
        await onLog(attackEventPayloadSchema.parse({
          attacker_warband_id:loss.warbandId,attacker_id:shot.warriorId,attacker_kind:loss.holderType,attacker_name:name,
          target_warband_id:loss.warbandId,target_id:shot.warriorId,target_kind:loss.holderType,target_name:name,
          blackpowderLossShotId:shot.id,brokenWeapons:[loss],outcome:'Weapon destroyed',turn:sheet.turn,
          rolls:[`${shot.weaponName}: confirmed misfire D6 1 — BOOM. The selected carried copy is destroyed.`, 'Remove this copy when filing the post-battle report. Resolve the separate Strength 4 self-hit without critical hits.'],
        }))
      } catch(e) {setError(e instanceof Error?e.message:'Could not record the destroyed gun. Please try again.')}
      finally {setBusy(false)}
    }}>Record destroyed gun: {names[shot.warriorId]??shot.weaponName}</Button>)}
    {error?<p role="alert">{error}</p>:null}
  </div></Notice>
}
