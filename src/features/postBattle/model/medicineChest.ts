import type {ItemRow} from '../../../domain'
import {lookupHeroInjury} from '../../../rules/data/campaign/injuries'
import type {ReportDraft} from './state'
import type {HeroInjuryStep} from './injuries'
/** Physical/mental injury results. The source excludes capture, pit fights and similar events. */
const medicalCodes=new Set(['dead','multiple_injuries','leg_wound','arm_wound','madness','smashed_leg','chest_wound','blinded_in_one_eye','old_battle_wound','nervous_condition','hand_injury','deep_wound','horrible_scars'])
export function canUseMedicineChest(d66:number){try{return medicalCodes.has(lookupHeroInjury(d66).code)}catch{return false}}
export interface MedicineUse {item_id:string;quantity:number;expected_quantity:number}
export function medicineChestUses(draft:ReportDraft,items:readonly ItemRow[],steps:Record<string,readonly HeroInjuryStep[]>){
 const problems:string[]=[],counts=new Map<string,number>(),notes:string[]=[]
 for(const [heroId,flow] of Object.entries(draft.heroInjuries))for(const [index,roll] of flow.rolls.entries()){
  if(!roll.medicine)continue
  const step=steps[heroId]?.[index]
  if(!step||step.medicineOriginal!==roll.d66||!canUseMedicineChest(roll.d66)){problems.push('A Medicine Chest must replace an actual eligible Hero Serious Injury result.');continue}
  // Multiple Injuries already requires these results to be rerolled; a chest cannot reroll that reroll.
  if(index>0&&['dead','multiple_injuries','captured'].includes(lookupHeroInjury(roll.d66).code)){problems.push('Do not spend a Medicine Chest on a result that Multiple Injuries already requires you to reroll.');continue}
  const row=items.find(i=>i.id===roll.medicine!.itemId&&i.item_rules_id==='scenario_medicine_chest')
  if(!row){problems.push('The selected Medicine Chest is no longer in this warband’s equipment.');continue}
  counts.set(row.id,(counts.get(row.id)??0)+1)
  notes.push(`Medicine Chest: original D66 ${roll.d66} → replacement D66 ${roll.medicine.d66}; one chest consumed for warrior ${heroId}.`)
 }
 const uses:MedicineUse[]=[]
 for(const [id,quantity] of counts){const row=items.find(i=>i.id===id)!;if(quantity>row.quantity)problems.push('There are not enough Medicine Chests for these rerolls.');else uses.push({item_id:id,quantity,expected_quantity:row.quantity})}
 return {uses,problems,notes}
}
