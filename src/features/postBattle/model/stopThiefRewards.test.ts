import {describe,it,expect} from 'vitest'
import {stopThiefRewards,type StopThiefDraft} from './stopThiefRewards'
const warbands=[{id:'defender',name:'Defenders'},{id:'attacker',name:'Attackers'}]
const base:StopThiefDraft={defenderId:'defender',setupConfirmed:true}
const sale={item_id:'blade',from_warband_id:'attacker',quantity:1,expected:{},reason:'Most expensive portable item selected before play',sale_value:11}
describe('Stop Thief reward plan',()=>{
 it('sells the existing stolen copy at half value without awarding replacement equipment',()=>{
  const r=stopThiefRewards({...base,reviewed:true,sales:[sale]},true,'defender',warbands)
  expect(r.problems).toEqual([]);expect(r.gold).toBe(5);expect(r.transfers).toEqual([sale]);expect(r.notes.join(' ')).toContain('11 gc')
 })
 it('requires a disposition for every attacker and rejects duplicate or allied sales',()=>{
  expect(stopThiefRewards({...base,reviewed:true},true,'defender',warbands).problems.join(' ')).toContain('Attackers')
  expect(stopThiefRewards({...base,reviewed:true,sales:[sale,sale]},true,'defender',warbands).problems.length).toBeGreaterThan(0)
  expect(stopThiefRewards({...base,reviewed:true,sales:[sale],returnedAllies:['attacker']},true,'defender',warbands).problems.length).toBeGreaterThan(0)
 })
 it('returns an unchanged original item without manufacturing a copy and records winner dice',()=>{
  const r=stopThiefRewards({...base,recovered:true,recoveryNote:'Sword remained on original roster; temporary use ended.',dice:[2,5]},true,'attacker',warbands)
  expect(r.problems).toEqual([]);expect(r.gold).toBe(7);expect(r.transfers).toEqual([]);expect(r.retrievedLeaderXp).toBe(true)
 })
 it('allows allied recovery without a winning gold bonus and ignores stale sale fields on a loss',()=>{
  const r=stopThiefRewards({...base,recovered:true,recoveryNote:'Allied defender returned our sword.',dice:[6,6]},false,'attacker',warbands)
  expect(r.problems).toEqual([]);expect(r.gold).toBe(0);expect(r.retrievedLeaderXp).toBe(true)
  const loss=stopThiefRewards({...base,sales:[sale],reviewed:true},false,'defender',warbands)
  expect(loss.gold).toBe(0);expect(loss.transfers).toEqual([])
 })
 it('rejects foreign, multi-copy and sale-marked recovery transfers',()=>{
  for(const transfer of [{...sale,from_warband_id:'defender'},{...sale,from_warband_id:'defender',sale_value:undefined,quantity:2}])expect(stopThiefRewards({...base,recovered:true,recoveryNote:'Returned',dice:[1,1],recoveredTransfers:[transfer]},true,'attacker',warbands).problems.length).toBeGreaterThan(0)
 })
})
