import { withRollAttempt, type BattleLiveState } from './battle'
import type { BattleEventRow } from './battleEvent'

export function nextOwnTurnKey(key: string): string {
  const split=key.lastIndexOf(':')
  return `${key.slice(0,split)}:${Number(key.slice(split+1))+1}`
}
export function smokeEventsThisTurn(events: readonly BattleEventRow[],warbandId: string,turnKey: string) {
  return events.filter(e=>!e.reverted_at&&e.payload.target_warband_id===warbandId&&e.payload.smokeDueTurnKey===turnKey)
}
export function smokeBlocksWarrior(state: BattleLiveState,events: readonly BattleEventRow[],warriorId:string,turnKey:string):boolean {
  return state.smokeTests.some(t=>t.warriorId===warriorId&&t.turnKey===turnKey&&t.failed&&events.some(e=>e.id===t.eventId&&!e.reverted_at&&e.payload.target_size===1))
}
export function recordSmokeTest(state:BattleLiveState,event:BattleEventRow,turnKey:string,initiative:number,die:number,originalDie:number|undefined,attemptId:string,reason='',pending=false):BattleLiveState {
  if(event.reverted_at||event.payload.smokeDueTurnKey!==turnKey||event.payload.target_size!==1)throw new Error('This smoke test is not due for an individually identified warrior this turn.')
  if(!Number.isInteger(die)||die<1||die>6||originalDie!==undefined&&(!Number.isInteger(originalDie)||originalDie<1||originalDie>6))throw new Error('Enter a D6 result from 1 to 6.')
  if(!Number.isFinite(initiative)||initiative<0)throw new Error('Enter the warrior’s Initiative.')
  const old=state.smokeTests.find(t=>t.eventId===event.id)
  if(old&&old.attemptId!==attemptId&&!reason.trim())throw new Error('Explain why the smoke test is being replaced.')
  const failed=die===6||die>=initiative
  const result={eventId:event.id,warriorId:event.payload.target_id,turnKey,attemptId,initiative,originalDie,die,failed:pending?undefined:failed}
  return withRollAttempt({...state,smokeTests:[...state.smokeTests.filter(t=>t.eventId!==event.id),result]}, {
    id:attemptId,at:new Date().toISOString(),turn:state.turn,kind:'attack',status:pending?'incomplete':'complete',label:`${event.payload.target_name}: smoke test ${pending?'in progress':failed?'failed':'passed'}`,
    rolls:[...(reason.trim()?[`Correction: ${reason.trim()}`]:[]),originalDie===undefined?`Player entered ${die}.`:`App rolled ${originalDie}${die!==originalDie?`; player changed it to ${die}`:''}.`, `Must roll under Initiative ${initiative}; 6 always fails.`,pending?'Awaiting confirmation.':failed?'Cannot charge or shoot until next own turn; other movement and melee are unaffected.':'Can see through the smoke; no restriction.']
  })
}
