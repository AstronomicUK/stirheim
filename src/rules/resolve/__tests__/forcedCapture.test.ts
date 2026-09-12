import {expect,it} from 'vitest'
import {subjugatorCaptures} from '../forcedCapture'
const input={outOfAction:true,attackerIsHero:true,skills:['skaven_of_clan_moulder_special_skills_subjugator_of_mankind'],equipment:['thingcatcher'],targetLarge:false}
it('requires the Hero skill, carried Thingcatcher and actual OOA, excluding Large targets',()=>{
 expect(subjugatorCaptures(input)).toBe(true)
 expect(subjugatorCaptures({...input,attackerIsHero:false})).toBe(false)
 expect(subjugatorCaptures({...input,outOfAction:false})).toBe(false)
 expect(subjugatorCaptures({...input,skills:[]})).toBe(false)
 expect(subjugatorCaptures({...input,equipment:[]})).toBe(false)
 expect(subjugatorCaptures({...input,targetLarge:true})).toBe(false)
})
