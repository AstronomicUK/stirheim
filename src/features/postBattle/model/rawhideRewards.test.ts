import {describe,expect,it} from 'vitest'
import {rawhideSettlement,type RevealedRawhideCargo} from './rawhideRewards'
const cargo:RevealedRawhideCargo={warband_id:'merchant',wagon:2,gold:100,wyrdstone:3,sale_value:161,rounding:'down',valuation_note:'100 coins and three shards valued at 61 gc by agreement.'}
describe('Rawhide actual cargo settlement',()=>{
 it('replaces the original cargo with 130 percent sale proceeds, without duplicating the coins',()=>{
  expect(rawhideSettlement(cargo,'escaped')).toMatchObject({proceeds:209,merchant:{gold:109,shards:-3},captor:{gold:0,shards:0}})
  expect(rawhideSettlement({...cargo,rounding:'up'},'escaped').proceeds).toBe(210)
 })
 it('conserves gold and shards when the opponent captures cargo',()=>{
  const result=rawhideSettlement(cargo,'captured')
  expect(result.merchant.gold+result.captor.gold).toBe(0)
  expect(result.merchant.shards+result.captor.shards).toBe(0)
  expect(result.captor).toEqual({gold:100,shards:3})
 })
 it('gives no cargo reward for empty wagons and rejects a contradictory result',()=>{
  const empty={...cargo,wagon:null,gold:0,wyrdstone:0,sale_value:0}
  expect(rawhideSettlement(empty,'empty')).toMatchObject({merchant:{gold:0,shards:-0},captor:{gold:0,shards:0}})
  expect(()=>rawhideSettlement(empty,'captured')).toThrow('pre-battle')
  expect(()=>rawhideSettlement(cargo,'empty')).toThrow('pre-battle')
 })
 it('requires a complete valuation and cannot quietly invent gold from a coins-only cargo',()=>{
  expect(()=>rawhideSettlement({...cargo,wyrdstone:0},'escaped')).toThrow('valuation')
  expect(()=>rawhideSettlement({...cargo,valuation_note:''},'escaped')).toThrow('valuation')
  expect(()=>rawhideSettlement({...cargo,gold:-1},'escaped')).toThrow('amounts')
 })
})
