import { expect, it } from 'vitest'
import { emptyBattleLiveState, parseBattleLiveState } from '../../../domain/battle'
import type { ItemRow } from '../../../domain'
import { weaponLossSnapshot } from '../../../domain/weaponLoss'
import { blackpowderBlock, physicalGunKey } from '../../../domain/blackpowderShot'
import { beginPistolCombat, recordCombatPistolUse, correctCombatPistol, pistolCombatBlock } from './pistolCombat'
const row={id:'11111111-1111-4111-8111-111111111111',warband_id:'22222222-2222-4222-8222-222222222222',holder_id:'33333333-3333-4333-8333-333333333333',holder_type:'hero',item_rules_id:'pistol',quantity:2,custom_name:null,notes:''} as ItemRow
const weapon=weaponLossSnapshot(row,'pistol','Pistol',1,0)
const start=()=>beginPistolCombat(emptyBattleLiveState(),'hero:0','Captain','phase1','combat1','Charged a new enemy')
const args={id:'shot1',modelKey:'hero:0',warriorId:'33333333-3333-4333-8333-333333333333',name:'Captain',weapon,mode:'single' as const,phaseKey:'phase1',ownTurn:1,reloadTurns:1}
it('spends once per combat and shares reload state, surviving a new turn and reload',()=>{
 let s=recordCombatPistolUse(start(),args)
 s=parseBattleLiveState(JSON.parse(JSON.stringify(s)))
 expect(pistolCombatBlock(s,'hero:0','33333333-3333-4333-8333-333333333333',weapon,'single','phase3',3)).toContain('already')
 expect(blackpowderBlock(s,'33333333-3333-4333-8333-333333333333',physicalGunKey(weapon,''),2)).toContain('turn 3')
 expect(recordCombatPistolUse(s,args)).toBe(s)
 const newCombat=beginPistolCombat(s,'hero:0','Captain','phase2','combat2','The earlier melee ended; charged again')
 expect(pistolCombatBlock(newCombat,'hero:0','33333333-3333-4333-8333-333333333333',weapon,'single','phase2',2)).toContain('turn 3')
 const corrected=correctCombatPistol(s,'shot1','Wrong pistol selected')
 expect(pistolCombatBlock(corrected,'hero:0','33333333-3333-4333-8333-333333333333',weapon,'single','phase1',1)).toBeNull()
 expect(corrected.rollAttempts.at(-1)?.rolls[0]).toContain('Wrong pistol selected')
})
it('allows two distinct brace pistols only in the opening round, never a third or a mixed single/brace reset',()=>{
 let s=recordCombatPistolUse(start(),{...args,mode:'brace'})
 const second=weaponLossSnapshot(row,'pistol','Pistol',1,1)
 expect(pistolCombatBlock(s,'hero:0','33333333-3333-4333-8333-333333333333',second,'brace','phase2',2)).toContain('first round')
 s=recordCombatPistolUse(s,{...args,id:'shot2',weapon:second,mode:'brace'})
 expect(s.pistolCombatUses).toHaveLength(2)
 expect(pistolCombatBlock(s,'hero:0','33333333-3333-4333-8333-333333333333',weaponLossSnapshot({...row,quantity:3},'pistol','Pistol',1,2),'brace','phase1',1)).toContain('used')
 expect(pistolCombatBlock(recordCombatPistolUse(start(),args),'hero:0','33333333-3333-4333-8333-333333333333',second,'brace','phase1',1)).toContain('used')
})
it('keeps the crossbow opener separate, without a blackpowder reload charge',()=>{
 const bow=weaponLossSnapshot({...row,item_rules_id:'crossbow_pistol'},'crossbow_pistol','Crossbow pistol',1,0)
 const s=recordCombatPistolUse(start(),{...args,weapon:bow,mode:'crossbow'})
 expect(s.blackpowderShots).toHaveLength(0)
 expect(pistolCombatBlock(s,'hero:0','33333333-3333-4333-8333-333333333333',bow,'crossbow','phase2',2)).toContain('first round')
 expect(pistolCombatBlock(s,'hero:0','33333333-3333-4333-8333-333333333333',weapon,'crossbow','phase1',1)).toContain('appropriate')
})
