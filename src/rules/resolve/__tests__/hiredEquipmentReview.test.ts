import { expect, it } from 'vitest'
import { missingHiredEquipment, restoreHiredEquipment } from '../hiredEquipmentReview'
it('counts copies across old aliases and multiple stacks',()=>{
 const held=[{itemId:null,customName:'Sword',quantity:1},{itemId:'sword',quantity:1}]
 expect(missingHiredEquipment(held,[{itemId:'sword',quantity:3}])).toEqual([{itemId:'sword',quantity:1}])
})
it('restores only selected missing copies and leaves unique or changed existing kit untouched',()=>{
 const held=[{itemId:'sword',quantity:1,notes:'Changed by player'},{itemId:null,customName:'Unique trophy',quantity:1}]
 const expected=[{itemId:'sword',quantity:2},{itemId:'light_armour',quantity:1}]
 const result=restoreHiredEquipment(held,expected,[0]);expect(result).toEqual([...held,{itemId:'sword',quantity:1}]);expect(missingHiredEquipment(result,expected)).toEqual([{itemId:'light_armour',quantity:1}])
 expect(()=>restoreHiredEquipment(held,expected,[0,0])).toThrow();expect(()=>restoreHiredEquipment(held,expected,[2])).toThrow()
})
it('does not mistake unrelated bespoke equipment for a missing published item',()=>{
 expect(missingHiredEquipment([{itemId:null,customName:'Fish-slapping staff',quantity:1}],[{itemId:null,customName:'Fish-slapping staff',quantity:1}])).toEqual([])
})
