import {expect,it} from 'vitest'
import {emptyDraft} from './state'
import {recordMapDie,mapRollNotes} from './pirateMapChoice'
it('preserves app rolls and identifies a later player change instead of claiming it was the original roll',()=>{
 let draft=recordMapDie(emptyDraft(),'Destination',2,'app')
 draft=recordMapDie(draft,'Destination',5,'tabletop')
 draft=recordMapDie(draft,'Gold',4,'tabletop')
 const saved=JSON.parse(JSON.stringify(draft))
 expect(mapRollNotes(saved)).toEqual(['Destination: app rolled 2.','Destination: player changed 2 (app roll) to 5.','Gold: player entered 4.'])
 expect(recordMapDie(draft,'Gold',null,'tabletop')).toBe(draft)
})
