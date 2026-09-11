import {describe,expect,it} from 'vitest'
import {makeHero,makeWarband} from './fixtures'
import {availableSkills,resolveRacialProfile} from '../advances'
import {availableExplorationBooks} from '../explorationBooks'
import {warriorFlagsSchema} from '../../../domain/json'

describe('exploration book benefits',()=>{
 it('retains the study flag through parsing and raises only racial WS, not actual WS',()=>{
  const hero=makeHero({flags:warriorFlagsSchema.parse({studiedTrainingManual:true}),skillTableIds:['shooting','combat']})
  const base=resolveRacialProfile({...hero,flags:{}},'mercenaries_reikland').value.maxima
  const studied=resolveRacialProfile(hero,'mercenaries_reikland').value.maxima
  expect(studied).toEqual({...base,WS:base.WS+1});expect(hero.stats.WS).toBe(3)
  expect(availableSkills(hero).map(t=>t.tableId)).toContain('combat')
 })
 it('offers only unused stock and no books taken from dead warriors',()=>{
  const roster=makeWarband();roster.stash=[{itemId:'training_manual',quantity:0}]
  roster.heroes[0].equipment=[{itemId:'alchemists_notebook',quantity:1}]
  expect(availableExplorationBooks(roster)).toEqual(['alchemists_notebook'])
  roster.heroes[0].status='dead';expect(availableExplorationBooks(roster)).toEqual([])
 })
})
