import { expect,it } from 'vitest'
import { ROCK_COMMON_ITEMS, rockLoot } from './rockLoot'
const context={sisters:false,evil:true,leaderName:'Magister',leaderInitiative:3}
it('records actual failed searches and grants one water for each 3 or 4',()=>{
 const r=rockLoot([1,2,3,4].map(die=>({searcher:'Brother',die})),context)
 expect(r.problems).toEqual([])
 expect(r.items).toEqual([{item_rules_id:'blessed_water',custom_name:null,quantity:1},{item_rules_id:'blessed_water',custom_name:null,quantity:1}])
 expect(r.notes).toHaveLength(4)
 expect(r.notes[0]).toContain('nothing of value')
})
it('restricts a five to one core-rulebook common item',()=>{
 expect(ROCK_COMMON_ITEMS.some(i=>i.id==='sword')).toBe(true)
 expect(ROCK_COMMON_ITEMS.some(i=>i.id==='imperial_tactician_plate_armour')).toBe(false)
 expect(ROCK_COMMON_ITEMS.some(i=>i.id==='gromril_armour')).toBe(false)
 const r=rockLoot([{searcher:'Brother',die:5,commonItemId:'sword'}],context)
 expect(r.items).toEqual([{item_rules_id:'sword',custom_name:null,quantity:1}])
 expect(rockLoot([{searcher:'Brother',die:5,commonItemId:'gromril_armour'}],context).problems).toHaveLength(1)
 expect(rockLoot([{searcher:'Brother',die:5}],context).problems).toHaveLength(1)
})
it('changes the relic only after a successful eligible leader Initiative test',()=>{
 const roll={searcher:'Mutant',die:6,desecrate:true,initiativeDie:3}
 const r=rockLoot([roll],context)
 expect(r.problems).toEqual([])
 expect(r.items[0]).toMatchObject({item_rules_id:'holy_unholy_relic',custom_name:'Unholy Relic'})
 expect(r.notes.join(' ')).toContain('Magister Initiative 3, D6 3')
 expect(rockLoot([{...roll,initiativeDie:4}],context).items[0].custom_name).toBe('Holy Relic')
 expect(rockLoot([{...roll,initiativeDie:6}],{...context,leaderInitiative:10}).items[0].custom_name).toBe('Holy Relic')
 expect(rockLoot([roll],{...context,evil:false}).problems).toHaveLength(1)
 expect(rockLoot([{...roll,initiativeDie:null}],context).problems).toHaveLength(1)
})
it('does not offer looting to Sisters or accept incomplete recorded searches',()=>{
 expect(rockLoot([{searcher:'Sister',die:6}],{...context,sisters:true})).toMatchObject({items:[],problems:['Sisters of Sigmar cannot loot rooms in Assault on the Rock.']})
 expect(rockLoot([{searcher:'',die:null}],context).problems).toHaveLength(2)
 expect(rockLoot([{searcher:'Brother',die:7}],context).items).toEqual([])
})
it('ignores stale dependent selections when the recorded search result changes',()=>{
 const r=rockLoot([{searcher:'Brother',die:2,commonItemId:'sword',desecrate:true,initiativeDie:1}],context)
 expect(r.items).toEqual([])
 expect(r.problems).toEqual([])
})
