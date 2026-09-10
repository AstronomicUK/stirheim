import { describe,it,expect } from 'vitest'
import { pettyThief } from './pettyThief'
import { emptyDraft } from './state'
import { makeHero } from '../../../rules/resolve/__tests__/fixtures'
import type { ReportContext } from './derive'
const squire=makeHero({id:'squire',unitTemplateId:'mazzalupo_squire'})
const participants={heroes:[squire],groups:[],hiredSwords:[],satOut:[],leaderId:squire.id}
const ctx={opponents:[{id:'b',name:'B'},{id:'a',name:'A'}]} as ReportContext
describe('Petty Thief',()=>{
 it('requires a participating Squire not taken out of action',()=>{
  expect(pettyThief(emptyDraft(),ctx,participants).problems).toHaveLength(1)
  expect(pettyThief({...emptyDraft(),heroesOut:['squire']},ctx,participants).squire).toBeUndefined()
  expect(pettyThief(emptyDraft(),ctx,{...participants,heroes:[]}).problems).toEqual([])
 })
 it('logs failure and requires a random valid opponent for success',()=>{
  expect(pettyThief({...emptyDraft(),pettyThiefRoll:4},ctx,participants).transfer).toBeUndefined()
  expect(pettyThief({...emptyDraft(),pettyThiefRoll:5},ctx,participants).problems).toHaveLength(1)
  expect(pettyThief({...emptyDraft(),pettyThiefRoll:5,pettyThiefSelection:1},ctx,participants).transfer?.target_id).toBe('a')
  expect(pettyThief({...emptyDraft(),pettyThiefRoll:5,pettyThiefSelection:3},ctx,participants).problems).toHaveLength(1)
 })
})
