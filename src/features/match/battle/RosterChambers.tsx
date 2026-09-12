import { useBattleTurns } from '../../../api/battleTurns'
import { warbandTurnKey, type BattleLiveState, type BattleEventRow, type ItemRow } from '../../../domain'
import { blackpowderBlock, physicalGunKey } from '../../../domain/blackpowderShot'
import { physicalWeaponChoices } from '../fight/weaponLoss'
import '../fight/chambers.css'

/** Read-only summary using the same physical copies and reload availability as firing controls. */
export function RosterChambers({warbandId,warriorId,items,events,sheet,matchId,groupSize=1}:{warbandId:string;warriorId:string;items:readonly ItemRow[];events:readonly BattleEventRow[];sheet:BattleLiveState;matchId?:string;groupSize?:number}) {
 const turns=useBattleTurns(matchId??'')
 const ownTurn=Number(warbandTurnKey(warbandId,sheet.turn,turns.data).split(':').at(-1))
 const copies=['pistol','duelling_pistol','warplock_pistol','handgun','hochland_long_rifle'].flatMap(id=>physicalWeaponChoices(items,events,warbandId,warriorId,id))
 if(!copies.length)return null
 return <div className="roster-chambers" aria-label="Blackpowder ammunition">{copies.map(copy=>{
  const blocked=blackpowderBlock(sheet,warriorId,physicalGunKey(copy.snapshot,copy.key),ownTurn)
  const size=Math.max(1,groupSize)
  const model=size>1&&copy.snapshot.expected.quantity%size===0?Math.floor(copy.snapshot.copyIndex/(copy.snapshot.expected.quantity/size))+1:null
  const label=`${model?`Model ${model} · `:''}${copy.label}`
  return <div className="roster-chamber" key={copy.key}>
   <span className="chamber-rim" aria-hidden="true"><span className="chamber-bore">{!blocked&&<span className="chamber-ball"/>}</span></span>
   <div><span className="roster-chamber-name">{label}</span><span className="roster-chamber-state">{blocked??'1 / 1 loaded'}</span></div>
  </div>
 })}</div>
}
