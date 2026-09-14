import {expect,it} from 'vitest'
import {battleLiveStateSchema,combatPhaseKey,emptyBattleLiveState} from '../battle'
import {soundWarHorn,warHornBonus,correctWarHorn} from '../warHorn'
import type {ItemRow} from '../rows'
import {findWarbandTemplate} from '../../rules/data/warbandTemplates'
import type {RosterWarband} from '../../rules/types/roster'
import {combatantsOf} from '../../features/match/fight/combatants'
import {leadershipOptions} from '../../features/match/battle/routCheckRules'
const row={id:'horn',warband_id:'w',item_rules_id:'war_horn',quantity:1,holder_type:'stash',holder_id:null} as ItemRow
const phase=combatPhaseKey(1,{round:1,active_index:0,turn_order:['w','enemy']})
const input={id:'use',warbandId:'w',name:'War Horn',copyIndex:0,phaseKey:phase,confirmedTiming:true}
it('lasts only until the next player turn, preserves inventory and cannot be reused next round',()=>{
  const used=battleLiveStateSchema.parse(soundWarHorn(emptyBattleLiveState(),row,input))
  expect(warHornBonus(used,phase)).toBe(1)
  expect(warHornBonus(used,combatPhaseKey(1,{round:1,active_index:1,turn_order:['w','enemy']}))).toBe(0)
  expect(warHornBonus(used,combatPhaseKey(2,{round:2,active_index:0,turn_order:['w','enemy']}))).toBe(0)
  expect(used.warbandConsumables).toEqual([])
  expect(used.itemsUsed).toEqual({})
  expect(soundWarHorn(used,row,input)).toBe(used)
  expect(()=>soundWarHorn(used,row,{...input,id:'again',phaseKey:'2:w'})).toThrow(/already/)
  const corrected=correctWarHorn(used,input.id,'Sounded by mistake')
  expect(warHornBonus(corrected,phase)).toBe(0)
  expect(soundWarHorn(corrected,row,{...input,id:'fixed'}).warHornUses).toHaveLength(2)
})
it('requires available owned copies and timing; a second horn does not silently stack',()=>{
  for(const bad of [{...row,quantity:0},{...row,warband_id:'x'},{...row,item_rules_id:'sword'}])expect(()=>soundWarHorn(emptyBattleLiveState(),bad,input)).toThrow(/unavailable/)
  expect(()=>soundWarHorn(emptyBattleLiveState(),row,{...input,confirmedTiming:false})).toThrow(/beginning/)
  const used=soundWarHorn(emptyBattleLiveState(),row,input)
  expect(()=>soundWarHorn(used,{...row,id:'second'},{...input,id:'second-use'})).toThrow(/already active/)
  expect(soundWarHorn(used,{...row,id:'second'},{...input,id:'second-use',phaseKey:'2:w'}).warHornUses).toHaveLength(2)
})
it('the printed liturgy may be chanted on a later turn but not twice on the same turn',()=>{
  const book={...row,item_rules_id:'liturgicus_infecticus'}
  const used=soundWarHorn(emptyBattleLiveState(),book,input)
  expect(()=>soundWarHorn(used,book,{...input,id:'second'})).toThrow(/already active/)
  expect(soundWarHorn(used,book,{...input,id:'second',phaseKey:'2:w'}).warHornUses).toHaveLength(2)
})
it('feeds the same temporary Leadership into combatants and the Rout choices, capped at ten',()=>{
  const stats={M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:9}
  const roster:RosterWarband={id:'w',name:'Watch',warbandTemplateId:'mercenaries_reikland',gold:0,wyrdstone:0,veteranPool:null,stash:[],heroes:[{id:'cap',name:'Captain',unitTemplateId:'mercenaries_reikland_captain',stats,xp:20,levelUps:0,skillTableIds:[],skillIds:[],spellIds:[],injuries:[],flags:{},status:'active',equipment:[]}],hiredSwords:[],henchmenGroups:[{id:'group',name:'Warriors',unitTemplateId:'mercenaries_reikland_warriors',size:2,stats:{...stats,Ld:6},xp:0,levelUps:0,statIncreases:{},equipment:[]}]}
  const template=findWarbandTemplate(roster.warbandTemplateId)
  const used=soundWarHorn(emptyBattleLiveState(),row,input)
  expect(combatantsOf(roster,template,roster.name,used,undefined,phase).map(w=>w.stats.Ld)).toEqual([10,7])
  expect(leadershipOptions(roster,template,used,undefined,undefined,phase).map(w=>w.ld)).toEqual([10,7])
  expect(leadershipOptions(roster,template,used,undefined,undefined,'1:enemy').map(w=>w.ld)).toEqual([9,6])
  expect(roster.heroes[0].stats.Ld).toBe(9)
})
