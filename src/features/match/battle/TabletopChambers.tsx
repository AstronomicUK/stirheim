import { useState } from 'react'
import type { BattleLiveState, BattleEventRow, ItemRow } from '../../../domain'
import { withRollAttempt } from '../../../domain/battle'
import { blackpowderBlock, physicalGunKey, recordBlackpowderShot, correctBlackpowderShot } from '../../../domain/blackpowderShot'
import { doubleBarrelState, reloadDoubleBarrels, correctChamberReload } from '../../../domain/chambers'
import type { Combatant } from '../fight/combatants'
import { physicalWeaponChoices } from '../fight/weaponLoss'
import { pistolShootingOptions } from '../fight/pistolShooting'
import { reloadTurnsFor, doubleBarrelReloadSkill } from '../fight/reloadRules'
import type { DoubleBarrelSkillReload } from '../../../rules/types/roster'
import { findWeapon } from '../../../rules/data/weapons'
import { ChamberDisplay } from '../fight/ChamberDisplay'
import { Button, Notice, SelectField, Sheet, TextField } from '../../../ui'

const GUNS=['pistol','duelling_pistol','warplock_pistol','handgun','hochland_long_rifle','double_barrelled_pistol','double_barrelled_duelling_pistol','double_barrelled_handgun','ostlander_double_barrelled_pistol','ostlander_double_barrelled_hunting_rifle']
/** Players-calculated battles still need persistent ammunition, without opening the app's roller. */
export function TabletopChambers({warrior,items,events,sheet,ownTurn,readOnly,edit,reloadRule='none'}:{warrior:Combatant;items:readonly ItemRow[];events:readonly BattleEventRow[];sheet:BattleLiveState;ownTurn:number;readOnly:boolean;edit:(fn:(s:BattleLiveState)=>BattleLiveState)=>void;reloadRule?:DoubleBarrelSkillReload}) {
 const [open,setOpen]=useState(false),[model,setModel]=useState(0),[choices,setChoices]=useState<Record<string,1|2>>({}),[error,setError]=useState<string|null>(null),[reason,setReason]=useState(''),[reloadConfirmed,setReloadConfirmed]=useState(false)
 const size=Math.max(1,warrior.groupSize??1),slot=Math.min(model,size-1)
 const all=GUNS.flatMap(id=>physicalWeaponChoices(items,events,warrior.warbandId,warrior.id,id))
 const uneven=all.some(copy=>copy.snapshot.expected.quantity%size!==0)
 const copies=all.filter(copy=>size===1||Math.floor(copy.snapshot.copyIndex/(copy.snapshot.expected.quantity/size))===slot)
 if(!all.length)return null
 const gun=(copy:typeof all[number])=>({warriorId:warrior.id,modelIndex:slot,weaponKey:physicalGunKey(copy.snapshot,copy.key),name:copy.snapshot.name})
 function change(fn:(s:BattleLiveState)=>BattleLiveState) {try{fn(sheet);edit(fn);setError(null)}catch(e){setError(e instanceof Error?e.message:'Could not update ammunition.')}}
 return <div className="px-4 pb-3">
  <Button variant="ghost" disabled={readOnly} onClick={()=>setOpen(true)}>Manage ammunition</Button>
  <Sheet open={open} onClose={()=>setOpen(false)} title={`${warrior.name}: ammunition`}>
   <p className="text-sm text-ink-dim">Record shooting resolved at the table, including misses. Damage remains on your battle sheet. Own turn {ownTurn}.</p>
   {reloadRule==='extra_chamber'&&copies.some(copy=>doubleBarrelReloadSkill(copy.snapshot.weaponId,warrior.skillIds))?<p className="text-sm text-ink-dim">Hunter / Pistolier: automatic reloads allow two barrels, then one, then two on successive own turns. Record each shot normally; you do not need to skip shooting to reload.</p>:null}
   {size>1?<SelectField label="Model firing or reloading" value={slot} onChange={e=>{setModel(Number(e.target.value));setReloadConfirmed(false)}}>{Array.from({length:size},(_,i)=><option key={i} value={i}>Model {i+1}</option>)}</SelectField>:null}
   {uneven?<Notice>Assign equal equipment to the group before using per-model ammunition tracking.</Notice>:null}
   <div className="flex flex-col gap-3">{copies.map(copy=>{
    const weapon=findWeapon(copy.snapshot.weaponId)!,double=weapon.id.includes('double_barrelled'),ostland=weapon.id.startsWith('ostlander')
    const state=double?doubleBarrelState(sheet,gun(copy),ownTurn):null
    const pistol=weapon.id.includes('pistol')?pistolShootingOptions(sheet,warrior,items,events,weapon.id,copy.key,ownTurn,slot):null
    const block=state?.block??(!double?blackpowderBlock(sheet,warrior.id,physicalGunKey(copy.snapshot,copy.key),ownTurn):null)??(pistol?.remaining===0?'This model has used its pistol shots this own turn.':null)
    const loaded=state?.loaded??(block?0:1),count:1|2=ostland?loaded===1?1:2:choices[copy.key]??1
    return <ChamberDisplay key={copy.key} name={weapon.name} copy={copy.label} capacity={double?2:1} loaded={loaded} ready={!block&&!uneven} status={block??(double?`${count} barrel${count===1?'':'s'} selected`:'Loaded')} barrels={count} onBarrels={double&&!ostland?n=>setChoices(current=>({...current,[copy.key]:n})):undefined} disabled={readOnly}>
     <Button variant="secondary" disabled={readOnly||uneven||!!block||(double&&count>loaded)} onClick={()=>{const id=crypto.randomUUID(),at=new Date().toISOString();change(s=>{
      const next=recordBlackpowderShot(s,{id,at,warriorId:warrior.id,modelIndex:slot,weaponKey:physicalGunKey(copy.snapshot,copy.key),weaponName:weapon.name,heldWeapon:copy.snapshot,ownTurn,reloadTurns:double?1:reloadTurnsFor(weapon,warrior.skillIds,pistol?.pistolCount)??1,experimental:false,alternatingChamberReload:double&&reloadRule==='extra_chamber'&&!!doubleBarrelReloadSkill(weapon.id,warrior.skillIds),barrels:double?count:undefined},warrior.name)
      return withRollAttempt(next,{id,at,turn:s.turn,kind:'attack',status:'complete',label:`${warrior.name}: ${weapon.name} fired at the table`,rolls:[`Model ${slot+1}, ${copy.label}: ${double?count:1} barrel${double&&count===2?'s':''} spent, own turn ${ownTurn}. Hit and damage rolls resolved by the players.`]})
     });setReloadConfirmed(false)}}>Record shot at the table</Button>
    </ChamberDisplay>
   })}</div>
   {copies.some(copy=>copy.snapshot.weaponId.includes('double_barrelled'))?<div className="flex flex-col gap-2 py-3">
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={reloadConfirmed} onChange={e=>setReloadConfirmed(e.target.checked)}/>This model did not shoot any weapon this Shooting phase, and the phase has ended.</label>
    <Button variant="secondary" disabled={readOnly||uneven||!reloadConfirmed} onClick={()=>{const id=crypto.randomUUID(),at=new Date().toISOString();const extraKeys=reloadRule==='full_reload'?copies.filter(copy=>doubleBarrelReloadSkill(copy.snapshot.weaponId,warrior.skillIds)).map(copy=>gun(copy).weaponKey):[];change(s=>reloadDoubleBarrels(s,copies.filter(copy=>copy.snapshot.weaponId.includes('double_barrelled')).map(gun),ownTurn,id,at,extraKeys));setReloadConfirmed(false)}}>Reload spent barrels</Button>
   </div>:null}
   <details className="py-3 text-sm"><summary>Correct an ammunition record</summary>
    <TextField label="Reason for ammunition correction" value={reason} onChange={e=>setReason(e.target.value)}/>
    {sheet.blackpowderShots.filter(s=>s.warriorId===warrior.id&&!s.correction&&(s.modelIndex??0)===slot).map(s=><Button key={s.id} variant="ghost" disabled={readOnly||reason.trim().length<5} onClick={()=>change(current=>correctBlackpowderShot(current,s.id,reason))}>Correct shot: {s.weaponName}, own turn {s.ownTurn}</Button>)}
    {sheet.chamberReloads.filter(r=>r.warriorId===warrior.id&&!r.correction&&r.modelIndex===slot).map(r=><Button key={r.id} variant="ghost" disabled={readOnly||reason.trim().length<5} onClick={()=>change(current=>correctChamberReload(current,r.id,reason))}>Correct reload: {r.weaponName}, own turn {r.ownTurn}</Button>)}
   </details>
   {error?<Notice tone="error">{error}</Notice>:null}
  </Sheet>
 </div>
}
