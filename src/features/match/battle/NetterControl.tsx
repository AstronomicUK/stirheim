import { NETTER, spendNetterNet } from './netter'
import { useState } from 'react'
import { type BattleLiveState } from '../../../domain/battle'
import type { RosterHero } from '../../../rules/types/roster'
import { Button, TextField } from '../../../ui'
/** Battle-scoped supply: never creates inventory that could be sold or passed to another warrior. */
export function NetterControl({hero, sheet, edit, readOnly}: {hero:RosterHero; sheet:BattleLiveState; edit:(fn:(s:BattleLiveState)=>BattleLiveState)=>void; readOnly:boolean}) {
  const [reason,setReason]=useState('')
  if (!hero.skillIds.includes(NETTER)) return null
  const used=sheet.netterNetsUsed?.[hero.id]??0
  return <div className="flex flex-col gap-2 px-4 pb-3 text-sm"><p>Netter · {3-used} of 3 nets remaining</p><p className="text-xs text-ink-dim">Three free nets each battle. Resolve the net at the table, then record its use here.</p><Button variant="secondary" disabled={readOnly||used===3} onClick={()=>edit(s=>spendNetterNet(s,hero))}>Use a free net</Button>{used>0?<details><summary>Correct a net use</summary><TextField label="Reason for restoring a net" value={reason} onChange={e=>setReason(e.target.value)}/><Button disabled={readOnly||!reason.trim()} onClick={()=>{edit(s=>spendNetterNet(s,hero,reason));setReason('')}}>Restore one net</Button></details>:null}</div>
}
