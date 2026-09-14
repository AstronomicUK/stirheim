import {useState} from 'react'
import {withRollAttempt,type BattleLiveState} from '../../../domain/battle'
import type {RosterWarband} from '../../../rules/types/roster'
import {Button,Notice,TextField} from '../../../ui'
import {nagarytheCaptured} from './leadershipItems'
export function StandardStatus({roster,sheet,edit,readOnly}:{roster:RosterWarband;sheet:BattleLiveState;edit:(fn:(s:BattleLiveState)=>BattleLiveState)=>void;readOnly:boolean}) {
 const [reason,setReason]=useState('')
 if(roster.warbandTemplateId!=='shadow_warriors'||![...roster.heroes,...roster.henchmenGroups].some(w=>w.equipment.some(i=>i.itemId==='standard_of_nagarythe'&&i.quantity>0)))return null
 const captured=nagarytheCaptured(roster,sheet),declared=sheet.preBattle['nagarythe:captured']==='yes'
 function record(value:boolean){edit(s=>withRollAttempt({...s,preBattle:{...s.preBattle,'nagarythe:captured':value?'yes':'no'}},{id:crypto.randomUUID(),at:new Date().toISOString(),turn:s.turn,kind:'attack',status:'complete',label:value?'Standard of Nagarythe captured':'Standard capture corrected',rolls:[value?'Player confirmed the standard bearer was taken out of action. Shadow Warriors gain Hatred for the rest of this battle and cannot voluntarily Rout; hired swords are unaffected.':`Player correction: ${reason.trim()}. Earlier attacks are unchanged.`]}))}
 return captured?<Notice tone="warn" title="Standard of Nagarythe captured"><p>Shadow Warriors hate the enemy for the rest of this battle and cannot voluntarily Rout. Hired swords are unaffected. Failed Rout tests still apply.</p>{declared?<details className="mt-2"><summary className="cursor-pointer text-sm">Correct the capture declaration</summary><TextField label="Correction reason" value={reason} onChange={e=>setReason(e.target.value)}/><Button disabled={readOnly||!reason.trim()} variant="secondary" onClick={()=>record(false)}>Withdraw declaration</Button></details>:null}</Notice>:<details className="rounded-md border border-border p-3 text-sm"><summary className="cursor-pointer">Standard of Nagarythe</summary><p className="mt-2">If its bearer is taken out of action, the standard is captured. This is detected from individual casualties; for an unidentified bearer within a group, record it here.</p><Button variant="secondary" disabled={readOnly} onClick={()=>record(true)}>Standard bearer taken out of action</Button></details>
}
