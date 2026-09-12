import { withRollAttempt, type BattleLiveState } from './battle'
export interface ChamberGun { warriorId:string; modelIndex:number; weaponKey:string; name:string }
const gunKey=(shot:BattleLiveState['blackpowderShots'][number])=>shot.heldWeapon?`item:${shot.heldWeapon.itemId}:${shot.heldWeapon.copyIndex}`:shot.weaponKey
/** Two barrels are tracked separately from legacy whole-weapon reload cadence. No reload is assumed
 * while the player may have fired another weapon: they confirm reload at the end of Shooting. */
export function doubleBarrelState(sheet:BattleLiveState,gun:ChamberGun,ownTurn:number){
 const shots=sheet.blackpowderShots.filter(s=>!s.correction&&s.warriorId===gun.warriorId&&(s.modelIndex??0)===gun.modelIndex&&gunKey(s)===gun.weaponKey&&s.ownTurn<=ownTurn)
 const reloads=sheet.chamberReloads.filter(r=>!r.correction&&r.warriorId===gun.warriorId&&r.modelIndex===gun.modelIndex&&r.weaponKey===gun.weaponKey&&r.ownTurn<=ownTurn)
 const events=[...shots.map(s=>({turn:s.ownTurn,at:s.at,id:s.id,delta:-(s.barrels??1)})),...reloads.map(r=>({turn:r.ownTurn,at:r.at,id:r.id,delta:r.amount}))].sort((a,b)=>a.turn-b.turn||a.at.localeCompare(b.at)||a.id.localeCompare(b.id))
 let loaded=2,inconsistent=false
 for(const event of events){loaded+=event.delta;if(loaded<0||loaded>2)inconsistent=true;loaded=Math.max(0,Math.min(2,loaded))}
 const reloadedThisTurn=sheet.chamberReloads.some(r=>!r.correction&&r.warriorId===gun.warriorId&&r.modelIndex===gun.modelIndex&&r.ownTurn===ownTurn)
 const firedThisTurn=shots.some(s=>s.ownTurn===ownTurn)
 const block=inconsistent?'A corrected shot conflicts with later chamber records. Correct those records before firing.'
  :shots.some(s=>s.misfirePending)?'Confirm the pending misfire before firing.'
  :shots.some(s=>s.misfireDie===1)?'This weapon was destroyed.'
  :shots.some(s=>s.misfireDie===2)?'This weapon is jammed for the battle.'
  :shots.some(s=>s.misfireDie===3&&ownTurn<=s.ownTurn+1)?'The misfire prevents firing this turn.'
  :firedThisTurn?'This weapon has already fired this own turn.'
  :reloadedThisTurn?'Reloaded this Shooting phase; ready to fire next own turn.'
  :loaded===0?'Both barrels are empty. Reload at the end of a Shooting phase.':null
 return {loaded:loaded as 0|1|2,block,firedThisTurn,reloadedThisTurn,inconsistent}
}
/** RAW Nuln: one barrel per physical weapon at the end of a non-firing Shooting phase. */
export function reloadDoubleBarrels(sheet:BattleLiveState,guns:ChamberGun[],ownTurn:number,id:string,at:string):BattleLiveState{
 if(!Number.isInteger(ownTurn)||ownTurn<0)throw Error('A valid own turn is required.')
 if(!id.trim()||!Number.isFinite(Date.parse(at)))throw Error('A reload identifier and valid time are required.')
 if(guns.some(g=>!g.warriorId.trim()||!g.weaponKey.trim()||!Number.isInteger(g.modelIndex)||g.modelIndex<0))throw Error('A valid model and physical weapon are required.')
 if(sheet.chamberReloads.some(r=>r.id.startsWith(`${id}:`)))return sheet
 if(!guns.length)return sheet
 const first=guns[0]
 if(guns.some(g=>g.warriorId!==first.warriorId||g.modelIndex!==first.modelIndex))throw Error('Reload weapons belonging to one model at a time.')
 if(new Set(guns.map(g=>g.weaponKey)).size!==guns.length)throw Error('The same physical weapon was selected twice.')
 if(sheet.blackpowderShots.some(s=>!s.correction&&s.warriorId===first.warriorId&&(s.modelIndex??0)===first.modelIndex&&s.ownTurn===ownTurn))throw Error('This model has fired this Shooting phase and cannot reload now.')
 const additions=[]
 for(const gun of guns){
  if(sheet.chamberReloads.some(r=>!r.correction&&r.warriorId===gun.warriorId&&r.modelIndex===gun.modelIndex&&r.weaponKey===gun.weaponKey&&r.ownTurn===ownTurn))throw Error('This weapon has already reloaded in this own turn.')
  const state=doubleBarrelState(sheet,gun,ownTurn)
  if(state.inconsistent||state.block?.includes('pending misfire'))throw Error(state.block!)
  if(state.loaded===2)continue
  if(state.block?.includes('destroyed')||state.block?.includes('jammed'))continue
  additions.push({id:`${id}:${gun.weaponKey}`,warriorId:gun.warriorId,modelIndex:gun.modelIndex,weaponKey:gun.weaponKey,weaponName:gun.name,ownTurn,amount:1,at})
 }
 if(!additions.length)throw Error('There are no spent, usable barrels to reload.')
 return withRollAttempt({...sheet,chamberReloads:[...sheet.chamberReloads,...additions]}, {id,at,turn:sheet.turn,kind:'attack',status:'complete',label:'Blackpowder reload',rolls:additions.map(r=>`${r.weaponName}: reloaded 1 barrel at the end of Shooting, own turn ${ownTurn}. Cannot fire in this phase.`)})
}
export function correctChamberReload(sheet:BattleLiveState,id:string,reason:string){
 if(reason.trim().length<5)throw Error('Explain the reload correction.')
 const event=sheet.chamberReloads.find(r=>r.id===id&&!r.correction)
 if(!event)return sheet
 return withRollAttempt({...sheet,chamberReloads:sheet.chamberReloads.map(r=>r.id===id?{...r,correction:reason.trim()}:r)}, {id:`correct:${id}`,at:new Date().toISOString(),turn:sheet.turn,kind:'attack',status:'complete',label:`${event.weaponName}: reload corrected`,rolls:[reason.trim(),'The original reload remains in the history.']})
}
