import { expect, it } from 'vitest'
import type { RosterHero } from '../../types/roster'
import { battleTreasureAwards } from '../battleTreasure'
const hero = (id:string, unitTemplateId:string, skillIds:string[] = []): RosterHero => ({id,name:id,unitTemplateId,skillIds,stats:{M:4,WS:3,BS:3,S:3,T:3,W:1,I:3,A:1,Ld:7},xp:0,levelUps:0,skillTableIds:[],spellIds:[],equipment:[],injuries:[],flags:{},status:'active'})
it('Cutpurse rewards the participating Halfling hero, not every thief (#108)', () => {
 const thief=hero('thief','halflings_thief_hero')
 expect(battleTreasureAwards([thief],new Set(),{})).toEqual([expect.objectContaining({rule:'Cutpurse',shards:1})])
 expect(battleTreasureAwards([thief],new Set(['thief']),{})).toEqual([])
 expect(battleTreasureAwards([hero('hire','hired_sword:halfling_thief')],new Set(),{})).toEqual([])
})
it('Light Fingers requires the selected skill and a kill, with at most one shard per hero (#109)', () => {
 const thief=hero('thief','survivor',['survivors_of_strigos_strigany_skills_light_fingers'])
 expect(battleTreasureAwards([thief],new Set(),{})).toEqual([])
 expect(battleTreasureAwards([thief],new Set(),{thief:5})).toHaveLength(1)
 expect(battleTreasureAwards([thief],new Set(),{thief:5})[0].shards).toBe(1)
 expect(battleTreasureAwards([hero('ordinary','survivor')],new Set(),{ordinary:5})).toEqual([])
})
