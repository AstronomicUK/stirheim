import {describe,it,expect} from 'vitest'
import {emptyBattleLiveState,battleLiveStateSchema} from '../battle'
import {beginItemLeadership,rollItemLeadership,confirmItemLeadership,chooseItemLeadershipReroll,correctItemLeadership} from '../itemLeadership'
const input={id:'item-test',warriorId:'hero',modelIndex:0,name:'Hero',test:'All Alone',leadership:7,benefit:{key:'banner',label:'Banner',kind:'rerollFailed' as const,condition:'Within 12 inches of bearer'}}
describe('Leadership item test history',()=>{
 it('keeps both app rolls and changed faces across reload, with one reroll and one first-test record',()=>{
  let s=beginItemLeadership(emptyBattleLiveState(),input)
  s=rollItemLeadership(s,input.id,[6,6]);s=battleLiveStateSchema.parse(JSON.parse(JSON.stringify(s)))
  expect(rollItemLeadership(s,input.id,[1,1])).toBe(s)
  s=confirmItemLeadership(s,input.id,[6,5]);expect(s.itemLeadershipTests[0].stage).toBe('choice')
  s=chooseItemLeadershipReroll(s,input.id,true);s=rollItemLeadership(s,input.id,[1,1]);s=confirmItemLeadership(s,input.id,[1,2])
  expect(s.itemLeadershipTests[0]).toMatchObject({stage:'done',passed:true,original:[6,6],dice:[6,5],secondOriginal:[1,1],secondDice:[1,2]})
  expect(chooseItemLeadershipReroll(s,input.id,true)).toBe(s)
  expect(s.leadershipTests).toHaveLength(1)
  expect(s.rollAttempts[0].rolls.join(' ')).toContain('player changed to 6 + 5')
  expect(s.rollAttempts[0].rolls.join(' ')).toContain('player changed to 1 + 2')
 })
 it('does not offer a Banner reroll after success, while Sashimono can reroll a success and must keep a worse result',()=>{
  const passed=confirmItemLeadership(beginItemLeadership(emptyBattleLiveState(),input),input.id,[1,1])
  expect(passed.itemLeadershipTests[0].stage).toBe('done')
  let s=confirmItemLeadership(beginItemLeadership(emptyBattleLiveState(),{...input,benefit:{...input.benefit,kind:'rerollAny',label:'Sashimono'}}),input.id,[1,1])
  expect(s.itemLeadershipTests[0].stage).toBe('choice');s=chooseItemLeadershipReroll(s,input.id,true);s=confirmItemLeadership(s,input.id,[6,6])
  expect(s.itemLeadershipTests[0].passed).toBe(false)
 })
 it('records immunity without rolling or consuming the first Leadership test',()=>{
  const s=beginItemLeadership(emptyBattleLiveState(),{...input,benefit:{...input.benefit,kind:'immune',label:'Jolly Roger'}})
  expect(s.itemLeadershipTests[0]).toMatchObject({passed:true,stage:'done'})
  expect(s.leadershipTests).toHaveLength(0)
  expect(rollItemLeadership(s,input.id,[6,6])).toBe(s)
 })
 it('blocks a second unfinished test for the same model, and preserves corrections',()=>{
  const s=beginItemLeadership(emptyBattleLiveState(),input)
  expect(()=>beginItemLeadership(s,{...input,id:'another'})).toThrow('pending')
  expect(beginItemLeadership(s,{...input,id:'other-model',modelIndex:1}).itemLeadershipTests).toHaveLength(2)
  const corrected=correctItemLeadership(s,input.id,'Wrong model selected')
  expect(corrected.itemLeadershipTests[0].correction).toBe('Wrong model selected')
  expect(corrected.rollAttempts[0].status).toBe('complete')
 })
})
