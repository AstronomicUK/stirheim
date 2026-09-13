import {handlerAftermath} from './handlerAftermath'
import type {ReportApplied} from '../../../domain'
import {describe,it,expect} from 'vitest'
import {makeHero,makeWarband,makeHenchmanGroup} from '../../../rules/resolve/__tests__/fixtures'
import {findWarbandTemplate} from '../../../rules/data/warbandTemplates'
import {deriveReport,type ReportContext} from './derive'
import {emptyDraft} from './state'
import {fightingGroups} from '../../match/battle/sheet'
import type {ItemRow} from '../../../domain'
describe('handler-dependent animals',()=>{
 it.each([['dark_elves_cold_one_beasthound','dark_elves_beastmaster'],['norse_wolf','norse_wulfen'],['kislevites_trained_bear','kislevites_bear_tamer']])('keeps %s at camp when its handler is absent', (unit,handler)=>{
  const hero=makeHero({unitTemplateId:handler}),roster=makeWarband({heroes:[hero],henchmenGroups:[makeHenchmanGroup({unitTemplateId:unit})]})
  expect(fightingGroups(roster)).toHaveLength(1)
  expect(fightingGroups({...roster,heroes:[{...hero,flags:{missNextGames:1}}]})).toHaveLength(0)
  expect(fightingGroups({...roster,heroes:[]})).toHaveLength(0)
 })
 it('removes Cold One Hounds when the Beastmaster dies in the filed report',()=>{
  const hero=makeHero({id:'b',unitTemplateId:'dark_elves_beastmaster'})
  const ctx:ReportContext={roster:makeWarband({heroes:[hero],henchmenGroups:[makeHenchmanGroup({id:'h',unitTemplateId:'dark_elves_cold_one_beasthound'})]}),template:findWarbandTemplate('dark_elves'),items:[],matchId:'m',myRating:100,opponentRating:100}
  const draft=emptyDraft();draft.result='lost';draft.heroesOut=['b'];draft.heroInjuries.b={rolls:[{d66:11,subRoll:null}],countRoll:null}
  const result=deriveReport(draft,ctx)
  expect(result.handlerAftermath.notes.join(' ')).toContain('escaped')
  // Other incomplete report steps must not hide the deterministic aftermath preview.
  expect(result.handlerAftermath.problems).toEqual([])
 })
 it('requires a D6 per claimed pet and spends only failed pets',()=>{
  const hero=makeHero({id:'o'}),ctx:ReportContext={roster:makeWarband({warbandTemplateId:'maneaters',heroes:[hero]}),template:findWarbandTemplate('maneaters'),items:[{id:'pet',holder_type:'hero',holder_id:'o',item_rules_id:'luck_gnoblar',quantity:2}] as ItemRow[],matchId:'m',myRating:100,opponentRating:100}
  const draft=emptyDraft();draft.result='lost';draft.heroesOut=['o'];draft.heroInjuries.o={rolls:[{d66:41,subRoll:null}],countRoll:null}
  expect(deriveReport(draft,ctx).handlerAftermath.problems).toHaveLength(1)
  draft.claimedGnoblarDice={pet:[2,3]}
  const result=deriveReport(draft,ctx)
  expect(result.handlerAftermath.problems).toEqual([])
  expect(result.handlerAftermath.notes.join(' ')).toContain('1 lost; 1 retained')
  draft.heroesOut=[]
  expect(deriveReport(draft,ctx).handlerAftermath.rows).toEqual([])
 })
})

it('emits persistent departure and pet equipment patches, retaining unrelated advances',()=>{
 const hero=makeHero({id:'owner',unitTemplateId:'dark_elves_beastmaster'}),group=makeHenchmanGroup({id:'hounds',unitTemplateId:'dark_elves_cold_one_beasthound'})
 const ctx:ReportContext={roster:makeWarband({heroes:[hero],henchmenGroups:[group]}),template:findWarbandTemplate('dark_elves'),items:[{id:'harness',holder_type:'group',holder_id:group.id,quantity:1}] as ItemRow[],matchId:'m',myRating:100,opponentRating:100}
 const d=emptyDraft();d.heroesOut=[hero.id];d.heroInjuries[hero.id]={rolls:[{d66:11,subRoll:null}],countRoll:null}
 const applied={groups:[],pending_advances:[{subject_id:group.id},{subject_id:'unrelated'}],remove_item_ids:[],item_patches:[]} as unknown as ReportApplied
 handlerAftermath(ctx,d,deriveReport(d,ctx).injuries,applied)
 expect(applied.groups).toEqual([{id:group.id,patch:{size:0}}])
 expect(applied.remove_item_ids).toEqual(['harness'])
 expect(applied.pending_advances.map(a=>a.subject_id)).toEqual(['unrelated'])
 const pets={...ctx,roster:{...ctx.roster,warbandTemplateId:'maneaters'},items:[{id:'pet',holder_type:'hero',holder_id:hero.id,item_rules_id:'luck_gnoblar',quantity:1}] as ItemRow[]}
 d.heroInjuries[hero.id]={rolls:[{d66:41,subRoll:null}],countRoll:null};d.claimedGnoblarDice={pet:[1]}
 handlerAftermath(pets,d,deriveReport(d,pets).injuries,applied)
 expect(applied.item_patches).toContainEqual({id:'pet',quantity:0})
})
