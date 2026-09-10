import type { RosterHero } from '../types/roster'
export interface BattleTreasureAward { subjectId: string; name: string; rule: string; shards: number }
/** Source: Halflings' Cutpurse and Survivors of Strigos' Light Fingers. Pass only heroes who fought. */
export function battleTreasureAwards(heroes: RosterHero[], outOfAction: ReadonlySet<string>, enemiesOut: Record<string, number | null>): BattleTreasureAward[] {
  const awards: BattleTreasureAward[] = []
  for (const hero of heroes) {
    if (hero.unitTemplateId === 'halflings_thief_hero' && !outOfAction.has(hero.id)) {
      awards.push({subjectId:hero.id,name:hero.name,rule:'Cutpurse',shards:1})
    }
    if (hero.skillIds.includes('survivors_of_strigos_strigany_skills_light_fingers') && (enemiesOut[hero.id] ?? 0) > 0) {
      awards.push({subjectId:hero.id,name:hero.name,rule:'Light Fingers (once this game)',shards:1})
    }
  }
  return awards
}
