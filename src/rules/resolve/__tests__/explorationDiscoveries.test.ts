import { describe, it, expect } from 'vitest'
import { explorationDiscoveries } from '../explorationDiscoveries'
import { explorationAids } from '../explorationAids'
import { makeWarband, makeHero } from './fixtures'
import { deriveExploration } from '../../../features/postBattle/model/exploration'
import { emptyExploration } from '../../../features/postBattle/model/state'
describe('recorded exploration discoveries', () => {
  it('grants one permanent reroll regardless of repeated discoveries and later battles', () => {
    const discoveries=explorationDiscoveries([{id:'a',exploration:{locationId:'entrance_to_the_catacombs'}},{id:'b',exploration:{locationId:'entrance_to_the_catacombs'}},{id:'c',exploration:null}])
    const aids=explorationAids(makeWarband({explorationDiscoveries:discoveries}),{houseRules:{rabbitsFootBattleOnly:false},heroesOutOfAction:[],preBattle:{}})
    expect(aids.filter(a=>a.key==='discovery:catacombs')).toHaveLength(1)
    expect(aids.find(a=>a.key==='discovery:catacombs')?.uses).toBe(1)
  })
  it('Straggler waits for the next actual exploration, then expires; next-battle benefits do not wait', () => {
    const straggler={id:'a',exploration:{locationId:'straggler',benefits:['straggler']}}
    expect(explorationDiscoveries([straggler,{id:'b',exploration:null}]).straggler).toBe(true)
    expect(explorationDiscoveries([straggler,{id:'b',exploration:{locationId:null}}]).straggler).toBe(false)
    const tunnels={id:'a',exploration:{locationId:'catacombs'}}
    expect(explorationDiscoveries([tunnels]).tunnels).toBe(true)
    expect(explorationDiscoveries([tunnels,{id:'b',exploration:null}]).tunnels).toBe(false)
  })
  it('rolls an extra Straggler die but keeps the original number, even below six', () => {
    const heroes=['a','b','c'].map(id=>makeHero({id}))
    const roster=makeWarband({heroes,explorationDiscoveries:{catacombs:false,straggler:true,tunnels:false}})
    const result=deriveExploration({...emptyExploration(),rolls:[1,2,3,4],kept:[0,1,2]},roster,{won:false,eligibleHeroes:heroes})
    expect(result.allowed).toMatchObject({count:4,keep:3})
    expect(result.record?.total).toBe(6)
  })
  it('only interrogating warbands record the Straggler future bonus', () => {
    const heroes=['a','b'].map(id=>makeHero({id}))
    const report=(warbandTemplateId:string)=>deriveExploration({...emptyExploration(),rolls:[4,4]},makeWarband({heroes,warbandTemplateId}),{won:false,eligibleHeroes:heroes}).record
    expect(report('mercenaries_reikland')?.benefits).toEqual(['straggler'])
    expect(report('skaven_of_clan_eshin')?.benefits).toBeUndefined()
    expect(report('cult_of_the_possessed')?.benefits).toBeUndefined()
  })
})

import { hireHiredSword } from '../recruitment'
it('Returning a Favour waives gold and records one use across departures', () => {
  const roster=makeWarband({gold:0,explorationDiscoveries:{catacombs:false,straggler:false,tunnels:false,freeHireReportId:'report'}})
  const hired=hireHiredSword(roster,'ogre_bodyguard','ogre',{returningFavourReportId:'report'}).value
  expect(hired.gold).toBe(0)
  expect(hired.hiredSwords[0].flags.returningFavourReportId).toBe('report')
  expect(()=>hireHiredSword({...hired,hiredSwords:hired.hiredSwords.map(h=>({...h,status:'left'}))},'warlock','mage',{returningFavourReportId:'report'})).toThrow(/not available/)
  expect(()=>hireHiredSword(roster,'aenur_the_sword_of_twilight','elf',{returningFavourReportId:'report'})).toThrow()
})

it('preserves a Harpy Straggler through skipped exploration and consumes it at the next exploration', () => {
  const reward = { id: 'harpy', exploration: null, applied: { scenario_benefits: ['harpy_straggler'] } }
  expect(explorationDiscoveries([reward, { id: 'skip', exploration: null }]).straggler).toBe(true)
  expect(explorationDiscoveries([reward, { id: 'used', exploration: { locationId: null } }]).straggler).toBe(false)
})
