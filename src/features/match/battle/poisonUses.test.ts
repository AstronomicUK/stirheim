import { expect, it } from 'vitest'
import { emptyBattleLiveState, parseBattleLiveState } from '../../../domain/battle'
import { weaponLossSnapshot } from '../../../domain/weaponLoss'
import type { ItemRow, BattleEventRow } from '../../../domain'
import type { Combatant } from '../fight/combatants'
import { applyPoisonToWeapon, correctPoisonApplication, poisonVialsRemaining, recordedPoisonEffects } from './poisonUses'
const band='11111111-1111-4111-8111-111111111111', hero='22222222-2222-4222-8222-222222222222'
const warrior={id:hero,name:'Captain',kind:'hero',warbandId:band,out:false,traitIds:[]} as unknown as Combatant
const sword={id:'33333333-3333-4333-8333-333333333333',warband_id:band,holder_type:'hero',holder_id:hero,item_rules_id:'sword',quantity:2,custom_name:null,notes:''} as ItemRow
const vial={...sword,id:'44444444-4444-4444-8444-444444444444',item_rules_id:'black_lotus'}
const apply=(sheet=emptyBattleLiveState(),copy=0,id='first',stock=vial,events:BattleEventRow[]=[])=>applyPoisonToWeapon(sheet,warrior,stock,[sword],events,'sword',`${sword.id}:${copy}`,id)
it('binds each vial to a distinct physical sword and persists exact stock identity',()=>{
 const once=apply(), twice=apply(once,1,'second')
 expect(apply(once)).toBe(once)
 expect(poisonVialsRemaining(twice,vial)).toBe(0)
 const saved=parseBattleLiveState(JSON.parse(JSON.stringify(twice)))
 expect(saved.poisonApplications.map(use=>use.weapon.copyIndex)).toEqual([0,1])
 expect(()=>apply(saved,0,'third')).toThrow('available vial')
 const corrected=correctPoisonApplication(saved,'first','Wrong sword selected')
 expect(poisonVialsRemaining(corrected,vial)).toBe(1)
 expect(corrected.rollAttempts.at(-1)?.rolls[0]).toContain('Earlier attack results are unchanged')
 expect(apply(corrected,0,'replacement').poisonApplications.filter(use=>!use.correction)).toHaveLength(2)
})
it('rejects double coating, broken or missing copies and foreign stock',()=>{
 expect(()=>apply(apply(),0,'second')).toThrow('already has')
 expect(()=>apply(emptyBattleLiveState(),2)).toThrow('intact physical')
 const event={reverted_at:null,payload:{brokenWeapons:[weaponLossSnapshot(sword,'sword','Sword',1,0)]}} as BattleEventRow
 expect(()=>apply(emptyBattleLiveState(),0,'first',vial,[event])).toThrow('intact physical')
 expect(()=>apply(emptyBattleLiveState(),0,'first',{...vial,warband_id:'other'})).toThrow('available vial')
 expect(()=>correctPoisonApplication(apply(),'first','')).toThrow('Explain')
})
it('permits an explicitly selected stash vial but not a blackpowder weapon',()=>{
 expect(apply(emptyBattleLiveState(),0,'first',{...vial,holder_type:'stash',holder_id:null}).poisonApplications[0].itemRowId).toBe(vial.id)
 expect(()=>applyPoisonToWeapon(emptyBattleLiveState(),warrior,vial,[{...sword,item_rules_id:'pistol'}],[],'pistol',`${sword.id}:0`,'first')).toThrow('blackpowder')
})

it('restores only active, physical-weapon effects after reloading and correction', () => {
 const saved = parseBattleLiveState(JSON.parse(JSON.stringify(apply(apply(), 1, 'second'))))
 expect(recordedPoisonEffects(saved, hero).map(effect => effect.weaponChoiceId)).toEqual([`${sword.id}:0`, `${sword.id}:1`])
 expect(recordedPoisonEffects(saved, 'another-warrior')).toEqual([])
 expect(recordedPoisonEffects(correctPoisonApplication(saved, 'first', 'Wrong sword'), hero).map(effect => effect.weaponChoiceId)).toEqual([`${sword.id}:1`])
})
