import {expect,it} from 'vitest'
import {castLimitReason} from './castLimits'
import {castRecordSchema,emptyBattleLiveState,withCast,parseBattleLiveState,castsThisTurn} from '../../../domain/battle'
const cast=castRecordSchema.parse({attemptId:'a',heroId:'wizard',heroName:'Wizard',spellId:'spell',spellName:'Spell',turn:1,outcome:'cast'})
it('requires a recorded pass, forbids a third attempt and forbids Aptitude in melee',()=>{
 expect(castLimitReason([],false,false)).toBeNull()
 for(const aptitude of [undefined,'pending','injuryPending','stunned','knockedDown','declined'] as const) expect(castLimitReason([{...cast,aptitude}],true,false)).not.toBeNull()
 const passed={...cast,aptitude:'passed' as const}
 expect(castLimitReason([passed],true,false)).toBeNull()
 expect(castLimitReason([passed],true,true)).toContain('hand-to-hand')
 expect(castLimitReason([passed],false,false)).not.toBeNull()
 expect(castLimitReason([passed,{...cast,attemptId:'b'}],true,false)).toContain('two')
})
it('updates one saved attempt through its aptitude stages and frees the next turn',()=>{
 let sheet=withCast(emptyBattleLiveState(),{...cast,aptitude:'pending'})
 sheet=withCast(sheet,{...cast,aptitude:'injuryPending'})
 sheet=withCast(sheet,{...cast,aptitude:'stunned'})
 sheet=parseBattleLiveState(JSON.parse(JSON.stringify(sheet)))
 expect(sheet.casts).toHaveLength(1)
 expect(sheet.casts[0].aptitude).toBe('stunned')
 expect(castLimitReason(castsThisTurn(sheet,'wizard',1),true,false)).not.toBeNull()
 expect(castLimitReason(castsThisTurn(sheet,'wizard',2),true,false)).toBeNull()
 expect(castLimitReason(castsThisTurn(sheet,'other',1),true,false)).toBeNull()
})
