import { describe, expect, it } from 'vitest'
import { huntersRewards } from './huntersRewards'
import { makeHero, makeHenchmanGroup, makeWarband } from '../../../rules/resolve/__tests__/fixtures'
import { findWarbandTemplate } from '../../../rules/data/warbandTemplates'
import { deriveReport, type ReportContext } from './derive'
import { emptyDraft, setPlantCasualty } from './state'
const base={startingArtefacts:3,heldArtefacts:2,alive:2,liveCaptured:2,liveKept:2,deadRecovered:0,plantDice:[2,5]}
describe('Hunters Become the Hunted rewards',()=>{
 it('awards actually held counters and separate plant dice after a loss, but no animal winnings',()=>{
  const r=huntersRewards(base,false,2);expect(r).toMatchObject({gold:7,shards:2,items:[],problems:[]})
 })
 it('keeps actual mounts, or records the table’s explicit two-animal sale ruling',()=>{
  expect(huntersRewards(base,true).items).toEqual([{item_rules_id:'cold_one',custom_name:null,quantity:2}])
  expect(huntersRewards({...base,liveKept:0},true).problems.join()).toContain('Agree')
  expect(huntersRewards({...base,liveKept:0,saleBasis:'each',saleReason:'Each animal'},true).gold).toBe(167)
  expect(huntersRewards({...base,liveKept:0,saleBasis:'lot',saleReason:'One combined payment'},true).gold).toBe(87)
 })
 it('sells one live animal and recovered dead animals without duplicating retained mounts',()=>{
  expect(huntersRewards({...base,alive:1,liveCaptured:1,liveKept:0,deadRecovered:1},true)).toMatchObject({gold:127,items:[],problems:[]})
 })
 it('rejects counters or animal claims exceeding what actually existed',()=>{
  expect(huntersRewards({...base,heldArtefacts:4,alive:1,liveCaptured:2,deadRecovered:2},true).problems).toHaveLength(3)
  expect(huntersRewards({...base,plantDice:Array(13).fill(1)},true,2).problems.join()).toContain('maximum')
  expect(huntersRewards({...base,plantDice:[null]},true).problems.join()).toContain('loot D6')
 })
})
function context():ReportContext {
 return {roster:makeWarband({heroes:[makeHero({id:'captain',unitTemplateId:'mercenaries_reikland_captain',xp:20,levelUps:8})],henchmenGroups:[makeHenchmanGroup({id:'group',size:2})]}),template:findWarbandTemplate('mercenaries_reikland'),items:[],matchId:'test',myRating:100,opponentRating:100,scenarioId:'the_hunters_become_the_hunted'}
}
describe('Hunters casualty and experience integration',()=>{
 it('automatically awards the surviving winner’s Cold One experience and triggers advances',()=>{
  const d=emptyDraft();d.result='won';d.scenarioRewards={hunters:base};const r=deriveReport(d,context())
  expect(r.xp.lines.find(l=>l.subjectId==='captain')).toMatchObject({amount:5,xpAfter:25,advancesEarned:1})
  expect(r.xp.lines.find(l=>l.subjectId==='group')).toMatchObject({amount:3,xpAfter:3,advancesEarned:1})
  expect(r.problems.advances.length).toBeGreaterThan(0)
 })
 it('uses the plant D6 for a Hero, recovering on 2 and losing the warrior on 1',()=>{
  const d=emptyDraft();d.result='lost';d.heroesOut=['captain'];d.plantCasualties={captain:true};d.scenarioInjuryDice={captain:2}
  expect(deriveReport(d,context()).injuries.heroes[0].resolution.outcome).toBe('recovered')
  d.scenarioInjuryDice.captain=1;expect(deriveReport(d,context()).injuries.heroes[0].resolution.outcome).toBe('dead')
 })
 it('separates plant and ordinary henchman casualties in the same group',()=>{
  const d=emptyDraft();d.result='lost';d.groupsOut={group:2};d.groupInjuries={group:[2,2]};d.plantCasualties={'group:0':true}
  const r=deriveReport(d,context());expect(r.injuries.groups[0].resolution).toMatchObject({dead:1,complete:true,group:{size:1}})
 })
 it('clears only the selected model’s old roll when changing its injury source',()=>{
  const d=emptyDraft();d.groupInjuries={group:[1,6],other:[5]};d.scenarioInjuryDice={captain:2}
  const r=setPlantCasualty(d,'group:0',true);expect(r.groupInjuries).toEqual({group:[null,6],other:[5]});expect(r.scenarioInjuryDice).toEqual({captain:2})
 })
})
