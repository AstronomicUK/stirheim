import {describe,expect,it} from 'vitest'
import {rawhideReport} from './rawhideReport'
const cargo={declared:true as const,revealed:true,locked:true,warband_id:'merchant',wagon:2,gold:100,wyrdstone:3,sale_value:160,rounding:'down' as const,valuation_note:'Agreed value',settled_report_id:null}
describe('Rawhide report decisions',()=>{
 it('keeps cargo out of ordinary treasure to avoid applying it twice',()=>{
  const r=rawhideReport({outcome:'escaped'},cargo,'merchant',true)
  expect(r.problems).toEqual([]);expect(r.gold).toBe(0);expect(r.shards).toBe(0)
  expect(r.settlement).toEqual({outcome:'escaped',gold_delta:108,wyrdstone_delta:-3})
  expect(r.notes.join(' ')).toContain('208 gc')
 })
 it('blocks an unended battle, hidden cargo and missing declarations',()=>{
  expect(rawhideReport({outcome:'escaped'},cargo,'merchant',false).problems[0]).toContain('End the battle')
  for(const c of [undefined,{declared:false as const},{...cargo,revealed:false}])expect(rawhideReport({outcome:'captured'},c,'attacker',true).problems.length).toBeGreaterThan(0)
 })
 it('requires a named explanation when another report settles cargo',()=>{
  expect(rawhideReport({outcome:'other'},cargo,'merchant',true).problems.length).toBeGreaterThan(0)
  const r=rawhideReport({outcome:'other',note:'Ambushers captured wagon 2 and file the cargo transfer.'},cargo,'merchant',true)
  expect(r.problems).toEqual([]);expect(r.settlement).toBeUndefined()
 })
 it('rejects another report’s existing claim but permits the same report to be amended',()=>{
  const settled={...cargo,settled_report_id:'report'}
  expect(rawhideReport({outcome:'escaped'},settled,'merchant',true).problems[0]).toContain('already settled')
  expect(rawhideReport({outcome:'escaped'},settled,'merchant',true,'report').problems).toEqual([])
 })
})

it('retains a reason-recorded legacy override without inventing a pre-battle cargo',()=>{
 const draft={outcome:'manual' as const,note:'Older battle: both players agreed treasury corrections and will record them separately.'}
 const result=rawhideReport(draft,{declared:false},'merchant',true)
 expect(result.problems).toEqual([]);expect(result.settlement).toBeUndefined();expect(result.gold).toBe(0)
 expect(rawhideReport({...draft,note:''},{declared:false},'merchant',true).problems.length).toBeGreaterThan(0)
 expect(rawhideReport(draft,cargo,'merchant',true).problems[0]).toContain('actual declared cargo')
})
