import { describe, expect, it } from 'vitest'
import { scenarioAftermath, scenarioExperienceOptions } from '../campaign/scenarioAftermath'
import { scenarioObjectives } from '../campaign/scenarioObjectives'

describe('scenario aftermath', () => {
  it('retains objective hints from special rules for all eight missed scenarios', () => {
    for (const id of ['ambush', 'the_pool', 'night_of_the_dead', 'round_up_at_the_mordheim_corral', 'forbidden_square', 'down_at_the_docks', 'the_sword_of_the_herald', 'the_watchers']) {
      const objective = scenarioObjectives(id)
      expect(Boolean(objective.wyrdstone) || objective.treasure, id).toBe(true)
    }
  })
  it('uses the published replacement awards rather than adding them to core awards', () => {
    expect(scenarioAftermath('mordheim_s_burning').defaults).toEqual({ survival: 5, leader: 5, kill: 1 })
    expect(scenarioAftermath('scourge_and_purge').defaults.leader).toBe(2)
    expect(scenarioAftermath('scourge_and_purge_archive_pestilen').defaults.leader).toBe(2)
    expect(scenarioAftermath('the_hunters_become_the_hunted').defaults.leader).toBe(2)
  })
  it('keeps the two Script versions and their missions separate', () => {
    const first = scenarioExperienceOptions('the_script_of_sigmar')
    const second = scenarioExperienceOptions('scripts_of_sigmar')
    expect(first).toHaveLength(2)
    expect(second).toHaveLength(2)
    expect(scenarioAftermath('the_script_of_sigmar').needsMission).toBe(true)
    const mission = scenarioAftermath('the_script_of_sigmar', first[0].name)
    expect(mission.defaults.leader).toBe(0)
    expect(mission.bonuses.some(a => /sounding the alarm/i.test(a.label))).toBe(true)
    expect(scenarioAftermath('scripts_of_sigmar', second[0].name).bonuses).toHaveLength(0)
  })
  it('exposes conflicting source values as an explicit choice', () => {
    expect(scenarioAftermath('forbidden_square', undefined, false).defaults.leader).toBe(1)
    expect(scenarioAftermath('forbidden_square', undefined, true).defaults.leader).toBe(2)
    expect(scenarioAftermath('bar_room_brawl', undefined, true).bonuses.find(a => /sam/i.test(a.label))?.amount).toBe(3)
  })
  it('does not invent an Experience section for a source with none', () => {
    expect(scenarioExperienceOptions('encampment_raid')).toEqual([])
    expect(scenarioExperienceOptions('romero_s_pride')).toEqual([])
    expect(scenarioExperienceOptions('the_battle_at_koleshire_keep')).toEqual([])
  })
})

it('uses Rawhide modern +1 awards and keeps historical awards out of objectives',()=>{
 const result=scenarioAftermath('rawhide')
 expect(result.defaults).toEqual({survival:1,leader:1,kill:1})
 expect(result.bonuses.map(b=>[b.label,b.amount])).toEqual([['Saving the Wyrdstone',1],['Successful Ambush',1],['Getting Away',1],['Stopping a Wagon',1]])
 expect(scenarioObjectives('rawhide').wyrdstone).not.toContain('**+20 xp**')
})
