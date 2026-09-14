import {expect,it} from 'vitest'
import {animosityApplies,animosityFriend} from './animosityModels'
import {combatantsOf} from '../fight/combatants'
import {makeWarband,makeHenchmanGroup,makeHero,makeHiredSword} from '../../../rules/resolve/__tests__/fixtures'
import {findWarbandTemplate} from '../../../rules/data/warbandTemplates'
const roster=makeWarband({warbandTemplateId:'black_orcs',heroes:[makeHero({unitTemplateId:'black_orcs_orc_boy'})],henchmenGroups:['black_orcs_orc_boy','black_orcs_orc_shoota','black_orcs_orc_nutta','black_orcs_troll'].map(id=>makeHenchmanGroup({id,unitTemplateId:id})),hiredSwords:[makeHiredSword({id:'warlock',hiredSwordId:'warlock'}),makeHiredSword({id:'overseer',hiredSwordId:'black_orc_overseer'})]})
const models=combatantsOf(roster,findWarbandTemplate(roster.warbandTemplateId),roster.name,undefined)
it('tests ordinary Boyz/Shootaz, not promoted Heroes, Nuttaz or Trolls',()=>{
 expect(models.filter(m=>animosityApplies(m,roster)).map(m=>m.id)).toEqual(['black_orcs_orc_boy','black_orcs_orc_shoota'])
})
it('allows Orc henchmen and hired swords but excludes Troll groups and Heroes',()=>{
 expect(models.filter(m=>animosityFriend(m,roster)).map(m=>m.id)).toEqual(['warlock','overseer','black_orcs_orc_boy','black_orcs_orc_shoota','black_orcs_orc_nutta'])
})
