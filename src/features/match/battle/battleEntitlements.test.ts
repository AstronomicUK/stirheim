import {describe,it,expect} from 'vitest'
import {emptyBattleLiveState,parseBattleLiveState} from '../../../domain/battle'
import {makeWarband,makeHero} from '../../../rules/resolve/__tests__/fixtures'
import {spendNetterNet,NETTER} from './netter'
import {withWarmonger} from './warmonger'

describe('battle-only entitlements',()=>{
 it('saves three Netter uses, prevents a fourth, and logs a correction without adding tradable equipment',()=>{
  const hero=makeHero({skillIds:[NETTER]});const before=JSON.stringify(hero)
  let state=emptyBattleLiveState()
  for(let i=0;i<3;i++)state=spendNetterNet(state,hero)
  expect(spendNetterNet(state,hero)).toBe(state)
  state=parseBattleLiveState(JSON.parse(JSON.stringify(state)))
  expect(state.netterNetsUsed?.[hero.id]).toBe(3)
  state=spendNetterNet(state,hero,'Accidental tap')
  expect(state.netterNetsUsed?.[hero.id]).toBe(2)
  expect(state.rollAttempts.at(-1)?.rolls.join(' ')).toContain('Accidental tap')
  expect(JSON.stringify(hero)).toBe(before)
  expect(emptyBattleLiveState().netterNetsUsed?.[hero.id]??0).toBe(0)
 })
 it('restores temporary Peasants from a saved battle, once, without recruiting them permanently',()=>{
  const roster=makeWarband();const saved=parseBattleLiveState({...emptyBattleLiveState(),warmonger:{groupId:'temporary',heroId:'emissary',dice:[2,3],leadership:8,die:3,count:4}})
  const battle=withWarmonger(roster,saved)
  expect(battle.henchmenGroups.at(-1)).toMatchObject({id:'temporary',size:4,unitTemplateId:'battle_monks_raging_peasants',equipment:[]})
  expect(withWarmonger(battle,saved)).toBe(battle)
  expect(roster.henchmenGroups.some(g=>g.id==='temporary')).toBe(false)
  expect(withWarmonger(roster,emptyBattleLiveState())).toBe(roster)
 })
})
