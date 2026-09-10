import {expect,it} from 'vitest'
import {encampmentRewards, type EncampmentDraft} from './encampmentRewards'
const opponents=[{id:'defender',name:'Camp defenders'}]
const base:EncampmentDraft={role:'attacker',captured:true,defenderId:'defender',camp:'Sigmarhaven hut',treatment:'destroy',reviewed:true,transfers:[{item_id:'sword',from_warband_id:'defender',quantity:2,expected:{holder_type:'stash',quantity:2},reason:'Captured stash'}]}
it('claims full existing equipment and records camp destruction',()=>{
 const r=encampmentRewards(base,true,opponents)
 expect(r.problems).toEqual([])
 expect(r.transfers).toEqual(base.transfers)
 expect(r.notes.join(' ')).toContain('Sigmarhaven hut')
 expect(r.notes.join(' ')).toContain('Defender must roll for a new camp')
})
it('requires victory, a real defender, a reviewed stash and occupation eligibility',()=>{
 expect(encampmentRewards({...base,treatment:'occupy',eligible:false,reviewed:false,defenderId:'foreign'},false,opponents).problems.length).toBeGreaterThanOrEqual(4)
 expect(encampmentRewards({...base,treatment:'occupy',eligible:true},true,opponents).problems).toEqual([])
 expect(encampmentRewards({...base,transfers:[]},true,opponents).problems).toEqual([])
})
it('does not transfer carried, partial or repeated equipment',()=>{
 const t=base.transfers![0]
 for(const transfers of [[{...t,quantity:1}],[{...t,expected:{...t.expected,holder_type:'hero'}}],[t,t]])expect(encampmentRewards({...base,transfers},true,opponents).problems.length).toBeGreaterThan(0)
})
it('gives defending and unsuccessful reports no stash transfer',()=>{
 expect(encampmentRewards({...base,role:'defender'},false,opponents).transfers).toEqual([])
 expect(encampmentRewards({...base,captured:false},true,opponents).transfers).toEqual([])
 expect(encampmentRewards({...base,role:'defender'},true,opponents).problems.length).toBeGreaterThan(0)
})
