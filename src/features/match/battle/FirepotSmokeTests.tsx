import { useState } from 'react'
import type { BattleTurns } from '../../../api/battleTurns'
import { recordSmokeTest,smokeEventsThisTurn,warbandTurnKey,type BattleEventRow,type BattleLiveState } from '../../../domain'
import type { RosterWarband } from '../../../rules/types/roster'
import type { WarbandTemplate } from '../../../rules/types'
import { Button,DieField,Notice,NumberField,Sheet,TextField } from '../../../ui'
import { combatantsOf,type BattleBoosts } from '../fight/combatants'

export function FirepotSmokeTests({roster,template,sheet,events,turns,boosts,edit}:{roster:RosterWarband;template?:WarbandTemplate;sheet:BattleLiveState;events:BattleEventRow[];turns?:BattleTurns|null;boosts:BattleBoosts;edit:(fn:(s:BattleLiveState)=>BattleLiveState)=>void}) {
 const [picked,setPicked]=useState<string|null>(null)
 const key=warbandTurnKey(roster.id,sheet.turn,turns)
 const warriors=combatantsOf(roster,template,roster.name,sheet,boosts)
 const due=smokeEventsThisTurn(events,roster.id,key).filter(e=>warriors.some(w=>w.id===e.payload.target_id&&!w.out))
 if(!due.length||turns?.finished)return null
 const mine=!turns||turns.turn_order[turns.active_index]===roster.id
 const event=due.find(e=>e.id===picked)
 return <Notice title="Firepot smoke — start-of-turn tests" tone="warn"><div className="flex flex-col gap-3">
   <p>Roll under Initiative to see through the smoke. On failure, no charging or shooting until the next own turn; other movement and melee are unaffected.</p>
   {due.map((e,index)=>{const test=sheet.smokeTests.find(t=>t.eventId===e.id);return <div key={e.id} className="flex flex-wrap items-center justify-between gap-2"><span>{e.payload.target_name} — smoke hit {index+1}{test?.failed!==undefined?test.failed?' — failed':' — passed':''}</span>{e.payload.target_size===1?<Button variant="secondary" disabled={!mine} onClick={()=>setPicked(e.id)}>{test?.failed!==undefined?'Correct smoke test':`Test smoke: ${e.payload.target_name}`}</Button>:<p>Test the affected model at the table; this group has multiple members.</p>}</div>})}
   {event&&mine&&event.payload.target_size===1?<SmokeTest key={`${event.id}:${key}`} event={event} turnKey={key} initiative={warriors.find(w=>w.id===event.payload.target_id)!.stats.I} sheet={sheet} edit={edit} close={()=>setPicked(null)}/>:null}
 </div></Notice>
}
function SmokeTest({event,turnKey,initiative:baseInitiative,sheet,edit,close}:{event:BattleEventRow;turnKey:string;initiative:number;sheet:BattleLiveState;edit:(fn:(s:BattleLiveState)=>BattleLiveState)=>void;close:()=>void}) {
 const previous=sheet.smokeTests.find(t=>t.eventId===event.id)
 const correction=previous?.failed!==undefined
 const [attemptId]=useState(()=>!correction&&previous?previous.attemptId:crypto.randomUUID())
 const [die,setDie]=useState<number|null>(!correction?previous?.die??null:null)
 const [original,setOriginal]=useState<number|undefined>(!correction?previous?.originalDie:undefined)
 const [initiative,setInitiative]=useState(previous?.initiative??baseInitiative)
 const [reason,setReason]=useState('')
 const allowed=(!(correction||initiative!==baseInitiative)||Boolean(reason.trim()))&&Number.isFinite(initiative)&&initiative>=0
 const valid=die!==null&&Number.isInteger(die)&&die>=1&&die<=6
 return <Sheet open title={`${event.payload.target_name}: smoke test`} onClose={close} footer={<Button block disabled={!valid||!allowed} onClick={()=>{edit(s=>recordSmokeTest(s,event,turnKey,initiative,die!,original,attemptId,reason));close()}}>Record smoke test</Button>}><div className="flex flex-col gap-4 p-4">
   <p>Roll strictly below Initiative. A 6 always fails.</p>
   <NumberField label="Initiative for smoke test" value={initiative} onChange={value=>setInitiative(value??Number.NaN)} allowEmpty/>
   {correction||initiative!==baseInitiative?<TextField label="Reason for smoke-test correction" value={reason} onChange={e=>setReason(e.target.value)} hint="Explain the replacement test or Initiative adjustment."/>:null}
   <DieField label="Smoke test D6" sides={6} value={die} onChange={setDie}/>
   <Button variant="secondary" disabled={!allowed||original!==undefined} onClick={()=>{const n=1+Math.floor(Math.random()*6);setDie(n);setOriginal(n);edit(s=>recordSmokeTest(s,event,turnKey,initiative,n,n,attemptId,reason,true))}}>Roll smoke test D6</Button>
   {original!==undefined?<p>App rolled {original}; any edit is kept with the original.</p>:null}
   {valid?<p>{die!<initiative&&die!==6?'Can see through the smoke.':'No charging or shooting until next own turn.'}</p>:null}
 </div></Sheet>
}
