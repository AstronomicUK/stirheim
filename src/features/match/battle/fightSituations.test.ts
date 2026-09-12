import { expect, it } from 'vitest'
import { emptyBattleLiveState, parseBattleLiveState } from '../../../domain/battle'
import { savedFightSituations, setFightSituation } from './fightSituations'
it('retains phase choices across reload, expires Fear/charge but not ended Frenzy and separates opponents', () => {
  let s=emptyBattleLiveState()
  for(const field of ['charging','failedFearWhenCharged','frenzyEnded']) s=setFightSituation(s,'hero','Captain','hero:enemy','phase1',field,true,'')
  s=parseBattleLiveState(JSON.parse(JSON.stringify(s)))
  expect(savedFightSituations(s,'hero','hero:enemy','phase1')).toMatchObject({charging:true,failedFearWhenCharged:true,frenzyEnded:true})
  expect(savedFightSituations(s,'hero','hero:enemy','phase2')).toEqual({frenzyEnded:true})
  expect(savedFightSituations(s,'hero','hero:other','phase1')).toEqual({frenzyEnded:true})
  expect(savedFightSituations(s,'other','other:enemy','phase1')).toEqual({frenzyEnded:false})
  expect(savedFightSituations(emptyBattleLiveState(),'hero','hero:enemy','phase1')).toEqual({frenzyEnded:false})
})
it('requires an explained correction and preserves previous declarations', () => {
  let s=setFightSituation(emptyBattleLiveState(),'hero','Captain','key','phase1','frenzyEnded',true,'')
  expect(setFightSituation(s,'hero','Captain','key','phase1','frenzyEnded',false,'')).toBe(s)
  s=setFightSituation(s,'hero','Captain','key','phase2','frenzyEnded',false,'Wrong warrior')
  expect(s.frenzyEnded.hero).toBe(false)
  expect(s.rollAttempts).toHaveLength(2)
  expect(s.rollAttempts[1].rolls[0]).toContain('Wrong warrior')
})
it('keeps chosen weapon identities and copy keys through schema persistence', () => {
 const s=emptyBattleLiveState();s.fightWeaponChoices['band:hero:melee']={primary:'sword',offHand:'dagger'};s.fightPhysicalChoices['hero:0']='item-row:1'
 const saved=parseBattleLiveState(JSON.parse(JSON.stringify(s)))
 expect(saved.fightWeaponChoices).toEqual(s.fightWeaponChoices)
 expect(saved.fightPhysicalChoices).toEqual(s.fightPhysicalChoices)
})
