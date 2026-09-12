import { doubleBarrelState } from '../../../domain/chambers'
import { useBattleTurns } from '../../../api/battleTurns'
import { warbandTurnKey, type BattleLiveState, type BattleEventRow, type ItemRow } from '../../../domain'
import { blackpowderBlock, physicalGunKey } from '../../../domain/blackpowderShot'
import { physicalWeaponChoices } from '../fight/weaponLoss'
import '../fight/chambers.css'

/** Read-only summary using the same physical copies and reload availability as firing controls. */
export function RosterChambers({warbandId,warriorId,items,events,sheet,matchId,groupSize=1}:{warbandId:string;warriorId:string;items:readonly ItemRow[];events:readonly BattleEventRow[];sheet:BattleLiveState;matchId?:string;groupSize?:number}) {
 const turns=useBattleTurns(matchId??'')
 const ownTurn=Number(warbandTurnKey(warbandId,sheet.turn,turns.data).split(':').at(-1))
 const copies=['pistol','duelling_pistol','warplock_pistol','handgun','hochland_long_rifle','double_barrelled_pistol','double_barrelled_duelling_pistol','double_barrelled_handgun','ostlander_double_barrelled_pistol','ostlander_double_barrelled_hunting_rifle'].flatMap(id=>physicalWeaponChoices(items,events,warbandId,warriorId,id))
 if(!copies.length)return null
 return <div className="roster-chambers" aria-label="Blackpowder ammunition">{copies.map(copy=>{
  const size=Math.max(1,groupSize)
  const model=size>1&&copy.snapshot.expected.quantity%size===0?Math.floor(copy.snapshot.copyIndex/(copy.snapshot.expected.quantity/size))+1:null
  const capacity=copy.snapshot.weaponId.includes('double_barrelled_')?2:1
  const state=capacity===2?doubleBarrelState(sheet,{warriorId,modelIndex:model?model-1:0,weaponKey:physicalGunKey(copy.snapshot,copy.key),name:copy.snapshot.name},ownTurn):null
  const blocked=state?.block??(capacity===1?blackpowderBlock(sheet,warriorId,physicalGunKey(copy.snapshot,copy.key),ownTurn):null)
  const loaded=state?state.loaded:blocked?0:1
  const label=`${model?`Model ${model} · `:''}${copy.label}`
  return <div className="roster-chamber" key={copy.key}>
   <span className="flex gap-1" aria-hidden="true">{Array.from({length:capacity},(_,i)=><span key={i} className="chamber-rim"><span className="chamber-bore">{i<loaded&&<span className="chamber-ball"/>}</span></span>)}</span>
   <div><span className="roster-chamber-name">{label}</span><span className="roster-chamber-state">{blocked??`${loaded} / ${capacity} loaded`}</span></div>
  </div>
 })}</div>
}
