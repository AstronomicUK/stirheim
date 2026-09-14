import {it,expect} from 'vitest'
import {makeWarband,makeHero,makeHenchmanGroup,makeHiredSword} from '../../../rules/resolve/__tests__/fixtures'
import {emptyBattleLiveState} from '../../../domain/battle'
import {leadershipItemBenefits,nagarytheCaptured} from './leadershipItems'
import {combatantsOf} from '../fight/combatants'
import {findWarbandTemplate} from '../../../rules/data/warbandTemplates'
const bearer=makeHero({id:'bearer',equipment:[{itemId:'standard_of_nagarythe',quantity:1}]})
const shadow=makeWarband({warbandTemplateId:'shadow_warriors',heroes:[bearer,makeHero({id:'other'})],hiredSwords:[makeHiredSword()]})
it('requires range for Shadow Warrior rerolls, excludes hired swords, and captures the standard on its bearer going out',()=>{
 const sheet=emptyBattleLiveState()
 expect(leadershipItemBenefits(shadow,sheet,'other','rout')[0]).toMatchObject({range:12,kind:'rerollFailed'})
 expect(leadershipItemBenefits(shadow,sheet,'hired-1','rout')).toEqual([])
 sheet.tallies=[{id:'bearer',kind:'hero',outOfAction:1,enemiesOutOfAction:0,woundsLost:0,note:''}]
 expect(nagarytheCaptured(shadow,sheet)).toBe(true)
 expect(leadershipItemBenefits(shadow,sheet,'other','rout')).toEqual([])
 const models=combatantsOf(shadow,findWarbandTemplate('shadow_warriors'),shadow.name,sheet)
 expect(models.find(m=>m.id==='other')?.traitIds).toContain('hatred')
 expect(models.find(m=>m.id==='hired-1')?.traitIds).not.toContain('hatred')
})
it('Jolly Roger protects actual Pirates but never Swabbies or hired swords',()=>{
 const pirates=makeWarband({warbandTemplateId:'pirates',heroes:[makeHero({id:'captain',equipment:[{itemId:'jolly_roger',quantity:1}]})],henchmenGroups:[makeHenchmanGroup({id:'swabbies',unitTemplateId:'pirates_swabbie'})],hiredSwords:[makeHiredSword()]})
 expect(leadershipItemBenefits(pirates,emptyBattleLiveState(),'captain','allAlone')[0]?.kind).toBe('immune')
 for(const id of ['swabbies','hired-1'])expect(leadershipItemBenefits(pirates,emptyBattleLiveState(),id,'allAlone')).toEqual([])
})
it('Sashimono works only for its bearer and never Rout; empty stock grants nothing',()=>{
 const roster=makeWarband({heroes:[makeHero({id:'bearer',equipment:[{itemId:'sashimono',quantity:1}]}),makeHero({id:'other',equipment:[{itemId:'banner',quantity:0}]})]})
 expect(leadershipItemBenefits(roster,emptyBattleLiveState(),'bearer','fear')[0]?.kind).toBe('rerollAny')
 expect(leadershipItemBenefits(roster,emptyBattleLiveState(),'bearer','rout')).toEqual([])
 expect(leadershipItemBenefits(roster,emptyBattleLiveState(),'other','allAlone')).toEqual([])
})
