import { expect, it } from 'vitest'
import { emptyBattleLiveState, type ItemRow } from '../../../domain'
import { recordBlackpowderShot, correctBlackpowderShot, physicalGunKey } from '../../../domain/blackpowderShot'
import type { Combatant } from './combatants'
import { pistolShootingOptions } from './pistolShooting'
const band='11111111-1111-4111-8111-111111111111', id='22222222-2222-4222-8222-222222222222'
const warrior={id,warbandId:band,name:'Captain',kind:'hero',skillIds:[]} as unknown as Combatant
const row={id:'33333333-3333-4333-8333-333333333333',warband_id:band,holder_id:id,holder_type:'hero',item_rules_id:'pistol',quantity:2,custom_name:null,notes:''} as ItemRow
const options=(sheet=emptyBattleLiveState(),turn=1,model=warrior,stock=row,slot=0)=>pistolShootingOptions(sheet,model,[stock],[],'pistol',undefined,turn,slot)
function fired(sheet=emptyBattleLiveState(),model=warrior,stock=row,slot=0) {
 const selected=options(sheet,1,model,stock,slot).selected!
 return recordBlackpowderShot(sheet,{id:`shot:${slot}`,warriorId:id,weaponKey:physicalGunKey(selected.snapshot,selected.key),weaponName:'Pistol',heldWeapon:selected.snapshot,ownTurn:1,reloadTurns:1,experimental:false,at:new Date().toISOString()},'Captain')
}
it('a brace alternates loaded pistols but never grants a second shot without Pistolier',()=>{
 const sheet=fired()
 expect(options(sheet).remaining).toBe(0)
 expect(options(sheet).blocked).toContain('used its pistol shots')
 expect(options(sheet,2).selected?.snapshot.copyIndex).toBe(1)
 expect(options(sheet,2).blocked).toBeNull()
 expect(options(sheet,3).selected?.snapshot.copyIndex).toBe(0)
})
it('Pistolier permits a second loaded pistol, and corrections restore the shot allowance',()=>{
 const model={...warrior,skillIds:['pistolier']}
 const sheet=fired(undefined,model)
 expect(options(sheet,1,model).remaining).toBe(1)
 expect(options(sheet,1,model).selected?.snapshot.copyIndex).toBe(1)
 expect(options(correctBlackpowderShot(sheet,'shot:0','Wrong model'),1,model).remaining).toBe(2)
})
it('keeps group members separate and rejects silently assigning uneven stacks',()=>{
 const model={...warrior,kind:'henchman' as const,groupSize:2}
 const stock={...row,holder_type:'group' as const,quantity:4}
 const sheet=fired(undefined,model,stock)
 expect(options(sheet,1,model,stock,0).remaining).toBe(0)
 expect(options(sheet,1,model,stock,1).remaining).toBe(1)
 expect(options(sheet,1,model,stock,1).selected?.snapshot.copyIndex).toBe(2)
 expect(options(sheet,1,model,{...stock,quantity:3},1).blocked).toContain('uneven')
})
